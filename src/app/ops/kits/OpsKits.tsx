"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Acct = {
  id: string; slug: string; company: string; metro?: string | null; teamCity?: string | null; teamName?: string | null;
  accent?: string | null; contact?: string | null; contactTitle?: string | null; email?: string | null;
  addr1?: string | null; addr2?: string | null; city?: string | null; state?: string | null; zip?: string | null;
  status: string; notes?: string | null;
};
type Counts = Record<string, number>;

const BLANK: Partial<Acct> = { company: "", slug: "", metro: "", contact: "", contactTitle: "", email: "", teamCity: "", teamName: "", accent: "", addr1: "", addr2: "", city: "", state: "", zip: "", status: "draft", notes: "" };
const STATUSES = ["draft", "ready", "mailed"];
const IMPORT_COLS = ["company", "slug", "metro", "contact", "contactTitle", "email", "teamCity", "teamName", "accent", "addr1", "addr2", "city", "state", "zip", "notes"];

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const split = (l: string) => {
    const out: string[] = []; let cur = "", q = false;
    for (let i = 0; i < l.length; i++) {
      const c = l[i];
      if (c === '"') { if (q && l[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
      else if (c === "," && !q) { out.push(cur); cur = ""; }
      else cur += c;
    }
    out.push(cur); return out.map((s) => s.trim());
  };
  const header = split(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((l) => {
    const cells = split(l); const o: Record<string, string> = {};
    header.forEach((h, i) => { if (h) o[h] = cells[i] ?? ""; });
    return o;
  });
}

export default function OpsKits({ accounts, viewed, launched, baseUrl }: { accounts: Acct[]; viewed: Counts; launched: Counts; baseUrl: string }) {
  const router = useRouter();
  const [form, setForm] = useState<Partial<Acct> | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [csv, setCsv] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const set = (k: string, v: string) => setForm((f) => ({ ...(f || {}), [k]: v }));

  async function post(body: any) {
    setBusy(true); setMsg("");
    const res = await fetch("/api/ops/kits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { setMsg(d.error || "Error"); return false; }
    router.refresh();
    return true;
  }
  async function save() {
    if (!form?.company?.trim()) { setMsg("Company is required."); return; }
    const ok = await post(form.id ? { action: "update", id: form.id, account: form } : { action: "create", account: form });
    if (ok) setForm(null);
  }
  async function importCsv() {
    const rows = parseCsv(csv);
    if (!rows.length) { setMsg("No rows parsed — include a header row."); return; }
    const ok = await post({ action: "import", rows });
    if (ok) { const d = rows.length; setShowImport(false); setCsv(""); setMsg(`Imported ${d} row(s) submitted.`); }
  }
  const copy = (slug: string) => navigator.clipboard?.writeText(`${baseUrl}/kit/${slug}`);

  const total = accounts.length;
  const mailed = accounts.filter((a) => a.status === "mailed").length;
  const vTot = accounts.reduce((s, a) => s + (viewed[a.slug] || 0), 0);
  const lTot = accounts.reduce((s, a) => s + (launched[a.slug] || 0), 0);

  const pill = (s: string): React.CSSProperties => ({ fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 999,
    background: s === "mailed" ? "rgba(79,140,255,.15)" : s === "ready" ? "rgba(247,207,87,.15)" : "var(--panel2)",
    color: s === "mailed" ? "var(--accent)" : s === "ready" ? "var(--gold)" : "var(--muted)", border: "1px solid var(--line)" });

  return (
    <div className="wrap">
      <div className="spread" style={{ margin: "8px 0 16px" }}>
        <h2 style={{ margin: 0 }}>Kit accounts</h2>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn sm" onClick={() => { setForm({ ...BLANK }); setShowImport(false); }}>+ Add account</button>
          <button className="btn ghost sm" onClick={() => { setShowImport((v) => !v); setForm(null); }}>Import CSV</button>
        </div>
      </div>

      <div className="row" style={{ gap: 18, marginBottom: 14, flexWrap: "wrap" }}>
        <span className="chip">{total} accounts</span>
        <span className="chip">{mailed} mailed</span>
        <span className="chip live">👁 {vTot} scans</span>
        <span className="chip live">🚀 {lTot} launched</span>
      </div>
      {msg && <div className="card pad small" style={{ color: "var(--gold)" }}>{msg}</div>}

      {showImport && (
        <div className="card pad">
          <div className="b" style={{ marginBottom: 6 }}>Paste CSV (header row required)</div>
          <p className="muted small" style={{ marginTop: 0 }}>Columns: {IMPORT_COLS.join(", ")}. <b>company</b> required; slug auto-generates if blank.</p>
          <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={7} style={{ width: "100%", fontFamily: "monospace", fontSize: 12 }}
            placeholder={"company,metro,contact,email,teamCity,teamName\nRiver City Mfg,Cincinnati,Dana,dana@rivercity.com,Cincinnati,Bengals"} />
          <div className="row" style={{ gap: 8, marginTop: 8 }}>
            <button className="btn sm" disabled={busy} onClick={importCsv}>Import</button>
            <button className="btn ghost sm" onClick={() => setShowImport(false)}>Cancel</button>
          </div>
        </div>
      )}

      {form && (
        <div className="card pad">
          <div className="b" style={{ marginBottom: 8 }}>{form.id ? "Edit account" : "New account"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: "0 12px" }}>
            <div><label>Company *</label><input value={form.company || ""} onChange={(e) => set("company", e.target.value)} /></div>
            <div><label>Slug (auto if blank)</label><input value={form.slug || ""} onChange={(e) => set("slug", e.target.value)} disabled={!!form.id} placeholder="auto" /></div>
            <div><label>Metro</label><input value={form.metro || ""} onChange={(e) => set("metro", e.target.value)} /></div>
            <div><label>Contact (first name)</label><input value={form.contact || ""} onChange={(e) => set("contact", e.target.value)} /></div>
            <div><label>Contact title</label><input value={form.contactTitle || ""} onChange={(e) => set("contactTitle", e.target.value)} /></div>
            <div><label>Email</label><input value={form.email || ""} onChange={(e) => set("email", e.target.value)} /></div>
            <div><label>Team city</label><input value={form.teamCity || ""} onChange={(e) => set("teamCity", e.target.value)} /></div>
            <div><label>Team name</label><input value={form.teamName || ""} onChange={(e) => set("teamName", e.target.value)} /></div>
            <div><label>Accent (#hex)</label><input value={form.accent || ""} onChange={(e) => set("accent", e.target.value)} placeholder="#4f8cff" /></div>
            <div><label>Address 1</label><input value={form.addr1 || ""} onChange={(e) => set("addr1", e.target.value)} /></div>
            <div><label>Address 2</label><input value={form.addr2 || ""} onChange={(e) => set("addr2", e.target.value)} /></div>
            <div><label>City</label><input value={form.city || ""} onChange={(e) => set("city", e.target.value)} /></div>
            <div><label>State</label><input value={form.state || ""} onChange={(e) => set("state", e.target.value)} /></div>
            <div><label>ZIP</label><input value={form.zip || ""} onChange={(e) => set("zip", e.target.value)} /></div>
            <div><label>Status</label><select value={form.status || "draft"} onChange={(e) => set("status", e.target.value)}>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          <label>Notes</label><input value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} />
          <div className="row" style={{ gap: 8, marginTop: 12 }}>
            <button className="btn sm" disabled={busy} onClick={save}>{form.id ? "Save" : "Create"}</button>
            <button className="btn ghost sm" onClick={() => setForm(null)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="card" style={{ overflowX: "auto" }}>
        <table>
          <thead><tr><th>Company</th><th>Metro</th><th>Contact</th><th>pURL</th><th>Status</th><th className="num">👁</th><th className="num">🚀</th><th></th></tr></thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id}>
                <td><b>{a.company}</b></td>
                <td className="muted">{a.metro || "—"}</td>
                <td className="muted">{a.contact || "—"}</td>
                <td>
                  <button className="btn ghost sm" onClick={() => copy(a.slug)} title={`${baseUrl}/kit/${a.slug}`}>/kit/{a.slug} ⧉</button>
                </td>
                <td>
                  <select value={a.status} onChange={(e) => post({ action: "setStatus", id: a.id, status: e.target.value })} style={{ width: "auto", padding: "4px 8px", ...pill(a.status) }}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="num">{viewed[a.slug] || 0}</td>
                <td className="num">{launched[a.slug] || 0}</td>
                <td className="num" style={{ whiteSpace: "nowrap" }}>
                  <button className="btn ghost sm" onClick={() => { setForm(a); setShowImport(false); }}>Edit</button>{" "}
                  <button className="btn ghost sm" onClick={() => { if (confirm(`Delete ${a.company}?`)) post({ action: "delete", id: a.id }); }}>✕</button>
                </td>
              </tr>
            ))}
            {accounts.length === 0 && <tr><td colSpan={8} className="muted" style={{ padding: 18 }}>No accounts yet — add one or import a CSV.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
