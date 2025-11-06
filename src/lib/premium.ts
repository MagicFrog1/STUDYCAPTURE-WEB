import { supabase } from "./supabaseClient";

// Función para verificar si el usuario es premium
export async function isPremium(userId: string): Promise<boolean> {
  try {
    // Verificar en la tabla profiles si el usuario tiene is_premium = true
    const { data, error } = await supabase
      .from("profiles")
      .select("is_premium")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      console.error("Error checking premium status:", error);
      return false;
    }

    return data.is_premium === true;
  } catch (error) {
    console.error("Exception checking premium status:", error);
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
