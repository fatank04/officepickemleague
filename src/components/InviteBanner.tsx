"use client";
import { useState } from "react";

/**
 * Commissioner-facing invite surface. Shown on Picks when the roster is still
 * just the commissioner (the "now invite your team" onboarding moment), with a
 * compact copy-link row for established leagues via the `compact` prop.
 */
export default function InviteBanner({ slug, compact = false }: { slug: string; compact?: boolean }) {
  const [msg, setMsg] = useState("");
  const path = `/j/${slug}`;

  async function copy() {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      setMsg("Link copied — paste it anywhere your team talks.");
    } catch {
      setMsg(url); // clipboard blocked: show the URL so it can be copied manually
    }
    setTimeout(() => setMsg(""), 4000);
  }

  if (compact) {
    return (
      <div className="card pad spread" style={{ marginBottom: 12 }}>
        <span className="muted small">Invite link: <b style={{ color: "var(--text)" }}>officepickemleague.com{path}</b></span>
        <button className="btn ghost sm" onClick={copy} aria-label="Copy the invite link">📋 Copy invite link</button>
        {msg && <span className="small" style={{ color: "var(--accent)" }}>{msg}</span>}
      </div>
    );
  }

  return (
    <div className="card pad" style={{ marginBottom: 12, border: "1px solid var(--accent, #1ed47a)" }}>
      <div className="b" style={{ fontSize: 16 }}>🎉 Your league is live — now invite your team.</div>
      <p className="muted small" style={{ margin: "6px 0 10px", lineHeight: 1.5 }}>
        Anyone with this link can join in seconds (name + phone, or name + PIN on the web). Paste it in
        email, Slack, or a group text — or print it on a flyer for the break room.
      </p>
      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
        <code style={{ background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 8, padding: "8px 12px", fontSize: 13.5 }}>
          officepickemleague.com{path}
        </code>
        <button className="btn sm" onClick={copy} aria-label="Copy the invite link">📋 Copy link</button>
      </div>
      {msg && <div className="small" style={{ color: "var(--accent)", marginTop: 8 }}>{msg}</div>}
    </div>
  );
}
