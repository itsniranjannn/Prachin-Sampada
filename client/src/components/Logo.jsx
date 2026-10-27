// Logo: a temple niche in wine red holding the Devanagari initial "स" (Sampada), outlined in light sand.
// Wordmark: "हाम्रो प्राचीन" in Devanagari above "Sampada" in a classical serif.
export function LogoMark({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M8 62 V30 A24 24 0 0 1 56 30 V62 Z" fill="#81021f" />
      <path d="M13 62 V31 A19 19 0 0 1 51 31 V62" fill="none" stroke="#f6ebcf" strokeWidth="1.1" />
      <path d="M32 3.5 L34 8 L32 9.5 L30 8 Z" fill="#c9b27a" />
      <text x="32" y="50" textAnchor="middle" fontFamily="Martel, 'Noto Sans Devanagari', serif" fontWeight="800" fontSize="27" fill="#fff3e6">स</text>
      <path d="M17 56 H47" stroke="#c9b27a" strokeWidth="1.1" />
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
