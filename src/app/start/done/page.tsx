import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { DEFAULT_ACCENT, } from "@/lib/brand";
import BrandTheme from "@/components/BrandTheme";
import { Brand } from "@/components/Brand";
import { dollars } from "@/lib/billing";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "You're in — Office Pick'em League" },
  robots: { index: false, follow: false },
};

/**
 * Stripe Checkout success page. The webhook does the real work (marks the order card_on_file);
 * this page just confirms in plain words and points at the next step — get the league launched.
 */
export default async function StartDonePage({ searchParams }: { searchParams?: { order?: string } }) {
  const id = String(searchParams?.order || "");
  const order = id ? await prisma.order.findUnique({ where: { id } }).catch(() => null) : null;
  const kitHref = order?.kitSlug ? `/kit/${order.kitSlug}` : "/";
  return (
    <>
      <BrandTheme accent={DEFAULT_ACCENT} />
      <div className="wrap" style={{ maxWidth: 480 }}>
        <div style={{ textAlign: "center", margin: "26px 0 14px" }}>
          <div style={{ display: "inline-block" }}><Brand /></div>
        </div>
        <div className="card pad" style={{ borderColor: "var(--accent)" }}>
          <div className="b" style={{ fontSize: 18, marginBottom: 6 }}>Card saved — you&apos;re in ✓</div>
          <p className="muted small" style={{ marginTop: 0 }}>
            {order ? <>{order.company} is locked at <b style={{ color: "var(--text)" }}>{dollars(order.amountCents)}</b> for the season. </> : null}
            Nothing was charged today and nothing will be until kickoff, Sept 9. Rate locked
            through 2028; full money-back guarantee through Week 8.
          </p>
          <p className="muted small" style={{ marginBottom: 0 }}>
            Ankur will text or email you within the day to set up your league — name, colors,
            roster, paper sheets. Want it sooner? 717-903-5334.
          </p>
        </div>
        <p className="muted small center" style={{ marginTop: 12 }}>
          <a href={kitHref}>← Back to your league page</a>
        </p>
      </div>
    </>
  );
}
