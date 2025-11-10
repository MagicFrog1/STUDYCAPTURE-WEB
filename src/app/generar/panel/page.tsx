"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { pdfFileToImages } from "@/lib/pdfToImages";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppInfoDropdown from "@/components/AppInfoDropdown";

type FormValues = {
  size: "mini" | "media" | "larga";
  complexity: "baja" | "media" | "alta";
  colorStyle: "neutro" | "pastel" | "vivo";
  creativity: "preciso" | "equilibrado" | "creativo";
  fullTopic: boolean;
};

type ResultChunk = { id: string; title: string; content: string };

export default function GenerarPanelPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [context, setContext] = useState("");
  const [values, setValues] = useState<FormValues>({
    size: "media",
    complexity: "media",
    colorStyle: "pastel",
    creativity: "equilibrado",
    fullTopic: false,
  });
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResultChunk[] | null>(null);
  const themeClass = useMemo(() => {
    return values.colorStyle === "neutro" ? "theme-neutral" : values.colorStyle === "pastel" ? "theme-pastel" : "theme-vivo";
  }, [values.colorStyle]);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [max, setMax] = useState<number>(2);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const uploadRef = useRef<HTMLDivElement | null>(null);
  const settingsRef = useRef<HTMLDivElement | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<"" | "monthly" | "yearly">("");
  const [trialActive, setTrialActive] = useState(false);

  // Smooth scroll behavior for internal nav
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.style.scrollBehavior = "smooth";
      return () => {
        document.documentElement.style.scrollBehavior = "auto";
      };
    }
  }, []);

  // Reveal on scroll
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

  // Check session and premium status on mount
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const logged = Boolean(data.session);
      setIsLoggedIn(logged);
      if (!logged) {
        router.replace("/login");
        return;
      }
      // Check premium status from profiles table
      if (data.session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_premium')
          .eq('user_id', data.session.user.id)
          .maybeSingle();
        if (profile?.is_premium) {
          setRemaining(-1); // Premium active - unlimited access
        }
        // Calcular prueba gratuita (7 días desde confirmación/creación)
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
  }, []);

  const onFiles = useCallback(async (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list).filter((f) => f.type.startsWith("image/") || f.type === "application/pdf");
    if (incoming.length === 0) return;

    setConverting(true);
    try {
      const directImages = incoming.filter((f) => f.type.startsWith("image/"));
      const pdfs = incoming.filter((f) => f.type === "application/pdf");

      // Convertir TODAS las páginas de cada PDF a imágenes (puede tardar en PDFs muy largos)
      const renderedFromPdfArrays = await Promise.all(pdfs.map((pdf) => pdfFileToImages(pdf, Number.MAX_SAFE_INTEGER, 1.5)));
      const renderedFromPdfs = renderedFromPdfArrays.flat();

      // Añadimos también los PDFs originales para extraer su texto completo en el backend
      const next = [...directImages, ...renderedFromPdfs, ...pdfs];
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

  const isPremium = remaining === -1;
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
    // Si no hay suscripción activa ni prueba gratuita, bloquear
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

      // Obtener token de sesión para enviarlo al backend
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/api/process-notes", { method: "POST", body: form, headers });
      if (!res.ok) {
        if (res.status === 402) {
          setShowPaywall(true);
          throw new Error("Necesitas una suscripción activa para generar apuntes.");
        }
        const msg = await res.text();
        throw new Error(msg || "Error procesando imágenes");
      }
      const data = (await res.json()) as { chunks: ResultChunk[] };
      setResults(data.chunks);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [files, values, context, isLoggedIn, router, isPremium, trialActive]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
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

      <main className="px-3 sm:px-6 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-8 sm:mb-12 reveal">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                Genera tus apuntes
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Sube imágenes de tus apuntes y obtén apuntes completos y educativos. La IA usa su conocimiento interno para enriquecer el contenido con explicaciones detalladas, ejemplos adicionales y conexiones entre conceptos. Para mejores resultados, sube fotos de un único tema y proporciona contexto educativo.
            </p>
          </div>

          <div className="grid lg:grid-cols-[1fr_1.1fr] gap-8 xl:gap-10">
            {/* Upload Section */}
            <div ref={uploadRef} className="space-y-6 scroll-mt-28">
              <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 shadow-xl border border-purple-200 bg-gradient-to-br from-purple-600 via-pink-600 to-purple-500 text-white">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_#ffffff20,_transparent_45%)]" aria-hidden />
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold tracking-wide uppercase">
                      Paso 1
                    </span>
                    <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold">Sube tu material</h2>
                    <p className="mt-2 text-sm sm:text-base text-white/80 max-w-xl">
                      Aceptamos imágenes o PDFs. Convertimos automáticamente las páginas para extraer todo el contenido relevante.
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 shadow-inner">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-white">
                      <path d="M3 8a2 2 0 0 1 2-2h2l1.2-1.8A2 2 0 0 1 10.8 3h2.4a2 2 0 0 1 1.6.8L16 6h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                      <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.8"/>
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
                  className={`relative rounded-2xl border-2 border-dashed text-center p-8 transition-all duration-300 bg-white/10 backdrop-blur-sm ${dragOver ? "border-white/60 bg-white/15 scale-[1.02]" : "border-white/30 hover:border-white/50"}`}
                >
                  <div className="absolute inset-0 pointer-events-none rounded-2xl bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.18),_transparent_65%)]" />
                  <div className="relative flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M7 3h6l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="#ffffff" strokeWidth="1.8"/>
                        <path d="M13 3v5h5" stroke="#ffffff" strokeWidth="1.8"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-white mb-2">
                        Arrastra y suelta aquí tus imágenes o PDFs
                      </p>
                      <p className="text-white/80 mb-4 text-sm sm:text-base">
                        o haz clic para explorar archivos (máx. 20). Convertimos automáticamente los PDFs para extraer cada página.
                      </p>
                      <button
                        onClick={handleUploadClick}
                        className="inline-flex items-center gap-2 bg-white text-purple-600 font-semibold px-6 py-2.5 rounded-full shadow-md hover:shadow-xl transition-all transform hover:translate-y-[-1px]"
                      >
                        Seleccionar archivos
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M6 12h12M12 18V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
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
                  <div className="mt-6 bg-white/10 rounded-2xl p-5 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Archivos seleccionados ({files.length}/20)</h3>
                      {fileWarning && (
                        <span className={`text-xs font-medium px-3 py-1 rounded-full ${files.length > 20 ? 'bg-red-100/90 text-red-700' : 'bg-amber-100/90 text-amber-700'}`}>
                          {fileWarning}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                      {files.map((f, i) => {
                        const isPdf = f.type === "application/pdf";
                        return (
                          <div key={i} className="group relative rounded-xl overflow-hidden border border-white/30 bg-white/10 hover:bg-white/20 transition-all">
                            {isPdf ? (
                              <div className="h-28 sm:h-32 w-full flex items-center justify-center text-purple-100">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                                  <path d="M7 3h6l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2"/>
                                  <path d="M13 3v5h5" stroke="currentColor" strokeWidth="2"/>
                                  <text x="50%" y="60%" fontSize="6" fill="currentColor" textAnchor="middle">PDF</text>
                                </svg>
                              </div>
                            ) : (
                              <img src={URL.createObjectURL(f)} alt={f.name} className="h-28 sm:h-32 w-full object-cover opacity-90" />
                            )}
                            <button
                              onClick={() => removeFile(i)}
                              className="absolute top-2 right-2 bg-white text-purple-600 w-8 h-8 rounded-full text-sm font-semibold transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center shadow-lg"
                              aria-label={`Eliminar ${f.name}`}
                            >
                              ✕
                            </button>
                            <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs font-medium text-white max-w-[calc(100%-1rem)] truncate">
                              {f.name.length > 15 ? f.name.substring(0, 15) + "..." : f.name}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Contexto (opcional) */}
              <div className="relative rounded-3xl border border-purple-200 bg-white shadow-md overflow-hidden reveal">
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-purple-500 to-pink-500" aria-hidden />
                <div className="px-6 sm:px-8 py-6">
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold uppercase tracking-wide">
                        Paso 2
                      </span>
                      <h2 className="mt-3 text-2xl font-bold text-gray-900">Contexto educativo</h2>
                      <p className="mt-1 text-sm sm:text-base text-gray-600 max-w-2xl">
                        Cuéntanos qué necesitas: asignatura, nivel, objetivos, estilo del profesor, evaluaciones… cuanto más contexto, más afinadas serán las notas generadas.
                      </p>
                    </div>
                    <div className="hidden sm:block w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M4 7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H9l-4 3v-3a3 3 0 0 1-1-2V7Z" stroke="currentColor" strokeWidth="1.8"/>
                        <path d="M12 7v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                        <circle cx="12" cy="15" r="1" fill="currentColor" />
                      </svg>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50 p-4">
                      <h3 className="text-sm font-semibold text-purple-700 mb-2">Sugiere:</h3>
                      <ul className="space-y-1 text-sm text-purple-700/80">
                        <li>• Temario específico o unidad</li>
                        <li>• Objetivo (repaso, examen, trabajo)</li>
                        <li>• Estilo deseado (teórico, práctico, resúmenes)</li>
                      </ul>
                    </div>
                    <div className="rounded-2xl border border-purple-100 bg-white p-4">
                      <h3 className="text-sm font-semibold text-gray-800 mb-2">También ayuda:</h3>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>• Ejemplos que debería incluir</li>
                        <li>• Errores comunes a evitar</li>
                        <li>• Tipo de evaluación o rúbrica</li>
                      </ul>
                    </div>
                  </div>

                  <textarea
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    rows={5}
                    placeholder="Ejemplo: Asignatura Álgebra I (Universidad). Repasar matrices y determinantes para examen final. Profesor exige demostraciones y problemas aplicados."
                    className="w-full rounded-2xl border border-purple-200 bg-white px-4 py-3 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all resize-y"
                  />
                </div>
              </div>

              {/* Settings */}
              <div ref={settingsRef} className="rounded-3xl border border-purple-200 bg-white shadow-lg overflow-hidden reveal">
                <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 sm:px-8 py-6">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold uppercase">
                    Paso 3
                  </span>
                  <h2 className="mt-3 text-2xl font-bold">Personaliza tus apuntes</h2>
                  <p className="mt-1 text-sm sm:text-base text-white/80 max-w-2xl">Elige la extensión, complejidad y estilo visual. Ajustamos la redacción al nivel académico que especifiques.</p>
                </div>

                <div className="px-6 sm:px-8 py-6 space-y-6">
                  <div className="grid lg:grid-cols-3 gap-5">
                    <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50 p-4">
                      <h3 className="text-sm font-semibold text-purple-700 mb-2">Extensión del contenido</h3>
                      <select
                        value={values.size}
                        onChange={(e) => setValues((v) => ({ ...v, size: e.target.value as FormValues["size"] }))}
                        className="w-full rounded-xl border border-purple-200 bg-white px-4 py-3 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all text-sm"
                      >
                        <option value="mini">Mini · Conceptos clave + ejemplo</option>
                        <option value="media">Media · Desarrollo completo + ejemplos</option>
                        <option value="larga">Larga · Análisis profundo + aplicaciones</option>
                      </select>
                    </div>

                    <div className="rounded-2xl border border-purple-100 bg-white p-4">
                      <h3 className="text-sm font-semibold text-purple-700 mb-2">Complejidad</h3>
                      <select
                        value={values.complexity}
                        onChange={(e) => setValues((v) => ({ ...v, complexity: e.target.value as FormValues["complexity"] }))}
                        className="w-full rounded-xl border border-purple-200 bg-white px-4 py-3 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all text-sm"
                      >
                        <option value="baja">Baja · Lenguaje accesible y ejemplos sencillos</option>
                        <option value="media">Media · Terminología adecuada y explicaciones detalladas</option>
                        <option value="alta">Alta · Rigor técnico y demostraciones</option>
                      </select>
                    </div>

                    <div className="rounded-2xl border border-purple-100 bg-white p-4">
                      <h3 className="text-sm font-semibold text-purple-700 mb-2">Estilo visual</h3>
                      <select
                        value={values.colorStyle}
                        onChange={(e) => setValues((v) => ({ ...v, colorStyle: e.target.value as FormValues["colorStyle"] }))}
                        className="w-full rounded-xl border border-purple-200 bg-white px-4 py-3 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all text-sm"
                      >
                        <option value="neutro">Neutro · Presentación limpia y académica</option>
                        <option value="pastel">Pastel · Enfoque amigable y motivador</option>
                        <option value="vivo">Vivo · Impacto visual y dinamismo</option>
                      </select>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-purple-100 bg-white p-4">
                    <h3 className="text-sm font-semibold text-purple-700 mb-2">Nivel de enriquecimiento</h3>
                    <select
                      value={values.creativity}
                      onChange={(e) => setValues((v) => ({ ...v, creativity: e.target.value as FormValues["creativity"] }))}
                      className="w-full rounded-xl border border-purple-200 bg-white px-4 py-3 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all text-sm"
                    >
                      <option value="preciso">Preciso · Fiel al contenido original</option>
                      <option value="equilibrado">Equilibrado · Balance entre fidelidad y aporte</option>
                      <option value="creativo">Creativo · Enriquecimiento máximo con ejemplos, tips y conexiones</option>
                    </select>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    aria-disabled={!canSubmit}
                    className={`w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transition-all transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-3 tap-grow`}
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Generando apuntes...
                      </>
                    ) : (
                      <>Generar apuntes personalizados</>
                    )}
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
              <div ref={resultRef} className="bg-white rounded-2xl p-8 shadow-lg border border-purple-200 scroll-mt-28 max-w-none card-smooth reveal">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Resultado</h2>
                
                {!results && (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <rect x="5" y="3" width="14" height="18" rx="2" stroke="#7c3aed" strokeWidth="1.8"/>
                        <path d="M8 7h8M8 11h8M8 15h5" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <p className="text-gray-500 text-lg">
                      Aquí verás apuntes educativos completos, enriquecidos con explicaciones detalladas, ejemplos adicionales y conexiones entre conceptos, todo estructurado según tus preferencias.
                    </p>
                  </div>
                )}
                
                {results && (
                  <div className="space-y-6">
                    {results.map((r) => (
                      <article key={r.id} className={`rounded-2xl border-2 shadow-lg p-8 bg-white ${themeClass} transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}>
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white">
                              <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                          <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{r.title}</h3>
                        </div>
                        <div className="max-w-none leading-relaxed text-[15.5px] generated-html" dangerouslySetInnerHTML={{ __html: r.content }} />
                      </article>
                    ))}

                    <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-purple-200">
                      <button
                        onClick={() => {
                          const text = results.map((r) => r.title + "\n\n" + r.content.replace(/<[^>]+>/g, "")).join("\n\n---\n\n");
                          navigator.clipboard.writeText(text);
                        }}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-4 rounded-xl font-semibold hover:shadow-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2 tap-grow"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        Copiar texto
                      </button>
                      <button
                        onClick={() => {
                          const blob = new Blob([
                            "<html><head><meta charset=\"utf-8\"/><style>body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:20px;line-height:1.6;}</style></head><body>" +
                              results.map((r) => `<h2 style=\"color:#7c3aed\">${r.title}</h2>${r.content}`).join("<hr style=\"margin:30px 0\"/>") +
                            "</body></html>"
                          ], { type: "text/html" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "studycaptures.html";
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl font-semibold hover:shadow-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2 tap-grow"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2"/>
                          <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2"/>
                          <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        Descargar HTML
                      </button>
                    </div>
                  </div>
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
            <p className="text-gray-700 mb-2">Para generar apuntes necesitas una suscripción activa.</p>
            <p className="text-gray-700 mb-4">Con la suscripción desbloqueas las 4 herramientas: Apuntes, Flashcards, Tipo Test y Preguntas largas. Convierte fotos en resultados listos para estudiar: apuntes claros, tarjetas para memorizar, tests con explicación y preguntas largas con corrección automática; personaliza nivel, complejidad y estilo.</p>
            <div className="space-y-2">
              <Link href="/#precios" className="w-full inline-flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg tap-grow">
                Ir al panel de suscripción
              </Link>
              <button onClick={() => handleSubscribe("monthly")} disabled={loadingPlan === "monthly"} className="w-full bg-white text-purple-600 ring-1 ring-purple-200 py-3 rounded-xl font-semibold hover:shadow-md disabled:opacity-60 tap-grow">
                {loadingPlan === "monthly" ? "Redirigiendo..." : "Suscribirme mensual (4,99€ / mes)"}
              </button>
              <button onClick={() => handleSubscribe("yearly")} disabled={loadingPlan === "yearly"} className="w-full bg-white text-purple-600 ring-1 ring-purple-200 py-3 rounded-xl font-semibold hover:shadow-md disabled:opacity-60 tap-grow">
                {loadingPlan === "yearly" ? "Redirigiendo..." : "Suscribirme anual (39,99€ / año)"}
              </button>
            </div>
            <div className="mt-4 text-center text-sm">
              <Link href="/#precios" className="text-gray-600 hover:underline">Ver detalle de planes</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


