// Hindu ornament set drawn as SVG, all in currentColor so they take the brass, saffron or ivory of their context.
// Mandala and lotus are generated from petal paths; nothing here is an image asset.

const petal = (r1, r2, w) => `M0 ${-r1} C ${w} ${-(r1 + r2) / 2} ${w * 0.6} ${-r2} 0 ${-r2} C ${-w * 0.6} ${-r2} ${-w} ${-(r1 + r2) / 2} 0 ${-r1}Z`;

/** A layered mandala: rings of petals, dots and a lotus core. */
export function Mandala({ size = 400, className = '', strokeWidth = 1, rings = 4, style }) {
  const out = [];
  const layers = [
    { n: 8, r1: 14, r2: 44, w: 16 },
    { n: 16, r1: 46, r2: 86, w: 14 },
    { n: 24, r1: 92, r2: 128, w: 11 },
    { n: 32, r1: 134, r2: 170, w: 9 },
    { n: 48, r1: 176, r2: 196, w: 6 },
  ].slice(0, rings + 1);
  layers.forEach((l, li) => {
    for (let i = 0; i < l.n; i += 1) {
      const a = (360 / l.n) * i + (li % 2 ? 180 / l.n : 0);
      out.push(<path key={`p${li}-${i}`} d={petal(l.r1, l.r2, l.w)} transform={`rotate(${a})`} />);
    }
    out.push(<circle key={`c${li}`} r={l.r2 + 3} strokeDasharray={li % 2 ? '1 5' : undefined} />);
  });
  for (let i = 0; i < 48; i += 1) out.push(<circle key={`d${i}`} r="2" cx="0" cy={-(layers.at(-1).r2 + 10)} transform={`rotate(${i * 7.5})`} fill="currentColor" stroke="none" />);
  return (
    <svg className={className} style={style} width={size} height={size} viewBox="-215 -215 430 430" fill="none" stroke="currentColor" strokeWidth={strokeWidth} aria-hidden="true">
      {out}
      <circle r="9" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Lotus (padma) seen from the side. */
export function Lotus({ size = 28, className = '', filled = false }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
      <path d="M32 10 C 40 20 40 34 32 46 C 24 34 24 20 32 10Z" />
      <path d="M32 46 C 26 34 16 28 8 28 C 10 38 18 46 32 46Z" />
      <path d="M32 46 C 38 34 48 28 56 28 C 54 38 46 46 32 46Z" />
      <path d="M32 46 C 22 40 14 40 4 44 C 12 50 22 50 32 46Z" opacity=".75" />
      <path d="M32 46 C 42 40 50 40 60 44 C 52 50 42 50 32 46Z" opacity=".75" />
      <path d="M18 54 H46" strokeLinecap="round" />
    </svg>
  );
}

/** Diyo (oil lamp) with an animated flame. */
export function Diyo({ size = 28, className = '' }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <radialGradient id="diyo-f" cx="50%" cy="70%" r="60%"><stop offset="0" stopColor="#fff6d6" /><stop offset=".45" stopColor="#f5b566" /><stop offset="1" stopColor="#e8871e" /></radialGradient>
      </defs>
      <path className="diyo-flame" d="M32 8 C 38 18 38 26 32 32 C 26 26 26 18 32 8Z" fill="url(#diyo-f)" style={{ transformOrigin: '32px 32px', animation: 'flicker .9s ease-in-out infinite alternate' }} />
      <path d="M6 36 C 10 50 22 56 32 56 C 42 56 54 50 58 36 C 46 40 18 40 6 36Z" fill="currentColor" />
      <path d="M44 36 L60 30 L56 38Z" fill="currentColor" />
    </svg>
  );
}

/** Temple bell (ghanta). */
export function Bell({ size = 24, className = '' }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" aria-hidden="true">
      <path d="M32 4 v6" /><circle cx="32" cy="12" r="3" />
      <path d="M20 46 C 20 30 22 16 32 16 C 42 16 44 30 44 46Z" />
      <path d="M14 46 H50 L46 52 H18Z" /><circle cx="32" cy="57" r="3.4" fill="currentColor" />
    </svg>
  );
}

/** Trishul (Shiva's trident). */
export function Trishul({ size = 24, className = '' }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M32 6 L36 16 L32 22 L28 16Z" fill="currentColor" />
      <path d="M32 22 V60" />
      <path d="M14 10 C 12 22 18 30 32 30 C 46 30 52 22 50 10" />
      <path d="M26 40 h12" /><circle cx="32" cy="44" r="3" />
    </svg>
  );
}

/** Sudarshan chakra (Vishnu's wheel). */
export function Chakra({ size = 24, className = '' }) {
  const spokes = Array.from({ length: 12 }, (_, i) => <path key={i} d="M32 32 L32 12" transform={`rotate(${i * 30} 32 32)`} />);
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="32" cy="32" r="24" /><circle cx="32" cy="32" r="20" strokeDasharray="3 3" />{spokes}<circle cx="32" cy="32" r="5" fill="currentColor" />
    </svg>
  );
}

/** Kalash (sacred water pot) with mango leaves and a coconut. */
export function Kalash({ size = 24, className = '' }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" aria-hidden="true">
      <circle cx="32" cy="12" r="6" fill="currentColor" />
      <path d="M22 20 C 18 14 14 16 12 18 C 16 20 18 22 22 22Z M42 20 C 46 14 50 16 52 18 C 48 20 46 22 42 22Z" />
      <path d="M22 22 H42 V26 H22Z" />
      <path d="M24 26 C 12 30 12 52 24 56 H40 C 52 52 52 30 40 26Z" />
      <path d="M17 40 H47" strokeDasharray="2 3" />
    </svg>
  );
}

/** Dharma wheel for Buddhist sites. */
export function Dharmachakra({ size = 24, className = '' }) {
  const spokes = Array.from({ length: 8 }, (_, i) => <path key={i} d="M32 32 L32 10" transform={`rotate(${i * 45} 32 32)`} />);
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
      <circle cx="32" cy="32" r="22" />{spokes}<circle cx="32" cy="32" r="6" fill="currentColor" />
    </svg>
  );
}

/** Om, set in the calligraphic Devanagari face. */
export function Om({ size = 28, className = '' }) {
  return <span className={`script ${className}`} style={{ fontSize: size, lineHeight: 1 }} aria-hidden="true">ॐ</span>;
}

/** Brass divider with a lotus in the middle. */
export function OrnDivider({ width = 260, children }) {
  return (
    <div className="orn-divider" style={{ width }} aria-hidden="true">
      {children || <i className="orn-dot" />}
    </div>
  );
}

/** A hanging marigold toran; `sway` makes it move gently. */
export function Toran({ sway = true, className = '' }) {
  return <div className={`toran-strip ${sway ? 'sway' : ''} ${className}`} aria-hidden="true" />;
}

/** Icon for a deity or faith tradition, used in chips and site facts. */
export function FaithIcon({ deity = '', religion = '', size = 18 }) {
  const d = `${deity} ${religion}`.toLowerCase();
  if (/shiva|mahadev|pashupati|bhairav|lingam|kedar|kumbheshwar|gokarn/.test(d)) return <Trishul size={size} />;
  if (/vishnu|narayan|krishna|ram\b|rama|jagannath|janaki|sita|dattatreya/.test(d)) return <Chakra size={size} />;
  if (/buddh|lokeshwar|bodhisattva|maya devi|tara|stupa/.test(d)) return <Dharmachakra size={size} />;
  if (/devi|durga|kali|taleju|bhagawati|kumari|parvati|laxmi|lakshmi|barahi|guhyeshwari|shakti/.test(d)) return <Lotus size={size} />;
  return <Bell size={size} />;
}
