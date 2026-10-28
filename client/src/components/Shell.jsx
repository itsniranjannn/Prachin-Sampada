import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring } from 'framer-motion';
import Lenis from 'lenis';
import { Menu, X, Moon, Sun, SunMedium, LogOut, Stamp, Shield, Languages, ArrowUpRight, Github } from 'lucide-react';
import { Logo } from './Logo.jsx';
import { Mandala } from './Ornaments.jsx';
import { useAuth } from '../lib/auth.jsx';
import { usePrefs, useT } from '../lib/prefs.jsx';
import '../styles/shell-qa.css';

const LINKS = [
  { to: '/explore', en: 'Explore', np: 'घुम्नुहोस्' },
  { to: '/walk', en: 'Plan a yatra', np: 'यात्रा योजना' },
  { to: '/quiz', en: 'Quiz trail', np: 'क्विज' },
  { to: '/find', en: 'Find it', np: 'खोज' },
  { to: '/hunt', en: 'Live hunt', np: 'लाइभ खेल' },
];

const MandalaRing = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="-50 -50 100 100" fill="none" stroke="currentColor" strokeWidth="3">
    {Array.from({ length: 8 }, (_, i) => <path key={i} d="M0 -12 C 9 -24 5 -40 0 -44 C -5 -40 -9 -24 0 -12Z" transform={`rotate(${i * 45})`} />)}
    <circle r="9" />
  </svg>
);

export function Loader({ label = 'Loading…' }) {
  return (
    <div className="loader" role="status" aria-label={label}>
      <span className="loader-mandala"><MandalaRing size={74} /><MandalaRing size={74} /><span className="loader-flame" /></span>
      <span className="small">{label}</span>
    </div>
  );
}

export function PageLoader() {
  return <div className="page" style={{ display: 'grid', placeItems: 'center' }}><Loader /></div>;
}

/** Lenis smooth scrolling on content pages; map pages keep native scrolling. */
export function SmoothScroll({ enabled }) {
  useEffect(() => {
    if (!enabled || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)), smoothWheel: true });
    window.__lenis = lenis;
    let id = 0;
    const raf = (time) => { lenis.raf(time); id = requestAnimationFrame(raf); };
    id = requestAnimationFrame(raf);
    return () => { cancelAnimationFrame(id); lenis.destroy(); window.__lenis = null; };
  }, [enabled]);
  return null;
}

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 26, mass: 0.3 });
  return <motion.div className="scroll-progress" style={{ scaleX }} aria-hidden="true" />;
}

export function Nav() {
  const { user, logout } = useAuth();
  const { theme, setTheme, nepali, setNepali } = usePrefs();
  const t = useT();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const loc = useLocation();
  const nav = useNavigate();
  const { scrollY } = useScroll();
  useEffect(() => setOpen(false), [loc.pathname]);
  useEffect(() => {
    document.documentElement.style.overflow = open ? 'hidden' : '';
    if (open) window.__lenis?.stop(); else window.__lenis?.start();
  }, [open]);
  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 16);
    setHidden(y > 240 && y > prev + 2 && !open);
    if (y < prev - 2) setHidden(false);
  });
  const nextTheme = { light: 'dark', dark: 'dhoop', dhoop: 'light' }[theme] || 'light';
  const ThemeIcon = theme === 'dark' ? Moon : theme === 'dhoop' ? SunMedium : Sun;
  const themeLabel = { light: 'Light theme', dark: 'Ratri (dark) theme', dhoop: 'Dhoop (outdoor, high contrast)' }[theme];
  const themeShort = { light: ['Light theme', 'उज्यालो मोड'], dark: ['Ratri theme', 'रात्री मोड'], dhoop: ['Dhoop theme', 'घाम मोड'] }[theme] || ['Theme', 'मोड'];
  const onHome = loc.pathname === '/';
  return (
    <>
      <motion.header
        className={`nav ${scrolled || !onHome ? 'solid' : ''} ${onHome && !scrolled ? 'over-dark' : ''}`}
        animate={{ y: hidden ? -110 : 0 }}
        transition={{ duration: 0.35, ease: [0.22, 0.9, 0.24, 1] }}
      >
        <div className="wrap nav-row">
          <Link to="/" className="nav-brand" aria-label="Hamro Prachin Sampada home"><Logo /></Link>
          <nav className="nav-links" aria-label="Main">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? 'active' : '')}>
                {({ isActive }) => (
                  <>
                    {isActive && <motion.span layoutId="nav-pill" className="nav-pill" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                    <span className="nav-label" lang={nepali ? 'ne' : undefined}>{t(l.en, l.np)}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="nav-tools">
            <button className="icon-btn" title={nepali ? 'Show English first' : 'नेपालीमा हेर्नुहोस्'} aria-label="Toggle Nepali labels" aria-pressed={nepali} onClick={() => setNepali(!nepali)}><Languages size={17} /></button>
            <button className="icon-btn" title={`${themeLabel}. Click to switch`} aria-label={themeLabel} onClick={() => setTheme(nextTheme)}><ThemeIcon size={17} /></button>
            {user ? (
              <div className="nav-user">
                <Link to="/passport" className="avatar" title="My heritage passport">{user.name.slice(0, 1).toUpperCase()}</Link>
                <div className="nav-user-menu">
                  <div className="small"><b>{user.name}</b><br /><span className="muted">{user.level?.label}</span></div>
                  <Link to="/passport"><Stamp size={16} /> My passport</Link>
                  {user.role === 'admin' && <Link to="/admin"><Shield size={16} /> Admin</Link>}
                  <button onClick={() => { logout(); nav('/'); }}><LogOut size={16} /> {t('Log out', 'लगआउट')}</button>
                </div>
              </div>
            ) : (
              <Link className="btn sm nav-signin" to="/login">{t('Sign in', 'साइन इन')}</Link>
            )}
            <button className="icon-btn nav-burger" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X size={18} /> : <Menu size={18} />}</button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div className="mnav" initial={{ clipPath: 'circle(0% at 92% 4%)' }} animate={{ clipPath: 'circle(150% at 92% 4%)' }} exit={{ clipPath: 'circle(0% at 92% 4%)' }} transition={{ duration: 0.6, ease: [0.22, 0.9, 0.24, 1] }}>
            <Mandala size={620} className="mnav-mandala spin-slow" strokeWidth={0.8} />
            <nav className="mnav-links" aria-label="Mobile">
              {[...LINKS, ...(user ? [{ to: '/passport', en: 'My passport', np: 'मेरो पासपोर्ट' }] : []), ...(user?.role === 'admin' ? [{ to: '/admin', en: 'Admin', np: 'एडमिन' }] : [])].map((l, i) => (
                <motion.div key={l.to} initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 + i * 0.06, duration: 0.5, ease: [0.22, 0.9, 0.24, 1] }}>
                  <NavLink to={l.to} className={({ isActive }) => (isActive ? 'active' : '')}>
                    <span className="mnav-num">{String(i + 1).padStart(2, '0')}</span>
                    {/* the language in use leads; the other sits underneath so the two lines never repeat */}
                    <span className="mnav-en" lang={nepali ? 'ne' : undefined}>{nepali ? l.np : l.en}</span>
                    <span className="mnav-np" lang={nepali ? 'en' : 'ne'} data-notranslate>{nepali ? l.en : l.np}</span>
                  </NavLink>
                </motion.div>
              ))}
            </nav>
            <motion.div className="mnav-foot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              <div className="row">
                <button className="btn light-ghost sm" onClick={() => setTheme(nextTheme)}><ThemeIcon size={15} /> {t(...themeShort)}</button>
                <button className="btn light-ghost sm" onClick={() => setNepali(!nepali)}><Languages size={15} /> <span data-notranslate>{nepali ? 'English' : 'नेपाली'}</span></button>
              </div>
              {user ? <button className="btn light-ghost" onClick={() => { logout(); nav('/'); }}><LogOut size={16} /> {t('Log out', 'लगआउट')}</button>
                : <Link className="btn" to="/login">{t('Sign in', 'साइन इन')} <ArrowUpRight size={16} /></Link>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


export function Footer() {
  const t = useT();
  return (
    <footer className="footer">
      <Mandala size={720} className="footer-mandala spin-slow" strokeWidth={0.7} />
      <div className="wrap footer-cta">
        <div>
          <div className="eyebrow">{t('Begin the yatra', 'यात्रा सुरु गरौं')}</div>
          <h2>Every courtyard in Nepal has a story waiting for you.</h2>
        </div>
        <Link to="/explore" className="btn lg diyo">{t('Open the map', 'नक्सा खोल्नुहोस्')} <ArrowUpRight size={18} className="arrow" /></Link>
      </div>
      <div className="wrap footer-grid">
        <div>
          <Logo />
          <p className="small footer-about">
            A free, bilingual way to walk, play and learn the living heritage of Nepal: temples, stupas, palaces, ghats and
            pilgrim trails across all seven provinces.
          </p>
        </div>
        <div>
          <h5>Explore</h5>
          <Link to="/explore">Story map</Link><Link to="/walk">Plan a yatra</Link><Link to="/explore?unesco=1">UNESCO sites</Link>
        </div>
        <div>
          <h5>Play</h5>
          <Link to="/quiz">Adaptive quiz trail</Link><Link to="/find">Find the monument</Link><Link to="/hunt">Live heritage hunt</Link><Link to="/leaderboard">Leaderboard</Link>
        </div>
        <div>
          <h5>About</h5>
          <Link to="/about">How it works</Link><Link to="/credits">Photo credits &amp; sources</Link>
          <a href="https://github.com/itsniranjannn/Prachin-Sampada" target="_blank" rel="noreferrer"><Github size={14} style={{ verticalAlign: '-2px' }} /> Source code</a>
        </div>
      </div>
      <div className="wrap footer-base">
        <span>© {new Date().getFullYear()} Hamro Prachin Sampada · BCA Project III</span>
        <span lang="ne">सम्पदा जोगाऔं, अर्को पुस्तालाई सुम्पौं</span>
      </div>
    </footer>
  );
}

/** Route transition: content rises in while a brass line sweeps across. */
export function PageFade({ children }) {
  const loc = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.main key={loc.pathname} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, ease: [0.22, 0.9, 0.24, 1] }}>
        {children}
      </motion.main>
    </AnimatePresence>
  );
}
