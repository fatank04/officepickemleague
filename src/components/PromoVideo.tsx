"use client";
import { useState } from "react";

/**
 * The 43-second hero ad, self-hosted (public/promo-hero.mp4, ~8.2MB faststart encode).
 * Click-to-play with sound — the narration is the ad, so no muted autoplay.
 *
 * Rendered as a FACADE: just the poster <img> and a play button until the first tap, and only
 * then a real <video>. A parked <video controls> owns a native media layer on iOS, and scrolling
 * that layer out of the viewport stutters WebKit — this block sits exactly where the landing
 * page's scroll catch was reported. An <img> is just pixels; the media layer now exists only
 * while someone is actually watching.
 */
export default function PromoVideo({ caption }: { caption?: string }) {
  const [live, setLive] = useState(false);
  return (
    <div className="card" style={{ overflow: "hidden", marginTop: 12 }}>
      {live ? (
        <video
          controls
          autoPlay
          playsInline
          poster="/promo-hero-poster.jpg"
          style={{ display: "block", width: "100%", aspectRatio: "16 / 9", background: "#0d131d" }}
        >
          <source src="/promo-hero.mp4" type="video/mp4" />
          Your browser doesn&apos;t support video playback.
        </video>
      ) : (
        <button
          type="button"
          onClick={() => setLive(true)}
          aria-label="Play the video"
          style={{ position: "relative", display: "block", width: "100%", padding: 0, border: "none", background: "#0d131d", cursor: "pointer" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/promo-hero-poster.jpg"
            alt="Office Pick'em League — the office football pool for everyone"
            style={{ display: "block", width: "100%", aspectRatio: "16 / 9", objectFit: "cover" }}
          />
          <span
            aria-hidden="true"
            style={{
              position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
              width: 74, height: 74, borderRadius: "50%", background: "rgba(8,11,17,.62)",
              border: "1.5px solid rgba(255,255,255,.5)", display: "grid", placeItems: "center",
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff" style={{ marginLeft: 4 }}>
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      )}
      {caption ? (
        <div className="muted" style={{ padding: "8px 12px", fontSize: 12.5 }}>{caption}</div>
      ) : null}
    </div>
  );
}
