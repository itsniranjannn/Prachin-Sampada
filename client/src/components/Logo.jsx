// Logo: a lotus (padma) carrying a three-tier pagoda inside a temple arch, in wine red and light sand.
// On hover the lotus opens, the roofs lift one after another, the ring turns faster and the kalash glows.
// Wordmark: "हाम्रो" (tilted) beside "प्राचीन" on top, "Sampada" below in an inscription face.

/** One pagoda roof: apex (32, y0), eaves at y1 with upturned tips, half-width w. */
const roof = (y0, y1, w) => {
  const mid = y0 + (y1 - y0) * 0.62;
  return `M32 ${y0} C ${32 + w * 0.1} ${mid} ${32 + w * 0.52} ${y1 - 1.5} ${32 + w} ${y1 - 2.6} Q ${32 + w + 1.6} ${y1 - 1.9} ${32 + w - 0.8} ${y1} L ${32 - w + 0.8} ${y1} Q ${32 - w - 1.6} ${y1 - 1.9} ${32 - w} ${y1 - 2.6} C ${32 - w * 0.52} ${y1 - 1.5} ${32 - w * 0.1} ${mid} 32 ${y0} Z`;
};
const PETALS = [-62, -36, -12, 12, 36, 62];

export function LogoMark({ size = 40 }) {
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="lm-wine" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9c1a35" /><stop offset="1" stopColor="#5e0117" /></linearGradient>
        <radialGradient id="lm-glow" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#d2b8ff" stopOpacity=".95" /><stop offset="1" stopColor="#d2b8ff" stopOpacity="0" /></radialGradient>
      </defs>
      <path d="M5 61 V29 A27 27 0 0 1 59 29 V61 Z" fill="url(#lm-wine)" />
      <path d="M5 61 V29 A27 27 0 0 1 59 29 V61" fill="none" stroke="#f6ebcf" strokeWidth="1.1" />
      <g className="lm-ring">
        <circle cx="32" cy="29" r="22.5" fill="none" stroke="#f6ebcf" strokeOpacity=".5" strokeWidth=".7" strokeDasharray="1 3.2" />
      </g>
      <circle className="lm-glow" cx="32" cy="9.6" r="6" fill="url(#lm-glow)" />
      <path className="lm-kalash" d="M32 5.2 L33 8 L32 9 L31 8 Z M32 9.2 a1.5 1.5 0 1 1 0.01 0 Z" fill="#f6ebcf" />
      <g className="lm-tiers">
        <g className="lm-tier t3">
          <rect x="29" y="14" width="6" height="2.6" fill="#fff3e6" />
          <path d={roof(10.6, 17, 8.4)} fill="#f6ebcf" />
        </g>
        <g className="lm-tier t2">
          <rect x="27" y="22" width="10" height="2.8" fill="#fff3e6" />
          <path d={roof(17.6, 25, 12)} fill="#f6ebcf" />
        </g>
        <g className="lm-tier t1">
          <rect x="24.4" y="31" width="15.2" height="3" fill="#fff3e6" />
          <path d={roof(24.6, 33.4, 15.6)} fill="#f6ebcf" />
          <rect x="30" y="32.4" width="4" height="4.4" rx="0.4" fill="#81021f" />
        </g>
      </g>
      <rect x="17" y="37" width="30" height="2.4" fill="#f6ebcf" />
      <rect x="14" y="39.6" width="36" height="2.4" fill="#f6ebcf" />
      <g className="lm-lotus">
        {PETALS.map((r, i) => (
          <path key={r} className="lm-petal" style={{ '--r': `${r}deg`, '--d': `${Math.abs(i - 2.5) * 40}ms` }} d="M32 59 C 26.6 53.4 27 47.6 32 44.2 C 37 47.6 37.4 53.4 32 59 Z" fill={i % 2 ? '#d2b8ff' : '#f6ebcf'} stroke="#81021f" strokeWidth=".7" />
        ))}
        <path className="lm-petal mid" style={{ '--r': '0deg' }} d="M32 59.4 C 27.4 53 27.8 46.4 32 42.6 C 36.2 46.4 36.6 53 32 59.4 Z" fill="#fff3e6" stroke="#81021f" strokeWidth=".7" />
      </g>
    </svg>
  );
}

export function Logo({ compact = false }) {
  return (
    <span className="logo">
      <LogoMark size={compact ? 44 : 54} />
      <span className="logo-words">
        <span className="logo-top" lang="ne">
          <span className="logo-hamro">हाम्रो</span>
          <span className="logo-prachin">प्राचीन</span>
        </span>
        <span className="logo-en">Sampada</span>
      </span>
    </span>
  );
}
