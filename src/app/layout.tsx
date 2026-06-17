import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const grotesk = Space_Grotesk({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-grotesk" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://officepickemleague.com"),
  title: "Office Pick'em League — the office pool everyone can play",
  description: "A no-money, no-install NFL prediction game your whole team can play in two minutes a week — by web, text, or a phone call.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${grotesk.variable}`}>
      <body>
        {children}
        <footer style={{ textAlign: "center", padding: "26px 16px 34px", color: "var(--muted)", fontSize: 12.5 }}>
          <Link href="/terms" style={{ color: "var(--muted)" }}>Terms</Link> ·{" "}
          <Link href="/privacy" style={{ color: "var(--muted)" }}>Privacy</Link> ·{" "}
          <Link href="/sms-terms" style={{ color: "var(--muted)" }}>SMS Terms</Link>
          <div style={{ marginTop: 4 }}>No money, no app — players never pay.</div>
        </footer>
      </body>
    </html>
  );
}
