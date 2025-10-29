"use client";

export default function StudyTips() {
  type Tip = {
    icon: "squareStar" | "sparkleChat" | "document";
    title: string;
    description: string;
    accent: "violet" | "blue" | "emerald";
  };

  const tips: Tip[] = [
    {
      icon: "squareStar",
      title: "Calidad de imagen",
      description:
        "Usa buena iluminación y mantén la cámara estable. Evita sombras y reflejos para un OCR más preciso.",
      accent: "violet",
    },
    {
      icon: "sparkleChat",
      title: "Contexto educativo",
      description:
        "Indica asignatura, nivel y objetivos. Menciona el tipo de examen para afinar explicaciones y ejemplos.",
      accent: "blue",
    },
    {
      icon: "document",
      title: "Personalización",
      description:
        "Ajusta tamaño, complejidad y estilo visual hasta que el resultado encaje con tu forma de estudiar.",
      accent: "emerald",
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
  };

  return (
    <div className="relative">
      {/* Fondo sutil como en el ejemplo */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50"></div>

      <div className="relative max-w-6xl mx-auto">
        {/* Encabezado */}
        <div className="text-center mb-14">
          <h2 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              Consejos para mejores resultados
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Descubre las técnicas que utilizan los estudiantes más exitosos para obtener apuntes de máxima calidad
          </p>
        </div>

        {/* Tarjetas estilo ejemplo */}
        <div className="grid md:grid-cols-3 gap-8">
          {tips.map((tip, i) => {
            const c = accentToClasses[tip.accent];
            return (
              <div key={i} className="relative group">
                {/* Overlay de color muy sutil */}
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-b ${c.overlay} to-transparent`}></div>

                <div className="relative bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  {/* Icono dentro de contenedor cuadrado redondeado */}
                  <div className="mb-6">
                    <span className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ring-1 ${c.ring}`}>
                      {tip.icon === "squareStar" && <IconSquareStar />}
                      {tip.icon === "sparkleChat" && <IconSparkleChat />}
                      {tip.icon === "document" && <IconDocument />}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{tip.title}</h3>
                  <p className="text-gray-700 leading-relaxed">{tip.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA en violeta de marca */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-purple-600 to-violet-600 rounded-2xl p-8 text-white">
            <h4 className="text-2xl font-bold mb-4">¿Listo para mejorar tus apuntes?</h4>
            <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
              Aplica estos consejos y descubre cómo la IA puede transformar tu forma de estudiar
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="flex items-center gap-2 text-purple-100">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                <span className="text-sm">Resultados instantáneos</span>
              </div>
              <div className="flex items-center gap-2 text-purple-100">
                <span className="w-2 h-2 bg-purple-300 rounded-full"></span>
                <span className="text-sm">Totalmente personalizable</span>
              </div>
            </div>
          </div>
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