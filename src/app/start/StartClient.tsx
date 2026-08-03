"use client";
import { useState } from "react";
import { Brand } from "@/components/Brand";
import { fbTrack } from "@/lib/pixel";

/**
 * Client half of /start. Same form fields the kit page uses, plus the billing choice the kit page
 * doesn't have: save a card now (Stripe setup mode, $0 today) or request an AP invoice. Copy keeps
 * the one promise that matters: nothing is billed until kickoff, Sept 9.
 */

const TIERS = [
  { id: "starter", label: "Up to 50 people", price: "$400", std: "$750" },
  { id: "team", label: "Up to 150 people", price: "$900", std: "$1,800" },
  { id: "company", label: "Up to 400 people", price: "$1,900", std: "$3,900" },
  { id: "large", label: "Up to 1,000 people", price: "$3,750", std: "$7,500" },
];

export default function StartClient({ company, contact, kitSlug, src, canceled }: {
  company: string | null; contact: string | null; kitSlug: string | null;
  src: string | null; canceled: boolean;
}) {
  const [cName, setCName] = useState(contact ?? "");
  const [coName, setCoName] = useState(company ?? "");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [tier, setTier] = useState("");
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState<"card" | "invoice" | null>(null);
  const [err, setErr] = useState("");
  const [invoiceDone, setInvoiceDone] = useState(false);

  async function submit(method: "card" | "invoice") {
    setErr("");
    if (!cName.trim()) { setErr("Add your name."); return; }
    if (!coName.trim()) { setErr("Add your company name."); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) { setErr("Add a work email — the confirmation goes there."); return; }
    if (!tier) { setErr("Pick your company size."); return; }
    if (!terms) { setErr("Check the founding-terms box."); return; }
    setBusy(method);
    const res = await fetch("/api/checkout", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: cName, company: coName, email, phone, tier, terms, method, kitSlug, src }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) { setErr(data.error || "Something went wrong."); return; }
    fbTrack("Lead");
    if (data.url) { window.location.href = data.url; return; }
    if (data.invoice) setInvoiceDone(true);
  }

  if (invoiceDone) {
    return (
      <div className="wrap" style={{ maxWidth: 480 }}>
        <div style={{ textAlign: "center", margin: "26px 0 14px" }}>
          <div style={{ display: "inline-block" }}><Brand /></div>
        </div>
        <div className="card pad" style={{ borderColor: "var(--accent)" }}>
          <div className="b" style={{ fontSize: 18, marginBottom: 6 }}>Invoice on the way ✓</div>
          <p className="muted small" style={{ marginTop: 0 }}>
            Done — {coName} is locked in at the founding rate. Ankur sends the invoice to {email}
            {" "}within one business day, dated to kickoff (Sept 9). Nothing to do until then.
          </p>
          <p className="muted small" style={{ marginBottom: 0 }}>
            Questions in the meantime: 717-903-5334 — call or text.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap" style={{ maxWidth: 480 }}>
      <div style={{ textAlign: "center", margin: "26px 0 14px" }}>
        <div style={{ display: "inline-block" }}><Brand /></div>
      </div>

      <div className="hero">
        <span className="hero-line"><em>{company ? `${company} — lock in` : "Lock in"} your founding rate.</em></span>
      </div>
      <p className="muted small center" style={{ margin: "10px 0 18px" }}>
        Two minutes. <b style={{ color: "var(--text)" }}>Nothing is billed until kickoff, Sept 9</b> —
        save a card or have us invoice your AP, same rate either way.
      </p>

      {canceled && (
        <div className="card pad" style={{ marginBottom: 12 }}>
          <p className="muted small" style={{ margin: 0 }}>
            No card saved — no harm done. Pick up where you left off below, or choose the invoice
            option instead.
          </p>
        </div>
      )}

      <div className="card pad" style={{ borderColor: "var(--accent)" }}>
        <label>Your name</label>
        <input value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Your name" />
        <label>Company</label>
        <input value={coName} onChange={(e) => setCoName(e.target.value)} placeholder="Company name" />
        <label>Work email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} inputMode="email" placeholder="you@company.com" />
        <label>Cell (optional — for setup texts)</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="(555) 555-5555" />

        <label>Company size</label>
        <div style={{ display: "grid", gap: 7 }}>
          {TIERS.map((t) => (
            <button key={t.id} type="button" onClick={() => setTier(t.id)} style={{
              display: "flex", justifyContent: "space-between", alignItems: "baseline",
              padding: "9px 12px", borderRadius: 9, cursor: "pointer", font: "inherit",
              border: tier === t.id ? "1.5px solid var(--accent)" : "1px solid var(--line)",
              background: tier === t.id ? "rgba(79,140,255,.10)" : "var(--panel2)", color: "var(--text)",
            }}>
              <span style={{ fontSize: 13.5 }}>{t.label}</span>
              <span style={{ fontSize: 13 }}>
                <b>{t.price}</b>/season <s className="muted" style={{ fontSize: 11.5 }}>{t.std}</s>
              </span>
            </button>
          ))}
        </div>

        <label style={{ display: "flex", gap: 9, alignItems: "flex-start", margin: "12px 0 0", fontSize: 12.5, textTransform: "none", letterSpacing: 0, color: "var(--muted)", fontWeight: 500, lineHeight: 1.45 }}>
          <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} style={{ width: 15, height: 15, marginTop: 2, flex: "none" }} />
          <span>I&apos;m locking in a Founding Season league at the rate above — billed at kickoff (Sept 9),
          rate locked for three seasons, full money-back guarantee through Week 8.</span>
        </label>

        {err && <div className="err">{err}</div>}

        <button className="btn" style={{ width: "100%", marginTop: 14 }} disabled={busy !== null} onClick={() => submit("card")}>
          {busy === "card" ? "Opening secure card page…" : "Save a card for kickoff — $0 today →"}
        </button>
        <button className="btn ghost" style={{ width: "100%", marginTop: 8 }} disabled={busy !== null} onClick={() => submit("invoice")}>
          {busy === "invoice" ? "Sending…" : "Invoice my AP instead"}
        </button>
        <p className="muted small center" style={{ margin: "10px 0 0" }}>
          Card details go straight to Stripe — we never see or store them.
        </p>
      </div>

      <p className="muted small center" style={{ marginTop: 12 }}>
        Questions first? Call or text Ankur: 717-903-5334.
      </p>
    </div>
  );
}
