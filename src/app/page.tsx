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

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(Boolean(data.session));
    })();
  }, []);

  async function handleSubscribe(plan: "monthly" | "yearly") {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    try {
      setLoadingPlan(plan);
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { url?: string };
      if (data.url) window.location.href = data.url;
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPlan("");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between bg-white/80 backdrop-blur-sm border-b border-purple-200">
        <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <img src="/logo.svg" alt="StudyCaptures" className="w-6 h-6" />
          </div>
            <span className="font-bold text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            StudyCaptures
          </span>
        </div>
        <nav className="flex items-center gap-6">
          <AppInfoDropdown />
          <Link href="#porque" className="text-gray-600 hover:text-purple-600 transition-colors font-medium">
            Características
          </Link>
          <Link href="#precios" className="text-gray-600 hover:text-purple-600 transition-colors font-medium">
            Precios
          </Link>
          {isLoggedIn ? (
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                setIsLoggedIn(false);
              }}
              className="text-gray-600 hover:text-purple-600 transition-colors font-medium"
            >
              Cerrar sesión
            </button>
          ) : (
            <Link href="/login" className="text-gray-600 hover:text-purple-600 transition-colors font-medium">
              Entrar
            </Link>
          )}
          <Link href={isLoggedIn ? "/generar" : "/login"} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-full font-medium hover:shadow-lg transition-all transform hover:scale-105">
            Generar Apuntes
          </Link>
        </nav>
      </header>

      {/* Hero + Why Section side by side */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-start">
          {/* Left: Hero */}
          <div className="text-left">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2 rounded-full text-purple-700 font-medium mb-6">
              <span className="size-2 rounded-full bg-purple-500 inline-block" />
              Optimizado para universidad, bachillerato y oposiciones
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                Convierte fotos de apuntes y pizarras
              </span>
              <br />
              <span className="text-gray-800">en resúmenes listos para examen</span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-2xl leading-relaxed">
              Extraemos conceptos clave, fórmulas, definiciones y esquemas para crear resúmenes por temas,
              priorizando lo que más cae en examen. Ideal para repasar rápido, preparar fichas y memorizar con color.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/generar" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center gap-3 w-fit">
                Empezar Gratis
                <IconArrowRight />
              </Link>
            </div>
          </div>

          {/* Right: Why Apuntes IA */}
          <div id="porque" className="text-left lg:border-l lg:border-black/10 lg:pl-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
              ¿Por qué elegir <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">StudyCaptures</span>?
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Diseñado para el estudio real: convierte fotos con luces, sombras o escritura irregular en material claro,
              priorizando definiciones, fórmulas, pasos de resolución y ejemplos frecuentes de exámenes.
            </p>

            <div className="space-y-5">
              <div className="bg-white p-6 rounded-2xl border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-purple-50 text-purple-600 ring-1 ring-purple-200">
                    <IconCamera />
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900">Subida inteligente</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  OCR de alta calidad para texto manuscrito y diagramas. El sistema limpia ruido, endereza la captura y
                  separa títulos, listas y fórmulas para un resultado legible y ordenado.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-50 text-blue-600 ring-1 ring-blue-200">
                    <IconPalette />
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900">Personalización total</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  Elige nivel (básico, medio, avanzado), enfoque (definiciones, demostraciones, problemas tipo) y estilo visual
                  (neutro, pastel o vivo) para estudiar a tu manera.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-purple-50 text-purple-600 ring-1 ring-purple-200">
                    <IconBolt />
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900">Resultados al instante</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  Apuntes estructurados por secciones, con puntos clave, pasos enumerados y bloques destacados para fórmulas y
                  conceptos que suelen caer.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Study Tips Section */}
      <section className="px-6 py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-6xl mx-auto">
          <StudyTips />
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precios" className="px-6 py-20 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Planes <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">claros</span>
          </h2>
          <p className="text-xl text-gray-600 mb-12">Elige el plan que mejor encaja con tu ritmo de estudio</p>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="relative group">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-400/30 via-pink-400/30 to-blue-400/30 opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500"></div>
              <div className="relative bg-white p-8 rounded-2xl border border-purple-200 shadow-lg text-left transition-all duration-300 group-hover:shadow-2xl group-hover:-translate-y-1 group-hover:border-purple-400">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Mensual</h3>
              <p className="text-gray-600 mb-6">Ideal para trabajos y épocas de exámenes</p>
                <div className="text-4xl font-bold text-purple-600 mb-6 transition-transform duration-300 group-hover:scale-105">4,99€ <span className="text-base font-normal text-gray-500">/ mes</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3"><Check /> Procesamiento alto sin esperas</li>
                <li className="flex items-start gap-3"><Check /> Plantillas y estilos personalizables</li>
                <li className="flex items-start gap-3"><Check /> Exportación a HTML limpia</li>
                <li className="flex items-start gap-3"><Check /> Soporte por email en 24h</li>
              </ul>
                <button onClick={() => handleSubscribe("monthly")} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-full font-semibold hover:shadow-xl hover:shadow-purple-300/50 transition-all disabled:opacity-60" disabled={loadingPlan === "monthly"}>
                  {loadingPlan === "monthly" ? "Redirigiendo..." : "Elegir mensual"}
                </button>
              </div>
              </div>

            <div className="relative group">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-600/40 via-pink-600/40 to-purple-800/40 opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500"></div>
              <div className="relative bg-gradient-to-br from-purple-500 to-pink-500 p-8 rounded-2xl text-white shadow-xl transform scale-105 text-left transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl group-hover:scale-110">
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
                <button onClick={() => handleSubscribe("yearly")} className="w-full bg-white text-purple-600 py-3 rounded-full font-semibold hover:shadow-2xl hover:shadow-white/30 transition-all disabled:opacity-60" disabled={loadingPlan === "yearly"}>
                  {loadingPlan === "yearly" ? "Redirigiendo..." : "Elegir anual"}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-12 bg-white p-6 rounded-2xl border border-purple-200 text-left">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Prueba gratuita</h3>
            <p className="text-gray-600">Disfruta de 2 usos sin coste para comprobar cómo mejora tu estudio antes de elegir un plan.</p>
                </div>
              </div>
        </section>

      

      {/* Footer */}
      <footer className="px-6 py-12 bg-gray-800 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="size-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <span className="font-bold text-xl">Apuntes IA</span>
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
