/**
 * Debug endpoint to check Stripe configuration
 */

import { NextResponse } from "next/server";
import { getStripePlans, stripe } from "@/lib/stripe";

export async function GET() {
  const plans = getStripePlans();
  
  return NextResponse.json({
    stripeConfigured: !!stripe,
    secretKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 20) + "...",
    priceStarter: process.env.STRIPE_PRICE_STARTER,
    pricePro: process.env.STRIPE_PRICE_PRO,
    plans: {
      STARTER: { priceId: plans.STARTER.priceId },
      PRO: { priceId: plans.PRO.priceId },
    },
    webhookSecretConfigured: !!process.env.STRIPE_WEBHOOK_SECRET,
  });
}
