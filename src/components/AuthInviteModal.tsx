"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function AuthInviteModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        // Mostrar si NO hay sesión
        setOpen(!data.session);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const close = useCallback(() => setOpen(false), []);

  if (loading || !open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      <button
        aria-label="Cerrar"
        onClick={close}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-lg rounded-2xl shadow-2xl border border-purple-200 overflow-hidden">
        <div className="absolute -top-24 -right-20 w-72 h-72 bg-pink-300/30 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -left-20 w-72 h-72 bg-indigo-300/30 blur-3xl rounded-full pointer-events-none" />

        <div className="relative bg-gradient-to-br from-white via-purple-50 to-pink-50 p-6 sm:p-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white">
                🎓
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-purple-700 via-pink-700 to-indigo-700 bg-clip-text text-transparent">
                Únete a la comunidad StudyCaptures
              </h3>
            </div>
            <button
              aria-label="Cerrar"
              onClick={close}
              className="ml-3 text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100"
            >
              ✕
            </button>
          </div>

          <p className="mt-4 text-gray-700 leading-relaxed">
            Estás a un paso de <strong>aumentar tus probabilidades de aprobar</strong>.
            Regístrate gratis y convierte tus apuntes en <em>apuntes claros</em>, <em>flashcards</em>, <em>tests</em> y <em>mapas mentales</em>.
          </p>

          <ul className="mt-4 grid sm:grid-cols-2 gap-2 text-sm">
            <li className="flex items-center gap-2 rounded-xl bg-white/80 ring-1 ring-purple-200 px-3 py-2">
              <span>✅</span> Genera apuntes estructurados y pedagógicos
            </li>
            <li className="flex items-center gap-2 rounded-xl bg-white/80 ring-1 ring-pink-200 px-3 py-2">
              <span>🧠</span> Crea flashcards listas para memorizar
            </li>
            <li className="flex items-center gap-2 rounded-xl bg-white/80 ring-1 ring-indigo-200 px-3 py-2">
              <span>📝</span> Tests tipo examen con explicación
            </li>
            <li className="flex items-center gap-2 rounded-xl bg-white/80 ring-1 ring-emerald-200 px-3 py-2">
              <span>🗺️</span> Mapas mentales en segundos
            </li>
          </ul>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              href="/login?mode=signup"
              className="flex-1 inline-flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:shadow-xl tap-grow"
            >
              Crear cuenta gratis
            </Link>
            <Link
              href="/login"
              className="flex-1 inline-flex items-center justify-center bg-white text-purple-700 ring-1 ring-purple-200 py-3 rounded-xl font-semibold hover:shadow-md"
            >
              Ya tengo cuenta
            </Link>
          </div>

          <p className="mt-3 text-xs text-gray-500 text-center">
            Puedes cerrar esta ventana en cualquier momento.
          </p>
        </div>
      </div>
    </div>
  );
}


