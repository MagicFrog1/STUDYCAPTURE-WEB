import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Usar Product ID para el plan mensual
const MONTHLY_PRODUCT_ID = process.env.STRIPE_PRODUCT_MONTHLY ?? "prod_TI4RSiWSI0DT4R";
const MONTHLY_CURRENCY = (process.env.STRIPE_CURRENCY ?? "eur").toLowerCase();
const MONTHLY_UNIT_AMOUNT = Number(process.env.STRIPE_MONTHLY_UNIT_AMOUNT_CENTS ?? "499"); // 4,99€

// Usar Product ID para el plan anual
const YEARLY_PRODUCT_ID = process.env.STRIPE_PRODUCT_YEARLY ?? "prod_TI4RRTZhyhpklk";
const YEARLY_UNIT_AMOUNT = Number(process.env.STRIPE_YEARLY_UNIT_AMOUNT_CENTS ?? "3999"); // 39,99€

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { plan } = (await req.json()) as { plan?: "monthly" | "yearly" };
    if (!plan || (plan !== "monthly" && plan !== "yearly")) return new NextResponse("Plan inválido", { status: 400 });

    // DEBUG: Log environment variables (updated)
    console.log("=== STRIPE DEBUG UPDATED ===");
    console.log("STRIPE_SECRET_KEY exists:", !!process.env.STRIPE_SECRET_KEY);
    console.log("STRIPE_SECRET_KEY length:", process.env.STRIPE_SECRET_KEY?.length || 0);
    console.log("NEXT_PUBLIC_BASE_URL:", process.env.NEXT_PUBLIC_BASE_URL);
    console.log("NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY exists:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    console.log("All STRIPE env vars:", Object.keys(process.env).filter(k => k.startsWith('STRIPE')));
    console.log("=============================");

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) return new NextResponse("Stripe no configurado", { status: 500 });

    const stripe = new Stripe(secretKey);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

    // Autenticar al usuario mediante token enviado por el cliente
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
    if (!token) {
      return new NextResponse("Usuario no autenticado", { status: 401 });
    }
    // Create authenticated Supabase client
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return new NextResponse("Supabase no configurado", { status: 500 });
    }
    
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    const { data: userRes, error: userErr } = await supabaseAuth.auth.getUser(token);
    
    if (userErr || !userRes?.user) {
      console.log("Auth error:", userErr);
      return new NextResponse("Usuario no autenticado", { status: 401 });
    }
    const authUser = userRes.user;

    // Crear customer en Stripe directamente (más simple)
    const customer = await stripe.customers.create({
      email: authUser.email!,
      metadata: {
        supabase_user_id: authUser.id,
      },
    });
    const customerId = customer.id;

    let session: Stripe.Checkout.Session;
    if (plan === "monthly") {
      // Crear la sesión usando price_data con Product ID, importe y recurrencia mensual
      session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: MONTHLY_CURRENCY,
              product: MONTHLY_PRODUCT_ID,
              recurring: { interval: "month" },
              unit_amount: MONTHLY_UNIT_AMOUNT,
            },
            quantity: 1,
          },
        ],
        success_url: `${baseUrl}/thanks`,
        cancel_url: `${baseUrl}/`,
      });
    } else {
      // Plan anual: crear sesión con price_data (Product ID + recurrencia anual)
      session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: MONTHLY_CURRENCY,
              product: YEARLY_PRODUCT_ID,
              recurring: { interval: "year" },
              unit_amount: YEARLY_UNIT_AMOUNT,
            },
            quantity: 1,
          },
        ],
        success_url: `${baseUrl}/thanks`,
        cancel_url: `${baseUrl}/`,
      });
    }
    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error creando checkout";
    return new NextResponse(message, { status: 500 });
  }
}


