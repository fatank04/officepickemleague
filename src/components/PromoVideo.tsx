/**
 * The 43-second hero ad, self-hosted (public/promo-hero.mp4, ~8.2MB faststart encode).
 * Click-to-play with sound — the narration is the ad, so no muted autoplay. The poster
 * is the branded packshot frame, so the block reads as brand even if never played.
 */
export default function PromoVideo({ caption }: { caption?: string }) {
  return (
    <div className="card" style={{ overflow: "hidden", marginTop: 12 }}>
      <video
        controls
        preload="metadata"
        playsInline
        poster="/promo-hero-poster.jpg"
        style={{ display: "block", width: "100%", aspectRatio: "16 / 9", background: "#0d131d" }}
      >
        <source src="/promo-hero.mp4" type="video/mp4" />
        Your browser doesn&apos;t support video playback.
      </video>
      {caption ? (
        <div className="muted" style={{ padding: "8px 12px", fontSize: 12.5 }}>{caption}</div>
      ) : null}
    </div>
  );
}
