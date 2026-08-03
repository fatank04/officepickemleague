import type { Metadata } from "next";
import { getKit } from "@/lib/kits";
import { DEFAULT_ACCENT } from "@/lib/brand";
import BrandTheme from "@/components/BrandTheme";
import StartClient from "./StartClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Start your league — Office Pick'em League" },
  robots: { index: false, follow: false }, // a checkout step, not a landing page
};

/**
 * The self-serve close: pick a tier, accept founding terms, then either save a card for kickoff
 * (Stripe, $0 today) or request an AP invoice. Reached from the kit page, email 3, and the
 * follow-up calls ("I can text you the start link right now").
 */
export default async function StartPage({ searchParams }: {
  searchParams?: { kit?: string; src?: string; canceled?: string };
}) {
  const kitSlug = String(searchParams?.kit || "").trim().toLowerCase();
  const kit = kitSlug ? await getKit(kitSlug) : null;
  const known = kit?.known ? kit.account : null;
  return (
    <>
      <BrandTheme accent={known?.accent || DEFAULT_ACCENT} />
      <StartClient
        company={known?.company ?? null}
        contact={known?.contact ?? null}
        kitSlug={known ? kitSlug : null}
        src={String(searchParams?.src || "").slice(0, 16) || null}
        canceled={searchParams?.canceled === "1"}
      />
    </>
  );
}
