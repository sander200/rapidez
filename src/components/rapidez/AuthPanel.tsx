import { useState } from "react";
import { ShieldCheck, Smartphone, Zap } from "lucide-react";
import { GROK_PROVIDERS, authClient, setBearerToken, signIn } from "@/lib/auth/client";

function normalizeIdentifierToEmail(raw: string): string {
  const clean = raw.trim().toLowerCase();
  if (!clean) return "";
  if (clean.includes("@")) return clean;
  // Si el usuario ingresa su número de teléfono (ej. 04145551234) o usuario sin @,
  // generamos automáticamente su identificador interno para no pedir correo de prueba.
  const digits = clean.replace(/\D/g, "");
  if (digits.length >= 7) {
    return `${digits}@rapidez.carora`;
  }
  const slug = clean.replace(/[^a-z0-9._-]/g, "") || "usuario";
  return `${slug}@rapidez.carora`;
}

export function AuthPanel() {
  const [mode, setMode] = useState<"in" | "up">("up");
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState(() => {
    if (typeof localStorage === "undefined") return "";
    const saved = localStorage.getItem("rapidez-login-id") ?? localStorage.getItem("rapidez-email") ?? "";
    return saved.endsWith("@rapidez.carora") ? saved.replace("@rapidez.carora", "") : saved;
  });
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const showGrokOAuth =
    typeof window !== "undefined" && window.location.hostname.endsWith(".grok-sandbox.com");

  async function loginWithCredentials(rawId: string, rawPass: string, displayName: string) {
    setError("");
    setPending(true);
    try {
      const cleanEmail = normalizeIdentifierToEmail(rawId);
      if (mode === "up") {
        const result = await authClient.signUp.email({
          name: displayName.trim() || "Usuario Carora",
          email: cleanEmail,
          password: rawPass,
          callbackURL: "/",
        });
        if (result.error) {
          const fallback = await authClient.signIn.email({
            email: cleanEmail,
            password: rawPass,
            callbackURL: "/",
          });
          if (fallback.error) {
            setError(result.error.message ?? "No se pudo iniciar sesión. Verifica tu clave.");
            return;
          }
          const fbToken = (fallback.data as { token?: string } | null)?.token;
          if (fbToken) setBearerToken(fbToken);
        } else {
          const upToken = (result.data as { token?: string } | null)?.token;
          if (upToken) setBearerToken(upToken);
        }
        localStorage.setItem("rapidez-login-id", rawId.trim());
        await authClient.getSession();
      } else {
        const result = await authClient.signIn.email({
          email: cleanEmail,
          password: rawPass,
          callbackURL: "/",
        });
        if (result.error) {
          // Si aún no existía la cuenta con ese teléfono/correo, la creamos automáticamente
          const fallbackUp = await authClient.signUp.email({
            name: displayName.trim() || "Usuario Carora",
            email: cleanEmail,
            password: rawPass,
            callbackURL: "/",
          });
          if (fallbackUp.error) {
            setError(result.error.message ?? "Teléfono/correo o clave incorrectos.");
            return;
          }
          const upToken = (fallbackUp.data as { token?: string } | null)?.token;
          if (upToken) setBearerToken(upToken);
        } else {
          const inToken = (result.data as { token?: string } | null)?.token;
          if (inToken) setBearerToken(inToken);
        }
        localStorage.setItem("rapidez-login-id", rawId.trim());
        await authClient.getSession();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo entrar.");
    } finally {
      setPending(false);
    }
  }

  async function handleQuickAccess() {
    let quickId = localStorage.getItem("rapidez-quick-device-id");
    if (!quickId) {
      quickId = `carora_${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem("rapidez-quick-device-id", quickId);
    }
    await loginWithCredentials(quickId, "Carora2026!", name.trim() || "Usuario Carora");
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
            {mode === "up" ? "Ingresar a Rapidez Carora" : "Entrar a tu cuenta"}
          </h2>
          <button
            type="button"
            className="text-xs font-semibold text-muted underline"
            onClick={() => setMode(mode === "up" ? "in" : "up")}
          >
            {mode === "up" ? "Ya tengo cuenta" : "Crear cuenta nueva"}
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
          Teléfono o Correo electrónico
          <input
            className="field mt-1"
            type="text"
            autoComplete="username"
            placeholder="Ej. 04145551234 o tu correo"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
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
          disabled={pending || password.length < 8 || identifier.trim().length < 4}
          onClick={() => void loginWithCredentials(identifier, password, name)}
          className="mt-3 h-11 w-full rounded-full bg-ink text-sm font-semibold text-paper disabled:opacity-40"
        >
          {pending ? "Procesando…" : mode === "up" ? "Continuar al registro" : "Entrar"}
        </button>

        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => void handleQuickAccess()}
            className="flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-brand px-3 text-xs font-extrabold text-ink shadow-sm disabled:opacity-40"
          >
            <Zap className="size-3.5 shrink-0" />
            Entrada Rápida (1-Clic)
          </button>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("open-apk-modal"))}
            className="flex h-10 w-full items-center justify-center gap-1.5 rounded-full border border-brand bg-paper px-3 text-xs font-extrabold text-ink shadow-sm"
          >
            <Smartphone className="size-3.5 text-brand shrink-0" />
            Instalar App / APK
          </button>
        </div>

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
