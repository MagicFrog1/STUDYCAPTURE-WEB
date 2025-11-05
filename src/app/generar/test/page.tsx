"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppInfoDropdown from "@/components/AppInfoDropdown";

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

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getSession();
      const logged = Boolean(data.session);
      setIsLoggedIn(logged);
      if (!logged) {
        router.replace("/login");
        return;
      }
      // Comprobar suscripción activa (igual que en panel)
      if (data.session?.user) {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('id,status,current_period_end')
          .eq('user_id', data.session.user.id)
          .eq('status', 'active')
          .gt('current_period_end', new Date().toISOString())
          .maybeSingle();
        if (sub) setIsPremium(true);
      }
    };
    run();
  }, [router]);

  const onFiles = useCallback((list: FileList | null) => {
    if (!list) return;
    const accepted = Array.from(list).filter((f) => f.type.startsWith("image/"));
    setFiles((prev) => [...prev, ...accepted].slice(0, 10));
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

  const canSubmit = useMemo(() => files.length > 0 && !loading, [files.length, loading]);

  const handleGenerate = useCallback(async () => {
    setError(null);
    setLoading(true);
    setQuestions(null);
    setSelected({});
    setChecked(false);
    setScore(null);
    try {
      // Bloqueo amable si no hay suscripción
      if (!isPremium) {
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
  }, [files, values, context, isPremium]);

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
            <img src="/logo.svg" alt="StudyCaptures" className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
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
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">Genera tu test</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">Sube imágenes de tus apuntes y crea preguntas tipo test con solución y explicación.</p>
          </div>

          <div className="grid lg:grid-cols-[1fr_1.1fr] gap-8 xl:gap-10">
            {/* Upload */}
            <div ref={uploadRef} className="space-y-6 scroll-mt-28">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-200 transition-transform duration-300 hover:-translate-y-0.5 card-smooth">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M3 8a2 2 0 0 1 2-2h2l1.2-1.8A2 2 0 0 1 10.8 3h2.4a2 2 0 0 1 1.6.8L16 6h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z" stroke="#7c3aed" strokeWidth="1.8" strokeLinejoin="round"/>
                    <circle cx="12" cy="13" r="3.5" stroke="#7c3aed" strokeWidth="1.8"/>
                  </svg>
                  Sube tus imágenes
                </h2>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={"rounded-xl border-2 border-dashed text-center p-8 transition-all duration-300 " + (dragOver ? "border-purple-400 bg-purple-50 scale-105" : "border-purple-200 hover:border-purple-300 hover:bg-purple-50/50")}
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M7 3h6l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="#fff" strokeWidth="1.8"/>
                        <path d="M13 3v5h5" stroke="#fff" strokeWidth="1.8"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-700 mb-2">Arrastra y suelta tus imágenes aquí</p>
                      <p className="text-gray-500 mb-4">o haz clic para explorar archivos</p>
                      <button onClick={handleUploadClick} className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-2 rounded-full font-medium hover:shadow-lg transition-all transform hover:scale-105 tap-grow">Seleccionar archivos</button>
                    </div>
                    <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
                  </div>
                </div>

                {files.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Imágenes seleccionadas ({files.length})</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {files.map((f, i) => (
                        <div key={i} className="group relative rounded-xl overflow-hidden border border-purple-200 hover:shadow-lg transition-all card-smooth">
                          <img src={URL.createObjectURL(f)} alt={f.name} className="h-32 w-full object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                            <button onClick={() => removeFile(i)} className="opacity-0 group-hover:opacity-100 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium transition-all transform hover:scale-105">Eliminar</button>
                          </div>
                          <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded text-xs font-medium text-gray-700">{f.name.length > 15 ? f.name.substring(0, 15) + "..." : f.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-200 transition-transform duration-300 hover:-translate-y-0.5 card-smooth">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M4 7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H9l-4 3v-3a3 3 0 0 1-1-2V7Z" stroke="#7c3aed" strokeWidth="1.8"/>
                  </svg>
                  Contexto Educativo (opcional pero recomendado)
                </h2>
                <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6 mb-4 border border-purple-200 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
                  <div className="pointer-events-none absolute -top-16 -left-16 w-40 h-40 rounded-full bg-purple-200/30 blur-2xl" />
                  <div className="pointer-events-none absolute -bottom-16 -right-12 w-44 h-44 rounded-full bg-pink-200/30 blur-2xl" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base sm:text-lg font-extrabold bg-gradient-to-r from-purple-700 via-pink-700 to-indigo-700 bg-clip-text text-transparent flex items-center gap-2">✨ Consejos para mejores resultados</h3>
                      <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/70 text-purple-700 ring-1 ring-purple-200">Recomendado</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-4">Cuanto más contexto, mejores preguntas con explicaciones:</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="flex items-start gap-3 rounded-xl bg-white/70 backdrop-blur p-3 ring-1 ring-purple-200"><div className="shrink-0 w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">📚</div><p className="text-sm text-gray-800"><strong>Tipo de examen</strong> y nivel esperado</p></div>
                      <div className="flex items-start gap-3 rounded-xl bg-white/70 backdrop-blur p-3 ring-1 ring-pink-200"><div className="shrink-0 w-8 h-8 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center">🧩</div><p className="text-sm text-gray-800"><strong>Enfoque</strong>: definiciones, aplicaciones o problemas</p></div>
                      <div className="flex items-start gap-3 rounded-xl bg-white/70 backdrop-blur p-3 ring-1 ring-indigo-200"><div className="shrink-0 w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">🔗</div><p className="text-sm text-gray-800"><strong>Temario</strong> y conexiones clave</p></div>
                      <div className="flex items-start gap-3 rounded-xl bg-white/70 backdrop-blur p-3 ring-1 ring-amber-200"><div className="shrink-0 w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">📝</div><p className="text-sm text-gray-800"><strong>Errores comunes</strong> a evitar</p></div>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">Añade asignatura, nivel, y qué quieres evaluar (definiciones, aplicaciones, demostraciones…).</p>
                <textarea value={context} onChange={(e) => setContext(e.target.value)} rows={4} placeholder="Ej.: Física I (bachiller). Practicar leyes de Newton con aplicaciones y errores comunes." className="w-full rounded-lg border border-purple-200 bg-white px-4 py-3 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all resize-y" />
              </div>

              <div ref={settingsRef} className="bg-white rounded-2xl p-6 shadow-lg border border-purple-200 scroll-mt-28 transition-transform duration-300 hover:-translate-y-0.5 card-smooth">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="#7c3aed" strokeWidth="1.8"/>
                    <path d="m19.4 15.5-.9 1.6-1.8-.2-.9 1.6 1.3 1.3-1.6.9.2 1.8-1.6.9-1.3-1.3-1.6.9-1.6-.9.2-1.8-1.6-.9L5.3 19l-1.6-.9.2-1.8-1.6-.9.9-1.6 1.8.2.9-1.6-1.3-1.3 1.6-.9-.2-1.8 1.6-.9 1.3 1.3 1.6-.9 1.6.9-.2 1.8 1.6.9 1.3-1.3 1.6.9-.2 1.8 1.6.9Z" stroke="#7c3aed" strokeWidth="1.2"/>
                  </svg>
                  Configura tu test
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Cantidad</label>
                    <select value={values.count} onChange={(e) => setValues((v) => ({ ...v, count: Number(e.target.value) as QuizOptions["count"] }))} className="w-full rounded-lg border border-purple-200 bg-white px-4 py-3 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all">
                      <option value={5}>5 preguntas</option>
                      <option value={10}>10 preguntas</option>
                      <option value={20}>20 preguntas</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Dificultad</label>
                    <select value={values.difficulty} onChange={(e) => setValues((v) => ({ ...v, difficulty: e.target.value as QuizOptions["difficulty"] }))} className="w-full rounded-lg border border-purple-200 bg-white px-4 py-3 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all">
                      <option value="baja">Baja</option>
                      <option value="media">Media</option>
                      <option value="alta">Alta</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Nivel académico</label>
                    <select value={values.level} onChange={(e) => setValues((v) => ({ ...v, level: e.target.value as QuizOptions["level"] }))} className="w-full rounded-lg border border-purple-200 bg-white px-4 py-3 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all">
                      <option value="secundaria">Secundaria</option>
                      <option value="bachillerato">Bachillerato</option>
                      <option value="universidad">Universidad</option>
                      <option value="oposiciones">Oposiciones</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Enfoque</label>
                    <select value={values.focus} onChange={(e) => setValues((v) => ({ ...v, focus: e.target.value as QuizOptions["focus"] }))} className="w-full rounded-lg border border-purple-200 bg-white px-4 py-3 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all">
                      <option value="definiciones">Definiciones</option>
                      <option value="conceptos">Conceptos</option>
                      <option value="aplicaciones">Aplicaciones</option>
                      <option value="problemas">Problemas</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Modo de comprobación</label>
                  <select value={values.instantCheck ? "instant" : "final"} onChange={(e) => setValues((v) => ({ ...v, instantCheck: e.target.value === "instant" }))} className="w-full rounded-lg border border-purple-200 bg-white px-4 py-3 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all">
                    <option value="instant">Al seleccionar</option>
                    <option value="final">Al final</option>
                  </select>
                </div>

                <button onClick={handleGenerate} disabled={!canSubmit} aria-disabled={!canSubmit} className={`mt-6 w-full bg-gradient-to-r from-amber-600 to-red-600 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transition-all transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-3 tap-grow`}>
                  {loading ? (<><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Generando...</>) : (<>Generar Test</>)}
                </button>

                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-600 font-medium">Error: {error}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Results */}
            <div className="lg:sticky lg:top-6 lg:h-fit">
              <div ref={resultRef} className="bg-white rounded-2xl p-8 shadow-lg border border-purple-200 scroll-mt-28 max-w-none card-smooth">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Cuestionario</h2>
                {!questions && (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <circle cx="12" cy="12" r="9" stroke="#2563eb" strokeWidth="1.8"/>
                        <path d="M12 7v6M12 16h.01" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round"/>
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
                                  className={`text-left rounded-xl px-4 py-3 border transition-all hover:shadow-sm focus:outline-none focus:ring-2 ${picked ? 'border-indigo-400 ring-indigo-200' : 'border-purple-200 focus:ring-purple-200'} ${rightPick ? 'bg-emerald-100/70' : ''} ${wrongPick ? 'bg-red-100/70' : ''}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${picked ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{String.fromCharCode(65 + i)}</span>
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
                          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:shadow-xl transition-all tap-grow"
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
            <p className="text-gray-700 mb-4">Con la suscripción desbloqueas las 4 herramientas: Apuntes, Flashcards, Tipo Test y Mapas mentales. Pasa de fotos a resultados: apuntes claros, flashcards para memorizar, tests con feedback y mapas en PDF, con opciones de nivel, complejidad y estilo.</p>
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



