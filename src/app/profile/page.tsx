"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Profile = { id: string; is_premium: boolean; stripe_customer_id?: string | null; updated_at?: string | null };

export default function ProfilePage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<"change" | "cancel" | "" | "logout">("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/login");
        return;
      }
      setEmail(data.session.user.email ?? null);
      const { data: prof } = await supabase
        .from("profiles")
        .select("id, is_premium, stripe_customer_id, updated_at")
        .eq("user_id", data.session.user.id)
        .single();
      setProfile(prof ?? null);
      setLoading(false);
    })();
  }, [router]);

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
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Cargando…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
          <h1 className="text-2xl font-bold mb-1">Tu cuenta</h1>
          <p className="text-gray-600 mb-6">Gestiona tu plan, privacidad y sesión.</p>

          <div className="grid sm:grid-cols-2 gap-6">
            <section className="bg-gray-50 rounded-xl p-4">
              <h2 className="font-semibold text-gray-900 mb-2">Estado</h2>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium mb-3">{email}</p>
              <p className="text-sm text-gray-600">Plan</p>
              <p className={`font-medium ${profile?.is_premium ? "text-green-600" : "text-gray-800"}`}>
                {profile?.is_premium ? "Premium (sin límites)" : "Gratis (2 usos)"}
              </p>
            </section>

            <section className="bg-gray-50 rounded-xl p-4">
              <h2 className="font-semibold text-gray-900 mb-2">Acciones</h2>
              {profile?.is_premium ? (
                <div className="space-y-2">
                  <button onClick={() => changePlan("monthly")} disabled={actionLoading === "change"} className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">Cambiar a mensual (4,99€/mes)</button>
                  <button onClick={() => changePlan("yearly")} disabled={actionLoading === "change"} className="w-full px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50">Cambiar a anual (39,99€/año)</button>
                  <button onClick={cancelSubscription} disabled={actionLoading === "cancel"} className="w-full px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">Cancelar suscripción</button>
                </div>
              ) : (
                <div className="text-sm text-gray-700">Actualmente estás en el plan gratuito. Suscríbete desde la portada o desde Generar.</div>
              )}
            </section>

            <section className="bg-gray-50 rounded-xl p-4">
              <h2 className="font-semibold text-gray-900 mb-2">Privacidad y soporte</h2>
              <div className="space-y-2 text-sm">
                <Link href="/privacy" className="text-blue-600 hover:underline">Política de privacidad</Link>
                <p className="text-gray-700">Soporte: <a className="text-blue-600 hover:underline" href="mailto:tastypathhelp@gmail.com">tastypathhelp@gmail.com</a></p>
              </div>
            </section>

            <section className="bg-gray-50 rounded-xl p-4">
              <h2 className="font-semibold text-gray-900 mb-2">Sesión</h2>
              <button onClick={logout} disabled={actionLoading === "logout"} className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-black disabled:opacity-50">Cerrar sesión</button>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}


