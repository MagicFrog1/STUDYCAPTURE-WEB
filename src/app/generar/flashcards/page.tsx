"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppInfoDropdown from "@/components/AppInfoDropdown";
import { pdfFileToImages } from "@/lib/pdfToImages";

type FlashcardsOptions = {
  count: 10 | 20 | 30;
  difficulty: "baja" | "media" | "alta";
  level: "secundaria" | "bachillerato" | "universidad" | "oposiciones";
  focus: "definiciones" | "conceptos" | "aplicaciones" | "problemas";
};

type Flashcard = { id: string; question: string; answer: string };

export default function FlashcardsPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [context, setContext] = useState("");
  const [values, setValues] = useState<FlashcardsOptions>({ count: 10, difficulty: "media", level: "universidad", focus: "conceptos" });
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Flashcard[] | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const uploadRef = useRef<HTMLDivElement | null>(null);
  const settingsRef = useRef<HTMLDivElement | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<"" | "monthly" | "yearly">("");
  const [flipped, setFlipped] = useState<Set<string>>(new Set());
  const [trialActive, setTrialActive] = useState(false);

  const toggleFlip = useCallback((id: string) => {
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.style.scrollBehavior = "smooth";
      return () => {
        document.documentElement.style.scrollBehavior = "auto";
      };
    }
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

  // Login check (mismo patrón que en panel de apuntes)
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const logged = Boolean(data.session);
      setIsLoggedIn(logged);
      if (!logged) {
        router.replace("/login");
        return;
      }
      // Comprobar estado premium desde profiles
      if (data.session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_premium')
          .eq('user_id', data.session.user.id)
          .maybeSingle();
        if (profile?.is_premium) setIsPremium(true);
        const { data: u } = await supabase.auth.getUser();
        const user = u.user;
        // @ts-ignore
        const confirmedAt: string | null = user?.email_confirmed_at ?? user?.confirmed_at ?? user?.created_at ?? null;
        if (confirmedAt) {
          const trialUntil = new Date(confirmedAt).getTime() + 7 * 24 * 60 * 60 * 1000;
          setTrialActive(Date.now() < trialUntil);
        }
      }
    })();
  }, [router]);

  const onFiles = useCallback(async (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list).filter((f) => f.type.startsWith("image/") || f.type === "application/pdf");
    if (incoming.length === 0) return;
    setConverting(true);
    try {
      const directImages = incoming.filter((f) => f.type.startsWith("image/"));
      const pdfs = incoming.filter((f) => f.type === "application/pdf");
      const renderedArrays = await Promise.all(pdfs.map((pdf) => pdfFileToImages(pdf, Number.MAX_SAFE_INTEGER, 1.5)));
      const rendered = renderedArrays.flat();
      const next = [...directImages, ...rendered, ...pdfs];
      setFiles((prev) => [...prev, ...next]);
    } catch (e) {
      console.error("Error convirtiendo PDF a imágenes", e);
      setError("No se pudo procesar uno de los PDFs. Intenta con otro archivo o sube imágenes.");
    } finally {
      setConverting(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    onFiles(e.dataTransfer.files);
  }, [onFiles]);

  const handleUploadClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const canSubmit = useMemo(() => {
    return files.length > 0 && files.length <= 20 && !loading && !converting;
  }, [files.length, loading, converting]);
  
  const fileWarning = useMemo(() => {
    if (files.length === 0) return null;
    if (files.length > 20) return "Has seleccionado demasiados archivos. El máximo son 20.";
    if (files.length < 2) return "Para mejores resultados, sube al menos 2 archivos.";
    return null;
  }, [files.length]);

  async function handleSubscribe(plan: "monthly" | "yearly") {
    try {
      setLoadingPlan(plan);
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        alert("Primero debes iniciar sesión para suscribirte");
        router.push("/login");
        setLoadingPlan("");
        return;
      }
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` },
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

  const handleSubmit = useCallback(async () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    // Bloqueo si no hay suscripción ni trial
    if (!isPremium && !trialActive) {
      setShowPaywall(true);
      return;
    }
    setError(null);
    setLoading(true);
    setResults(null);
    try {
      const form = new FormData();
      files.forEach((f) => form.append("files", f));
      form.append("options", JSON.stringify(values));
      if (context.trim()) {
        form.append("context", context.trim());
      }

      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/api/process-flashcards", { method: "POST", body: form, headers });
      if (!res.ok) {
        if (res.status === 402) {
          setShowPaywall(true);
          throw new Error("Necesitas una suscripción activa para generar flashcards.");
        }
        const msg = await res.text();
        throw new Error(msg || "Error procesando imágenes");
      }
      const data = (await res.json()) as { flashcards: Flashcard[] };
      setResults(data.flashcards);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [files, values, context, isLoggedIn, router, isPremium, trialActive]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header consistente con /generar/panel */}
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

      <main className="px-3 sm:px-6 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 reveal">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">
                Genera tus flashcards
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Sube imágenes y obtén tarjetas de estudio en formato pregunta/respuesta listas para repasar.
            </p>
          </div>

          <div className="grid lg:grid-cols-[1fr_1.1fr] gap-8 xl:gap-10">
            {/* Upload Section */}
            <div ref={uploadRef} className="space-y-6 scroll-mt-28">
              <div className="relative rounded-3xl border border-indigo-200 bg-white/90 shadow-xl overflow-hidden">
                <div className="absolute left-12 top-12 bottom-12 w-px bg-gradient-to-b from-blue-200 via-indigo-200 to-blue-200" aria-hidden />
                <div className="relative px-6 sm:px-8 py-7">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold">
                        1
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">Carga tus recursos</h2>
                          <p className="mt-1 text-sm sm:text-base text-gray-600 max-w-2xl">
                            Arrastra imágenes o PDFs. Procesamos cada página para extraer conceptos y crear tarjetas con pregunta-respuesta equilibradas.
                          </p>
                        </div>
                        <div className="hidden sm:flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-inner">
                          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                            <path d="M7 3h6l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8"/>
                            <path d="M13 3v5h5" stroke="currentColor" strokeWidth="1.8"/>
                          </svg>
                        </div>
                      </div>

                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOver(true);
                        }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        className={`mt-6 rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 ${dragOver ? "border-indigo-300 bg-indigo-50" : "border-blue-200 hover:border-indigo-200 bg-white"}`}
                      >
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
                              <path d="M7 3h6l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="#2563eb" strokeWidth="1.8"/>
                              <path d="M13 3v5h5" stroke="#2563eb" strokeWidth="1.8"/>
                            </svg>
                          </div>
                          <div>
                            <p className="text-lg font-medium text-gray-800">Arrastra y suelta tus recursos aquí</p>
                            <p className="text-gray-500 text-sm sm:text-base mt-1">o haz clic para buscar archivos (máx. 20). Los PDFs se fragmentan por página automáticamente.</p>
                          </div>
                          <button
                            onClick={handleUploadClick}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-2.5 rounded-full font-semibold hover:shadow-lg transition-all"
                          >
                            Seleccionar archivos
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          </button>
                          <input
                            ref={inputRef}
                            type="file"
                            accept="image/*,.pdf,application/pdf"
                            multiple
                            className="hidden"
                            onChange={(e) => onFiles(e.target.files)}
                          />
                        </div>
                      </div>

                      {files.length > 0 && (
                        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-blue-900">Archivos seleccionados ({files.length}/20)</h3>
                            {fileWarning && (
                              <span className={`text-xs font-medium px-3 py-1 rounded-full ${files.length > 20 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                {fileWarning}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                            {files.map((f, i) => {
                              const isPdf = f.type === "application/pdf";
                              return (
                                <div key={i} className="group relative rounded-xl overflow-hidden border border-indigo-100 bg-white hover:shadow-md transition-all">
                                  {isPdf ? (
                                    <div className="h-28 sm:h-32 w-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-indigo-500">
                                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                                        <path d="M7 3h6l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2"/>
                                        <path d="M13 3v5h5" stroke="currentColor" strokeWidth="2"/>
                                        <text x="50%" y="60%" fontSize="6" fill="currentColor" textAnchor="middle">PDF</text>
                                      </svg>
                                    </div>
                                  ) : (
                                    <img src={URL.createObjectURL(f)} alt={f.name} className="h-28 sm:h-32 w-full object-cover" />
                                  )}
                                  <button
                                    onClick={() => removeFile(i)}
                                    className="absolute top-2 right-2 bg-white text-indigo-600 w-8 h-8 rounded-full text-sm font-medium transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center shadow-lg"
                                    aria-label={`Eliminar ${f.name}`}
                                  >
                                    ✕
                                  </button>
                                  <div className="absolute bottom-2 left-2 bg-indigo-600/90 text-white px-2 py-1 rounded text-xs font-medium max-w-[calc(100%-1rem)] truncate">
                                    {f.name.length > 15 ? f.name.substring(0, 15) + "..." : f.name}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-indigo-200 bg-white shadow-md overflow-hidden reveal">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 sm:px-8 py-6">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold uppercase tracking-wide">Paso 2</span>
                  <h2 className="mt-3 text-2xl font-bold">Contexto para generar tarjetas</h2>
                  <p className="mt-1 text-sm sm:text-base text-white/80 max-w-2xl">Describe qué quieres practicar: definiciones, problemas, teoría… cuanto más específico seas, mejor se ajustarán las preguntas y respuestas.</p>
                </div>

                <div className="px-6 sm:px-8 py-6 space-y-6">
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                      <h3 className="text-sm font-semibold text-indigo-700 mb-2">Incluye</h3>
                      <ul className="text-sm text-indigo-700/80 space-y-1">
                        <li>• Tema o unidad</li>
                        <li>• Objetivo (repasar, memorizar)</li>
                        <li>• Nivel de detalle esperado</li>
                      </ul>
                    </div>
                    <div className="rounded-2xl border border-indigo-100 bg-white p-4">
                      <h3 className="text-sm font-semibold text-indigo-700 mb-2">Opcional</h3>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Ejemplos concretos</li>
                        <li>• Fórmulas o pasos clave</li>
                        <li>• Errores habituales</li>
                      </ul>
                    </div>
                    <div className="rounded-2xl border border-indigo-100 bg-white p-4">
                      <h3 className="text-sm font-semibold text-indigo-700 mb-2">Formato deseado</h3>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Pregunta directa o situacional</li>
                        <li>• Respuesta corta o desarrollo</li>
                        <li>• Idioma/estilo específico</li>
                      </ul>
                    </div>
                  </div>

                  <textarea
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    rows={4}
                    placeholder="Ej.: Anatomía (universidad). Tarjetas de definiciones y funciones de los músculos del brazo. Incluir ejemplos clínicos y aclarar diferencias entre flexores/extensores."
                    className="w-full rounded-2xl border border-indigo-200 bg-white px-4 py-3 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all resize-y"
                  />
                </div>
              </div>

              <div ref={settingsRef} className="rounded-3xl border border-indigo-200 bg-white shadow-md overflow-hidden reveal">
                <div className="px-6 sm:px-8 py-6 flex flex-col gap-4 bg-white">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold">3</div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Configura tus flashcards</h2>
                      <p className="text-sm sm:text-base text-gray-600 max-w-2xl">Escoge cuántas tarjetas necesitas, la dificultad, el nivel académico y el enfoque de las preguntas. Todo se adapta automáticamente al contenido detectado.</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                      <h3 className="text-sm font-semibold text-indigo-700 mb-2">Cantidad de tarjetas</h3>
                      <select value={values.count} onChange={(e) => setValues((v) => ({ ...v, count: Number(e.target.value) as FlashcardsOptions["count"] }))} className="w-full rounded-xl border border-indigo-200 bg-white px-4 py-3 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-sm">
                        <option value={10}>10 tarjetas</option>
                        <option value={20}>20 tarjetas</option>
                        <option value={30}>30 tarjetas</option>
                      </select>
                    </div>
                    <div className="rounded-2xl border border-blue-100 bg-white p-4">
                      <h3 className="text-sm font-semibold text-indigo-700 mb-2">Dificultad</h3>
                      <select value={values.difficulty} onChange={(e) => setValues((v) => ({ ...v, difficulty: e.target.value as FlashcardsOptions["difficulty"] }))} className="w-full rounded-xl border border-indigo-200 bg-white px-4 py-3 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-sm">
                        <option value="baja">Baja · Definiciones y conceptos esenciales</option>
                        <option value="media">Media · Conceptos y aplicaciones típicas</option>
                        <option value="alta">Alta · Profundidad, demostraciones y casos críticos</option>
                      </select>
                    </div>
                    <div className="rounded-2xl border border-blue-100 bg-white p-4">
                      <h3 className="text-sm font-semibold text-indigo-700 mb-2">Nivel académico</h3>
                      <select value={values.level} onChange={(e) => setValues((v) => ({ ...v, level: e.target.value as FlashcardsOptions["level"] }))} className="w-full rounded-xl border border-indigo-200 bg-white px-4 py-3 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-sm">
                        <option value="secundaria">Secundaria</option>
                        <option value="bachillerato">Bachillerato</option>
                        <option value="universidad">Universidad</option>
                        <option value="oposiciones">Oposiciones</option>
                      </select>
                    </div>
                    <div className="rounded-2xl border border-blue-100 bg-white p-4">
                      <h3 className="text-sm font-semibold text-indigo-700 mb-2">Enfoque de las preguntas</h3>
                      <select value={values.focus} onChange={(e) => setValues((v) => ({ ...v, focus: e.target.value as FlashcardsOptions["focus"] }))} className="w-full rounded-xl border border-indigo-200 bg-white px-4 py-3 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-sm">
                        <option value="definiciones">Definiciones</option>
                        <option value="conceptos">Conceptos</option>
                        <option value="aplicaciones">Aplicaciones</option>
                        <option value="problemas">Problemas</option>
                      </select>
                    </div>
                  </div>

                  <button onClick={handleSubmit} disabled={!canSubmit} aria-disabled={!canSubmit} className={`w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transition-all transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-3 tap-grow`}>
                    {loading ? (<><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Generando...</>) : (<>Generar flashcards personalizadas</>)}
                  </button>

                  {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-red-600 font-medium">Error: {error}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Results Section */}
            <div className="lg:sticky lg:top-6 lg:h-fit">
              <div ref={resultRef} className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-purple-200 scroll-mt-28 max-w-none card-smooth reveal">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Resultado</h2>
                {!results && (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <rect x="5" y="3" width="14" height="18" rx="2" stroke="#7c3aed" strokeWidth="1.8"/>
                        <path d="M8 7h8M8 11h8M8 15h5" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <p className="text-gray-500 text-lg">Aquí verás tus flashcards generadas para repasar rápidamente.</p>
                  </div>
                )}

                {results && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      {results.map((c) => {
                        const isFlipped = flipped.has(c.id);
                        return (
                          <div key={c.id} className="sc-perspective">
                            <div className="rounded-2xl p-[2px] bg-gradient-to-br from-purple-200/60 via-pink-200/60 to-blue-200/60 shadow-lg hover:shadow-2xl transition-shadow">
                              <button
                                type="button"
                                onClick={() => toggleFlip(c.id)}
                                className={`relative w-full h-40 sm:h-52 rounded-[14px] transition-transform duration-500 sc-preserve-3d bg-white focus:outline-none focus:ring-2 focus:ring-pink-300 ${isFlipped ? 'sc-rotate-y-180' : ''}`}
                              >
                                {/* Front */}
                                <div className="absolute inset-0 sc-backface-hidden rounded-[12px] p-4 sm:p-5 flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
                                  <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-1 rounded-full bg-white/80 ring-1 ring-pink-200 text-pink-700">Pregunta</span>
                                  <p className="text-gray-900 font-semibold text-center leading-relaxed text-[15px] sm:text-[16px]">
                                    {c.question}
                                  </p>
                                </div>
                                {/* Back */}
                                <div className="absolute inset-0 sc-backface-hidden sc-rotate-y-180 rounded-[12px] p-4 sm:p-5 flex items-center justify-center bg-white">
                                  <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-1 rounded-full bg-purple-600 text-white">Respuesta</span>
                                  <p className="text-gray-800 text-center leading-relaxed text-[15px] sm:text-[16px]">
                                    {c.answer}
                                  </p>
                                </div>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <style jsx>{`
                      .sc-perspective { perspective: 1000px; }
                      .sc-preserve-3d { transform-style: preserve-3d; }
                      .sc-backface-hidden { -webkit-backface-visibility: hidden; backface-visibility: hidden; }
                      .sc-rotate-y-180 { transform: rotateY(180deg); }
                    `}</style>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {showPaywall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-purple-200 card-smooth reveal is-visible">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Suscripción necesaria</h3>
              <button onClick={() => setShowPaywall(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <p className="text-gray-700 mb-2">Para generar flashcards necesitas una suscripción activa.</p>
            <p className="text-gray-700 mb-4">Con la suscripción desbloqueas las 4 herramientas: Apuntes, Flashcards, Tipo Test y Preguntas largas. Pasa de fotos a resultados: apuntes claros, tarjetas para memorizar, tests con explicación y preguntas con corrección automática, personalizando nivel, complejidad y estilo.</p>
            <div className="space-y-2">
              <Link href="/#precios" className="w-full inline-flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg tap-grow">Ir al panel de suscripción</Link>
              <button onClick={() => handleSubscribe("monthly")} disabled={loadingPlan === "monthly"} className="w-full bg-white text-purple-600 ring-1 ring-purple-200 py-3 rounded-xl font-semibold hover:shadow-md disabled:opacity-60 tap-grow">{loadingPlan === "monthly" ? "Redirigiendo..." : "Suscribirme mensual (4,99€ / mes)"}</button>
              <button onClick={() => handleSubscribe("yearly")} disabled={loadingPlan === "yearly"} className="w-full bg-white text-purple-600 ring-1 ring-purple-200 py-3 rounded-xl font-semibold hover:shadow-md disabled:opacity-60 tap-grow">{loadingPlan === "yearly" ? "Redirigiendo..." : "Suscribirme anual (39,99€ / año)"}</button>
            </div>
            <div className="mt-4 text-center text-sm"><Link href="/#precios" className="text-gray-600 hover:underline">Ver detalle de planes</Link></div>
          </div>
        </div>
      )}
    </div>
  );
}


