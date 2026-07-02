"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomeForm() {
  const router = useRouter();
  const [tab, setTab] = useState<"create" | "join">("create");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // create
  const [leagueName, setLeagueName] = useState("");
  const [cName, setCName] = useState("");
  const [cPin, setCPin] = useState("");
  // join
  const [slug, setSlug] = useState("");
  const [jName, setJName] = useState("");
  const [jPin, setJPin] = useState("");

  async function post(url: string, body: any) {
    setBusy(true);
    setErr("");
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error || "Something went wrong.");
      return null;
    }
    return data;
  }

  async function create() {
    const d = await post("/api/league", { leagueName, commishName: cName, pin: cPin });
    if (d) router.push(`/l/${d.slug}/picks`);
  }
  async function join() {
    const d = await post("/api/join", { slug: slug.trim(), name: jName, pin: jPin });
    if (d) router.push(`/l/${d.slug}/picks`);
  }

  return (
    <>
      <div className="card">
        <div className="row" style={{ padding: 14, borderBottom: "1px solid var(--line)", gap: 6 }}>
          <button className={`btn ${tab === "create" ? "" : "ghost"} sm`} onClick={() => setTab("create")}>
            Start a league
          </button>
          <button className={`btn ${tab === "join" ? "" : "ghost"} sm`} onClick={() => setTab("join")}>
            Join a league
          </button>
        </div>

        {tab === "create" ? (
          <div className="pad">
            <label>League name</label>
            <input value={leagueName} onChange={(e) => setLeagueName(e.target.value)} placeholder="Acme Office League" />
            <label>Your name (commissioner)</label>
            <input value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Ankur" />
            <label>Set a 4-digit PIN</label>
            <input value={cPin} onChange={(e) => setCPin(e.target.value)} inputMode="numeric" maxLength={4} placeholder="1234" />
            <button className="btn" style={{ width: "100%", marginTop: 14 }} disabled={busy} onClick={create}>
              Create league →
            </button>
          </div>
        ) : (
          <div className="pad">
            <label>League code (from your invite link)</label>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="acme-office-league-ab12" />
            <p className="muted" style={{ fontSize: 12.5, margin: "2px 0 8px" }}>
              Don&apos;t have a code? Ask your commissioner — it&apos;s the last part of your league&apos;s invite link.
            </p>
            <label>Your name</label>
            <input value={jName} onChange={(e) => setJName(e.target.value)} placeholder="Mike" />
            <label>Your 4-digit PIN</label>
            <input value={jPin} onChange={(e) => setJPin(e.target.value)} inputMode="numeric" maxLength={4} placeholder="first time? you're setting it" />
            <button className="btn" style={{ width: "100%", marginTop: 14 }} disabled={busy} onClick={join}>
              Join →
            </button>
          </div>
        )}
        {err && <div className="err" style={{ padding: "0 18px 16px" }}>{err}</div>}
      </div>
      <p className="muted small center">No app to download. Name + PIN, that&apos;s it.</p>
    </>
  );
}
