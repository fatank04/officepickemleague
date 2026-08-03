import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { track } from "@/lib/track";
import { sendSms } from "@/lib/sms";
import { FOUNDING_TIERS, dollars, stripeClient } from "@/lib/billing";

/**
 * Turns a founding order into billing intent — the step after (or instead of) the kit page's
 * no-card signup.
 *
 *   method "card"    → Stripe Checkout in SETUP mode: saves the card to a Customer, charges $0.
 *                      Returns { url } to redirect to. The webhook marks the order card_on_file.
 *   method "invoice" → records the order and texts Ankur to send an AP invoice. No Stripe at all.
 *
 * Either way nothing is charged today; see lib/billing.ts for why that's manual on Sept 9.
 */

const OWNER_PHONE = process.env.OWNER_PHONE || "+17179035334";

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: "Bad request." }, { status: 400 });

  const name = String(b.name || "").trim();
  const email = String(b.email || "").trim();
  const phone = String(b.phone || "").trim();
  const company = String(b.company || "").trim();
  const tier = String(b.tier || "").trim();
  const method = b.method === "invoice" ? "invoice" : "card";
  const kitSlug = String(b.kitSlug || "").trim().toLowerCase() || null;
  const src = String(b.src || "").slice(0, 16) || null;

  const t = FOUNDING_TIERS[tier];
  if (!name) return NextResponse.json({ error: "Add your name." }, { status: 400 });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return NextResponse.json({ error: "Add a work email — billing confirmations go there." }, { status: 400 });
  if (!company) return NextResponse.json({ error: "Add your company name." }, { status: 400 });
  if (!t) return NextResponse.json({ error: "Pick your company size." }, { status: 400 });
  if (b.terms !== true) return NextResponse.json({ error: "Please accept the founding terms." }, { status: 400 });

  const order = await prisma.order.create({
    data: {
      company, kitSlug, name, email, phone: phone || null, tier,
      amountCents: t.foundingCents, method, src,
      status: method === "invoice" ? "invoice_requested" : "open",
    },
  });

  if (method === "invoice") {
    track({ type: "invoice_requested", channel: "web", meta: { orderId: order.id, company, tier, kitSlug, src } });
    sendSms(
      OWNER_PHONE,
      `🧾 INVOICE REQUEST: ${company} — ${name}, ${t.label} ${dollars(t.foundingCents)}. ${email} ${phone}`.trim(),
    ).catch(() => {});
    return NextResponse.json({ ok: true, invoice: true });
  }

  const stripe = stripeClient();
  if (!stripe)
    return NextResponse.json(
      { error: "Card saving isn't live yet — pick the invoice option or reply to any email from Ankur." },
      { status: 503 },
    );

  const base = process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin;
  try {
    const customer = await stripe.customers.create({
      name: company,
      email,
      metadata: { orderId: order.id, contact: name, tier, kitSlug: kitSlug || "", phone },
    });
    const session = await stripe.checkout.sessions.create({
      mode: "setup",
      customer: customer.id,
      payment_method_types: ["card"],
      success_url: `${base}/start/done?order=${order.id}`,
      cancel_url: `${base}/start?kit=${kitSlug || ""}&canceled=1`,
      metadata: { orderId: order.id, company, tier },
    });
    await prisma.order.update({
      where: { id: order.id },
      data: { stripeCustomerId: customer.id, stripeSessionId: session.id },
    });
    track({ type: "checkout_started", channel: "web", meta: { orderId: order.id, company, tier, kitSlug, src } });
    return NextResponse.json({ ok: true, url: session.url });
  } catch (err) {
    console.error("[checkout] stripe error", String(err));
    return NextResponse.json(
      { error: "Couldn't open the card page. Try the invoice option — the rate is identical." },
      { status: 502 },
    );
  }
}
