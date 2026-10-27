// Logo: a wine-red seal holding a shikhara spire with its kalash finial on a stepped plinth, ringed in light sand.
// Wordmark: "हाम्रो प्राचीन" in a bold Devanagari display face over "Sampada" in a flowing italic serif.
export function LogoMark({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="31" fill="#81021f" />
      <circle cx="32" cy="32" r="27.5" fill="none" stroke="#f6ebcf" strokeWidth="0.9" />
      <circle cx="32" cy="32" r="25.6" fill="none" stroke="#f6ebcf" strokeWidth="0.5" strokeDasharray="0.6 2.2" />
      <path d="M32 9.2 L33.1 12 L32 13 L30.9 12 Z" fill="#f6ebcf" />
      <circle cx="32" cy="14.6" r="1.7" fill="#f6ebcf" />
      <path d="M29.2 17 H34.8 L34.2 18.2 H29.8 Z" fill="#f6ebcf" />
      <path d="M32 18.4 C 36.4 24 38.6 32 38.8 43 H25.2 C25.4 32 27.6 24 32 18.4 Z" fill="#f6ebcf" />
      <path d="M27.2 26.5 H36.8 M26.1 31.5 H37.9 M25.5 36.5 H38.5" stroke="#81021f" strokeWidth="0.8" />
      <path d="M30 43 V39.5 A2 2 0 0 1 34 39.5 V43 Z" fill="#81021f" />
      <rect x="21.5" y="43" width="21" height="2.6" fill="#f6ebcf" />
      <rect x="18.5" y="46.4" width="27" height="2.6" fill="#f6ebcf" />
      <rect x="15.5" y="49.8" width="33" height="2.6" fill="#f6ebcf" />
    </svg>
  );
}

export function Logo({ compact = false }) {
  return (
    <span className="logo">
      <LogoMark size={compact ? 38 : 44} />
      <span className="logo-words">
        <span className="logo-kicker" lang="ne">हाम्रो प्राचीन</span>
        <span className="logo-en">Sampada</span>
      </span>
    </span>
  );
}
