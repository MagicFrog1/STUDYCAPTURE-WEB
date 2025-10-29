"use client";

import Link from "next/link";
import { useState } from "react";
import UserProfile from "@/components/UserProfile";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 pt-[env(safe-area-inset-top)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SC</span>
            </div>
            <span className="text-xl font-bold text-gray-900">StudyCaptures</span>
          </Link>

          {/* Navigation (desktop) */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Inicio
            </Link>
            <Link
              href="/generar"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Generar Apuntes
            </Link>
            <Link
              href="/privacy"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Privacidad
            </Link>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              <UserProfile />
            </div>
            {/* Hamburger (mobile) */}
            <button
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-md border border-gray-200 text-gray-700"
              aria-label="Abrir menú"
              onClick={() => setIsMenuOpen((v) => !v)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {isMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm">
          <div className="px-4 py-4 flex flex-col gap-3">
            <Link href="/" className="text-gray-700" onClick={() => setIsMenuOpen(false)}>Inicio</Link>
            <Link href="/generar" className="text-gray-700" onClick={() => setIsMenuOpen(false)}>Generar Apuntes</Link>
            <Link href="/privacy" className="text-gray-700" onClick={() => setIsMenuOpen(false)}>Privacidad</Link>
            <div className="pt-1">
              <Link
                href="/generar"
                className="block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full font-medium text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Empezar ahora
              </Link>
            </div>
            <div className="pt-1">
              {/* User profile button also accesible on mobile */}
              <UserProfile />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
