import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeyRound, Send } from 'lucide-react';
import { api } from '../lib/api.js';
import { useT } from '../lib/prefs.jsx';
import { useToast } from '../lib/toast.jsx';
import { LogoMark } from '../components/Logo.jsx';
import { CodeInput } from '../components/CodeInput.jsx';
import { Mandala } from '../components/Ornaments.jsx';

/** Forgotten password: ask for a code by email, then choose a new password with it. */
export default function Forgot() {
  const t = useT();
  const nav = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [wait, setWait] = useState(0);
  const [mode, setMode] = useState('smtp');

  useEffect(() => { api('/auth/mail-mode').then((d) => setMode(d.mode)).catch(() => {}); }, []);
  useEffect(() => {
    if (wait <= 0) return undefined;
    const id = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  const ask = async (e) => {
    e?.preventDefault();
    setBusy(true); setErr('');
    try { const r = await api('/auth/forgot', { method: 'POST', body: { email } }); setStep(2); setWait(r.resendIn || 60); } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  const reset = async (e) => {
    e.preventDefault();
    if (pw.length < 6) return setErr(t('Password must be at least 6 characters', 'पासवर्ड कम्तीमा ६ अक्षरको हुनुपर्छ'));
    if (pw !== pw2) return setErr(t('The two passwords do not match', 'दुई पासवर्ड मिलेनन्'));
    if (code.length !== 6) return setErr(t('Enter the six-digit code from the email', 'इमेलमा आएको छ अङ्कको कोड लेख्नुहोस्'));
    setBusy(true); setErr('');
    try {
      await api('/auth/reset', { method: 'POST', body: { email, code, password: pw } });
      toast(t('Password changed. Sign in with the new one.', 'पासवर्ड परिवर्तन भयो। नयाँ पासवर्डले साइन इन गर्नुहोस्।'), 'ok');
      nav('/login', { replace: true });
    } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };

  return (
    <div className="page auth">
      <div className="wrap" style={{ maxWidth: 520, paddingBottom: '3rem' }}>
        <motion.div className="card pad-l verify-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Mandala size={420} className="mandala-bg spin-slow" strokeWidth={0.7} />
          <div><LogoMark size={56} /></div>
          <div className="eyebrow" style={{ marginTop: '1rem' }}>{t('Reset your password', 'पासवर्ड रिसेट गर्नुहोस्')}</div>
          {step === 1 ? (
            <form className="stack" onSubmit={ask}>
              <h2 style={{ margin: '0 0 0.4rem' }}>{t('Forgot your password?', 'पासवर्ड बिर्सनुभयो?')}</h2>
              <p className="muted">{t('Enter the email you signed up with and we will send you a six-digit code.', 'साइन अप गर्दा प्रयोग गरेको इमेल लेख्नुहोस्; हामी छ अङ्कको कोड पठाउनेछौँ।')}</p>
              <div className="field"><label htmlFor="fe">{t('Email', 'इमेल')}</label><input id="fe" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></div>
              {err && <p className="error-text" role="alert">{err}</p>}
              <button className="btn lg" style={{ width: '100%' }} type="submit" disabled={busy}><Send size={17} /> {busy ? t('Sending…', 'पठाउँदै…') : t('Send me a code', 'मलाई कोड पठाउनुहोस्')}</button>
            </form>
          ) : (
            <form className="stack" onSubmit={reset}>
              <h2 style={{ margin: '0 0 0.4rem' }}>{t('Choose a new password', 'नयाँ पासवर्ड रोज्नुहोस्')}</h2>
              <p className="muted">{t('If that address has a passport, a code is on its way to', 'यो ठेगानामा राहदानी छ भने कोड पठाइँदैछ:')} <b>{email}</b>.</p>
              <CodeInput value={code} onChange={setCode} disabled={busy} label={t('Reset code', 'रिसेट कोड')} />
              <div className="field"><label htmlFor="np1">{t('New password', 'नयाँ पासवर्ड')}</label><input id="np1" className="input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" required minLength={6} /></div>
              <div className="field"><label htmlFor="np2">{t('Repeat the new password', 'नयाँ पासवर्ड दोहोर्याउनुहोस्')}</label><input id="np2" className="input" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" required minLength={6} /></div>
              {err && <p className="error-text" role="alert">{err}</p>}
              <button className="btn lg" style={{ width: '100%' }} type="submit" disabled={busy}><KeyRound size={17} /> {busy ? t('Saving…', 'सुरक्षित गर्दै…') : t('Change my password', 'मेरो पासवर्ड परिवर्तन गर्नुहोस्')}</button>
              <div className="row between">
                <button type="button" className="link-btn" onClick={ask} disabled={wait > 0 || busy}>{wait > 0 ? t(`Send again in ${wait}s`, `${t.n(wait)} सेकेन्डमा फेरि पठाउनुहोस्`) : t('Send a new code', 'नयाँ कोड पठाउनुहोस्')}</button>
                <button type="button" className="link-btn" onClick={() => { setStep(1); setCode(''); setErr(''); }}>{t('Use another email', 'अर्को इमेल प्रयोग गर्नुहोस्')}</button>
              </div>
              {mode === 'preview' && <p className="cap">{t('Developer note: email sending is not set up yet, so the code is printed in the server console.', 'विकासकर्ताको टिप्पणी: इमेल पठाउने व्यवस्था गरिएको छैन, कोड सर्भर कन्सोलमा छापिन्छ।')}</p>}
            </form>
          )}
          <p className="small" style={{ marginTop: '1rem' }}><Link to="/login">{t('Back to sign in', 'साइन इनमा फर्कनुहोस्')}</Link></p>
        </motion.div>
      </div>
    </div>
  );
}
