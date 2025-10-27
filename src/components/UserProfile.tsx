"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email?: string;
}

interface Profile {
  id: string;
  is_premium: boolean;
  updated_at: string;
}

export default function UserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<"change" | "cancel" | "logout" | "" >("");
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      }
    } catch (error) {
      console.error("Error checking user:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, is_premium, updated_at')
        .eq('user_id', userId)
        .single();

      if (data && !error) {
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleLogout = async () => {
    try {
      setActionLoading("logout");
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      router.push('/');
    } catch (error) {
      console.error("Error logging out:", error);
    } finally {
      setActionLoading("");
    }
  };

  const changePlan = async (newPlan: 'monthly' | 'yearly') => {
    try {
      setActionLoading("change");
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/subscription/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ newPlan })
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      if (json?.url) window.location.href = json.url;
    } catch (e) {
      alert((e as Error).message || 'Error al cambiar de plan');
    } finally {
      setActionLoading("");
    }
  };

  const cancelSubscription = async () => {
    try {
      if (!confirm('¿Seguro que deseas cancelar tu suscripción?')) return;
      setActionLoading("cancel");
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      if (!res.ok) throw new Error(await res.text());
      alert('Suscripción cancelada. Mantendrás acceso hasta fin de período.');
      setIsAccountOpen(false);
      router.refresh();
    } catch (e) {
      alert((e as Error).message || 'Error al cancelar la suscripción');
    } finally {
      setActionLoading("");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        <span>Cargando...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <button
        onClick={() => router.push('/login')}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Iniciar Sesión
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsAccountOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
          {user.email?.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm text-gray-700 hidden sm:block">
          Mi cuenta
        </span>
      </button>

      {isAccountOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-50"
            onClick={() => setIsAccountOpen(false)}
          />
          <aside className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl z-50 border-l border-gray-200 flex flex-col">
            <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{user.email}</p>
                  {profile?.is_premium ? (
                    <p className="text-xs text-green-600">Premium activo</p>
                  ) : (
                    <p className="text-xs text-gray-500">Plan gratuito</p>
                  )}
                </div>
              </div>
              <button
                className="p-2 rounded-md hover:bg-gray-100"
                onClick={() => setIsAccountOpen(false)}
                aria-label="Cerrar"
              >
                <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-auto">
              <div className="bg-gray-50 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Acciones de suscripción</h3>
                {profile?.is_premium ? (
                  <div className="space-y-2">
                    <button
                      onClick={() => changePlan('monthly')}
                      disabled={actionLoading === 'change'}
                      className="w-full px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      Cambiar a mensual (4,99€/mes)
                    </button>
                    <button
                      onClick={() => changePlan('yearly')}
                      disabled={actionLoading === 'change'}
                      className="w-full px-3 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                    >
                      Cambiar a anual (39,99€/año)
                    </button>
                    <button
                      onClick={cancelSubscription}
                      disabled={actionLoading === 'cancel'}
                      className="w-full px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      Cancelar suscripción
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-700">Plan gratuito. Suscríbete desde la portada o Generar.</p>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Privacidad</h3>
                <button
                  onClick={() => { router.push('/privacy'); setIsAccountOpen(false); }}
                  className="w-full px-3 py-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-100"
                >
                  Ver política de privacidad
                </button>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleLogout}
                  disabled={actionLoading === 'logout'}
                  className="w-full px-3 py-2 rounded-md bg-gray-800 text-white hover:bg-black disabled:opacity-50"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
