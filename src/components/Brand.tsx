export function Mark() {
  return (
    <div className="mark">
      <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <g transform="rotate(-20 16 16)">
          <ellipse cx="16" cy="16" rx="12.5" ry="7.5" fill="#fff" />
          <path d="M8.5 16h15" stroke="#2f6bf0" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M12 14.4v3.2M15 14v4M18 14v4M21 14.4v3.2" stroke="#2f6bf0" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}

export function Brand() {
  return (
    <div className="brand">
      <Mark />
      <div>
        <div className="bname">
          Office <span>Pick&apos;em</span>
        </div>
        <div className="tagline">LEAGUE</div>
      </div>
    </div>
  );
}

export function Logo({ name, size = 22, color = "#39465f", abbr }: { name: string; size?: number; color?: string; abbr?: string }) {
  return (
    <span className="logo" style={{ width: size, height: size, background: color, fontSize: Math.max(8, Math.round(size * 0.4)) }}>
      {abbr ?? name.slice(0, 3).toUpperCase()}
    </span>
  );
}

// Original, license-safe team mark: a generic football helmet tinted with the
// team's own color. It is our own artwork — no NFL logo — so it needs no license.
// Team names/colors identify real games (see the disclaimer on the picks page).
export function TeamHelmet({ name, color = "#39465f", size = 22 }: { name: string; color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" role="img" aria-label={name}
      style={{ verticalAlign: "middle", flex: "none" }}>
      <path d="M5 18.5 A11.5 11 0 0 1 27.8 16.8 Q28 18.6 26 18.9 L18 20 Q16.4 20.2 16.4 21.8 L16.4 22.6 Q16.4 24 14.6 24 L8.5 24 Q5 24 5 20.6 Z"
        fill={color} stroke="rgba(255,255,255,.16)" strokeWidth=".7" />
      <circle cx="12.5" cy="17.4" r="2.5" fill="rgba(0,0,0,.32)" />
      <path d="M18.4 20.2 Q24.4 20 24.9 23.6" fill="none" stroke="#e6ebf5" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M16.9 22.6 L24.4 23.4" fill="none" stroke="#e6ebf5" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
