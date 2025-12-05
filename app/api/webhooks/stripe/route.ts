/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { generateSecurePassword } from "@/lib/utils/password";
import { sendWelcomeEmail } from "@/lib/email/welcome";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events (payment success)
 */
export async function POST(req: Request) {
  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Handle checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Get access request from client_reference_id
      const requestId = session.client_reference_id;
      if (!requestId) {
        console.error("No requestId in session", session.id);
        return NextResponse.json({ received: true });
      }

      const accessRequest = await prisma.accessRequest.findUnique({
        where: { id: requestId },
      });

      if (!accessRequest) {
        console.error("Access request not found:", requestId);
        return NextResponse.json({ received: true });
      }

      // Check if tenant already exists
      const existingTenant = await prisma.tenant.findUnique({
        where: { email: accessRequest.email },
      });

      if (existingTenant) {
        console.log("Tenant already exists for:", accessRequest.email);
        // Update access request status anyway
        await prisma.accessRequest.update({
          where: { id: requestId },
          data: {
            stripePaid: true,
            status: "APPROVED",
            tenantId: existingTenant.id,
          },
        });
        return NextResponse.json({ received: true });
      }

      // Extract metadata
      const metadata = session.metadata || {};
      const plan = metadata.plan || "STARTER";
      const hcsCode = metadata.hcsCode || "";
      
      // Generate temporary password
      const tempPassword = generateSecurePassword();
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      // Hash HCS code if provided
      const hcsCodeHash = hcsCode
        ? await bcrypt.hash(hcsCode, 10)
        : null;

      // Get plan quotas
      const planQuotas: Record<string, number> = {
        STARTER: 10000,
        PRO: 100000,
        BUSINESS: 500000,
        ENTERPRISE: 1000000,
      };

      const monthlyQuota = planQuotas[plan] || 10000;

      // Calculate trial end date (14 days)
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);

      // Create tenant in transaction
      const [tenant] = await prisma.$transaction([
        // Create tenant
        prisma.tenant.create({
          data: {
            email: accessRequest.email,
            fullName: accessRequest.fullName,
            company: accessRequest.company,
            passwordHash,
            hcsCodeHash,
            mustChangePassword: true,
            plan: plan as any,
            status: "TRIAL",
            monthlyQuota,
            currentUsage: 0,
            trialEndsAt,
            subscriptionStartedAt: new Date(),
            metadata: {
              useCase: accessRequest.useCase,
              estimatedVolume: accessRequest.estimatedVolume,
              source: "stripe_payment",
              accessRequestId: accessRequest.id,
              stripeSessionId: session.id,
              stripeCustomerId: typeof session.customer === 'string' ? session.customer : null,
              stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : null,
            },
          },
        }),
        // Update access request
        prisma.accessRequest.update({
          where: { id: requestId },
          data: {
            stripePaid: true,
            status: "APPROVED",
          },
        }),
        // Create audit log
        prisma.auditLog.create({
          data: {
            adminUserId: "system",
            adminEmail: "stripe-webhook@hcs-u7.tech",
            action: "TENANT_CREATED_FROM_PAYMENT",
            entityType: "Tenant",
            entityId: requestId,
            changes: {
              email: accessRequest.email,
              plan,
              stripeSessionId: session.id,
              stripeCustomerId: typeof session.customer === 'string' ? session.customer : null,
            },
            ipAddress: req.headers.get("x-forwarded-for") || "stripe",
            userAgent: req.headers.get("user-agent") || "Stripe Webhook",
          },
        }),
      ]);

      // Update access request with correct tenant ID and status  
      await prisma.accessRequest.update({
        where: { id: requestId },
        data: {
          tenantId: tenant.id,
          status: "APPROVED",
        },
      });

      // Send welcome email
      try {
        await sendWelcomeEmail({
          to: tenant.email,
          fullName: tenant.fullName,
          company: tenant.company,
          dashboardUrl: "https://hcs-u7.online",
          login: tenant.email,
          password: tempPassword,
          hasHcsCode: !!hcsCodeHash,
          trialDays: 14,
          plan: plan as any,
          monthlyQuota,
        });
        console.log("Welcome email sent to:", tenant.email);
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Don't fail - tenant is created
      }

      console.log("Tenant created successfully:", tenant.id);
    }

    // Handle subscription cancellation
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      // Find tenant by Stripe customer ID
      const tenant = await prisma.tenant.findFirst({
        where: {
          metadata: {
            path: ["stripeCustomerId"],
            equals: customerId,
          },
        },
      });

      if (tenant) {
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            status: "CANCELLED",
            updatedAt: new Date(),
          },
        });
        console.log("Tenant subscription cancelled:", tenant.id);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler error" },
      { status: 500 }
    );
  }
}
