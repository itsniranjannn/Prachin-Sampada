import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MailCheck, RotateCw } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useT } from '../lib/prefs.jsx';
import { useToast } from '../lib/toast.jsx';
import { LogoMark } from '../components/Logo.jsx';
import '../styles/auth-qa.css';
import { CodeInput } from '../components/CodeInput.jsx';
import { Mandala } from '../components/Ornaments.jsx';

/** Confirm the email address with the six-digit code that was mailed after sign-up. */
export default function Verify() {
  const t = useT();
  const { user, setUser } = useAuth();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const toast = useToast();
  const next = params.get('next') || '/passport';
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [wait, setWait] = useState(60);
  const [mode, setMode] = useState('smtp');

  useEffect(() => { api('/auth/mail-mode').then((d) => setMode(d.mode)).catch(() => {}); }, []);
  useEffect(() => {
    if (wait <= 0) return undefined;
    const id = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);
  useEffect(() => { if (user?.emailVerified) nav(next, { replace: true }); }, [user, next, nav]);

  const submit = async (c = code) => {
    if (c.length !== 6 || busy) return;
    setBusy(true); setErr('');
    try {
      const r = await api('/auth/verify-email', { method: 'POST', body: { code: c } });
      setUser(r.user);
      toast(t('Email confirmed. Welcome aboard!', 'इमेल पुष्टि भयो। स्वागत छ!'), 'ok');
      nav(next, { replace: true });
    } catch (e) { setErr(e.message); setCode(''); } finally { setBusy(false); }
  };
  const resend = async () => {
    setErr('');
    try { await api('/auth/resend-code', { method: 'POST' }); setWait(60); toast(t('A new code is on its way.', 'नयाँ कोड पठाइँदै छ।'), 'ok'); } catch (e) { if (e.data?.wait) setWait(e.data.wait); setErr(e.message); }
  };

  return (
    <div className="page auth">
      <div className="wrap" style={{ maxWidth: 520, paddingBottom: '3rem' }}>
        <motion.div className="card pad-l verify-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Mandala size={420} className="mandala-bg spin-slow" strokeWidth={0.7} />
          <div><LogoMark size={56} /></div>
          <div className="eyebrow" style={{ marginTop: '1rem' }}>{t('Verify your email', 'इमेल पुष्टि गर्नुहोस्')}</div>
          <h2 style={{ margin: '0 0 0.4rem' }}>{t('Enter the six-digit code', '६ अङ्कको कोड हाल्नुहोस्')}</h2>
          <p className="muted">
            {t('We sent a code to', 'हामीले कोड पठायौं')} <b>{user?.email}</b>. {t('It works for 10 minutes.', 'यो कोड १० मिनेटसम्म चल्छ।')}
          </p>
          <CodeInput value={code} onChange={setCode} onComplete={submit} disabled={busy} label={t('Verification code', 'पुष्टि गर्ने कोड')} />
          {err && <p className="error-text" role="alert" style={{ textAlign: 'center' }}>{err}</p>}
          <button className="btn lg" style={{ width: '100%', marginTop: '0.6rem' }} onClick={() => submit()} disabled={busy || code.length !== 6}>
            <MailCheck size={18} /> {busy ? t('Checking…', 'जाँच्दै…') : t('Confirm my email', 'मेरो इमेल पक्का गर्नुहोस्')}
          </button>
          <div className="row between" style={{ marginTop: '1rem' }}>
            <button className="link-btn" onClick={resend} disabled={wait > 0}><RotateCw size={14} style={{ verticalAlign: '-2px' }} /> {wait > 0 ? t(`Send again in ${wait}s`, `${t.n(wait)} सेकेन्डपछि फेरि पठाउनुहोस्`) : t('Send a new code', 'नयाँ कोड पठाउनुहोस्')}</button>
            <Link to={next} className="small">{t('Skip for now', 'अहिलेलाई छोड्नुहोस्')}</Link>
          </div>
          {mode === 'preview' && <p className="cap" style={{ marginTop: '1rem' }}>{t('Developer note: email sending is not set up yet, so the code is printed in the server console.', 'डेभलपरका लागि: इमेल पठाउने व्यवस्था अझै भएको छैन, त्यसैले कोड सर्भरको कन्सोलमा छापिन्छ।')}</p>}
        </motion.div>
      </div>
    </div>
  );
}
