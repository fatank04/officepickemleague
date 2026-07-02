import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import MetaPixel from "@/components/MetaPixel";
import AttribCapture from "@/components/AttribCapture";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const grotesk = Space_Grotesk({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-grotesk" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://officepickemleague.com"),
  title: {
    default: "Office Pick'em League — the office pool everyone can play",
    template: "%s · Office Pick'em League",
  },
  description: "A no-money, no-install NFL prediction game your whole team can play in two minutes a week — by web, text, or a phone call.",
  keywords: ["office football pool", "NFL pick'em", "office pickem league", "workplace pick'em", "no-money football pool", "employee engagement game", "HR-safe office pool"],
  openGraph: {
    type: "website",
    siteName: "Office Pick'em League",
    title: "Office Pick'em League — the office pool everyone can play",
    description: "No money, no app — your whole team picks winners, spreads & over/unders in two minutes a week. By web, text, or a phone call.",
    url: "https://officepickemleague.com",
  },
  twitter: {
    card: "summary",
    title: "Office Pick'em League — the office pool everyone can play",
    description: "No money, no app — the NFL pick'em game your whole workplace can play, from the floor to the front office.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${grotesk.variable}`}>
      <body>
        <MetaPixel />
        <AttribCapture />
        {children}
        <footer style={{ textAlign: "center", padding: "26px 16px 34px", color: "var(--muted)", fontSize: 12.5 }}>
          <Link href="/pricing" style={{ color: "var(--muted)" }}>Pricing</Link> ·{" "}
          <Link href="/terms" style={{ color: "var(--muted)" }}>Terms</Link> ·{" "}
          <Link href="/privacy" style={{ color: "var(--muted)" }}>Privacy</Link> ·{" "}
          <Link href="/sms-terms" style={{ color: "var(--muted)" }}>SMS Terms</Link>
          <div style={{ marginTop: 4 }}>No money, no app — players never pay.</div>
        </footer>
      </body>
    </html>
  );
}
