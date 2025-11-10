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
    <div className="relative min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 overflow-hidden">
      {/* Fondo decorativo */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        {/* Capa estilo pizarra al fondo (como el dashboard hero) */}
        <div className="chalk-full">
          <div className="chalkboard" />
          <div className="chalk-noise" />
        </div>

        {/* Rejilla suave y blobs de color */}
        <div className="absolute inset-0 grid-overlay opacity-60" />
        <div className="blob b1" />
        <div className="blob b2" />
        <div className="blob b3" />

        {/* Vignette sutil para profundidad */}
        <div className="vignette" />

        {/* Elementos tipo pizarra (trazos y fórmulas sutiles) */}
        <svg className="chalk c1" viewBox="0 0 200 80" aria-hidden>
          <path d="M10 40 C 40 10, 80 10, 110 40 S 180 70, 190 40" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <svg className="chalk c2" viewBox="0 0 220 90" aria-hidden>
          <path d="M15 65 q 25 -45 50 0 t 50 0 t 50 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <svg className="chalk c3" viewBox="0 0 160 100" aria-hidden>
          <path d="M20 80 l 30 -50 l 30 50 l 30 -50" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <svg className="chalk c4" viewBox="0 0 240 120" aria-hidden>
          <path d="M10 20 h40 m20 0 h40 m20 0 h40 M30 50 c20 -10 40 -10 60 0 s40 10 60 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        {/* Brillos/dots muy sutiles */}
        <div className="spark s1" />
        <div className="spark s2" />
        <div className="spark s3" />
        <div className="spark s4" />
      </div>
      {/* Header */}
      <header className="px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between bg-white/80 supports-[backdrop-filter]:bg-white/70 backdrop-blur border-b border-purple-200/70 sticky top-2 z-30 pt-[env(safe-area-inset-top)] transition-all mx-2 rounded-xl">
        <Link href="/" className="flex items-center gap-2 sm:gap-3">
          <div className="size-7 sm:size-8 md:size-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            <img src="/LOGO%20WEB.png" alt="StudyCaptures" className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 object-contain" />
          </div>
          <span className="hidden sm:inline font-bold text-base sm:text-lg md:text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            StudyCaptures
          </span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
          <AppInfoDropdown />
          <Link href={isLoggedIn ? "/profile" : "/login"} className="flex items-center gap-2 px-1.5 py-1 sm:px-3 sm:py-1.5 rounded-md border border-transparent sm:border-purple-200 text-gray-700 hover:text-purple-700 hover:border-purple-300 transition-all tap-grow">
            <span className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center text-xs">👤</span>
            <span className="hidden sm:inline">Mi cuenta</span>
          </Link>
        </nav>
      </header>

      <main className="px-4 sm:px-6 py-10 sm:py-16 relative">
        <div className="max-w-4xl mx-auto">
          <section className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold">
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                Generador de Apuntes
              </span>
            </h1>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Convierte fotos de tus apuntes en apuntes completos y claros, enriquecidos con
              explicaciones, ejemplos y conexiones entre conceptos.
            </p>
          </section>

          <div className="reveal is-visible grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Link href="/generar/panel" className="block group">
              <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-lg border border-purple-200 hover:shadow-xl transition-all card-smooth text-center hover:-translate-y-0.5 h-full">
                <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="text-white">
                    <path d="M7 3h6l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2"/>
                    <path d="M13 3v5h5" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <h2 className="mt-4 text-xl sm:text-2xl font-bold text-gray-900">
                  Genera tus apuntes
                </h2>
                <p className="mt-2 text-gray-600 max-w-2xl mx-auto text-sm sm:text-base">
                  Sube tus fotos, añade contexto opcional y personaliza el resultado.
                  Obtendrás apuntes educativos estructurados y listos para estudiar.
                </p>
                <div className="mt-4">
                  <span className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 group-hover:from-purple-500 group-hover:to-pink-500 transition-all tap-grow text-sm">
                    Ir al panel
                  </span>
                </div>
              </div>
            </Link>

            <Link href="/generar/flashcards" className="block group">
              <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-lg border border-purple-200 hover:shadow-xl transition-all card-smooth text-center hover:-translate-y-0.5 h-full">
                <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center shadow-md">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="text-white">
                    <rect x="3" y="6" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M9 11h5M6 11h1M6 14h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <h2 className="mt-4 text-xl sm:text-2xl font-bold text-gray-900">
                  Generar Flashcards
                </h2>
                <p className="mt-2 text-gray-600 max-w-2xl mx-auto text-sm sm:text-base">
                  Crea tarjetas de estudio (pregunta/respuesta) a partir de tus fotos.
                  Perfectas para repasar conceptos de forma rápida y efectiva.
                </p>
                <div className="mt-4">
                  <span className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 group-hover:from-blue-500 group-hover:to-indigo-500 transition-all tap-grow text-sm">
                    Ir al generador de flashcards
                  </span>
                </div>
              </div>
            </Link>

            <Link href="/generar/test" className="block group">
              <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-lg border border-purple-200 hover:shadow-xl transition-all card-smooth text-center hover:-translate-y-0.5 h-full">
                <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-r from-amber-500 to-red-500 flex items-center justify-center shadow-md">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="text-white">
                    <path d="M6 8h12M6 12h12M6 16h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <h2 className="mt-4 text-xl sm:text-2xl font-bold text-gray-900">
                  Tipo Test
                </h2>
                <p className="mt-2 text-gray-600 max-w-2xl mx-auto text-sm sm:text-base">
                  Crea preguntas tipo test con opciones, solución y explicación. 
                  Puedes corregir al seleccionar o revisar el total al final.
                </p>
                <div className="mt-4">
                  <span className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-amber-600 to-red-600 group-hover:from-amber-500 group-hover:to-red-500 transition-all tap-grow text-sm">
                    Ir al generador de test
                  </span>
                </div>
              </div>
            </Link>

            <Link href="/generar/mapas" className="block group">
              <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-lg border border-emerald-200 hover:shadow-xl transition-all card-smooth text-center hover:-translate-y-0.5 h-full">
                <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-500 to-teal-500 flex items-center justify-center shadow-md">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="text-white">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                    <path d="M11.5 16.5h1v1h-1z" fill="currentColor" />
                    <path d="M12 14.5v-.4c0-.9.6-1.4 1.2-1.8.6-.4 1.3-.9 1.3-1.9 0-1.5-1.2-2.5-2.8-2.5-1.5 0-2.6.9-2.9 2.2l-.1.5h1.7l.1-.2c.2-.6.6-1 1.3-1 .7 0 1.1.4 1.1 1 0 .5-.3.8-.8 1.1-.9.5-1.9 1.2-1.9 2.7v.3h1.8z" fill="currentColor" />
                  </svg>
                </div>
                <h2 className="mt-4 text-xl sm:text-2xl font-bold text-gray-900">
                  Preguntas largas
                </h2>
                <p className="mt-2 text-gray-600 max-w-2xl mx-auto text-sm sm:text-base">
                  Responde preguntas de desarrollo basadas en tus apuntes y recibe corrección automática con porcentaje de acierto y solución modelo.
                </p>
                <div className="mt-4">
                  <span className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 group-hover:from-emerald-500 group-hover:to-teal-500 transition-all tap-grow text-sm">
                    Ir a preguntas largas
                  </span>
                </div>
              </div>
            </Link>

            <div className="mt-6 text-center text-sm text-gray-500">
              ¿Nuevo en la herramienta? En el panel podrás subir imágenes y generar tus apuntes.
            </div>
          </div>
        </div>
      </main>
      {/* Estilos del fondo y animaciones (solo para esta página) */}
      <style jsx>{`
        @keyframes floatY { 0% { transform: translateY(0) } 50% { transform: translateY(-10px) } 100% { transform: translateY(0) } }
        .grid-overlay {
          background-image:
            radial-gradient(1000px 600px at 10% 10%, rgba(167, 139, 250, 0.10), transparent 60%),
            radial-gradient(900px 500px at 90% 20%, rgba(244, 114, 182, 0.10), transparent 60%),
            repeating-linear-gradient(0deg, rgba(124, 58, 237, 0.06) 0 1px, transparent 1px 26px),
            repeating-linear-gradient(90deg, rgba(59, 130, 246, 0.06) 0 1px, transparent 1px 26px);
          mask-image: radial-gradient(circle at 50% 35%, black, transparent 70%);
        }
        .blob { position: absolute; border-radius: 9999px; filter: blur(22px); opacity: 0.65; animation: floatY 7s ease-in-out infinite; }
        .b1 { width: 320px; height: 320px; left: -60px; top: 120px; background: linear-gradient(135deg, rgba(124,58,237,.25), rgba(236,72,153,.25)); animation-delay: 0s; }
        .b2 { width: 260px; height: 260px; right: -40px; top: 280px; background: linear-gradient(135deg, rgba(99,102,241,.25), rgba(59,130,246,.25)); animation-delay: .7s; }
        .b3 { width: 200px; height: 200px; right: 20%; bottom: -40px; background: linear-gradient(135deg, rgba(16,185,129,.20), rgba(6,182,212,.20)); animation-delay: 1.2s; }

        /* Vignette sutil */
        .vignette { position: absolute; inset: -2%; background: radial-gradient(70% 55% at 50% 40%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.08)); mix-blend-mode: multiply; }

        /* Chalkboard full-screen wrapper */
        .chalk-full { position: absolute; inset: 10px; border-radius: 28px; overflow: hidden; opacity: .95; box-shadow: inset 0 1px 0 rgba(255,255,255,0.35), 0 24px 60px rgba(17, 24, 39, 0.05); }
        .chalk-full > .chalkboard { position: absolute; inset: 0; border-radius: inherit; }
        .chalk-full > .chalk-noise { border-radius: inherit; }

        /* Tiza/doodles estilo pizarra */
        .chalk { position: absolute; width: auto; height: auto; opacity: .35; filter: drop-shadow(0 1px 1px rgba(255,255,255,.25)); }
        .chalk path { stroke: rgba(124,58,237,.7); stroke-width: 2.2; fill: none; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 2 6; }
        .c1 { top: 8%; left: 6%; width: 220px; height: 90px; transform: rotate(-4deg); }
        .c2 { top: 20%; right: 8%; width: 240px; height: 100px; transform: rotate(3deg); }
        .c3 { bottom: 18%; left: 10%; width: 180px; height: 110px; transform: rotate(2deg); }
        .c4 { bottom: 8%; right: 12%; width: 260px; height: 120px; transform: rotate(-6deg); }

        /* Brillos puntuales */
        @keyframes twinkle { 0%,100% { opacity: .2; transform: scale(1) } 50% { opacity: .55; transform: scale(1.15) } }
        .spark { position: absolute; width: 6px; height: 6px; border-radius: 9999px; background: radial-gradient(circle, rgba(255,255,255,.9), rgba(255,255,255,0)); animation: twinkle 3.2s ease-in-out infinite; }
        .s1 { top: 14%; left: 45%; animation-delay: .2s; }
        .s2 { top: 52%; left: 8%; animation-delay: .6s; }
        .s3 { top: 62%; right: 16%; animation-delay: 1.1s; }
        .s4 { top: 28%; right: 42%; animation-delay: 1.6s; }
      `}</style>
    </div>
  );
}


