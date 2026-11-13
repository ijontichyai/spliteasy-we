// Own SVG scenes (no licensed imagery). Colours come from theme tokens so they follow light/dark.
export type Scene = "cove" | "market" | "viewpoint" | "dinner";

export function SceneIllustration({ scene }: { scene: Scene }) {
  return (
    <svg viewBox="0 0 400 260" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={`sky-${scene}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--chart-3)" stopOpacity={scene === "dinner" ? 0.25 : 0.9} />
          <stop offset="1" stopColor="var(--accent)" stopOpacity={scene === "dinner" ? 0.5 : 0.55} />
        </linearGradient>
      </defs>
      <rect width="400" height="260" fill={scene === "dinner" ? "var(--primary)" : `url(#sky-${scene})`} />
      {scene === "dinner" && <rect width="400" height="260" fill={`url(#sky-${scene})`} />}
      {scene === "cove" && (
        <>
          <circle cx="300" cy="120" r="38" fill="var(--accent)" opacity="0.9" />
          <path d="M0 150 Q100 130 200 150 T400 150 V260 H0Z" fill="var(--primary)" opacity="0.85" />
          <path d="M0 185 Q120 165 240 185 T400 180 V260 H0Z" fill="var(--ring)" opacity="0.7" />
          <path d="M0 120 L80 70 L150 150 Z" fill="var(--foreground)" opacity="0.35" />
        </>
      )}
      {scene === "market" && (
        <>
          {[0, 1, 2, 3].map((i) => (
            <g key={i} transform={`translate(${20 + i * 95} 90)`}>
              <path d="M0 0 H85 L75 30 H10Z" fill={i % 2 ? "var(--accent)" : "var(--primary)"} />
              <rect x="10" y="30" width="65" height="90" fill="var(--card)" opacity="0.85" />
              <circle cx="28" cy="70" r="9" fill="var(--chart-5)" />
              <circle cx="50" cy="74" r="9" fill="var(--chart-4)" />
            </g>
          ))}
        </>
      )}
      {scene === "viewpoint" && (
        <>
          <circle cx="200" cy="150" r="60" fill="var(--accent)" opacity="0.85" />
          <path d="M0 170 L90 100 L170 170 L250 90 L400 190 V260 H0Z" fill="var(--primary)" opacity="0.9" />
          <path d="M0 210 L120 160 L260 215 L400 175 V260 H0Z" fill="var(--foreground)" opacity="0.45" />
        </>
      )}
      {scene === "dinner" && (
        <>
          {Array.from({ length: 9 }, (_, i) => (
            <circle key={i} cx={30 + i * 43} cy={40 + (i % 2) * 14} r="6" fill="var(--chart-3)" />
          ))}
          <path d="M0 40 Q200 80 400 40" stroke="var(--chart-3)" strokeOpacity="0.5" fill="none" />
          <rect x="40" y="170" width="320" height="16" rx="8" fill="var(--card)" opacity="0.9" />
          {[80, 150, 220, 290].map((x) => (
            <circle key={x} cx={x} cy="150" r="16" fill="var(--accent)" opacity="0.85" />
          ))}
        </>
      )}
    </svg>
  );
}
