"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export type RosterRow = {
  id: string; name: string; isCommish: boolean; isMe: boolean;
  hasPhone: boolean; consented: boolean; optedOut: boolean; locked: boolean;
};

const box: React.CSSProperties = { background: "#141c2e", border: "1px solid #2a3550", borderRadius: 12, padding: 14, margin: "10px 0" };
const input: React.CSSProperties = { background: "#0d1424", border: "1px solid #2a3550", color: "#eef", borderRadius: 8, padding: "8px 10px", fontSize: 14 };
const btn: React.CSSProperties = { background: "#1c2740", border: "1px solid #36507e", color: "#cfe0ff", borderRadius: 8, padding: "6px 10px", fontSize: 13, cursor: "pointer" };
const danger: React.CSSProperties = { ...btn, border: "1px solid #6b1c1c", color: "#ff9a9a", background: "#220f0f" };
const tag = (txt: string, good = true): React.CSSProperties => ({ fontSize: 11, padding: "1px 7px", borderRadius: 999, marginLeft: 6, background: good ? "#103a28" : "#3a1414", color: good ? "#21e08a" : "#ff7a7a" });

export default function RosterClient({ slug, rows }: { slug: string; rows: RosterRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ t: "ok" | "err"; s: string } | null>(null);
  const [newName, setNewName] = useState("");
  const [bulk, setBulk] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [result, setResult] = useState<null | { created: { name: string; pin: string }[]; skipped: string[]; duplicatesInList: string[]; errors: { line: number; raw: string; reason: string }[] }>(null);

  async function call(action: string, payload: Record<string, unknown> = {}) {
    setBusy(action + (payload.id ?? "")); setMsg(null);
    try {
      const r = await fetch("/api/admin/roster", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...payload }) });
      const j = await r.json();
      if (!r.ok) { setMsg({ t: "err", s: j.error || "Something went wrong." }); return null; }
      return j;
    } catch { setMsg({ t: "err", s: "Network error." }); return null; }
    finally { setBusy(null); }
  }

  async function add() {
    const j = await call("add", { name: newName });
    if (j?.ok) { setMsg({ t: "ok", s: `Added ${newName.trim()} — PIN ${j.pin} (share it with them).` }); setNewName(""); router.refresh(); }
  }
  async function bulkAdd() {
    setResult(null);
    const j = await call("bulkAdd", { text: bulk });
    if (j?.ok) {
      setResult(j);
      setMsg({ t: "ok", s: `Imported ${j.created.length} player${j.created.length === 1 ? "" : "s"}.${j.skipped.length ? ` Skipped ${j.skipped.length} already on the roster.` : ""}` });
      setBulk("");
      router.refresh();
    } else if (j === null) { /* error already shown */ }
  }
  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setBulk(String(reader.result || ""));
    reader.readAsText(f);
  }
  function copyPins() {
    if (!result) return;
    const txt = result.created.map((c) => `${c.name}: ${c.pin}`).join("\n");
    navigator.clipboard?.writeText(txt).then(() => setMsg({ t: "ok", s: "PIN list copied." }), () => {});
  }

  async function resetPin(r: RosterRow) {
    const j = await call("resetPin", { id: r.id });
    if (j?.ok) setMsg({ t: "ok", s: `${r.name}'s new PIN is ${j.pin}.` });
  }
  async function rename(r: RosterRow) {
    const name = window.prompt(`Rename ${r.name} to:`, r.name); if (!name) return;
    const j = await call("rename", { id: r.id, name }); if (j?.ok) { setMsg({ t: "ok", s: "Renamed." }); router.refresh(); }
  }
  async function toggleCommish(r: RosterRow) {
    const j = await call("setCommish", { id: r.id, value: !r.isCommish }); if (j?.ok) router.refresh();
  }
  async function remove(r: RosterRow) {
    if (!window.confirm(`Remove ${r.name}? This deletes their picks and can't be undone.`)) return;
    const j = await call("remove", { id: r.id }); if (j?.ok) { setMsg({ t: "ok", s: `${r.name} removed.` }); router.refresh(); }
  }
  async function resend(r: RosterRow) {
    const j = await call("resendSms", { id: r.id }); if (j?.ok) setMsg({ t: "ok", s: `Text sent to ${r.name}.` });
  }

  return (
    <>
      {msg && <div style={{ ...box, borderColor: msg.t === "ok" ? "#1c6b48" : "#6b1c1c", color: msg.t === "ok" ? "#21e08a" : "#ff9a9a" }}>{msg.s}</div>}

      <div style={box}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Add a player</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input style={{ ...input, flex: 1, minWidth: 200 }} placeholder="Name (e.g. Mike R)" value={newName}
            onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
          <button style={btn} disabled={busy === "add" || !newName.trim()} onClick={add}>{busy === "add" ? "Adding…" : "Add"}</button>
        </div>
        <div style={{ color: "#93a1bc", fontSize: 12, marginTop: 6 }}>Creates a web PIN to share. For text/voice play, send them the join link so they consent themselves.</div>
      </div>

      <div style={box}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 700 }}>Bulk import</div>
          <button style={btn} onClick={() => setBulkOpen((v) => !v)}>{bulkOpen ? "Hide" : "Paste a list"}</button>
        </div>
        {bulkOpen && (
          <div style={{ marginTop: 10 }}>
            <div style={{ color: "#93a1bc", fontSize: 12, marginBottom: 6 }}>
              One per line: <code>Name</code> or <code>Name, phone</code>. A <code>name,phone</code> header is ignored. Up to 500 at a time.
            </div>
            <textarea style={{ ...input, width: "100%", minHeight: 120, fontFamily: "ui-monospace, monospace", boxSizing: "border-box" }}
              placeholder={"Mike R, 412-555-0123\nDana Q\nSue P, 4125550199"} value={bulk} onChange={(e) => setBulk(e.target.value)} />
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 8 }}>
              <button style={{ ...btn, background: "#10331f", border: "1px solid #1c6b48", color: "#21e08a" }}
                disabled={busy === "bulkAdd" || !bulk.trim()} onClick={bulkAdd}>{busy === "bulkAdd" ? "Importing…" : "Import"}</button>
              <label style={{ ...btn, cursor: "pointer" }}>Upload .csv / .txt<input type="file" accept=".csv,.txt,text/csv,text/plain" onChange={onFile} style={{ display: "none" }} /></label>
              <span style={{ color: "#ffb86b", fontSize: 12 }}>Imported numbers are saved but NOT texted — players must opt in via the join link (consent).</span>
            </div>
          </div>
        )}
        {result && (
          <div style={{ marginTop: 12, borderTop: "1px solid #2a3550", paddingTop: 10 }}>
            {result.created.length > 0 && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 600 }}>Added {result.created.length} — share these web PINs:</div>
                  <button style={btn} onClick={copyPins}>Copy list</button>
                </div>
                <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 13, background: "#0d1424", border: "1px solid #2a3550", borderRadius: 8, padding: 10, marginTop: 6, maxHeight: 180, overflow: "auto" }}>
                  {result.created.map((c) => (<div key={c.name}>{c.name}: <b>{c.pin}</b></div>))}
                </div>
              </>
            )}
            {result.skipped.length > 0 && <div style={{ color: "#93a1bc", fontSize: 12.5, marginTop: 8 }}>Skipped (already on roster): {result.skipped.join(", ")}</div>}
            {result.duplicatesInList.length > 0 && <div style={{ color: "#93a1bc", fontSize: 12.5, marginTop: 4 }}>Duplicate in your list: {result.duplicatesInList.join(", ")}</div>}
            {result.errors.length > 0 && (
              <div style={{ color: "#ff9a9a", fontSize: 12.5, marginTop: 6 }}>
                {result.errors.length} line(s) skipped: {result.errors.slice(0, 6).map((e) => `line ${e.line} (${e.reason})`).join("; ")}{result.errors.length > 6 ? "…" : ""}
              </div>
            )}
          </div>
        )}
      </div>

      {rows.map((r) => (
        <div key={r.id} style={{ ...box, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div>
            <span style={{ fontWeight: 600 }}>{r.name}</span>
            {r.isCommish && <span style={tag("commish")}>commish</span>}
            {r.hasPhone && <span style={tag(r.optedOut ? "opted out" : "text", !r.optedOut)}>{r.optedOut ? "opted out" : r.consented ? "text ✓" : "text"}</span>}
            {r.locked && <span style={tag("PIN locked", false)}>PIN locked</span>}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button style={btn} onClick={() => rename(r)}>Rename</button>
            <button style={btn} onClick={() => resetPin(r)}>Reset PIN</button>
            {r.hasPhone && !r.optedOut && <button style={btn} onClick={() => resend(r)}>Resend text</button>}
            <button style={btn} onClick={() => toggleCommish(r)}>{r.isCommish ? "Remove commish" : "Make commish"}</button>
            {!r.isMe && <button style={danger} onClick={() => remove(r)}>Remove</button>}
          </div>
        </div>
      ))}
    </>
  );
}
