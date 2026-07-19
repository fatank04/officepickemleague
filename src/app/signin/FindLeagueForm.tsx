"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Pull the league slug out of whatever a returning player pastes: a full URL,
// a /signin/slug path, or just the bare league name.
function toSlug(raw: string): string {
  let s = raw.trim().toLowerCase();
  if (!s) return "";
  s = s.replace(/^https?:\/\//, "").replace(/^www\./, "");
  const m = s.match(/signin\/([^/?#\s]+)/);
  if (m) return m[1];
  s = s.replace(/[?#].*$/, "").replace(/\/+$/, "");
  return s.split("/").filter(Boolean).pop() || "";
}

export default function FindLeagueForm() {
  const router = useRouter();
  const [val, setVal] = useState("");

  function go() {
    const slug = toSlug(val);
    if (!slug) return;
    router.push(`/signin/${slug}`);
  }

  return (
    <>
      <label>Your league&apos;s address</label>
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && go()}
        placeholder="officepickemleague.com/signin/…  or just the league name"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
      />
      <button className="btn" style={{ width: "100%", marginTop: 14 }} onClick={go}>
        Go to my league →
      </button>
    </>
  );
}
