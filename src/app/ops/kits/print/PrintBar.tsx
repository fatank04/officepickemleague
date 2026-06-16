"use client";
import Link from "next/link";

export default function PrintBar({ label }: { label: string }) {
  return (
    <div className="print-hide" style={{ position: "sticky", top: 0, background: "var(--bg, #fff)", padding: "10px 0", display: "flex", gap: 10, alignItems: "center", borderBottom: "1px solid #ccc", marginBottom: 16, zIndex: 10 }}>
      <button onClick={() => window.print()} style={{ padding: "8px 16px", fontWeight: 800, borderRadius: 8, border: 0, background: "#4f8cff", color: "#fff", cursor: "pointer" }}>🖨 Print {label}</button>
      <Link href="/ops/kits/print" style={{ color: "#4f8cff", fontWeight: 700 }}>← Print hub</Link>
      <span style={{ color: "#888", fontSize: 13 }}>Tip: in the print dialog set margins to “Default”, scale 100%, and enable “Background graphics”.</span>
    </div>
  );
}
