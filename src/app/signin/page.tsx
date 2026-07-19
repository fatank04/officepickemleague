import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/components/Brand";
import FindLeagueForm from "./FindLeagueForm";

export const metadata: Metadata = {
  title: { absolute: "Sign in — Office Pick'em League" },
  description:
    "Every Office Pick'em League has its own sign-in link. Find your league and sign in with your name and 4-digit PIN.",
  alternates: { canonical: "/signin" },
  robots: { index: false, follow: true },
};

export default function SignInLanding() {
  return (
    <div className="wrap" style={{ maxWidth: 420 }}>
      <div style={{ textAlign: "center", margin: "30px 0 16px" }}>
        <Link href="/" style={{ display: "inline-block" }}><Brand /></Link>
      </div>
      <div className="card pad">
        <h1 style={{ marginTop: 0, fontSize: 24 }}>Sign in to your league</h1>
        <p className="muted small" style={{ marginTop: 0 }}>
          Each league has its own sign-in link. Yours came in your welcome text or email and looks
          like <b>officepickemleague.com/signin/your-league</b>. Paste it below, or just type your
          league&apos;s name.
        </p>
        <FindLeagueForm />
        <p className="muted small" style={{ marginTop: 16 }}>
          Don&apos;t have your link? Ask whoever set up your league — they&apos;ve got it.
        </p>
        <p className="muted small center" style={{ marginTop: 14 }}>
          Want to run one for your workplace?{" "}
          <Link href="/#start" style={{ color: "var(--accent)" }}>Start a league →</Link>
        </p>
      </div>
    </div>
  );
}
