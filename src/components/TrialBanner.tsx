"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function TrialBanner() {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) {
        setShow(false);
        return;
      }
      // Obtener usuario y calcular trial restante
      const { data: u } = await supabase.auth.getUser();
      const user = u.user;
      // @ts-ignore - campos posibles de Supabase
      const confirmedAt: string | null = user?.email_confirmed_at ?? user?.confirmed_at ?? user?.created_at ?? null;
      if (!confirmedAt) return;
      const trialUntil = new Date(confirmedAt).getTime() + 7 * 24 * 60 * 60 * 1000;
      const msLeft = trialUntil - Date.now();
      if (msLeft <= 0) return;
      const d = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
      setDaysLeft(d);
      setShow(true);
    })();
  }, []);

  if (!show || daysLeft === null) return null;

  return (
    <div className="mx-2 sticky top-[68px] z-30">
      <div className="bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-50 border border-amber-200 text-amber-900 rounded-xl px-4 py-2 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg bg-amber-400 text-white flex items-center justify-center text-xs font-bold">⚡</div>
          <p className="text-sm font-semibold">Prueba Premium activa · Te quedan {daysLeft} día{daysLeft === 1 ? "" : "s"} gratis</p>
        </div>
        <a href="/#precios" className="text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-lg px-3 py-1 transition-colors">Mejorar ahora</a>
      </div>
    </div>
  );
}


