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
    default: "Office Pick'em League — workplace football pool",
    template: "%s · Office Pick'em League",
  },
  // "boost morale" is the phrase buyers actually type and say out loud — HR and owners
  // describe the problem that way, not as "engagement." Kept in the meta description
  // (search-visible) rather than the hero, which reads better in our own voice.
  description: "Boost morale at the office with a no-money, HR-safe NFL pick'em game employers run for their whole team. Players never pay. Two minutes a week by web, text, or paper.",
  // Bing Webmaster Tools ownership proof — must stay for the property to remain verified.
  verification: { other: { "msvalidate.01": "B4261D033136C6626EA2414247186F9B" } },
  keywords: ["office football pool", "NFL pick'em", "office pickem league", "workplace pick'em", "no-money football pool", "employee engagement game", "HR-safe office pool"],
  openGraph: {
    type: "website",
    siteName: "Office Pick'em League",
    title: "Office Pick'em League — the workplace football pool",
    description: "The employer-run, no-money NFL pick'em game for team engagement. Players never pay; two minutes a week by web, text, or paper sheet.",
    url: "https://officepickemleague.com",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Office Pick'em League — the workplace football pool" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Office Pick'em League — the workplace football pool",
    description: "No money, no app — the NFL pick'em game your whole workplace can play, night shift to nine-to-five.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${grotesk.variable}`}>
      <body>
        <MetaPixel />
        <AttribCapture />
        <main>{children}</main>
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
