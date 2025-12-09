"use client";

import { useEffect, useState, useCallback, type ReactNode } from "react";
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
        className={`relative w-full max-w-2xl rounded-3xl shadow-[0_24px_60px_rgba(15,23,42,0.9)] border border-slate-700/80 overflow-hidden transition-all duration-200
        ${visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-3 scale-95"}`}
      >
        <div className="relative bg-slate-900">
          <div className="px-6 sm:px-8 pt-6 sm:pt-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-2xl bg-[radial-gradient(circle_at_0_0,#22d3ee,transparent_55%),radial-gradient(circle_at_100%_0,#a855f7,transparent_55%),linear-gradient(135deg,#1d4ed8,#4f46e5,#a855f7)] ring-1 ring-indigo-300/70 shadow-[0_8px_24px_rgba(15,23,42,1)] flex items-center justify-center">
                  <img src="/LOGO%20WEB.png" alt="StudyCaptures" className="w-7 h-7 object-contain" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-800/80 text-slate-200 ring-1 ring-slate-700 text-xs font-semibold px-3 py-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                    Acceso solo para usuarios Premium
                  </div>
                  <h3 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-100 leading-tight">
                    Únete a +10.000 estudiantes
                  </h3>
                  <p className="mt-1 inline-flex items-center gap-2 text-[15px] sm:text-base text-slate-300">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-400/80" />
                    Estás a un paso de mejorar tus probabilidades de aprobar.
                  </p>
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[radial-gradient(circle_at_0_0,#22d3ee,transparent_55%),radial-gradient(circle_at_100%_0,#a855f7,transparent_55%),linear-gradient(90deg,#1d4ed8,#4f46e5,#a855f7)] text-white text-xs font-bold px-3 py-1.5 shadow-[0_4px_12px_rgba(56,189,248,0.4)]">
                    <span>✨ Suscripción Premium requerida</span>
                    <span className="opacity-90">Desbloquea las 4 herramientas</span>
                  </div>
                </div>
              </div>
              <button
                aria-label="Cerrar"
                onClick={close}
                className="ml-3 text-slate-400 hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-800/50 transition-colors"
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
                color="from-slate-800 to-slate-900 ring-slate-700"
              />
              <FeatureCard
                icon="🧠"
                title="Flashcards listas para memorizar"
                subtitle="Pregunta-respuesta concisas y efectivas"
                color="from-slate-800 to-slate-900 ring-slate-700"
              />
              <FeatureCard
                icon="📝"
                title="Tests tipo examen con explicación"
                subtitle="Feedback inmediato y razón de la respuesta"
                color="from-slate-800 to-slate-900 ring-slate-700"
              />
              <FeatureCard
                icon={<IconLongQuestion />}
                title="Preguntas largas con porcentaje de acierto"
                subtitle="Genera desarrollo, responde y recibe corrección automática"
                color="from-slate-800 to-slate-900 ring-slate-700"
              />
            </div>
          </div>

          <div className="px-6 sm:px-8 mt-6 pb-6 sm:pb-8">
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/login?mode=signup"
                className="flex-1 inline-flex items-center justify-center bg-[radial-gradient(circle_at_0_0,#22d3ee,transparent_55%),radial-gradient(circle_at_100%_0,#a855f7,transparent_55%),linear-gradient(90deg,#1d4ed8,#4f46e5,#a855f7)] text-white py-3.5 rounded-2xl font-semibold hover:brightness-110 transition-all shadow-[0_8px_24px_rgba(56,189,248,0.4)] tap-grow"
              >
                Crear cuenta
              </Link>
              <Link
                href="/login"
                className="flex-1 inline-flex items-center justify-center bg-slate-800 text-slate-200 ring-1 ring-slate-700 py-3.5 rounded-2xl font-semibold hover:bg-slate-750 hover:ring-slate-600 transition-all"
              >
                Ya tengo cuenta
              </Link>
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
              <span>★ ★ ★ ★ ★</span>
              <span>Valorado por estudiantes como tú</span>
            </div>
            <p className="mt-2 text-center text-[11px] text-slate-400">Regístrate y contrata tu plan Premium cuando quieras</p>
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
  icon: ReactNode;
  title: string;
  subtitle: string;
  color: string;
}) {
  return (
    <div className="relative">
      <div className="rounded-2xl p-[2px] bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900">
        <div
          className={`group relative rounded-[14px] bg-gradient-to-br ${color} ring-1 p-3 sm:p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,23,42,0.8)]`}
        >
          <div className="absolute inset-0 pointer-events-none rounded-[14px] overflow-hidden">
            <div className="absolute -inset-x-10 -top-10 h-12 bg-gradient-to-r from-sky-400/20 via-purple-400/10 to-transparent rotate-6 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-11 h-11 rounded-xl bg-slate-800 shadow-[0_4px_12px_rgba(15,23,42,0.6)] flex items-center justify-center text-lg ring-1 ring-slate-700">
              <span className="drop-shadow-sm flex items-center justify-center">{icon}</span>
            </div>
            <div className="min-w-0">
              <div className="text-[15px] sm:text-base font-bold text-slate-100 leading-snug">
                {title}
              </div>
              <div className="text-xs sm:text-[13px] text-slate-300 mt-1">
                {subtitle}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IconLongQuestion() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path
        d="M11.5 16.5h1v1h-1z"
        fill="currentColor"
      />
      <path
        d="M12 14.5v-.4c0-.9.6-1.4 1.2-1.8.6-.4 1.3-.9 1.3-1.9 0-1.5-1.2-2.5-2.8-2.5-1.5 0-2.6.9-2.9 2.2l-.1.5h1.7l.1-.2c.2-.6.6-1 1.3-1 .7 0 1.1.4 1.1 1 0 .5-.3.8-.8 1.1-.9.5-1.9 1.2-1.9 2.7v.3h1.8z"
        fill="currentColor"
      />
    </svg>
  );
}


