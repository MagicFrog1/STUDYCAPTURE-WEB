import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Product IDs
const MONTHLY_PRODUCT_ID = process.env.STRIPE_PRODUCT_MONTHLY ?? "prod_TI4RSiWSI0DT4R";
const YEARLY_PRODUCT_ID = process.env.STRIPE_PRODUCT_YEARLY ?? "prod_TI4RRTZhyhpklk";
const MONTHLY_UNIT_AMOUNT = Number(process.env.STRIPE_MONTHLY_UNIT_AMOUNT_CENTS ?? "499");
const YEARLY_UNIT_AMOUNT = Number(process.env.STRIPE_YEARLY_UNIT_AMOUNT_CENTS ?? "3999");
const CURRENCY = (process.env.STRIPE_CURRENCY ?? "eur").toLowerCase();

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return new NextResponse("Stripe no configurado", { status: 500 });
    }

    const { subscriptionId, newPlan } = await req.json();
    if (!subscriptionId || !newPlan) {
      return new NextResponse("ID de suscripción y nuevo plan requeridos", { status: 400 });
    }

    if (newPlan !== 'monthly' && newPlan !== 'yearly') {
      return new NextResponse("Plan inválido", { status: 400 });
    }

    // Obtener el usuario actual
    const { data: { session: authSession } } = await supabase.auth.getSession();
    if (!authSession?.user) {
      return new NextResponse("Usuario no autenticado", { status: 401 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Obtener la suscripción actual
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    // Crear nueva sesión de checkout para cambiar el plan
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: subscription.customer as string,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: CURRENCY,
            product: newPlan === 'monthly' ? MONTHLY_PRODUCT_ID : YEARLY_PRODUCT_ID,
            recurring: { interval: newPlan === 'monthly' ? "month" : "year" },
            unit_amount: newPlan === 'monthly' ? MONTHLY_UNIT_AMOUNT : YEARLY_UNIT_AMOUNT,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/profile/subscription?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/profile/subscription`,
      subscription_data: {
        metadata: {
          change_from: subscriptionId,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error changing subscription:", error);
    const message = error instanceof Error ? error.message : "Error cambiando suscripción";
    return new NextResponse(message, { status: 500 });
  }
}
