"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function AuthInviteModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

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

  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    } else {
      setVisible(false);
    }
  }, [open]);

  const close = useCallback(() => {
    setVisible(false);
    setTimeout(() => setOpen(false), 150);
  }, []);

  if (loading || !open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <button
        aria-label="Cerrar"
        onClick={close}
        className={`absolute inset-0 backdrop-blur-sm transition-opacity duration-200 ${visible ? "bg-black/40 opacity-100" : "bg-black/20 opacity-0"}`}
      />

      <div
        className={`relative w-full max-w-2xl rounded-3xl shadow-[0_20px_60px_rgba(124,58,237,0.25)] border border-purple-200/70 overflow-hidden transition-all duration-200
        ${visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-3 scale-95"}`}
      >
        <div className="absolute -top-24 -right-20 w-80 h-80 bg-pink-300/30 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -left-20 w-80 h-80 bg-indigo-300/30 blur-3xl rounded-full pointer-events-none" />

        <div className="relative bg-gradient-to-br from-white via-purple-50 to-pink-50">
          <div className="px-6 sm:px-8 pt-6 sm:pt-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-2xl bg-white ring-1 ring-purple-200 shadow-md flex items-center justify-center">
                  <img src="/logo.svg" alt="StudyCaptures" className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-purple-700 via-pink-700 to-indigo-700 bg-clip-text text-transparent leading-tight">
                    Únete a +10.000 estudiantes
                  </h3>
                  <p className="mt-1 inline-flex items-center gap-2 text-[15px] sm:text-base font-semibold text-gray-800">
                    <span className="inline-block h-2 w-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                    Estás a un paso de mejorar tus probabilidades de aprobar.
                  </p>
                </div>
              </div>
              <button
                aria-label="Cerrar"
                onClick={close}
                className="ml-3 text-gray-500 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="px-6 sm:px-8 mt-5">
            <div className="grid sm:grid-cols-2 gap-3 md:gap-4">
              <FeatureCard
                icon="✅"
                title="Apuntes claros y pedagógicos"
                subtitle="Estructura, ejemplos y conexiones"
                color="from-purple-100 to-purple-50 ring-purple-200"
              />
              <FeatureCard
                icon="🧠"
                title="Flashcards listas para memorizar"
                subtitle="Pregunta-respuesta concisas y efectivas"
                color="from-pink-100 to-pink-50 ring-pink-200"
              />
              <FeatureCard
                icon="📝"
                title="Tests tipo examen con explicación"
                subtitle="Feedback inmediato y razón de la respuesta"
                color="from-indigo-100 to-indigo-50 ring-indigo-200"
              />
              <FeatureCard
                icon="🗺️"
                title="Mapas mentales en segundos"
                subtitle="Esquemas limpios y jerárquicos"
                color="from-emerald-100 to-emerald-50 ring-emerald-200"
              />
            </div>
          </div>

          <div className="px-6 sm:px-8 mt-6 pb-6 sm:pb-8">
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/login?mode=signup"
                className="flex-1 inline-flex items-center justify-center bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3.5 rounded-2xl font-semibold hover:shadow-xl tap-grow"
              >
                Crear cuenta gratis
              </Link>
              <Link
                href="/login"
                className="flex-1 inline-flex items-center justify-center bg-white text-purple-700 ring-1 ring-purple-200 py-3.5 rounded-2xl font-semibold hover:shadow-md"
              >
                Ya tengo cuenta
              </Link>
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
              <span>★ ★ ★ ★ ★</span>
              <span>Valorado por estudiantes como tú</span>
            </div>
            <p className="mt-2 text-center text-[11px] text-gray-500">Sin tarjeta para registrarte • Cancela cuando quieras</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  subtitle,
  color,
}: {
  icon: string;
  title: string;
  subtitle: string;
  color: string;
}) {
  return (
    <div className="relative">
      <div className="rounded-2xl p-[2px] bg-[conic-gradient(at_0%_0%,#ddd,rgba(124,58,237,0.3),rgba(236,72,153,0.3),#ddd)] opacity-90">
        <div
          className={`group relative rounded-[14px] bg-gradient-to-br ${color} ring-1 p-3 sm:p-4 transition-all hover:-translate-y-0.5 hover:shadow-xl`}
        >
          <div className="absolute inset-0 pointer-events-none rounded-[14px] overflow-hidden">
            <div className="absolute -inset-x-10 -top-10 h-12 bg-gradient-to-r from-white/40 via-white/5 to-transparent rotate-6 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-11 h-11 rounded-xl bg-white shadow-md flex items-center justify-center text-lg ring-1 ring-white/60">
              <span className="drop-shadow-sm">{icon}</span>
            </div>
            <div className="min-w-0">
              <div className="text-[15px] sm:text-base font-bold text-gray-900 leading-snug">
                {title}
              </div>
              <div className="text-xs sm:text-[13px] text-gray-700 mt-1">
                {subtitle}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


