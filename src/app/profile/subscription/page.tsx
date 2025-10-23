"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

interface Profile {
  id: string;
  is_premium: boolean;
  updated_at: string;
}

export default function SubscriptionManagement() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, is_premium, updated_at')
        .eq('user_id', session.user.id)
        .single();

      if (data && !error) {
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!profile?.is_premium || !confirm('¿Estás seguro de que quieres cancelar tu suscripción?')) {
      return;
    }

    setActionLoading('cancel');
    try {
      // Por simplicidad, solo actualizamos el campo is_premium a false
      // En un sistema real, esto debería cancelar la suscripción en Stripe
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { error } = await supabase
          .from('profiles')
          .update({ is_premium: false })
          .eq('user_id', session.user.id);

        if (error) {
          alert(`Error: ${error.message}`);
        } else {
          alert('Suscripción cancelada exitosamente');
          fetchProfile(); // Refresh data
        }
      }
    } catch (error) {
      console.error("Error canceling subscription:", error);
      alert('Error al cancelar la suscripción');
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangePlan = async (newPlan: 'monthly' | 'yearly') => {
    if (!profile?.is_premium) return;

    setActionLoading('change');
    try {
      // Por simplicidad, redirigimos a la página de checkout
      // En un sistema real, esto debería cambiar el plan en Stripe
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: newPlan }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        const error = await response.text();
        alert(`Error: ${error}`);
      }
    } catch (error) {
      console.error("Error changing plan:", error);
      alert('Error al cambiar el plan');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información de suscripción...</p>
        </div>
      </div>
    );
  }

  if (!profile?.is_premium) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No tienes suscripción activa</h2>
          <p className="text-gray-600 mb-6">Suscríbete para acceder a todas las funciones premium.</p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ver Planes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 text-white">
            <h1 className="text-2xl font-bold mb-2">Gestión de Suscripción</h1>
            <p className="text-blue-100">Administra tu plan y pagos</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Estado de la suscripción */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Estado Actual</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Plan:</span>
                  <p className="font-medium text-green-600">Premium</p>
                </div>
                <div>
                  <span className="text-gray-600">Estado:</span>
                  <p className="font-medium text-green-600">Activo</p>
                </div>
                <div>
                  <span className="text-gray-600">Próximo pago:</span>
                  <p className="font-medium">-</p>
                </div>
                <div>
                  <span className="text-gray-600">Precio:</span>
                  <p className="font-medium">Premium</p>
                </div>
              </div>
            </div>

            {/* Cambiar plan */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Cambiar Plan</h3>
              <div className="space-y-3">
                {true && (
                  <button
                    onClick={() => handleChangePlan('monthly')}
                    disabled={actionLoading === 'change'}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {actionLoading === 'change' ? 'Procesando...' : 'Cambiar a Plan Mensual (4,99€/mes)'}
                  </button>
                )}
                {true && (
                  <button
                    onClick={() => handleChangePlan('yearly')}
                    disabled={actionLoading === 'change'}
                    className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {actionLoading === 'change' ? 'Procesando...' : 'Cambiar a Plan Anual (39,99€/año)'}
                  </button>
                )}
              </div>
            </div>

            {/* Cancelar suscripción */}
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <h3 className="font-semibold text-red-900 mb-3">Zona de Peligro</h3>
              <p className="text-red-700 text-sm mb-4">
                Al cancelar tu suscripción, perderás acceso a las funciones premium al final del período de facturación actual.
              </p>
              <button
                onClick={handleCancelSubscription}
                disabled={actionLoading === 'cancel'}
                className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading === 'cancel' ? 'Cancelando...' : 'Cancelar Suscripción'}
              </button>
            </div>

            {/* Botón de volver */}
            <div className="pt-4">
              <button
                onClick={() => router.push('/')}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Volver al Inicio
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
