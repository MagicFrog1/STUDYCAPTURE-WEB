"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppInfoDropdown from "@/components/AppInfoDropdown";
import { pdfFileToImages } from "@/lib/pdfToImages";

type QuizOptions = {
  count: 5 | 10 | 20;
  difficulty: "baja" | "media" | "alta";
  instantCheck: boolean;
  level: "secundaria" | "bachillerato" | "universidad" | "oposiciones";
  focus: "definiciones" | "conceptos" | "aplicaciones" | "problemas";
};

type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanations?: string[]; // explicación por opción (si existe)
};

export default function QuizPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [context, setContext] = useState("");
  const [values, setValues] = useState<QuizOptions>({ count: 10, difficulty: "media", instantCheck: false, level: "universidad", focus: "conceptos" });
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [selected, setSelected] = useState<Record<string, number | null>>({});
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const uploadRef = useRef<HTMLDivElement | null>(null);
  const settingsRef = useRef<HTMLDivElement | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<"" | "monthly" | "yearly">("");
  const [trialActive, setTrialActive] = useState(false);

  useEffect(() => {
    const run = async () => {
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
    };
    run();
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

  const canSubmit = useMemo(() => files.length > 0 && files.length <= 20 && !loading && !converting, [files.length, loading, converting]);
  
  const fileWarning = useMemo(() => {
    if (files.length === 0) return null;
    if (files.length > 20) return "Has seleccionado demasiados archivos. El máximo son 20.";
    if (files.length < 2) return "Para mejores resultados, sube al menos 2 archivos.";
    return null;
  }, [files.length]);

  const handleGenerate = useCallback(async () => {
    setError(null);
    setLoading(true);
    setQuestions(null);
    setSelected({});
    setChecked(false);
    setScore(null);
    try {
      // Bloqueo si no hay suscripción ni trial
      if (!isPremium && !trialActive) {
        setShowPaywall(true);
        throw new Error("Suscripción requerida");
      }
      const form = new FormData();
      files.forEach((f) => form.append("files", f));
      form.append("options", JSON.stringify(values));
      if (context.trim()) form.append("context", context.trim());

      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {};
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

      const res = await fetch("/api/process-quiz", { method: "POST", body: form, headers });
      if (!res.ok) {
        if (res.status === 402) {
          setShowPaywall(true);
        }
        const msg = await res.text();
        throw new Error(msg || "Error generando test");
      }
      const data = (await res.json()) as { questions: QuizQuestion[] };
      setQuestions(data.questions);
      // Inicializar selección
      const initSel: Record<string, number | null> = {};
      for (const q of data.questions) initSel[q.id] = null;
      setSelected(initSel);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [files, values, context, isPremium, trialActive]);

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

  const pickOption = useCallback((qid: string, idx: number) => {
    setSelected((prev) => ({ ...prev, [qid]: idx }));
  }, []);

  const computeScore = useCallback(() => {
    if (!questions) return;
    let s = 0;
    for (const q of questions) {
      if (selected[q.id] === q.correctIndex) s += 1;
    }
    setScore(s);
    setChecked(true);
  }, [questions, selected]);

  const instant = values.instantCheck;

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
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              <span className="bg-gradient-to-r from-amber-600 via-orange-500 to-red-500 bg-clip-text text-transparent">Genera tu test</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">Sube imágenes de tus apuntes y crea preguntas tipo test con solución y explicación.</p>
          </div>

          <div className="grid lg:grid-cols-[1fr_1.1fr] gap-8 xl:gap-10">
            {/* Upload */}
            <div ref={uploadRef} className="space-y-6 scroll-mt-28">
              <div className="relative rounded-3xl border border-amber-200 bg-white shadow-xl overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" aria-hidden />
                <div className="px-6 sm:px-8 py-7">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-red-500 text-white font-bold shadow-md">1</div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900">Sube tu material base</h2>
                      <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-2xl">
                        Aceptamos imágenes y PDFs. Desglosamos el contenido para generar preguntas tipo test con opciones claras y explicaciones.
                      </p>
                    </div>
                  </div>

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className={`mt-6 rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 ${dragOver ? "border-amber-400 bg-amber-50" : "border-amber-200 hover:border-orange-300 bg-white"}`}
                  >
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-red-100 rounded-full flex items-center justify-center">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
                          <path d="M7 3h6l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="#ea580c" strokeWidth="1.8"/>
                          <path d="M13 3v5h5" stroke="#ea580c" strokeWidth="1.8"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-800">Arrastra y suelta los archivos aquí</p>
                        <p className="text-gray-500 text-sm sm:text-base mt-1">o haz clic para seleccionarlos (máx. 20). Cada página de un PDF se considerará automáticamente.</p>
                      </div>
                      <button
                        onClick={handleUploadClick}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-red-500 text-white px-6 py-2.5 rounded-full font-semibold hover:shadow-lg transition-all"
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
                    <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-amber-800">Archivos seleccionados ({files.length}/20)</h3>
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
                            <div key={i} className="group relative rounded-xl overflow-hidden border border-amber-200 bg-white hover:shadow-md transition-all">
                              {isPdf ? (
                                <div className="h-32 w-full bg-gradient-to-br from-amber-50 to-red-50 flex items-center justify-center text-amber-500">
                                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                                    <path d="M7 3h6l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2"/>
                                    <path d="M13 3v5h5" stroke="currentColor" strokeWidth="2"/>
                                    <text x="50%" y="60%" fontSize="6" fill="currentColor" textAnchor="middle">PDF</text>
                                  </svg>
                                </div>
                              ) : (
                                <img src={URL.createObjectURL(f)} alt={f.name} className="h-32 w-full object-cover" />
                              )}
                              <button
                                onClick={() => removeFile(i)}
                                className="absolute top-2 right-2 bg-white text-amber-600 w-8 h-8 rounded-full text-sm font-medium transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center shadow-lg"
                                aria-label={`Eliminar ${f.name}`}
                              >
                                ✕
                              </button>
                              <div className="absolute bottom-2 left-2 bg-amber-500/90 text-white px-2 py-1 rounded text-xs font-medium max-w-[calc(100%-1rem)] truncate">
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

              <div className="rounded-3xl border border-amber-200 bg-white shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white px-6 sm:px-8 py-6">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold uppercase tracking-wide">Paso 2</span>
                  <h2 className="mt-3 text-2xl font-bold">Define el enfoque del test</h2>
                  <p className="mt-1 text-sm sm:text-base text-white/80 max-w-2xl">Indica qué parte del temario quieres evaluar, el tipo de preguntas deseadas y cualquier matiz que debamos tener en cuenta para las explicaciones.</p>
                </div>

                <div className="px-6 sm:px-8 py-6 space-y-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <h3 className="text-sm font-semibold text-amber-700 mb-2">Incluye</h3>
                      <ul className="text-sm text-amber-700/80 space-y-1">
                        <li>• Tema y subtemas clave</li>
                        <li>• Tipo de examen (test rápido, evaluación final)</li>
                        <li>• Nivel de dificultad deseado</li>
                      </ul>
                    </div>
                    <div className="rounded-2xl border border-amber-200 bg-white p-4">
                      <h3 className="text-sm font-semibold text-amber-700 mb-2">Opcional</h3>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Número de opciones por pregunta</li>
                        <li>• Competencias o habilidades evaluadas</li>
                        <li>• Conceptos que deben aparecer sí o sí</li>
                      </ul>
                    </div>
                    <div className="rounded-2xl border border-amber-200 bg-white p-4">
                      <h3 className="text-sm font-semibold text-amber-700 mb-2">Feedback deseado</h3>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Nivel de detalle en las explicaciones</li>
                        <li>• Referencias a teoría o ejercicios</li>
                        <li>• Indicaciones para evitar errores comunes</li>
                      </ul>
                    </div>
                  </div>

                  <textarea
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    rows={4}
                    placeholder="Ej.: Historia (bachiller). Preguntas sobre la II Guerra Mundial: causas, desarrollo cronológico y consecuencias. Añadir explicaciones que relacionen con otros conflictos del siglo XX."
                    className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all resize-y"
                  />
                </div>
              </div>

              <div ref={settingsRef} className="rounded-3xl border border-amber-200 bg-white shadow-md overflow-hidden">
                <div className="px-6 sm:px-8 py-6 space-y-6">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-red-500 text-white font-bold">3</div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Configura tu test</h2>
                      <p className="text-sm sm:text-base text-gray-600 max-w-2xl">Elige cuántas preguntas quieres, la dificultad, el nivel académico y el enfoque. También decide si prefieres revisar al instante o corregir al final.</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <h3 className="text-sm font-semibold text-amber-700 mb-2">Cantidad de preguntas</h3>
                      <select value={values.count} onChange={(e) => setValues((v) => ({ ...v, count: Number(e.target.value) as QuizOptions["count"] }))} className="w-full rounded-xl border border-amber-300 bg-white px-4 py-3 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all text-sm">
                        <option value={5}>5 preguntas</option>
                        <option value={10}>10 preguntas</option>
                        <option value={20}>20 preguntas</option>
                      </select>
                    </div>
                    <div className="rounded-2xl border border-amber-200 bg-white p-4">
                      <h3 className="text-sm font-semibold text-amber-700 mb-2">Dificultad</h3>
                      <select value={values.difficulty} onChange={(e) => setValues((v) => ({ ...v, difficulty: e.target.value as QuizOptions["difficulty"] }))} className="w-full rounded-xl border border-amber-300 bg-white px-4 py-3 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all text-sm">
                        <option value="baja">Baja · Preguntas directas y conceptos básicos</option>
                        <option value="media">Media · Preguntas con razonamiento y casos comunes</option>
                        <option value="alta">Alta · Escenarios complejos y trampas habituales</option>
                      </select>
                    </div>
                    <div className="rounded-2xl border border-amber-200 bg-white p-4">
                      <h3 className="text-sm font-semibold text-amber-700 mb-2">Nivel académico</h3>
                      <select value={values.level} onChange={(e) => setValues((v) => ({ ...v, level: e.target.value as QuizOptions["level"] }))} className="w-full rounded-xl border border-amber-300 bg-white px-4 py-3 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all text-sm">
                        <option value="secundaria">Secundaria</option>
                        <option value="bachillerato">Bachillerato</option>
                        <option value="universidad">Universidad</option>
                        <option value="oposiciones">Oposiciones</option>
                      </select>
                    </div>
                    <div className="rounded-2xl border border-amber-200 bg-white p-4">
                      <h3 className="text-sm font-semibold text-amber-700 mb-2">Enfoque del test</h3>
                      <select value={values.focus} onChange={(e) => setValues((v) => ({ ...v, focus: e.target.value as QuizOptions["focus"] }))} className="w-full rounded-xl border border-amber-300 bg-white px-4 py-3 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all text-sm">
                        <option value="definiciones">Definiciones</option>
                        <option value="conceptos">Conceptos</option>
                        <option value="aplicaciones">Aplicaciones</option>
                        <option value="problemas">Problemas</option>
                      </select>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-amber-200 bg-white p-4">
                    <h3 className="text-sm font-semibold text-amber-700 mb-2">Modo de comprobación</h3>
                    <select value={values.instantCheck ? "instant" : "final"} onChange={(e) => setValues((v) => ({ ...v, instantCheck: e.target.value === "instant" }))} className="w-full rounded-xl border border-amber-300 bg-white px-4 py-3 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all text-sm">
                      <option value="instant">Mostrar corrección al seleccionar cada respuesta</option>
                      <option value="final">Revisar todo al final</option>
                    </select>
                  </div>

                  <button onClick={handleGenerate} disabled={!canSubmit} aria-disabled={!canSubmit} className={`w-full bg-gradient-to-r from-amber-600 to-red-600 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transition-all transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-3 tap-grow`}>
                    {loading ? (<><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Generando...</>) : (<>Generar test</>)}
                  </button>

                  {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-red-600 font-medium">Error: {error}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="lg:sticky lg:top-6 lg:h-fit">
              <div ref={resultRef} className="bg-white rounded-2xl p-8 shadow-lg border border-purple-200 scroll-mt-28 max-w-none card-smooth">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Cuestionario</h2>
                {!questions && (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <circle cx="12" cy="12" r="9" stroke="#7c3aed" strokeWidth="1.8"/>
                        <path d="M12 7v6M12 16h.01" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <p className="text-gray-500 text-lg">Aquí aparecerán tus preguntas tipo test generadas a partir de las imágenes.</p>
                  </div>
                )}

                {questions && (
                  <div className="space-y-6">
                    {questions.map((q, idx) => {
                      const sel = selected[q.id];
                      const isRight = sel !== null && sel === q.correctIndex;
                      const showFeedback = instant ? sel !== null : checked;
                      return (
                        <div key={q.id} className="rounded-3xl p-[2px] bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100">
                          <div className={`rounded-3xl p-6 transition-all ${showFeedback ? (isRight ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50/40 border border-red-200') : 'bg-white border border-purple-200'}`}>
                            <div className="flex items-start justify-between gap-4">
                              <h3 className="text-lg font-bold text-gray-900">{idx + 1}. {q.question}</h3>
                              {!instant && (
                                <span className="text-xs px-2 py-1 rounded-full bg-white text-gray-600 ring-1 ring-gray-200">Selecciona y corrige al final</span>
                              )}
                            </div>
                          <div className="mt-4 grid sm:grid-cols-2 gap-3">
                            {q.options.map((opt, i) => {
                              const picked = sel === i;
                              const correct = q.correctIndex === i;
                              const wrongPick = showFeedback && picked && !correct;
                              const rightPick = showFeedback && picked && correct;
                              return (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => {
                                    pickOption(q.id, i);
                                    if (instant) {
                                      // mantener feedback inmediato
                                      setChecked(false);
                                      setScore(null);
                                    }
                                  }}
                                  className={`text-left rounded-xl px-4 py-3 border transition-all hover:shadow-sm focus:outline-none focus:ring-2 ${picked ? 'border-pink-400 ring-pink-200' : 'border-purple-200 focus:ring-purple-200'} ${rightPick ? 'bg-emerald-100/70' : ''} ${wrongPick ? 'bg-red-100/70' : ''}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${picked ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{String.fromCharCode(65 + i)}</span>
                                    <span className="text-gray-800 text-sm sm:text-base">{opt}</span>
                                  </div>
                                </button>
                              );
                            })}
                            </div>
                            {showFeedback && (
                              <div className="mt-4 rounded-2xl p-4 bg-white border border-purple-200">
                                {sel !== null && sel !== q.correctIndex ? (
                                  <div className="space-y-3">
                                    <div className="flex flex-wrap gap-2">
                                      <span className="inline-flex items-center gap-2 text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-800 ring-1 ring-red-200">
                                        ✗ Tu respuesta
                                      </span>
                                      <span className="inline-flex items-center gap-2 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200">
                                        ✓ Correcta
                                      </span>
                                    </div>
                                    <div className="grid sm:grid-cols-2 gap-3">
                                      <div className="rounded-xl p-3 bg-red-50 ring-1 ring-red-100">
                                        <p className="text-sm text-red-800"><strong>Elegiste:</strong> {q.options[sel]}</p>
                                      </div>
                                      <div className="rounded-xl p-3 bg-emerald-50 ring-1 ring-emerald-100">
                                        <p className="text-sm text-emerald-800"><strong>Respuesta correcta:</strong> {q.options[q.correctIndex]}</p>
                                      </div>
                                    </div>
                                    <div className="rounded-xl p-4 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 ring-1 ring-purple-100">
                                      <p className="text-sm text-gray-800"><strong>Explicación:</strong> {q.explanations?.[sel] || "Revisa el concepto clave: identifica la definición, propiedad o caso que invalida la opción elegida."}</p>
                                      {q.explanations?.[q.correctIndex] && (
                                        <p className="text-sm text-gray-800 mt-2"><strong>Por qué es correcta:</strong> {q.explanations[q.correctIndex]}</p>
                                      )}
                                    </div>
                                  </div>
                                ) : sel !== null ? (
                                  <div className="space-y-2">
                                    <span className="inline-flex items-center gap-2 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200">✓ Correcto</span>
                                    <div className="rounded-xl p-4 bg-emerald-50 ring-1 ring-emerald-100">
                                      <p className="text-sm text-emerald-800">{q.explanations?.[sel] || "¡Bien hecho! Has identificado la opción válida."}</p>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-600">Selecciona una opción para ver la retroalimentación.</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {!instant && (
                      <div className="flex flex-col sm:flex-row gap-3 items-center">
                        <button
                          type="button"
                          onClick={computeScore}
                          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:shadow-xl transition-all tap-grow"
                        >
                          Comprobar resultados
                        </button>
                        <button
                          type="button"
                          onClick={() => { setChecked(false); setScore(null); setSelected((prev) => Object.fromEntries(Object.keys(prev).map(k => [k, null]))); }}
                          className="flex-1 bg-white text-indigo-700 ring-1 ring-indigo-200 py-3 rounded-xl font-semibold hover:shadow-md"
                        >
                          Reiniciar selección
                        </button>
                        {checked && score !== null && questions && (
                          <div className="text-sm font-semibold text-gray-800">Puntuación: {score} / {questions.length}</div>
                        )}
                      </div>
                    )}
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
            <p className="text-gray-700 mb-2">Para generar test con explicación necesitas una suscripción activa.</p>
            <p className="text-gray-700 mb-4">Con la suscripción desbloqueas las 4 herramientas: Apuntes, Flashcards, Tipo Test y Preguntas largas. Pasa de fotos a resultados: apuntes claros, flashcards para memorizar, tests con feedback y preguntas con corrección automática, con opciones de nivel, complejidad y estilo.</p>
            <div className="space-y-2">
              <Link href="/#precios" className="w-full inline-flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg tap-grow">Ver planes</Link>
              <button onClick={() => handleSubscribe("monthly")} disabled={loadingPlan === "monthly"} className="w-full bg-white text-purple-600 ring-1 ring-purple-200 py-3 rounded-xl font-semibold hover:shadow-md disabled:opacity-60 tap-grow">{loadingPlan === "monthly" ? "Redirigiendo..." : "Suscribirme mensual (4,99€ / mes)"}</button>
              <button onClick={() => handleSubscribe("yearly")} disabled={loadingPlan === "yearly"} className="w-full bg-white text-purple-600 ring-1 ring-purple-200 py-3 rounded-xl font-semibold hover:shadow-md disabled:opacity-60 tap-grow">{loadingPlan === "yearly" ? "Redirigiendo..." : "Suscribirme anual (39,99€ / año)"}</button>
            </div>
            <div className="mt-4 text-center text-sm"><Link href="/#precios" className="text-gray-600 hover:underline">Más información</Link></div>
          </div>
        </div>
      )}
    </div>
  );
}



