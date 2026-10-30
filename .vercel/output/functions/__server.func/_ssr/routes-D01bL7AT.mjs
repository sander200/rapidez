import { o as __toESM } from "../_runtime.mjs";
import { a as signOut, t as authClient } from "./client-C-uqF2eZ.mjs";
import { a as hasGateSessionMarker } from "./server-BEno-str.mjs";
import { t as AuthPanel } from "./AuthPanel-BUmXkAQs.mjs";
import { C as formatUsd, D as premiereAt, E as placeLabel, O as safetyPinOf, S as formatKm, T as haversine, _ as bearing, a as COMMISSION, b as etaMin, c as MODELS, d as PLACES, f as RATE_VES, g as analyzeRouteHazards, h as YOU_BASE, i as CENTRAL_CARORA_CONFIG, k as vesOf, l as NPCS, m as SERVICE_TIERS, n as CARORA_HOTSPOTS, o as GPS_ECO_INTERVAL_MS, r as CARORA_ROAD_NODES, s as HOME, t as BANKS, u as OFFER_MS, v as buildFeedbackWhatsappUrl, w as formatVes, x as fareFor, y as buildRoute } from "./data-U0wv_Rf1.mjs";
import { C as tripHistory, S as topUp, T as voteRoadReport, a as opsBoard, b as submitRoadReport, c as requestTrip, d as reviewList, f as sendChat, g as setTripStatus, h as setFleetState, i as listChat, l as resendDeveloperPush, m as setDriverHotspot, n as declineTrip, o as raisePanic, p as setCityWeather, r as fleetList, s as rateTrip, t as acceptTrip, u as reviewDecide, v as submitMvpFeedback, w as verifyTripPayment, x as syncLive, y as submitProfile } from "./live-api-CPGHAm0g.mjs";
import { J as require_react, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { C as Copy, D as Bookmark, E as Camera, O as Bike, S as FileText, T as Check, _ as MapPin, a as ThumbsUp, b as KeyRound, c as Sparkles, d as Plus, f as Phone, g as MessageSquare, h as Minus, i as TriangleAlert, l as ShieldCheck, m as Navigation, n as Wallet, o as Sun, p as Package, r as Upload, s as Star, t as X, u as Share2, v as LocateFixed, w as CloudRain, x as History, y as Layers } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as create } from "../_libs/zustand.mjs";
// node_modules/.nitro/vite/services/ssr/assets/routes-D01bL7AT.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Current user + loading state. Same behavior in live preview and when deployed:
*   - Auth enabled -> the real signed-in user; `user` is `null` while
*                            the session resolves (`isPending: true`) and when
*                            signed out (`isPending: false`). Session comes from
*                            Better Auth `useSession()` → `/api/auth/get-session`
*                            (cookie when deployed; bearer in live preview).
*   - Auth disabled (`VITE_AUTH_ENABLED=false`) -> `DEV_USER`, never pending.
*
* Protect a route by waiting out `isPending` before acting on `user` —
* redirecting on `user: null` alone bounces signed-in visitors to sign-in on
* every hard reload:
*
*   import { RedirectToSignIn } from "@/lib/auth/gates";
*   const { user, isPending } = useCurrentUserState();
*   if (isPending) return null;              // still resolving — don't redirect yet
*   if (!user) return <RedirectToSignIn />;  // definitely signed out
*
* `authEnabled` is a module-level constant fixed at load, so the guarded hook
* call keeps a stable hook order across every render of a given component.
*/
function useCurrentUserState() {
	const { data, isPending } = authClient.useSession();
	const user = data?.user;
	return {
		user: user ? {
			id: user.id,
			displayName: user.name ?? null,
			primaryEmail: user.email ?? null,
			profileImageUrl: user.image ?? null,
			isDevFallback: false
		} : null,
		isPending
	};
}
/**
* Convenience view of `useCurrentUserState().user` for display (e.g.
* `user?.displayName ?? "Guest"`). NOTE: `null` means *loading OR signed out* —
* for redirects/guards use `useCurrentUserState()` and check `isPending`.
*/
function useCurrentUser() {
	return useCurrentUserState().user;
}
var subscribeToNothing = () => () => {};
var noGateSessionOnServer = () => false;
/**
* Minimal signed-in identity chip + sign-out. Restyle freely (see the
* `design-ui` skill). Sign-out is only shown when auth is enabled (the
* disabled-auth dev user has nothing to sign out of) and the session is not
* gate-materialized — behind the gate the next request signs the viewer
* straight back in, so a sign-out control there is a broken loop.
*/
function UserButton() {
	const user = useCurrentUser();
	const [signingOut, setSigningOut] = (0, import_react.useState)(false);
	const gateSession = (0, import_react.useSyncExternalStore)(subscribeToNothing, hasGateSessionMarker, noGateSessionOnServer);
	if (!user) return null;
	const label = user.displayName ?? user.primaryEmail ?? "Account";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2",
		children: [
			user.profileImageUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: user.profileImageUrl,
				alt: "",
				className: "h-8 w-8 rounded-full object-cover"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid h-8 w-8 place-items-center rounded-full bg-black/10 text-sm font-medium dark:bg-white/20",
				children: label.charAt(0).toUpperCase()
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm font-medium",
				children: label
			}),
			!gateSession && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				disabled: signingOut,
				onClick: () => {
					setSigningOut(true);
					signOut().catch(() => setSigningOut(false));
				},
				className: "cursor-pointer text-sm underline-offset-4 opacity-70 hover:underline disabled:cursor-wait disabled:no-underline",
				children: signingOut ? "Signing out…" : "Sign out"
			})
		]
	});
}
var tripDefaults = {
	phase: "pickup",
	pickup: null,
	dest: null,
	destRef: "",
	destLabel: "",
	method: "PAGO_MOVIL",
	fareUsd: 0,
	distanceM: 0,
	assigned: null,
	driverPos: null,
	route: [],
	routeIndex: 0,
	proximity: false,
	payStatus: "PENDING",
	payRef: "",
	searchStartedAt: 0,
	offerOpen: false,
	offerDeadline: null,
	verifyAt: null,
	arrivedAt: null,
	rating: 0,
	formError: ""
};
function youProfile(payout) {
	return {
		...YOU_BASE,
		bank: payout.bank,
		bankName: payout.bankName,
		phone: payout.phone,
		cedula: payout.cedula
	};
}
var useRapidez = create((set, get) => ({
	role: "passenger",
	online: false,
	actingId: "you",
	offerCooldown: 0,
	useLive: false,
	profileStatus: null,
	pushText: "",
	fleet: [],
	showRoadLayer: true,
	rainActive: false,
	roadReports: [],
	center: HOME,
	pickupRef: "",
	pickupLabel: "",
	payout: {
		bank: YOU_BASE.bank,
		bankName: YOU_BASE.bankName,
		phone: YOU_BASE.phone,
		cedula: YOU_BASE.cedula
	},
	mapSeq: 0,
	mapCmd: null,
	ping: 0,
	...tripDefaults,
	setRole: (role) => set({ role }),
	setOnline: (online) => set({ online }),
	setCenter: (center) => set({
		center,
		formError: ""
	}),
	setPickupRef: (pickupRef) => set({
		pickupRef,
		formError: ""
	}),
	setDestRef: (destRef) => set({ destRef }),
	setMethod: (method) => set({ method }),
	setPayout: (patch) => set((s) => {
		const payout = {
			...s.payout,
			...patch
		};
		if (patch.bank) {
			const bank = BANKS.find((b) => b.code === patch.bank);
			if (bank) payout.bankName = bank.name;
		}
		return { payout };
	}),
	setActing: (actingId) => set({
		actingId,
		formError: ""
	}),
	setRating: (rating) => set({ rating }),
	confirmPickup: () => {
		const s = get();
		const ref = s.pickupRef.trim();
		if (ref.length < 4) {
			set({ formError: "Escribe un punto de referencia de Carora." });
			return;
		}
		set({
			pickup: s.center,
			pickupLabel: ref,
			phase: "destination",
			formError: ""
		});
	},
	confirmDest: () => {
		const s = get();
		if (!s.pickup) return;
		const distanceM = haversine(s.pickup, s.center);
		if (distanceM < 120) {
			set({ formError: "El destino está demasiado cerca. Mueve el mapa." });
			return;
		}
		set({
			dest: s.center,
			destLabel: s.destRef.trim(),
			distanceM,
			fareUsd: fareFor(distanceM),
			phase: "confirm",
			formError: ""
		});
	},
	requestTrip: () => {
		set({
			phase: "searching",
			searchStartedAt: Date.now(),
			offerOpen: false,
			offerDeadline: null,
			offerCooldown: 0,
			assigned: null,
			proximity: false,
			payStatus: "PENDING",
			payRef: "",
			verifyAt: null,
			formError: ""
		});
	},
	openOffer: (deadline) => set({
		offerOpen: true,
		offerDeadline: deadline
	}),
	assignDriver: (driver, pickup) => {
		const route = buildRoute(driver.pos, pickup);
		set((s) => ({
			assigned: driver,
			driverPos: driver.pos,
			route,
			routeIndex: 0,
			phase: "enroute",
			offerOpen: false,
			offerDeadline: null,
			proximity: false,
			ping: s.ping + 1,
			arrivedAt: null
		}));
	},
	acceptOffer: () => {
		const s = get();
		if (!s.pickup || !s.online) return;
		const driver = actingDriver(s.actingId, s.payout);
		if (!driver.registered) return;
		get().assignDriver(driver, s.pickup);
	},
	rejectOffer: () => {
		set({
			offerOpen: false,
			offerDeadline: null,
			offerCooldown: Date.now() + 8e3
		});
	},
	markArrived: () => set({
		phase: "arrived",
		proximity: true,
		arrivedAt: Date.now()
	}),
	startRide: () => {
		const s = get();
		if (!s.pickup || !s.dest) return;
		const from = s.driverPos ?? s.pickup;
		set((prev) => ({
			phase: "riding",
			route: buildRoute(from, s.dest),
			routeIndex: 0,
			proximity: false,
			ping: prev.ping + 1,
			arrivedAt: null
		}));
	},
	finishRide: () => set({ phase: "pay" }),
	advance: () => {
		const s = get();
		if (s.phase !== "enroute" && s.phase !== "riding" || s.route.length < 2) return;
		const next = Math.min(s.routeIndex + 1, s.route.length - 1);
		const pos = s.route[next];
		const target = s.phase === "enroute" ? s.pickup : s.dest;
		if (!target) return;
		const dist = haversine(pos, target);
		const done = next >= s.route.length - 1 || dist <= 48;
		if (s.phase === "enroute" && done) {
			set({
				routeIndex: next,
				driverPos: s.pickup,
				proximity: true,
				phase: "arrived",
				arrivedAt: Date.now(),
				ping: s.ping + 1
			});
			return;
		}
		if (s.phase === "riding" && done) {
			set({
				routeIndex: next,
				driverPos: s.dest,
				phase: "pay",
				ping: s.ping + 1
			});
			return;
		}
		set({
			routeIndex: next,
			driverPos: pos,
			proximity: s.phase === "enroute" && dist <= 100 ? true : s.proximity,
			ping: s.ping + 1
		});
	},
	autoStartIfWaiting: (now) => {
		const s = get();
		if (s.phase !== "arrived" || !s.arrivedAt) return;
		if (s.assigned?.id === "you") return;
		if (now - s.arrivedAt > 2800) get().startRide();
	},
	submitPayRef: (ref) => {
		const clean = ref.replace(/\D/g, "").slice(0, 6);
		if (clean.length < 4) return;
		set({
			payRef: clean,
			payStatus: "VERIFYING",
			verifyAt: null
		});
	},
	confirmCash: (by) => {
		const s = get();
		if (s.method === "PAGO_MOVIL") return;
		if (by === "driver" || s.assigned?.id !== "you") {
			set({
				payStatus: "PAID",
				phase: "done",
				verifyAt: null
			});
			return;
		}
		set({
			payStatus: "VERIFYING",
			verifyAt: null
		});
	},
	validatePay: () => set({
		payStatus: "PAID",
		phase: "done",
		verifyAt: null
	}),
	autoValidateIfWaiting: (now) => {
		const s = get();
		if (s.phase !== "pay" || s.payStatus !== "VERIFYING") return;
		if (s.assigned?.id === "you") return;
		if (!s.verifyAt) {
			set({ verifyAt: now + 1800 });
			return;
		}
		if (now >= s.verifyAt) set({
			payStatus: "PAID",
			phase: "done",
			verifyAt: null
		});
	},
	back: () => set((s) => {
		if (s.phase === "destination") return {
			phase: "pickup",
			formError: ""
		};
		if (s.phase === "confirm") return {
			phase: "destination",
			formError: ""
		};
		return {};
	}),
	cancelTrip: () => set({
		...tripDefaults,
		ping: get().ping + 1
	}),
	resetTrip: () => set({
		...tripDefaults,
		pickupRef: "",
		ping: get().ping + 1
	}),
	focusPlace: (place) => set((s) => ({
		mapSeq: s.mapSeq + 1,
		mapCmd: {
			seq: s.mapSeq + 1,
			type: "fly",
			lat: place.lat,
			lng: place.lng
		}
	})),
	zoomBy: (dir) => set((s) => ({
		mapSeq: s.mapSeq + 1,
		mapCmd: {
			seq: s.mapSeq + 1,
			type: dir > 0 ? "zoom-in" : "zoom-out"
		}
	}))
}));
function actingDriver(actingId, payout) {
	if (actingId === "you") return youProfile(payout);
	return NPCS.find((driver) => driver.id === actingId) ?? youProfile(payout);
}
var MOTO_HTML = `<div class="moto-pin"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6.2" cy="16.5" r="2.4"/><circle cx="17.8" cy="16.5" r="2.4"/><path d="M6.2 16.5h2.2l1.8-4.6h4.6l1.7 2.8h1.3"/><path d="M10.2 11.9 8.4 8.2H6.4"/></svg></div>`;
function token(name, fallback) {
	if (typeof document === "undefined") return fallback;
	return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}
function MapCanvas() {
	const hostRef = (0, import_react.useRef)(null);
	const mapRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (!hostRef.current) return;
		let dead = false;
		let unsub = () => {};
		let resize = null;
		(async () => {
			const mod = await import("../_libs/leaflet.mjs").then((n) => /* @__PURE__ */ __toESM(n.t()));
			const L = typeof mod.map === "function" ? mod : mod.default ?? mod;
			if (dead || !hostRef.current || mapRef.current) return;
			const map = L.map(hostRef.current, {
				zoomControl: false,
				attributionControl: true,
				scrollWheelZoom: true
			});
			mapRef.current = map;
			L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
				maxZoom: 19,
				attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a>"
			}).addTo(map);
			const ink = token("--color-ink", "#1a1c14");
			const brand = token("--color-brand", "#e6a100");
			const signal = token("--color-signal", "#c4392c");
			const paper = token("--color-paper", "#f4efe4");
			const roadLayer = L.layerGroup().addTo(map);
			const dots = L.layerGroup().addTo(map);
			let lineA = null;
			let lineB = null;
			let pickupMark = null;
			let destMark = null;
			let driver = null;
			let anim = 0;
			let lastCmd = 0;
			let lastRoadHash = "";
			const icon = L.divIcon({
				className: "moto-icon",
				html: MOTO_HTML,
				iconSize: [44, 44],
				iconAnchor: [22, 22]
			});
			const pinLatLng = () => {
				const pin = document.querySelector(".center-pin");
				const rect = map.getContainer().getBoundingClientRect();
				if (!pin) {
					const c = map.getCenter();
					return {
						lat: c.lat,
						lng: c.lng
					};
				}
				const pr = pin.getBoundingClientRect();
				const ll = map.containerPointToLatLng([pr.left + pr.width / 2 - rect.left, pr.bottom - rect.top]);
				return {
					lat: ll.lat,
					lng: ll.lng
				};
			};
			const publishPin = () => {
				const { phase, setCenter } = useRapidez.getState();
				if (phase === "pickup" || phase === "destination") setCenter(pinLatLng());
			};
			const viewFor = (lat, lng, zoom) => {
				const pin = document.querySelector(".center-pin");
				const size = map.getSize();
				const target = map.project([lat, lng], zoom);
				if (!pin || !size.y) return L.latLng(lat, lng);
				const pr = pin.getBoundingClientRect();
				const mr = map.getContainer().getBoundingClientRect();
				const offset = pr.bottom - mr.top - size.y / 2;
				return map.unproject(target.subtract([0, offset]), zoom);
			};
			const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
			const moveDriver = (lat, lng, heading) => {
				if (!driver) driver = L.marker([lat, lng], {
					icon,
					interactive: false,
					zIndexOffset: 600
				}).addTo(map);
				const el = driver.getElement()?.querySelector(".moto-pin");
				if (el && heading != null) el.style.setProperty("--rot", `${heading - 90}deg`);
				if (reduced) {
					driver.setLatLng([lat, lng]);
					return;
				}
				const from = driver.getLatLng();
				const start = performance.now();
				cancelAnimationFrame(anim);
				const frame = (t) => {
					const k = Math.min(1, (t - start) / 320);
					driver?.setLatLng([from.lat + (lat - from.lat) * k, from.lng + (lng - from.lng) * k]);
					if (k < 1) anim = requestAnimationFrame(frame);
				};
				anim = requestAnimationFrame(frame);
				if (!map.getBounds().pad(-.15).contains([lat, lng])) map.panTo([lat, lng], {
					animate: true,
					duration: .4
				});
			};
			const drawRoute = (pts) => {
				const latlngs = pts.map((p) => [p.lat, p.lng]);
				if (!latlngs.length) {
					lineA?.remove();
					lineB?.remove();
					lineA = null;
					lineB = null;
					return;
				}
				if (!lineA || !lineB) {
					lineA = L.polyline(latlngs, {
						color: ink,
						weight: 7,
						opacity: .88
					}).addTo(map);
					lineB = L.polyline(latlngs, {
						color: brand,
						weight: 3,
						opacity: 1
					}).addTo(map);
				} else {
					lineA.setLatLngs(latlngs);
					lineB.setLatLngs(latlngs);
				}
			};
			const syncRoadNodes = (show, rainActive, reports) => {
				const nextHash = `${show}:${rainActive}:${reports.map((r) => `${r.id}:${r.upvotes}`).join(",")}`;
				if (nextHash === lastRoadHash) return;
				lastRoadHash = nextHash;
				roadLayer.clearLayers();
				if (!show) return;
				for (const node of CARORA_ROAD_NODES) if (node.kind === "rain_critical") L.circle([node.lat, node.lng], {
					radius: node.radiusM,
					color: rainActive ? signal : brand,
					weight: rainActive ? 2.5 : 1.5,
					dashArray: rainActive ? void 0 : "5 5",
					fillColor: rainActive ? signal : brand,
					fillOpacity: rainActive ? .24 : .08
				}).addTo(roadLayer).bindTooltip(`${rainActive ? "ÁREA CRÍTICA EN LLUVIA: " : "Zona de Quebrada/Drenaje: "}${node.name} — ${node.detail} (+${node.rainDelayMin} min con lluvia)`, { direction: "top" });
				else if (node.kind === "speed_bump") L.circleMarker([node.lat, node.lng], {
					radius: 5.5,
					color: ink,
					weight: 2,
					fillColor: brand,
					fillOpacity: .95
				}).addTo(roadLayer).bindTooltip(`Lombada / Reductor: ${node.name} — ${node.detail}`, { direction: "top" });
				else L.circleMarker([node.lat, node.lng], {
					radius: 5.5,
					color: paper,
					weight: 2,
					fillColor: ink,
					fillOpacity: .9
				}).addTo(roadLayer).bindTooltip(`Tránsito en Carora: ${node.name} — ${node.detail}`, { direction: "top" });
				for (const hs of CARORA_HOTSPOTS) L.circle([hs.lat, hs.lng], {
					radius: 135,
					color: ink,
					weight: 1.5,
					dashArray: "3 4",
					fillColor: brand,
					fillOpacity: .14
				}).addTo(roadLayer).bindTooltip(`HOTSPOT OFICIAL (${hs.shortName}): ${hs.name} — ${hs.detail} (Meta: ${hs.targetMotos} motos)`, { direction: "top" });
				for (const rep of reports) {
					const isDanger = rep.kind === "lluvia_anegado" || rep.kind === "trafico_cierre";
					L.circleMarker([rep.lat, rep.lng], {
						radius: 7.5,
						color: ink,
						weight: 2,
						fillColor: isDanger ? signal : brand,
						fillOpacity: 1
					}).addTo(roadLayer).bindTooltip(`Reporte en vivo (${rep.sector}): ${rep.label} · por ${rep.authorName} (${rep.when}) · ${rep.upvotes} conf.`, { direction: "top" });
				}
			};
			const sync = () => {
				const s = useRapidez.getState();
				syncRoadNodes(s.showRoadLayer, s.rainActive, s.roadReports);
				const selecting = s.phase === "pickup" || s.phase === "destination";
				const showFleet = selecting || s.phase === "confirm" || s.phase === "searching";
				dots.clearLayers();
				if (showFleet) for (const d of s.fleet) {
					if (s.assigned && d.id === s.assigned.id) continue;
					L.circleMarker([d.lat, d.lng], {
						radius: d.elite ? 8 : 6,
						color: ink,
						weight: 2,
						fillColor: d.elite ? brand : paper,
						fillOpacity: 1
					}).addTo(dots).bindTooltip(`${d.name} · Catastrado${d.elite ? " · Élite" : ""}`, { direction: "top" });
				}
				if (s.pickup && !selecting && s.pickup) {
					if (!pickupMark) pickupMark = L.circleMarker([s.pickup.lat, s.pickup.lng], {
						radius: 7,
						color: paper,
						weight: 2,
						fillColor: signal,
						fillOpacity: 1
					}).addTo(map);
					else pickupMark.setLatLng([s.pickup.lat, s.pickup.lng]);
				} else if (s.phase === "destination" && s.pickup) {
					if (!pickupMark) pickupMark = L.circleMarker([s.pickup.lat, s.pickup.lng], {
						radius: 7,
						color: paper,
						weight: 2,
						fillColor: signal,
						fillOpacity: 1
					}).addTo(map);
					else pickupMark.setLatLng([s.pickup.lat, s.pickup.lng]);
				} else {
					pickupMark?.remove();
					pickupMark = null;
				}
				const quoting = s.phase === "pickup" && s.route.length > 1;
				if (s.dest && (quoting || s.phase === "confirm" || s.phase === "riding" || s.phase === "pay" || s.phase === "done" || s.phase === "enroute" || s.phase === "arrived" || s.phase === "searching")) {
					if (!destMark) destMark = L.circleMarker([s.dest.lat, s.dest.lng], {
						radius: 7,
						color: brand,
						weight: 2,
						fillColor: ink,
						fillOpacity: 1
					}).addTo(map);
					else destMark.setLatLng([s.dest.lat, s.dest.lng]);
				} else {
					destMark?.remove();
					destMark = null;
				}
				if (s.driverPos && (s.phase === "enroute" || s.phase === "arrived" || s.phase === "riding" || s.phase === "pay")) {
					const prev = s.route[Math.max(0, s.routeIndex - 1)];
					const heading = prev ? bearing(prev, s.driverPos) : null;
					moveDriver(s.driverPos.lat, s.driverPos.lng, heading);
				} else if (driver) {
					driver.remove();
					driver = null;
				}
				if (s.phase === "enroute" || s.phase === "riding" || s.phase === "pickup" && s.route.length > 1) drawRoute(s.route);
				else drawRoute([]);
				if (s.mapCmd && s.mapCmd.seq !== lastCmd) {
					lastCmd = s.mapCmd.seq;
					if (s.mapCmd.type === "fly" && s.mapCmd.lat != null && s.mapCmd.lng != null) {
						const zoom = 16;
						const center = viewFor(s.mapCmd.lat, s.mapCmd.lng, zoom);
						map.flyTo(center, zoom, { duration: reduced ? 0 : .65 });
					} else if (s.mapCmd.type === "zoom-in" || s.mapCmd.type === "zoom-out") {
						const pin = document.querySelector(".center-pin");
						const mr = map.getContainer().getBoundingClientRect();
						const next = map.getZoom() + (s.mapCmd.type === "zoom-in" ? 1 : -1);
						if (pin) {
							const pr = pin.getBoundingClientRect();
							map.setZoomAround([pr.left + pr.width / 2 - mr.left, pr.bottom - mr.top], next);
						} else map.setZoom(next);
					}
				}
			};
			map.on("moveend", publishPin);
			map.invalidateSize();
			map.setView([HOME.lat, HOME.lng], 16);
			const shifted = viewFor(HOME.lat, HOME.lng, 16);
			map.setView(shifted, 16, { animate: false });
			publishPin();
			sync();
			unsub = useRapidez.subscribe(() => sync());
			const sheet = document.querySelector("[data-sheet]");
			if (sheet) {
				resize = new ResizeObserver(() => {
					map.invalidateSize({ pan: false });
					publishPin();
				});
				resize.observe(sheet);
			}
		})();
		return () => {
			dead = true;
			unsub();
			resize?.disconnect();
			mapRef.current?.remove();
			mapRef.current = null;
		};
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: hostRef,
		className: "absolute inset-0 z-0"
	});
}
var ctx = null;
function unlockAudio() {
	if (typeof window === "undefined") return;
	const AC = window.AudioContext || window.webkitAudioContext;
	if (!AC) return;
	if (!ctx) ctx = new AC();
	if (ctx.state === "suspended") ctx.resume();
}
function beepOffer() {
	if (!ctx) return;
	const now = ctx.currentTime;
	[
		880,
		660,
		880
	].forEach((freq, i) => {
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = "square";
		osc.frequency.value = freq;
		gain.gain.setValueAtTime(1e-4, now);
		gain.gain.exponentialRampToValueAtTime(.045, now + i * .16 + .01);
		gain.gain.exponentialRampToValueAtTime(1e-4, now + i * .16 + .14);
		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.start(now + i * .16);
		osc.stop(now + i * .16 + .16);
	});
}
function deviceId() {
	const key = "rapidez-device";
	let id = localStorage.getItem(key);
	if (!id) {
		id = crypto.randomUUID();
		localStorage.setItem(key, id);
	}
	return id;
}
function messageOf(err) {
	return err instanceof Error ? err.message : "No se pudo completar.";
}
function prettyPhone(phone) {
	const digits = phone.replace(/\D/g, "");
	if (digits.length === 11) return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
	return phone;
}
async function copyText(label, text) {
	try {
		await navigator.clipboard.writeText(text);
		toast.success(`${label} copiado al portapapeles`);
	} catch {
		toast.error("No se pudo copiar");
	}
}
async function pingOffer(place) {
	useRapidez.setState({ pushText: place });
	if (typeof Notification === "undefined") return;
	try {
		if ((Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission) !== "granted") return;
		new Notification("Rapidez Carora", {
			body: `Carrera cerca: ${place}`,
			tag: "rapidez-offer"
		});
	} catch {}
}
async function sendBrowserPush(title, body, tag = "rapidez-dev-push") {
	if (typeof Notification === "undefined") return;
	try {
		if ((Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission) === "granted") new Notification(title, {
			body,
			tag
		});
	} catch {}
}
async function shrink(file) {
	const bitmap = await createImageBitmap(file);
	const scale = Math.min(1, 720 / Math.max(bitmap.width, bitmap.height));
	const canvas = document.createElement("canvas");
	canvas.width = Math.max(1, Math.round(bitmap.width * scale));
	canvas.height = Math.max(1, Math.round(bitmap.height * scale));
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("No se pudo leer la foto.");
	ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
	return canvas.toDataURL("image/jpeg", .68);
}
var DEFAULT_WEATHER = {
	tempC: 32,
	isRaining: false,
	rainMm: 0,
	windKmh: 12,
	advisory: "",
	delayMin: 0,
	conditionLabel: "Clima cálido · Carora"
};
function LiveApp() {
	const { user, isPending } = useCurrentUserState();
	const zoomBy = useRapidez((s) => s.zoomBy);
	const phase = useRapidez((s) => s.phase);
	const showRoadLayer = useRapidez((s) => s.showRoadLayer);
	const showPin = phase === "pickup" || phase === "destination";
	const centerOnCarora = () => {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition((p) => {
				const lat = p.coords.latitude;
				const lng = p.coords.longitude;
				if (lat >= 10.05 && lat <= 10.35 && lng >= -70.25 && lng <= -69.9) {
					const seq = useRapidez.getState().mapSeq + 1;
					useRapidez.setState({
						center: {
							lat,
							lng
						},
						mapSeq: seq,
						mapCmd: {
							seq,
							type: "fly",
							lat,
							lng
						}
					});
					toast("Ubicación GPS en Carora actualizada");
					return;
				}
				const seq = useRapidez.getState().mapSeq + 1;
				useRapidez.setState({
					center: HOME,
					mapSeq: seq,
					mapCmd: {
						seq,
						type: "fly",
						lat: HOME.lat,
						lng: HOME.lng
					}
				});
				toast("Centrado en Carora, Estado Lara");
			}, () => {
				const seq = useRapidez.getState().mapSeq + 1;
				useRapidez.setState({
					center: HOME,
					mapSeq: seq,
					mapCmd: {
						seq,
						type: "fly",
						lat: HOME.lat,
						lng: HOME.lng
					}
				});
				toast("Centrado en Carora, Estado Lara");
			}, {
				enableHighAccuracy: true,
				timeout: 4e3
			});
			return;
		}
		const seq = useRapidez.getState().mapSeq + 1;
		useRapidez.setState({
			center: HOME,
			mapSeq: seq,
			mapCmd: {
				seq,
				type: "fly",
				lat: HOME.lat,
				lng: HOME.lng
			}
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "phone",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapCanvas, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "top-bar absolute right-3 left-3 z-20 flex items-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex h-11 items-center gap-2 rounded-full bg-paper pr-3 pl-1 shadow-lg",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: "/logo.jpg",
							alt: "Rapidez Moto transporte",
							className: "size-9 rounded-full object-cover"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "leading-tight",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block font-display text-xs font-extrabold tracking-wide text-ink",
								children: "RAPIDEZ"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block text-[10px] font-semibold text-muted",
								children: "Moto transporte · Carora"
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href: buildFeedbackWhatsappUrl(),
						target: "_blank",
						rel: "noopener noreferrer",
						title: "Enviar Feedback de Mejoras por WhatsApp (+5519986083932)",
						className: "ml-auto flex h-10 items-center gap-1.5 rounded-full bg-brand px-3 text-[11px] font-extrabold text-ink shadow-lg",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, { className: "size-3.5 shrink-0" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "hidden sm:inline",
								children: "Feedback"
							}),
							" ",
							CENTRAL_CARORA_CONFIG.feedbackPhoneDisplay
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rounded-full bg-paper px-2.5 py-1 shadow-lg",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "zoom-stack",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": "Acercar",
						onClick: () => zoomBy(1),
						className: "grid size-11 place-items-center rounded-full bg-paper text-ink shadow-lg",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-5" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": "Alejar",
						onClick: () => zoomBy(-1),
						className: "grid size-11 place-items-center rounded-full bg-paper text-ink shadow-lg",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: "size-5" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": "Mostrar u ocultar lombadas y áreas críticas",
						title: "Capas de lombadas, lluvia y tránsito",
						onClick: () => {
							const next = !showRoadLayer;
							useRapidez.setState({ showRoadLayer: next });
							toast(next ? "Capa vial activa: lombadas, zonas de lluvia y tránsito visibles" : "Capa vial oculta en el mapa");
						},
						className: showRoadLayer ? "grid size-11 place-items-center rounded-full bg-ink text-paper shadow-lg" : "grid size-11 place-items-center rounded-full bg-paper text-muted shadow-lg",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layers, { className: "size-5" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": "Centrar en Carora",
						onClick: centerOnCarora,
						className: "grid size-11 place-items-center rounded-full bg-brand text-ink shadow-lg",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LocateFixed, { className: "size-5" })
					})
				]
			}),
			showPin && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "center-pin",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {
					className: "size-12",
					fill: "currentColor",
					strokeWidth: 1.5
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"data-sheet": true,
				className: "sheet",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "sheet-in px-4 pt-3 pb-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" }), isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "Cargando tu cuenta…"
					}) : !user ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthPanel, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Desk, {
						userId: user.id,
						userName: user.displayName ?? "Usuario Carora"
					})]
				})
			})
		]
	});
}
function Desk({ userId, userName }) {
	const [profile, setProfile] = (0, import_react.useState)(void 0);
	const [locked, setLocked] = (0, import_react.useState)(false);
	const [drivers, setDrivers] = (0, import_react.useState)([]);
	const [trip, setTrip] = (0, import_react.useState)(null);
	const [offer, setOffer] = (0, import_react.useState)(null);
	const [pendingRate, setPendingRate] = (0, import_react.useState)(null);
	const [roadReports, setRoadReports] = (0, import_react.useState)([]);
	const [weather, setWeather] = (0, import_react.useState)(DEFAULT_WEATHER);
	const [review, setReview] = (0, import_react.useState)(false);
	const [roadModal, setRoadModal] = (0, import_react.useState)(false);
	const [feedbackModal, setFeedbackModal] = (0, import_react.useState)(false);
	const [ecoGps, setEcoGps] = (0, import_react.useState)(true);
	const [online, setOnline] = (0, import_react.useState)(true);
	const [error, setError] = (0, import_react.useState)("");
	const pos = (0, import_react.useRef)(null);
	const seenOffer = (0, import_react.useRef)("");
	const proximityNotified = (0, import_react.useRef)("");
	const prevProfileStatus = (0, import_react.useRef)(null);
	const prevPendingReviews = (0, import_react.useRef)(null);
	const staticTripRoute = (0, import_react.useRef)(null);
	const quote = (0, import_react.useRef)(null);
	const onQuote = (0, import_react.useCallback)((destPoint) => {
		if (!destPoint) {
			quote.current = null;
			const state = useRapidez.getState();
			if (state.phase === "pickup" || state.phase === "destination") useRapidez.setState({
				dest: null,
				route: []
			});
			return;
		}
		const here = useRapidez.getState().center;
		const dest = {
			lat: destPoint.lat,
			lng: destPoint.lng
		};
		const route = buildRoute(here, dest);
		quote.current = {
			dest,
			route
		};
		useRapidez.setState({
			dest,
			route
		});
	}, []);
	(0, import_react.useEffect)(() => {
		useRapidez.setState({
			useLive: true,
			fleet: []
		});
		if (!navigator.geolocation) return;
		navigator.geolocation.getCurrentPosition((p) => {
			const lat = p.coords.latitude;
			const lng = p.coords.longitude;
			if (lat < 10.05 || lat > 10.35 || lng < -70.25 || lng > -69.9) return;
			pos.current = {
				lat,
				lng
			};
			const seq = useRapidez.getState().mapSeq + 1;
			useRapidez.setState({
				center: {
					lat,
					lng
				},
				mapSeq: seq,
				mapCmd: {
					seq,
					type: "fly",
					lat,
					lng
				}
			});
		}, () => void 0, {
			enableHighAccuracy: true,
			maximumAge: 15e3,
			timeout: 8e3
		});
	}, []);
	(0, import_react.useEffect)(() => {
		if (!online || profile?.role !== "driver") return;
		if (!navigator.geolocation) return;
		const pollGps = () => {
			navigator.geolocation.getCurrentPosition((p) => {
				const lat = p.coords.latitude;
				const lng = p.coords.longitude;
				if (lat >= 10.05 && lat <= 10.35 && lng >= -70.25 && lng <= -69.9) pos.current = {
					lat,
					lng
				};
			}, () => void 0, {
				enableHighAccuracy: !ecoGps,
				maximumAge: GPS_ECO_INTERVAL_MS,
				timeout: 6e3
			});
		};
		pollGps();
		const gpsTimer = setInterval(pollGps, GPS_ECO_INTERVAL_MS);
		return () => clearInterval(gpsTimer);
	}, [
		online,
		profile?.role,
		ecoGps
	]);
	const forceSync = (0, import_react.useCallback)(async () => {
		try {
			const point = pos.current ?? useRapidez.getState().center;
			const result = await syncLive({ data: {
				deviceId: deviceId(),
				lat: point?.lat ?? null,
				lng: point?.lng ?? null,
				online
			} });
			setLocked(result.locked);
			if (prevProfileStatus.current === "pending" && result.profile?.status === "approved") {
				beepOffer();
				toast.success(`✅ ¡Aprobación confirmada por ${CENTRAL_CARORA_CONFIG.developerEmail}! Ya puedes usar Rapidez Carora.`);
				sendBrowserPush("Rapidez Carora · Cuenta Aprobada", `El desarrollador (${CENTRAL_CARORA_CONFIG.developerEmail}) aprobó tu cuenta.`, "rapidez-approved");
			}
			prevProfileStatus.current = result.profile?.status ?? null;
			if (prevPendingReviews.current !== null && result.pendingReviewsCount > prevPendingReviews.current) {
				beepOffer();
				toast.info(`🔔 Nueva solicitud de aprobación enviada a ${CENTRAL_CARORA_CONFIG.developerEmail}`);
				sendBrowserPush(`Push Aprobación · ${CENTRAL_CARORA_CONFIG.developerEmail}`, `Hay ${result.pendingReviewsCount} expediente(s) pendiente(s) de aprobación en Rapidez Carora.`, "rapidez-pending-review");
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
				elite: d.elite
			}));
			const active = result.trip;
			const driverPoint = active?.driverLat != null && active.driverLng != null ? {
				lat: active.driverLat,
				lng: active.driverLng
			} : null;
			if (active && active.status === "accepted" && driverPoint && result.profile?.role === "passenger") {
				if (haversine(driverPoint, {
					lat: active.pickupLat,
					lng: active.pickupLng
				}) <= 100 && proximityNotified.current !== active.id) {
					proximityNotified.current = active.id;
					beepOffer();
					toast.success("¡Tu mototaxi está a menos de 100 metros! Ten tu casco o pago listo.");
				}
			}
			let routePts = held?.route ?? [];
			if (active) {
				if (!staticTripRoute.current || staticTripRoute.current.tripId !== active.id) staticTripRoute.current = {
					tripId: active.id,
					pts: buildRoute({
						lat: active.pickupLat,
						lng: active.pickupLng
					}, {
						lat: active.destLat,
						lng: active.destLng
					})
				};
				routePts = staticTripRoute.current.pts;
			} else staticTripRoute.current = null;
			useRapidez.setState({
				useLive: true,
				profileStatus: result.profile?.status ?? null,
				fleet,
				rainActive: result.weather.isRaining,
				roadReports: result.roadReports,
				pickup: active ? {
					lat: active.pickupLat,
					lng: active.pickupLng
				} : null,
				dest: active ? {
					lat: active.destLat,
					lng: active.destLng
				} : held?.dest ?? null,
				driverPos: driverPoint,
				phase: phaseOf(active),
				route: routePts,
				routeIndex: 1
			});
			if (result.offer && `${result.offer.id}:${result.offer.offerUntil}` !== seenOffer.current) {
				seenOffer.current = `${result.offer.id}:${result.offer.offerUntil}`;
				beepOffer();
				pingOffer(result.offer.pickupRef);
			}
			if (!result.offer) seenOffer.current = "";
		} catch (err) {
			setError(messageOf(err));
		}
	}, [online, userId]);
	(0, import_react.useEffect)(() => {
		let stop = false;
		const run = async () => {
			if (stop) return;
			await forceSync();
		};
		run();
		const id = setInterval(() => void run(), ecoGps ? 8500 : 3500);
		return () => {
			stop = true;
			clearInterval(id);
		};
	}, [forceSync, ecoGps]);
	if (locked) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-3xl font-extrabold",
			children: "Un solo teléfono"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted",
			children: "Tu cuenta ya está abierta en otro dispositivo. Cierra esa sesión o espera un minuto para entrar desde este teléfono."
		})]
	});
	if (profile === void 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted",
		children: "Conectando con Carora…"
	});
	if (review) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Review, {
		weather,
		onClose: () => {
			setReview(false);
			forceSync();
		}
	});
	if (feedbackModal) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MvpFeedbackDrawer, {
		onClose: () => setFeedbackModal(false),
		onDone: () => {
			setFeedbackModal(false);
			forceSync();
		}
	});
	if (roadModal) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoadAndWeatherDrawer, {
		weather,
		reports: roadReports,
		onClose: () => setRoadModal(false),
		onSync: () => void forceSync()
	});
	if (!profile) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cadastro, {
		defaultName: userName,
		onDone: () => void forceSync(),
		onReview: () => setReview(true)
	});
	if (profile.status !== "approved") {
		const mailtoApprovalHref = `mailto:${CENTRAL_CARORA_CONFIG.developerEmail}?subject=${encodeURIComponent(`[Rapidez Carora] Solicitud de Aprobación — ${profile.fullName} (${profile.cedula})`)}&body=${encodeURIComponent([
			"Hola Desarrollador Rapidez Carora (beisander2@gmail.com),",
			"",
			"Solicito la aprobación de mi expediente en la aplicación:",
			`• Rol: ${profile.role === "driver" ? "Mototaxista (Frota 5 Motos)" : "Pasajero (MVP 15)"}`,
			`• Nombre: ${profile.fullName}`,
			`• Cédula: ${profile.cedula}`,
			`• Teléfono: ${profile.phone}`,
			profile.role === "driver" ? `• Moto: ${profile.model} · Placa: ${profile.plate}` : "",
			"",
			"Ya subí mi Selfie obligatoria y mi Cédula de Identidad."
		].filter(Boolean).join("\n"))}`;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between text-xs text-muted",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-bold text-ink",
						children: profile.role === "driver" ? "Expediente Mototaxista" : "Expediente Pasajero"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: profile.cedula })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-2xl font-extrabold",
					children: profile.status === "rejected" ? "Hay que corregir documentos" : profile.status === "blocked" ? "Unidad bloqueada" : "Aprobación enviada a beisander2@gmail.com"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted",
					children: profile.status === "rejected" ? profile.rejectNote || "La administración solicitó volver a tomar tu selfie o documento con mayor claridad." : profile.status === "blocked" ? "La administración bloqueó esta unidad temporalmente." : `Recibimos tu Cédula, Selfie obligatoria y documentación. Se envió una notificación Push / Email a ${CENTRAL_CARORA_CONFIG.developerEmail} para aprobar tu cuenta.`
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl border border-line bg-paper p-3 text-xs",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "font-bold text-ink",
							children: [
								profile.fullName,
								" · ",
								profile.phone
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "rounded-full bg-brand px-2 py-0.5 text-[10px] font-extrabold text-ink",
							children: ["Push → ", CENTRAL_CARORA_CONFIG.developerEmail]
						})]
					}), profile.role === "driver" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-0.5 text-muted",
						children: [
							"Moto: ",
							profile.model,
							" · Placa ",
							profile.plate,
							" · ",
							profile.bankName
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "h-11 rounded-full bg-brand text-xs font-extrabold text-ink shadow-sm",
					onClick: () => {
						resendDeveloperPush({ data: {} }).then(() => {
							toast.success(`Notificación Push / Email enviada a ${CENTRAL_CARORA_CONFIG.developerEmail}`);
							sendBrowserPush("Solicitud de Aprobación Enviada", `Se notificó a ${CENTRAL_CARORA_CONFIG.developerEmail} para aprobar a ${profile.fullName}.`);
						}).catch((err) => toast.error(messageOf(err)));
					},
					children: ["Reenviar Push / Email a ", CENTRAL_CARORA_CONFIG.developerEmail]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: mailtoApprovalHref,
						className: "flex h-10 items-center justify-center rounded-full border border-line bg-paper px-3 text-xs font-bold text-ink",
						children: "Abrir Email Directo"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "h-10 rounded-full bg-ink px-3 text-xs font-bold text-paper",
						onClick: () => setReview(true),
						children: "Bandeja Desarrollador"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between pt-1 text-xs",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "font-semibold text-muted underline",
						onClick: () => setProfile(null),
						children: "Actualizar fotos o documentos"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "font-bold text-ink underline",
						onClick: () => setFeedbackModal(true),
						children: [
							"Feedback (",
							CENTRAL_CARORA_CONFIG.feedbackPhoneDisplay,
							")"
						]
					})]
				})
			]
		});
	}
	if (profile.role === "driver") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DriverDesk, {
		profile,
		online,
		ecoGps,
		onToggleEco: () => {
			const next = !ecoGps;
			setEcoGps(next);
			toast(next ? "Modo Económico 3G/4G activado (GPS cada 8–10s)" : "Modo GPS rápido activado (3.5s)");
		},
		offer: trip?.driverId === userId ? null : offer,
		trip: trip?.driverId === userId ? trip : null,
		pendingRate,
		weather,
		roadReports,
		error,
		onSync: () => void forceSync(),
		onOpenRoadModal: () => setRoadModal(true),
		onOpenFeedback: () => setFeedbackModal(true),
		onOnline: (value) => {
			unlockAudio();
			if (value && !pos.current) pos.current = { ...useRapidez.getState().center };
			setOnline(value);
		},
		onPin: () => {
			pos.current = { ...useRapidez.getState().center };
			setOnline(true);
			forceSync();
			toast.success("Ubicación GPS de tu moto actualizada en el mapa de Carora");
		},
		onSelectHotspot: (hs) => {
			pos.current = {
				lat: hs.lat,
				lng: hs.lng
			};
			const seq = useRapidez.getState().mapSeq + 1;
			useRapidez.setState({
				center: {
					lat: hs.lat,
					lng: hs.lng
				},
				mapSeq: seq,
				mapCmd: {
					seq,
					type: "fly",
					lat: hs.lat,
					lng: hs.lng
				}
			});
			setOnline(true);
			setDriverHotspot({ data: {
				hotspotId: hs.id,
				lat: hs.lat,
				lng: hs.lng
			} }).then(() => {
				toast.success(`Posicionado en Hotspot: ${hs.shortName}`);
				forceSync();
			});
		},
		onReview: () => setReview(true)
	});
	if (!trip && pendingRate) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RateCard, {
		item: pendingRate,
		onDone: () => void forceSync()
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PassengerDesk, {
		nearby: drivers,
		rating: profile.rating,
		ratingCount: profile.ratingCount,
		trip,
		weather,
		roadReports,
		ecoGps,
		onToggleEco: () => {
			const next = !ecoGps;
			setEcoGps(next);
			toast(next ? "Modo Económico 3G/4G activado (ahorro de datos en Carora)" : "Sincronización rápida activada");
		},
		error,
		onQuote,
		onSync: () => void forceSync(),
		onOpenRoadModal: () => setRoadModal(true),
		onOpenFeedback: () => setFeedbackModal(true),
		onReview: () => setReview(true),
		onRequest: async (destPoint, destName, pickupText, pay, point, tierId, cashTendered) => {
			unlockAudio();
			const here = pos.current ?? useRapidez.getState().center;
			setError("");
			try {
				const cleanPickupRef = pickupText.trim() ? `${placeLabel(here)} (${pickupText.trim()})` : placeLabel(here);
				const cleanDestRef = point.trim() ? `${destName} · ${point.trim()}` : `${destName} · Punto principal`;
				await requestTrip({ data: {
					pickupLat: here.lat,
					pickupLng: here.lng,
					pickupRef: cleanPickupRef,
					destLat: destPoint.lat,
					destLng: destPoint.lng,
					destRef: cleanDestRef,
					payMethod: pay,
					preferredDriverId: null,
					serviceTier: tierId,
					cashTendered
				} });
				await forceSync();
				toast.success("Disparo simultáneo enviado a las 5 motos de la flota en Carora");
			} catch (err) {
				setError(messageOf(err));
			}
		},
		onCancel: async () => {
			if (!trip) return;
			await setTripStatus({ data: {
				tripId: trip.id,
				status: "cancelled"
			} });
			await forceSync();
			toast("Carrera cancelada");
		}
	});
}
function WeatherAndTrafficBar({ weather, reportsCount, ecoGps = true, onToggleEco, onOpenRoadModal }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between gap-1.5 rounded-2xl bg-paper px-3 py-2 text-xs",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-w-0 items-center gap-1.5",
				children: [weather.isRaining ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CloudRain, { className: "size-4 shrink-0 text-signal" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, { className: "size-4 shrink-0 text-brand" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "truncate font-bold text-ink",
					children: [
						weather.tempC,
						"°C · ",
						weather.conditionLabel
					]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex shrink-0 items-center gap-1",
				children: [onToggleEco && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onToggleEco,
					title: "Modo Económico de GPS (8–10s) para ahorrar datos 3G/4G en Carora",
					className: ecoGps ? "rounded-full bg-brand/30 px-2 py-1 text-[10px] font-extrabold text-ink whitespace-nowrap" : "rounded-full border border-line bg-sheet px-2 py-1 text-[10px] font-semibold text-muted whitespace-nowrap",
					children: ecoGps ? "3G Eco 9s" : "GPS 3s"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: onOpenRoadModal,
					className: "shrink-0 rounded-full bg-ink px-2.5 py-1 text-[11px] font-bold text-paper whitespace-nowrap",
					children: [
						"Vialidad (",
						CARORA_ROAD_NODES.length + reportsCount,
						")"
					]
				})]
			})]
		}), weather.isRaining && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start justify-between gap-2 rounded-2xl bg-signal px-3 py-2 text-xs text-paper",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "font-extrabold",
				children: [
					"Aviso por lluvia en Carora (+",
					weather.delayMin,
					" min de retraso estimado)"
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-0.5 text-[11px] text-paper/90",
				children: weather.advisory || "Precaución en áreas críticas: Quebrada de Carora, Río Morere y Av. Francisco de Miranda."
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: onOpenRoadModal,
				className: "shrink-0 rounded-lg bg-paper px-2 py-1 text-[10px] font-extrabold text-ink whitespace-nowrap",
				children: "Ver zonas"
			})]
		})]
	});
}
function RouteHazardsSummary({ route, roadReports, isRaining, onOpenRoadModal }) {
	const analysis = analyzeRouteHazards(route, roadReports, isRaining);
	if (analysis.speedBumps.length + analysis.rainZones.length + analysis.trafficHotspots.length + analysis.liveReports.length === 0 && !isRaining) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl border border-line bg-paper px-3 py-2 text-xs",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-extrabold text-ink",
				children: " Información vial en tu trayecto"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: onOpenRoadModal,
				className: "text-[11px] font-bold text-ink underline whitespace-nowrap",
				children: "Ver mapa vial"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-1 space-y-0.5 text-[11px] text-muted",
			children: [
				analysis.speedBumps.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "font-bold text-ink",
						children: [
							analysis.speedBumps.length,
							" ",
							analysis.speedBumps.length === 1 ? "lombada / reductor" : "lombadas / reductores",
							":"
						]
					}),
					" ",
					analysis.speedBumps.map((b) => b.name).join(" · ")
				] }),
				analysis.rainZones.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: isRaining ? "font-bold text-signal" : "",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-bold text-ink",
							children: analysis.rainZones.length === 1 ? "Área crítica de lluvia:" : "Áreas críticas de lluvia:"
						}),
						" ",
						analysis.rainZones.map((z) => z.name).join(" · "),
						isRaining ? ` (+${analysis.extraRainMinutes} min por lluvia)` : " (precaución si llueve)"
					]
				}),
				analysis.trafficHotspots.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-bold text-ink",
						children: "Tránsito activo:"
					}),
					" ",
					analysis.trafficHotspots.map((t) => t.name).join(" · ")
				] }),
				analysis.liveReports.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "font-semibold text-signal",
					children: [
						"Reporte comunitario en ruta:",
						" ",
						analysis.liveReports.map((r) => `${r.label} (${r.sector})`).join(" · ")
					]
				})
			]
		})]
	});
}
function RoadAndWeatherDrawer({ weather, reports, onClose, onSync }) {
	const center = useRapidez((s) => s.center);
	const [kind, setKind] = (0, import_react.useState)("lombada_hueco");
	const [label, setLabel] = (0, import_react.useState)("");
	const [sending, setSending] = (0, import_react.useState)(false);
	const [tab, setTab] = (0, import_react.useState)("mapa");
	const focusNode = (node) => {
		const seq = useRapidez.getState().mapSeq + 1;
		useRapidez.setState({
			showRoadLayer: true,
			center: {
				lat: node.lat,
				lng: node.lng
			},
			mapSeq: seq,
			mapCmd: {
				seq,
				type: "fly",
				lat: node.lat,
				lng: node.lng
			}
		});
		toast(`Centrado en ${node.name}`);
		onClose();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs font-semibold text-muted",
					children: "Tránsito, Lombadas y Clima · Carora"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-2xl font-extrabold",
					children: "Radar Vial Carora"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onClose,
					className: "rounded-full bg-paper px-3 py-1.5 text-xs font-bold text-ink",
					children: "Volver"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: weather.isRaining ? "rounded-2xl bg-signal p-3 text-xs text-paper" : "rounded-2xl bg-paper p-3 text-xs text-ink",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "font-extrabold",
						children: [
							weather.tempC,
							"°C · ",
							weather.conditionLabel
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => {
							setCityWeather({ data: {
								rainMode: !weather.isRaining,
								delayMin: !weather.isRaining ? 4 : 0
							} }).then(() => {
								toast.success(!weather.isRaining ? "Alerta por lluvia y retrasos activada en Carora" : "Alerta de lluvia desactivada · Vías secas");
								onSync();
							});
						},
						className: weather.isRaining ? "rounded-full bg-paper px-2.5 py-1 text-[11px] font-extrabold text-ink whitespace-nowrap" : "rounded-full bg-ink px-2.5 py-1 text-[11px] font-bold text-paper whitespace-nowrap",
						children: weather.isRaining ? "Marcar fin de lluvia" : "Reportar lluvia en Carora"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-[11px] opacity-90",
					children: weather.isRaining ? `Aviso activo: +${weather.delayMin} min de retraso estimado por pavimento mojado y pasos de quebrada.` : "Vías principales secas. Si comienza a llover en tu sector, activa el aviso para alertar a las motos."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-1.5 rounded-2xl bg-paper p-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setTab("mapa"),
					className: tab === "mapa" ? "h-9 rounded-xl bg-ink text-xs font-bold text-paper" : "h-9 rounded-xl text-xs font-semibold text-muted",
					children: "Lombadas y Zonas Críticas"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setTab("reportar"),
					className: tab === "reportar" ? "h-9 rounded-xl bg-ink text-xs font-bold text-paper" : "h-9 rounded-xl text-xs font-semibold text-muted",
					children: "Reportar en la Vía (+1)"
				})]
			}),
			tab === "reportar" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2.5 rounded-2xl border border-line bg-paper p-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs font-bold text-ink",
						children: ["Reportar novedad vial en ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "underline",
							children: placeLabel(center)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] text-muted",
						children: "Mueve el pin en el mapa al punto exacto o elige el tipo de alerta para avisar a todos los mototaxistas y pasajeros de Carora:"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-2 gap-1.5",
						children: [
							["lombada_hueco", "Lombada / Hueco"],
							["lluvia_anegado", "Calle anegada / Lluvia"],
							["trafico_cierre", "Trancón / Vía cerrada"],
							["alcabala_operativo", "Punto de control"]
						].map(([id, text]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setKind(id),
							className: kind === id ? "h-10 rounded-xl bg-ink px-2.5 text-xs font-bold text-paper" : "h-10 rounded-xl border border-line bg-sheet px-2.5 text-xs font-semibold text-ink",
							children: text
						}, id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "field h-10 text-sm",
						placeholder: "Detalle opcional (ej. hueco grande frente a panadería)",
						value: label,
						onChange: (e) => setLabel(e.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: sending,
						onClick: () => {
							setSending(true);
							submitRoadReport({ data: {
								kind,
								label,
								lat: center.lat,
								lng: center.lng
							} }).then(() => {
								toast.success("Reporte vial publicado en el mapa de Carora");
								setLabel("");
								setTab("mapa");
								onSync();
							}).catch((err) => toast.error(messageOf(err))).finally(() => setSending(false));
						},
						className: "h-11 w-full rounded-full bg-brand text-xs font-extrabold text-ink shadow-sm disabled:opacity-40",
						children: sending ? "Publicando en mapa…" : "Publicar alerta en el mapa de Carora"
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "max-h-72 space-y-2 overflow-y-auto pr-0.5",
				children: [
					reports.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs font-extrabold text-ink",
							children: [
								"Reportes en vivo de usuarios (",
								reports.length,
								")"
							]
						}), reports.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-2 rounded-2xl border border-line bg-paper p-2.5 text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => focusNode({
									lat: r.lat,
									lng: r.lng,
									name: r.label
								}),
								className: "min-w-0 flex-1 text-left",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "truncate font-bold text-ink",
									children: r.label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-[11px] text-muted",
									children: [
										r.sector,
										" · por ",
										r.authorName,
										" · ",
										r.when
									]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex shrink-0 items-center gap-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => void voteRoadReport({ data: {
										reportId: r.id,
										delta: 1
									} }).then(onSync),
									className: "inline-flex h-8 items-center gap-1 rounded-full bg-brand/30 px-2.5 text-[11px] font-bold text-ink",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThumbsUp, { className: "size-3" }),
										" ",
										r.upvotes
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => void voteRoadReport({ data: {
										reportId: r.id,
										delta: -1
									} }).then(onSync),
									className: "h-8 rounded-full bg-sheet px-2 text-[11px] font-semibold text-muted",
									children: "Ya pasó"
								})]
							})]
						}, r.id))]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-extrabold text-ink",
							children: "Áreas críticas cuando llueve (Quebradas y Drenajes)"
						}), CARORA_ROAD_NODES.filter((n) => n.kind === "rain_critical").map((node) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => focusNode(node),
							className: "flex w-full items-start justify-between gap-2 rounded-2xl bg-paper p-2.5 text-left text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-bold text-ink",
								children: node.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] text-muted",
								children: node.detail
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "shrink-0 text-[11px] font-extrabold text-signal whitespace-nowrap",
								children: [
									"+",
									node.rainDelayMin,
									" min lluvia"
								]
							})]
						}, node.id))]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-extrabold text-ink",
							children: "Lombadas / Policías Acostados en Carora"
						}), CARORA_ROAD_NODES.filter((n) => n.kind === "speed_bump").map((node) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => focusNode(node),
							className: "flex w-full items-start justify-between gap-2 rounded-2xl bg-paper p-2.5 text-left text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-bold text-ink",
								children: node.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] text-muted",
								children: node.detail
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "shrink-0 text-[11px] font-bold text-ink whitespace-nowrap",
								children: "Ver en mapa"
							})]
						}, node.id))]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-extrabold text-ink",
							children: "Puntos de Tránsito Pesado"
						}), CARORA_ROAD_NODES.filter((n) => n.kind === "traffic_hotspot").map((node) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => focusNode(node),
							className: "flex w-full items-start justify-between gap-2 rounded-2xl bg-paper p-2.5 text-left text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-bold text-ink",
								children: node.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] text-muted",
								children: node.detail
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "shrink-0 text-[11px] font-bold text-muted whitespace-nowrap",
								children: [
									"+",
									node.rainDelayMin,
									" min"
								]
							})]
						}, node.id))]
					})
				]
			})
		]
	});
}
function phaseOf(trip) {
	if (!trip) return "pickup";
	if (trip.status === "open") return "searching";
	if (trip.status === "accepted") return "enroute";
	if (trip.status === "arrived") return "arrived";
	if (trip.status === "riding") return "riding";
	if (trip.status === "pay") return "pay";
	return "done";
}
function Cadastro({ defaultName, onDone, onReview }) {
	const [role, setRole] = (0, import_react.useState)("passenger");
	const [fullName, setFullName] = (0, import_react.useState)(defaultName);
	const [phone, setPhone] = (0, import_react.useState)("");
	const [cedula, setCedula] = (0, import_react.useState)("");
	const [plate, setPlate] = (0, import_react.useState)("");
	const [model, setModel] = (0, import_react.useState)(MODELS[0]);
	const [bankPhone, setBankPhone] = (0, import_react.useState)("");
	const [bankName, setBankName] = (0, import_react.useState)(BANKS[0].name);
	const [cedulaPhoto, setCedulaPhoto] = (0, import_react.useState)("");
	const [selfie, setSelfie] = (0, import_react.useState)("");
	const [circulationPhoto, setCirculationPhoto] = (0, import_react.useState)("");
	const [licenseGrade, setLicenseGrade] = (0, import_react.useState)("2da Grado (Moto)");
	const [medicalCert, setMedicalCert] = (0, import_react.useState)(true);
	const [criminalRecordOk, setCriminalRecordOk] = (0, import_react.useState)(true);
	const [activeCamera, setActiveCamera] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)("");
	const [pending, setPending] = (0, import_react.useState)(false);
	async function onFile(file, set) {
		if (!file) return;
		try {
			set(await shrink(file));
			setError("");
		} catch (err) {
			setError(messageOf(err));
		}
	}
	const missingPhotos = !cedulaPhoto || !selfie || role === "driver" && !circulationPhoto;
	const missingFields = fullName.trim().length < 3 || phone.replace(/\D/g, "").length < 10 || cedula.replace(/\D/g, "").length < 6 || role === "driver" && (plate.trim().length < 4 || (bankPhone || phone).replace(/\D/g, "").length < 10 || !medicalCert || !criminalRecordOk);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-xs font-extrabold tracking-wide text-muted",
					children: [
						"Operación Controlada · Carora (",
						5,
						" Motos · ",
						15,
						" Pasajeros MVP)"
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-2xl font-extrabold",
					children: "Filtro de Catastro Físico"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "size-7 text-brand" })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted",
				children: role === "passenger" ? `Base inicial de 15 pasajeros verificados en Carora. Tu Cédula y Selfie en vivo son obligatorias.` : `Frota inicial de 5 pilotos con retención del 90% por carrera. Requiere Cédula, Licencia 2da/3ra, Certificado Médico y Antecedentes.`
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: role === "passenger" ? "h-11 rounded-full bg-ink text-sm font-semibold text-paper" : "h-11 rounded-full bg-paper text-sm font-semibold",
					onClick: () => setRole("passenger"),
					children: "Soy Pasajero (MVP)"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: role === "driver" ? "h-11 rounded-full bg-ink text-sm font-semibold text-paper" : "h-11 rounded-full bg-paper text-sm font-semibold",
					onClick: () => setRole("driver"),
					children: "Soy Piloto (Frota 5)"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				className: "field",
				"aria-label": "Nombre y apellido",
				placeholder: "Nombre y apellido completo",
				value: fullName,
				onChange: (e) => setFullName(e.target.value)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "field",
					"aria-label": "Teléfono",
					inputMode: "numeric",
					placeholder: "Teléfono (ej. 04145551234)",
					value: phone,
					onChange: (e) => setPhone(e.target.value)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "field",
					"aria-label": "Cédula",
					placeholder: "Cédula (ej. V-19888777)",
					value: cedula,
					onChange: (e) => setCedula(e.target.value)
				})]
			}),
			role === "driver" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-2 rounded-2xl border border-line bg-paper/60 p-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-bold text-ink",
							children: "Filtro Físico: Moto, Licencia, Médico y Antecedentes"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "rounded-full bg-brand px-2 py-0.5 text-[10px] font-extrabold text-ink",
							children: "90% Piloto / 10% Central"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "field",
							placeholder: "Placa (ej. AB12CD)",
							value: plate,
							onChange: (e) => setPlate(e.target.value.toUpperCase())
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							className: "field",
							"aria-label": "Modelo de moto",
							value: model,
							onChange: (e) => setModel(e.target.value),
							children: MODELS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: item,
								children: item
							}, item))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							className: "field",
							"aria-label": "Banco Pago Móvil",
							value: bankName,
							onChange: (e) => setBankName(e.target.value),
							children: BANKS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
								value: item.name,
								children: [
									item.code,
									" · ",
									item.name
								]
							}, item.code))
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "field",
							inputMode: "numeric",
							placeholder: "Tel. Pago Móvil (0412...)",
							value: bankPhone,
							onChange: (e) => setBankPhone(e.target.value)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							className: "field text-xs",
							"aria-label": "Grado de Licencia",
							value: licenseGrade,
							onChange: (e) => setLicenseGrade(e.target.value),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "2da Grado (Moto)",
								children: "Licencia 2da Grado (Moto)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "3ra Grado",
								children: "Licencia 3ra Grado"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex items-center gap-1.5 rounded-xl bg-sheet px-2.5 py-1.5 text-[11px] font-bold text-ink",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: medicalCert,
								onChange: (e) => setMedicalCert(e.target.checked)
							}), "Certificado Médico Vial"]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex items-center gap-2 rounded-xl bg-sheet px-2.5 py-2 text-[11px] font-bold text-ink",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: criminalRecordOk,
							onChange: (e) => setCriminalRecordOk(e.target.checked)
						}), "Declaración de Antecedentes Penales limpios + Validación presencial en Central Carora"]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2 rounded-2xl border border-line bg-paper p-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-extrabold text-ink",
						children: "Verificación biométrica y documental (Obligatoria)"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhotoCaptureCard, {
							label: "1. Foto de Cédula *",
							sublabel: "Documento legible",
							photo: cedulaPhoto,
							capture: "environment",
							onOpenCamera: () => setActiveCamera({
								target: "cedula",
								facingMode: "environment",
								title: "Fotografiar Cédula de Identidad"
							}),
							onFile: (file) => void onFile(file, setCedulaPhoto)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhotoCaptureCard, {
							label: "2. Selfie en vivo *",
							sublabel: "Rostro descubierto",
							photo: selfie,
							capture: "user",
							onOpenCamera: () => setActiveCamera({
								target: "selfie",
								facingMode: "user",
								title: "Tomar Selfie Obligatoria"
							}),
							onFile: (file) => void onFile(file, setSelfie)
						})]
					}),
					role === "driver" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhotoCaptureCard, {
						label: "3. Licencia 2da/3ra + Carnet de Circulación + Cert. Médico *",
						sublabel: "Foto de Licencia vigente, Certificado Médico y Carnet de Circulación de la moto",
						photo: circulationPhoto,
						capture: "environment",
						onOpenCamera: () => setActiveCamera({
							target: "circulation",
							facingMode: "environment",
							title: "Fotografiar Documentación Completa del Piloto"
						}),
						onFile: (file) => void onFile(file, setCirculationPhoto)
					})
				]
			}),
			activeCamera && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CameraModal, {
				title: activeCamera.title,
				facingMode: activeCamera.facingMode,
				onClose: () => setActiveCamera(null),
				onCapture: (dataUrl) => {
					if (activeCamera.target === "selfie") setSelfie(dataUrl);
					if (activeCamera.target === "cedula") setCedulaPhoto(dataUrl);
					if (activeCamera.target === "circulation") setCirculationPhoto(dataUrl);
					setActiveCamera(null);
					setError("");
				}
			}),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-medium text-signal",
				children: error
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				disabled: pending || missingPhotos || missingFields,
				className: "h-12 rounded-full bg-brand text-base font-extrabold text-ink shadow-md disabled:opacity-40",
				onClick: () => {
					setPending(true);
					setError("");
					submitProfile({ data: {
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
						criminalRecordOk: role === "driver" ? criminalRecordOk : true
					} }).then(() => {
						toast.success(`Expediente y alerta Push enviados a ${CENTRAL_CARORA_CONFIG.developerEmail}`);
						sendBrowserPush(`Nuevo Registro · ${CENTRAL_CARORA_CONFIG.developerEmail}`, `${fullName} (${cedula}) envió su expediente para aprobación en Rapidez Carora.`);
						onDone();
					}).catch((err) => setError(messageOf(err))).finally(() => setPending(false));
				},
				children: pending ? `Enviando Push a ${CENTRAL_CARORA_CONFIG.developerEmail}…` : missingPhotos ? role === "driver" ? "Falta Cédula, Selfie o Documentación" : "Falta subir Cédula y Selfie obligatoria" : `Enviar aprobación a ${CENTRAL_CARORA_CONFIG.developerEmail}`
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "h-9 text-xs font-semibold text-muted underline",
				onClick: onReview,
				children: [
					"Painel del Desarrollador (",
					CENTRAL_CARORA_CONFIG.developerEmail,
					")"
				]
			})
		]
	});
}
function PhotoCaptureCard({ label, sublabel, photo, capture, onOpenCamera, onFile }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col justify-between gap-2 rounded-2xl border border-line bg-sheet p-2.5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-extrabold text-ink",
					children: label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[10px] text-muted",
					children: sublabel
				})] }), photo ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "inline-flex shrink-0 items-center gap-0.5 text-[10px] font-extrabold text-ink",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3 text-brand" }), " Lista"]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "shrink-0 text-[10px] font-bold text-signal",
					children: "Obligatorio"
				})]
			}),
			photo && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: photo,
				alt: label,
				className: "h-20 w-full rounded-xl border border-line object-cover"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: onOpenCamera,
					className: "flex h-9 items-center justify-center gap-1 rounded-xl bg-ink px-2 text-[11px] font-bold text-paper",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "size-3.5 shrink-0" }), "Cámara"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "flex h-9 cursor-pointer items-center justify-center gap-1 rounded-xl border border-line bg-paper px-2 text-[11px] font-bold text-ink",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-3.5 shrink-0" }),
						"Archivo",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "sr-only",
							type: "file",
							accept: "image/*",
							capture,
							onChange: (e) => onFile(e.target.files?.[0])
						})
					]
				})]
			})
		]
	});
}
function CameraModal({ title, facingMode, onClose, onCapture }) {
	const videoRef = (0, import_react.useRef)(null);
	const [camError, setCamError] = (0, import_react.useState)("");
	const [ready, setReady] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		let stream = null;
		if (!navigator.mediaDevices?.getUserMedia) {
			setCamError("Tu navegador no permite abrir la cámara en directo. Usa el botón 'Archivo'.");
			return;
		}
		navigator.mediaDevices.getUserMedia({
			video: {
				facingMode,
				width: { ideal: 720 },
				height: { ideal: 720 }
			},
			audio: false
		}).then((s) => {
			stream = s;
			if (videoRef.current) {
				videoRef.current.srcObject = s;
				videoRef.current.play();
				setReady(true);
			}
		}).catch(() => {
			setCamError("No se pudo acceder a la cámara. Concede permiso o usa el botón 'Archivo' para subir la foto.");
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
		onCapture(canvas.toDataURL("image/jpeg", .72));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl border-2 border-ink bg-ink p-3 text-paper",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-2 flex items-center justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-xs font-extrabold text-brand",
				children: title
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: onClose,
				className: "rounded-full bg-paper/15 p-1 text-paper",
				"aria-label": "Cerrar cámara",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
			})]
		}), camError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "py-3 text-xs text-paper/90",
			children: camError
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
				ref: videoRef,
				playsInline: true,
				muted: true,
				className: "h-52 w-full rounded-xl bg-ink object-cover"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				disabled: !ready,
				onClick: snap,
				className: "flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand font-extrabold text-ink disabled:opacity-40",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "size-4" }), " Capturar foto ahora"]
			})]
		})]
	});
}
function PassengerDesk({ nearby, rating, ratingCount, trip, weather, roadReports, ecoGps, onToggleEco, error, onQuote, onSync, onOpenRoadModal, onOpenFeedback, onReview, onRequest, onCancel }) {
	const center = useRapidez((s) => s.center);
	const route = useRapidez((s) => s.route);
	const focusPlace = useRapidez((s) => s.focusPlace);
	const [placeId, setPlaceId] = (0, import_react.useState)("plaza");
	const [customDest, setCustomDest] = (0, import_react.useState)(null);
	const [pickingMapDest, setPickingMapDest] = (0, import_react.useState)(false);
	const [tierId, setTierId] = (0, import_react.useState)("moto");
	const [pay, setPay] = (0, import_react.useState)("PAGO_MOVIL");
	const [cashBillUsd, setCashBillUsd] = (0, import_react.useState)(null);
	const [pickupNote, setPickupNote] = (0, import_react.useState)("");
	const [point, setPoint] = (0, import_react.useState)("Frente a la entrada principal");
	const [needHelmet, setNeedHelmet] = (0, import_react.useState)(true);
	const [hasBag, setHasBag] = (0, import_react.useState)(false);
	const [savedHome, setSavedHome] = (0, import_react.useState)(() => {
		try {
			const raw = localStorage.getItem("rapidez-fav-casa");
			return raw ? JSON.parse(raw) : null;
		} catch {
			return null;
		}
	});
	const [savedWork, setSavedWork] = (0, import_react.useState)(() => {
		try {
			const raw = localStorage.getItem("rapidez-fav-trabajo");
			return raw ? JSON.parse(raw) : null;
		} catch {
			return null;
		}
	});
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [history, setHistory] = (0, import_react.useState)(false);
	const selectedPlace = PLACES.find((item) => item.id === placeId) ?? null;
	const destPoint = customDest ?? selectedPlace;
	const destName = customDest ? placeLabel(customDest) : selectedPlace?.name ?? "";
	const isPremiere = destPoint ? premiereAt(destPoint) : false;
	const tier = SERVICE_TIERS.find((t) => t.id === tierId) ?? SERVICE_TIERS[0];
	const meters = destPoint ? haversine(center, destPoint) : 0;
	const baseFare = destPoint ? fareFor(meters, isPremiere) : 0;
	const fare = destPoint ? Math.round((baseFare + tier.extraUsd) * 100) / 100 : 0;
	const tooClose = Boolean(destPoint) && meters < 80;
	const routeAnalysis = analyzeRouteHazards(route, roadReports, weather.isRaining);
	const adjustedEta = etaMin(meters) + routeAnalysis.extraRainMinutes;
	const changeUsd = (pay === "CASH_USD" || pay === "CASH_VES") && cashBillUsd && cashBillUsd > fare ? Math.round((cashBillUsd - fare) * 100) / 100 : 0;
	(0, import_react.useEffect)(() => {
		if (trip && trip.status !== "cancelled") return;
		onQuote(destPoint);
	}, [
		trip,
		destPoint,
		center.lat,
		center.lng,
		onQuote
	]);
	if (history) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HistoryList, { onClose: () => setHistory(false) });
	if (trip && trip.status !== "cancelled") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TripCard, {
		trip,
		mine: "passenger",
		weather,
		roadReports,
		onOpenRoadModal,
		onSync,
		onCancel: () => void onCancel()
	});
	const handleFavorite = (slot) => {
		const current = slot === "casa" ? savedHome : savedWork;
		if (current) {
			setCustomDest({
				lat: current.lat,
				lng: current.lng
			});
			setPlaceId(null);
			setPoint(`Favorito (${slot === "casa" ? "Casa" : "Trabajo"}): ${current.label}`);
			toast.success(`Destino fijado en tu ${slot === "casa" ? "Casa" : "Trabajo"} (${current.label})`);
		} else {
			const next = {
				label: placeLabel(center),
				lat: center.lat,
				lng: center.lng
			};
			localStorage.setItem(`rapidez-fav-${slot}`, JSON.stringify(next));
			if (slot === "casa") setSavedHome(next);
			else setSavedWork(next);
			toast.success(`Pin actual guardado como tu ${slot === "casa" ? "Casa" : "Trabajo"} (${next.label})`);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WeatherAndTrafficBar, {
				weather,
				reportsCount: roadReports.length,
				ecoGps,
				onToggleEco,
				onOpenRoadModal
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-2 text-xs text-muted",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-semibold text-ink",
					children: nearby.length > 0 ? `${nearby.length} de 5 motos activas en Hotspots Carora` : `Frota de 5 motos · Disparo general activo`
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "font-medium tabular-nums",
					children: [
						"BCV: Bs ",
						RATE_VES.toFixed(2),
						"/$",
						ratingCount > 0 ? ` · ★ ${rating.toFixed(1)}` : ""
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-2xl font-extrabold",
				children: "¿A dónde vamos hoy?"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs text-muted",
				children: [
					"Salida en ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-bold text-ink",
						children: placeLabel(center)
					}),
					". Ruta estática de bajo consumo 3G/4G."
				]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => handleFavorite("casa"),
						onDoubleClick: () => {
							localStorage.removeItem("rapidez-fav-casa");
							setSavedHome(null);
							toast("Favorito Casa borrado");
						},
						className: "inline-flex shrink-0 items-center gap-1 rounded-full bg-ink px-2.5 py-1 font-bold text-paper whitespace-nowrap",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bookmark, { className: "size-3" }), savedHome ? `Casa (${savedHome.label})` : "Guardar Casa"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => handleFavorite("trabajo"),
						onDoubleClick: () => {
							localStorage.removeItem("rapidez-fav-trabajo");
							setSavedWork(null);
							toast("Favorito Trabajo borrado");
						},
						className: "inline-flex shrink-0 items-center gap-1 rounded-full bg-ink px-2.5 py-1 font-bold text-paper whitespace-nowrap",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bookmark, { className: "size-3" }), savedWork ? `Trabajo (${savedWork.label})` : "Guardar Trabajo"]
					}),
					CARORA_HOTSPOTS.map((hs) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => focusPlace({
							id: hs.id,
							name: hs.shortName,
							hint: hs.detail,
							lat: hs.lat,
							lng: hs.lng
						}),
						className: "shrink-0 rounded-full border border-brand bg-paper px-2.5 py-1 font-bold text-ink whitespace-nowrap",
						children: ["Hotspot: ", hs.shortName]
					}, hs.id))
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				className: "field",
				"aria-label": "Referencia de recogida",
				placeholder: "Referencia de salida (ej. portón blanco, frente a farmacia)",
				value: pickupNote,
				onChange: (e) => setPickupNote(e.target.value)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-1.5 flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs font-bold text-muted",
					children: "Elige destino en Carora"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => {
						if (pickingMapDest) {
							setCustomDest({ ...center });
							setPlaceId(null);
							setPickingMapDest(false);
							toast.success(`Destino fijado en ${placeLabel(center)}`);
						} else {
							setPickingMapDest(true);
							toast("Mueve el mapa hasta tu destino y pulsa 'Confirmar este punto'");
						}
					},
					className: "text-xs font-bold text-ink underline",
					children: pickingMapDest ? "Confirmar este punto del mapa" : "O fijar destino en el mapa"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "chip-row max-h-28 overflow-y-auto py-0.5",
				children: PLACES.map((item) => {
					const active = !customDest && item.id === placeId;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						"aria-pressed": active,
						className: active ? "rounded-full bg-ink px-3 py-1.5 text-xs font-bold text-paper shadow-sm" : "rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink",
						onClick: () => {
							setCustomDest(null);
							setPickingMapDest(false);
							setPlaceId(item.id);
							if (!point.trim()) setPoint(`Cerca de ${item.hint}`);
						},
						children: [item.name, item.premiere ? " · $1" : ""]
					}, item.id);
				})
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				className: "field",
				"aria-label": "Punto de referencia del destino",
				placeholder: tierId === "encomienda" ? "Quién recibe y teléfono (ej. María 0414-5551234, frente a plaza)" : "Referencia del destino (ej. frente a emergencias, portón azul)",
				value: point,
				onChange: (e) => setPoint(e.target.value)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-1.5 text-xs",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setNeedHelmet(!needHelmet),
					className: needHelmet ? "rounded-full bg-brand/30 px-3 py-1 font-bold text-ink" : "rounded-full border border-line bg-paper px-3 py-1 font-medium text-muted",
					children: needHelmet ? "✓ Casco extra requerido" : "Casco propio"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setHasBag(!hasBag),
					className: hasBag ? "rounded-full bg-brand/30 px-3 py-1 font-bold text-ink" : "rounded-full border border-line bg-paper px-3 py-1 font-medium text-muted",
					children: hasBag ? "✓ Llevo bolso / compra" : "Sin equipaje extra"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-3 gap-1.5",
				children: SERVICE_TIERS.map((t) => {
					const active = t.id === tierId;
					const tFare = destPoint ? Math.round((baseFare + t.extraUsd) * 100) / 100 : 1.5 + t.extraUsd;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setTierId(t.id),
						className: active ? "flex flex-col items-start rounded-2xl border-2 border-ink bg-paper p-2.5 text-left shadow-sm" : "flex flex-col items-start rounded-2xl border border-line bg-sheet p-2.5 text-left",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex w-full items-center justify-between",
								children: [t.id === "encomienda" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "size-4 text-ink" }) : t.id === "elite" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-4 text-brand" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bike, { className: "size-4 text-ink" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] font-bold text-muted",
									children: t.badge
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-1 text-xs font-extrabold text-ink",
								children: t.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-display text-sm font-extrabold tabular-nums text-ink",
								children: formatUsd(tFare)
							})
						]
					}, t.id);
				})
			}),
			destPoint && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RouteHazardsSummary, {
				route,
				roadReports,
				isRaining: weather.isRaining,
				onOpenRoadModal
			}),
			destPoint && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between rounded-2xl bg-paper px-3.5 py-2.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs font-semibold text-muted",
					children: [
						formatKm(meters),
						" hasta ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-ink",
							children: destName
						}),
						" · ~",
						adjustedEta,
						" ",
						"min",
						routeAnalysis.extraRainMinutes > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-signal",
							children: [
								" ",
								"(incluye +",
								routeAnalysis.extraRainMinutes,
								"m por lluvia/vía)"
							]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-2xl font-extrabold tabular-nums text-ink",
					children: pay === "CASH_VES" ? formatVes(vesOf(fare)) : formatUsd(fare)
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-right",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block text-xs font-bold text-muted",
						children: "Valor Exacto BCV"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-display text-base font-extrabold tabular-nums text-ink",
						children: pay === "CASH_VES" ? formatUsd(fare) : formatVes(vesOf(fare))
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block text-xs font-bold text-muted",
						children: "Método de pago local (Carora):"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-2 gap-1.5 sm:grid-cols-4",
						children: [
							["PAGO_MOVIL", "Pago Móvil"],
							["CASH_USD", "Efectivo USD"],
							["CASH_VES", "Efectivo Bs"],
							["ZELLE_WALLET", "Zelle / Wallet"]
						].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: pay === id ? "h-10 rounded-full bg-ink px-2 text-xs font-bold text-paper" : "h-10 rounded-full border border-line bg-paper px-2 text-xs font-semibold text-ink",
							onClick: () => setPay(id),
							children: label
						}, id))
					}),
					(pay === "CASH_USD" || pay === "CASH_VES") && destPoint && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl border border-line bg-paper p-2.5 text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-bold text-ink",
								children: "¿Con qué billete pagarás? (Para calcular tu vuelto exacto)"
							}), changeUsd > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-extrabold text-signal tabular-nums",
								children: [
									"Vuelto: ",
									formatUsd(changeUsd),
									" (",
									formatVes(vesOf(changeUsd)),
									")"
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-1.5 flex flex-wrap gap-1.5",
							children: [
								{
									label: `Exacto (${formatUsd(fare)})`,
									val: null
								},
								{
									label: "Billete $5",
									val: 5
								},
								{
									label: "Billete $10",
									val: 10
								},
								{
									label: "Billete $20",
									val: 20
								}
							].map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setCashBillUsd(b.val),
								className: cashBillUsd === b.val ? "rounded-full bg-brand px-2.5 py-1 text-[11px] font-extrabold text-ink" : "rounded-full border border-line bg-sheet px-2.5 py-1 text-[11px] font-semibold text-ink",
								children: b.label
							}, b.label))
						})]
					})
				]
			}),
			tooClose && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-semibold text-signal",
				children: "El destino está en el mismo punto de salida. Mueve el mapa o elige otro sector."
			}),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-semibold text-signal",
				children: error
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					disabled: !destPoint || tooClose || busy,
					className: "h-12 flex-1 rounded-full bg-brand text-base font-extrabold text-ink shadow-md disabled:opacity-40",
					onClick: () => {
						if (!destPoint) return;
						setBusy(true);
						const tags = [
							needHelmet ? "Casco extra" : "",
							hasBag ? "Lleva bolso" : "",
							tierId === "encomienda" ? "ENCOMIENDA" : "",
							(pay === "CASH_USD" || pay === "CASH_VES") && cashBillUsd && cashBillUsd > fare ? `Paga con $${cashBillUsd} (Vuelto $${changeUsd.toFixed(2)})` : ""
						].filter(Boolean).join(", ");
						const fullPickupNote = [pickupNote.trim(), tags].filter(Boolean).join(" · ");
						onRequest(destPoint, destName, fullPickupNote, pay, point.trim() || "Entrada principal", tierId, pay === "CASH_USD" || pay === "CASH_VES" ? cashBillUsd ?? fare : null).finally(() => setBusy(false));
					},
					children: busy ? "Disparando a las 5 motos…" : `Pedir ${tier.name}`
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": "Historial de carreras",
					onClick: () => setHistory(true),
					className: "grid size-12 shrink-0 place-items-center rounded-full border border-line bg-paper text-ink",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(History, { className: "size-5" })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between pt-0.5 text-[11px]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: onOpenFeedback,
					className: "font-bold text-ink underline",
					children: [
						"Feedback para Mejoras (",
						CENTRAL_CARORA_CONFIG.feedbackPhoneDisplay,
						")"
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: onReview,
					className: "font-semibold text-muted underline",
					children: [
						"Central (",
						CENTRAL_CARORA_CONFIG.developerEmail,
						")"
					]
				})]
			})
		]
	});
}
function TripCard({ trip, mine, weather, roadReports, onOpenRoadModal, onSync, onCancel }) {
	const route = useRapidez((s) => s.route);
	const [payRef, setPayRef] = (0, import_react.useState)(trip.payRef || "");
	const [showChat, setShowChat] = (0, import_react.useState)(trip.payMethod === "ZELLE_WALLET");
	const [uploadingProof, setUploadingProof] = (0, import_react.useState)(false);
	const [panicNote, setPanicNote] = (0, import_react.useState)(trip.panicked ? "Alerta SOS activa en Central Carora. Emergencias Lara: 171 / 911." : "");
	const meters = trip.driverLat != null && trip.driverLng != null ? haversine({
		lat: trip.driverLat,
		lng: trip.driverLng
	}, trip.status === "riding" ? {
		lat: trip.destLat,
		lng: trip.destLng
	} : {
		lat: trip.pickupLat,
		lng: trip.pickupLng
	}) : null;
	const routeAnalysis = analyzeRouteHazards(route, roadReports, weather.isRaining);
	const safetyPin = safetyPinOf(trip.id);
	const title = trip.status === "open" ? "Disparo simultáneo activo para las 5 motos…" : trip.status === "accepted" ? mine === "driver" ? "En camino a recoger al pasajero" : "Tu mototaxi va en camino" : trip.status === "arrived" ? mine === "driver" ? "Llegaste al punto de recogida" : "¡Tu mototaxi está en la puerta!" : trip.status === "riding" ? "En viaje hacia el destino (Ruta Estática)" : trip.status === "pay" ? "Llegaron al destino · Cierre y Pago" : "Carrera finalizada";
	const steps = [
		{
			key: "open",
			label: "Disparo"
		},
		{
			key: "accepted",
			label: "En camino"
		},
		{
			key: "arrived",
			label: "En puerta"
		},
		{
			key: "riding",
			label: "En viaje"
		},
		{
			key: "pay",
			label: "Pago"
		}
	];
	const currentStepIdx = Math.max(0, steps.findIndex((s) => s.key === trip.status));
	const shareUrl = typeof window !== "undefined" && trip.shareToken ? `${window.location.origin}/viaje/${trip.shareToken}` : "";
	const whatsappShareText = [
		`🛵 *Compartilhamento de Rota Familiar — Rapidez Carora*`,
		`📍 *Salida:* ${trip.pickupRef}`,
		`🏁 *Destino:* ${trip.destRef || "Carora"}`,
		trip.driverName ? `👤 *Piloto Catastrado:* ${trip.driverName} (${trip.driverModel} · Placa ${trip.driverPlate})` : `⏳ *Estado:* Disparo general a las 5 motos de la flota`,
		`🔐 *Código PIN de seguridad:* ${safetyPin}`,
		shareUrl ? `🔗 *Rastreo en vivo:* ${shareUrl}` : ""
	].filter(Boolean).join("\n");
	const whatsappShareHref = `https://wa.me/?text=${encodeURIComponent(whatsappShareText)}`;
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
		`🗺️ *Ubicación en Google Maps:* ${mapsUrl}`
	].join("\n");
	const panicWhatsappHref = `https://wa.me/${CENTRAL_CARORA_CONFIG.whatsappAdmin}?text=${encodeURIComponent(panicWhatsappText)}`;
	const vesAmount = vesOf(trip.fareUsd);
	const tenderedUsd = trip.cashTendered != null && trip.cashTendered > trip.fareUsd ? trip.cashTendered : null;
	const changeUsd = tenderedUsd ? Math.round((tenderedUsd - trip.fareUsd) * 100) / 100 : 0;
	const driverNetUsd = Math.round(trip.fareUsd * (1 - COMMISSION) * 100) / 100;
	const centralPagoMovilBlock = [
		`Pago Móvil Central Rapidez Carora`,
		`RIF: ${CENTRAL_CARORA_CONFIG.rif}`,
		`Banco: ${CENTRAL_CARORA_CONFIG.bankCode} (${CENTRAL_CARORA_CONFIG.bankName})`,
		`Teléfono: ${CENTRAL_CARORA_CONFIG.phone}`,
		`Monto exacto: ${formatVes(vesAmount)} (${formatUsd(trip.fareUsd)})`
	].join("\n");
	async function onUploadProof(file) {
		if (!file) return;
		setUploadingProof(true);
		try {
			const dataUrl = await shrink(file);
			await sendChat({ data: {
				tripId: trip.id,
				body: "📎 Comprobante de pago Zelle / Billetera Digital adjunto",
				attachmentPhoto: dataUrl
			} });
			await setTripStatus({ data: {
				tripId: trip.id,
				status: trip.status === "pay" ? "pay" : trip.status,
				paymentProof: dataUrl
			} });
			setShowChat(true);
			toast.success("Comprobante subido al chat de la corrida y enviado a Central");
			onSync();
		} catch (err) {
			toast.error(messageOf(err));
		} finally {
			setUploadingProof(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-5 gap-1",
				children: steps.map((s, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col items-center gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: idx <= currentStepIdx ? "h-1.5 w-full rounded-full bg-brand" : "h-1.5 w-full rounded-full bg-line" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: idx === currentStepIdx ? "text-[10px] font-extrabold text-ink" : "text-[10px] font-medium text-muted",
						children: s.label
					})]
				}, s.key))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-2xl font-extrabold",
					children: title
				}), trip.status === "open" && mine === "passenger" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted",
					children: "Alerta enviada en simultáneo a los 5 motoristas de Carora (el primero en aceptar toma la corrida)…"
				})] }), meters != null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "shrink-0 rounded-2xl bg-paper px-3 py-1.5 text-right",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block font-display text-lg font-extrabold tabular-nums text-ink",
						children: formatKm(meters)
					}), (trip.status === "accepted" || trip.status === "riding") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "block text-[11px] font-semibold text-muted",
						children: [
							"~",
							etaMin(meters) + routeAnalysis.extraRainMinutes,
							" min"
						]
					})]
				})]
			}),
			["accepted", "arrived"].includes(trip.status) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between rounded-2xl bg-ink px-3.5 py-2 text-xs text-paper",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "inline-flex items-center gap-1.5 font-semibold",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyRound, { className: "size-4 text-brand" }), mine === "passenger" ? "Código PIN de seguridad para subir:" : "Confirma este PIN con el pasajero:"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-display text-base font-extrabold tracking-widest text-brand tabular-nums",
					children: safetyPin
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RouteHazardsSummary, {
				route,
				roadReports,
				isRaining: weather.isRaining,
				onOpenRoadModal
			}),
			trip.driverName && mine === "passenger" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl border border-line bg-paper p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-display text-base font-extrabold text-ink",
								children: trip.driverName
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "inline-flex items-center gap-0.5 text-xs font-bold text-ink",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "size-3 fill-current text-brand" }),
									" ",
									trip.driverRating.toFixed(2)
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs font-semibold text-muted",
							children: [
								trip.driverModel,
								" · Cédula ",
								trip.driverCedula
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-0.5 inline-flex items-center gap-1 text-[11px] font-bold text-ink",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "size-3.5 text-brand" }), "Validado Presencialmente · Frota Oficial Carora"]
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-right",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "inline-block rounded-lg border-2 border-ink bg-brand px-2.5 py-1 font-display text-sm font-extrabold tracking-widest text-ink",
							children: trip.driverPlate
						})
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2.5 grid grid-cols-3 gap-1.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setShowChat(!showChat),
							className: "flex h-9 items-center justify-center gap-1 rounded-xl bg-ink px-2 text-xs font-bold text-paper",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, { className: "size-3.5" }), "Chat / Print"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: `https://wa.me/58${trip.driverPhone.replace(/\D/g, "").replace(/^0/, "")}?text=${encodeURIComponent(`Hola ${trip.driverName}, soy tu pasajero en Rapidez Carora (${trip.pickupRef}). Mi PIN es ${safetyPin}.`)}`,
							target: "_blank",
							rel: "noopener noreferrer",
							className: "flex h-9 items-center justify-center gap-1 rounded-xl border border-line bg-sheet px-2 text-xs font-bold text-ink",
							children: "WhatsApp Moto"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: `tel:${trip.driverPhone}`,
							className: "flex h-9 items-center justify-center gap-1 rounded-xl border border-line bg-sheet px-2 text-xs font-bold text-ink",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "size-3.5" }), "Llamar"]
						})
					]
				})]
			}),
			mine === "driver" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-2xl border border-line bg-paper p-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-xs font-bold text-muted",
						children: ["Pasajero MVP verificado · Tu ganancia 90%: ", formatUsd(driverNetUsd)]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-lg font-extrabold",
						children: trip.passengerName
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-1.5",
						children: [trip.passengerPhone && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: `https://wa.me/58${trip.passengerPhone.replace(/\D/g, "").replace(/^0/, "")}?text=${encodeURIComponent(`Hola ${trip.passengerName}, soy tu mototaxista de Rapidez Carora.`)}`,
							target: "_blank",
							rel: "noopener noreferrer",
							className: "flex h-9 items-center rounded-xl border border-line bg-sheet px-2.5 text-xs font-bold text-ink",
							children: "WhatsApp"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setShowChat(!showChat),
							className: "flex h-9 items-center gap-1.5 rounded-xl bg-ink px-3 text-xs font-bold text-paper",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, { className: "size-3.5" }), " Chat"]
						})]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl bg-paper px-3 py-2.5 text-xs",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-bold text-muted",
							children: "Recogida: "
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-semibold text-ink",
							children: trip.pickupRef
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-bold text-muted",
							children: "Destino: "
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-semibold text-ink",
							children: trip.destRef || "Carora"
						})] })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "shrink-0 text-right",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-display text-base font-extrabold tabular-nums text-ink",
								children: formatUsd(trip.fareUsd)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold tabular-nums text-muted",
								children: formatVes(vesAmount)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px] font-bold text-ink",
								children: trip.payMethod === "PAGO_MOVIL" ? "Pago Móvil" : trip.payMethod === "ZELLE_WALLET" ? "Zelle / Wallet" : trip.payMethod === "CASH_VES" ? "Efectivo Bs" : "Efectivo USD"
							})
						]
					})]
				}), (trip.payMethod === "CASH_USD" || trip.payMethod === "CASH_VES") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 flex items-center justify-between rounded-xl bg-sheet px-2.5 py-1.5 text-[11px]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-semibold text-ink",
						children: tenderedUsd ? `Pasajero entrega billete de ${formatUsd(tenderedUsd)} (${formatVes(vesOf(tenderedUsd))})` : `Pago en efectivo exacto: ${formatUsd(trip.fareUsd)} (${formatVes(vesAmount)})`
					}), changeUsd > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "font-extrabold text-signal tabular-nums",
						children: [
							"Vuelto a dar: ",
							formatUsd(changeUsd),
							" / ",
							formatVes(vesOf(changeUsd))
						]
					})]
				})]
			}),
			trip.status === "riding" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RideMeter, {
				startedAt: trip.startedAt,
				riddenM: trip.riddenM
			}),
			showChat && [
				"accepted",
				"arrived",
				"riding",
				"pay"
			].includes(trip.status) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RideChat, {
				tripId: trip.id,
				onSync
			}),
			trip.payMethod === "PAGO_MOVIL" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl border border-line bg-paper p-3 text-xs",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-extrabold text-ink",
							children: "Pago Móvil · Central Rapidez Carora"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => void copyText("Datos Pago Móvil Central", centralPagoMovilBlock),
							className: "inline-flex items-center gap-1 font-bold text-ink underline",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-3.5" }), " Copiar datos"]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 grid grid-cols-2 gap-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-xl bg-sheet p-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block text-[10px] text-muted",
									children: "Banco Central"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "font-bold text-ink",
									children: [
										CENTRAL_CARORA_CONFIG.bankCode,
										" · ",
										CENTRAL_CARORA_CONFIG.bankName
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between rounded-xl bg-sheet p-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block text-[10px] text-muted",
									children: "RIF Central"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold text-ink",
									children: CENTRAL_CARORA_CONFIG.rif
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => void copyText("RIF Central", CENTRAL_CARORA_CONFIG.rif),
									className: "p-1 text-ink",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-3.5" })
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between rounded-xl bg-sheet p-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block text-[10px] text-muted",
									children: "Teléfono Central"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold tabular-nums text-ink",
									children: CENTRAL_CARORA_CONFIG.phone
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => void copyText("Teléfono Central", CENTRAL_CARORA_CONFIG.phoneRaw),
									className: "p-1 text-ink",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-3.5" })
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between rounded-xl bg-sheet p-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block text-[10px] text-muted",
									children: "Monto exacto Bs"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold tabular-nums text-ink",
									children: formatVes(vesAmount)
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => void copyText("Monto en Bs", vesAmount.toFixed(2)),
									className: "p-1 text-ink",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-3.5" })
								})]
							})
						]
					}),
					trip.driverName && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1.5 text-[11px] text-muted",
						children: [
							"Pago directo al piloto (",
							trip.driverName,
							"): ",
							trip.driverBankCode,
							" ",
							trip.driverBank,
							" · Tel ",
							prettyPhone(trip.driverBankPhone || trip.driverPhone),
							" · C.I. ",
							trip.driverCedula
						]
					}),
					trip.adminPayVerified && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1.5 rounded-xl bg-brand/30 px-2.5 py-1 text-[11px] font-extrabold text-ink",
						children: [
							"✓ Referencia #",
							trip.payRef,
							" validada por la Administración Central"
						]
					})
				]
			}),
			trip.payMethod === "ZELLE_WALLET" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl border border-line bg-paper p-3 text-xs",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-extrabold text-ink",
							children: "Zelle / Billetera Digital Central"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => void copyText("Correo Zelle", CENTRAL_CARORA_CONFIG.zelleEmail),
							className: "inline-flex items-center gap-1 font-bold text-ink underline",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-3.5" }), " Copiar correo"]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-[11px] text-muted",
						children: [
							"Titular: ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-bold text-ink",
								children: CENTRAL_CARORA_CONFIG.zelleHolder
							}),
							" ",
							"· ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-bold text-ink",
								children: CENTRAL_CARORA_CONFIG.zelleEmail
							}),
							" · Monto:",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-bold text-ink",
								children: formatUsd(trip.fareUsd)
							})
						]
					}),
					trip.paymentProof && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block text-[10px] font-bold text-muted",
							children: "Comprobante enviado al chat de la corrida:"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: trip.paymentProof,
							alt: "Comprobante Zelle / Wallet",
							className: "mt-1 h-24 w-full rounded-xl border border-line object-cover"
						})]
					}),
					mine === "passenger" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "mt-2 flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-ink px-3 text-xs font-bold text-paper",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-3.5" }),
							uploadingProof ? "Subiendo captura…" : trip.paymentProof ? "Actualizar captura de comprobante en el chat" : "Subir captura (print) de comprobante al chat",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "file",
								accept: "image/*",
								className: "sr-only",
								onChange: (e) => void onUploadProof(e.target.files?.[0])
							})
						]
					})
				]
			}),
			panicNote && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-2xl bg-signal px-3 py-2 text-xs font-bold text-paper",
				children: panicNote
			}),
			mine === "driver" && trip.status === "accepted" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "h-12 rounded-full bg-brand font-extrabold text-ink shadow-md",
				onClick: () => void setTripStatus({ data: {
					tripId: trip.id,
					status: "arrived"
				} }).then(onSync),
				children: "Ya llegué al punto de recogida"
			}),
			mine === "driver" && trip.status === "arrived" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "h-12 rounded-full bg-brand font-extrabold text-ink shadow-md",
				onClick: () => void setTripStatus({ data: {
					tripId: trip.id,
					status: "riding"
				} }).then(onSync),
				children: [
					"Pasajero a bordo (PIN ",
					safetyPin,
					") · Iniciar viaje"
				]
			}),
			mine === "driver" && trip.status === "riding" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "h-12 rounded-full bg-brand font-extrabold text-ink shadow-md",
				onClick: () => void setTripStatus({ data: {
					tripId: trip.id,
					status: "pay"
				} }).then(onSync),
				children: "Llegamos al destino · Cobrar"
			}),
			mine === "passenger" && trip.status === "arrived" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "h-12 rounded-full bg-brand font-extrabold text-ink shadow-md",
				onClick: () => void setTripStatus({ data: {
					tripId: trip.id,
					status: "riding"
				} }).then(onSync),
				children: "Ya me subí a la moto · Iniciar viaje"
			}),
			mine === "passenger" && (trip.status === "pay" || trip.status === "riding") && trip.payMethod === "PAGO_MOVIL" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "field tabular-nums",
					inputMode: "numeric",
					maxLength: 12,
					placeholder: "Número de referencia Pago Móvil (4 a 12 dígitos)",
					value: payRef,
					onChange: (e) => setPayRef(e.target.value.replace(/\D/g, "").slice(0, 12))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					disabled: payRef.length < 4,
					className: "h-12 rounded-full bg-brand font-extrabold text-ink shadow-md disabled:opacity-40",
					onClick: () => void setTripStatus({ data: {
						tripId: trip.id,
						status: "pay",
						payRef
					} }).then(() => {
						toast.success("Referencia enviada para validación administrativa y del motorista");
						onSync();
					}),
					children: [
						"Enviar Referencia Pago Móvil (",
						formatVes(vesAmount),
						")"
					]
				})]
			}),
			mine === "passenger" && trip.status === "pay" && (trip.payMethod === "CASH_USD" || trip.payMethod === "CASH_VES" || trip.payMethod === "ZELLE_WALLET") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-semibold text-muted",
					children: trip.payMethod === "ZELLE_WALLET" ? "Tras subir la captura de Zelle/Wallet al chat, confirma el cierre:" : `Entrega en efectivo al conductor: ${trip.payMethod === "CASH_VES" ? formatVes(vesAmount) : formatUsd(trip.fareUsd)}${changeUsd > 0 ? ` (Recibes vuelto de ${formatUsd(changeUsd)})` : ""}`
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "h-12 rounded-full bg-brand font-extrabold text-ink shadow-md",
					onClick: () => void setTripStatus({ data: {
						tripId: trip.id,
						status: "done"
					} }).then(() => {
						toast.success("¡Pago confirmado y viaje completado!");
						onSync();
					}),
					children: "Confirmar pago realizado · Finalizar"
				})]
			}),
			mine === "driver" && trip.status === "pay" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2",
				children: [
					trip.payRef && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "rounded-xl bg-paper p-2 text-center font-display text-xl font-extrabold tabular-nums",
						children: [
							"Ref. Pago Móvil: #",
							trip.payRef,
							trip.adminPayVerified ? " (Validado Central)" : ""
						]
					}),
					trip.paymentProof && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl bg-paper p-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block text-[10px] font-bold text-muted",
							children: "Comprobante Zelle / Wallet del pasajero:"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: trip.paymentProof,
							alt: "Comprobante",
							className: "mt-1 h-24 w-full rounded-lg object-cover"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted",
						children: [
							"Retención Piloto 90%: recibes neto",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-bold text-ink",
								children: formatUsd(driverNetUsd)
							}),
							" · Comisión Central (10%): ",
							formatUsd(Math.round(trip.fareUsd * .1 * 100) / 100),
							"."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "h-12 rounded-full bg-ink font-extrabold text-paper shadow-md",
						onClick: () => void setTripStatus({ data: {
							tripId: trip.id,
							status: "done"
						} }).then(() => {
							toast.success("Pago confirmado y carrera cerrada");
							onSync();
						}),
						children: [
							"Confirmar pago recibido (",
							formatUsd(trip.fareUsd),
							")"
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2",
				children: [shareUrl && [
					"open",
					"accepted",
					"arrived",
					"riding"
				].includes(trip.status) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
					href: whatsappShareHref,
					target: "_blank",
					rel: "noopener noreferrer",
					className: "flex h-10 items-center justify-center gap-1.5 rounded-full bg-ink px-3 text-xs font-bold text-paper whitespace-nowrap",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { className: "size-3.5" }), "Compartir Viaje (Familiar)"]
				}), [
					"accepted",
					"arrived",
					"riding",
					"pay"
				].includes(trip.status) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
					href: panicWhatsappHref,
					target: "_blank",
					rel: "noopener noreferrer",
					onClick: () => {
						raisePanic({ data: { tripId: trip.id } }).then(() => {
							setPanicNote(`Coordenadas GPS (${currentLat.toFixed(4)}, ${currentLng.toFixed(4)}) enviadas al WhatsApp del Admin Central.`);
							toast.error("Botón de Pánico activado: enviando GPS al WhatsApp de la Central");
						}).catch((err) => setPanicNote(messageOf(err)));
					},
					className: "flex h-10 items-center justify-center gap-1 rounded-full bg-signal px-2.5 text-xs font-bold text-paper whitespace-nowrap",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-3.5" }), " Pánico · WhatsApp Central"]
				})]
			}),
			[
				"open",
				"accepted",
				"arrived"
			].includes(trip.status) && mine === "passenger" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "h-9 text-xs font-semibold text-muted underline",
				onClick: onCancel,
				children: "Cancelar solicitud"
			})
		]
	});
}
function RateCard({ item, onDone }) {
	const aspects = item.asDriver ? [["puntual", "Puntualidad en el punto"], ["respeto", "Trato y respeto"]] : [
		["manejo", "Conducción segura en Carora"],
		["trato", "Amabilidad del mototaxista"],
		["casco", "Entregó casco extra limpio"]
	];
	const [scores, setScores] = (0, import_react.useState)(() => Object.fromEntries(aspects.map(([id]) => [id, 5])));
	const [sent, setSent] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)("");
	const stars = Math.max(1, Math.min(5, Math.round(aspects.reduce((sum, [id]) => sum + (scores[id] ?? 5), 0) / aspects.length)));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-2xl font-extrabold",
				children: "¡Viaje completado!"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs text-muted",
				children: [
					"Califica a ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-bold text-ink",
						children: item.otherName
					}),
					". Quienes mantienen más de 4.5 ★ tienen despacho prioritario en Carora."
				]
			}),
			aspects.map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-bold",
					children: label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-1",
					children: [
						1,
						2,
						3,
						4,
						5
					].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						"aria-label": `${n} de 5 en ${label}`,
						className: (scores[id] ?? 0) >= n ? "h-10 flex-1 rounded-full bg-brand text-sm font-extrabold text-ink" : "h-10 flex-1 rounded-full bg-paper text-sm font-semibold text-muted",
						onClick: () => setScores((prev) => ({
							...prev,
							[id]: n
						})),
						children: [n, " ★"]
					}, n))
				})]
			}, id)),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-medium text-signal",
				children: error
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				disabled: sent,
				className: "h-12 rounded-full bg-ink font-extrabold text-paper disabled:opacity-40",
				onClick: () => {
					setSent(true);
					rateTrip({ data: {
						tripId: item.tripId,
						stars,
						note: aspects.map(([id, label]) => `${label} ${scores[id] ?? 5}`).join(", ")
					} }).then(() => {
						toast.success("¡Gracias por calificar tu viaje en Carora!");
						onDone();
					}).catch((err) => {
						setSent(false);
						setError(messageOf(err));
					});
				},
				children: sent ? "Enviando…" : `Enviar calificación (${stars} ★)`
			})
		]
	});
}
function RideMeter({ startedAt, riddenM }) {
	const [now, setNow] = (0, import_react.useState)(() => Date.now());
	(0, import_react.useEffect)(() => {
		const id = setInterval(() => setNow(Date.now()), 1e3);
		return () => clearInterval(id);
	}, []);
	const seconds = startedAt ? Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1e3)) : 0;
	const clock = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between rounded-2xl bg-ink px-3.5 py-2 text-paper",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-xs font-semibold tracking-wide text-brand",
			children: "Ruta Estática · GPS Económico (8–10s)"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "font-display text-lg font-extrabold tabular-nums",
			children: [
				clock,
				" · ",
				formatKm(riddenM)
			]
		})]
	});
}
function RideChat({ tripId, onSync }) {
	const [lines, setLines] = (0, import_react.useState)([]);
	const [text, setText] = (0, import_react.useState)("");
	const [uploading, setUploading] = (0, import_react.useState)(false);
	const presets = [
		"Ya salgo a la puerta",
		"Estoy en el punto exacto",
		"Tengo Pago Móvil listo",
		"Envío comprobante Zelle por aquí"
	];
	async function load() {
		try {
			setLines(await listChat({ data: { tripId } }));
		} catch {}
	}
	(0, import_react.useEffect)(() => {
		load();
		const id = setInterval(() => void load(), 3e3);
		return () => clearInterval(id);
	}, [tripId]);
	async function send(body, attachmentPhoto) {
		const clean = body.trim();
		if (!clean && !attachmentPhoto) return;
		await sendChat({ data: {
			tripId,
			body: clean,
			attachmentPhoto
		} });
		setText("");
		await load();
		onSync?.();
	}
	async function onChatPhoto(file) {
		if (!file) return;
		setUploading(true);
		try {
			await send("📎 Captura de comprobante de pago", await shrink(file));
			toast.success("Captura de comprobante enviada al chat de la corrida");
		} catch (err) {
			toast.error(messageOf(err));
		} finally {
			setUploading(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-2 rounded-2xl border border-line bg-paper p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-extrabold text-muted",
					children: "Chat interno de la corrida (Soporta captura Zelle / Pago Móvil)"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "inline-flex cursor-pointer items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-[11px] font-extrabold text-ink",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-3" }),
						uploading ? "Subiendo…" : "Subir Print / Comprobante",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "file",
							accept: "image/*",
							className: "sr-only",
							onChange: (e) => void onChatPhoto(e.target.files?.[0])
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-1.5",
				children: presets.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "rounded-full border border-line bg-sheet px-2.5 py-1 text-xs font-semibold text-ink",
					onClick: () => void send(item),
					children: item
				}, item))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "max-h-36 space-y-1.5 overflow-y-auto py-1",
				children: [lines.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted",
					children: "Escribe un mensaje o sube la captura de pantalla del pago arriba."
				}), lines.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: line.mine ? "ml-auto max-w-[85%] rounded-2xl bg-ink px-3 py-1.5 text-xs font-semibold text-paper" : "mr-auto max-w-[85%] rounded-2xl bg-brand/30 px-3 py-1.5 text-xs font-semibold text-ink",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: line.body }), line.attachmentPhoto && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: line.attachmentPhoto,
						alt: "Comprobante en chat",
						className: "mt-1.5 max-h-36 w-full rounded-xl border border-line object-cover"
					})]
				}, line.id))]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "field h-10 text-sm",
					"aria-label": "Mensaje",
					placeholder: "Escribe un mensaje…",
					value: text,
					onChange: (e) => setText(e.target.value),
					onKeyDown: (e) => {
						if (e.key === "Enter") send(text);
					}
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "h-10 rounded-full bg-ink px-4 text-xs font-bold text-paper",
					onClick: () => void send(text),
					children: "Enviar"
				})]
			})
		]
	});
}
function HistoryList({ onClose }) {
	const [items, setItems] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		tripHistory({ data: {} }).then(setItems).catch((err) => setError(messageOf(err)));
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-2xl font-extrabold",
					children: "Historial de carreras"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "rounded-full bg-paper px-3 py-1.5 text-xs font-bold text-ink",
					onClick: onClose,
					children: "Volver"
				})]
			}),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-medium text-signal",
				children: error
			}),
			items && items.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Todavía no hay carreras finalizadas en tu cuenta."
			}),
			items?.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "rounded-2xl bg-paper px-3.5 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-semibold text-ink",
						children: item.dest
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-display text-base font-extrabold tabular-nums text-ink",
						children: formatUsd(item.fareUsd)
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs text-muted",
					children: [
						item.when,
						" · ",
						formatKm(item.distanceM),
						" · ",
						formatVes(vesOf(item.fareUsd)),
						item.commissionUsd > 0 ? ` · comisión 10%: ${formatUsd(item.commissionUsd)}` : ""
					]
				})]
			}, item.id))
		]
	});
}
function OfferPanel({ offer, onSync }) {
	const [now, setNow] = (0, import_react.useState)(() => Date.now());
	const [error, setError] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		const id = setInterval(() => setNow(Date.now()), 250);
		return () => clearInterval(id);
	}, [offer.id, offer.offerUntil]);
	const left = Math.max(1, Math.ceil(((offer.offerUntil ?? Date.now() + 15e3) - now) / 1e3));
	const width = Math.min(100, left / Math.round(OFFER_MS / 1e3) * 100);
	const driverNet = Math.round(offer.fareUsd * (1 - COMMISSION) * 100) / 100;
	const changeUsd = offer.cashTendered && offer.cashTendered > offer.fareUsd ? Math.round((offer.cashTendered - offer.fareUsd) * 100) / 100 : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl bg-ink p-3.5 text-paper shadow-xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs font-extrabold tracking-wide text-brand",
					children: [
						"¡Disparo Simultáneo (Frota 5)! · ",
						left,
						"s"
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "rounded-full bg-paper/15 px-2 py-0.5 text-[11px] font-bold text-paper",
					children: offer.payMethod === "PAGO_MOVIL" ? "Pago Móvil" : offer.payMethod === "ZELLE_WALLET" ? "Zelle / Wallet" : offer.payMethod === "CASH_VES" ? "Efectivo Bs" : "Efectivo USD"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 h-2 overflow-hidden rounded-full bg-paper/20",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-full bg-brand transition-all",
					style: { width: `${width}%` }
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2.5 space-y-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-paper/75",
						children: [
							"Pasajero verificado: ",
							offer.passengerName,
							" · El primero en aceptar asume la corrida"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-base font-extrabold",
						children: ["Recoger en: ", offer.pickupRef]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-paper/90",
						children: ["Destino: ", offer.destRef || "Centro de Carora"]
					}),
					changeUsd > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "rounded-lg bg-brand/20 px-2 py-1 text-xs font-bold text-brand",
						children: [
							"Efectivo: Pasajero paga con $",
							offer.cashTendered?.toFixed(2),
							" → Preparar vuelto de",
							" ",
							formatUsd(changeUsd),
							" (",
							formatVes(vesOf(changeUsd)),
							")"
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 flex items-baseline justify-between border-t border-paper/15 pt-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "font-display text-2xl font-extrabold tabular-nums text-brand",
					children: [
						formatUsd(offer.fareUsd),
						" (",
						formatVes(vesOf(offer.fareUsd)),
						")"
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "block text-[11px] font-bold text-paper/80",
					children: [
						"Tu ganancia neta (90%): ",
						formatUsd(driverNet),
						" · Central (10%):",
						" ",
						formatUsd(offer.fareUsd - driverNet)
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs font-bold tabular-nums",
					children: formatKm(offer.distanceM)
				})]
			}),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-xs font-medium text-brand",
				children: error
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 grid grid-cols-2 gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					disabled: busy !== "",
					className: "h-11 rounded-full bg-paper font-bold text-ink disabled:opacity-40",
					onClick: () => {
						setBusy("no");
						declineTrip({ data: { tripId: offer.id } }).then(onSync).catch((err) => setError(messageOf(err))).finally(() => setBusy(""));
					},
					children: "Pasar"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					disabled: busy !== "",
					className: "h-11 rounded-full bg-brand font-extrabold text-ink disabled:opacity-40",
					onClick: () => {
						setBusy("yes");
						acceptTrip({ data: { tripId: offer.id } }).then(() => {
							toast.success("¡Tomaste la carrera! Dirígete al punto de recogida.");
							onSync();
						}).catch((err) => setError(messageOf(err))).finally(() => setBusy(""));
					},
					children: "Aceptar carrera (Pesca)"
				})]
			})
		]
	});
}
function DriverDesk({ profile, online, ecoGps, onToggleEco, offer, trip, pendingRate, weather, roadReports, error, onSync, onOpenRoadModal, onOpenFeedback, onOnline, onPin, onSelectHotspot, onReview }) {
	const [history, setHistory] = (0, import_react.useState)(false);
	if (history) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HistoryList, { onClose: () => setHistory(false) });
	if (trip) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TripCard, {
		trip,
		mine: "driver",
		weather,
		roadReports,
		onOpenRoadModal,
		onSync,
		onCancel: () => void 0
	});
	if (!offer && pendingRate) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RateCard, {
		item: pendingRate,
		onDone: onSync
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WeatherAndTrafficBar, {
				weather,
				reportsCount: roadReports.length,
				ecoGps,
				onToggleEco,
				onOpenRoadModal
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "inline-flex items-center gap-1 text-xs font-extrabold text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "size-3.5 text-brand" }), "Frota Inicial Carora (5 Motos) · Retención 90% Piloto"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-2xl font-extrabold",
						children: profile.fullName
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs font-semibold text-muted",
						children: [
							profile.model,
							" · Placa ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-extrabold text-ink",
								children: profile.plate
							}),
							" ",
							"· ",
							profile.licenseGrade
						]
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					role: "switch",
					"aria-checked": online,
					"aria-label": online ? "Pasar a desconectado" : "Pasar a en línea",
					onClick: () => onOnline(!online),
					className: online ? "relative h-8 w-14 shrink-0 rounded-full bg-brand" : "relative h-8 w-14 shrink-0 rounded-full bg-line",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: online ? "absolute top-1 right-1 size-6 rounded-full bg-ink" : "absolute top-1 left-1 size-6 rounded-full bg-ink" })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-3 gap-2 rounded-2xl bg-paper p-3 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block text-[10px] font-bold text-muted",
						children: "Estado GPS (8–10s)"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs font-extrabold text-ink",
						children: online ? "Livre · En Línea" : "Offline"
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block text-[10px] font-bold text-muted",
						children: "Saldo Central (10%)"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-display text-sm font-extrabold tabular-nums text-ink",
						children: formatUsd(profile.saldoUsd)
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block text-[10px] font-bold text-muted",
						children: "Comisión Piloto"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "font-display text-sm font-extrabold tabular-nums text-ink",
						children: ["90% · ", profile.rating > 0 ? `${profile.rating.toFixed(1)} ★` : "5.0 ★"]
					})] })
				]
			}),
			offer && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfferPanel, {
				offer,
				onSync
			}),
			!offer && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2 rounded-2xl border border-line bg-paper/70 p-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-extrabold text-ink",
							children: "Zonas de Espera Estratégicas (Hotspots Carora)"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[10px] font-bold text-muted",
							children: "Evita dispersión"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-3 gap-1.5",
						children: CARORA_HOTSPOTS.map((hs) => {
							const active = profile.hotspotId === hs.id;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => onSelectHotspot(hs),
								className: active ? "rounded-xl bg-ink px-2 py-2 text-left text-[11px] font-bold text-paper" : "rounded-xl border border-line bg-sheet px-2 py-2 text-left text-[11px] font-semibold text-ink",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block truncate font-extrabold",
									children: hs.shortName
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "block text-[10px] opacity-80",
									children: [
										"Meta: ",
										hs.targetMotos,
										" motos"
									]
								})]
							}, hs.id);
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2 pt-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: onPin,
							className: "flex h-10 items-center justify-center gap-1.5 rounded-full bg-ink px-3 text-xs font-bold text-paper whitespace-nowrap",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "size-3.5" }), " Fijar mi GPS aquí"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: onOpenRoadModal,
							className: "flex h-10 items-center justify-center gap-1.5 rounded-full border border-line bg-sheet px-3 text-xs font-bold text-ink whitespace-nowrap",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigation, { className: "size-3.5" }), " Radar Vial / Lluvia"]
						})]
					})
				]
			}),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-medium text-signal",
				children: error
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between pt-1 text-xs",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "font-bold text-muted underline",
						onClick: () => setHistory(true),
						children: "Mis carreras (90%)"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "font-bold text-ink underline",
						onClick: onOpenFeedback,
						children: [
							"Feedback (",
							CENTRAL_CARORA_CONFIG.feedbackPhoneDisplay,
							")"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "font-bold text-muted underline",
						onClick: onReview,
						children: "Dashboard Central"
					})
				]
			})
		]
	});
}
function MvpFeedbackDrawer({ onClose, onDone }) {
	const [queTeParecio, setQueTeParecio] = (0, import_react.useState)("Muy buena y rápida para Carora");
	const [gustoDiseno, setGustoDiseno] = (0, import_react.useState)("Sí, el diseño es claro y fácil de usar");
	const [erroresEncontraste, setErroresEncontraste] = (0, import_react.useState)("Ninguno hasta ahora");
	const [indicariasAlguien, setIndicariasAlguien] = (0, import_react.useState)("Sí, la recomendaría a familiares y amigos en Carora");
	const [sending, setSending] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)("");
	const whatsappFeedbackHref = buildFeedbackWhatsappUrl({
		queTeParecio,
		gustoDiseno,
		erroresEncontraste,
		indicariasAlguien
	});
	const combinedBody = [
		`1. ¿Qué te pareció?: ${queTeParecio}`,
		`2. ¿Te gustó el diseño de la aplicación?: ${gustoDiseno}`,
		`3. ¿Qué errores encontraste?: ${erroresEncontraste}`,
		`4. ¿Indicarías a alguien?: ${indicariasAlguien}`
	].join(" | ");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-xs font-extrabold text-muted",
					children: ["Feedback para Mejoras · WhatsApp ", CENTRAL_CARORA_CONFIG.feedbackPhoneDisplay]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-2xl font-extrabold",
					children: "Evaluación de Rapidez Carora"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onClose,
					className: "rounded-full bg-paper px-3 py-1.5 text-xs font-bold text-ink",
					children: "Volver"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs text-muted",
				children: [
					"Responde estas 4 preguntas y envíalas directo al WhatsApp",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-extrabold text-ink",
						children: CENTRAL_CARORA_CONFIG.feedbackPhoneDisplay
					}),
					" ",
					"y al correo del desarrollador (",
					CENTRAL_CARORA_CONFIG.developerEmail,
					"):"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2.5 rounded-2xl border border-line bg-paper p-3 text-xs",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "block font-extrabold text-ink",
								children: "1. ¿Qué te pareció?"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex flex-wrap gap-1",
								children: [
									"Excelente iniciativa para Carora",
									"Muy buena y rápida",
									"Práctica y económica"
								].map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setQueTeParecio(opt),
									className: queTeParecio === opt ? "rounded-full bg-ink px-2.5 py-1 text-[10px] font-bold text-paper" : "rounded-full border border-line bg-sheet px-2.5 py-1 text-[10px] font-semibold text-ink",
									children: opt
								}, opt))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "field h-9 text-xs",
								placeholder: "¿Qué te pareció la aplicación?",
								value: queTeParecio,
								onChange: (e) => setQueTeParecio(e.target.value)
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "block font-extrabold text-ink",
								children: "2. ¿Te gustó el diseño de la aplicación?"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex flex-wrap gap-1",
								children: [
									"Sí, me gustó mucho el diseño",
									"Claro, moderno y fácil de usar",
									"Me gustaría mejorar detalles"
								].map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setGustoDiseno(opt),
									className: gustoDiseno === opt ? "rounded-full bg-ink px-2.5 py-1 text-[10px] font-bold text-paper" : "rounded-full border border-line bg-sheet px-2.5 py-1 text-[10px] font-semibold text-ink",
									children: opt
								}, opt))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "field h-9 text-xs",
								placeholder: "¿Te gustó el diseño de la aplicación?",
								value: gustoDiseno,
								onChange: (e) => setGustoDiseno(e.target.value)
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "block font-extrabold text-ink",
								children: "3. ¿Qué errores encontraste?"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex flex-wrap gap-1",
								children: [
									"Ninguno hasta ahora",
									"Detalle en el mapa / GPS",
									"Detalle en registro o pagos"
								].map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setErroresEncontraste(opt),
									className: erroresEncontraste === opt ? "rounded-full bg-ink px-2.5 py-1 text-[10px] font-bold text-paper" : "rounded-full border border-line bg-sheet px-2.5 py-1 text-[10px] font-semibold text-ink",
									children: opt
								}, opt))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "field h-9 text-xs",
								placeholder: "Describe si encontraste algún error o qué mejorarías…",
								value: erroresEncontraste,
								onChange: (e) => setErroresEncontraste(e.target.value)
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "block font-extrabold text-ink",
								children: "4. ¿Indicarías a alguien?"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex flex-wrap gap-1",
								children: [
									"¡Sí, a familiares y amigos en Carora!",
									"Sí, a toda la ciudad",
									"Sí, a motoristas conocidos"
								].map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setIndicariasAlguien(opt),
									className: indicariasAlguien === opt ? "rounded-full bg-ink px-2.5 py-1 text-[10px] font-bold text-paper" : "rounded-full border border-line bg-sheet px-2.5 py-1 text-[10px] font-semibold text-ink",
									children: opt
								}, opt))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "field h-9 text-xs",
								placeholder: "¿Indicarías la aplicación a alguien?",
								value: indicariasAlguien,
								onChange: (e) => setIndicariasAlguien(e.target.value)
							})
						]
					})
				]
			}),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-semibold text-signal",
				children: error
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
				href: whatsappFeedbackHref,
				target: "_blank",
				rel: "noopener noreferrer",
				onClick: () => {
					submitMvpFeedback({ data: {
						category: `WhatsApp ${CENTRAL_CARORA_CONFIG.feedbackPhoneDisplay}`,
						body: combinedBody
					} });
				},
				className: "flex h-12 items-center justify-center gap-2 rounded-full bg-brand px-4 text-sm font-extrabold text-ink shadow-md",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { className: "size-4 shrink-0" }),
					"Enviar a WhatsApp (",
					CENTRAL_CARORA_CONFIG.feedbackPhoneDisplay,
					")"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				disabled: sending,
				onClick: () => {
					setSending(true);
					setError("");
					submitMvpFeedback({ data: {
						category: "Encuesta 4 Preguntas",
						body: combinedBody
					} }).then(() => {
						toast.success(`Feedback enviado al panel y a ${CENTRAL_CARORA_CONFIG.developerEmail}`);
						onDone();
					}).catch((err) => setError(messageOf(err))).finally(() => setSending(false));
				},
				className: "h-10 rounded-full bg-ink text-xs font-bold text-paper disabled:opacity-40",
				children: sending ? "Enviando…" : `Guardar y enviar copia a ${CENTRAL_CARORA_CONFIG.developerEmail}`
			})
		]
	});
}
function Review({ weather, onClose }) {
	const [key, setKey] = (0, import_react.useState)("Carora2026");
	const [items, setItems] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)("");
	const [cedula, setCedula] = (0, import_react.useState)("");
	const [note, setNote] = (0, import_react.useState)("");
	const [panics, setPanics] = (0, import_react.useState)([]);
	const [week, setWeek] = (0, import_react.useState)([]);
	const [fleet, setFleet] = (0, import_react.useState)([]);
	const [metrics, setMetrics] = (0, import_react.useState)(null);
	const [audit, setAudit] = (0, import_react.useState)([]);
	const [feedbacks, setFeedbacks] = (0, import_react.useState)([]);
	const load = (0, import_react.useCallback)(async (next = key) => {
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
	}, [key]);
	(0, import_react.useEffect)(() => {
		load("Carora2026");
	}, [load]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs font-extrabold text-muted",
					children: "beisander2@gmail.com · Central Rapidez Carora"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-2xl font-extrabold",
					children: "Painel de Monitoramento (5 Motos)"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onClose,
					className: "rounded-full bg-paper px-3 py-1.5 text-xs font-bold text-ink",
					children: "Volver"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "field h-10 text-sm",
					type: "password",
					placeholder: "Clave de Central (Carora2026)",
					value: key,
					onChange: (e) => setKey(e.target.value)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "h-10 shrink-0 rounded-full bg-ink px-4 text-xs font-bold text-paper",
					onClick: () => void load(),
					children: "Actualizar"
				})]
			}),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-medium text-signal",
				children: error
			}),
			panics.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl bg-signal p-3 text-paper",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-extrabold",
					children: "Alertas de Botón de Pánico Operacional Activas"
				}), panics.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-xs font-semibold",
					children: [
						item.who,
						" (",
						item.phone,
						") · ",
						item.pickup,
						" → ",
						item.dest
					]
				}, item.id))]
			}),
			metrics && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2 rounded-2xl border border-line bg-paper p-3 text-xs",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block text-[10px] font-bold text-muted",
						children: "Frota Inicial Controlada"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "font-display text-lg font-extrabold tabular-nums text-ink",
						children: [
							metrics.driversApproved,
							" / ",
							5,
							" Motos"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block text-[10px] text-muted",
						children: "Comisión 90% Piloto / 10% Central"
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block text-[10px] font-bold text-muted",
						children: "Base de Usuários MVP"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "font-display text-lg font-extrabold tabular-nums text-ink",
						children: [
							metrics.passengersApproved,
							" / ",
							15,
							" Pasajeros"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "block text-[10px] text-muted",
						children: [
							"Carreras: ",
							metrics.done,
							" hechas · ",
							metrics.open,
							" activas"
						]
					})
				] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl border border-line bg-paper p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs font-extrabold text-ink",
						children: [
							"Estado de los ",
							5,
							" Motoristas (Livre / Em Viagem / Offline)"
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[10px] font-bold text-muted",
						children: "GPS Eco 8–10s"
					})]
				}), fleet.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1.5 text-xs text-muted",
					children: "Aún no hay motoristas aprobados en la flota de 5 unidades. Aprueba expedientes abajo."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2 space-y-2",
					children: fleet.map((item, idx) => {
						const hs = CARORA_HOTSPOTS.find((h) => h.id === item.hotspotId) ?? CARORA_HOTSPOTS[0];
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-2xl border border-line bg-sheet p-2.5 text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "truncate font-extrabold text-ink",
										children: [
											"Unidad #",
											idx + 1,
											": ",
											item.fullName,
											" · Placa ",
											item.plate
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-[11px] text-muted",
										children: [
											item.model,
											" · C.I. ",
											item.cedula,
											" · Hotspot:",
											" ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-semibold text-ink",
												children: hs.shortName
											}),
											" (",
											item.sector,
											")"
										]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: item.liveState === "free" ? "shrink-0 rounded-full bg-brand px-2.5 py-0.5 text-[10px] font-extrabold text-ink" : item.liveState === "on_trip" ? "shrink-0 rounded-full bg-ink px-2.5 py-0.5 text-[10px] font-extrabold text-brand" : "shrink-0 rounded-full bg-line px-2.5 py-0.5 text-[10px] font-bold text-muted",
									children: item.liveState === "free" ? "● LIVRE" : item.liveState === "on_trip" ? "● EM VIAGEM" : "○ OFFLINE"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-1.5 flex flex-wrap items-center justify-between gap-1 text-[10px]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "font-semibold text-muted",
									children: [
										"✓ ",
										item.licenseGrade,
										" · ✓ Cert. Médico · ✓ Antecedentes OK ·",
										" ",
										item.inPersonVerified ? "✓ Validado Presencial" : "Pend. Presencial"
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => setCedula(item.cedula),
										className: "rounded-full border border-line bg-paper px-2 py-0.5 font-bold text-ink",
										children: ["Saldo ", formatUsd(item.saldoUsd)]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => void setFleetState({ data: {
											key,
											userId: item.userId,
											status: item.status === "blocked" ? "approved" : "blocked"
										} }).then(() => load()),
										className: "rounded-full bg-ink px-2 py-0.5 font-bold text-paper",
										children: item.status === "blocked" ? "Reactivar" : "Bloquear"
									})]
								})]
							})]
						}, item.userId);
					})
				})]
			}),
			items !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-2 rounded-2xl border border-line bg-paper p-3 text-xs",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-extrabold text-ink",
					children: "Estado de Lluvia / Quebradas en Carora"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] text-muted",
					children: weather.isRaining ? `Alerta activa (+${weather.delayMin} min retraso estimado)` : "Sin alerta de lluvia activa"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => void setCityWeather({ data: {
						rainMode: !weather.isRaining,
						delayMin: !weather.isRaining ? 4 : 0
					} }).then(() => {
						toast.success("Estado climático de Carora actualizado");
						onClose();
					}),
					className: "h-9 shrink-0 rounded-full bg-ink px-3 text-xs font-bold text-paper whitespace-nowrap",
					children: weather.isRaining ? "Desactivar lluvia" : "Activar alerta lluvia"
				})]
			}),
			items !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2 rounded-2xl border border-line bg-paper p-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, { className: "size-4 text-ink" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-extrabold",
							children: "Recargar saldo a Mototaxista (+$5.00)"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "field h-10 text-sm",
							"aria-label": "Cédula del mototaxista",
							placeholder: "Cédula (ej. V-18999888)",
							value: cedula,
							onChange: (e) => setCedula(e.target.value)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "h-10 shrink-0 rounded-full bg-brand px-4 text-xs font-extrabold text-ink",
							onClick: () => {
								setNote("");
								topUp({ data: {
									key,
									cedula
								} }).then(() => {
									setNote(`Se sumaron $5.00 a la cédula ${cedula}.`);
									toast.success("Saldo recargado (+$5.00)");
									load();
								}).catch((err) => setNote(messageOf(err)));
							},
							children: "Recargar $5"
						})]
					}),
					note && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-semibold text-ink",
						children: note
					})
				]
			}),
			items && items.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs font-extrabold text-muted",
					children: [
						"Filtro de Cadastro Físico Pendiente (",
						items.length,
						")"
					]
				}), items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "rounded-2xl bg-paper p-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold text-ink",
								children: item.fullName
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[11px] font-extrabold text-ink",
								children: item.role === "driver" ? "Piloto (Frota 5)" : "Pasajero (MVP 15)"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted",
							children: [
								"Cédula: ",
								item.cedula,
								" · Tel: ",
								item.phone
							]
						}),
						item.role === "driver" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-1 space-y-0.5 text-xs font-semibold text-ink",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "flex items-center gap-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "size-3.5 text-brand" }),
									"Moto: ",
									item.model,
									" · Placa ",
									item.plate,
									" · ",
									item.licenseGrade
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-[11px] text-muted",
								children: [
									"Cert. Médico: ",
									item.medicalCert ? "Sí" : "No",
									" · Antecedentes Penales:",
									" ",
									item.criminalRecordOk ? "Verificados" : "Pendiente"
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: item.role === "driver" ? "mt-2 grid grid-cols-3 gap-1.5" : "mt-2 grid grid-cols-2 gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block text-[10px] font-bold text-muted",
									children: "Cédula"
								}), item.cedulaPhoto ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: item.cedulaPhoto,
									alt: "Cédula",
									className: "mt-0.5 h-20 w-full rounded-xl object-cover"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-0.5 grid h-20 place-items-center rounded-xl bg-sheet text-[10px] text-muted",
									children: "Sin foto"
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block text-[10px] font-bold text-muted",
									children: "Selfie en vivo"
								}), item.selfie ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: item.selfie,
									alt: "Selfie",
									className: "mt-0.5 h-20 w-full rounded-xl object-cover"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-0.5 grid h-20 place-items-center rounded-xl bg-sheet text-[10px] text-muted",
									children: "Sin selfie"
								})] }),
								item.role === "driver" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block text-[10px] font-bold text-muted",
									children: "Licencia / Doc."
								}), item.circulationPhoto ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: item.circulationPhoto,
									alt: "Documentación de la moto",
									className: "mt-0.5 h-20 w-full rounded-xl object-cover"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-0.5 grid h-20 place-items-center rounded-xl bg-sheet text-[10px] text-muted",
									children: "Sin doc"
								})] })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2.5 grid grid-cols-2 gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "h-9 rounded-full bg-brand text-xs font-bold text-ink",
								onClick: () => void reviewDecide({ data: {
									key,
									userId: item.userId,
									approve: true,
									elite: item.role === "driver",
									note: ""
								} }).then(() => {
									toast.success(`Aprobado · Push / Email enviado a ${CENTRAL_CARORA_CONFIG.developerEmail}`);
									sendBrowserPush("Aprobación Confirmada", `${item.fullName} (${item.cedula}) aprobado y notificado a ${CENTRAL_CARORA_CONFIG.developerEmail}.`);
									load();
								}),
								children: "Validar Presencial y Aprobar"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "h-9 rounded-full bg-signal text-xs font-bold text-paper",
								onClick: () => void reviewDecide({ data: {
									key,
									userId: item.userId,
									approve: false,
									elite: false,
									note: "Por favor vuelve a subir fotos nítidas de tu Cédula, Selfie y documentos."
								} }).then(() => {
									toast(`Expediente rechazado · Notificado a ${CENTRAL_CARORA_CONFIG.developerEmail}`);
									load();
								}),
								children: "Rechazar"
							})]
						})
					]
				}, item.userId))]
			}),
			audit.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl border border-line bg-paper p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-extrabold text-ink",
					children: "Auditoría de Corridas y Validación de Pago Móvil / Zelle"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2 max-h-48 space-y-2 overflow-y-auto",
					children: audit.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl bg-sheet p-2 text-xs",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "font-bold text-ink",
									children: [
										item.dest,
										" · ",
										formatUsd(item.fareUsd)
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-[10px] font-bold text-muted",
									children: [
										item.payMethod,
										" · ",
										item.status
									]
								})]
							}),
							item.payRef && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-0.5 font-extrabold text-ink",
								children: ["Ref. Pago Móvil Central: #", item.payRef]
							}),
							item.paymentProof && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: item.paymentProof,
								alt: "Comprobante Zelle",
								className: "mt-1 h-16 w-full rounded-lg object-cover"
							}),
							(item.payRef || item.paymentProof) && !item.adminPayVerified && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => void verifyTripPayment({ data: {
									key,
									tripId: item.id
								} }).then(() => {
									toast.success("Pago validado administrativamente por la Central");
									load();
								}),
								className: "mt-1.5 h-8 w-full rounded-full bg-brand text-[11px] font-extrabold text-ink",
								children: "Validar Referencia / Comprobante en Central"
							}),
							item.adminPayVerified && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-1 block text-[10px] font-extrabold text-ink",
								children: "✓ Validado por Administración Central"
							})
						]
					}, item.id))
				})]
			}),
			feedbacks.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl border border-line bg-paper p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs font-extrabold text-ink",
					children: [
						"Feedback Directo Fase MVP (",
						feedbacks.length,
						")"
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-1.5 max-h-36 space-y-1.5 overflow-y-auto",
					children: feedbacks.map((fb) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl bg-sheet p-2 text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "font-bold text-ink",
							children: [
								fb.authorName,
								" (",
								fb.role === "driver" ? "Piloto" : "Pasajero MVP",
								") ·",
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted",
									children: fb.category
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-0.5 text-[11px] text-ink",
							children: fb.body
						})]
					}, fb.id))
				})]
			})
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "stage",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LiveApp, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "stage-note",
			children: "Un destino. Primero la moto más cercana, 18 segundos."
		})]
	});
}
export { Home as component };
