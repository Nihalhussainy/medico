export default function BrandLogo({ compact = false, size = "md", className = "" }) {
  const svgSizes = { sm: 32, md: 48, lg: 72 };
  const textSizes = {
    sm: { name: 18, sub: 7.5, gap: 3 },
    md: { name: 26, sub: 9,   gap: 4 },
    lg: { name: 38, sub: 12,  gap: 5 },
  };
  const svgW = svgSizes[size] || svgSizes.md;
  const t = textSizes[size] || textSizes.md;

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Pure glyph — no box, no tile */}
      <svg width={svgW} height={svgW} viewBox="0 0 72 72" fill="none" aria-hidden="true">
        <defs>
          <radialGradient id="hFill" cx="42%" cy="32%" r="62%" gradientUnits="objectBoundingBox">
            <stop offset="0%"   stopColor="#fecaca" />
            <stop offset="28%"  stopColor="#ef4444" />
            <stop offset="58%"  stopColor="#b91c1c" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </radialGradient>
          <radialGradient id="hGloss" cx="35%" cy="22%" r="55%" gradientUnits="objectBoundingBox">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.55)" />
            <stop offset="50%"  stopColor="rgba(255,255,255,0.10)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>

        {/* Heart — 3D fill + drop shadow */}
        <path
          d="M36 62C36 62 10 47 10 28.5C10 20.5 16.5 14 24.5 14C29.5 14 33.5 16.5 36 20C38.5 16.5 42.5 14 47.5 14C55.5 14 62 20.5 62 28.5C62 47 36 62 36 62Z"
          fill="url(#hFill)"
        />
        {/* Gloss overlay */}
        <path
          d="M36 62C36 62 10 47 10 28.5C10 20.5 16.5 14 24.5 14C29.5 14 33.5 16.5 36 20C38.5 16.5 42.5 14 47.5 14C55.5 14 62 20.5 62 28.5C62 47 36 62 36 62Z"
          fill="url(#hGloss)"
        />

        {/* ECG pulse */}
        <path
          d="M14 35H22L25.5 29L30 40L34 30.5L37.5 35H58"
          stroke="#ffffff"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>

      {!compact && (
        <span style={{ display: "flex", flexDirection: "column" }}>
          <span style={{
            fontFamily: "'Outfit', system-ui, sans-serif",
            fontSize: t.name,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            color: "#0f0d14",
          }}>
            medico
            <span style={{
              background: "linear-gradient(135deg, #7c3aed, #a855f7, #c084fc)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>.</span>
          </span>
          <span style={{
            fontFamily: "'Outfit', system-ui, sans-serif",
            fontSize: t.sub,
            fontWeight: 500,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#9ca3af",
            marginTop: t.gap,
          }}>
            Health Cloud
          </span>
        </span>
      )}
    </span>
  );
}