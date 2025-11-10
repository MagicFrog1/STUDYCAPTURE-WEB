"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import AppInfoDropdown from "@/components/AppInfoDropdown";
import StudyTips from "@/components/StudyTips";

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<"" | "monthly" | "yearly">("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(Boolean(data.session));
    })();
  }, []);


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

  async function handleSubscribe(plan: "monthly" | "yearly") {
    if (!isLoggedIn) {
      alert("Primero debes iniciar sesión para suscribirte");
      router.push("/login");
      return;
    }
    try {
      setLoadingPlan(plan);
      const sessionRes = await supabase.auth.getSession();
      const access = sessionRes.data.session?.access_token;
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(access ? { Authorization: `Bearer ${access}` } : {}) },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as { url?: string };
      if (json.url) window.location.href = json.url;
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPlan("");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 overflow-x-hidden">
      {/* Header */}
      <header className="px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between bg-white/80 supports-[backdrop-filter]:bg-white/70 backdrop-blur border-b border-purple-200/70 sticky top-2 z-30 pt-[env(safe-area-inset-top)] transition-all mx-2 rounded-xl">
        <div className="flex items-center gap-2 sm:gap-3">
            <div className="size-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <img src="/LOGO%20WEB.png" alt="StudyCaptures" className="w-6 h-6 object-contain" />
          </div>
            <span className="hidden sm:inline font-bold text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            StudyCaptures
          </span>
        </div>
        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-6">
          <AppInfoDropdown />
          <Link href={isLoggedIn ? "/profile" : "/login"} className="text-gray-600 hover:text-purple-600 transition-colors font-medium">
            Mi cuenta
          </Link>
          <Link href="/generar" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-full font-medium hover:shadow-lg transition-all transform hover:scale-105">
            Generar Apuntes
          </Link>
        </nav>
        {/* Mobile menu button */}
        <button
          className="sm:hidden inline-flex items-center justify-center w-10 h-10 rounded-md border border-purple-200 text-gray-700 tap-grow"
          aria-label="Abrir menú"
          onClick={() => setIsMenuOpen((v) => !v)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        {/* Mobile dropdown */}
        {isMenuOpen && (
          <div className="sm:hidden absolute top-full left-0 right-0 z-40 bg-white/95 backdrop-blur border-b border-purple-200 shadow-sm">
            <div className="px-4 py-4 flex flex-col gap-3">
              <div className="pb-2 border-b border-purple-100">
                <AppInfoDropdown />
              </div>
              <Link href={isLoggedIn ? "/profile" : "/login"} className="text-gray-700" onClick={() => setIsMenuOpen(false)}>Mi cuenta</Link>
              <Link href="/generar" onClick={() => setIsMenuOpen(false)} className="mt-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full font-medium text-center">
                Generar Apuntes
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero centrado y destacado */}
      <section className="px-4 sm:px-6 py-12 sm:py-20">
        <div className="max-w-5xl mx-auto">
          <div className="group relative overflow-hidden rounded-3xl chalkboard px-6 sm:px-10 py-10 sm:py-16 shadow-sm transition-all duration-500 hover:shadow-2xl hover:-translate-y-0.5 reveal will-change-transform [transform-style:preserve-3d] hover:[transform:perspective(1200px)_rotateX(1.2deg)_rotateY(-1deg)]">
            <div className="chalk-noise" />
            <div className="pointer-events-none absolute -top-24 -left-10 w-56 h-56 rounded-full bg-white/5 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-10 w-64 h-64 rounded-full bg-white/5 blur-3xl" />

            <div className="text-center relative">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2 rounded-full text-purple-700 font-medium mb-6 ring-1 ring-purple-200/60">
                <span className="size-2 rounded-full bg-purple-500 inline-block" />
                Optimizado para universidad, bachillerato y oposiciones
              </div>

              <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-2 sm:mb-3 leading-tight">
                <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                  Eleva tus estudios al siguiente nivel
                </span>
                <br />
                <span className="text-gray-900">con 4 herramientas: Apuntes, Flashcards, Tipo Test y Preguntas largas</span>
              </h1>

              <p className="mx-auto text-base sm:text-lg md:text-xl text-gray-700 mb-7 sm:mb-10 max-w-3xl leading-relaxed">
                Pasa de fotos a resultados: crea apuntes claros, flashcards para memorizar, tests con explicación y preguntas largas con corrección automática.
                Personaliza nivel, complejidad y estilo para estudiar mejor y subir tus notas.
              </p>

              <div className="flex items-center justify-center">
                <Link href="/generar" className="group/cta bg-gradient-to-r from-purple-500 to-pink-500 text-white px-7 sm:px-9 py-4 rounded-full font-semibold text-lg hover:shadow-xl transition-all transform hover:scale-[1.03] tap-grow flex items-center gap-3 ring-1 ring-purple-200/60 hover:ring-purple-300/70">
                  Comenzar ahora
                  <span className="transition-transform duration-300 group-hover/cta:translate-x-1">
                    <IconArrowRight />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ¿Por qué elegir StudyCaptures? */}
      <section id="porque" className="px-4 sm:px-6 pt-2 pb-10 sm:pt-4 sm:pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-left reveal">
            <h2 className="section-title text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 mb-6">
              ¿Por qué elegir <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">StudyCaptures</span>?
            </h2>
            <p className="section-lead mb-10">
              Diseñado para el estudio real: convierte fotos con luces, sombras o escritura irregular en material claro,
              priorizando definiciones, fórmulas, pasos de resolución y ejemplos frecuentes de exámenes.
            </p>

            <div className="grid lg:grid-cols-4 gap-5">
              {/* Card 1 */}
              <div className="group relative overflow-visible rounded-2xl p-0.5 bg-gradient-to-br from-purple-200 via-pink-200 to-indigo-200 shadow-sm hover:shadow-xl transition-all reveal">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 blur-2xl bg-gradient-to-br from-purple-400/25 via-pink-400/25 to-indigo-400/25 transition-opacity" />
                <div className="pointer-events-none absolute inset-x-2 -bottom-4 h-8 rounded-2xl bg-gradient-to-r from-fuchsia-200 via-pink-200 to-indigo-200 opacity-70 blur-sm shadow-md" aria-hidden />
                <div className="relative bg-white rounded-[1rem] p-5 sm:p-6 md:p-7 border border-purple-100 overflow-hidden">
                  <div className="absolute -top-6 -right-6 w-16 h-16 bg-gradient-to-tr from-purple-200 to-pink-200 rounded-full blur-2xl opacity-60" />
                  <div className="flex items-start gap-4">
                    <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 text-white ring-1 ring-purple-300/40 shadow-sm flex-shrink-0">
                      <IconCamera />
                    </span>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">Apuntes enriquecidos</h3>
                      <p className="text-gray-700 leading-relaxed">
                        Convierte fotos en apuntes didácticos con explicaciones, ejemplos y conexiones entre conceptos. Ideal para repasar rápido.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="group relative overflow-visible rounded-2xl p-0.5 bg-gradient-to-br from-indigo-200 via-purple-200 to-pink-200 shadow-sm hover:shadow-xl transition-all reveal">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 blur-2xl bg-gradient-to-br from-indigo-400/25 via-purple-400/25 to-pink-400/25 transition-opacity" />
                <div className="pointer-events-none absolute inset-x-2 -bottom-4 h-8 rounded-2xl bg-gradient-to-r from-fuchsia-200 via-pink-200 to-indigo-200 opacity-70 blur-sm shadow-md" aria-hidden />
                <div className="relative bg-white rounded-[1rem] p-5 sm:p-6 md:p-7 border border-purple-100 overflow-hidden">
                  <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-gradient-to-tr from-indigo-200 to-purple-200 rounded-full blur-2xl opacity-60" />
                  <div className="flex items-start gap-4">
                    <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white ring-1 ring-indigo-300/40 shadow-sm flex-shrink-0">
                      <IconPalette />
                    </span>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">Flashcards automáticas</h3>
                      <p className="text-gray-700 leading-relaxed">
                        Genera tarjetas pregunta/respuesta listas para memorizar. Copia, exporta y practica con feedback inmediato.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="group relative overflow-visible rounded-2xl p-0.5 bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200 shadow-sm hover:shadow-xl transition-all reveal">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 blur-2xl bg-gradient-to-br from-pink-400/25 via-purple-400/25 to-indigo-400/25 transition-opacity" />
                <div className="pointer-events-none absolute inset-x-2 -bottom-4 h-8 rounded-2xl bg-gradient-to-r from-fuchsia-200 via-pink-200 to-indigo-200 opacity-70 blur-sm shadow-md" aria-hidden />
                <div className="relative bg-white rounded-[1rem] p-5 sm:p-6 md:p-7 border border-purple-100 overflow-hidden">
                  <div className="absolute -top-5 -left-5 w-14 h-14 bg-gradient-to-tr from-pink-200 to-purple-200 rounded-full blur-2xl opacity-60" />
                  <div className="flex items-start gap-4">
                    <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-fuchsia-600 to-purple-600 text-white ring-1 ring-fuchsia-300/40 shadow-sm flex-shrink-0">
                      <IconBolt />
                    </span>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">Tipo Test con explicación</h3>
                      <p className="text-gray-700 leading-relaxed">
                        Crea preguntas de opción múltiple y comprueba al instante o al final, con explicación de aciertos y errores.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4 */}
              <div className="group relative overflow-visible rounded-2xl p-0.5 bg-gradient-to-br from-teal-200 via-cyan-200 to-blue-200 shadow-sm hover:shadow-xl transition-all reveal">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 blur-2xl bg-gradient-to-br from-teal-400/25 via-cyan-400/25 to-blue-400/25 transition-opacity" />
                <div className="pointer-events-none absolute inset-x-2 -bottom-4 h-8 rounded-2xl bg-gradient-to-r from-teal-200 via-cyan-200 to-blue-200 opacity-70 blur-sm shadow-md" aria-hidden />
                <div className="relative bg-white rounded-[1rem] p-5 sm:p-6 md:p-7 border border-teal-100 overflow-hidden">
                  <div className="absolute -top-6 -right-6 w-16 h-16 bg-gradient-to-tr from-teal-200 to-cyan-200 rounded-full blur-2xl opacity-60" />
                  <div className="flex items-start gap-4">
                    <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-teal-600 to-cyan-600 text-white ring-1 ring-teal-300/40 shadow-sm flex-shrink-0">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M12 3v18M4 8h10M10.5 8l1.5 1.5L10.5 11M4 16h10M10.5 16l1.5 1.5L10.5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">Preguntas largas</h3>
                      <p className="text-gray-700 leading-relaxed">
                        Responde preguntas largas basadas en tus apuntes y recibe corrección automática con porcentaje de acierto y solución modelo.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 herramientas indispensables */}
      <section className="px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 reveal">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">4 herramientas indispensables</h2>
            <p className="text-gray-600 mt-3">Todo lo que necesitas para estudiar mejor y subir tus notas</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 reveal">
            {/* Apuntes */}
            <div className="bg-white rounded-2xl p-6 border border-purple-100 shadow-sm hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M7 3h6l4 4v12a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-900">Apuntes enriquecidos</h3>
              <p className="text-gray-700 mt-1">Resúmenes claros con explicaciones, ejemplos y pasos clave por tema.</p>
              <Link href="/generar/panel" className="inline-block mt-3 text-sm font-semibold text-purple-700 hover:underline">Ir a apuntes →</Link>
            </div>
            {/* Flashcards */}
            <div className="bg-white rounded-2xl p-6 border border-blue-100 shadow-sm hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white flex items-center justify-center mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <rect x="4" y="6" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-900">Flashcards automáticas</h3>
              <p className="text-gray-700 mt-1">Crea tarjetas Q/A para memorizar más rápido con práctica activa.</p>
              <Link href="/generar/flashcards" className="inline-block mt-3 text-sm font-semibold text-blue-700 hover:underline">Ir a flashcards →</Link>
            </div>
            {/* Tipo Test */}
            <div className="bg-white rounded-2xl p-6 border border-amber-100 shadow-sm hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-amber-500 to-red-500 text-white flex items-center justify-center mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M6 8h12M6 12h12M6 16h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-900">Tipo Test con feedback</h3>
              <p className="text-gray-700 mt-1">Practica preguntas reales y aprende de los fallos con explicación.</p>
              <Link href="/generar/test" className="inline-block mt-3 text-sm font-semibold text-amber-700 hover:underline">Ir a test →</Link>
            </div>
            {/* Preguntas largas */}
            <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-500 to-teal-500 text-white flex items-center justify-center mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 3v18M4 8h10M10.5 8l1.5 1.5L10.5 11M4 16h10M10.5 16l1.5 1.5L10.5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-900">Preguntas largas</h3>
              <p className="text-gray-700 mt-1">Responde preguntas largas y recibe corrección automática con porcentaje de acierto.</p>
              <Link href="/generar/mapas" className="inline-block mt-3 text-sm font-semibold text-emerald-700 hover:underline">Ir a Preguntas largas →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de video eliminada temporalmente */}

      {/* Planes y precios (Mensual / Anual) */}
      <section id="precios" className="px-4 sm:px-6 py-14 sm:py-20 bg-gradient-to-br from-purple-50 to-pink-50 scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              Planes <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">claros</span>
            </h2>
            <p className="text-gray-600 mt-3">Elige el plan que encaja con tu curso y tu ritmo de estudio.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            {/* Mensual */}
            <div className="group relative overflow-visible reveal">
              <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-500 bg-gradient-to-br from-purple-300/25 via-pink-300/25 to-indigo-300/25 rounded-3xl" />
              <div className="relative rounded-3xl p-0.5 bg-gradient-to-r from-purple-300 via-pink-300 to-indigo-300">
                <div className="rounded-3xl bg-white p-7 sm:p-8 border border-purple-100">
                  <div className="mb-5">
                    <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 ring-1 ring-purple-200">Flexibilidad mensual</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Mensual</h3>
                  <p className="text-gray-600 mt-1 mb-5">Ideal para trabajos y épocas de exámenes</p>
                  <div className="text-4xl font-extrabold text-purple-600">4,99€ <span className="text-base font-normal text-gray-500">/ mes</span></div>
                  <ul className="space-y-3 mt-6 mb-7">
                    <li className="flex items-start gap-3"><Check /> Desbloquea las 4 herramientas: Apuntes, Flashcards, Tipo Test y Preguntas largas</li>
                    <li className="flex items-start gap-3"><Check /> Procesamiento alto sin esperas</li>
                    <li className="flex items-start gap-3"><Check /> Plantillas y estilos personalizables</li>
                    <li className="flex items-start gap-3"><Check /> Exportación a HTML limpia</li>
                    <li className="flex items-start gap-3"><Check /> Soporte por email en 24h</li>
                  </ul>
                  <button onClick={() => handleSubscribe("monthly")} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-full font-semibold hover:shadow-xl hover:shadow-purple-300/50 transition-all disabled:opacity-60 tap-grow" disabled={loadingPlan === "monthly"}>
                    {loadingPlan === "monthly" ? "Redirigiendo..." : "Elegir mensual"}
                  </button>
                </div>
              </div>
            </div>

            {/* Anual */}
            <div className="group relative overflow-visible reveal">
              <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-500 bg-gradient-to-br from-purple-500/30 via-pink-500/30 to-purple-800/30 rounded-3xl" />
              <div className="relative rounded-3xl p-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-700">
                <div className="rounded-3xl bg-gradient-to-br from-purple-600 to-pink-600 p-7 sm:p-8 text-white">
                  <div className="mb-5 flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold bg-white/15 ring-1 ring-white/30">Mejor relación</span>
                    <span className="hidden sm:inline text-xs bg-white/20 px-2.5 py-1 rounded-full">Ahorra 33%</span>
                  </div>
                  <h3 className="text-2xl font-bold">Anual</h3>
                  <p className="text-purple-100 mt-1 mb-5">Para todo el curso con máximo ahorro</p>
                  <div className="text-4xl font-extrabold">39,99€ <span className="text-base font-normal text-purple-100">/ año</span></div>
                  <ul className="space-y-3 mt-6 mb-7">
                    <li className="flex items-start gap-3"><Check contrast /> Desbloquea las 4 herramientas: Apuntes, Flashcards, Tipo Test y Preguntas largas</li>
                    <li className="flex items-start gap-3"><Check contrast /> Todo del plan mensual</li>
                    <li className="flex items-start gap-3"><Check contrast /> Historial y organización de proyectos</li>
                    <li className="flex items-start gap-3"><Check contrast /> Prioridad en nuevas funciones</li>
                    <li className="flex items-start gap-3"><Check contrast /> Descuentos en futuras herramientas</li>
                  </ul>
                  <button onClick={() => handleSubscribe("yearly")} className="w-full bg-white text-purple-600 py-3 rounded-full font-semibold hover:shadow-2xl hover:shadow-white/30 transition-all disabled:opacity-60 tap-grow" disabled={loadingPlan === "yearly"}>
                    {loadingPlan === "yearly" ? "Redirigiendo..." : "Elegir anual"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 sm:mt-10 text-center text-sm text-gray-600 flex flex-col sm:flex-row items-center justify-center gap-3">
            <span className="inline-flex items-center gap-2"><span role="img" aria-label="seguro">🔒</span> Pagos seguros con Stripe</span>
            <span className="hidden sm:inline">·</span>
            <span className="inline-flex items-center gap-2">⏱️ Cancelas cuando quieras</span>
            <span className="hidden sm:inline">·</span>
            <span className="inline-flex items-center gap-2">🎯 Sin límites para estudiar a tu ritmo</span>
          </div>
        </div>
      </section>

      {/* Study Tips Section */}
      <section className="px-6 py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-6xl mx-auto">
          <div className="reveal"><StudyTips /></div>
        </div>
      </section>

      {/* Footer claro y atractivo */}
      <footer className="px-4 sm:px-6 py-10 sm:py-14">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl border border-purple-200 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-8 sm:p-10 text-center reveal">
            <div className="pointer-events-none absolute -top-16 -left-16 w-40 h-40 rounded-full bg-purple-200/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-10 w-48 h-48 rounded-full bg-pink-200/30 blur-3xl" />
            <div className="relative flex items-center justify-center gap-3 mb-5">
              <div className="size-9 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-sm">
                <img src="/LOGO%20WEB.png" alt="StudyCaptures" className="w-5 h-5 object-contain" />
              </div>
              <span className="font-extrabold text-lg bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-transparent">StudyCaptures</span>
            </div>
            <p className="text-gray-700 mb-4">© {new Date().getFullYear()} StudyCaptures · Revolucionando la educación con IA</p>
            <div className="flex items-center justify-center gap-5 text-sm">
              <a href="/privacy" className="text-purple-700 hover:underline">Privacidad</a>
              <a href="/terms" className="text-purple-700 hover:underline">Términos</a>
              <span className="text-gray-500">Soporte: studycapturesai@gmail.com</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Minimal SVG icons
function Check({ contrast }: { contrast?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M20 6 9 17l-5-5" stroke={contrast ? "#fff" : "#16a34a"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IconArrowRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconCamera() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M3 8a2 2 0 0 1 2-2h2l1.2-1.8A2 2 0 0 1 10.8 3h2.4a2 2 0 0 1 1.6.8L16 6h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.8"/>
    </svg>
  );
}

function IconPalette() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M12 4a8 8 0 1 0 0 16h1.5a2.5 2.5 0 0 0 0-5H13a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h.5A2.5 2.5 0 0 0 12 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <circle cx="8.5" cy="10.5" r="1" fill="currentColor"/>
      <circle cx="8" cy="14.5" r="1" fill="currentColor"/>
      <circle cx="11.5" cy="16.5" r="1" fill="currentColor"/>
      <circle cx="15.5" cy="12.5" r="1" fill="currentColor"/>
    </svg>
  );
}

function IconBolt() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M12 3l7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6l7-3z" stroke="#7c3aed" strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  );
}

function IconCard() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="#2563eb" strokeWidth="1.8"/>
      <path d="M3 10h18" stroke="#2563eb" strokeWidth="1.8"/>
    </svg>
  );
}

function IconUserCard() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="#111827" strokeWidth="1.8"/>
      <circle cx="9" cy="12" r="2" stroke="#111827" strokeWidth="1.6"/>
      <path d="M6.5 16c1-1.3 2.3-2 3.5-2s2.5.7 3.5 2" stroke="#111827" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}
