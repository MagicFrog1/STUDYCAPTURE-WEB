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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-lg border border-purple-200">
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="text-sm text-gray-600 hover:text-purple-700">← Volver</Link>
          <button
            onClick={() => setMode((m) => (m === "login" ? "register" : "login"))}
            className="text-sm text-purple-700 hover:underline"
          >
            {mode === "login" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
          </button>
        </div>

        {profileEmail && (
          <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-800 flex items-center justify-between">
            <span>Sesión iniciada como {profileEmail}</span>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                setProfileEmail(null);
              }}
              className="px-3 py-1 rounded-md bg-purple-600 text-white"
            >Cerrar sesión</button>
          </div>
        )}

        <h1 className="text-2xl font-bold text-gray-800 mb-1">{mode === "login" ? "Inicia sesión" : "Crea tu cuenta"}</h1>
        <p className="text-gray-600 mb-6">Accede para generar apuntes con IA</p>

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
      </div>
    </div>
  );
}


