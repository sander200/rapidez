import { o as __toESM } from "../_runtime.mjs";
import { i as signIn, r as setBearerToken, t as authClient } from "./client-C-uqF2eZ.mjs";
import { t as GROK_PROVIDERS } from "./server-BEno-str.mjs";
import { J as require_react, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { l as ShieldCheck } from "../_libs/lucide-react.mjs";
// node_modules/.nitro/vite/services/ssr/assets/AuthPanel-BUmXkAQs.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AuthPanel() {
	const [mode, setMode] = (0, import_react.useState)("up");
	const [name, setName] = (0, import_react.useState)("");
	const [email, setEmail] = (0, import_react.useState)(() => {
		if (typeof localStorage === "undefined") return "";
		return localStorage.getItem("rapidez-email") ?? "";
	});
	const [password, setPassword] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)("");
	const [pending, setPending] = (0, import_react.useState)(false);
	const showGrokOAuth = typeof window !== "undefined" && window.location.hostname.endsWith(".grok-sandbox.com");
	async function submit() {
		setError("");
		setPending(true);
		try {
			const cleanEmail = email.trim().toLowerCase();
			if (mode === "up") {
				const result = await authClient.signUp.email({
					name: name.trim() || "Usuario Carora",
					email: cleanEmail,
					password,
					callbackURL: "/"
				});
				if (result.error) {
					const fallback = await authClient.signIn.email({
						email: cleanEmail,
						password,
						callbackURL: "/"
					});
					if (fallback.error) {
						setError(result.error.message ?? "No se pudo crear la cuenta.");
						return;
					}
					const fbToken = fallback.data?.token;
					if (fbToken) setBearerToken(fbToken);
				} else {
					const upToken = result.data?.token;
					if (upToken) setBearerToken(upToken);
				}
				localStorage.setItem("rapidez-email", cleanEmail);
				await authClient.getSession();
			} else {
				const result = await authClient.signIn.email({
					email: cleanEmail,
					password,
					callbackURL: "/"
				});
				if (result.error) {
					setError(result.error.message ?? "Correo o clave incorrectos.");
					return;
				}
				const inToken = result.data?.token;
				if (inToken) setBearerToken(inToken);
				localStorage.setItem("rapidez-email", cleanEmail);
				await authClient.getSession();
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "No se pudo entrar.");
		} finally {
			setPending(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "w-full rounded-3xl bg-sheet p-2 text-ink",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-3.5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: "/logo.jpg",
				alt: "Rapidez Moto transporte Carora",
				referrerPolicy: "no-referrer",
				className: "size-16 shrink-0 rounded-full border-2 border-brand object-cover shadow-md"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "inline-flex items-center gap-1 text-xs font-bold text-muted",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "size-3.5 text-brand" }), " Carora · Estado Lara"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-0.5 font-display text-2xl font-extrabold tracking-wide",
					children: "Rapidez · Moto transporte"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted",
					children: "Selfie y documentos obligatorios · Mapa vial de lombadas y lluvia en vivo"
				})
			] })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-3 border-t border-line pt-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-lg font-extrabold",
						children: mode === "up" ? "Crear cuenta real" : "Entrar con tu correo"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "text-xs font-semibold text-muted underline",
						onClick: () => setMode(mode === "up" ? "in" : "up"),
						children: mode === "up" ? "Ya tengo cuenta" : "Crear cuenta"
					})]
				}),
				mode === "up" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "mt-2 block text-xs font-semibold",
					children: ["Nombre y apellido", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "field mt-1",
						placeholder: "Ej. José Gregorio Rivas",
						value: name,
						onChange: (e) => setName(e.target.value)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "mt-2 block text-xs font-semibold",
					children: ["Correo electrónico", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "field mt-1",
						type: "email",
						autoComplete: "email",
						placeholder: "tucorreo@ejemplo.com",
						value: email,
						onChange: (e) => setEmail(e.target.value)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "mt-2 block text-xs font-semibold",
					children: ["Clave (mínimo 8 caracteres)", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "field mt-1",
						type: "password",
						placeholder: "••••••••",
						autoComplete: mode === "up" ? "new-password" : "current-password",
						value: password,
						onChange: (e) => setPassword(e.target.value)
					})]
				}),
				error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm font-medium text-signal",
					children: error
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					disabled: pending || password.length < 8 || !email.includes("@"),
					onClick: () => void submit(),
					className: "mt-3 h-11 w-full rounded-full bg-ink text-sm font-semibold text-paper disabled:opacity-40",
					children: pending ? "Procesando…" : mode === "up" ? "Continuar al registro" : "Entrar"
				}),
				showGrokOAuth && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 flex flex-col gap-2",
					children: GROK_PROVIDERS.map((provider) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => void signIn(provider.providerId, { callbackURL: "/" }),
						className: "h-11 w-full rounded-full border border-line bg-paper text-sm font-semibold text-ink",
						children: ["Continuar con ", provider.label]
					}, provider.providerId))
				})
			]
		})]
	});
}
export { AuthPanel as t };
