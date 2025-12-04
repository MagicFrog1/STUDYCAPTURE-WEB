"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [profileEmail, setProfileEmail] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [showLegal, setShowLegal] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setProfileEmail(data.session.user.email ?? null);
      }
    })();
  }, [router]);

  // Reveal on scroll
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    if (!('IntersectionObserver' in window) || elements.length === 0) return;
    const io = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 }
    );
    elements.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  const onSubmit = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      if (!email || !password) throw new Error("Email y contraseña son obligatorios");
      if (mode === "register") {
        if (!accepted) {
          throw new Error("Debes aceptar la Política de Privacidad y los Términos y Condiciones para registrarte");
        }
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: (typeof window !== 'undefined' ? window.location.origin : '') + '/generar' } });
        if (error) throw error;
        setSuccess("¡Cuenta creada! Revisa tu correo y confirma tu email para comenzar.");
        setMode("login");
        return;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      router.replace("/generar");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de autenticación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden px-4 sm:px-6 py-8 sm:py-10">
      <header className="max-w-6xl mx-auto flex items-center justify-between mb-6 sm:mb-8">
        <Link
          href="/"
          className="flex items-center gap-3 text-slate-200 hover:text-sky-300 transition-colors tap-grow"
        >
          <div className="size-8 rounded-xl bg-[radial-gradient(circle_at_0_0,#22d3ee,transparent_55%),radial-gradient(circle_at_100%_0,#a855f7,transparent_55%),linear-gradient(135deg,#1d4ed8,#4f46e5,#a855f7)] flex items-center justify-center ring-1 ring-indigo-300/70 shadow-[0_16px_40px_rgba(15,23,42,1)]">
            <img src="/LOGO%20WEB.png" alt="StudyCaptures" className="w-5 h-5 object-contain" />
          </div>
          <span className="hidden sm:inline font-semibold bg-[radial-gradient(circle_at_0_0,#22d3ee,transparent_55%),radial-gradient(circle_at_100%_0,#a855f7,transparent_55%),linear-gradient(90deg,#e5e7eb,#e0f2fe,#a5b4fc)] bg-clip-text text-transparent">
            StudyCaptures
          </span>
          <span className="opacity-70 text-slate-300">← Volver a inicio</span>
        </Link>
        <button
          onClick={() => setMode((m) => (m === "login" ? "register" : "login"))}
          className="text-sm text-sky-300 hover:text-sky-200 underline-offset-2 hover:underline tap-grow"
        >
          {mode === "login" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
        </button>
      </header>

      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-6 sm:gap-8 items-start">
        {/* Lado izquierdo: storytelling y beneficios */}
        <section className="order-2 lg:order-1 reveal">
          <div className="bg-slate-950/80 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-[0_18px_45px_rgba(15,23,42,1)] p-6 sm:p-8 card-smooth">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-slate-900/80 text-sky-300 ring-1 ring-sky-400/60 mb-3 sm:mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" /> Hecho para estudiantes exigentes
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight mb-3 sm:mb-4 text-slate-50">
              ¿Cansado de perder horas haciendo apuntes?{" "}
              <span className="bg-[radial-gradient(circle_at_0_0,#22d3ee,transparent_55%),radial-gradient(circle_at_100%_0,#a855f7,transparent_55%),linear-gradient(90deg,#e5e7eb,#e0f2fe,#a5b4fc)] bg-clip-text text-transparent">
                Llega tu solución
              </span>
            </h1>
            <p className="text-slate-200/90 text-base sm:text-lg leading-relaxed mb-5 sm:mb-6">
              Transforma fotos de tus apuntes en resúmenes pedagógicos y listos para examen. En minutos, no en horas. Más claridad, más foco, mejores resultados.
            </p>

            <ul className="space-y-3 text-slate-200">
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-block w-5 h-5 rounded-full bg-emerald-400/15 text-emerald-300 font-bold text-xs flex items-center justify-center ring-1 ring-emerald-400/60">
                  ✓
                </span>
                <div>
                  <p className="font-semibold text-slate-50">Mejores notas con menos estrés</p>
                  <p className="text-sm text-slate-300">
                    Estructura clara, ejemplos y conexiones entre conceptos para estudiar de forma inteligente.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-block w-5 h-5 rounded-full bg-emerald-400/15 text-emerald-300 font-bold text-xs flex items-center justify-center ring-1 ring-emerald-400/60">
                  ✓
                </span>
                <div>
                  <p className="font-semibold text-slate-50">Ahorra tiempo cada semana</p>
                  <p className="text-sm text-slate-300">
                    Convierte fotos en apuntes listos para repasar en cuestión de minutos.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-block w-5 h-5 rounded-full bg-emerald-400/15 text-emerald-300 font-bold text-xs flex items-center justify-center ring-1 ring-emerald-400/60">
                  ✓
                </span>
                <div>
                  <p className="font-semibold text-slate-50">Pensado para exámenes</p>
                  <p className="text-sm text-slate-300">
                    Prioriza definiciones, fórmulas, pasos y ejercicios tipo que suelen caer.
                  </p>
                </div>
              </li>
            </ul>

            <div className="mt-5 sm:mt-6 grid sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="rounded-2xl bg-slate-900/70 p-4 border border-slate-700">
                <p className="text-sm text-slate-200">
                  <span className="font-semibold text-sky-300">Regístrate</span> y desbloquea la generación de apuntes con prioridad y sin límites.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-900/80 p-4 border border-slate-700">
                <p className="text-sm text-slate-200">
                  Miles de estudiantes ya estudian <span className="font-semibold">mejor y más rápido</span> con StudyCaptures.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Lado derecho: panel del formulario (sin cambiar la lógica) */}
        <section className="order-1 lg:order-2 reveal">
          <div className="w-full bg-slate-950/90 rounded-3xl p-6 md:p-8 shadow-[0_18px_45px_rgba(15,23,42,1)] border border-slate-800 card-smooth">
            {profileEmail && (
              <div className="mb-4 p-3 bg-slate-900/80 border border-slate-700 rounded-lg text-sm text-slate-100 flex items-center justify-between">
                <span>Sesión iniciada como {profileEmail}</span>
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    localStorage.clear();
                    sessionStorage.clear();
                    setProfileEmail(null);
                  }}
                  className="px-3 py-1 rounded-md bg-[radial-gradient(circle_at_0_0,#22d3ee,transparent_55%),radial-gradient(circle_at_100%_0,#a855f7,transparent_55%),linear-gradient(90deg,#1d4ed8,#4f46e5,#a855f7)] text-white tap-grow text-xs font-semibold"
                >
                  Cerrar sesión
                </button>
              </div>
            )}

            <h2 className="text-xl sm:text-2xl font-bold text-slate-50 mb-1">
              {mode === "login" ? "Inicia sesión" : "Crea tu cuenta"}
            </h2>
            <p className="text-slate-300 mb-5 sm:mb-6">
              Accede para generar apuntes con IA de manera ilimitada.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/80 text-slate-100 placeholder:text-slate-500 px-4 py-3 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/30"
                  placeholder="tu-email@ejemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/80 text-slate-100 placeholder:text-slate-500 px-4 py-3 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/30"
                  placeholder="••••••••"
                />
              </div>
              {/* Aceptación legal solo en registro */}
              {mode === "register" && (
                <label className="flex items-start gap-3 text-xs text-slate-300 mt-1 select-none">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 text-sky-400 rounded border-slate-600 bg-slate-900 focus:ring-sky-500/60"
                  />
                  <span>
                    He leído y acepto la{" "}
                    <Link href="/privacy" className="text-sky-300 hover:text-sky-200 hover:underline">
                      Política de Privacidad
                    </Link>{" "}
                    y los
                    <Link href="/terms" className="text-sky-300 hover:text-sky-200 hover:underline">
                      {" "}
                      Términos y Condiciones
                    </Link>
                    .
                  </span>
                </label>
              )}

              <button
                onClick={onSubmit}
                disabled={loading || (mode === "register" && !accepted)}
                className="w-full bg-[radial-gradient(circle_at_0_0,#22d3ee,transparent_55%),radial-gradient(circle_at_100%_0,#a855f7,transparent_55%),linear-gradient(90deg,#1d4ed8,#4f46e5,#a855f7)] text-white py-3 rounded-lg font-semibold hover:shadow-[0_22px_60px_rgba(15,23,42,1)] disabled:opacity-50 tap-grow"
              >
                {loading ? "Procesando..." : mode === "login" ? "Entrar" : "Registrarme"}
              </button>
            </div>

            {success && (
              <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-400/60 rounded-lg text-sm text-emerald-100">
                {success}
              </div>
            )}
            {error && (
              <div className="mt-4 p-3 bg-rose-500/10 border border-rose-400/60 rounded-lg text-sm text-rose-100">
                {error}
              </div>
            )}

            <div className="mt-6 text-xs text-slate-400">
              Al continuar aceptas nuestra política de privacidad.
              <button
                onClick={() => setShowLegal((v) => !v)}
                className="ml-2 underline text-sky-300 hover:text-sky-200 underline-offset-2"
              >
                Ver detalles legales
              </button>
              {showLegal && (
                <div className="mt-2 text-xs">
                  <Link
                    href="/privacy"
                    className="text-sky-300 hover:text-sky-200 hover:underline mr-3"
                  >
                    Política de Privacidad
                  </Link>
                  <Link
                    href="/terms"
                    className="text-sky-300 hover:text-sky-200 hover:underline"
                  >
                    Términos y Condiciones
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}


