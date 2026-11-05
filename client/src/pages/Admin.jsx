import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Landmark, Users, MessageSquare, Activity, Plus, Pencil, Trash2, X, Save, Search, Brain, ImagePlus, ChevronLeft, ChevronRight, MapPinned } from 'lucide-react';
import { Dropdown } from '../components/Pickers.jsx';
import { api, getToken } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useT } from '../lib/prefs.jsx';
import { useToast } from '../lib/toast.jsx';
import { Loader } from '../components/Shell.jsx';
import { TYPE_LABEL } from '../components/MonumentCard.jsx';
import '../styles/admin.css';

const TYPES = Object.keys(TYPE_LABEL);
const PROVINCES = ['Koshi', 'Madhesh', 'Bagmati', 'Gandaki', 'Lumbini', 'Karnali', 'Sudurpashchim'];
const RELIGIONS = [['Hindu', 'हिन्दु'], ['Buddhist', 'बौद्ध'], ['Both', 'दुवै'], ['Secular', 'धर्मनिरपेक्ष'], ['Other', 'अन्य']];
const PAGE = 12;
const EMPTY = {
  slug: '', name: '', name_np: '', city: '', province: 'Bagmati', district: '', zone_slug: '', lat: '', lng: '', type: 'pagoda', religion: 'Hindu', deity: '', built_year: '', built_text: '',
  dynasty: 'Malla', architecture: '', unesco: false, short_text: '', short_np: '', story: '', story_np: '', legend: '', legend_np: '', open_time: '', close_time: '',
  fee_foreigner: '', fee_saarc: '', fee_nepali: '', visit_minutes: 30, quake_2015: '', quake_np: '', image_url: '', image_page: '', image_credit: '', tags: '',
};
const SAVE_KEYS = Object.keys(EMPTY);

const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
const fmtDate = (v) => (v ? new Date(v).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');

/** Loads an admin endpoint; shows a retry button instead of spinning forever when the request fails. */
function useLoad(path, pick = (d) => d.results) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const load = useCallback(() => {
    setErr('');
    return api(path).then((d) => setData(pick(d))).catch((e) => setErr(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);
  useEffect(() => { load(); }, [load]);
  return [data, err, load];
}

function LoadState({ err, retry, t }) {
  if (!err) return <Loader />;
  return (
    <div className="card pad-l admin-empty">
      <p className="error-text">{err}</p>
      <button className="btn sm ghost" onClick={retry}>{t('Try again', 'फेरि प्रयास गर्नुहोस्')}</button>
    </div>
  );
}

function usePaged(rows, size = PAGE) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const cur = Math.min(page, pages - 1);
  useEffect(() => { if (page > pages - 1) setPage(pages - 1); }, [page, pages]);
  return { page: cur, pages, setPage, slice: rows.slice(cur * size, cur * size + size), total: rows.length, size };
}

function Pager({ p, t }) {
  if (p.total <= p.size) return null;
  const from = p.page * p.size + 1;
  const to = Math.min(p.total, from + p.size - 1);
  return (
    <div className="pager">
      <span className="num">{t.n(from)}–{t.n(to)} {t('of', 'मध्ये')} {t.n(p.total)}</span>
      <div className="row">
        <button className="icon-btn" disabled={p.page === 0} onClick={() => p.setPage(p.page - 1)} aria-label={t('Previous page', 'अघिल्लो पेज')}><ChevronLeft size={16} /></button>
        <span className="num">{t.n(p.page + 1)} / {t.n(p.pages)}</span>
        <button className="icon-btn" disabled={p.page >= p.pages - 1} onClick={() => p.setPage(p.page + 1)} aria-label={t('Next page', 'अर्को पेज')}><ChevronRight size={16} /></button>
      </div>
    </div>
  );
}

const openModals = []; // Escape closes only the top-most dialog (a confirm sits on top of an editor)
function Modal({ label, onClose, size = '', children, form, onSubmit }) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const me = {};
    openModals.push(me);
    const esc = (e) => { if (e.key === 'Escape' && openModals[openModals.length - 1] === me) closeRef.current(); };
    document.addEventListener('keydown', esc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { openModals.splice(openModals.indexOf(me), 1); document.removeEventListener('keydown', esc); document.body.style.overflow = prev; };
  }, []);
  const Tag = form ? 'form' : 'div';
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={label} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <Tag className={`modal-card card pad-l ${size}`} onSubmit={onSubmit} noValidate={form || undefined}>{children}</Tag>
    </div>
  );
}

function Confirm({ ask, onClose, t }) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal label={ask.title} onClose={onClose} size="narrow">
      <div className="confirm-card" style={{ display: 'grid', gap: '0.8rem' }}>
        <h3 style={{ margin: 0 }}>{ask.title}</h3>
        <p>{ask.text}</p>
        <div className="form-actions">
          <button className={`btn ${ask.danger ? 'danger' : ''}`} disabled={busy} onClick={async () => { setBusy(true); try { await ask.yes(); } finally { setBusy(false); onClose(); } }}>{ask.label}</button>
          <button className="btn ghost" onClick={onClose}>{t('Cancel', 'रद्द गर्नुहोस्')}</button>
        </div>
      </div>
    </Modal>
  );
}

// ---- dashboard ----------------------------------------------------------------------------------------------------
function Bars({ data, label, value, day, t }) {
  const max = Math.max(1, ...data.map(value));
  return (
    <div className="bars">
      {data.map((d, i) => (
        <div key={i} className={`bar-row ${day ? 'day' : ''}`}><span className="cap" title={label(d)}>{label(d)}</span><div><i style={{ width: `${(value(d) / max) * 100}%` }} /></div><b className="num small">{t.n(value(d))}</b></div>
      ))}
      {!data.length && <p className="cap">{t('No data yet.', 'अहिलेसम्म डाटा छैन।')}</p>}
    </div>
  );
}

function Dashboard({ t }) {
  const [s, err, retry] = useLoad('/admin/stats', (d) => d);
  if (!s) return <LoadState err={err} retry={retry} t={t} />;
  const kpis = [
    [t('Explorers', 'अन्वेषक'), s.explorers], [t('Monuments', 'स्मारक'), s.monuments], [t('Quiz questions', 'क्विज प्रश्न'), s.questions], [t('Stamps', 'छाप'), s.stamps],
    [t('Quiz answers', 'क्विज उत्तर'), s.quizAnswers], [t('Quiz accuracy', 'क्विज शुद्धता'), `${s.quizAccuracy}%`], [t('Find games', 'खोज खेल'), s.games], [t('Avg Find score', 'औसत स्कोर'), s.avgGame],
    [t('Live hunts', 'लाइभ खोज'), s.hunts], [t('Hunt players', 'खोजका खेलाडी'), s.huntPlayers], [t('Reviews', 'समीक्षा'), s.reviews], [t('Saved walks', 'सुरक्षित यात्रा'), s.tours],
  ];
  return (
    <>
      <div className="kpis">{kpis.map(([k, v]) => <div key={k} className="kpi card"><span className="cap">{k}</span><b className="num">{typeof v === 'number' ? t.n(v) : v}</b></div>)}</div>
      <div className="grid-2" style={{ marginTop: '1rem', alignItems: 'start' }}>
        <div className="card pad-l"><h5>{t('Quiz answers, last 14 days', 'क्विज उत्तर, पछिल्ला १४ दिन')}</h5>
          <Bars t={t} day data={s.perDay} label={(d) => { const [y, m, dd] = d.d.split('-').map(Number); return new Date(y, m - 1, dd).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); }} value={(d) => d.n} /></div>
        <div className="card pad-l"><h5>{t('Most stamped monuments', 'सबैभन्दा बढी छाप लागेका स्मारक')}</h5><Bars t={t} data={s.topStamped} label={(d) => d.name} value={(d) => d.n} /></div>
        <div className="card pad-l"><h5>{t('Monuments by type', 'किसिम अनुसार स्मारक')}</h5><Bars t={t} data={s.byType} label={(d) => TYPE_LABEL[d.type] || d.type} value={(d) => d.n} /></div>
        <div className="card pad-l"><h5>{t('Hardest questions (highest Elo)', 'सबैभन्दा गाह्रा प्रश्न (उच्च Elo)')}</h5>
          {!s.hardest.length ? <p className="cap">{t('Questions earn ratings once they are answered.', 'प्रश्नको रेटिङ उत्तर आएपछि बन्छ।')}</p> : s.hardest.map((q) => (
            <div key={q.id} className="hard-q"><span className="small">{q.question}{q.question.length >= 90 ? '…' : ''}</span><span className="cap num">Elo {q.rating} · {q.times_correct}/{q.times_asked} {t('correct', 'सही')}</span></div>
          ))}
        </div>
      </div>
    </>
  );
}

// ---- quiz questions and clues for one monument ---------------------------------------------------------------------
function QuestionsPane({ monument, t, ask }) {
  const toast = useToast();
  const [list, err, reload] = useLoad(`/admin/monuments/${monument.id}/questions`);
  const [f, setF] = useState(null);
  const [fe, setFe] = useState('');
  const open = (q) => { setFe(''); setF(q ? { ...q, options_np: q.options_np || ['', '', '', ''], question_np: q.question_np || '', explanation_np: q.explanation_np || '' } : { question: '', options: ['', '', '', ''], answer_index: 0, difficulty: 2, explanation: '', question_np: '', options_np: ['', '', '', ''], explanation_np: '' }); };
  const save = async (e) => {
    e.preventDefault();
    setFe('');
    const body = { ...f, options_np: f.options_np.some((o) => o.trim()) ? f.options_np : [] };
    try {
      if (f.id) await api(`/admin/questions/${f.id}`, { method: 'PUT', body });
      else await api(`/admin/monuments/${monument.id}/questions`, { method: 'POST', body });
      toast(t('Question saved', 'प्रश्न सुरक्षित भयो'), 'ok'); setF(null); reload();
    } catch (x) { setFe(x.message); }
  };
  const remove = (q) => ask({
    title: t('Delete this question?', 'यो प्रश्न मेटाउने?'), text: q.question, label: t('Delete', 'मेटाउनुहोस्'), danger: true,
    yes: async () => { try { await api(`/admin/questions/${q.id}`, { method: 'DELETE' }); toast(t('Question deleted', 'प्रश्न मेटियो'), 'ok'); reload(); } catch (x) { toast(x.message, 'err'); } },
  });
  if (!list) return <LoadState err={err} retry={reload} t={t} />;
  if (f) {
    const setOpt = (key, i) => (e) => { const a = [...f[key]]; a[i] = e.target.value; setF({ ...f, [key]: a }); };
    return (
      <form onSubmit={save} noValidate style={{ display: 'grid', gap: '0.7rem' }}>
        <div className="field"><label htmlFor="q-text">{t('Question', 'प्रश्न')}</label><input id="q-text" className="input" value={f.question} maxLength={400} onChange={(e) => setF({ ...f, question: e.target.value })} /></div>
        <p className="admin-note">{t('Four different options. Tick the correct one.', 'चार फरक विकल्प लेख्नुहोस्। सही उत्तरमा ठीक चिह्न लगाउनुहोस्।')}</p>
        {f.options.map((o, i) => (
          <div key={i} className={`opt-row ${f.answer_index === i ? 'right' : ''}`}>
            <input type="radio" name="ans" checked={f.answer_index === i} onChange={() => setF({ ...f, answer_index: i })} aria-label={t(`Option ${i + 1} is correct`, `विकल्प ${i + 1} सही हो`)} />
            <input className="input" value={o} maxLength={200} placeholder={t(`Option ${i + 1}`, `विकल्प ${i + 1}`)} aria-label={t(`Option ${i + 1}`, `विकल्प ${i + 1}`)} onChange={setOpt('options', i)} />
          </div>
        ))}
        <div className="diff-row"><label className="cap" htmlFor="q-diff">{t('Difficulty', 'कठिनाइ')}</label><input id="q-diff" type="range" min="1" max="5" value={f.difficulty} onChange={(e) => setF({ ...f, difficulty: Number(e.target.value) })} /><b className="num">{t.n(f.difficulty)} / {t.n(5)}</b></div>
        <div className="field"><label htmlFor="q-exp">{t('Explanation shown after answering', 'उत्तरपछि देखिने व्याख्या')}</label><input id="q-exp" className="input" maxLength={400} value={f.explanation} onChange={(e) => setF({ ...f, explanation: e.target.value })} /></div>
        <h4 className="form-section">{t('Nepali version', 'नेपाली संस्करण')} <span className="hint">({t('optional; fill all four options or none', 'ऐच्छिक; चारै विकल्प भर्नुहोस् वा केही नभर्नुहोस्')})</span></h4>
        <div className="field"><label htmlFor="q-text-np">{t('Question in Nepali', 'नेपालीमा प्रश्न')}</label><input id="q-text-np" lang="ne" className="input" value={f.question_np} maxLength={800} onChange={(e) => setF({ ...f, question_np: e.target.value })} /></div>
        {f.options_np.map((o, i) => <input key={i} lang="ne" className="input" value={o} maxLength={200} placeholder={t(`Option ${i + 1} in Nepali`, `नेपालीमा विकल्प ${i + 1}`)} aria-label={t(`Option ${i + 1} in Nepali`, `नेपालीमा विकल्प ${i + 1}`)} onChange={setOpt('options_np', i)} />)}
        <div className="field"><label htmlFor="q-exp-np">{t('Explanation in Nepali', 'नेपालीमा व्याख्या')}</label><input id="q-exp-np" lang="ne" className="input" value={f.explanation_np} maxLength={800} onChange={(e) => setF({ ...f, explanation_np: e.target.value })} /></div>
        {fe && <p className="error-text" role="alert">{fe}</p>}
        <div className="form-actions"><button className="btn" type="submit"><Save size={15} /> {t('Save question', 'प्रश्न सुरक्षित गर्नुहोस्')}</button><button type="button" className="btn ghost" onClick={() => setF(null)}>{t('Back to list', 'सूचीमा फर्कनुहोस्')}</button></div>
      </form>
    );
  }
  return (
    <>
      {list.map((q) => (
        <div key={q.id} className="q-row">
          <span><b>{q.question}</b><span className="cap">{t('Difficulty', 'कठिनाइ')} {t.n(q.difficulty)} · Elo {q.rating} · {t.n(q.times_correct)}/{t.n(q.times_asked)} {t('correct', 'सही')} · {t('answer', 'उत्तर')}: {q.options[q.answer_index]}{q.question_np ? ` · ${t('Nepali added', 'नेपाली थपिएको')}` : ''}</span></span>
          <div className="cell-actions">
            <button className="icon-btn" onClick={() => open(q)} aria-label={t('Edit question', 'प्रश्न सम्पादन')}><Pencil size={14} /></button>
            <button className="icon-btn danger" onClick={() => remove(q)} aria-label={t('Delete question', 'प्रश्न मेटाउनुहोस्')}><Trash2 size={14} /></button>
          </div>
        </div>
      ))}
      {!list.length && <p className="cap">{t('No questions yet for this monument.', 'यो स्मारकको प्रश्न अहिलेसम्म छैन।')}</p>}
      <button className="btn sm" style={{ marginTop: '0.8rem' }} onClick={() => open(null)}><Plus size={15} /> {t('Add question', 'प्रश्न थप्नुहोस्')}</button>
    </>
  );
}

function CluesPane({ monument, t, ask }) {
  const toast = useToast();
  const [list, err, reload] = useLoad(`/admin/monuments/${monument.id}/clues`);
  const [f, setF] = useState(null);
  const [fe, setFe] = useState('');
  const save = async (e) => {
    e.preventDefault();
    setFe('');
    try {
      if (f.id) await api(`/admin/clues/${f.id}`, { method: 'PUT', body: f });
      else await api(`/admin/monuments/${monument.id}/clues`, { method: 'POST', body: f });
      toast(t('Clue saved', 'सुराग सुरक्षित भयो'), 'ok'); setF(null); reload();
    } catch (x) { setFe(x.message); }
  };
  const remove = (c) => ask({
    title: t('Delete this clue?', 'यो सुराग मेटाउने?'), text: c.clue, label: t('Delete', 'मेटाउनुहोस्'), danger: true,
    yes: async () => { try { await api(`/admin/clues/${c.id}`, { method: 'DELETE' }); toast(t('Clue deleted', 'सुराग मेटियो'), 'ok'); reload(); } catch (x) { toast(x.message, 'err'); } },
  });
  if (!list) return <LoadState err={err} retry={reload} t={t} />;
  if (f) {
    return (
      <form onSubmit={save} noValidate style={{ display: 'grid', gap: '0.7rem' }}>
        <div className="field"><label htmlFor="c-text">{t('Clue (do not name the place)', 'सुराग (ठाउँको नाम नलेख्नुहोस्)')}</label><textarea id="c-text" className="textarea" style={{ minHeight: 84 }} maxLength={300} value={f.clue} onChange={(e) => setF({ ...f, clue: e.target.value })} /></div>
        <div className="field"><label htmlFor="c-np">{t('Clue in Nepali (optional)', 'नेपालीमा सुराग (ऐच्छिक)')}</label><textarea id="c-np" lang="ne" className="textarea" style={{ minHeight: 84 }} maxLength={500} value={f.clue_np || ''} onChange={(e) => setF({ ...f, clue_np: e.target.value })} /></div>
        {fe && <p className="error-text" role="alert">{fe}</p>}
        <div className="form-actions"><button className="btn" type="submit"><Save size={15} /> {t('Save clue', 'सुराग सुरक्षित गर्नुहोस्')}</button><button type="button" className="btn ghost" onClick={() => setF(null)}>{t('Back to list', 'सूचीमा फर्कनुहोस्')}</button></div>
      </form>
    );
  }
  return (
    <>
      <p className="admin-note" style={{ marginBottom: '0.6rem' }}>{t('The Find game needs a photo and at least one clue. Several clues per monument keep rounds fresh.', 'खोज खेलका लागि फोटो र कम्तीमा एउटा सुराग चाहिन्छ। धेरै सुरागले खेल नयाँ लाग्छ।')}</p>
      {list.map((c) => (
        <div key={c.id} className="q-row">
          <span><b>{c.clue}</b>{c.clue_np && <span className="cap" lang="ne">{c.clue_np}</span>}</span>
          <div className="cell-actions">
            <button className="icon-btn" onClick={() => { setFe(''); setF({ ...c }); }} aria-label={t('Edit clue', 'सुराग सम्पादन')}><Pencil size={14} /></button>
            <button className="icon-btn danger" onClick={() => remove(c)} aria-label={t('Delete clue', 'सुराग मेटाउनुहोस्')}><Trash2 size={14} /></button>
          </div>
        </div>
      ))}
      {!list.length && <p className="cap">{t('No clues yet for this monument.', 'यो स्मारकको सुराग अहिलेसम्म छैन।')}</p>}
      <button className="btn sm" style={{ marginTop: '0.8rem' }} onClick={() => { setFe(''); setF({ clue: '', clue_np: '' }); }}><Plus size={15} /> {t('Add clue', 'सुराग थप्नुहोस्')}</button>
    </>
  );
}

function QuizEditor({ monument, onClose, t, ask }) {
  const [tab, setTab] = useState('q');
  return (
    <Modal label={t(`Quiz and clues for ${monument.name}`, `${monument.name_np || monument.name}: क्विज र सुराग`)} onClose={onClose} size="wide">
      <div className="modal-head"><h3>{monument.name}</h3><button className="icon-btn" onClick={onClose} aria-label={t('Close', 'बन्द गर्नुहोस्')}><X size={16} /></button></div>
      <div className="seg admin-subtabs">
        <button className={tab === 'q' ? 'on' : ''} onClick={() => setTab('q')}><Brain size={15} /> {t('Quiz questions', 'क्विज प्रश्न')}</button>
        <button className={tab === 'c' ? 'on' : ''} onClick={() => setTab('c')}><MapPinned size={15} /> {t('Find clues', 'खोजका सुराग')}</button>
      </div>
      {tab === 'q' ? <QuestionsPane monument={monument} t={t} ask={ask} /> : <CluesPane monument={monument} t={t} ask={ask} />}
    </Modal>
  );
}

// ---- monuments ----------------------------------------------------------------------------------------------------
/** Photo field: drag and drop, click to browse, or paste a link. Uploads go to /api/admin/uploads. */
function PhotoField({ value, onChange, t }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [over, setOver] = useState(false);
  const upload = async (file) => {
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) return setErr(t('The photo must be 6 MB or smaller', 'फोटो ६ MB वा सानो हुनुपर्छ'));
    setBusy(true); setErr('');
    try {
      const res = await fetch('/api/admin/uploads', { method: 'POST', headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/octet-stream' }, body: file });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || t('Upload failed', 'अपलोड भएन'));
      onChange(d.url);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  return (
    <div className="field">
      <label htmlFor="f-photo">{t('Photo', 'फोटो')}</label>
      <label
        className={`dropzone ${over ? 'over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); upload(e.dataTransfer.files?.[0]); }}
      >
        {value ? <img src={value} alt={t('Monument photo preview', 'स्मारकको फोटो')} /> : <ImagePlus size={28} />}
        <span>{busy ? t('Uploading…', 'अपलोड हुँदैछ…') : value ? t('Drop or click to replace the photo', 'फोटो बदल्न यहाँ तान्नुहोस् वा क्लिक गर्नुहोस्') : t('Drop a JPEG, PNG or WebP here, or click to choose (max 6 MB)', 'JPEG, PNG वा WebP यहाँ तान्नुहोस् वा क्लिक गरेर छान्नुहोस् (६ MB सम्म)')}</span>
        <input id="f-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => upload(e.target.files?.[0])} hidden />
      </label>
      <input className="input" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={t('…or paste an image link (e.g. Wikimedia Commons)', '…वा फोटोको लिङ्क राख्नुहोस् (जस्तै Wikimedia Commons)')} aria-label={t('Photo link', 'फोटोको लिङ्क')} />
      {err && <span className="error-text" role="alert">{err}</span>}
    </div>
  );
}

function MonumentForm({ initial, onClose, onSaved, t }) {
  const isEdit = !!initial?.id;
  const [f, setF] = useState(() => {
    const base = { ...EMPTY };
    if (initial) for (const k of SAVE_KEYS) if (initial[k] != null) base[k] = initial[k];
    return { ...base, unesco: !!initial?.unesco };
  });
  const [facts, setFacts] = useState((initial?.facts || []).join('\n'));
  const [factsNp, setFactsNp] = useState((initial?.facts_np || []).join('\n'));
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [err, setErr] = useState('');
  const [badKey, setBadKey] = useState('');
  const [busy, setBusy] = useState(false);
  const setVal = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setF((x) => ({ ...x, [k]: v, ...(k === 'name' && !slugTouched ? { slug: slugify(v) } : {}) }));
  };
  const fail = (key, msg) => { setBadKey(key); setErr(msg); return false; };
  const check = () => {
    setErr(''); setBadKey('');
    if (!f.name.trim()) return fail('name', t('Enter the monument name.', 'स्मारकको नाम लेख्नुहोस्।'));
    if (!/^[a-z0-9-]{3,80}$/.test(f.slug)) return fail('slug', t('Slug: 3-80 lowercase letters, digits or dashes.', 'स्लग: ३-८० अक्षर (सानो अंग्रेजी), अंक वा डास।'));
    if (!f.city.trim()) return fail('city', t('Enter the city.', 'सहरको नाम लेख्नुहोस्।'));
    const lat = Number(f.lat); const lng = Number(f.lng);
    if (f.lat === '' || !Number.isFinite(lat) || lat < 26.3 || lat > 30.5) return fail('lat', t('Latitude must be inside Nepal (26.3 to 30.5).', 'अक्षांश नेपालभित्र (२६.३ देखि ३०.५) हुनुपर्छ।'));
    if (f.lng === '' || !Number.isFinite(lng) || lng < 80 || lng > 88.3) return fail('lng', t('Longitude must be inside Nepal (80 to 88.3).', 'देशान्तर नेपालभित्र (८० देखि ८८.३) हुनुपर्छ।'));
    for (const k of ['open_time', 'close_time']) if (f[k] && !/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(f[k])) return fail(k, t('Use 24-hour time like 06:30.', '२४ घण्टे समय लेख्नुहोस्, जस्तै ०६:३०।'));
    for (const k of ['fee_foreigner', 'fee_saarc', 'fee_nepali']) if (f[k] !== '' && f[k] != null && (!Number.isInteger(Number(f[k])) || Number(f[k]) < 0)) return fail(k, t('Fees are whole rupee amounts, zero or more.', 'शुल्क शून्य वा बढी पूरा रुपैयाँमा हुनुपर्छ।'));
    if (!f.story.trim()) return fail('story', t('Write the audio-guide story.', 'अडियो गाइडको कथा लेख्नुहोस्।'));
    return true;
  };
  const save = async (e) => {
    e.preventDefault();
    if (!check()) return;
    const lines = (s) => s.split('\n').map((x) => x.trim()).filter(Boolean);
    const body = {};
    for (const k of SAVE_KEYS) body[k] = f[k];
    Object.assign(body, {
      lat: Number(f.lat), lng: Number(f.lng), built_year: f.built_year === '' ? null : Number(f.built_year), visit_minutes: Number(f.visit_minutes) || 30, unesco: !!f.unesco,
      facts: lines(facts), facts_np: lines(factsNp),
    });
    for (const k of ['fee_foreigner', 'fee_saarc', 'fee_nepali']) body[k] = f[k] === '' || f[k] == null ? null : Number(f[k]);
    setBusy(true);
    try {
      if (isEdit) await api(`/admin/monuments/${initial.id}`, { method: 'PUT', body });
      else await api('/admin/monuments', { method: 'POST', body });
      onSaved();
    } catch (x) { setErr(x.message); if (/slug/i.test(x.message)) setBadKey('slug'); } finally { setBusy(false); }
  };
  const F = ({ k, label, type = 'text', hint, ...p }) => (
    <div className={`field ${badKey === k ? 'bad' : ''}`}>
      <label htmlFor={`f-${k}`}>{label}{hint && <span className="hint"> · {hint}</span>}</label>
      <input id={`f-${k}`} className="input" type={type} value={f[k] ?? ''} onChange={set(k)} {...p} />
    </div>
  );
  const Area = ({ k, label, hint, ...p }) => (
    <div className={`field ${badKey === k ? 'bad' : ''}`}>
      <label htmlFor={`f-${k}`}>{label}{hint && <span className="hint"> · {hint}</span>}</label>
      <textarea id={`f-${k}`} className="textarea" value={f[k] ?? ''} onChange={set(k)} {...p} />
    </div>
  );
  const title = isEdit ? t(`Edit ${initial.name}`, `${initial.name_np || initial.name} सम्पादन`) : t('Add a monument', 'नयाँ स्मारक थप्नुहोस्');
  return (
    <Modal label={title} onClose={onClose} size="wide" form onSubmit={save}>
      <div className="modal-head"><h3>{title}</h3><button type="button" className="icon-btn" onClick={onClose} aria-label={t('Close', 'बन्द गर्नुहोस्')}><X size={16} /></button></div>
      <h4 className="form-section">{t('Basics', 'आधारभूत')}</h4>
      <div className="form-grid">
        {F({ k: 'name', label: t('Name', 'नाम'), maxLength: 120 })}{F({ k: 'name_np', label: t('Name in Nepali', 'नेपालीमा नाम'), lang: 'ne', maxLength: 120 })}
        <div className={`field ${badKey === 'slug' ? 'bad' : ''}`}><label htmlFor="f-slug">{t('Slug (URL)', 'स्लग (URL)')}</label><input id="f-slug" className="input" value={f.slug} maxLength={80} onChange={(e) => { setSlugTouched(true); setVal('slug', e.target.value); }} /></div>
        {F({ k: 'city', label: t('City', 'सहर'), maxLength: 60 })}
        <div className="field"><label htmlFor="f-prov">{t('Province', 'प्रदेश')}</label><Dropdown id="f-prov" value={f.province} options={PROVINCES.map((p) => ({ value: p, label: t.prov(p) }))} onChange={(v) => setVal('province', v)} /></div>
        {F({ k: 'district', label: t('District', 'जिल्ला'), maxLength: 40 })}
        {F({ k: 'lat', label: t('Latitude', 'अक्षांश'), type: 'number', step: 'any', hint: '26.3–30.5' })}{F({ k: 'lng', label: t('Longitude', 'देशान्तर'), type: 'number', step: 'any', hint: '80–88.3' })}
        <div className="field"><label htmlFor="f-type">{t('Type', 'किसिम')}</label><Dropdown id="f-type" value={f.type} options={TYPES.map((x) => ({ value: x, label: TYPE_LABEL[x] }))} onChange={(v) => setVal('type', v)} /></div>
        <div className="field"><label htmlFor="f-rel">{t('Religion', 'धर्म')}</label><Dropdown id="f-rel" value={f.religion} options={RELIGIONS.map(([v, np]) => ({ value: v, label: t(v, np) }))} onChange={(v) => setVal('religion', v)} /></div>
        {F({ k: 'deity', label: t('Deity', 'देवता'), maxLength: 120 })}{F({ k: 'zone_slug', label: t('Inside zone (slug)', 'क्षेत्र भित्र (स्लग)'), maxLength: 80 })}
        {F({ k: 'built_year', label: t('Built year', 'बनेको वर्ष'), type: 'number', hint: t('AD; negative for BC', 'ईस्वी; इसापूर्व भए ऋण') })}{F({ k: 'built_text', label: t('Built (text)', 'बनेको (लेखमा)'), maxLength: 300 })}
        {F({ k: 'dynasty', label: t('Era / dynasty', 'काल / वंश'), maxLength: 80 })}{F({ k: 'visit_minutes', label: t('Typical visit (min)', 'सामान्य भ्रमण (मिनेट)'), type: 'number', min: 1 })}
        {F({ k: 'open_time', label: t('Opens', 'खुल्ने समय'), placeholder: '06:00', hint: 'HH:MM' })}{F({ k: 'close_time', label: t('Closes', 'बन्द हुने समय'), placeholder: '18:00', hint: 'HH:MM' })}
        {F({ k: 'fee_foreigner', label: t('Fee foreigner (Rs)', 'विदेशीको शुल्क (रु)'), type: 'number', min: 0 })}{F({ k: 'fee_saarc', label: t('Fee SAARC (Rs)', 'सार्क शुल्क (रु)'), type: 'number', min: 0 })}
        {F({ k: 'fee_nepali', label: t('Fee Nepali (Rs)', 'नेपालीको शुल्क (रु)'), type: 'number', min: 0 })}
        <label className="row cap" style={{ alignSelf: 'end', minHeight: 48 }}><input type="checkbox" checked={f.unesco} onChange={set('unesco')} /> {t('UNESCO zone', 'युनेस्को क्षेत्र')}</label>
      </div>
      {F({ k: 'architecture', label: t('Architecture', 'वास्तुकला'), maxLength: 400 })}
      {F({ k: 'tags', label: t('Tags (comma separated)', 'ट्याग (कमाले छुट्याउनुहोस्)'), maxLength: 255 })}

      <h4 className="form-section">{t('Story in English', 'अंग्रेजीमा कथा')}</h4>
      {F({ k: 'short_text', label: t('Tagline (one line)', 'एक लाइनको परिचय'), maxLength: 200 })}
      {Area({ k: 'story', label: t('Audio-guide story', 'अडियो गाइडको कथा') })}
      {Area({ k: 'legend', label: t('Legend (optional)', 'दन्त्यकथा (ऐच्छिक)') })}
      <div className="field"><label htmlFor="f-facts">{t('Facts (one per line, up to 8)', 'तथ्य (एक लाइनमा एउटा, ८ सम्म)')}</label><textarea id="f-facts" className="textarea" value={facts} onChange={(e) => setFacts(e.target.value)} /></div>
      {Area({ k: 'quake_2015', label: t('2015 earthquake note (optional)', '२०७२ को भूकम्पको टिपोट (ऐच्छिक)'), style: { minHeight: 70 }, maxLength: 400 })}

      <h4 className="form-section">{t('Story in Nepali', 'नेपालीमा कथा')} <span className="hint">({t('shown when the Nepali toggle is on', 'नेपाली भाषा छान्दा देखिन्छ')})</span></h4>
      <div className="field"><label htmlFor="f-short_np">{t('Tagline in Nepali', 'नेपालीमा परिचय')}</label><input id="f-short_np" lang="ne" className="input" maxLength={500} value={f.short_np ?? ''} onChange={set('short_np')} /></div>
      <div className="field"><label htmlFor="f-story_np">{t('Story in Nepali', 'नेपालीमा कथा')}</label><textarea id="f-story_np" lang="ne" className="textarea" value={f.story_np ?? ''} onChange={set('story_np')} /></div>
      <div className="field"><label htmlFor="f-legend_np">{t('Legend in Nepali', 'नेपालीमा दन्त्यकथा')}</label><textarea id="f-legend_np" lang="ne" className="textarea" value={f.legend_np ?? ''} onChange={set('legend_np')} /></div>
      <div className="field"><label htmlFor="f-facts_np">{t('Facts in Nepali (one per line)', 'नेपालीमा तथ्य (एक लाइनमा एउटा)')}</label><textarea id="f-facts_np" lang="ne" className="textarea" value={factsNp} onChange={(e) => setFactsNp(e.target.value)} /></div>
      <div className="field"><label htmlFor="f-quake_np">{t('Earthquake note in Nepali', 'नेपालीमा भूकम्पको टिपोट')}</label><textarea id="f-quake_np" lang="ne" className="textarea" style={{ minHeight: 70 }} maxLength={900} value={f.quake_np ?? ''} onChange={set('quake_np')} /></div>

      <h4 className="form-section">{t('Photo', 'फोटो')}</h4>
      <PhotoField t={t} value={f.image_url} onChange={(url) => setVal('image_url', url)} />
      <div className="form-grid">{F({ k: 'image_page', label: t('Photo source page', 'फोटोको स्रोत पेज'), type: 'url', maxLength: 500 })}{F({ k: 'image_credit', label: t('Photo credit (author · licence)', 'फोटोको श्रेय (लेखक · इजाजत)'), maxLength: 255 })}</div>

      {err && <p className="error-text" role="alert">{err}</p>}
      <div className="form-actions"><button className="btn" type="submit" disabled={busy}><Save size={15} /> {busy ? t('Saving…', 'सुरक्षित हुँदैछ…') : t('Save monument', 'स्मारक सुरक्षित गर्नुहोस्')}</button><button type="button" className="btn ghost" onClick={onClose}>{t('Cancel', 'रद्द गर्नुहोस्')}</button></div>
    </Modal>
  );
}

function Monuments({ t, ask }) {
  const [list, err, load] = useLoad('/admin/monuments');
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const [edit, setEdit] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const toast = useToast();
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (list || []).filter((m) => (type === 'all' || m.type === type) && (!needle || `${m.name} ${m.name_np || ''} ${m.city} ${m.slug} ${m.type}`.toLowerCase().includes(needle)));
  }, [list, q, type]);
  const pg = usePaged(rows);
  useEffect(() => { pg.setPage(0); /* eslint-disable-next-line */ }, [q, type]);
  const types = useMemo(() => [...new Set((list || []).map((m) => m.type))].sort(), [list]);
  if (!list) return <LoadState err={err} retry={load} t={t} />;
  const remove = (m) => ask({
    title: t(`Delete ${m.name}?`, `${m.name_np || m.name} मेटाउने?`),
    text: t('Its quiz questions, clues, stamps, favorites and reviews are deleted too. This cannot be undone.', 'यसका क्विज प्रश्न, सुराग, छाप, मन परेका र समीक्षा पनि मेटिन्छन्। फिर्ता ल्याउन सकिँदैन।'),
    label: t('Delete monument', 'स्मारक मेटाउनुहोस्'), danger: true,
    yes: async () => { try { await api(`/admin/monuments/${m.id}`, { method: 'DELETE' }); toast(t('Monument deleted', 'स्मारक मेटियो'), 'ok'); load(); } catch (e) { toast(e.message, 'err'); } },
  });
  return (
    <>
      <div className="admin-bar">
        <label className="search"><Search size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Search name, city or slug', 'नाम, सहर वा स्लग खोज्नुहोस्')} aria-label={t('Search monuments', 'स्मारक खोज्नुहोस्')} /></label>
        <Dropdown label={t('Filter by type', 'किसिमले छान्नुहोस्')} value={type} options={[{ value: 'all', label: t('All types', 'सबै किसिम') }, ...types.map((x) => ({ value: x, label: TYPE_LABEL[x] || x }))]} onChange={setType} />
        <span className="grow admin-count">{t.n(rows.length)} {t('of', 'मध्ये')} {t.n(list.length)}</span>
        <button className="btn" onClick={() => setEdit({})}><Plus size={16} /> {t('Add monument', 'स्मारक थप्नुहोस्')}</button>
      </div>
      <div className="table-wrap card">
        <table className="table">
          <thead><tr><th>{t('Monument', 'स्मारक')}</th><th>{t('City', 'सहर')}</th><th>{t('Type', 'किसिम')}</th><th className="num">{t('Questions', 'प्रश्न')}</th><th className="num">{t('Clues', 'सुराग')}</th><th className="num">{t('Rating', 'रेटिङ')}</th><th><span className="sr-only">{t('Actions', 'कार्य')}</span></th></tr></thead>
          <tbody>
            {pg.slice.map((m) => (
              <tr key={m.id}>
                <td><div className="cell-mon">{m.image_url ? <img src={m.image_url} alt="" className="thumb" loading="lazy" /> : <span className="thumb" style={{ background: 'var(--card-2)' }} />}<span><Link to={`/m/${m.slug}`}><b>{m.name}</b></Link><br /><span className="cap" lang="ne">{m.name_np}</span></span></div></td>
                <td>{m.city}</td><td>{TYPE_LABEL[m.type] || m.type}{m.unesco ? ' · UNESCO' : ''}</td>
                <td className="num">{t.n(m.questions)}</td><td className="num">{t.n(m.clues)}</td><td className="num">{m.ratingCount ? `${t.n(m.avgRating.toFixed(1))} (${t.n(m.ratingCount)})` : '—'}</td>
                <td><div className="cell-actions">
                  <button className="icon-btn" onClick={() => setQuiz(m)} aria-label={t(`Quiz and clues for ${m.name}`, `${m.name_np || m.name}: क्विज र सुराग`)} title={t('Quiz and clues', 'क्विज र सुराग')}><Brain size={15} /></button>
                  <button className="icon-btn" onClick={() => setEdit(m)} aria-label={t(`Edit ${m.name}`, `${m.name_np || m.name} सम्पादन`)} title={t('Edit', 'सम्पादन')}><Pencil size={15} /></button>
                  <button className="icon-btn danger" onClick={() => remove(m)} aria-label={t(`Delete ${m.name}`, `${m.name_np || m.name} मेटाउनुहोस्`)} title={t('Delete', 'मेटाउनुहोस्')}><Trash2 size={15} /></button>
                </div></td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan="7" className="admin-empty">{t('No monuments match.', 'मिल्ने स्मारक भेटिएन।')}</td></tr>}
          </tbody>
        </table>
        <Pager p={pg} t={t} />
      </div>
      {edit && <MonumentForm t={t} initial={edit.id ? edit : null} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); toast(t('Monument saved', 'स्मारक सुरक्षित भयो'), 'ok'); load(); }} />}
      {quiz && <QuizEditor t={t} ask={ask} monument={quiz} onClose={() => { setQuiz(null); load(); }} />}
    </>
  );
}

// ---- explorers ----------------------------------------------------------------------------------------------------
function UsersTab({ t, ask }) {
  const { user: me } = useAuth();
  const [list, err, load] = useLoad('/admin/users');
  const [q, setQ] = useState('');
  const [role, setRole] = useState('all');
  const toast = useToast();
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (list || []).filter((u) => (role === 'all' || u.role === role) && (!needle || `${u.name} ${u.email}`.toLowerCase().includes(needle)));
  }, [list, q, role]);
  const pg = usePaged(rows);
  useEffect(() => { pg.setPage(0); /* eslint-disable-next-line */ }, [q, role]);
  if (!list) return <LoadState err={err} retry={load} t={t} />;
  const patch = async (u, body, okMsg) => {
    try { await api(`/admin/users/${u.id}`, { method: 'PATCH', body }); toast(okMsg, 'ok'); load(); } catch (e) { toast(e.message, 'err'); }
  };
  const setActive = (u) => {
    if (u.is_active) {
      ask({
        title: t(`Deactivate ${u.name}?`, `${u.name} लाई निष्क्रिय पार्ने?`), text: t('They are signed out at once and cannot log in until you activate them again.', 'उहाँ तुरुन्तै लगआउट हुनुहुन्छ र फेरि सक्रिय नगरेसम्म लगइन गर्न सक्नुहुन्न।'),
        label: t('Deactivate', 'निष्क्रिय गर्नुहोस्'), danger: true, yes: () => patch(u, { active: false }, t('Account deactivated', 'खाता निष्क्रिय भयो')),
      });
    } else patch(u, { active: true }, t('Account activated', 'खाता सक्रिय भयो'));
  };
  const setRoleOf = (u, r) => {
    if (r === u.role) return;
    ask({
      title: r === 'admin' ? t(`Make ${u.name} an admin?`, `${u.name} लाई एडमिन बनाउने?`) : t(`Make ${u.name} an explorer?`, `${u.name} लाई अन्वेषक बनाउने?`),
      text: r === 'admin' ? t('Admins can edit all monuments, quizzes and accounts.', 'एडमिनले सबै स्मारक, क्विज र खाता सम्पादन गर्न सक्छन्।') : t('They lose access to this control room at once.', 'उहाँले यो कन्ट्रोल रुमको पहुँच तुरुन्तै गुमाउनुहुन्छ।'),
      label: t('Change role', 'भूमिका बदल्नुहोस्'), yes: () => patch(u, { role: r }, t('Role updated', 'भूमिका बदलियो')),
    });
  };
  const roleOpts = [{ value: 'explorer', label: t('Explorer', 'अन्वेषक') }, { value: 'admin', label: t('Admin', 'एडमिन') }];
  return (
    <>
      <div className="admin-bar">
        <label className="search"><Search size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Search name or email', 'नाम वा इमेल खोज्नुहोस्')} aria-label={t('Search people', 'मान्छे खोज्नुहोस्')} /></label>
        <Dropdown label={t('Filter by role', 'भूमिकाले छान्नुहोस्')} value={role} options={[{ value: 'all', label: t('All roles', 'सबै भूमिका') }, ...roleOpts]} onChange={setRole} />
        <span className="grow admin-count">{t.n(rows.length)} {t('of', 'मध्ये')} {t.n(list.length)}</span>
      </div>
      <div className="table-wrap card">
        <table className="table">
          <thead><tr><th>{t('Name', 'नाम')}</th><th>{t('Email', 'इमेल')}</th><th>{t('Role', 'भूमिका')}</th><th className="num">{t('Rating', 'रेटिङ')}</th><th className="num">{t('Stamps', 'छाप')}</th><th>{t('Joined', 'सामेल')}</th><th>{t('Status', 'अवस्था')}</th></tr></thead>
          <tbody>
            {pg.slice.map((u) => {
              const self = u.id === me?.id;
              return (
                <tr key={u.id}>
                  <td><b>{u.name}</b>{self && <span className="tag" style={{ marginLeft: 8 }}>{t('You', 'तपाईं')}</span>}</td><td>{u.email}</td>
                  <td>{self ? t('Admin', 'एडमिन') : <Dropdown label={t(`Role of ${u.name}`, `${u.name} को भूमिका`)} value={u.role} options={roleOpts} onChange={(r) => setRoleOf(u, r)} />}</td>
                  <td className="num">{t.n(u.rating)} ({t.n(u.answered)})</td><td className="num">{t.n(u.stamps)}</td><td>{fmtDate(u.created_at)}</td>
                  <td>{self ? <span className="tag ok">{t('Active', 'सक्रिय')}</span> : (
                    <button className={`btn sm ${u.is_active ? 'ghost' : ''}`} onClick={() => setActive(u)}>{u.is_active ? t('Deactivate', 'निष्क्रिय गर्नुहोस्') : t('Activate', 'सक्रिय गर्नुहोस्')}</button>
                  )}</td>
                </tr>
              );
            })}
            {!rows.length && <tr><td colSpan="7" className="admin-empty">{t('No one matches.', 'कोही भेटिएन।')}</td></tr>}
          </tbody>
        </table>
        <Pager p={pg} t={t} />
      </div>
    </>
  );
}

// ---- reviews and activity ------------------------------------------------------------------------------------------
function Reviews({ t, ask }) {
  const [list, err, load] = useLoad('/admin/reviews');
  const toast = useToast();
  const pg = usePaged(list || []);
  if (!list) return <LoadState err={err} retry={load} t={t} />;
  const remove = (r) => ask({
    title: t('Delete this review?', 'यो समीक्षा मेटाउने?'), text: `${r.user_name} · ${r.monument}${r.comment ? `: ${r.comment}` : ''}`, label: t('Delete', 'मेटाउनुहोस्'), danger: true,
    yes: async () => { try { await api(`/admin/reviews/${r.id}`, { method: 'DELETE' }); toast(t('Review deleted', 'समीक्षा मेटियो'), 'ok'); load(); } catch (e) { toast(e.message, 'err'); } },
  });
  if (!list.length) return <p className="muted">{t('No reviews yet.', 'अहिलेसम्म कुनै समीक्षा छैन।')}</p>;
  return (
    <div className="table-wrap card">
      <table className="table">
        <thead><tr><th>{t('Monument', 'स्मारक')}</th><th>{t('By', 'लेख्ने')}</th><th>{t('Stars', 'तारा')}</th><th>{t('Comment', 'टिप्पणी')}</th><th>{t('Date', 'मिति')}</th><th><span className="sr-only">{t('Actions', 'कार्य')}</span></th></tr></thead>
        <tbody>{pg.slice.map((r) => (
          <tr key={r.id}>
            <td><Link to={`/m/${r.slug}`}><b>{r.monument}</b></Link></td><td>{r.user_name}</td>
            <td><span className="stars" aria-label={`${r.stars} / 5`}>{'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</span></td>
            <td className="wrap">{r.comment || <span className="cap">—</span>}</td><td>{fmtDate(r.created_at)}</td>
            <td><div className="cell-actions"><button className="icon-btn danger" onClick={() => remove(r)} aria-label={t('Delete review', 'समीक्षा मेटाउनुहोस्')}><Trash2 size={15} /></button></div></td>
          </tr>
        ))}</tbody>
      </table>
      <Pager p={pg} t={t} />
    </div>
  );
}

const METHOD = { gps: ['GPS', 'जीपीएस'], manual: ['Manual', 'आफैँ'], game: ['Game', 'खेल'] };

function Table({ path, cols, row, empty, t }) {
  const [list, err, load] = useLoad(path);
  const pg = usePaged(list || []);
  if (!list) return <LoadState err={err} retry={load} t={t} />;
  if (!list.length) return <p className="muted">{empty}</p>;
  return (
    <div className="table-wrap card">
      <table className="table"><thead><tr>{cols.map(([label, cls]) => <th key={label} className={cls}>{label}</th>)}</tr></thead><tbody>{pg.slice.map(row)}</tbody></table>
      <Pager p={pg} t={t} />
    </div>
  );
}

function ActivityTab({ t }) {
  const [sub, setSub] = useState('stamps');
  const SUBS = [['stamps', t('Stamps', 'छाप')], ['games', t('Find games', 'खोज खेल')], ['hunts', t('Live hunts', 'लाइभ खोज')]];
  return (
    <>
      <div className="seg admin-subtabs">{SUBS.map(([k, label]) => <button key={k} className={sub === k ? 'on' : ''} onClick={() => setSub(k)}>{label}</button>)}</div>
      {sub === 'stamps' && <Table t={t} path="/admin/stamps" empty={t('No stamps collected yet.', 'अहिलेसम्म कुनै छाप संकलन भएको छैन।')}
        cols={[[t('Explorer', 'अन्वेषक')], [t('Monument', 'स्मारक')], [t('How', 'कसरी')], [t('When', 'कहिले')]]}
        row={(s, i) => <tr key={`${s.slug}-${s.user_name}-${i}`}><td><b>{s.user_name}</b></td><td><Link to={`/m/${s.slug}`}>{s.monument}</Link></td><td>{t(...(METHOD[s.method] || [s.method, s.method]))}</td><td>{fmtDate(s.created_at)}</td></tr>} />}
      {sub === 'games' && <Table t={t} path="/admin/games" empty={t('No Find games played yet.', 'अहिलेसम्म कुनै खोज खेल खेलिएको छैन।')}
        cols={[[t('Player', 'खेलाडी')], [t('Mode', 'किसिम')], [t('Points', 'पोइन्ट'), 'num'], [t('Rounds', 'राउन्ड'), 'num'], [t('Hunt', 'खोज')], [t('When', 'कहिले')]]}
        row={(g) => <tr key={g.id}><td><b>{g.player_name}</b></td><td>{g.mode === 'solo' ? t('Solo', 'एक्लै') : t('Live hunt', 'लाइभ खोज')}</td><td className="num">{t.n(g.points)}</td><td className="num">{t.n(g.rounds)}</td><td className="num">{g.hunt_code || '—'}</td><td>{fmtDate(g.created_at)}</td></tr>} />}
      {sub === 'hunts' && <Table t={t} path="/admin/hunts" empty={t('No live hunts yet.', 'अहिलेसम्म कुनै लाइभ खोज भएको छैन।')}
        cols={[[t('Code', 'कोड')], [t('Host', 'होस्ट')], [t('Winner', 'विजेता')], [t('Players', 'खेलाडी'), 'num'], [t('Rounds', 'राउन्ड'), 'num'], [t('Finished', 'सकिएको')]]}
        row={(h) => <tr key={h.code}><td className="num"><b>{h.code}</b></td><td>{h.host_name}</td><td>{h.winner_name || '—'}</td><td className="num">{t.n(h.players)}</td><td className="num">{t.n(h.rounds)}</td><td>{h.finished_at ? fmtDate(h.finished_at) : t('Running', 'चलिरहेको')}</td></tr>} />}
    </>
  );
}

export default function Admin() {
  const t = useT();
  const [tab, setTab] = useState('dash');
  const [ask, setAsk] = useState(null);
  const TABS = [['dash', t('Dashboard', 'ड्यासबोर्ड'), LayoutDashboard], ['mon', t('Monuments & quiz', 'स्मारक र क्विज'), Landmark], ['users', t('Explorers', 'अन्वेषक'), Users], ['reviews', t('Reviews', 'समीक्षा'), MessageSquare], ['activity', t('Activity', 'गतिविधि'), Activity]];
  return (
    <div className="page wrap admin">
      <div className="page-head"><div className="eyebrow">{t('Admin', 'एडमिन')}</div><h1 style={{ fontSize: 'var(--fs-h2)' }}>{t('Sampada control room', 'सम्पदा कन्ट्रोल रुम')}</h1></div>
      <div className="admin-tabs" role="tablist">
        {TABS.map(([k, label, I]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}><I size={15} /> {label}</button>)}
      </div>
      {tab === 'dash' && <Dashboard t={t} />}
      {tab === 'mon' && <Monuments t={t} ask={setAsk} />}
      {tab === 'users' && <UsersTab t={t} ask={setAsk} />}
      {tab === 'reviews' && <Reviews t={t} ask={setAsk} />}
      {tab === 'activity' && <ActivityTab t={t} />}
      {ask && <Confirm ask={ask} t={t} onClose={() => setAsk(null)} />}
    </div>
  );
}
