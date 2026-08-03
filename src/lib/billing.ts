import Stripe from "stripe";

/**
 * Founding-season billing. The promise everywhere (kit letter, emails, kit page) is "nothing
 * billed until kickoff, Sept 9" — so there is deliberately NO charge, subscription, or scheduled
 * payment in this codebase. A buyer either saves a card (Stripe Checkout in setup mode) or asks
 * for an AP invoice. On Sept 9 Ankur charges the saved cards from the Stripe dashboard by hand.
 * With a handful of founding customers, manual charging is a feature: no way to bill early.
 */

export const FOUNDING_TIERS: Record<
  string,
  { label: string; sizeLabel: string; foundingCents: number; standardCents: number }
> = {
  starter: { label: "Starter", sizeLabel: "Up to 50 people", foundingCents: 40000, standardCents: 75000 },
  team: { label: "Team", sizeLabel: "Up to 150 people", foundingCents: 90000, standardCents: 180000 },
  company: { label: "Company", sizeLabel: "Up to 400 people", foundingCents: 190000, standardCents: 390000 },
  large: { label: "Large", sizeLabel: "Up to 1,000 people", foundingCents: 375000, standardCents: 750000 },
};

export const dollars = (cents: number) => `$${(cents / 100).toLocaleString("en-US")}`;

/** Null when the key isn't set — routes answer 503 instead of crashing at import time. */
export function stripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}
