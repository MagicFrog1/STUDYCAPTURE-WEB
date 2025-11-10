"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import AppInfoDropdown from "@/components/AppInfoDropdown";
import { useRouter } from "next/navigation";
import { pdfFileToImages } from "@/lib/pdfToImages";

type LongQAOptions = {
  count: 3 | 5 | 10;
  difficulty: "baja" | "media" | "alta";
  level: "secundaria" | "bachillerato" | "universidad" | "oposiciones";
  questionType: "definiciones" | "normales" | "mixto";
};

type QAQuestion = { id: string; question: string; referenceAnswer: string };
type EvalResult = { id: string; score: number; feedback: string; referenceAnswer: string; userAnswer: string };

export default function MindmapsPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [context, setContext] = useState("");
  const [values, setValues] = useState<LongQAOptions>({ count: 5, difficulty: "media", level: "universidad", questionType: "normales" });
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QAQuestion[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<EvalResult[] | null>(null);
  const [overall, setOverall] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const uploadRef = useRef<HTMLDivElement | null>(null);
  const settingsRef = useRef<HTMLDivElement | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<"" | "monthly" | "yearly">("");
  const [trialActive, setTrialActive] = useState(false);

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

  const handleUploadClick = useCallback(() => inputRef.current?.click(), []);
  const removeFile = useCallback((index: number) => setFiles((prev) => prev.filter((_, i) => i !== index)), []);
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
    setResults(null);
    setOverall(null);
    try {
      if (!isPremium && !trialActive) {
        setShowPaywall(true);
        throw new Error("Suscripción requerida");
      }
      const form = new FormData();
      files.forEach((f) => form.append("files", f));
      form.append("options", JSON.stringify({ mode: "generate", ...values }));
      if (context.trim()) {
        form.append("context", context.trim());
      }
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      const res = await fetch("/api/process-mindmap", { method: "POST", body: form, headers });
      if (!res.ok) {
        if (res.status === 402) {
          setShowPaywall(true);
          throw new Error("Suscripción requerida");
        }
        const txt = await res.text();
        throw new Error(txt || "Error generando preguntas");
      }
      const json = (await res.json()) as { questions: QAQuestion[] };
      setQuestions(json.questions || []);
      setAnswers(Object.fromEntries((json.questions || []).map((q) => [q.id, ""])));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [files, values, context, isPremium, trialActive]);

  const handleEvaluate = useCallback(async () => {
    if (!questions) return;
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      files.forEach((f) => form.append("files", f));
      form.append("options", JSON.stringify({ mode: "evaluate" }));
      form.append("answers", JSON.stringify(answers));
      form.append("questions", JSON.stringify(questions));
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      const res = await fetch("/api/process-mindmap", { method: "POST", body: form, headers });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Error corrigiendo respuestas");
      }
      const json = (await res.json()) as { results: EvalResult[]; overall?: number };
      setResults(json.results || []);
      setOverall(typeof json.overall === "number" ? json.overall : null);
      // Scroll to results
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [answers, files, questions]);

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

  // (sin renderNode: este panel ya no crea mapas mentales)

  // Ya no se usa exportación a PDF ni conexiones; este panel es para preguntas largas.

  // (Pantalla completa desactivada por petición. Vista normal + descarga PDF.)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header consistente con /generar/panel */}
      <header className="px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between bg-white/80 supports-[backdrop-filter]:bg-white/70 backdrop-blur border-b border-emerald-200/70 sticky top-2 z-30 pt-[env(safe-area-inset-top)] transition-all mx-2 rounded-xl">
        <Link href="/" className="flex items-center gap-2 sm:gap-3">
          <div className="size-7 sm:size-8 md:size-10 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
            <img src="/LOGO%20WEB.png" alt="StudyCaptures" className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 object-contain" />
          </div>
          <span className="hidden sm:inline font-bold text-base sm:text-lg md:text-xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">StudyCaptures</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
          <AppInfoDropdown />
          <Link href={isLoggedIn ? "/profile" : "/login"} className="flex items-center gap-2 px-1.5 py-1 sm:px-3 sm:py-1.5 rounded-md border border-transparent sm:border-emerald-200 text-gray-700 hover:text-emerald-700 hover:border-emerald-300 transition-all tap-grow">
            <span className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full flex items-center justify-center text-xs">👤</span>
            <span className="hidden sm:inline">Mi cuenta</span>
          </Link>
        </nav>
      </header>

      <main className="px-3 sm:px-6 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 bg-clip-text text-transparent">Preguntas largas</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">Genera preguntas extensas basadas en tus imágenes o PDFs, respóndelas y obtén una corrección con porcentaje de acierto y respuesta modelo.</p>
          </div>

          <div className="grid lg:grid-cols-[1fr_1.1fr] gap-8 xl:gap-10">
            {/* Upload */}
            <div ref={uploadRef} className="space-y-6 scroll-mt-28">
              <div className="rounded-3xl border border-emerald-200 bg-white shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white px-6 sm:px-8 py-6 flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold uppercase tracking-wide">Paso 1</span>
                    <h2 className="mt-3 text-2xl font-bold">Sube tus apuntes</h2>
                    <p className="mt-1 text-sm sm:text-base text-white/80 max-w-2xl">Añade imágenes o PDFs. Extraeremos la información relevante para generar preguntas largas contextualizadas.</p>
                  </div>
                  <div className="hidden sm:flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15">
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="text-white">
                      <path d="M3 8a2 2 0 0 1 2-2h2l1.2-1.8A2 2 0 0 1 10.8 3h2.4a2 2 0 0 1 1.6.8L16 6h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                      <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.8"/>
                  </svg>
                  </div>
                </div>

                <div className="px-6 sm:px-8 py-6">
                  <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                      }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                      className={`rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 ${dragOver ? "border-emerald-400 bg-emerald-50" : "border-emerald-200 hover:border-teal-200 bg-white"}`}
                >
                  <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-200 to-teal-200 flex items-center justify-center">
                          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                            <path d="M7 3h6l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="#047857" strokeWidth="1.8"/>
                            <path d="M13 3v5h5" stroke="#047857" strokeWidth="1.8"/>
                      </svg>
                    </div>
                    <div>
                          <p className="text-lg font-semibold text-gray-800">Arrastra tus archivos aquí</p>
                          <p className="text-gray-500 text-sm sm:text-base mt-1">o haz clic para explorar (máx. 20). Convertimos cada página de PDF automáticamente.</p>
                        </div>
                        <button onClick={handleUploadClick} className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-2.5 rounded-full font-semibold hover:shadow-lg transition-all">
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
                    <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-5">
                      <h3 className="text-sm font-semibold text-emerald-700 mb-3">Sugerencias</h3>
                      <ul className="text-sm text-emerald-700/80 space-y-2">
                        <li>• Agrupa los archivos por tema para obtener preguntas coherentes.</li>
                        <li>• Evita ruido visual (borrazo, fotos borrosas) para mejorar la extracción del contenido.</li>
                        <li>• Combina imágenes y PDFs cuando necesites contexto adicional.</li>
                      </ul>
                  </div>
                </div>

                {files.length > 0 && (
                    <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-emerald-800">Archivos seleccionados ({files.length}/20)</h3>
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
                            <div key={i} className="group relative rounded-xl overflow-hidden border border-emerald-200 bg-white hover:shadow-md transition-all">
                            {isPdf ? (
                                <div className="h-28 sm:h-32 w-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-emerald-500">
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
                                className="absolute top-2 right-2 bg-white text-emerald-600 w-8 h-8 rounded-full text-sm font-medium transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center shadow-lg"
                              aria-label={`Eliminar ${f.name}`}
                            >
                              ✕
                            </button>
                              <div className="absolute bottom-2 left-2 bg-emerald-600/90 text-white px-2 py-1 rounded text-xs font-medium max-w-[calc(100%-1rem)] truncate">
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

              {/* Contexto opcional */}
              <div className="rounded-3xl border border-emerald-200 bg-white shadow-md overflow-hidden">
                <div className="px-6 sm:px-8 py-6 flex items-start gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold">2</div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Describe lo que necesitas</h2>
                    <p className="text-sm sm:text-base text-gray-600 max-w-2xl">Detalla qué quieres que cubran las preguntas: puntos clave, errores típicos, nivel de profundidad… Así afinamos la respuesta modelo y la corrección.</p>
                  </div>
                </div>

                <div className="px-6 sm:px-8 pb-6 space-y-6">
                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
                      <h3 className="text-sm font-semibold text-emerald-700 mb-2">Ayuda incluir</h3>
                      <ul className="text-sm text-emerald-700/80 space-y-1">
                        <li>• Tema, subtemas y objetivos de aprendizaje.</li>
                        <li>• Formato deseado (explicativo, comparativo, aplicado).</li>
                        <li>• Puntos críticos que debe cubrir la respuesta modelo.</li>
                      </ul>
                    </div>
                    <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                      <h3 className="text-sm font-semibold text-emerald-700 mb-2">Opcional</h3>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Estilo o tono (académico, divulgativo…).</li>
                        <li>• Ejemplos que deberían incorporarse.</li>
                        <li>• Criterios de evaluación o rúbricas a considerar.</li>
                      </ul>
                    </div>
              </div>

                  <textarea
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    rows={5}
                    placeholder="Ej.: Psicología (universidad). Preguntas sobre teoría del apego: 1) tipos y características, 2) evidencias experimentales, 3) aplicación en terapia familiar. Incluir referencias a autores clave."
                    className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all resize-y"
                  />
                </div>
              </div>

              <div ref={settingsRef} className="rounded-3xl border border-emerald-200 bg-white shadow-md overflow-hidden">
                <div className="px-6 sm:px-8 py-6 space-y-6">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold">3</div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Ajusta las preguntas</h2>
                      <p className="text-sm sm:text-base text-gray-600 max-w-2xl">Define cuántas preguntas generar, la dificultad y el nivel. También puedes indicar el tipo de pregunta para equilibrar definiciones y análisis más extensos.</p>
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-4 gap-5">
                    <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
                      <h3 className="text-sm font-semibold text-emerald-700 mb-2">Cantidad</h3>
                      <select
                        value={values.count}
                        onChange={(e) => setValues((v) => ({ ...v, count: Number(e.target.value) as LongQAOptions["count"] }))}
                        className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all text-sm"
                      >
                        <option value={3}>3 preguntas</option>
                        <option value={5}>5 preguntas</option>
                        <option value={10}>10 preguntas</option>
                      </select>
                    </div>
                    <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                      <h3 className="text-sm font-semibold text-emerald-700 mb-2">Dificultad</h3>
                      <select
                        value={values.difficulty}
                        onChange={(e) => setValues((v) => ({ ...v, difficulty: e.target.value as LongQAOptions["difficulty"] }))}
                        className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all text-sm"
                      >
                        <option value="baja">Baja · Preguntas guiadas y directas</option>
                        <option value="media">Media · Desarrollo con análisis y ejemplos</option>
                        <option value="alta">Alta · Argumentación profunda y conexiones complejas</option>
                      </select>
                    </div>
                    <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                      <h3 className="text-sm font-semibold text-emerald-700 mb-2">Nivel académico</h3>
                      <select
                        value={values.level}
                        onChange={(e) => setValues((v) => ({ ...v, level: e.target.value as LongQAOptions["level"] }))}
                        className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all text-sm"
                      >
                        <option value="secundaria">Secundaria</option>
                        <option value="bachillerato">Bachillerato</option>
                        <option value="universidad">Universidad</option>
                        <option value="oposiciones">Oposiciones</option>
                      </select>
                    </div>
                    <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                      <h3 className="text-sm font-semibold text-emerald-700 mb-2">Tipo de pregunta</h3>
                      <select
                        value={values.questionType}
                        onChange={(e) => setValues((v) => ({ ...v, questionType: e.target.value as LongQAOptions["questionType"] }))}
                        className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all text-sm"
                      >
                        <option value="normales">Normales · Desarrollo completo</option>
                        <option value="definiciones">Definiciones · Precisas y directas</option>
                        <option value="mixto">Mixto · Combina definición + análisis</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={!canSubmit}
                    aria-disabled={!canSubmit}
                    className={`w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transition-all transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-3 tap-grow`}
                  >
                    {loading ? (<><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Generando preguntas...</>) : (<>Generar preguntas largas</>)}
                </button>

                {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-red-600 font-medium">Error: {error}</p>
                    </div>
                )}
                </div>
              </div>
            </div>

            {/* Resultado */}
            <div className="lg:sticky lg:top-6 lg:h-fit">
              <div ref={resultRef} className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-emerald-200 scroll-mt-28 max-w-none card-smooth">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Preguntas largas</h2>
                {!questions && (
                  <p className="text-gray-600">Genera preguntas y contéstalas aquí. Después podrás corregirlas y ver tu porcentaje de acierto.</p>
                )}
                {questions && (
                  <div className="space-y-5">
                    {questions.map((q, idx) => (
                      <div key={q.id} className="rounded-2xl border border-emerald-200 p-5 bg-white">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-lg font-bold text-gray-900">{idx + 1}. {q.question}</h3>
                          {results && (
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${results.find(r => r.id === q.id)?.score! >= 70 ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200' : 'bg-amber-100 text-amber-800 ring-1 ring-amber-200'}`}>
                              {Math.round(results.find(r => r.id === q.id)?.score ?? 0)}%
                            </span>
                          )}
                        </div>
                        <textarea
                          value={answers[q.id] ?? ""}
                          onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                          rows={6}
                          placeholder="Escribe tu respuesta aquí..."
                          className="mt-3 w-full rounded-lg border border-emerald-200 bg-white px-4 py-3 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all resize-y"
                        />
                        {results && (
                          <div className="mt-4 grid sm:grid-cols-2 gap-4">
                            <div className="rounded-xl p-4 bg-white ring-1 ring-emerald-200">
                              <h4 className="text-sm font-semibold text-gray-800 mb-2">Tu respuesta</h4>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{results.find(r => r.id === q.id)?.userAnswer || answers[q.id]}</p>
                            </div>
                            <div className="rounded-xl p-4 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 ring-1 ring-emerald-200">
                              <h4 className="text-sm font-semibold text-gray-800 mb-2">Respuesta modelo</h4>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{results.find(r => r.id === q.id)?.referenceAnswer || q.referenceAnswer}</p>
                            </div>
                            <div className="sm:col-span-2 rounded-xl p-3 bg-white ring-1 ring-emerald-200">
                              <h4 className="text-sm font-semibold text-gray-800 mb-1">Feedback</h4>
                              <p className="text-sm text-gray-700">{results.find(r => r.id === q.id)?.feedback || "—"}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="pt-2 flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={handleEvaluate}
                        disabled={loading}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold hover:shadow-md disabled:opacity-60"
                      >
                        {loading ? "Corrigiendo..." : "Corregir preguntas"}
                      </button>
                      {overall !== null && (
                        <div className="inline-flex items-center px-3 py-2 rounded-xl bg-white ring-1 ring-emerald-200 text-gray-800 font-semibold">
                          Media: {Math.round(overall)}%
                        </div>
                      )}
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
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-emerald-200 card-smooth reveal is-visible">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Suscripción necesaria</h3>
              <button onClick={() => setShowPaywall(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <p className="text-gray-700 mb-2">Para generar y corregir preguntas necesitas una suscripción activa.</p>
            <p className="text-gray-700 mb-4">Con la suscripción desbloqueas las 4 herramientas: Apuntes, Flashcards, Tipo Test y Preguntas largas.</p>
            <div className="space-y-2">
              <Link href="/#precios" className="w-full inline-flex items-center justify-center bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg tap-grow">Ver planes</Link>
              <button onClick={() => handleSubscribe("monthly")} disabled={loadingPlan === "monthly"} className="w-full bg-white text-emerald-600 ring-1 ring-emerald-200 py-3 rounded-xl font-semibold hover:shadow-md disabled:opacity-60 tap-grow">{loadingPlan === "monthly" ? "Redirigiendo..." : "Suscribirme mensual (4,99€ / mes)"}</button>
              <button onClick={() => handleSubscribe("yearly")} disabled={loadingPlan === "yearly"} className="w-full bg-white text-emerald-600 ring-1 ring-emerald-200 py-3 rounded-xl font-semibold hover:shadow-md disabled:opacity-60 tap-grow">{loadingPlan === "yearly" ? "Redirigiendo..." : "Suscribirme anual (39,99€ / año)"}</button>
            </div>
            <div className="mt-4 text-center text-sm"><Link href="/#precios" className="text-gray-600 hover:underline">Más información</Link></div>
          </div>
        </div>
      )}
    </div>
  );
}


