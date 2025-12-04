"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AppInfoDropdown from "@/components/AppInfoDropdown";
import { supabase } from "@/lib/supabaseClient";
 

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(Boolean(data.session));
    })();
  }, []);

  return (
    <header className="sticky top-2 z-40 pt-[env(safe-area-inset-top)] mx-2 rounded-2xl border border-slate-800/70 bg-slate-900/70 supports-[backdrop-filter]:bg-slate-900/60 backdrop-blur-xl shadow-[0_18px_45px_rgba(15,23,42,0.9)] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3 sm:py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 transition-transform hover:-translate-y-0.5">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900/80 ring-1 ring-slate-700/80 shadow-[0_16px_35px_rgba(15,23,42,0.9)]">
              <img src="/LOGO%20WEB.png" alt="StudyCaptures" className="w-8 h-8 object-contain" />
            </div>
            <span className="hidden sm:inline text-xl font-semibold tracking-tight bg-gradient-to-r from-indigo-300 via-sky-300 to-fuchsia-300 bg-clip-text text-transparent drop-shadow-[0_0_18px_rgba(56,189,248,0.35)]">
              StudyCaptures
            </span>
          </Link>

          {/* Navigation (desktop) */}
          <nav className="hidden md:flex items-center space-x-6">
            <AppInfoDropdown />
            {pathname !== "/profile" && (
              <Link
                href={isLoggedIn ? "/profile" : "/login"}
                className="inline-flex items-center gap-2 text-slate-300 hover:text-sky-300 transition-all hover:-translate-y-0.5"
              >
                <span className="w-8 h-8 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-sky-300 rounded-xl flex items-center justify-center text-xs ring-1 ring-slate-600/70 shadow-[0_10px_28px_rgba(15,23,42,0.9)]">
                  👤
                </span>
                <span>Mi cuenta</span>
              </Link>
            )}
            <Link
              href="/generar"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-slate-50 bg-[radial-gradient(circle_at_0_0,#22d3ee,transparent_55%),radial-gradient(circle_at_100%_0,#a855f7,transparent_55%),linear-gradient(90deg,#1d4ed8,#4f46e5,#a855f7)] shadow-[0_18px_45px_rgba(15,23,42,0.9)] ring-1 ring-indigo-400/60 hover:brightness-110 hover:shadow-[0_22px_60px_rgba(15,23,42,1)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              Generar Apuntes
            </Link>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <Link
              href={isLoggedIn ? "/profile" : "/login"}
              className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/60 text-slate-200 hover:text-sky-300 border border-slate-700/70 hover:border-sky-500/50 shadow-[0_14px_35px_rgba(15,23,42,0.9)] transition-colors"
            >
              <span className="w-8 h-8 bg-gradient-to-br from-sky-500 to-indigo-500 text-slate-950 rounded-full flex items-center justify-center text-sm font-semibold">
                👤
              </span>
              <span className="text-sm">Mi cuenta</span>
            </Link>
            {/* Hamburger (mobile) */}
            <button
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-700/80 bg-slate-900/70 text-slate-100 shadow-[0_14px_35px_rgba(15,23,42,0.9)] tap-grow"
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
        <div className="md:hidden bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 shadow-[0_18px_45px_rgba(15,23,42,1)] transition-all">
          <div className="px-4 py-4 flex flex-col gap-3">
            <AppInfoDropdown />
            {pathname !== "/profile" && (
              <Link
                href={isLoggedIn ? "/profile" : "/login"}
                className="text-slate-200 transition-colors hover:text-sky-300"
                onClick={() => setIsMenuOpen(false)}
              >
                Mi cuenta
              </Link>
            )}
            <div className="pt-1">
              <Link
                href="/generar"
                className="block bg-[radial-gradient(circle_at_0_0,#22d3ee,transparent_55%),radial-gradient(circle_at_100%_0,#a855f7,transparent_55%),linear-gradient(90deg,#1d4ed8,#4f46e5,#a855f7)] text-white px-4 py-2 rounded-full font-medium text-center tap-grow shadow-[0_18px_45px_rgba(15,23,42,1)]"
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
