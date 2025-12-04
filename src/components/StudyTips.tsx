"use client";

export default function StudyTips() {
  type Tip = {
    icon: "squareStar" | "sparkleChat" | "document" | "longQuestions";
    title: string;
    description: string;
    accent: "violet" | "blue" | "emerald" | "teal";
  };

  const tips: Tip[] = [
    {
      icon: "squareStar",
      title: "Apuntes: un tema por lote",
      description:
        "Sube fotos del mismo tema y añade contexto (nivel, objetivos). Así la IA estructura mejor definiciones, pasos y ejemplos.",
      accent: "violet",
    },
    {
      icon: "sparkleChat",
      title: "Flashcards: preguntas precisas",
      description:
        "Pide preguntas concretas y respuestas cortas. Indica el nivel de dificultad para optimizar la retención espaciada.",
      accent: "blue",
    },
    {
      icon: "document",
      title: "Tipo Test: simula examen",
      description:
        "Activa comprobación al final para evaluar sin pistas. Revisa luego la explicación de errores y anótalos como reglas.",
      accent: "emerald",
    },
    {
      icon: "longQuestions",
      title: "Preguntas largas con porcentaje de acierto",
      description:
        "Genera preguntas extensas, responde con tus palabras y revisa la corrección automática para identificar mejoras clave.",
      accent: "teal",
    },
  ];

  const accentToClasses: Record<Tip["accent"], { ring: string; text: string; overlay: string }> = {
    violet: {
      ring: "ring-violet-400/70 bg-slate-950 text-violet-200",
      text: "text-violet-200",
      overlay: "from-violet-500/15",
    },
    blue: {
      ring: "ring-sky-400/70 bg-slate-950 text-sky-200",
      text: "text-sky-200",
      overlay: "from-sky-500/15",
    },
    emerald: {
      ring: "ring-emerald-400/70 bg-slate-950 text-emerald-200",
      text: "text-emerald-200",
      overlay: "from-emerald-500/15",
    },
    teal: {
      ring: "ring-teal-400/70 bg-slate-950 text-teal-200",
      text: "text-teal-200",
      overlay: "from-teal-500/15",
    },
  };

  return (
    <div className="relative">
      {/* Fondo sutil mejorado coherente con tema oscuro */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
      <div className="pointer-events-none absolute -top-10 -left-10 w-72 h-72 bg-sky-500/25 blur-3xl rounded-full"></div>
      <div className="pointer-events-none absolute -bottom-10 -right-10 w-72 h-72 bg-fuchsia-500/25 blur-3xl rounded-full"></div>

      <div className="relative max-w-6xl mx-auto">
        {/* Encabezado */}
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold mb-5 tracking-tight">
            <span className="bg-[radial-gradient(circle_at_0_0,#22d3ee,transparent_60%),radial-gradient(circle_at_100%_0,#a855f7,transparent_60%),linear-gradient(90deg,#e5e7eb,#e0f2fe,#c7d2fe)] bg-clip-text text-transparent">
              Consejos para mejores resultados
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Descubre cómo exprimir las 4 herramientas (Apuntes, Flashcards, Tipo Test y Preguntas largas) para mejorar tus resultados
          </p>
        </div>

        {/* Tarjetas con efecto de realce (2x2) */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-6 sm:gap-8">
          {tips.map((tip, i) => {
            const c = accentToClasses[tip.accent];
            return (
              <div key={i} className="relative group">
                {/* Overlay de color muy sutil */}
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-b ${c.overlay} to-transparent`}></div>

                {/* Borde degradado suave */}
                <div className="rounded-3xl p-[1px] bg-[radial-gradient(circle_at_0_0,#22d3ee,transparent_55%),radial-gradient(circle_at_100%_0,#a855f7,transparent_55%),linear-gradient(135deg,#0f172a,#1f2937)]">
                  <div className="relative bg-slate-950/90 rounded-3xl p-8 border border-slate-800 shadow-[0_18px_45px_rgba(15,23,42,1)] hover:shadow-[0_24px_65px_rgba(15,23,42,1)] transition-all duration-300 hover:-translate-y-1">
                  {/* Icono dentro de contenedor cuadrado redondeado */}
                  <div className="mb-6">
                    <span className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ring-1 ${c.ring}`}>
                      {tip.icon === "squareStar" && <IconSquareStar />}
                      {tip.icon === "sparkleChat" && <IconSparkleChat />}
                      {tip.icon === "document" && <IconDocument />}
                      {tip.icon === "longQuestions" && <IconLongQuestions />}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-slate-50 mb-3">{tip.title}</h3>
                  <p className="text-slate-300 leading-relaxed">{tip.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Iconos minimalistas (contorno) similares a los del ejemplo
function IconSquareStar() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M12 8.5l1 2 2 .3-1.6 1.5.4 2.2L12 13.2 9.2 14.5l.4-2.2L8 10.8l2-.3 1-2Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function IconSparkleChat() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H9l-4 3v-3a3 3 0 0 1-1-2V6Z" stroke="currentColor" strokeWidth="2" />
      <path d="M16.5 5.5l.6 1.3 1.3.2-1 .9.2 1.3-1.1-.6-1.1.6.2-1.3-1-.9 1.3-.2.6-1.3Z" fill="currentColor" />
    </svg>
  );
}

function IconDocument() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M7 3h6l4 4v12a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z" stroke="currentColor" strokeWidth="2" />
      <path d="M13 3v4h4" stroke="currentColor" strokeWidth="2" />
      <path d="M8 11h8M8 15h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconLongQuestions() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2" />
      <path d="M11.3 15.5h1.4v1.4h-1.4z" fill="currentColor" />
      <path
        d="M12 13.7v-.3c0-.8.5-1.3 1.1-1.7.6-.4 1.2-.9 1.2-1.8 0-1.4-1.1-2.3-2.6-2.3-1.4 0-2.4.8-2.6 2l-.1.5h1.5l.1-.2c.2-.6.6-.9 1.2-.9.7 0 1 .4 1 .9 0 .5-.3.7-.7 1-1 .6-1.8 1.1-1.8 2.5v.3H12Z"
        fill="currentColor"
      />
    </svg>
  );
}