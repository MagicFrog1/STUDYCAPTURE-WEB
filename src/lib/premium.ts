import { supabase } from "./supabaseClient";

// Función simple para verificar si el usuario es premium
export async function isPremium(userId: string): Promise<boolean> {
  try {
    // Obtener la sesión del usuario
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;

    // Verificar si tiene suscripción activa en Stripe
    // Esto se puede hacer de varias formas:
    // 1. Verificar en la tabla subscriptions (si existe)
    // 2. Llamar directamente a Stripe API
    // 3. Usar un campo simple en la tabla profiles
    
    // Por ahora, vamos a usar un enfoque simple:
    // Si el usuario existe en Supabase, asumimos que puede ser premium
    // La verificación real se hará en el webhook de Stripe
    
    return true; // Temporalmente true para testing
  } catch {
    return false;
  }
}

// Función para verificar el límite gratuito
export async function getFreeUsage(userId: string): Promise<{ used: number; max: number }> {
  try {
    // Por ahora, usar cookies para el límite gratuito
    // Esto es más simple que usar base de datos
    const used = 0; // Se implementará con cookies
    const max = 2;
    
    return { used, max };
  } catch {
    return { used: 0, max: 2 };
  }
}
