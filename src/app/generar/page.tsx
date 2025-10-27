"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppInfoDropdown from "@/components/AppInfoDropdown";

type FormValues = {
  size: "mini" | "media" | "larga";
  complexity: "baja" | "media" | "alta";
  colorStyle: "neutro" | "pastel" | "vivo";
  creativity: "preciso" | "equilibrado" | "creativo";
};

type ResultChunk = { id: string; title: string; content: string };

export default function GenerarPage() {
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
  });
  const [loading, setLoading] = useState(false);
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

  // Smooth scroll behavior for internal nav
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.style.scrollBehavior = "smooth";
      return () => {
        document.documentElement.style.scrollBehavior = "auto";
      };
    }
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
      // Check premium status by subscriptions table (active and not expired)
      if (data.session?.user) {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('id,status,current_period_end')
          .eq('user_id', data.session.user.id)
          .eq('status', 'active')
          .gt('current_period_end', new Date().toISOString())
          .maybeSingle();
        if (sub) {
          setRemaining(-1); // Premium active
        }
      }
    })();
  }, []);

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

  const isPremium = remaining === -1;
  const canSubmit = useMemo(() => {
    // TEMPORALMENTE PERMITE GENERAR PARA PROBAR LA IA
    return files.length > 0 && !loading;
  }, [files.length, loading]);

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
    // TEMPORALMENTE DESHABILITADO PARA PROBAR LA IA
    // if (!isPremium && process.env.NODE_ENV === "production") {
    //   setShowPaywall(true);
    //   return;
    // }
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

      const res = await fetch("/api/process", { method: "POST", body: form, headers });
      if (!res.ok) {
        if (res.status === 402) {
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
      if (message.includes("Necesitas") || message.includes("suscripción") || message.includes("suscrip")) {
        setShowPaywall(true);
      }
    } finally {
      setLoading(false);
    }
  }, [files, values, context, isLoggedIn, router, isPremium]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between bg-white/80 backdrop-blur-sm border-b border-purple-200 sticky top-0 z-20">
        <Link href="/" className="flex items-center gap-3">
          <div className="size-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <img src="/logo.svg" alt="StudyCaptures" className="w-6 h-6" />
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            StudyCaptures
          </span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4 text-sm">
          <AppInfoDropdown />
          <Link href="/" className="px-3 py-1.5 rounded-full border border-purple-200 hover:border-purple-300 text-gray-700 hover:text-purple-700 transition-all">
            Inicio
          </Link>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.replace("/login");
            }}
            className="px-3 py-1.5 rounded-full border border-purple-200 hover:border-purple-300 text-gray-700 hover:text-purple-700 transition-all"
          >
            Cerrar sesión
          </button>
        </nav>
      </header>

      <main className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                Genera tus apuntes
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Sube imágenes de tus apuntes y obtén apuntes completos y educativos. La IA usa su conocimiento interno para enriquecer el contenido con explicaciones detalladas, ejemplos adicionales y conexiones entre conceptos. Para mejores resultados, sube fotos de un único tema y proporciona contexto educativo.
            </p>
          </div>

          <div className="grid lg:grid-cols-[1fr_1.1fr] gap-8 xl:gap-10">
            {/* Upload Section */}
            <div ref={uploadRef} className="space-y-6 scroll-mt-28">
              {/* File Upload */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-200 transition-transform duration-300 hover:-translate-y-0.5">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M3 8a2 2 0 0 1 2-2h2l1.2-1.8A2 2 0 0 1 10.8 3h2.4a2 2 0 0 1 1.6.8L16 6h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z" stroke="#7c3aed" strokeWidth="1.8" strokeLinejoin="round"/>
                    <circle cx="12" cy="13" r="3.5" stroke="#7c3aed" strokeWidth="1.8"/>
                  </svg>
                  Sube tus imágenes
                </h2>
                
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={
                    "rounded-xl border-2 border-dashed text-center p-8 transition-all duration-300 " +
                    (dragOver 
                      ? "border-purple-400 bg-purple-50 scale-105" 
                      : "border-purple-200 hover:border-purple-300 hover:bg-purple-50/50")
                  }
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M7 3h6l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="#fff" strokeWidth="1.8"/>
                        <path d="M13 3v5h5" stroke="#fff" strokeWidth="1.8"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-700 mb-2">
                        Arrastra y suelta tus imágenes aquí
                      </p>
                      <p className="text-gray-500 mb-4">
                        o haz clic para explorar archivos
                      </p>
                      <button 
                        onClick={handleUploadClick}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-full font-medium hover:shadow-lg transition-all transform hover:scale-105"
                      >
                        Seleccionar archivos
                      </button>
                    </div>
                    <input
                      ref={inputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => onFiles(e.target.files)}
                    />
                  </div>
                </div>

                {/* File Preview */}
                {files.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Imágenes seleccionadas ({files.length})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {files.map((f, i) => (
                        <div key={i} className="group relative rounded-xl overflow-hidden border border-purple-200 hover:shadow-lg transition-all">
                          <img 
                            src={URL.createObjectURL(f)} 
                            alt={f.name} 
                            className="h-32 w-full object-cover" 
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                            <button
                              onClick={() => removeFile(i)}
                              className="opacity-0 group-hover:opacity-100 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium transition-all transform hover:scale-105"
                            >
                              Eliminar
                            </button>
                          </div>
                          <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded text-xs font-medium text-gray-700">
                            {f.name.length > 15 ? f.name.substring(0, 15) + "..." : f.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Contexto (opcional) */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-200 transition-transform duration-300 hover:-translate-y-0.5">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M4 7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H9l-4 3v-3a3 3 0 0 1-1-2V7Z" stroke="#7c3aed" strokeWidth="1.8"/>
                  </svg>
                  Contexto Educativo (opcional pero recomendado)
                </h2>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-blue-800 mb-2">💡 ¿Cómo obtener mejores apuntes?</h3>
                  <p className="text-sm text-blue-700 mb-2">La IA puede usar su conocimiento interno para enriquecer tus apuntes. Proporciona contexto para obtener:</p>
                  <ul className="text-sm text-blue-700 space-y-1 ml-4">
                    <li>• <strong>Explicaciones más completas</strong> de conceptos incompletos</li>
                    <li>• <strong>Ejemplos adicionales</strong> relevantes para tu nivel</li>
                    <li>• <strong>Conexiones entre temas</strong> que faciliten el aprendizaje</li>
                    <li>• <strong>Contexto histórico</strong> y aplicaciones prácticas</li>
                    <li>• <strong>Ejercicios sugeridos</strong> para practicar</li>
                  </ul>
                </div>
                <p className="text-sm text-gray-600 mb-3">Describe la asignatura, nivel académico, objetivos de aprendizaje y cualquier preferencia específica:</p>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={5}
                  placeholder="Ejemplo completo:
📚 Asignatura: Cálculo I (Universidad)
🎯 Nivel: Primer año de ingeniería
📝 Tema: Derivadas e integrales
📖 Notación: El profesor usa f'(x) y ∫a^b
🎯 Objetivo: Preparar examen final
💡 Enfoque: Priorizar reglas de derivación, ejemplos prácticos y aplicaciones en física
📋 Tipo de examen: Problemas de aplicación y demostraciones teóricas"
                  className="w-full rounded-lg border border-purple-200 bg-white px-4 py-3 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all resize-y"
                />
              </div>

              {/* Settings */}
              <div ref={settingsRef} className="bg-white rounded-2xl p-6 shadow-lg border border-purple-200 scroll-mt-28 transition-transform duration-300 hover:-translate-y-0.5">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="#7c3aed" strokeWidth="1.8"/>
                    <path d="m19.4 15.5-.9 1.6-1.8-.2-.9 1.6 1.3 1.3-1.6.9.2 1.8-1.6.9-1.3-1.3-1.6.9-1.6-.9.2-1.8-1.6-.9L5.3 19l-1.6-.9.2-1.8-1.6-.9.9-1.6 1.8.2.9-1.6-1.3-1.3 1.6-.9-.2-1.8 1.6-.9 1.3 1.3 1.6-.9 1.6.9-.2 1.8 1.6.9 1.3-1.3 1.6.9-.2 1.8 1.6.9Z" stroke="#7c3aed" strokeWidth="1.2"/>
                  </svg>
                  Personaliza tus apuntes
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Tamaño de los apuntes</label>
                    <select
                      value={values.size}
                      onChange={(e) => setValues((v) => ({ ...v, size: e.target.value as FormValues["size"] }))}
                      className="w-full rounded-lg border border-purple-200 bg-white px-4 py-3 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
                    >
                      <option value="mini">Mini - Conceptos esenciales + ejemplos clave</option>
                      <option value="media">Media - Desarrollo completo + múltiples ejemplos</option>
                      <option value="larga">Larga - Análisis profundo + contexto + ejercicios</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Nivel de complejidad</label>
                    <select
                      value={values.complexity}
                      onChange={(e) => setValues((v) => ({ ...v, complexity: e.target.value as FormValues["complexity"] }))}
                      className="w-full rounded-lg border border-purple-200 bg-white px-4 py-3 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
                    >
                      <option value="baja">Baja - Lenguaje accesible + analogías simples</option>
                      <option value="media">Media - Terminología apropiada + explicaciones detalladas</option>
                      <option value="alta">Alta - Análisis técnico profundo + demostraciones</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Estilo de presentación</label>
                    <select
                      value={values.colorStyle}
                      onChange={(e) => setValues((v) => ({ ...v, colorStyle: e.target.value as FormValues["colorStyle"] }))}
                      className="w-full rounded-lg border border-purple-200 bg-white px-4 py-3 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
                    >
                      <option value="neutro">Neutro - Presentación académica formal</option>
                      <option value="pastel">Pastel - Enfoque amigable y motivador</option>
                      <option value="vivo">Vivo - Presentación dinámica y estimulante</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Nivel de enriquecimiento</label>
                    <select
                      value={values.creativity}
                      onChange={(e) => setValues((v) => ({ ...v, creativity: e.target.value as FormValues["creativity"] }))}
                      className="w-full rounded-lg border border-purple-200 bg-white px-4 py-3 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
                    >
                      <option value="preciso">Preciso - Fiel al contenido visual</option>
                      <option value="equilibrado">Equilibrado - Balance entre fidelidad y enriquecimiento</option>
                      <option value="creativo">Creativo - Máximo enriquecimiento educativo</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  aria-disabled={!canSubmit}
                  className={`mt-6 w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transition-all transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-3`}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Procesando...
                    </>
                  ) : (
                    <>Generar Apuntes</>
                  )}
                </button>
                
                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-600 font-medium">Error: {error}</p>
                  </div>
                )}

              </div>
            </div>

            {/* Results Section */}
            <div className="lg:sticky lg:top-6 lg:h-fit">
              <div ref={resultRef} className="bg-white rounded-2xl p-8 shadow-lg border border-purple-200 scroll-mt-28 max-w-none">
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
                        className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-4 rounded-xl font-semibold hover:shadow-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2"
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
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl font-semibold hover:shadow-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2"
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
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-purple-200">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Has terminado tu plan gratuito</h3>
              <button onClick={() => setShowPaywall(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <p className="text-gray-700 mb-4">Pásate a Premium para generar apuntes sin límites y con prioridad.</p>
            <div className="space-y-2">
              <button onClick={() => handleSubscribe("monthly")} disabled={loadingPlan === "monthly"} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg disabled:opacity-60">
                {loadingPlan === "monthly" ? "Redirigiendo..." : "Elegir mensual (4,99€ / mes)"}
              </button>
              <button onClick={() => handleSubscribe("yearly")} disabled={loadingPlan === "yearly"} className="w-full bg-white text-purple-600 ring-1 ring-purple-200 py-3 rounded-xl font-semibold hover:shadow-md disabled:opacity-60">
                {loadingPlan === "yearly" ? "Redirigiendo..." : "Elegir anual (39,99€ / año)"}
              </button>
            </div>
            <div className="mt-4 text-center">
              <Link href="/#precios" className="text-sm text-gray-600 hover:underline">Ver detalle de planes</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
