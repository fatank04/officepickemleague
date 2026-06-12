export function Mark() {
  return (
    <div className="mark">
      <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <g transform="rotate(-20 16 16)">
          <ellipse cx="16" cy="16" rx="12.5" ry="7.5" fill="#fff" />
          <path d="M8.5 16h15" stroke="#0c8f6f" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M12 14.4v3.2M15 14v4M18 14v4M21 14.4v3.2" stroke="#0c8f6f" strokeWidth="1.4" strokeLinecap="round" />
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
