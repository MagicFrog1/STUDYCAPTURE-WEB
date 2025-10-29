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
  const [loading, setLoading] = useState(false);
  const [profileEmail, setProfileEmail] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setProfileEmail(data.session.user.email ?? null);
      }
    })();
  }, [router]);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      if (!email || !password) throw new Error("Email y contraseña son obligatorios");
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: (typeof window !== 'undefined' ? window.location.origin : '') + '/generar' } });
        if (error) throw error;
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 px-6 py-10">
      <header className="max-w-6xl mx-auto flex items-center justify-between mb-8">
        <Link href="/" className="flex items-center gap-2 text-gray-700 hover:text-purple-700 transition-colors">
          ← Volver a inicio
        </Link>
        <button
          onClick={() => setMode((m) => (m === "login" ? "register" : "login"))}
          className="text-sm text-purple-700 hover:underline"
        >
          {mode === "login" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
        </button>
      </header>

      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-start">
        {/* Lado izquierdo: storytelling y beneficios */}
        <section className="order-2 lg:order-1">
          <div className="bg-white/80 backdrop-blur rounded-3xl border border-purple-200 shadow-lg p-8">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 ring-1 ring-purple-200 mb-4">
              <span className="w-2 h-2 rounded-full bg-purple-500" /> Hecho para estudiantes exigentes
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-4">
              ¿Cansado de perder horas haciendo apuntes? <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Llega tu solución</span>
            </h1>
            <p className="text-gray-700 text-lg leading-relaxed mb-6">
              Transforma fotos de tus apuntes en resúmenes pedagógicos y listos para examen. En minutos, no en horas. Más claridad, más foco, mejores resultados.
            </p>

            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-block w-5 h-5 rounded-full bg-green-100 text-green-700 font-bold text-xs flex items-center justify-center">✓</span>
                <div>
                  <p className="font-semibold">Mejores notas con menos estrés</p>
                  <p className="text-sm text-gray-600">Estructura clara, ejemplos y conexiones entre conceptos para estudiar de forma inteligente.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-block w-5 h-5 rounded-full bg-green-100 text-green-700 font-bold text-xs flex items-center justify-center">✓</span>
                <div>
                  <p className="font-semibold">Ahorra tiempo cada semana</p>
                  <p className="text-sm text-gray-600">Convierte fotos en apuntes listos para repasar en cuestión de minutos.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-block w-5 h-5 rounded-full bg-green-100 text-green-700 font-bold text-xs flex items-center justify-center">✓</span>
                <div>
                  <p className="font-semibold">Pensado para exámenes</p>
                  <p className="text-sm text-gray-600">Prioriza definiciones, fórmulas, pasos y ejercicios tipo que suelen caer.</p>
                </div>
              </li>
            </ul>

            <div className="mt-6 grid sm:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 p-4 border border-purple-200">
                <p className="text-sm text-gray-700"><span className="font-semibold text-purple-700">Regístrate</span> y desbloquea la generación de apuntes con prioridad y sin límites.</p>
              </div>
              <div className="rounded-2xl bg-white p-4 border border-gray-200">
                <p className="text-sm text-gray-700">Miles de estudiantes ya estudian <span className="font-semibold">mejor y más rápido</span> con StudyCaptures.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Lado derecho: panel del formulario (sin cambiar la lógica) */}
        <section className="order-1 lg:order-2">
          <div className="w-full bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-purple-200">
            {profileEmail && (
              <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-800 flex items-center justify-between">
                <span>Sesión iniciada como {profileEmail}</span>
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    localStorage.clear();
                    sessionStorage.clear();
                    setProfileEmail(null);
                  }}
                  className="px-3 py-1 rounded-md bg-purple-600 text-white"
                >Cerrar sesión</button>
              </div>
            )}

            <h2 className="text-2xl font-bold text-gray-900 mb-1">{mode === "login" ? "Inicia sesión" : "Crea tu cuenta"}</h2>
            <p className="text-gray-600 mb-6">Accede para generar apuntes con IA de manera ilimitada.</p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-purple-200 px-4 py-3 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                  placeholder="tu-email@ejemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-purple-200 px-4 py-3 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                  placeholder="••••••••"
                />
              </div>
              <button
                onClick={onSubmit}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50"
              >
                {loading ? "Procesando..." : mode === "login" ? "Entrar" : "Registrarme"}
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
            )}

            <div className="mt-6 text-xs text-gray-500">
              Al continuar aceptas nuestra política de privacidad.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}


