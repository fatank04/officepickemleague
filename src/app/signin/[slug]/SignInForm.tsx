"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Brand } from "@/components/Brand";

export default function SignInForm({ slug, leagueName }: { slug: string; leagueName: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const rawNext = sp.get("next") || "";
  // Only honor same-league return paths (prevents open-redirect).
  const next = rawNext.startsWith(`/l/${slug}/`) ? rawNext : `/l/${slug}/picks`;
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [confirming, setConfirming] = useState(false);

  async function go(confirmNew = false) {
    if (!name.trim()) { setErr("Enter your name."); return; }
    if (!/^\d{4}$/.test(pin)) { setErr("Enter your 4-digit PIN."); return; }
    setBusy(true); setErr("");
    const res = await fetch("/api/join", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, name, pin, confirmNew }) });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.status === 409 && d.needConfirm) { setConfirming(true); return; }
    if (!res.ok) { setErr(d.error || "Couldn't sign you in."); return; }
    router.push(next);
  }

  return (
    <div className="wrap" style={{ maxWidth: 420 }}>
      <div style={{ textAlign: "center", margin: "30px 0 16px" }}><div style={{ display: "inline-block" }}><Brand /></div></div>
      <div className="card pad">
        <h2 style={{ marginTop: 0 }}>Sign in to {leagueName}</h2>
        {confirming ? (
          <>
            <p style={{ marginTop: 0 }}>We don&apos;t see anyone named <b>{name.trim()}</b> in {leagueName} yet.</p>
            <p className="muted small">If you already play here, your name was probably typed differently — go back and use the <b>exact</b> name from your welcome text. If you&apos;re new, join as a new player below.</p>
            <button className="btn" style={{ width: "100%", marginTop: 8 }} disabled={busy} onClick={() => go(true)}>{busy ? "Joining…" : "Join as a new player →"}</button>
            <button className="btn ghost" style={{ width: "100%", marginTop: 10 }} disabled={busy} onClick={() => { setConfirming(false); setErr(""); }}>← Go back &amp; fix my name</button>
          </>
        ) : (
          <>
            <p className="muted small" style={{ marginTop: 0 }}>Returning? Use the name and PIN from your welcome text. New here? Enter your name and pick a 4-digit PIN.</p>
            <label>Your name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mike R" />
            <label>4-digit PIN</label>
            <input value={pin} onChange={(e) => setPin(e.target.value)} inputMode="numeric" maxLength={4} placeholder="1234" onKeyDown={(e) => e.key === "Enter" && go()} />
            {err && <div className="err">{err}</div>}
            <button className="btn" style={{ width: "100%", marginTop: 14 }} disabled={busy} onClick={() => go()}>{busy ? "Signing in…" : "Sign in →"}</button>
            <p className="muted small center" style={{ marginTop: 14 }}>Not your league? <a href="/" style={{ color: "var(--accent)" }}>Start or find another →</a></p>
          </>
        )}
      </div>
    </div>
  );
}
