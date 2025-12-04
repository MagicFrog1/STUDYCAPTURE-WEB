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
    <div className="min-h-screen overflow-x-hidden">
      {/* Header */}
      <header className="px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between bg-slate-950/80 supports-[backdrop-filter]:bg-slate-950/60 backdrop-blur-xl border border-slate-800/80 sticky top-2 z-30 pt-[env(safe-area-inset-top)] transition-all mx-2 rounded-2xl shadow-[0_18px_45px_rgba(15,23,42,0.9)]">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="size-9 rounded-xl bg-[radial-gradient(circle_at_0_0,#22d3ee,transparent_55%),radial-gradient(circle_at_100%_0,#a855f7,transparent_55%),linear-gradient(135deg,#1d4ed8,#4f46e5,#a855f7)] flex items-center justify-center ring-1 ring-indigo-300/70 shadow-[0_18px_45px_rgba(15,23,42,1)]">
            <img src="/LOGO%20WEB.png" alt="StudyCaptures" className="w-6 h-6 object-contain" />
          </div>
          <span className="hidden sm:inline font-semibold text-xl tracking-tight bg-[radial-gradient(circle_at_0_0,#22d3ee,transparent_55%),radial-gradient(circle_at_100%_0,#a855f7,transparent_55%),linear-gradient(90deg,#e5e7eb,#e0f2fe,#a5b4fc)] bg-clip-text text-transparent drop-shadow-[0_0_18px_rgba(56,189,248,0.8)]">
            StudyCaptures
          </span>
        </div>
        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-6">
          <AppInfoDropdown />
          <Link
            href={isLoggedIn ? "/profile" : "/login"}
            className="text-slate-200 hover:text-sky-300 transition-colors font-medium"
          >
            Mi cuenta
          </Link>
          <Link
            href="/generar"
            className="bg-[radial-gradient(circle_at_0_0,#22d3ee,transparent_55%),radial-gradient(circle_at_100%_0,#a855f7,transparent_55%),linear-gradient(90deg,#1d4ed8,#4f46e5,#a855f7)] text-white px-6 py-2 rounded-full font-medium hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(15,23,42,1)] transition-all tap-grow"
          >
            Generar Apuntes
          </Link>
        </nav>
        {/* Mobile menu button */}
        <button
          className="sm:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-700/80 bg-slate-950/80 text-slate-100 shadow-[0_14px_35px_rgba(15,23,42,1)] tap-grow"
          aria-label="Abrir menú"
          onClick={() => setIsMenuOpen((v) => !v)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        {/* Mobile dropdown */}
        {isMenuOpen && (
          <div className="sm:hidden absolute top-full left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800 shadow-[0_18px_45px_rgba(15,23,42,1)]">
            <div className="px-4 py-4 flex flex-col gap-3">
              <div className="pb-2 border-b border-slate-800">
                <AppInfoDropdown />
              </div>
              <Link
                href={isLoggedIn ? "/profile" : "/login"}
                className="text-slate-200 hover:text-sky-300 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Mi cuenta
              </Link>
              <Link
                href="/generar"
                onClick={() => setIsMenuOpen(false)}
                className="mt-1 bg-[radial-gradient(circle_at_0_0,#22d3ee,transparent_55%),radial-gradient(circle_at_100%_0,#a855f7,transparent_55%),linear-gradient(90deg,#1d4ed8,#4f46e5,#a855f7)] text-white px-4 py-2 rounded-full font-medium text-center shadow-[0_18px_45px_rgba(15,23,42,1)]"
              >
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
            {/* Overlay oscuro para mejorar la legibilidad del texto */}
            <div className="pointer-events-none absolute inset-4 sm:inset-6 rounded-[1.75rem] bg-slate-950/88" />
            <div className="pointer-events-none absolute -top-24 -left-10 w-56 h-56 rounded-full bg-white/5 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-10 w-64 h-64 rounded-full bg-white/5 blur-3xl" />

            <div className="text-center relative z-10">
              <div className="inline-flex items-center gap-2 bg-slate-950/80 px-4 py-2 rounded-full text-sky-300 font-medium mb-6 ring-1 ring-sky-400/60 shadow-[0_16px_40px_rgba(15,23,42,1)]">
                <span className="size-2 rounded-full bg-emerald-400 inline-block shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
                Optimizado para universidad, bachillerato y oposiciones
              </div>

              <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-2 sm:mb-3 leading-tight tracking-tight text-slate-50">
                <span className="text-slate-50">
                  Convierte tus apuntes en resultados reales
                </span>
                <br />
                <span className="text-slate-200">
                  4 herramientas en una: Apuntes, Flashcards, Tipo Test y Preguntas largas
                </span>
              </h1>

              <p className="mx-auto text-base sm:text-lg md:text-xl text-slate-200 mb-7 sm:mb-10 max-w-3xl leading-relaxed">
                Sube una foto y deja que la IA haga el resto: genera apuntes claros, flashcards para memorizar, tests con explicación y preguntas largas con corrección automática. Ajusta nivel, dificultad y estilo de explicación para estudiar justo como necesitas y mejorar tus notas más rápido.
              </p>

              <div className="flex items-center justify-center">
                <Link
                  href="/generar"
                  className="group/cta bg-[radial-gradient(circle_at_0_0,#22d3ee,transparent_55%),radial-gradient(circle_at_100%_0,#a855f7,transparent_55%),linear-gradient(90deg,#1d4ed8,#4f46e5,#a855f7)] text-white px-7 sm:px-9 py-4 rounded-full font-semibold text-lg flex items-center gap-3 ring-1 ring-indigo-300/60 hover:ring-sky-300/80 shadow-[0_22px_60px_rgba(15,23,42,1)] hover:-translate-y-0.5 hover:shadow-[0_26px_70px_rgba(15,23,42,1)] transition-all duration-200 tap-grow"
                >
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
        <div className="max-w-6xl mx-auto rounded-3xl bg-slate-950/85 border border-slate-800 px-4 sm:px-8 py-8 sm:py-10 shadow-[0_18px_45px_rgba(15,23,42,1)]">
          <div className="text-left reveal">
            <h2 className="section-title text-3xl md:text-4xl font-extrabold tracking-tight text-slate-50 mb-6">
              ¿Por qué elegir <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">StudyCaptures</span>?
            </h2>
            <p className="section-lead mb-10 text-slate-200">
              Optimizado para apuntes reales, no perfectos: funciona con fotos oscuras, torcidas o con letra complicada, limpiando el contenido y priorizando definiciones clave, fórmulas importantes, pasos de resolución y ejemplos típicos de examen.
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
                        Transforma tus fotos en resúmenes didácticos con explicaciones claras, ejemplos y conexiones entre ideas. Perfectos para repasar en poco tiempo antes de un examen.
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
                        Genera al instante tarjetas pregunta/respuesta listas para memorizar de forma activa, con feedback inmediato para fijar mejor cada concepto.
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
                        Crea tests de opción múltiple a partir de tus apuntes y corrige al momento o al final, con explicación de aciertos y errores para entender el “por qué”.
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
                      <IconQuestion />
                    </span>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">Preguntas largas</h3>
                      <p className="text-gray-700 leading-relaxed">
                        Responde preguntas abiertas basadas en tus apuntes y recibe corrección automática con porcentaje de acierto, puntos fuertes, aspectos a mejorar y una solución modelo para comparar.
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
        <div className="max-w-6xl mx-auto rounded-3xl bg-slate-950/85 border border-slate-800 px-4 sm:px-8 py-8 sm:py-10 shadow-[0_18px_45px_rgba(15,23,42,1)]">
          <div className="text-center mb-8 sm:mb-12 reveal">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-50">4 herramientas, un solo lugar</h2>
            <p className="text-slate-200 mt-3">Todo lo que necesitas para estudiar mejor, organizar tus temas y subir tus notas.</p>
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
              <p className="text-gray-700 mt-1">Resúmenes claros con explicaciones, ejemplos y pasos clave por tema para entender el contenido de un vistazo.</p>
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
              <p className="text-gray-700 mt-1">Tarjetas Q/A para memorizar más rápido con práctica activa y repetición espaciada.</p>
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
              <p className="text-gray-700 mt-1">Practica preguntas reales y aprende de los fallos con explicación detallada de cada respuesta.</p>
              <Link href="/generar/test" className="inline-block mt-3 text-sm font-semibold text-amber-700 hover:underline">Ir a test →</Link>
            </div>
            {/* Preguntas largas */}
            <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-500 to-teal-500 text-white flex items-center justify-center mb-4">
                <IconQuestion />
              </div>
              <h3 className="font-bold text-lg text-gray-900">Preguntas largas</h3>
              <p className="text-gray-700 mt-1">Responde preguntas largas y recibe corrección automática con porcentaje de acierto y respuesta modelo para aprender de verdad.</p>
              <Link href="/generar/mapas" className="inline-block mt-3 text-sm font-semibold text-emerald-700 hover:underline">Ir a Preguntas largas →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de video eliminada temporalmente */}

      {/* Planes y precios (Mensual / Anual) */}
      <section
        id="precios"
        className="px-4 sm:px-6 py-14 sm:py-20 bg-gradient-to-br from-slate-950/50 via-slate-900/60 to-slate-950/80 scroll-mt-24 border-y border-slate-800/80"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-50">
              Planes{" "}
              <span className="bg-[radial-gradient(circle_at_0_0,#22d3ee,transparent_55%),radial-gradient(circle_at_100%_0,#a855f7,transparent_55%),linear-gradient(90deg,#e5e7eb,#e0f2fe,#c7d2fe)] bg-clip-text text-transparent">
                claros
              </span>
            </h2>
            <p className="text-slate-300 mt-3">
              Elige el plan que encaja con tu curso y tu ritmo de estudio.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            {/* Mensual */}
            <div className="group relative overflow-visible reveal">
              <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-500 bg-[radial-gradient(circle_at_0_0,rgba(56,189,248,0.45),transparent_55%),radial-gradient(circle_at_100%_0,rgba(168,85,247,0.5),transparent_55%)] rounded-3xl" />
              <div className="relative rounded-3xl p-0.5 bg-[radial-gradient(circle_at_0_0,#22d3ee,transparent_55%),radial-gradient(circle_at_100%_0,#a855f7,transparent_55%),linear-gradient(90deg,#1d4ed8,#4f46e5,#a855f7)]">
                <div className="rounded-3xl bg-slate-950/90 p-7 sm:p-8 border border-slate-800 shadow-[0_20px_55px_rgba(15,23,42,1)]">
                  <div className="mb-5">
                    <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-300 ring-1 ring-sky-400/60">
                      Flexibilidad mensual
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-50">Mensual</h3>
                  <p className="text-slate-400 mt-1 mb-5">
                    Ideal para trabajos y épocas de exámenes
                  </p>
                  <div className="text-4xl font-extrabold text-sky-300">
                    4,99€{" "}
                    <span className="text-base font-normal text-slate-400">
                      / mes
                    </span>
                  </div>
                  <ul className="space-y-3 mt-6 mb-7">
                    <li className="flex items-start gap-3"><Check /> Desbloquea las 4 herramientas: Apuntes, Flashcards, Tipo Test y Preguntas largas</li>
                    <li className="flex items-start gap-3"><Check /> Procesamiento alto sin esperas</li>
                    <li className="flex items-start gap-3"><Check /> Plantillas y estilos personalizables</li>
                    <li className="flex items-start gap-3"><Check /> Exportación a HTML limpia</li>
                    <li className="flex items-start gap-3"><Check /> Soporte por email en 24h</li>
                  </ul>
                  <button
                    onClick={() => handleSubscribe("monthly")}
                    className="w-full bg-[radial-gradient(circle_at_0_0,#22d3ee,transparent_55%),radial-gradient(circle_at_100%_0,#a855f7,transparent_55%),linear-gradient(90deg,#1d4ed8,#4f46e5,#a855f7)] text-white py-3 rounded-full font-semibold hover:shadow-[0_24px_70px_rgba(15,23,42,1)] transition-all disabled:opacity-60 tap-grow"
                    disabled={loadingPlan === "monthly"}
                  >
                    {loadingPlan === "monthly" ? "Redirigiendo..." : "Elegir mensual"}
                  </button>
                </div>
              </div>
            </div>

            {/* Anual */}
            <div className="group relative overflow-visible reveal">
              <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-500 bg-[radial-gradient(circle_at_0_0,rgba(56,189,248,0.6),transparent_55%),radial-gradient(circle_at_100%_0,rgba(168,85,247,0.6),transparent_55%)] rounded-3xl" />
              <div className="relative rounded-3xl p-0.5 bg-[radial-gradient(circle_at_0_0,#22d3ee,transparent_55%),radial-gradient(circle_at_100%_0,#a855f7,transparent_55%),linear-gradient(120deg,#4f46e5,#a855f7,#ec4899)] shadow-[0_26px_75px_rgba(15,23,42,1)]">
                <div className="rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-950 to-slate-950 p-7 sm:p-8 text-slate-50">
                  <div className="mb-5 flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/50">
                      Mejor relación
                    </span>
                    <span className="hidden sm:inline text-xs bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-700/80 text-slate-200">
                      Ahorra 33%
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold">Anual</h3>
                  <p className="text-slate-300 mt-1 mb-5">
                    Para todo el curso con máximo ahorro
                  </p>
                  <div className="text-4xl font-extrabold">
                    39,99€{" "}
                    <span className="text-base font-normal text-slate-300">
                      / año
                    </span>
                  </div>
                  <ul className="space-y-3 mt-6 mb-7">
                    <li className="flex items-start gap-3"><Check contrast /> Desbloquea las 4 herramientas: Apuntes, Flashcards, Tipo Test y Preguntas largas</li>
                    <li className="flex items-start gap-3"><Check contrast /> Todo del plan mensual</li>
                    <li className="flex items-start gap-3"><Check contrast /> Historial y organización de proyectos</li>
                    <li className="flex items-start gap-3"><Check contrast /> Prioridad en nuevas funciones</li>
                    <li className="flex items-start gap-3"><Check contrast /> Descuentos en futuras herramientas</li>
                  </ul>
                  <button
                    onClick={() => handleSubscribe("yearly")}
                    className="w-full bg-slate-50 text-slate-950 py-3 rounded-full font-semibold hover:shadow-[0_24px_70px_rgba(15,23,42,1)] transition-all disabled:opacity-60 tap-grow"
                    disabled={loadingPlan === "yearly"}
                  >
                    {loadingPlan === "yearly" ? "Redirigiendo..." : "Elegir anual"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 sm:mt-10 text-center text-sm text-slate-400 flex flex-col sm:flex-row items-center justify-center gap-3">
            <span className="inline-flex items-center gap-2">
              <span role="img" aria-label="seguro">
                🔒
              </span>{" "}
              Pagos seguros con Stripe
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="inline-flex items-center gap-2">
              ⏱️ Cancelas cuando quieras
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="inline-flex items-center gap-2">
              🎯 Sin límites para estudiar a tu ritmo
            </span>
          </div>
        </div>
      </section>

      {/* Study Tips Section */}
      <section className="px-6 py-20 bg-gradient-to-br from-slate-950/60 via-slate-900/60 to-slate-950/80 border-t border-slate-800/80">
        <div className="max-w-6xl mx-auto">
          <div className="reveal">
            <StudyTips />
          </div>
        </div>
      </section>

      {/* Footer oscuro coherente */}
      <footer className="px-4 sm:px-6 py-10 sm:py-14">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-950 p-8 sm:p-10 text-center reveal shadow-[0_18px_45px_rgba(15,23,42,1)]">
            <div className="pointer-events-none absolute -top-16 -left-16 w-40 h-40 rounded-full bg-sky-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-10 w-48 h-48 rounded-full bg-fuchsia-500/20 blur-3xl" />
            <div className="relative flex items-center justify-center gap-3 mb-5">
              <div className="size-9 rounded-xl bg-[radial-gradient(circle_at_0_0,#22d3ee,transparent_55%),radial-gradient(circle_at_100%_0,#a855f7,transparent_55%),linear-gradient(135deg,#1d4ed8,#4f46e5,#a855f7)] flex items-center justify-center shadow-[0_18px_45px_rgba(15,23,42,0.9)]">
                <img src="/LOGO%20WEB.png" alt="StudyCaptures" className="w-5 h-5 object-contain" />
              </div>
              <span className="font-extrabold text-lg bg-[radial-gradient(circle_at_0_0,#22d3ee,transparent_55%),radial-gradient(circle_at_100%_0,#a855f7,transparent_55%),linear-gradient(90deg,#e5e7eb,#e0f2fe,#c7d2fe)] bg-clip-text text-transparent">
                StudyCaptures
              </span>
            </div>
            <p className="text-slate-300 mb-4">
              © {new Date().getFullYear()} StudyCaptures · Revolucionando la educación con IA
            </p>
            <div className="flex items-center justify-center gap-5 text-sm">
              <a href="/privacy" className="text-slate-200 hover:text-sky-300 hover:underline">
                Privacidad
              </a>
              <a href="/terms" className="text-slate-200 hover:text-sky-300 hover:underline">
                Términos
              </a>
              <span className="text-slate-400">Soporte: studycapturesai@gmail.com</span>
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

function IconQuestion() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M11.3 16.2h1.4v1.4h-1.4z" fill="currentColor" />
      <path
        d="M12 14.4v-.35c0-.9.58-1.4 1.22-1.82.63-.43 1.3-.93 1.3-1.93 0-1.53-1.19-2.5-2.8-2.5-1.49 0-2.56.9-2.83 2.2l-.09.47h1.68l.07-.19c.2-.6.63-1 1.32-1 .68 0 1.1.4 1.1 1.02 0 .47-.26.77-.82 1.07-.95.52-1.88 1.17-1.88 2.7v.33H12Z"
        fill="currentColor"
      />
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
