import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/components/Brand";
import HomeForm from "@/components/HomeForm";

export const metadata: Metadata = {
  title: { absolute: "Office Pick'em League — the office football pool everyone can play" },
  description:
    "A no-money, HR-safe NFL pick'em game for workplaces. No app, no buy-ins — your whole team picks winners, spreads & over/unders in two minutes a week, by web, text, or a phone call.",
  alternates: { canonical: "/" },
};

const faqs: [string, string][] = [
  [
    "Is Office Pick'em gambling?",
    "No. There's no money anywhere in the game — no buy-ins, no pots, no cash prizes. Players never pay anything. The employer runs it as a team-engagement game, and any prizes (bragging rights, a trophy, pizza) come from the employer, not from player money. That's what makes it the office football game HR can actually approve.",
  ],
  [
    "What does it cost?",
    "Always free for players. For employers, the 2026 Founding Season is a flat seasonal rate starting at $400 per season by company size — locked for three seasons, with a midseason money-back guarantee. See the pricing page for the full card.",
  ],
  [
    "Do players need to download an app?",
    "No app, ever. Everyone plays by text message, on the web, or even by a phone call — so it works for the shop floor and the front office alike, including folks who don't do apps.",
  ],
  [
    "How much time does it take?",
    "About two minutes a week for players: pick winners, spreads, and over/unders for the week's games. Commissioners set the league up once in about two minutes, and scores, grading, and standings run themselves.",
  ],
  [
    "Do you have to know football?",
    "No — picking a winner is something anyone can do, and the spread and over/under picks give football fans the depth they want. Leagues stay competitive from the floor to the front office all season.",
  ],
  [
    "How do coworkers join a league?",
    "The commissioner shares one invite link. Each player enters a name and phone number (or just a name and PIN on the web) and they're in — no email, no password, no app.",
  ],
];

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Office Pick'em League",
        applicationCategory: "GameApplication",
        operatingSystem: "Web, SMS",
        url: "https://officepickemleague.com",
        description:
          "A no-money, HR-safe NFL pick'em game for workplaces. No app, no buy-ins — teams pick winners, spreads and over/unders in two minutes a week by web, text, or phone call.",
        offers: {
          "@type": "Offer",
          price: "400",
          priceCurrency: "USD",
          description: "Founding Season 2026: flat seasonal rate from $400 by company size. Always free for players.",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map(([q, a]) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      },
    ],
  };

  return (
    <div className="wrap" style={{ maxWidth: 640 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div style={{ textAlign: "center", margin: "30px 0 18px" }}>
        <div style={{ display: "inline-block" }}>
          <Brand />
        </div>
        <h1 style={{ fontSize: 20, margin: "14px 0 6px" }}>The office football pool everyone can play.</h1>
        <p className="muted" style={{ margin: 0 }}>
          No money, no app — pick winners, spreads &amp; over/unders in two minutes a week. By web, text, or a phone call.
        </p>
      </div>

      <div style={{ maxWidth: 460, margin: "0 auto" }}>
        <HomeForm />
      </div>

      <section style={{ marginTop: 36 }}>
        <h2 style={{ fontSize: 17 }}>How it works</h2>
        <div className="card pad" style={{ lineHeight: 1.6, fontSize: 14 }}>
          <p style={{ margin: "0 0 10px" }}>
            <b>1. Start your league (2 minutes).</b> Name it, set a PIN, done. You get one invite link for your whole team.
          </p>
          <p style={{ margin: "0 0 10px" }}>
            <b>2. Everyone joins their way.</b> Coworkers tap your link and play by text, on the web, or by phone call — no app,
            no email, no password. From the shop floor to the front office, everybody&apos;s in.
          </p>
          <p style={{ margin: 0 }}>
            <b>3. Two minutes a week, all season.</b> Pick winners, spreads &amp; over/unders. Games lock at kickoff, scores grade
            themselves, standings update automatically. You just talk trash.
          </p>
        </div>
      </section>

      <section style={{ marginTop: 26 }}>
        <h2 style={{ fontSize: 17 }}>For HR, owners &amp; office managers</h2>
        <div className="card pad" style={{ lineHeight: 1.6, fontSize: 14 }}>
          <p style={{ margin: "0 0 10px" }}>
            Office Pick'em is the <b>anti-gambling</b> office game: no buy-ins, no pots, no cash — so it clears the policies a
            money pool never will, and nobody's left out over ten bucks. It's employee engagement your whole workforce actually
            wants, built for deskless teams in football towns — Pittsburgh, Buffalo, Cleveland, Cincinnati, and beyond.
          </p>
          <p style={{ margin: 0 }}>
            <b>Always free for players.</b> Employers pay one flat seasonal rate —{" "}
            <Link href="/pricing" style={{ color: "var(--accent, #1ed47a)" }}>Founding Season from $400</Link>, locked for three
            seasons, with a midseason money-back guarantee.
          </p>
        </div>
      </section>

      <section style={{ marginTop: 26, marginBottom: 8 }}>
        <h2 style={{ fontSize: 17 }}>Common questions</h2>
        {faqs.map(([q, a]) => (
          <details className="card pad" key={q} style={{ marginBottom: 8 }}>
            <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 14 }}>{q}</summary>
            <p className="muted" style={{ marginTop: 8, fontSize: 13.5, lineHeight: 1.55 }}>{a}</p>
          </details>
        ))}
      </section>
    </div>
  );
}
