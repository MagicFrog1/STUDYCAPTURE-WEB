"use client";

import { useState } from "react";

export default function AppInfoDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-full border border-purple-200 hover:border-purple-300 text-gray-700 hover:text-purple-700 transition-all bg-white/80 backdrop-blur-sm"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <span className="font-medium">¿Cómo funciona?</span>
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-96 bg-white rounded-2xl shadow-xl border border-purple-200 p-6 z-50">
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                ¿Qué hace StudyCaptures?
              </h3>
              <p className="text-gray-600 text-sm">
                Convierte tus fotos de apuntes en material de estudio perfecto usando inteligencia artificial
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Sube tus imágenes</h4>
                  <p className="text-sm text-gray-600">
                    Fotografías de pizarras, apuntes manuscritos, libros o cualquier material educativo
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Personaliza el resultado</h4>
                  <p className="text-sm text-gray-600">
                    Elige el nivel de detalle, complejidad y estilo visual que prefieras
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Recibe apuntes perfectos</h4>
                  <p className="text-sm text-gray-600">
                    Material estructurado, con explicaciones detalladas y ejemplos adicionales
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
              <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Ideal para:
              </h4>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Estudiantes universitarios y de bachillerato</li>
                <li>• Preparación de oposiciones</li>
                <li>• Repaso rápido antes de exámenes</li>
                <li>• Creación de material de estudio organizado</li>
              </ul>
            </div>

            <div className="text-center">
              <button
                onClick={() => setIsOpen(false)}
                className="text-purple-600 hover:text-purple-700 font-medium text-sm transition-colors"
              >
                Entendido ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay para cerrar al hacer clic fuera */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
