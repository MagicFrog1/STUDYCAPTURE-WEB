import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return new NextResponse("Stripe no configurado", { status: 500 });
    }

    const { subscriptionId } = await req.json();
    if (!subscriptionId) {
      return new NextResponse("ID de suscripción requerido", { status: 400 });
    }

    // Obtener el usuario actual
    const { data: { session: authSession } } = await supabase.auth.getSession();
    if (!authSession?.user) {
      return new NextResponse("Usuario no autenticado", { status: 401 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
