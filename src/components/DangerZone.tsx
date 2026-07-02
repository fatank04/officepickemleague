"use client";
import { useState } from "react";

/** Commissioner danger zone: type-the-league-name-to-confirm league deletion. */
export default function DangerZone({ leagueName }: { leagueName: string }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const armed = confirm.trim().toLowerCase() === leagueName.trim().toLowerCase();

  async function destroy() {
    if (!armed || busy) return;
    setBusy(true);
    setErr("");
    const res = await fetch("/api/admin/league", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", confirmName: confirm }),
    });
    if (res.ok) {
      window.location.href = "/"; // session cookie is cleared server-side
      return;
    }
    setBusy(false);
    setErr((await res.json().catch(() => ({})))?.error || "Something went wrong.");
  }

  const box: React.CSSProperties = {
    background: "#1a1114",
    border: "1px solid #6b1c1c",
    borderRadius: 12,
    padding: 18,
    marginTop: 16,
  };

  return (
    <div style={box}>
      <div style={{ fontWeight: 700, color: "#ff7a7a" }}>Danger zone</div>
      {!open ? (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
          <span style={{ color: "#93a1bc", fontSize: 13 }}>
            Permanently delete this league — every player, pick, and standing goes with it. This cannot be undone.
          </span>
          <button
            onClick={() => setOpen(true)}
            style={{ background: "transparent", border: "1px solid #6b1c1c", color: "#ff7a7a", borderRadius: 8, padding: "8px 14px", fontWeight: 700, cursor: "pointer" }}
          >
            Delete this league…
          </button>
        </div>
      ) : (
        <div style={{ marginTop: 10 }}>
          <div style={{ color: "#93a1bc", fontSize: 13, marginBottom: 8 }}>
            Type the league name — <b style={{ color: "#eef3fa" }}>{leagueName}</b> — to confirm. Everything in it is
            permanently erased.
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={leagueName}
              style={{ flex: "1 1 220px", padding: 10, borderRadius: 8, border: "1px solid #2a3550", background: "#0b1120", color: "#eef3fa", fontSize: 14 }}
            />
            <button
              onClick={destroy}
              disabled={!armed || busy}
              style={{
                background: armed ? "#8f1d1d" : "#3a1414",
                border: "1px solid #6b1c1c",
                color: armed ? "#fff" : "#8a5a5a",
                borderRadius: 8,
                padding: "10px 14px",
                fontWeight: 700,
                cursor: armed && !busy ? "pointer" : "not-allowed",
              }}
            >
              {busy ? "Deleting…" : "Permanently delete"}
            </button>
            <button
              onClick={() => { setOpen(false); setConfirm(""); setErr(""); }}
              disabled={busy}
              style={{ background: "transparent", border: "1px solid #2a3550", color: "#93a1bc", borderRadius: 8, padding: "10px 14px", cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
          {err && <div style={{ color: "#ff7a7a", fontSize: 13, marginTop: 8 }}>{err}</div>}
        </div>
      )}
    </div>
  );
}
