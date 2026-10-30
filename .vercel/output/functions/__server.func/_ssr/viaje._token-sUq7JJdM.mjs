import { o as __toESM } from "../_runtime.mjs";
import { _ as sharedTrip } from "./live-api-CPGHAm0g.mjs";
import { n as Route$1 } from "./router-ajS1xLx1.mjs";
import { J as require_react, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { l as ShieldCheck, u as Share2 } from "../_libs/lucide-react.mjs";
// node_modules/.nitro/vite/services/ssr/assets/viaje._token-sUq7JJdM.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ViajeCompartido() {
	const { token } = Route$1.useParams();
	const [view, setView] = (0, import_react.useState)(void 0);
	(0, import_react.useEffect)(() => {
		let stop = false;
		const tick = () => {
			sharedTrip({ data: token }).then((next) => {
				if (!stop) setView(next);
			}).catch(() => {
				if (!stop) setView(null);
			});
		};
		tick();
		const id = setInterval(tick, 4e3);
		return () => {
			stop = true;
			clearInterval(id);
		};
	}, [token]);
	const title = !view ? "" : view.status === "riding" ? "En viaje hacia el destino" : view.status === "accepted" ? "La moto va en camino" : view.status === "arrived" ? "La moto llegó al punto" : view.status === "done" || view.status === "pay" ? "Viaje finalizado" : view.status === "cancelled" ? "Viaje cancelado" : "Buscando mototaxi";
	const live = Boolean(view && view.lat != null && view.lng != null && ![
		"done",
		"cancelled",
		"pay"
	].includes(view.status));
	const shareUrl = typeof window !== "undefined" ? window.location.href : "";
	const whatsappText = view ? [
		`🛵 *Seguimiento en vivo · Rapidez Carora*`,
		`📍 *Salida:* ${view.pickup}`,
		`🏁 *Destino:* ${view.dest}`,
		view.driverName ? `👤 *Mototaxista:* ${view.driverName} (${view.driverModel} · Placa ${view.driverPlate})` : "",
		`🔗 ${shareUrl}`
	].filter(Boolean).join("\n") : "";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-dvh place-items-center bg-ink p-6",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
			className: "w-full max-w-sm rounded-3xl bg-sheet p-5 text-ink shadow-2xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-sm font-extrabold tracking-wide",
						children: "RAPIDEZ · CARORA"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "inline-flex items-center gap-1 rounded-full bg-brand/30 px-2.5 py-0.5 text-xs font-bold text-ink",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "size-3.5" }), " GPS en vivo"]
					})]
				}),
				view === void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-sm text-muted",
					children: "Cargando corrida en vivo…"
				}),
				view === null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-3 font-display text-3xl font-extrabold",
					children: "Enlace sin viaje"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: "Pide a quien va en la moto que te comparta nuevamente la corrida por WhatsApp."
				})] }),
				view && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-3 font-display text-2xl font-extrabold",
						children: title
					}),
					view.driverName && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 rounded-2xl bg-paper p-3 text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "font-bold text-ink",
							children: ["Mototaxista: ", view.driverName]
						}), (view.driverModel || view.driverPlate) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-0.5 font-semibold text-muted",
							children: [
								view.driverModel,
								" · Placa ",
								view.driverPlate
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 space-y-1.5 text-xs",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-muted",
								children: "Sale de"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-semibold text-ink",
								children: view.pickup
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-muted",
								children: "Va hacia"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-semibold text-ink",
								children: view.dest
							})
						]
					}),
					live && view.lat != null && view.lng != null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LiveMap, {
						lat: view.lat,
						lng: view.lng
					}),
					whatsappText && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href: `https://wa.me/?text=${encodeURIComponent(whatsappText)}`,
						target: "_blank",
						rel: "noopener noreferrer",
						className: "mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-ink text-xs font-bold text-paper",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { className: "size-4" }), "Reenviar corrida por WhatsApp"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-center text-[11px] text-muted",
						children: "Seguimiento de seguridad en tiempo real · Carora, Estado Lara."
					})
				] })
			]
		})
	});
}
function LiveMap({ lat, lng }) {
	const hostRef = (0, import_react.useRef)(null);
	const mapRef = (0, import_react.useRef)(null);
	const markRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (!hostRef.current) return;
		let dead = false;
		import("../_libs/leaflet.mjs").then((n) => /* @__PURE__ */ __toESM(n.t())).then((mod) => {
			const leaflet = mod;
			const L = typeof leaflet.map === "function" ? leaflet : leaflet.default ?? leaflet;
			if (dead || !hostRef.current || mapRef.current) return;
			const map = L.map(hostRef.current, {
				zoomControl: false,
				attributionControl: true,
				scrollWheelZoom: false
			});
			L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
				maxZoom: 19,
				attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a>"
			}).addTo(map);
			map.setView([lat, lng], 16);
			markRef.current = L.circleMarker([lat, lng], {
				radius: 8,
				color: "#1a1c14",
				weight: 2,
				fillColor: "#e6a100",
				fillOpacity: 1
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
	(0, import_react.useEffect)(() => {
		markRef.current?.setLatLng([lat, lng]);
		mapRef.current?.panTo([lat, lng]);
	}, [lat, lng]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: hostRef,
		className: "mt-4 h-52 overflow-hidden rounded-2xl"
	});
}
export { ViajeCompartido as component };
