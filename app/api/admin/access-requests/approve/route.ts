/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe, getStripePlans } from "@/lib/stripe";
import { sendStripePaymentEmail } from "@/lib/email/welcome";

const approveSchema = z.object({
  requestId: z.string().min(1),
  plan: z.enum(["STARTER", "PRO"]),
  notes: z.string().optional(),
});

/**
 * POST /api/admin/access-requests/approve
 * Approve an access request and send Stripe payment link
 */
export async function POST(req: Request) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // RBAC: Only SUPER_ADMIN and ADMIN can approve
    const role = (session.user as any).role;
    if (!["SUPER_ADMIN", "ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse and validate body
    const body = await req.json();
    const parsed = approveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { requestId, plan, notes } = parsed.data;

    // Get access request
    const accessRequest = await prisma.accessRequest.findUnique({
      where: { id: requestId },
    });

    if (!accessRequest) {
      return NextResponse.json(
        { error: "Access request not found" },
        { status: 404 }
      );
    }

    if (accessRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "Access request already processed" },
        { status: 400 }
      );
    }

    // Check if Stripe is configured
    if (!stripe) {
      console.error("Stripe not configured. STRIPE_SECRET_KEY:", !!process.env.STRIPE_SECRET_KEY);
      return NextResponse.json(
        { error: "Stripe is not configured", hasKey: !!process.env.STRIPE_SECRET_KEY },
        { status: 500 }
      );
    }

    // Create Stripe Checkout Session
    const STRIPE_PLANS = getStripePlans();
    const planConfig = STRIPE_PLANS[plan];
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.hcs-u7.info';

    // Vérifier que le Price ID est configuré
    if (!planConfig.priceId) {
      return NextResponse.json(
        { error: `Stripe Price ID not configured for plan ${plan}` },
        { status: 500 }
      );
    }

    const stripeSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: planConfig.priceId, // Utiliser le Price ID Stripe
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/access-requests/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/access-requests/payment-cancelled`,
      customer_email: accessRequest.email,
      client_reference_id: requestId, // Important for webhook
      metadata: {
        requestId,
        plan,
        hcsCode: accessRequest.hcsCode.substring(0, 50), // Tronquer si trop long
        fullName: accessRequest.fullName,
        company: accessRequest.company,
      },
    });

    // Update access request and create audit log
    await prisma.$transaction([
      // Update access request
      prisma.accessRequest.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
          approvedBy: (session.user as any).id,
          adminNotes: notes,
          stripeCheckoutUrl: stripeSession.url,
          stripeSessionId: stripeSession.id,
        },
      }),
      // Create audit log
      prisma.auditLog.create({
        data: {
          adminUserId: (session.user as any).id,
          adminEmail: session.user.email!,
          action: "ACCESS_REQUEST_APPROVED",
          entityType: "AccessRequest",
          entityId: requestId,
          changes: {
            plan,
            stripeSessionId: stripeSession.id,
            checkoutUrl: stripeSession.url,
          },
          ipAddress: req.headers.get("x-forwarded-for") || "unknown",
          userAgent: req.headers.get("user-agent") || "unknown",
        },
      }),
    ]);

    // Send email with payment link
    try {
      await sendStripePaymentEmail({
        to: accessRequest.email,
        fullName: accessRequest.fullName,
        company: accessRequest.company,
        plan: planConfig.name,
        price: planConfig.price, // Prix en euros
        checkoutUrl: stripeSession.url!,
      });
    } catch (emailError) {
      console.error("Failed to send payment email:", emailError);
      // Continue anyway - Stripe session is created
    }

    return NextResponse.json({
      success: true,
      checkoutUrl: stripeSession.url,
      message: "Payment link sent to prospect",
    });
  } catch (error: any) {
    console.error("Error approving access request:", error);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        message: error?.message || "Unknown error",
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}
