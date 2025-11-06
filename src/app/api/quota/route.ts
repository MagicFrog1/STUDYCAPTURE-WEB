import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Crear cliente de Supabase para servidor que maneja cookies automáticamente
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    
    // Obtener sesión del usuario
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      console.log('No session found:', sessionError);
      return NextResponse.json({ 
        remaining: 2, 
        max: 2, 
        isLoggedIn: false, 
        hasActiveSubscription: false 
      });
    }
    
    const userId = session.user.id;
    
    // Verificar estado premium
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (profileError) {
      console.error('Error fetching profile:', profileError);
    }
    
    const isPremium = profile?.is_premium || false;
    const remainingUses = isPremium ? -1 : 2;
    
    console.log('Quota check:', { userId, isPremium, remainingUses });
    
    return NextResponse.json({ 
      remaining: remainingUses,
      max: 2,
      isLoggedIn: true,
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


