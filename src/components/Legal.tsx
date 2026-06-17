import Link from "next/link";
import { Brand } from "@/components/Brand";
import { LEGAL } from "@/lib/legal";

export type Section = { h?: string; p: string[] };

export function LegalPage({ title, sections }: { title: string; sections: Section[] }) {
  return (
    <div className="wrap" style={{ maxWidth: 780 }}>
      <div style={{ margin: "22px 0 10px" }}><Link href="/" style={{ textDecoration: "none" }}><Brand /></Link></div>
      <h1 style={{ marginBottom: 2 }}>{title}</h1>
      <p className="muted small" style={{ marginTop: 0 }}>Effective date: {LEGAL.effective}</p>
      {sections.map((s, i) => (
        <section key={i} style={{ marginTop: 18 }}>
          {s.h && <h2 style={{ fontSize: 18 }}>{s.h}</h2>}
          {s.p.map((para, j) => <p key={j} style={{ lineHeight: 1.6, color: "var(--text)" }}>{para}</p>)}
        </section>
      ))}
      <p className="muted small" style={{ marginTop: 28, borderTop: "1px solid var(--line)", paddingTop: 16 }}>
        {LEGAL.companyName}{LEGAL.address ? ` · ${LEGAL.address}` : ""} · {LEGAL.email} ·{" "}
        <Link href="/terms" style={{ color: "var(--accent)" }}>Terms</Link> ·{" "}
        <Link href="/privacy" style={{ color: "var(--accent)" }}>Privacy</Link> ·{" "}
        <Link href="/sms-terms" style={{ color: "var(--accent)" }}>SMS Terms</Link>
      </p>
    </div>
  );
}
