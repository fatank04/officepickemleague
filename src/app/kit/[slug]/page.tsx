import type { Metadata } from "next";
import { headers } from "next/headers";
import { getKit } from "@/lib/kits";
import { prisma } from "@/lib/db";
import { DEFAULT_ACCENT } from "@/lib/brand";
import BrandTheme from "@/components/BrandTheme";
import { track } from "@/lib/track";
import KitClient from "./KitClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { account } = await getKit(params.slug);
  const label = /pick'?em/i.test(account.company) ? account.company : `${account.company} Pick'em`;
  const title = `${label} — your league is ready`;
  const description = `Your whole team's office football pool, pre-built. No money, no app — pick in two minutes a week by text, web, phone, or paper. Tap to launch ${label}.`;
  return { title, description, openGraph: { title, description, type: "website" }, twitter: { card: "summary_large_image", title, description } };
}

/**
 * Their team's real Week 1 game. The kit page shows something true and specific rather than a
 * mocked-up demo league. Returns null if the schedule isn't loaded — the card just doesn't render.
 */
async function week1Game(teamCity?: string | null, teamName?: string | null) {
  if (!teamCity || !teamName) return null;
  // Games are stored by NICKNAME ("Eagles"), never full name — ingestion runs every team
  // through nick() in lib/odds.ts. A KitAccount's teamName is already that nickname.
  const season = Number(process.env.SEASON || 2026);
  return prisma.game
    .findFirst({
      where: { season, week: 1, OR: [{ home: teamName }, { away: teamName }] },
      select: { away: true, home: true, homeSpread: true, total: true, kickoff: true },
    })
    .catch(() => null);
}

/**
 * A scan only counts if a person's browser made it.
 *
 * This page doubles as our health check, and curl'ing it during a deploy check logged five fake
 * scans against real Pittsburgh companies — which is worse than no data, because the follow-up
 * playbook calls whoever looks. Link-preview fetchers (Slack, iMessage) and uptime monitors would
 * do the same. Every real QR scan comes from a phone browser and sends a Mozilla/ user-agent;
 * tools and crawlers either don't, or say what they are.
 */
function isHumanScan(): boolean {
  const ua = headers().get("user-agent") || "";
  if (!/Mozilla\//i.test(ua)) return false;
  return !/bot|crawl|spider|slurp|monitor|uptime|preview|headless|curl|wget|python|node-fetch|axios/i.test(ua);
}

export default async function KitPage({ params, searchParams }: {
  params: { slug: string };
  searchParams?: { src?: string };
}) {
  const { account, known } = await getKit(params.slug);
  const accent = account.accent || DEFAULT_ACCENT;
  const g = await week1Game(account.teamCity, account.teamName);
  // Scan tracking: fire-and-forget; never blocks the page. `src` says which touch brought them
  // here (e1/e2/e3 = email sequence, card = insert-card QR); a bare hit is the letter's QR.
  if (isHumanScan()) {
    const src = String(searchParams?.src || "").slice(0, 16) || "qr";
    track({ type: "kit_viewed", channel: "web", meta: { slug: params.slug, company: account.company, known, src } });
  }
  return (
    <>
      <BrandTheme accent={accent} />
      <KitClient
        company={account.company}
        teamCity={account.teamCity ?? null}
        teamName={account.teamName ?? null}
        contact={account.contact ?? null}
        kitSlug={params.slug}
        week1={g ? { away: g.away, home: g.home, homeSpread: g.homeSpread, total: g.total } : null}
      />
    </>
  );
}
