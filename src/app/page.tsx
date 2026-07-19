import type { Metadata } from "next";
import Link from "next/link";
import HomeForm from "@/components/HomeForm";
import WalkthroughTease from "@/components/WalkthroughTease";
import PromoVideo from "@/components/PromoVideo";
import LandingNav from "@/components/landing/LandingNav";
import LandingFX from "@/components/landing/LandingFX";
import HeroCanvas from "@/components/landing/HeroCanvas";
import ModalityJourney from "@/components/landing/ModalityJourney";
import { promoVideoJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: { absolute: "Office Pick'em League — the office football pool everyone can play" },
  description:
    "A no-money, HR-safe NFL pick'em game for workplaces. No app, no buy-ins — your whole team picks winners, spreads & over/unders in two minutes a week, by web, text, phone call, or paper sheet.",
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
    "No app, ever. Everyone plays by text message, on the web, by a quick phone call — or on paper: grab a sheet from the break-room stack, check your boxes, and text us a photo of it. We type it in for you and text your picks back to confirm. If you can send a text or answer the phone, you can play.",
  ],
  [
    "How much time does it take?",
    "About two minutes a week for players: pick winners, spreads, and over/unders for the week's games. Commissioners set the league up once in about two minutes, and scores, grading, and standings run themselves.",
  ],
  [
    "Do you have to know football?",
    "No — picking a winner is something anyone can do, and the spread and over/under picks give football fans the depth they want. First-timers beat film junkies every single week — that's half the fun, and it keeps the whole building competitive all season.",
  ],
  [
    "What about people who never felt the office pool was for them?",
    "That's exactly who this is built for. Nearly half of NFL fans are women, and plenty of great players of every age have been sitting out — not for lack of interest, but because the old formats added gatekeeping nobody needed: drafts, jargon, buy-ins, insider cliques. Office Pick'em removes all of it. No draft, no jargon, no buy-in, no permission needed — and the scoreboard is blind. Picks are graded by the engine, standings only count results, and some of the best records every season belong to first-time players. Your picks do the talking.",
  ],
  [
    "How do coworkers join a league?",
    "The commissioner shares one invite link. Each player enters a name and phone number (or just a name and PIN on the web) and they're in — no email, no password, no app.",
  ],
];

const ticker = [
  <>WEEK 6 · <b>DISPATCH</b> TAKES THE LEAD</>,
  <>DORIS: <b>8–2</b> · NOBODY KNOWS HOW</>,
  <>FLOOR <b>210</b> — FRONT OFFICE <b>198</b></>,
  <>NO MONEY · NO APP · <b>2 MIN A WEEK</b></>,
  <>LOCK OF THE WEEK: <b>THE INTERN</b></>,
  <>KICKOFF <b>SEPT 9</b> · FOUNDING SEASON OPEN</>,
];

const tiers = [
  { name: "Starter", size: "Up to 50 employees", founding: "$400", standard: "$750" },
  { name: "Team", size: "Up to 150 employees", founding: "$900", standard: "$2,250" },
  { name: "Company", size: "Up to 400 employees", founding: "$1,900", standard: "$5,400" },
  { name: "Large", size: "Up to 1,000 employees", founding: "$3,750", standard: "$9,900" },
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
          "A no-money, HR-safe NFL pick'em game for workplaces. No app, no buy-ins — teams pick winners, spreads and over/unders in two minutes a week by web, text, phone call, or paper sheet.",
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
      promoVideoJsonLd,
    ],
  };

  return (
    <div className="ld-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LandingNav />
      <LandingFX />

      {/* ===== Hero ===== */}
      <section className="ld-hero">
        <HeroCanvas />
        <div className="ld-hero-glow" aria-hidden="true" />
        <div className="ld-wrap">
          <div className="ld-chip" data-reveal>
            🏈 <b>Founding Season 2026</b> · Kickoff Sept 9 · first 50 companies
          </div>
          <h1 className="ld-h1" data-reveal>
            The office football pool <em>everyone</em> can play.
          </h1>
          <p className="ld-sub" data-reveal>
            No money, no app — your whole team picks winners, spreads &amp; over/unders in two minutes a
            week. By web, by text, by phone call — or on paper.
          </p>
          <div className="ld-cta-row" data-reveal>
            <a href="#start" className="btn blue lg" data-magnetic>Start your league — free</a>
            <Link href="/pricing" className="btn ghost lg">See pricing</Link>
          </div>
          <div className="ld-hero-media" data-reveal>
            <PromoVideo />
          </div>
        </div>
        <div className="ld-ticker" aria-hidden="true">
          <div className="ld-ticker-track">
            {[0, 1].map((dup) => (
              <span key={`set-${dup}`}>
                {ticker.map((t, i) => (
                  <span key={i}>{t}</span>
                ))}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ===== How it works ===== */}
      <section className="ld-section" id="how">
        <div className="ld-wrap">
          <div className="ld-kicker" data-reveal>How it works</div>
          <h2 className="ld-h2" data-reveal>Two minutes to start. Two minutes a week to play.</h2>
          <p className="ld-lead" data-reveal>One person sets it up. Everyone else just picks.</p>
          <div className="ld-steps" data-reveal-group>
            <div className="ld-step">
              <div className="num">01</div>
              <h3>Start your league</h3>
              <p>Name it, set a PIN, done — about two minutes. You get one invite link for your whole team.</p>
            </div>
            <div className="ld-step">
              <div className="num">02</div>
              <h3>Everyone joins their way</h3>
              <p>
                Coworkers tap the link and play by text, on the web, by phone call — or on a paper sheet from
                the break room. No app, no email, no password. Night shift or nine-to-five, everybody&apos;s in.
              </p>
            </div>
            <div className="ld-step">
              <div className="num">03</div>
              <h3>The season runs itself</h3>
              <p>
                Picks lock at kickoff, scores grade themselves, standings update automatically. You just talk
                trash.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Four ways in (interactive) ===== */}
      <section className="ld-section" id="play">
        <div className="ld-wrap">
          <div className="ld-kicker" data-reveal>Four ways in</div>
          <h2 className="ld-h2" data-reveal>Pick however you like. Confirm before it counts.</h2>
          <p className="ld-lead" data-reveal>
            Same league, same standings — by text, by a quick call, on the web, or on plain old paper.
            Whichever you choose, your picks are echoed back to you and stay changeable until kickoff.
          </p>
          <div data-reveal>
            <ModalityJourney />
          </div>
        </div>
      </section>

      {/* ===== Features bento ===== */}
      <section className="ld-section" id="features">
        <div className="ld-wrap">
          <div className="ld-kicker" data-reveal>Features</div>
          <h2 className="ld-h2" data-reveal>Built for the whole building.</h2>
          <p className="ld-lead" data-reveal>
            Most pools die because half the office can&apos;t — or won&apos;t — use the tool. This one meets
            people where they are.
          </p>
          <div className="ld-bento" data-reveal-group>
            <div className="ld-cell wide">
              <div className="glow" aria-hidden="true" />
              <div className="ico">⚙️</div>
              <h3>Commissioner autopilot</h3>
              <p>
                Lines load themselves, games lock at kickoff, ESPN finals grade every pick, weekly recap texts go
                out on their own. Running the league is a two-minute-a-week job with a fancy title.
              </p>
            </div>
            <div className="ld-cell wide">
              <div className="glow" aria-hidden="true" />
              <div className="ico">✅</div>
              <h3>Nothing locks unseen</h3>
              <p>
                Text, call, web, or paper sheet — every pick is echoed back to you before kickoff makes it final.
                Check your card anytime; no surprises on Sunday.
              </p>
            </div>
            <div className="ld-cell">
              <div className="glow" aria-hidden="true" />
              <div className="ico">🏆</div>
              <h3>Standings that talk</h3>
              <p>Live leaderboard with a weekly podium — perfect for the break-room TV.</p>
            </div>
            <div className="ld-cell">
              <div className="glow" aria-hidden="true" />
              <div className="ico">📊</div>
              <h3>Insights</h3>
              <p>Accuracy by pick type, streaks, and how you stack up against the league average.</p>
            </div>
            <div className="ld-cell">
              <div className="glow" aria-hidden="true" />
              <div className="ico">🛡️</div>
              <h3>HR-safe by design</h3>
              <p>No buy-ins, no pots, no cash — clears the policies a money pool never will.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Proof (in lieu of testimonials — pre-launch, no fabricated quotes) ===== */}
      <section className="ld-section">
        <div className="ld-wrap">
          <div className="ld-proof" data-reveal>
            <div className="ld-kicker">Why engagement is worth buying</div>
            <h2 className="ld-h2">The math your CFO already believes.</h2>
            <div className="ld-stats">
              <div className="ld-stat">
                <div className="n" data-countup="23" data-prefix="+" data-suffix="%">+23%</div>
                <div className="l">profitability — top-quartile engaged teams</div>
              </div>
              <div className="ld-stat">
                <div className="n" data-countup="18" data-prefix="+" data-suffix="%">+18%</div>
                <div className="l">productivity</div>
              </div>
              <div className="ld-stat">
                <div className="n" data-countup="63" data-suffix="%">63%</div>
                <div className="l">fewer safety incidents</div>
              </div>
            </div>
            <p className="ld-lead" style={{ margin: "10px auto 0", textAlign: "center" }}>
              Companies spend $100–500 per employee a year on team-building nobody remembers by Friday. Eighteen
              weeks of the plant floor and the front office in the same standings — they&apos;ll remember that.
            </p>
            <div className="ld-cite">Engagement outcomes: Gallup Q12 meta-analysis (11th ed.), top vs. bottom quartile. Team-building spend: SPIN research.</div>
          </div>
        </div>
      </section>

      {/* ===== Product tour ===== */}
      <section className="ld-section">
        <div className="ld-wrap" data-reveal>
          <div className="ld-kicker">See it</div>
          <h2 className="ld-h2">Take the 30-second tour.</h2>
          <WalkthroughTease />
        </div>
      </section>

      {/* ===== Pricing teaser ===== */}
      <section className="ld-section" id="pricing">
        <div className="ld-wrap">
          <div className="ld-kicker" data-reveal>Pricing</div>
          <h2 className="ld-h2" data-reveal>One flat rate. Players never pay.</h2>
          <p className="ld-lead" data-reveal>
            Founding Season 2026 — more than half off the standard rate, <b style={{ color: "var(--text)" }}>locked for
            three seasons</b>, with a Week-8 money-back guarantee.
          </p>
          <div className="ld-tiers" data-reveal-group>
            {tiers.map((t) => (
              <div className="ld-tier" key={t.name}>
                <div className="t">{t.name}</div>
                <div className="s">{t.size}</div>
                <div className="p">{t.founding}</div>
                <div className="std">{t.standard}</div>
                <div className="per">per season</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center" }} data-reveal>
            <Link href="/pricing" className="btn ghost">Full pricing &amp; guarantee →</Link>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="ld-section" id="faq">
        <div className="ld-wrap" style={{ maxWidth: 720 }}>
          <div className="ld-kicker" data-reveal>FAQ</div>
          <h2 className="ld-h2" data-reveal>Common questions</h2>
          <div data-reveal-group style={{ marginTop: 18 }}>
            {faqs.map(([q, a]) => (
              <details className="card pad" key={q} style={{ marginBottom: 8 }}>
                <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 14 }}>{q}</summary>
                <p className="muted" style={{ marginTop: 8, fontSize: 13.5, lineHeight: 1.55 }}>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Final CTA ===== */}
      <section className="ld-final" id="start">
        <div className="ld-hero-glow" aria-hidden="true" />
        <div className="ld-wrap">
          <div className="ld-kicker" data-reveal>Founding Season 2026</div>
          <h2 className="ld-h1" style={{ fontSize: "clamp(30px,5vw,46px)" }} data-reveal>
            Give them a <em>season</em>.
          </h2>
          <p className="ld-sub" data-reveal>
            Kickoff is September 9. Set your league up now — it takes two minutes, and the first week&apos;s
            picks text themselves out.
          </p>
          <div className="ld-final-form" data-reveal>
            <HomeForm />
          </div>
        </div>
      </section>
    </div>
  );
}
