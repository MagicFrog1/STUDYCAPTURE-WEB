import { NextResponse } from "next/server";
import { getUserSubscriptionStatus } from "@/lib/quota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = await getUserSubscriptionStatus();
    const max = 2;
    
    return NextResponse.json({ 
      remaining: status.remainingUses,
      max,
      isLoggedIn: status.isLoggedIn,
      hasActiveSubscription: status.hasActiveSubscription
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


