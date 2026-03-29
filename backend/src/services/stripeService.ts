import Stripe from 'stripe';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

let stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripe) {
    if (!env.stripe.secretKey) throw new AppError('Stripe not configured', 500);
    stripe = new Stripe(env.stripe.secretKey, { apiVersion: '2023-10-16' });
  }
  return stripe;
}

export async function createPaymentIntent(
  amountCents: number,
  currency = 'usd',
  metadata: Record<string, string> = {},
): Promise<Stripe.PaymentIntent> {
  return getStripe().paymentIntents.create({
    amount: amountCents,
    currency,
    metadata,
    automatic_payment_methods: { enabled: true },
  });
}

export async function confirmPaymentIntent(
  paymentIntentId: string,
): Promise<Stripe.PaymentIntent> {
  return getStripe().paymentIntents.retrieve(paymentIntentId);
}

export function constructWebhookEvent(
  payload: Buffer,
  signature: string,
): Stripe.Event {
  if (!env.stripe.webhookSecret) throw new AppError('Stripe webhook not configured', 500);
  return getStripe().webhooks.constructEvent(payload, signature, env.stripe.webhookSecret);
}

export async function createRefund(
  paymentIntentId: string,
  amountCents?: number,
): Promise<Stripe.Refund> {
  return getStripe().refunds.create({
    payment_intent: paymentIntentId,
    ...(amountCents && { amount: amountCents }),
  });
}
