"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function TrialBanner() {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const computeTrial = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) {
        setShow(false);
        setDaysLeft(null);
        return;
      }
      const { data: u } = await supabase.auth.getUser();
      const user = u.user;
      // @ts-ignore - campos posibles de Supabase
      const confirmedAt: string | null = user?.email_confirmed_at ?? user?.confirmed_at ?? user?.created_at ?? null;
      if (!confirmedAt) {
        setShow(false);
        setDaysLeft(null);
        return;
      }
      const trialUntil = new Date(confirmedAt).getTime() + 7 * 24 * 60 * 60 * 1000;
      const msLeft = trialUntil - Date.now();
      if (msLeft <= 0) {
        setShow(false);
        setDaysLeft(null);
        return;
      }
      const d = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
      setDaysLeft(d);
      setShow(true);
    };

    // Calcular al montar
    computeTrial();
    // Recalcular cuando cambie el estado auth (login/logout/refresh)
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      computeTrial();
    });
    return () => {
      sub.subscription?.unsubscribe();
    };
  }, []);

  if (!show || daysLeft === null) return null;

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm sm:text-base font-semibold tracking-wide">
                Prueba Premium activa · Te quedan {daysLeft} día{daysLeft === 1 ? "" : "s"} gratis
              </p>
              <a
                href="/#precios"
                className="shrink-0 inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-colors"
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


