"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppInfoDropdown from "@/components/AppInfoDropdown";

export default function GenerarPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const logged = Boolean(data.session);
      setIsLoggedIn(logged);
      if (!logged) router.replace("/login");
    })();
  }, [router]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-200">
      {/* Fondo decorativo moderno (sin pizarra) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {/* Gradientes principales */}
        <div className="absolute inset-0 bg-[radial-gradient(130%_120%_at_0%_0%,rgba(56,189,248,0.35),transparent_60%),radial-gradient(120%_120%_at_100%_0%,rgba(168,85,247,0.4),transparent_55%),radial-gradient(140%_140%_at_50%_120%,rgba(34,197,94,0.28),transparent_65%)] opacity-90" />

        {/* Rejilla suave */}
        <div className="absolute inset-0 grid-overlay opacity-75" />
        <div className="blob b1" />
        <div className="blob b2" />
        <div className="blob b3" />
        {/* Vignette sutil para profundidad */}
        <div className="vignette" />

        {/* Brillos/dots muy sutiles */}
        <div className="spark s1" />
        <div className="spark s2" />
        <div className="spark s3" />
        <div className="spark s4" />
      </div>
      {/* Header local (además del global) */}
      <header className="px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between bg-slate-950/80 supports-[backdrop-filter]:bg-slate-950/60 backdrop-blur-xl border border-slate-800/80 sticky top-2 z-30 pt-[env(safe-area-inset-top)] transition-all mx-2 rounded-2xl shadow-[0_18px_45px_rgba(15,23,42,1)]">
        <Link href="/" className="flex items-center gap-2 sm:gap-3">
          <div className="size-7 sm:size-8 md:size-10 rounded-xl bg-[radial-gradient(circle_at_0_0,#22d3ee,transparent_55%),radial-gradient(circle_at_100%_0,#a855f7,transparent_55%),linear-gradient(135deg,#1d4ed8,#4f46e5,#a855f7)] flex items-center justify-center flex-shrink-0 ring-1 ring-indigo-300/70 shadow-[0_16px_40px_rgba(15,23,42,1)]">
            <img src="/LOGO%20WEB.png" alt="StudyCaptures" className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 object-contain" />
          </div>
          <span className="hidden sm:inline font-bold text-base sm:text-lg md:text-xl bg-[radial-gradient(circle_at_0_0,#22d3ee,transparent_55%),radial-gradient(circle_at_100%_0,#a855f7,transparent_55%),linear-gradient(90deg,#e5e7eb,#e0f2fe,#a5b4fc)] bg-clip-text text-transparent">
            StudyCaptures
          </span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
          <AppInfoDropdown />
          <Link
            href={isLoggedIn ? "/profile" : "/login"}
            className="flex items-center gap-2 px-1.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border border-slate-700/80 text-slate-100 hover:text-sky-300 hover:border-sky-400/60 bg-slate-950/70 transition-all tap-grow shadow-[0_14px_35px_rgba(15,23,42,1)]"
          >
            <span className="w-7 h-7 sm:w-8 sm:h-8 bg-[radial-gradient(circle_at_0_0,#22d3ee,transparent_55%),radial-gradient(circle_at_100%_0,#a855f7,transparent_55%),linear-gradient(135deg,#1d4ed8,#4f46e5,#a855f7)] text-slate-950 rounded-full flex items-center justify-center text-xs">
              👤
            </span>
            <span className="hidden sm:inline">Mi cuenta</span>
          </Link>
        </nav>
      </header>

      <main className="px-4 sm:px-6 py-10 sm:py-16 relative">
        <div className="max-w-4xl mx-auto">
          <section className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold">
              <span className="bg-[radial-gradient(circle_at_0_0,#22d3ee,transparent_55%),radial-gradient(circle_at_100%_0,#a855f7,transparent_55%),linear-gradient(90deg,#e5e7eb,#e0f2fe,#a5b4fc)] bg-clip-text text-transparent drop-shadow-[0_0_26px_rgba(56,189,248,0.8)]">
                Generador de Apuntes
              </span>
            </h1>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg md:text-xl text-slate-200/90 max-w-2xl mx-auto">
              Convierte fotos de tus apuntes en apuntes completos y claros, enriquecidos con
              explicaciones, ejemplos y conexiones entre conceptos.
            </p>
          </section>

          <div className="reveal is-visible grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Link href="/generar/panel" className="block group">
              <div className="bg-slate-950/90 rounded-2xl p-6 sm:p-7 shadow-[0_18px_45px_rgba(15,23,42,1)] border border-slate-800 hover:shadow-[0_22px_60px_rgba(15,23,42,1)] transition-all card-smooth text-center hover:-translate-y-0.5 h-full">
                <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[radial-gradient(circle_at_0_0,#22d3ee,transparent_55%),radial-gradient(circle_at_100%_0,#a855f7,transparent_55%),linear-gradient(135deg,#1d4ed8,#4f46e5,#a855f7)] flex items-center justify-center shadow-[0_18px_45px_rgba(15,23,42,1)]">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="text-white">
                    <path d="M7 3h6l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2"/>
                    <path d="M13 3v5h5" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <h2 className="mt-4 text-xl sm:text-2xl font-bold text-slate-50">
                  Genera tus apuntes
                </h2>
                <p className="mt-2 text-slate-300 max-w-2xl mx-auto text-sm sm:text-base">
                  Sube tus fotos, añade contexto opcional y personaliza el resultado.
                  Obtendrás apuntes educativos estructurados y listos para estudiar.
                </p>
                <div className="mt-4">
                  <span className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-semibold text-slate-950 bg-[radial-gradient(circle_at_0_0,#22d3ee,transparent_55%),radial-gradient(circle_at_100%_0,#a855f7,transparent_55%),linear-gradient(135deg,#1d4ed8,#4f46e5,#a855f7)] group-hover:brightness-110 transition-all tap-grow text-sm">
                    Ir al panel
                  </span>
                </div>
              </div>
            </Link>

            <Link href="/generar/flashcards" className="block group">
              <div className="bg-slate-950/90 rounded-2xl p-6 sm:p-7 shadow-[0_18px_45px_rgba(15,23,42,1)] border border-slate-800 hover:shadow-[0_22px_60px_rgba(15,23,42,1)] transition-all card-smooth text-center hover:-translate-y-0.5 h-full">
                <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[radial-gradient(circle_at_0_0,#22d3ee,transparent_55%),radial-gradient(circle_at_100%_0,#4f46e5,transparent_55%),linear-gradient(135deg,#0ea5e9,#6366f1,#22c55e)] flex items-center justify-center shadow-[0_18px_45px_rgba(15,23,42,1)]">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="text-white">
                    <rect x="3" y="6" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M9 11h5M6 11h1M6 14h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <h2 className="mt-4 text-xl sm:text-2xl font-bold text-slate-50">
                  Generar Flashcards
                </h2>
                <p className="mt-2 text-slate-300 max-w-2xl mx-auto text-sm sm:text-base">
                  Crea tarjetas de estudio (pregunta/respuesta) a partir de tus fotos.
                  Perfectas para repasar conceptos de forma rápida y efectiva.
                </p>
                <div className="mt-4">
                  <span className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-semibold text-slate-950 bg-[radial-gradient(circle_at_0_0,#22d3ee,transparent_55%),radial-gradient(circle_at_100%_0,#4f46e5,transparent_55%),linear-gradient(135deg,#0ea5e9,#6366f1,#22c55e)] group-hover:brightness-110 transition-all tap-grow text-sm">
                    Ir al generador de flashcards
                  </span>
                </div>
              </div>
            </Link>

            <Link href="/generar/test" className="block group">
              <div className="bg-slate-950/90 rounded-2xl p-6 sm:p-7 shadow-[0_18px_45px_rgba(15,23,42,1)] border border-slate-800 hover:shadow-[0_22px_60px_rgba(15,23,42,1)] transition-all card-smooth text-center hover:-translate-y-0.5 h-full">
                <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[radial-gradient(circle_at_0_0,#f97316,transparent_55%),radial-gradient(circle_at_100%_0,#ec4899,transparent_55%),linear-gradient(135deg,#f97316,#ec4899,#6366f1)] flex items-center justify-center shadow-[0_18px_45px_rgba(15,23,42,1)]">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="text-white">
                    <path d="M6 8h12M6 12h12M6 16h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <h2 className="mt-4 text-xl sm:text-2xl font-bold text-slate-50">
                  Tipo Test
                </h2>
                <p className="mt-2 text-slate-300 max-w-2xl mx-auto text-sm sm:text-base">
                  Crea preguntas tipo test con opciones, solución y explicación. 
                  Puedes corregir al seleccionar o revisar el total al final.
                </p>
                <div className="mt-4">
                  <span className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-semibold text-slate-950 bg-[radial-gradient(circle_at_0_0,#f97316,transparent_55%),radial-gradient(circle_at_100%_0,#ec4899,transparent_55%),linear-gradient(135deg,#f97316,#ec4899,#6366f1)] group-hover:brightness-110 transition-all tap-grow text-sm">
                    Ir al generador de test
                  </span>
                </div>
              </div>
            </Link>

            <Link href="/generar/mapas" className="block group">
              <div className="bg-slate-950/90 rounded-2xl p-6 sm:p-7 shadow-[0_18px_45px_rgba(15,23,42,1)] border border-slate-800 hover:shadow-[0_22px_60px_rgba(15,23,42,1)] transition-all card-smooth text-center hover:-translate-y-0.5 h-full">
                <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[radial-gradient(circle_at_0_0,#22c55e,transparent_55%),radial-gradient(circle_at_100%_0,#06b6d4,transparent_55%),linear-gradient(135deg,#22c55e,#06b6d4,#6366f1)] flex items-center justify-center shadow-[0_18px_45px_rgba(15,23,42,1)]">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="text-white">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                    <path d="M11.5 16.5h1v1h-1z" fill="currentColor" />
                    <path d="M12 14.5v-.4c0-.9.6-1.4 1.2-1.8.6-.4 1.3-.9 1.3-1.9 0-1.5-1.2-2.5-2.8-2.5-1.5 0-2.6.9-2.9 2.2l-.1.5h1.7l.1-.2c.2-.6.6-1 1.3-1 .7 0 1.1.4 1.1 1 0 .5-.3.8-.8 1.1-.9.5-1.9 1.2-1.9 2.7v.3h1.8z" fill="currentColor" />
                  </svg>
                </div>
                <h2 className="mt-4 text-xl sm:text-2xl font-bold text-slate-50">
                  Preguntas largas
                </h2>
                <p className="mt-2 text-slate-300 max-w-2xl mx-auto text-sm sm:text-base">
                  Responde preguntas de desarrollo basadas en tus apuntes y recibe corrección automática con porcentaje de acierto y solución modelo.
                </p>
                <div className="mt-4">
                  <span className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-semibold text-slate-950 bg-[radial-gradient(circle_at_0_0,#22c55e,transparent_55%),radial-gradient(circle_at_100%_0,#06b6d4,transparent_55%),linear-gradient(135deg,#22c55e,#06b6d4,#6366f1)] group-hover:brightness-110 transition-all tap-grow text-sm">
                    Ir a preguntas largas
                  </span>
                </div>
              </div>
            </Link>

            <div className="mt-6 text-center text-sm text-slate-400">
              ¿Nuevo en la herramienta? En el panel podrás subir imágenes y generar tus apuntes.
            </div>
          </div>
        </div>
      </main>
      {/* Estilos del fondo y animaciones (solo para esta página) */}
      <style jsx>{`
        @keyframes floatY {
          0% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-12px);
          }
          100% {
            transform: translateY(0);
          }
        }
        .grid-overlay {
          background-image:
            radial-gradient(1000px 600px at 10% 10%, rgba(56, 189, 248, 0.14), transparent 60%),
            radial-gradient(900px 500px at 90% 20%, rgba(168, 85, 247, 0.14), transparent 60%),
            repeating-linear-gradient(0deg, rgba(148, 163, 184, 0.18) 0 1px, transparent 1px 26px),
            repeating-linear-gradient(90deg, rgba(30, 64, 175, 0.2) 0 1px, transparent 1px 26px);
          opacity: 0.9;
          mix-blend-mode: soft-light;
          mask-image: radial-gradient(circle at 50% 35%, black, transparent 72%);
        }
        .blob {
          position: absolute;
          border-radius: 9999px;
          filter: blur(26px);
          opacity: 0.8;
          animation: floatY 9s ease-in-out infinite;
        }
        .b1 {
          width: 360px;
          height: 360px;
          left: -80px;
          top: 120px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.55), rgba(56, 189, 248, 0.4));
          animation-delay: 0s;
        }
        .b2 {
          width: 300px;
          height: 300px;
          right: -60px;
          top: 280px;
          background: linear-gradient(135deg, rgba(168, 85, 247, 0.5), rgba(236, 72, 153, 0.45));
          animation-delay: 0.7s;
        }
        .b3 {
          width: 240px;
          height: 240px;
          right: 20%;
          bottom: -40px;
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.45), rgba(45, 212, 191, 0.4));
          animation-delay: 1.2s;
        }

        /* Vignette sutil */
        .vignette {
          position: absolute;
          inset: -2%;
          background: radial-gradient(70% 55% at 50% 40%, rgba(0, 0, 0, 0) 60%, rgba(15, 23, 42, 0.9));
          mix-blend-mode: multiply;
        }

        /* Brillos puntuales */
        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.25;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.2);
          }
        }
        .spark {
          position: absolute;
          width: 7px;
          height: 7px;
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(248, 250, 252, 0.95), rgba(148, 163, 184, 0));
          box-shadow: 0 0 18px rgba(56, 189, 248, 0.8);
          animation: twinkle 3.2s ease-in-out infinite;
        }
        .s1 {
          top: 14%;
          left: 45%;
          animation-delay: 0.2s;
        }
        .s2 {
          top: 52%;
          left: 8%;
          animation-delay: 0.6s;
        }
        .s3 {
          top: 62%;
          right: 16%;
          animation-delay: 1.1s;
        }
        .s4 {
          top: 28%;
          right: 42%;
          animation-delay: 1.6s;
        }
      `}</style>
    </div>
  );
}


