import type { Metadata } from "next";
import { getKit } from "@/lib/kits";
import { DEFAULT_ACCENT } from "@/lib/brand";
import BrandTheme from "@/components/BrandTheme";
import { track } from "@/lib/track";
import KitClient from "./KitClient";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const { account } = getKit(params.slug);
  const label = /pick'?em/i.test(account.company) ? account.company : `${account.company} Pick'em`;
  const title = `${label} — your league is ready`;
  const description = `Your whole team's office football pool, pre-built. No money, no app — pick in two minutes a week by text, web, or phone. Tap to launch ${label}.`;
  return { title, description, openGraph: { title, description, type: "website" }, twitter: { card: "summary_large_image", title, description } };
}

export default function KitPage({ params }: { params: { slug: string } }) {
  const { account, known } = getKit(params.slug);
  const accent = account.accent || DEFAULT_ACCENT;
  // Scan tracking: fire-and-forget; never blocks the page.
  track({ type: "kit_viewed", channel: "web", meta: { slug: params.slug, company: account.company, known } });
  return (
    <>
      <BrandTheme accent={accent} />
      <KitClient
        company={account.company}
        teamCity={account.teamCity ?? null}
        teamName={account.teamName ?? null}
        contact={account.contact ?? null}
      />
    </>
  );
}
