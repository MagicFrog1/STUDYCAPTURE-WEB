import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Crear cliente de Supabase que puede leer cookies
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('sb-access-token')?.value || 
                       cookieStore.get('sb-uhruxfhexzthuvpreahi-auth-token')?.value;
    
    // Intentar obtener usuario desde el header Authorization o cookies
    let userId: string | null = null;
    let isPremium = false;
    
    // Opción 1: Desde header Authorization
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }
    
    // Opción 2: Desde cookies (para peticiones desde el navegador)
    if (!userId && authCookie) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      try {
        const { data: { user } } = await supabase.auth.getUser(authCookie);
        userId = user?.id || null;
      } catch {}
    }
    
    // Si tenemos userId, verificar estado premium
    if (userId) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_premium')
        .eq('user_id', userId)
        .maybeSingle();
      
      isPremium = profile?.is_premium || false;
    }
    
    const isLoggedIn = Boolean(userId);
    const remainingUses = isPremium ? -1 : 2;
    
    return NextResponse.json({ 
      remaining: remainingUses,
      max: 2,
      isLoggedIn,
      hasActiveSubscription: isPremium
    });
  } catch (error) {
    console.error("Error getting quota:", error);
    return NextResponse.json({ 
      remaining: 2, 
      max: 2, 
      isLoggedIn: false, 
      hasActiveSubscription: false 
    });
  }
}


