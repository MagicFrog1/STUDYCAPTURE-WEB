import { cookies } from "next/headers";
import { supabase } from "./supabaseClient";

const COOKIE_KEY = "studycaptures-uses";
const MAX_FREE = 2;

// Función para obtener el usuario actual desde Supabase
async function getCurrentUser() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user || null;
  } catch {
    return null;
  }
}

// Función para verificar si el usuario tiene suscripción activa
async function hasActiveSubscription(userId: string): Promise<boolean> {
  try {
    // Verificar en la tabla profiles si tiene is_premium = true
    const { data, error } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error || !data) {
      console.error('Error checking subscription:', error);
      return false;
    }
    
    return data.is_premium === true;
  } catch (err) {
    console.error('Exception checking subscription:', err);
    return false;
  }
}

function buildKey(userId?: string | null): string {
  return userId ? `${COOKIE_KEY}-${userId}` : COOKIE_KEY;
}

export async function getUsesFromCookie(userId?: string | null): Promise<number> {
  const store = await cookies();
  const c = store.get(buildKey(userId))?.value;
  const n = c ? Number(c) : 0;
  return Number.isFinite(n) ? n : 0;
}

export async function incrementUsesCookie(userId?: string | null): Promise<void> {
  const store = await cookies();
  const current = await getUsesFromCookie(userId);
  const next = current + 1;
  store.set(buildKey(userId), String(next), {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 año
    secure: process.env.NODE_ENV === "production",
  });
}

export async function hasFreeQuota(userId?: string | null): Promise<boolean> {
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev) return true; // En desarrollo, siempre permitir
  
  // Verificar si el usuario está logueado
  const user = userId ? { id: userId } : await getCurrentUser();
  if (user) {
    // Si está logueado, verificar suscripción activa
    const hasSubscription = await hasActiveSubscription(user.id);
    if (hasSubscription) return true; // Usuario suscrito tiene acceso ilimitado
  }
  
  // Si no está logueado o no tiene suscripción, verificar límite gratuito
  return (await getUsesFromCookie(user?.id ?? userId)) < MAX_FREE;
}

export async function remainingFreeQuota(userId?: string | null): Promise<number> {
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev) return 2; // En desarrollo, siempre mostrar 2
  
  // Verificar si el usuario está logueado
  const user = userId ? { id: userId } : await getCurrentUser();
  if (user) {
    // Si está logueado, verificar suscripción activa
    const hasSubscription = await hasActiveSubscription(user.id);
    if (hasSubscription) return -1; // -1 indica acceso ilimitado
  }
  
  // Si no está logueado o no tiene suscripción, calcular usos restantes
  return Math.max(0, MAX_FREE - (await getUsesFromCookie(user?.id ?? userId)));
}

export async function getUserSubscriptionStatus(): Promise<{
  isLoggedIn: boolean;
  hasActiveSubscription: boolean;
  remainingUses: number;
}> {
  const isDev = process.env.NODE_ENV !== "production";
  const user = await getCurrentUser();
  
  if (!user) {
    return {
      isLoggedIn: false,
      hasActiveSubscription: false,
      remainingUses: isDev ? 2 : Math.max(0, MAX_FREE - (await getUsesFromCookie()))
    };
  }
  
  const hasSubscription = await hasActiveSubscription(user.id);
  return {
    isLoggedIn: true,
    hasActiveSubscription: hasSubscription,
    remainingUses: hasSubscription ? -1 : Math.max(0, MAX_FREE - (await getUsesFromCookie()))
  };
}