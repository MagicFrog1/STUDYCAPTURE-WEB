import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Initialize Stripe only when needed
let stripe: Stripe;
let webhookSecret: string;

function getStripe() {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error("STRIPE_SECRET_KEY not configured");
    stripe = new Stripe(secretKey);
  }
  return stripe;
}

function getWebhookSecret() {
  if (!webhookSecret) {
    webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET not configured");
  }
  return webhookSecret;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature")!;

    let event: Stripe.Event;
    try {
      const stripe = getStripe();
      const webhookSecret = getWebhookSecret();
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
  
  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
  await handleSubscriptionChange(subscription);

  // Guardar el customer_id en profiles si viene en metadata del checkout
  try {
    const { supabase } = await import("@/lib/supabaseClient");
    const customerId = subscription.customer as string;
    const userId = (session.metadata as any)?.supabase_user_id;
    if (userId && customerId) {
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
    }
  } catch {}
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  // Import Supabase only when needed
  const { supabase } = await import("@/lib/supabaseClient");
  
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

  // Actualizar el campo is_premium en la tabla profiles
  const isActive = subscription.status === 'active';
  
  const { error } = await supabase
    .from("profiles")
    .update({ 
      is_premium: isActive,
      updated_at: new Date().toISOString()
    })
    .eq("id", user.id);

  if (error) {
    console.error("Error updating premium status:", error);
  } else {
    console.log(`Premium status updated to ${isActive} for user ${user.id}`);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Import Supabase only when needed
  const { supabase } = await import("@/lib/supabaseClient");
  
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

  // Actualizar el campo is_premium a false
  const { error } = await supabase
    .from("profiles")
    .update({ 
      is_premium: false,
      updated_at: new Date().toISOString()
    })
    .eq("id", user.id);

  if (error) {
    console.error("Error canceling premium status:", error);
  } else {
    console.log(`Premium status canceled for user ${user.id}`);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const invoiceData = invoice as Stripe.Invoice & { subscription?: string };
  if (!invoiceData.subscription) return;
  
  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(invoiceData.subscription);
  await handleSubscriptionChange(subscription);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const invoiceData = invoice as Stripe.Invoice & { subscription?: string };
  if (!invoiceData.subscription) return;
  
  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(invoiceData.subscription);
  await handleSubscriptionChange(subscription);
}
