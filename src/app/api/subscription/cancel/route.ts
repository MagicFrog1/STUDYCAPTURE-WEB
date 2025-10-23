import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    if (!process.env.STRIPE_SECRET_KEY) return new NextResponse("Stripe no configurado", { status: 500 });

    // Autenticación por token (requerido)
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
    const { data: userRes } = token ? await supabase.auth.getUser(token) : { data: null } as any;
    if (!userRes?.user) return new NextResponse("Usuario no autenticado", { status: 401 });

    // Recuperar el subscriptionId desde Stripe a partir del stripe_customer_id del perfil
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("user_id", userRes.user.id)
      .single();
    if (!profile?.stripe_customer_id) return new NextResponse("Cliente no encontrado", { status: 400 });

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const subs = await stripe.subscriptions.list({ customer: profile.stripe_customer_id, status: "active", limit: 1 });
    const subscriptionId = subs.data[0]?.id;
    if (!subscriptionId) return new NextResponse("Suscripción activa no encontrada", { status: 400 });

    // Cancelar la suscripción en Stripe
    await stripe.subscriptions.cancel(subscriptionId);

    // Actualizar el estado en Supabase
    await supabase
      .from('subscriptions')
      .update({ status: 'canceled' })
      .eq('stripe_subscription_id', subscriptionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error canceling subscription:", error);
    const message = error instanceof Error ? error.message : "Error cancelando suscripción";
    return new NextResponse(message, { status: 500 });
  }
}
