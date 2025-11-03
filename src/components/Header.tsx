"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import AppInfoDropdown from "@/components/AppInfoDropdown";
 

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="bg-white/80 supports-[backdrop-filter]:bg-white/70 backdrop-blur border-b border-gray-200/70 sticky top-0 z-40 pt-[env(safe-area-inset-top)] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-2">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 transition-transform hover:translate-y-[-1px]">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-sm">
              <img src="/logo.svg" alt="StudyCaptures" className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">StudyCaptures</span>
          </Link>

          {/* Navigation (desktop) */}
          <nav className="hidden md:flex items-center space-x-6">
            <AppInfoDropdown />
            {pathname !== "/profile" && (
              <Link
                href="/profile"
                className="text-gray-600 hover:text-purple-600 transition-all hover:translate-y-[-1px]"
              >
                Mi cuenta
              </Link>
            )}
            <Link
              href="/generar"
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full font-medium shadow-sm hover:shadow-md transition-all"
            >
              Generar Apuntes
            </Link>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/profile"
              className="hidden md:inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
            >
              <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">👤</span>
              <span className="text-sm">Mi cuenta</span>
            </Link>
            {/* Hamburger (mobile) */}
            <button
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-md border border-gray-200 text-gray-700 tap-grow"
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
        <div className="md:hidden bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm transition-all">
          <div className="px-4 py-4 flex flex-col gap-3">
            <AppInfoDropdown />
            {pathname !== "/profile" && (
              <Link href="/profile" className="text-gray-700 transition-colors hover:text-purple-600" onClick={() => setIsMenuOpen(false)}>Mi cuenta</Link>
            )}
            <div className="pt-1">
              <Link
                href="/generar"
                className="block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full font-medium text-center tap-grow shadow-sm"
                onClick={() => setIsMenuOpen(false)}
              >
                Generar Apuntes
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
