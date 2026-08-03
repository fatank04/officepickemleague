import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { track } from "@/lib/track";
import { sendSms } from "@/lib/sms";
import { dollars, stripeClient } from "@/lib/billing";

/**
 * Stripe webhook. One event matters: checkout.session.completed for a setup-mode session — a
 * buyer finished saving a card for kickoff. We pin the card as the customer's default payment
 * method (so the Sept 9 dashboard charge is two clicks) and mark the order card_on_file.
 *
 * Endpoint to register in the Stripe dashboard: POST /api/stripe/webhook, event
 * checkout.session.completed. STRIPE_WEBHOOK_SECRET is that endpoint's signing secret.
 */

const OWNER_PHONE = process.env.OWNER_PHONE || "+17179035334";

export async function POST(req: NextRequest) {
  const stripe = stripeClient();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return NextResponse.json({ error: "Stripe not configured." }, { status: 503 });

  const sig = req.headers.get("stripe-signature") || "";
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    console.error("[stripe] bad signature", String(err));
    return NextResponse.json({ error: "Bad signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.mode === "setup" && session.setup_intent) {
      const si = await stripe.setupIntents.retrieve(String(session.setup_intent));
      const customerId = String(session.customer || si.customer || "");
      const pm = String(si.payment_method || "");
      if (customerId && pm) {
        await stripe.customers
          .update(customerId, { invoice_settings: { default_payment_method: pm } })
          .catch((err) => console.error("[stripe] default pm", String(err)));
      }
      const orderId = session.metadata?.orderId;
      if (orderId) {
        const order = await prisma.order
          .update({ where: { id: orderId }, data: { status: "card_on_file" } })
          .catch(() => null);
        if (order) {
          track({
            type: "card_saved", channel: "web",
            meta: { orderId, company: order.company, tier: order.tier, kitSlug: order.kitSlug, src: order.src },
          });
          sendSms(
            OWNER_PHONE,
            `💳 CARD ON FILE: ${order.company} — ${order.name}, ${dollars(order.amountCents)} at kickoff. ${order.email}`,
          ).catch(() => {});
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
