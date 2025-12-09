"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { isPremium } from "@/lib/premium";

export default function TrialBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session?.user) {
        setShow(false);
        return;
      }
      const premium = await isPremium(session.user.id);
      // Mostrar solo a usuarios logueados SIN suscripción activa
      setShow(!premium);
    };

    run();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      run();
    });
    return () => {
      sub.subscription?.unsubscribe();
    };
  }, []);

  if (!show) return null;

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="w-full bg-slate-950/95 supports-[backdrop-filter]:bg-slate-950/80 backdrop-blur-xl border-b border-sky-500/30 shadow-[0_8px_32px_rgba(15,23,42,0.8)]">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse" />
                <p className="text-sm sm:text-base font-semibold tracking-wide text-slate-100">
                  Accede a todas las herramientas con StudyCaptures Premium
                </p>
              </div>
              <a
                href="/#precios"
                className="shrink-0 inline-flex items-center gap-2 bg-[radial-gradient(circle_at_0_0,#22d3ee,transparent_55%),radial-gradient(circle_at_100%_0,#a855f7,transparent_55%),linear-gradient(90deg,#1d4ed8,#4f46e5,#a855f7)] text-white px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all hover:brightness-110 shadow-[0_4px_12px_rgba(56,189,248,0.4)]"
              >
                Hazte Premium
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
      {/* Spacer para que el header/página no quede oculto bajo la barra fija */}
      <div aria-hidden className="h-[44px]" />
    </>
  );
}


