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
      <header className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between bg-white/80 supports-[backdrop-filter]:bg-white/70 backdrop-blur border-b border-purple-200/70 sticky top-0 z-30 pt-[env(safe-area-inset-top)] transition-all">
        <div className="flex items-center gap-2 sm:gap-3">
            <div className="size-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <img src="/logo.svg" alt="StudyCaptures" className="w-6 h-6" />
          </div>
            <span className="hidden sm:inline font-bold text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            StudyCaptures
          </span>
        </div>
        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-6">
          <AppInfoDropdown />
          {isLoggedIn && (
            <Link href="/profile" className="text-gray-600 hover:text-purple-600 transition-colors font-medium">
              Mi cuenta
            </Link>
          )}
          <Link href={isLoggedIn ? "/generar" : "/login"} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-full font-medium hover:shadow-lg transition-all transform hover:scale-105">
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
          <div className="sm:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur border-b border-purple-200 shadow-sm">
            <div className="px-4 py-4 flex flex-col gap-3">
              <div className="pb-2 border-b border-purple-100">
                <AppInfoDropdown />
              </div>
              {isLoggedIn && (
                <Link href="/profile" className="text-gray-700" onClick={() => setIsMenuOpen(false)}>Mi cuenta</Link>
              )}
              <Link href={isLoggedIn ? "/generar" : "/login"} onClick={() => setIsMenuOpen(false)} className="mt-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full font-medium text-center">
                Generar Apuntes
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero + Why Section side by side */}
      <section className="px-4 sm:px-6 py-10 sm:py-16">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 sm:gap-10 items-start">
          {/* Left: Hero */}
          <div className="text-left reveal">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2 rounded-full text-purple-700 font-medium mb-6">
              <span className="size-2 rounded-full bg-purple-500 inline-block" />
              Optimizado para universidad, bachillerato y oposiciones
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 reveal">
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                Convierte fotos de apuntes y pizarras
              </span>
              <br />
              <span className="text-gray-800">en resúmenes listos para examen</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl leading-relaxed reveal">
              Extraemos conceptos clave, fórmulas, definiciones y esquemas para crear resúmenes por temas,
              priorizando lo que más cae en examen. Ideal para repasar rápido, preparar fichas y memorizar con color.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 reveal">
              <Link href="/generar" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 sm:px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl transition-all transform hover:scale-105 tap-grow flex items-center justify-center gap-3 w-full sm:w-fit">
                Comenzar ahora
                <IconArrowRight />
              </Link>
            </div>
          </div>

          {/* Right: Why Apuntes IA */}
          <div id="porque" className="text-left lg:border-l lg:border-black/10 lg:pl-10 scroll-mt-24 reveal">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
              ¿Por qué elegir <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">StudyCaptures</span>?
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Diseñado para el estudio real: convierte fotos con luces, sombras o escritura irregular en material claro,
              priorizando definiciones, fórmulas, pasos de resolución y ejemplos frecuentes de exámenes.
            </p>

            <div className="space-y-4 sm:space-y-5">
              <div className="relative overflow-hidden rounded-2xl border border-purple-200 bg-white card-smooth reveal shadow-sm hover:shadow-lg transition-all">
                <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-purple-500 to-pink-500" />
                <div className="p-5 sm:p-6 md:p-7 flex items-start gap-4">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-purple-50 text-purple-600 ring-1 ring-purple-200 flex-shrink-0">
                    <IconCamera />
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">Subida inteligente</h3>
                    <p className="text-gray-700 leading-relaxed">
                      OCR de alta calidad para texto manuscrito y diagramas. El sistema limpia ruido, endereza la captura y
                      separa títulos, listas y fórmulas para un resultado legible y ordenado.
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-blue-200 bg-white card-smooth reveal shadow-sm hover:shadow-lg transition-all">
                <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-blue-500 to-indigo-500" />
                <div className="p-5 sm:p-6 md:p-7 flex items-start gap-4">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-200 flex-shrink-0">
                    <IconPalette />
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">Personalización total</h3>
                    <p className="text-gray-700 leading-relaxed">
                      Elige nivel (básico, medio, avanzado), enfoque (definiciones, demostraciones, problemas tipo) y estilo visual
                      (neutro, pastel o vivo) para estudiar a tu manera.
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-purple-200 bg-white card-smooth reveal shadow-sm hover:shadow-lg transition-all">
                <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-fuchsia-500 to-purple-600" />
                <div className="p-5 sm:p-6 md:p-7 flex items-start gap-4">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-purple-50 text-purple-600 ring-1 ring-purple-200 flex-shrink-0">
                    <IconBolt />
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">Resultados al instante</h3>
                    <p className="text-gray-700 leading-relaxed">
                      Apuntes estructurados por secciones, con puntos clave, pasos enumerados y bloques destacados para fórmulas y
                      conceptos que suelen caer.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo funciona (video) */}
      <section id="como-funciona" className="px-4 sm:px-6 py-12 sm:py-20 scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-10 reveal">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Cómo funciona
            </h2>
            <p className="mt-3 text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              Sube tus fotos y obtén resúmenes claros, bonitos y listos para estudiar.
            </p>
          </div>
          <div className="relative bg-white rounded-2xl border border-purple-200 shadow-sm p-3 sm:p-4 reveal card-smooth">
            <div className="aspect-video w-full rounded-xl bg-gray-100 relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/10 to-transparent" />
              <video
                src="/copy_C17B0044-CCF5-4355-85D1-E04EB3792482%20(1).mp4"
                controls
                playsInline
                preload="metadata"
                className="w-full h-full object-cover rounded-xl"
                poster="/how-it-works-poster.svg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precios" className="px-4 sm:px-6 py-12 sm:py-20 bg-gradient-to-br from-purple-50 to-pink-50 scroll-mt-24">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3 sm:mb-4">
            Planes <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">claros</span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 sm:mb-12">Elige el plan que mejor encaja con tu ritmo de estudio</p>
          
          <div className="flex gap-5 overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-2 md:gap-8 md:overflow-visible -mx-4 px-4 md:m-0 md:p-0">
            <div className="relative group reveal shrink-0 min-w-[88%] snap-center md:min-w-0 md:shrink">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-400/30 via-pink-400/30 to-blue-400/30 opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500"></div>
              <div className="relative bg-white p-8 rounded-2xl border border-purple-200 shadow-lg text-left transition-all duration-300 md:group-hover:shadow-2xl md:group-hover:-translate-y-1 group-hover:border-purple-400 card-smooth">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Mensual</h3>
              <p className="text-gray-600 mb-6">Ideal para trabajos y épocas de exámenes</p>
                <div className="text-4xl font-bold text-purple-600 mb-6 transition-transform duration-300 group-hover:scale-105">4,99€ <span className="text-base font-normal text-gray-500">/ mes</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3"><Check /> Procesamiento alto sin esperas</li>
                <li className="flex items-start gap-3"><Check /> Plantillas y estilos personalizables</li>
                <li className="flex items-start gap-3"><Check /> Exportación a HTML limpia</li>
                <li className="flex items-start gap-3"><Check /> Soporte por email en 24h</li>
              </ul>
                <button onClick={() => handleSubscribe("monthly")} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-full font-semibold hover:shadow-xl hover:shadow-purple-300/50 transition-all disabled:opacity-60 tap-grow" disabled={loadingPlan === "monthly"}>
                  {loadingPlan === "monthly" ? "Redirigiendo..." : "Elegir mensual"}
                </button>
                <div className="mt-3 flex items-center justify-center gap-2 text-gray-500 text-sm">
                  <span role="img" aria-label="seguro">🔒</span>
                  <span>Pagos 100% seguros con Stripe</span>
                </div>
              </div>
              </div>
            <div className="relative group reveal shrink-0 min-w-[88%] snap-center md:min-w-0 md:shrink">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-600/40 via-pink-600/40 to-purple-800/40 opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500"></div>
              <div className="relative bg-gradient-to-br from-purple-500 to-pink-500 p-8 rounded-2xl text-white shadow-xl md:transform md:scale-105 text-left transition-all duration-300 md:group-hover:-translate-y-1 md:group-hover:shadow-2xl md:group-hover:scale-110">
                <div className="absolute -top-3 right-4">
                  <span className="px-3 py-1 rounded-full bg-white text-purple-600 text-xs font-bold shadow-sm ring-1 ring-white/60">Popular</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-bold">Anual</h3>
                  <span className="hidden sm:inline-block bg-white/20 backdrop-blur px-3 py-1 rounded-full text-sm font-semibold">Mejor relación calidad/precio</span>
                </div>
                <p className="text-purple-100 mb-6">Para todo el curso con máximo ahorro</p>
                <div className="text-4xl font-bold mb-6 transition-transform duration-300 group-hover:scale-110">39,99€ <span className="text-base font-normal text-purple-100">/ año</span></div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3"><Check contrast /> Todo del plan mensual</li>
                  <li className="flex items-start gap-3"><Check contrast /> Historial y organización de proyectos</li>
                  <li className="flex items-start gap-3"><Check contrast /> Prioridad en nuevas funciones</li>
                  <li className="flex items-start gap-3"><Check contrast /> Descuentos en futuras herramientas</li>
                </ul>
                <button onClick={() => handleSubscribe("yearly")} className="w-full bg-white text-purple-600 py-3 rounded-full font-semibold hover:shadow-2xl hover:shadow-white/30 transition-all disabled:opacity-60 tap-grow" disabled={loadingPlan === "yearly"}>
                  {loadingPlan === "yearly" ? "Redirigiendo..." : "Elegir anual"}
                </button>
                <div className="mt-3 flex items-center justify-center gap-2 text-white/90 text-sm">
                  <span role="img" aria-label="seguro">🔒</span>
                  <span>Pagos 100% seguros con Stripe</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-200 text-left reveal card-smooth">
            <h3 className="text-xl font-bold text-gray-800 mb-2">🔒 Acceso de Pago</h3>
            <p className="text-gray-700">Para usar StudyCaptures necesitas una suscripción activa. Elige el plan que mejor se adapte a tu ritmo de estudio.</p>
          </div>
        </div>
      </section>

      {/* Study Tips Section */}
      <section className="px-6 py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-6xl mx-auto">
          <div className="reveal"><StudyTips /></div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 sm:px-6 py-8 sm:py-12 bg-gray-800 text-white">
        <div className="max-w-4xl mx-auto text-center reveal">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="size-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <img src="/logo.svg" alt="StudyCaptures" className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl">StudyCaptures</span>
          </div>
          <p className="text-gray-400 mb-4">
            © {new Date().getFullYear()} StudyCaptures · Revolucionando la educación con IA
          </p>
          <p className="text-gray-500 text-sm">
            Soporte: tastypathhelp@gmail.com
          </p>
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
