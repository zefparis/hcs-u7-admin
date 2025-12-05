/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY is not defined - Stripe features will be disabled');
}

export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-11-17.clover',
      typescript: true,
    })
  : null;

// Plans disponibles avec Price IDs Stripe
// Fonction pour obtenir les plans au runtime (pas au build time)
export function getStripePlans() {
  return {
    STARTER: {
      name: 'Starter',
      priceId: process.env.STRIPE_PRICE_STARTER || '',
      price: 49, // 49€
      currency: 'eur',
      quota: 10000,
      description: '10,000 requests/month',
    },
    PRO: {
      name: 'Pro',
      priceId: process.env.STRIPE_PRICE_PRO || '',
      price: 149, // 149€
      currency: 'eur',
      quota: 100000,
      description: '100,000 requests/month',
    },
  };
}

export type StripePlan = 'STARTER' | 'PRO';
