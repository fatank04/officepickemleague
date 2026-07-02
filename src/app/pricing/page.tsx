import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: { absolute: "Pricing — Office Pick'em League" },
  description:
    "Always free for players. Employers pay one flat seasonal rate — Founding Season 2026 from $400 by company size, locked for 3 seasons, with a midseason money-back guarantee.",
  alternates: { canonical: "/pricing" },
};

const tiers = [
  { name: "Starter", size: "Up to 50 employees", founding: "$400", standard: "$750" },
  { name: "Team", size: "Up to 150 employees", founding: "$900", standard: "$1,800" },
  { name: "Company", size: "Up to 400 employees", founding: "$1,900", standard: "$3,900" },
  { name: "Large", size: "Up to 1,000 employees", founding: "$3,750", standard: "$7,500" },
  { name: "Enterprise", size: "1,000+ / multi-site", founding: "Let's talk", standard: "Custom" },
];

export default function PricingPage() {
  return (
    <div className="wrap" style={{ maxWidth: 640 }}>
      <div style={{ textAlign: "center", margin: "30px 0 6px" }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Simple, flat pricing.</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          One seasonal rate by company size. No per-head math, no metering, no penalty for folks who don&apos;t play.
          <br />
          <b style={{ color: "var(--text)" }}>Players never pay — no app, no buy-in, ever.</b>
        </p>
      </div>

      <div className="card pad" style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>🏈 Founding Season 2026 — first 50 companies</div>
        <p className="muted small" style={{ margin: "0 0 12px", lineHeight: 1.5 }}>
          About half off the standard rate, <b>locked for three seasons (2026–2028)</b>, with a full midseason money-back
          guarantee: if your team isn&apos;t more engaged by Week 8, you get every dollar back.
        </p>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--muted)", fontSize: 12 }}>
              <th style={{ padding: "6px 4px" }}>Tier</th>
              <th style={{ padding: "6px 4px" }}>Company size</th>
              <th style={{ padding: "6px 4px" }}>Founding / season</th>
              <th style={{ padding: "6px 4px" }}>Standard rate</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((t) => (
              <tr key={t.name} style={{ borderTop: "1px solid var(--line)" }}>
                <td style={{ padding: "10px 4px", fontWeight: 700 }}>{t.name}</td>
                <td style={{ padding: "10px 4px", color: "var(--muted)" }}>{t.size}</td>
                <td style={{ padding: "10px 4px", fontWeight: 700, color: "var(--accent, #1ed47a)" }}>{t.founding}</td>
                <td style={{ padding: "10px 4px", color: "var(--muted)", textDecoration: "line-through" }}>{t.standard}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card pad" style={{ marginTop: 12, fontSize: 14, lineHeight: 1.6 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Every league includes</div>
        The full NFL season game (winners, spreads, over/unders, Power Picks) · play by <b>web, text, or phone call</b> — no app ·
        automatic scoring, grading &amp; standings · commissioner console with roster tools, custom branding &amp; prize board ·
        weekly reminder &amp; results texts once your league&apos;s texting is live.
      </div>

      <div className="card pad" style={{ marginTop: 12, textAlign: "center" }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Start now — pay nothing today.</div>
        <p className="muted small" style={{ margin: "0 0 12px", lineHeight: 1.5 }}>
          Create your league and get your team picking first. We&apos;ll set up your Founding-Season rate with you directly —
          no card required to start, and the guarantee covers the rest.
        </p>
        <Link href="/" className="btn" style={{ display: "inline-block", textDecoration: "none" }}>
          Start your league →
        </Link>
      </div>

      <p className="muted small center" style={{ marginTop: 14 }}>
        Nonprofits &amp; schools: 30% off. Multi-department leagues, custom branding, and pick-by-phone concierge available as add-ons.
      </p>
    </div>
  );
}
