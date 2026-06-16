"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OpsLogin() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true); setErr("");
    const res = await fetch("/api/ops/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key }) });
    setBusy(false);
    if (res.ok) router.push("/ops/kits"); else setErr("Wrong key.");
  }
  return (
    <div className="wrap" style={{ maxWidth: 380 }}>
      <div className="card pad" style={{ marginTop: 70 }}>
        <h2 style={{ marginTop: 0 }}>Ops console</h2>
        <p className="muted small">Founder access — enter your ops key.</p>
        <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="OPS_KEY"
          onKeyDown={(e) => e.key === "Enter" && go()} />
        {err && <div className="err">{err}</div>}
        <button className="btn" style={{ width: "100%", marginTop: 12 }} disabled={busy} onClick={go}>{busy ? "…" : "Enter"}</button>
      </div>
    </div>
  );
}
