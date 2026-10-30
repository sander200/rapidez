import { useState } from "react";
import { ShieldCheck, Smartphone } from "lucide-react";
import { GROK_PROVIDERS, authClient, setBearerToken, signIn } from "@/lib/auth/client";

export function AuthPanel() {
  const [mode, setMode] = useState<"in" | "up">("up");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(() => {
    if (typeof localStorage === "undefined") return "";
    return localStorage.getItem("rapidez-email") ?? "";
  });
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const showGrokOAuth =
    typeof window !== "undefined" && window.location.hostname.endsWith(".grok-sandbox.com");

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
          callbackURL: "/",
        });
        if (result.error) {
          const fallback = await authClient.signIn.email({
            email: cleanEmail,
            password,
            callbackURL: "/",
          });
          if (fallback.error) {
            setError(result.error.message ?? "No se pudo crear la cuenta.");
            return;
          }
          const fbToken = (fallback.data as { token?: string } | null)?.token;
          if (fbToken) setBearerToken(fbToken);
        } else {
          const upToken = (result.data as { token?: string } | null)?.token;
          if (upToken) setBearerToken(upToken);
        }
        localStorage.setItem("rapidez-email", cleanEmail);
        await authClient.getSession();
      } else {
        const result = await authClient.signIn.email({
          email: cleanEmail,
          password,
          callbackURL: "/",
        });
        if (result.error) {
          setError(result.error.message ?? "Correo o clave incorrectos.");
          return;
        }
        const inToken = (result.data as { token?: string } | null)?.token;
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

  return (
    <div className="w-full rounded-3xl bg-sheet p-2 text-ink">
      <div className="flex items-center gap-3.5">
        <img
          src="/logo.jpg"
          alt="Rapidez Moto transporte Carora"
          referrerPolicy="no-referrer"
          className="size-16 shrink-0 rounded-full border-2 border-brand object-cover shadow-md"
        />
        <div>
          <p className="inline-flex items-center gap-1 text-xs font-bold text-muted">
            <ShieldCheck className="size-3.5 text-brand" /> Carora · Estado Lara
          </p>
          <p className="mt-0.5 font-display text-2xl font-extrabold tracking-wide">
            Rapidez · Moto transporte
          </p>
          <p className="text-xs text-muted">
            Selfie y documentos obligatorios · Mapa vial de lombadas y lluvia en vivo
          </p>
        </div>
      </div>

      <div className="mt-3 border-t border-line pt-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-extrabold">
            {mode === "up" ? "Crear cuenta real" : "Entrar con tu correo"}
          </h2>
          <button
            type="button"
            className="text-xs font-semibold text-muted underline"
            onClick={() => setMode(mode === "up" ? "in" : "up")}
          >
            {mode === "up" ? "Ya tengo cuenta" : "Crear cuenta"}
          </button>
        </div>

        {mode === "up" && (
          <label className="mt-2 block text-xs font-semibold">
            Nombre y apellido
            <input
              className="field mt-1"
              placeholder="Ej. José Gregorio Rivas"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
        )}
        <label className="mt-2 block text-xs font-semibold">
          Correo electrónico
          <input
            className="field mt-1"
            type="email"
            autoComplete="email"
            placeholder="tucorreo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="mt-2 block text-xs font-semibold">
          Clave (mínimo 8 caracteres)
          <input
            className="field mt-1"
            type="password"
            placeholder="••••••••"
            autoComplete={mode === "up" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p className="mt-2 text-sm font-medium text-signal">{error}</p>}
        <button
          type="button"
          disabled={pending || password.length < 8 || !email.includes("@")}
          onClick={() => void submit()}
          className="mt-3 h-11 w-full rounded-full bg-ink text-sm font-semibold text-paper disabled:opacity-40"
        >
          {pending ? "Procesando…" : mode === "up" ? "Continuar al registro" : "Entrar"}
        </button>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("open-apk-modal"))}
          className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-full border border-brand bg-paper text-xs font-extrabold text-ink shadow-sm"
        >
          <Smartphone className="size-3.5 text-brand" />
          Instalar App / Generar APK (Android & iOS)
        </button>

        {showGrokOAuth && (
          <div className="mt-3 flex flex-col gap-2">
            {GROK_PROVIDERS.map((provider) => (
              <button
                key={provider.providerId}
                type="button"
                onClick={() => void signIn(provider.providerId, { callbackURL: "/" })}
                className="h-11 w-full rounded-full border border-line bg-paper text-sm font-semibold text-ink"
              >
                Continuar con {provider.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
