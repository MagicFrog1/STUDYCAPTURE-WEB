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
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("id,status,current_period_end,updated_at")
        .eq("user_id", data.session.user.id)
        .eq("status", "active")
        .gt("current_period_end", new Date().toISOString())
        .maybeSingle();
      const typedSub = sub as unknown as SubscriptionRow | null;
      const mapped: Profile | null = typedSub
        ? { id: typedSub.id, is_premium: true, updated_at: typedSub.updated_at }
        : { id: data.session.user.id, is_premium: false, updated_at: null };
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

  async function cancelSubscription() {
    setActionLoading("cancel");
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const res = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) throw new Error(await res.text());
      alert("Suscripción cancelada. Seguirás teniendo acceso hasta el fin del período actual.");
      router.refresh();
    } catch (e) {
      alert((e as Error).message || "Error al cancelar la suscripción");
    } finally {
      setActionLoading("");
    }
  }

  async function changePlan(newPlan: "monthly" | "yearly") {
    setActionLoading("change");
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const res = await fetch("/api/subscription/change", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ newPlan }),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as { url?: string };
      if (json.url) window.location.href = json.url;
    } catch (e) {
      alert((e as Error).message || "Error al cambiar de plan");
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
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
        <div className="text-gray-600">Cargando…</div>
      </main>
    );
  }

  if (noSession) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
        <div className="text-center">
          <p className="text-gray-900 font-medium">Necesitas iniciar sesión</p>
          <p className="text-gray-600 mt-1">Redirigiendo a la página de acceso…</p>
          <div className="mt-3">
            <button onClick={() => router.replace("/login")} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Ir a iniciar sesión ahora</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Hero de cuenta */}
      <section className="px-6 pt-10 reveal">
        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600" />
            <div className="relative px-8 py-10 text-white">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Mi cuenta</h1>
              <p className="text-white/80">Gestiona tu suscripción, privacidad y sesión</p>
              <div className="mt-6 inline-flex items-center gap-3 bg-white/10 backdrop-blur px-4 py-2 rounded-full ring-1 ring-white/30">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/20 font-semibold">
                  {email?.charAt(0).toUpperCase()}
                </span>
                <span className="text-sm">{email}</span>
                <span className={`text-xs px-2 py-1 rounded-full ring-1 ${profile?.is_premium ? "bg-green-500/20 ring-green-400/50 text-green-50" : "bg-white/10 ring-white/30 text-white"}`}>
                  {profile?.is_premium ? "Premium activo" : "Plan gratuito"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contenido principal */}
      <section className="px-6 py-10">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          {/* Estado */}
          <section className="bg-white rounded-2xl border border-purple-200 shadow-sm p-5 card-smooth reveal">
            <div className="flex items-center gap-3 mb-3">
              <IconStatus />
              <h2 className="font-semibold text-gray-900">Estado</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{email}</p>
              </div>
              <div>
                <p className="text-gray-500">Plan</p>
                <p className={`font-medium ${profile?.is_premium ? "text-green-600" : "text-gray-900"}`}>
                  {profile?.is_premium ? "Premium (sin límites)" : "Gratis (2 usos)"}
                </p>
              </div>
            </div>
          </section>

          {/* Acciones de suscripción */}
          <section className="bg-white rounded-2xl border border-purple-200 shadow-sm p-5 md:col-span-2 card-smooth reveal">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <IconCard />
                <h2 className="font-semibold text-gray-900">Suscripción</h2>
              </div>
              {!profile?.is_premium && (
                <Link href="/" className="text-sm text-purple-700 hover:text-purple-800 font-medium tap-grow">Ver planes</Link>
              )}
            </div>

            {profile?.is_premium ? (
              <div className="grid sm:grid-cols-3 gap-3">
                <button onClick={() => changePlan("monthly")} disabled={actionLoading === "change"} className="px-4 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 tap-grow">
                  Cambiar a mensual
                  <span className="block text-xs text-white/80">4,99€/mes</span>
                </button>
                <button onClick={() => changePlan("yearly")} disabled={actionLoading === "change"} className="px-4 py-3 rounded-xl bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 tap-grow">
                  Cambiar a anual
                  <span className="block text-xs text-white/80">39,99€/año</span>
                </button>
                <button onClick={cancelSubscription} disabled={actionLoading === "cancel"} className="px-4 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 tap-grow">
                  Cancelar suscripción
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-purple-300 p-4 bg-purple-50 text-purple-800">
                Actualmente estás en el plan gratuito. Suscríbete desde la portada o desde Generar.
              </div>
            )}
          </section>

          {/* Privacidad y soporte */}
          <section className="bg-white rounded-2xl border border-purple-200 shadow-sm p-5 card-smooth reveal">
            <div className="flex items-center gap-3 mb-3">
              <IconShield />
              <h2 className="font-semibold text-gray-900">Privacidad</h2>
            </div>
            <div className="space-y-3 text-sm">
              <Link href="/privacy" className="inline-flex items-center gap-2 text-purple-700 hover:text-purple-800 tap-grow">
                Ver política de privacidad
                <IconArrow />
              </Link>
              <p className="text-gray-700">Soporte: <a className="text-purple-700 hover:text-purple-800" href="mailto:tastypathhelp@gmail.com">tastypathhelp@gmail.com</a></p>
            </div>
          </section>

          {/* Sesión */}
          <section className="bg-white rounded-2xl border border-purple-200 shadow-sm p-5 card-smooth reveal">
            <div className="flex items-center gap-3 mb-3">
              <IconLogout />
              <h2 className="font-semibold text-gray-900">Sesión</h2>
            </div>
            <button onClick={logout} disabled={actionLoading === "logout"} className="w-full px-4 py-3 rounded-xl bg-gray-900 text-white hover:bg-black disabled:opacity-50 tap-grow">Cerrar sesión</button>
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
