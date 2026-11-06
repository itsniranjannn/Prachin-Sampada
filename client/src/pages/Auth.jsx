import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, UserPlus } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../lib/auth.jsx';
import { LogoMark } from '../components/Logo.jsx';
import '../styles/auth-qa.css';



const ART = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/View_of_Bhaktapur_Durbar_Square.jpg/1280px-View_of_Bhaktapur_Durbar_Square.jpg';
const INTERESTS = [['hindu', 'Hindu temples'], ['buddhist', 'Buddhist sites'], ['pagoda', 'Pagodas'], ['stupa', 'Stupas'], ['palace', 'Palaces'], ['courtyard', 'Courtyards'], ['art', 'Art & carving'], ['legend', 'Legends'], ['water', 'Water heritage'], ['festival', 'Festivals']];

export default function Auth({ mode }) {
  const isLogin = mode === 'login';
  const { login, googleLogin, register } = useAuth();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '', interests: [] });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const next = params.get('next') || (isLogin ? '/passport' : '/explore');

  const onGoogleSuccess = async (tokenResponse) => {
    setErr(''); setBusy(true);
    try {
      // Exchange access_token for userinfo or send access_token/id_token
      const accessToken = tokenResponse?.access_token;
      if (!accessToken) throw new Error('No access token received from Google');

      // Fetch user profile directly from Google
      const gRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!gRes.ok) throw new Error('Failed to retrieve Google profile');
      const gUser = await gRes.json();

      const u = await googleLogin({
        email: gUser.email,
        name: gUser.name,
        email_verified: gUser.email_verified,
        sub: gUser.sub,
        picture: gUser.picture
      });

      let dest = next;
      if (u?.role === 'admin' && !params.get('next')) dest = '/admin';
      nav(dest, { replace: true });
    } catch (x) {
      setErr(x.message || 'Google sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleSignIn = useGoogleLogin({
    onSuccess: onGoogleSuccess,
    onError: () => setErr('Google Sign-In was cancelled or failed')
  });



  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      let dest = next;
      if (isLogin) {
        const u = await login(f.email, f.password);
        // admins land on the admin panel unless they were sent to a specific page
        if (u?.role === 'admin' && !params.get('next')) dest = '/admin';
      } else await register(f);
      nav(isLogin ? dest : `/verify?next=${encodeURIComponent(next)}`, { replace: true });
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
          
          <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0 0.8rem', gap: '0.75rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.12)' }} />
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--muted, #9a8a98)', fontWeight: 600 }}>or</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.12)' }} />
          </div>

          <button
            type="button"
            onClick={() => handleGoogleSignIn()}
            disabled={busy}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '12px 18px',
              borderRadius: '999px',
              background: '#ffffff',
              color: '#1f1f1f',
              border: '1px solid #dadce0',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: busy ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f8f9fa'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)'; }}
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            <span>{isLogin ? 'Sign in with Google' : 'Sign up with Google'}</span>
          </button>


          <p className="small muted" style={{ margin: 0 }}>{isLogin ? <>New here? <Link to={`/register?next=${encodeURIComponent(next)}`}>Create a free passport</Link></> : <>Already have one? <Link to={`/login?next=${encodeURIComponent(next)}`}>Sign in</Link></>}</p>

          <p className="cap" style={{ margin: 0 }}>Everything except stamps, reviews and saved walks works without an account.</p>
        </motion.form>
      </div>
    </div>
  );
}
