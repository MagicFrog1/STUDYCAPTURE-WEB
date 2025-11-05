"use client";

export default function StudyTips() {
  type Tip = {
    icon: "squareStar" | "sparkleChat" | "document" | "branches";
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
      icon: "branches",
      title: "Mapas: de lo general a lo específico",
      description:
        "Empieza por ideas principales y baja de nivel. Ajusta simpleza/definiciones según si buscas visión global o detalle.",
      accent: "teal",
    },
  ];

  const accentToClasses: Record<Tip["accent"], { ring: string; text: string; overlay: string }> = {
    violet: {
      ring: "ring-violet-200 bg-white text-violet-600",
      text: "text-violet-600",
      overlay: "from-violet-50",
    },
    blue: {
      ring: "ring-blue-200 bg-white text-blue-600",
      text: "text-blue-600",
      overlay: "from-blue-50",
    },
    emerald: {
      ring: "ring-emerald-200 bg-white text-emerald-600",
      text: "text-emerald-600",
      overlay: "from-emerald-50",
    },
    teal: {
      ring: "ring-teal-200 bg-white text-teal-600",
      text: "text-teal-600",
      overlay: "from-teal-50",
    },
  };

  return (
    <div className="relative">
      {/* Fondo sutil mejorado */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50"></div>
      <div className="pointer-events-none absolute -top-10 -left-10 w-72 h-72 bg-purple-200/40 blur-3xl rounded-full"></div>
      <div className="pointer-events-none absolute -bottom-10 -right-10 w-72 h-72 bg-blue-200/40 blur-3xl rounded-full"></div>

      <div className="relative max-w-6xl mx-auto">
        {/* Encabezado */}
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold mb-5 tracking-tight">
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              Consejos para mejores resultados
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Descubre cómo exprimir las 4 herramientas (Apuntes, Flashcards, Tipo Test y Mapas) para mejorar tus resultados
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
                <div className="rounded-3xl p-[1px] bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100">
                  <div className="relative bg-white rounded-3xl p-8 border border-gray-100 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:border-purple-200/70">
                  {/* Icono dentro de contenedor cuadrado redondeado */}
                  <div className="mb-6">
                    <span className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ring-1 ${c.ring}`}>
                      {tip.icon === "squareStar" && <IconSquareStar />}
                      {tip.icon === "sparkleChat" && <IconSparkleChat />}
                      {tip.icon === "document" && <IconDocument />}
                      {tip.icon === "branches" && <IconBranches />}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{tip.title}</h3>
                  <p className="text-gray-700 leading-relaxed">{tip.description}</p>
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

function IconBranches() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3v18M5 8h8M11 8l1.5 1.5L11 11M5 16h8M11 16l1.5 1.5L11 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}