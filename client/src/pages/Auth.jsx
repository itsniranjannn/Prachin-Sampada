import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { LogoMark } from '../components/Logo.jsx';

const ART = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/View_of_Bhaktapur_Durbar_Square.jpg/1280px-View_of_Bhaktapur_Durbar_Square.jpg';
const INTERESTS = [['hindu', 'Hindu temples'], ['buddhist', 'Buddhist sites'], ['pagoda', 'Pagodas'], ['stupa', 'Stupas'], ['palace', 'Palaces'], ['courtyard', 'Courtyards'], ['art', 'Art & carving'], ['legend', 'Legends'], ['water', 'Water heritage'], ['festival', 'Festivals']];

export default function Auth({ mode }) {
  const isLogin = mode === 'login';
  const { login, register } = useAuth();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '', interests: [] });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const next = params.get('next') || (isLogin ? '/passport' : '/explore');

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      if (isLogin) await login(f.email, f.password);
      else await register(f);
      nav(isLogin ? next : `/verify?next=${encodeURIComponent(next)}`, { replace: true });
    } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <div className="page auth">
      <div className="wrap auth-grid">
        <motion.div className="auth-art" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <img src={ART} alt="" />
          <p lang="sa" className="shloka-dev" style={{ fontSize: '1.35rem', color: 'var(--sand)', marginBottom: '1rem' }}>कर्मण्येवाधिकारस्ते मा फलेषु कदाचन</p>
          <h2 style={{ color: 'var(--milk)' }}>{isLogin ? 'Welcome back, explorer' : 'Your heritage passport'}</h2>
          <p style={{ color: 'rgba(255, 243, 230, 0.8)' }}>{isLogin ? 'Pick up your quiz rating, stamps and saved walks.' : 'Stamp monuments on site, keep your quiz rating, save walks and earn badges from Pahilo Paila to Sapta Sampada.'}</p>
          <p lang="ne" className="np" style={{ color: 'var(--lilac-300)', fontSize: '1.05rem', margin: 0 }}>सम्पदा हाम्रो पहिचान</p>
        </motion.div>
        <motion.form className="card pad-l auth-form" onSubmit={submit} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <LogoMark size={48} />
          <h2 style={{ marginTop: '0.8rem' }}>{isLogin ? 'Sign in' : 'Create your passport'}</h2>
          {!isLogin && <div className="field"><label htmlFor="n">Name</label><input id="n" className="input" value={f.name} onChange={set('name')} autoComplete="name" required minLength={2} /></div>}
          <div className="field"><label htmlFor="e">Email</label><input id="e" className="input" type="email" value={f.email} onChange={set('email')} autoComplete="email" required /></div>
          <div className="field"><label htmlFor="p">Password</label><input id="p" className="input" type="password" value={f.password} onChange={set('password')} autoComplete={isLogin ? 'current-password' : 'new-password'} required minLength={6} /><span className="cap">{isLogin ? <Link to="/forgot">Forgot your password?</Link> : 'At least 6 characters.'}</span></div>
          {!isLogin && (
            <div className="field"><label>What draws you? <span className="cap">(optional)</span></label>
              <div className="chips-row" style={{ marginTop: 0 }}>{INTERESTS.map(([k, l]) => <button type="button" key={k} className={`chip ${f.interests.includes(k) ? 'on' : ''}`} onClick={() => setF({ ...f, interests: f.interests.includes(k) ? f.interests.filter((x) => x !== k) : [...f.interests, k].slice(0, 6) })}>{l}</button>)}</div>
            </div>
          )}
          {err && <p className="error-text" role="alert">{err}</p>}
          <button className="btn lg" type="submit" disabled={busy}>{isLogin ? <><LogIn size={17} /> {busy ? 'Signing in…' : 'Sign in'}</> : <><UserPlus size={17} /> {busy ? 'Creating…' : 'Create passport'}</>}</button>
          <p className="small muted" style={{ margin: 0 }}>{isLogin ? <>New here? <Link to={`/register?next=${encodeURIComponent(next)}`}>Create a free passport</Link></> : <>Already have one? <Link to={`/login?next=${encodeURIComponent(next)}`}>Sign in</Link></>}</p>
          <p className="cap" style={{ margin: 0 }}>Everything except stamps, reviews and saved walks works without an account.</p>
        </motion.form>
      </div>
    </div>
  );
}
