import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature")!;

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new NextResponse("Invalid signature", { status: 400 });
    }

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;
      
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return new NextResponse("Webhook error", { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== "subscription") return;
  
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
  await handleSubscriptionChange(subscription);
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  // Buscar el usuario por customer_id en Supabase
  const { data: user } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();
  
  if (!user) {
    console.error("User not found for customer:", customerId);
    return;
  }

  // Determinar el tipo de plan basado en el precio
  const priceId = subscription.items.data[0]?.price.id;
  const planType = priceId?.includes('monthly') ? 'monthly' : 'yearly';

  // Añade esta línea para forzar que TypeScript reconozca la estructura de suscripción
  const subscriptionData = subscription as Stripe.Subscription & {
    current_period_start: number;
    current_period_end: number;
  };

  // Insertar o actualizar la suscripción
  const { error } = await supabase
    .from("subscriptions")
    .upsert({
      user_id: user.id,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      plan_type: planType,
      current_period_start: new Date(subscriptionData.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscriptionData.current_period_end * 1000).toISOString(),
    });

  if (error) {
    console.error("Error updating subscription:", error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { error } = await supabase
    .from("subscriptions")
    .update({ status: "canceled" })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    console.error("Error canceling subscription:", error);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const invoiceData = invoice as Stripe.Invoice & { subscription?: string };
  if (!invoiceData.subscription) return;
  
  const subscription = await stripe.subscriptions.retrieve(invoiceData.subscription);
  await handleSubscriptionChange(subscription);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const invoiceData = invoice as Stripe.Invoice & { subscription?: string };
  if (!invoiceData.subscription) return;
  
  const subscription = await stripe.subscriptions.retrieve(invoiceData.subscription);
  await handleSubscriptionChange(subscription);
}
