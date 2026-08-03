"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Order = {
  id: string; createdAt: string; company: string; kitSlug?: string | null;
  name: string; email: string; phone?: string | null; tier: string;
  amountCents: number; method: string; status: string; src?: string | null;
  stripeCustomerId?: string | null; notes?: string | null;
};

const TIER_LABEL: Record<string, string> = {
  starter: "Starter ≤50", team: "Team ≤150", company: "Company ≤400", large: "Large ≤1,000",
};

/** What each status means on the phone, so the next action is obvious without a legend. */
const STATUS: Record<string, { label: string; hint: string; tone: string }> = {
  open: { label: "started, no card", hint: "Opened the card page and bailed. Call — the invoice option often closes these.", tone: "var(--muted)" },
  card_on_file: { label: "card on file", hint: "Card saved. Charge it from the Stripe dashboard on Sept 9.", tone: "var(--gold)" },
  invoice_requested: { label: "invoice to send", hint: "Send the invoice, dated Sept 9. Nothing automated does this.", tone: "var(--gold)" },
  charged: { label: "charged", hint: "Paid.", tone: "var(--good, #1ed47a)" },
  canceled: { label: "canceled", hint: "Dead.", tone: "var(--muted)" },
};

const money = (cents: number) => `$${(cents / 100).toLocaleString("en-US")}`;

function ago(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / (60 * 24))}d ago`;
}

export default function OpsOrders({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const [showTests, setShowTests] = useState(false);
  const [busy, setBusy] = useState("");

  const isTest = (o: Order) => o.src === "test";
  const real = orders.filter((o) => !isTest(o));
  const tests = orders.filter(isTest);
  const shown = showTests ? orders : real;

  // Committed = money we can expect at kickoff. "open" isn't committed — they never finished.
  const committed = real.filter((o) => o.status === "card_on_file" || o.status === "invoice_requested" || o.status === "charged");
  const total = committed.reduce((s, o) => s + o.amountCents, 0);
  const cards = real.filter((o) => o.status === "card_on_file").length;
  const invoices = real.filter((o) => o.status === "invoice_requested").length;
  const stalled = real.filter((o) => o.status === "open").length;

  async function setStatus(id: string, status: string) {
    setBusy(id);
    await fetch("/api/ops/orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    }).catch(() => {});
    setBusy("");
    router.refresh();
  }

  return (
    <div className="wrap">
      <div className="spread" style={{ margin: "8px 0 16px" }}>
        <h2 style={{ margin: 0 }}>Orders</h2>
        <div className="row" style={{ gap: 8 }}>
          <Link href="/ops/kits" className="btn ghost sm">← Kit accounts</Link>
          <a className="btn ghost sm" href="https://dashboard.stripe.com/customers" target="_blank" rel="noreferrer">Stripe →</a>
        </div>
      </div>

      <div className="row" style={{ gap: 18, marginBottom: 6, flexWrap: "wrap" }}>
        <span className="chip live" title="Cards saved + invoices requested + charged">💰 {money(total)} committed</span>
        <span className="chip live">💳 {cards} card{cards === 1 ? "" : "s"} on file</span>
        <span className="chip live">🧾 {invoices} invoice{invoices === 1 ? "" : "s"} to send</span>
        <span className="chip" title="Opened the card page and never finished — call these">↩ {stalled} stalled</span>
      </div>
      <p className="muted small" style={{ margin: "0 0 14px" }}>
        Nothing here is charged. Cards get charged by hand in Stripe on Sept 9; invoices you send
        yourself. {tests.length > 0 && (
          <button onClick={() => setShowTests((v) => !v)} style={{ background: "none", border: "none", padding: 0, font: "inherit", color: "var(--accent)", cursor: "pointer", textDecoration: "underline" }}>
            {showTests ? "Hide" : "Show"} {tests.length} test order{tests.length === 1 ? "" : "s"}
          </button>
        )}
      </p>

      {shown.length === 0 ? (
        <div className="card pad">
          <p className="muted small" style={{ margin: 0 }}>
            No orders yet. They land here the moment someone saves a card or asks for an invoice at{" "}
            <code>/start</code> — and you get a text either way.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {shown.map((o) => {
            const st = STATUS[o.status] || { label: o.status, hint: "", tone: "var(--muted)" };
            return (
              <div key={o.id} className="card pad" style={{ opacity: isTest(o) ? 0.55 : 1 }}>
                <div className="spread" style={{ alignItems: "baseline", gap: 10 }}>
                  <div className="b" style={{ fontSize: 16 }}>
                    {o.company}{" "}
                    {isTest(o) && <span className="muted small" style={{ fontWeight: 400 }}>(test)</span>}
                  </div>
                  <div className="b" style={{ fontSize: 16, whiteSpace: "nowrap" }}>{money(o.amountCents)}</div>
                </div>
                <div className="muted small" style={{ margin: "3px 0 8px" }}>
                  {o.name} · <a href={`mailto:${o.email}`}>{o.email}</a>
                  {o.phone ? <> · <a href={`tel:${o.phone.replace(/[^\d+]/g, "")}`}>{o.phone}</a></> : null}
                </div>
                <div className="row" style={{ gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                  <span className="chip" style={{ color: st.tone }}>{o.method === "invoice" ? "🧾" : "💳"} {st.label}</span>
                  <span className="chip">{TIER_LABEL[o.tier] || o.tier}</span>
                  <span className="chip">{ago(o.createdAt)}</span>
                  {o.src && <span className="chip" title="Which touch brought them here">src: {o.src}</span>}
                  {o.kitSlug && <Link className="chip" href={`/kit/${o.kitSlug}`}>/kit/{o.kitSlug}</Link>}
                </div>
                {st.hint && <p className="muted small" style={{ margin: "0 0 8px" }}>{st.hint}</p>}
                <div className="row" style={{ gap: 7, flexWrap: "wrap" }}>
                  {o.status !== "charged" && (
                    <button className="btn sm" disabled={busy === o.id} onClick={() => setStatus(o.id, "charged")}>
                      Mark charged
                    </button>
                  )}
                  {o.status !== "canceled" && (
                    <button className="btn ghost sm" disabled={busy === o.id} onClick={() => setStatus(o.id, "canceled")}>
                      Cancel
                    </button>
                  )}
                  {o.stripeCustomerId && (
                    <a className="btn ghost sm" href={`https://dashboard.stripe.com/customers/${o.stripeCustomerId}`} target="_blank" rel="noreferrer">
                      Open in Stripe →
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
