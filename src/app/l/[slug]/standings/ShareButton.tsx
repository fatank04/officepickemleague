"use client";
import { useState } from "react";

export default function ShareButton({ slug, pid }: { slug: string; pid: string }) {
  const [msg, setMsg] = useState("");
  async function share() {
    const url = `${window.location.origin}/r/${slug}/${pid}`;
    try {
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share({ title: "My Pick'em week", text: "Here's my week in our Office Pick'em League 🏈", url });
        return;
      }
    } catch { return; }
    try { await navigator.clipboard.writeText(url); setMsg("Link copied!"); setTimeout(() => setMsg(""), 2000); }
    catch { setMsg(url); }
  }
  return (
    <div style={{ margin: "10px 0 18px" }}>
      <button className="btn" onClick={share}>Share my week 🏈</button>
      {msg && <span className="muted small" style={{ marginLeft: 10 }}>{msg}</span>}
    </div>
  );
}
