"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Profile = { id: string; is_premium: boolean; updated_at?: string | null };
type SubscriptionRow = { id: string; status: string; current_period_end: string; updated_at: string };

export default function ProfilePage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<"change" | "cancel" | "" | "logout">("");
  const [noSession, setNoSession] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setNoSession(true);
        setLoading(false);
        setRedirecting(true);
        return;
      }
      setEmail(data.session.user.email ?? null);
      // Buscar en la tabla profiles el estado premium
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, is_premium, updated_at")
        .eq("user_id", data.session.user.id)
        .maybeSingle();
      
      if (profileError) {
        console.error("Error fetching profile:", profileError);
      }
      
      const mapped: Profile = {
        id: profileData?.id || data.session.user.id,
        is_premium: profileData?.is_premium || false,
        updated_at: profileData?.updated_at || null
      };
      setProfile(mapped);
      setLoading(false);
    })();
  }, [router]);

  // Si no hay sesión, avisar y redirigir tras un breve retardo para evitar pantalla en blanco
  useEffect(() => {
    if (noSession && redirecting) {
      const t = setTimeout(() => {
        router.replace("/login");
      }, 800);
      return () => clearTimeout(t);
    }
  }, [noSession, redirecting, router]);

  // Reveal on scroll (evita que los elementos con clase `reveal` queden invisibles)
  useEffect(() => {
    if (loading) return; // Esperar a que se monte el contenido real
    const elements = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    if (!('IntersectionObserver' in window) || elements.length === 0) return;
    const io = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 }
    );
    elements.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [loading]);

  async function manageSubscription() {
    setActionLoading("change");
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const res = await fetch("/api/create-portal-session", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          ...(token ? { Authorization: `Bearer ${token}` } : {}) 
        },
      });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as { url?: string };
      if (json.url) window.location.href = json.url;
    } catch (e) {
      alert((e as Error).message || "Error al abrir portal de suscripción");
    } finally {
      setActionLoading("");
    }
  }

  async function logout() {
    setActionLoading("logout");
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-300">
        <div>Cargando…</div>
      </main>
    );
  }

  if (noSession) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <p className="text-slate-100 font-medium">Necesitas iniciar sesión</p>
          <p className="text-slate-400 mt-1">Redirigiendo a la página de acceso…</p>
          <div className="mt-3">
            <button
              onClick={() => router.replace("/login")}
              className="px-4 py-2 bg-[radial-gradient(circle_at_0_0,#22d3ee,transparent_55%),radial-gradient(circle_at_100%_0,#a855f7,transparent_55%),linear-gradient(90deg,#1d4ed8,#4f46e5,#a855f7)] text-white rounded-lg font-medium hover:brightness-110 transition-all shadow-[0_12px_30px_rgba(15,23,42,1)]"
            >
              Ir a iniciar sesión ahora
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200">
      {/* Hero de cuenta */}
      <section className="px-4 sm:px-6 pt-10 reveal">
        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/90 shadow-[0_18px_45px_rgba(15,23,42,1)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0_0,rgba(56,189,248,0.28),transparent_55%),radial-gradient(circle_at_100%_0,rgba(168,85,247,0.3),transparent_55%)] opacity-90" />
            <div className="relative px-6 sm:px-8 py-8 sm:py-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-[radial-gradient(circle_at_0_0,#22d3ee,transparent_55%),radial-gradient(circle_at_100%_0,#a855f7,transparent_55%),linear-gradient(135deg,#1d4ed8,#4f46e5,#a855f7)] flex items-center justify-center ring-1 ring-indigo-300/70 shadow-[0_10px_26px_rgba(15,23,42,1)]">
                  <img src="/LOGO%20WEB.png" alt="StudyCaptures" className="w-5 h-5 object-contain" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-50">Mi cuenta</h1>
              </div>
              <p className="text-slate-200/90">Gestiona tu suscripción, privacidad y sesión</p>
              <div className="mt-6 inline-flex items-center gap-3 bg-slate-900/80 backdrop-blur px-4 py-2 rounded-full ring-1 ring-slate-700/80">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 font-semibold text-slate-100">
                  {email?.charAt(0).toUpperCase()}
                </span>
                <span className="text-sm text-slate-100 break-all">{email}</span>
                <span
                  className={`text-xs px-2 py-1 rounded-full ring-1 ${
                    profile?.is_premium
                      ? "bg-emerald-500/15 ring-emerald-400/70 text-emerald-200"
                      : "bg-slate-900/80 ring-slate-700/80 text-slate-200"
                  }`}
                >
                  {profile?.is_premium ? "Premium activo" : "Suscripción requerida"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contenido principal */}
      <section className="px-4 sm:px-6 py-10">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          {/* Estado */}
          <section className="bg-slate-950/95 rounded-2xl border border-slate-800 shadow-[0_16px_40px_rgba(15,23,42,1)] p-5 card-smooth reveal">
            <div className="flex items-center gap-3 mb-3">
              <IconStatus />
              <h2 className="font-semibold text-slate-50">Estado</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-400">Email</p>
                <p className="font-medium text-slate-100 break-all">{email}</p>
              </div>
              <div>
                <p className="text-slate-400">Plan</p>
                <p className={`font-medium ${profile?.is_premium ? "text-emerald-300" : "text-slate-100"}`}>
                  {profile?.is_premium ? "Premium (sin límites)" : "Suscripción requerida"}
                </p>
              </div>
            </div>
          </section>

          {/* Acciones de suscripción */}
          <section className="bg-slate-950/95 rounded-2xl border border-slate-800 shadow-[0_16px_40px_rgba(15,23,42,1)] p-5 md:col-span-2 card-smooth reveal">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <IconCard />
                <h2 className="font-semibold text-slate-50">Suscripción</h2>
              </div>
              {!profile?.is_premium && (
                <Link href="/#precios" className="text-sm text-sky-300 hover:text-sky-200 font-medium tap-grow">
                  Ver planes
                </Link>
              )}
            </div>

            {profile?.is_premium ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-300">
                  Gestiona tu suscripción, actualiza métodos de pago o cancela desde el portal de Stripe.
                </p>
                <button
                  onClick={manageSubscription}
                  disabled={actionLoading === "change"}
                  className="w-full px-4 py-3 rounded-xl bg-[radial-gradient(circle_at_0_0,#22d3ee,transparent_55%),radial-gradient(circle_at_100%_0,#a855f7,transparent_55%),linear-gradient(90deg,#1d4ed8,#4f46e5,#a855f7)] text-white hover:brightness-110 disabled:opacity-50 tap-grow font-medium shadow-[0_18px_45px_rgba(15,23,42,1)]"
                >
                  {actionLoading === "change" ? "Abriendo..." : "Gestionar suscripción"}
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-sky-500/60 p-4 bg-slate-900/80 text-slate-200 text-sm">
                Esta herramienta es de pago. Suscríbete desde la portada o desde Generar para utilizar StudyCaptures.
              </div>
            )}
          </section>

          {/* Privacidad y soporte */}
          <section className="bg-slate-950/95 rounded-2xl border border-slate-800 shadow-[0_16px_40px_rgba(15,23,42,1)] p-5 card-smooth reveal">
            <div className="flex items-center gap-3 mb-3">
              <IconShield />
              <h2 className="font-semibold text-slate-50">Privacidad</h2>
            </div>
            <div className="space-y-3 text-sm">
              <Link
                href="/privacy"
                className="inline-flex items-center gap-2 text-sky-300 hover:text-sky-200 tap-grow"
              >
                Ver política de privacidad
                <IconArrow />
              </Link>
              <p className="text-slate-300">
                Soporte:{" "}
                <a className="text-sky-300 hover:text-sky-200" href="mailto:studycapturesai@gmail.com">
                  studycapturesai@gmail.com
                </a>
              </p>
            </div>
          </section>

          {/* Sesión */}
          <section className="bg-slate-950/95 rounded-2xl border border-slate-800 shadow-[0_16px_40px_rgba(15,23,42,1)] p-5 card-smooth reveal">
            <div className="flex items-center gap-3 mb-3">
              <IconLogout />
              <h2 className="font-semibold text-slate-50">Sesión</h2>
            </div>
            <button
              onClick={logout}
              disabled={actionLoading === "logout"}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 text-slate-100 hover:bg-slate-800 disabled:opacity-50 tap-grow"
            >
              Cerrar sesión
            </button>
          </section>
        </div>
      </section>
    </main>
  );
}


function IconStatus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 12h4v8H4v-8Zm6-6h4v14h-4V6Zm6 3h4v11h-4V9Z" stroke="#7c3aed" strokeWidth="1.8"/>
    </svg>
  );
}

function IconCard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="#2563eb" strokeWidth="1.8"/>
      <path d="M3 10h18" stroke="#2563eb" strokeWidth="1.8"/>
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3l7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6l7-3z" stroke="#7c3aed" strokeWidth="1.8"/>
    </svg>
  );
}

function IconArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 12h14" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round"/>
      <path d="M13 5l7 7-7 7" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M16 17l5-5-5-5M21 12H9" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6" stroke="#111827" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
