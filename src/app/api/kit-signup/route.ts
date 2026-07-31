import { NextRequest, NextResponse } from "next/server";
import { track } from "@/lib/track";
import { sendSms } from "@/lib/sms";

/**
 * Founding-order signup from the kit page's "start your league" door.
 *
 * Deliberately not a payment: the offer is sign today, nothing charged until Sept 9, billing
 * confirmed at onboarding (card link or AP invoice). So an "order" here is the buyer's details +
 * tier + accepted founding terms, recorded as an event and texted to the founder so follow-up
 * happens in minutes, not at the next dashboard check.
 */

const OWNER_PHONE = process.env.OWNER_PHONE || "+17179035334";

const TIERS: Record<string, string> = {
  starter: "Starter (≤50) — $400/season",
  team: "Team (≤150) — $900/season",
  company: "Company (≤400) — $1,900/season",
  large: "Large (≤1,000) — $3,750/season",
};

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: "Bad request." }, { status: 400 });

  const name = String(b.name || "").trim();
  const email = String(b.email || "").trim();
  const phone = String(b.phone || "").trim();
  const tier = String(b.tier || "").trim();
  const slug = String(b.slug || "").trim();
  const company = String(b.company || "").trim();

  if (!name) return NextResponse.json({ error: "Add your name." }, { status: 400 });
  if (!email && !phone) return NextResponse.json({ error: "Add an email or a phone number so we can confirm your setup." }, { status: 400 });
  if (!TIERS[tier]) return NextResponse.json({ error: "Pick your company size." }, { status: 400 });
  if (b.terms !== true) return NextResponse.json({ error: "Please accept the founding terms." }, { status: 400 });

  track({
    type: "kit_signup",
    channel: "web",
    meta: { slug, company, name, email, phone, tier },
  });

  // Fire-and-forget: the order is recorded either way; the text is just speed.
  sendSms(
    OWNER_PHONE,
    `🏈 FOUNDING ORDER: ${company || slug} — ${name} (${TIERS[tier]}). ${email || ""} ${phone || ""} Reply fast.`,
  ).catch(() => {});

  return NextResponse.json({ ok: true });
}
