import { useEffect, useMemo, useState } from 'react';
import { Dropdown } from '../components/Pickers.jsx';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Landmark, Users, Trophy, Plus, Pencil, Trash2, X, Save, Search, Brain, ImagePlus } from 'lucide-react';
import { api, getToken } from '../lib/api.js';
import { useToast } from '../lib/toast.jsx';
import { Loader } from '../components/Shell.jsx';
import { TYPE_LABEL } from '../components/MonumentCard.jsx';

const TYPES = Object.keys(TYPE_LABEL);
const EMPTY = { slug: '', name: '', name_np: '', city: 'Kathmandu', zone_slug: '', lat: '', lng: '', type: 'pagoda', religion: 'Hindu', deity: '', built_year: '', built_text: '', dynasty: 'Malla', architecture: '', unesco: false, short_text: '', story: '', legend: '', open_time: '', close_time: '', fee_foreigner: '', fee_saarc: '', fee_nepali: '', visit_minutes: 30, image_url: '', image_page: '', image_credit: '', tags: '', facts: [] };

function Bars({ data, label, value }) {
  const max = Math.max(1, ...data.map(value));
  return (
    <div className="bars">
      {data.map((d, i) => (
        <div key={i} className="bar-row"><span className="cap">{label(d)}</span><div><i style={{ width: `${(value(d) / max) * 100}%` }} /></div><b className="num small">{value(d)}</b></div>
      ))}
      {!data.length && <p className="cap">No data yet.</p>}
    </div>
  );
}

function Dashboard() {
  const [s, setS] = useState(null);
  useEffect(() => { api('/admin/stats').then(setS).catch(() => {}); }, []);
  if (!s) return <Loader />;
  const kpis = [['Explorers', s.explorers], ['Stamps', s.stamps], ['Quiz answers', s.quizAnswers], ['Quiz accuracy', `${s.quizAccuracy}%`], ['Find games', s.games], ['Avg Find score', s.avgGame], ['Live hunts', s.hunts], ['Saved walks', s.tours]];
  return (
    <>
      <div className="kpis">{kpis.map(([k, v]) => <div key={k} className="kpi card"><span className="cap">{k}</span><b className="num">{v}</b></div>)}</div>
      <div className="grid-2" style={{ marginTop: "1rem", alignItems: "start" }}>
        <div className="card pad-l"><h5>Quiz answers, last 14 days</h5><Bars data={s.perDay} label={(d) => new Date(d.d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} value={(d) => d.n} /></div>
        <div className="card pad-l"><h5>Most stamped monuments</h5><Bars data={s.topStamped} label={(d) => d.name} value={(d) => d.n} /></div>
        <div className="card pad-l"><h5>Monuments by type</h5><Bars data={s.byType} label={(d) => TYPE_LABEL[d.type] || d.type} value={(d) => d.n} /></div>
        <div className="card pad-l"><h5>Hardest questions (highest Elo)</h5>
          {!s.hardest.length ? <p className="cap">Questions earn ratings once they are answered.</p> : s.hardest.map((q) => <div key={q.id} className="hard-q"><span className="small">{q.question}…</span><span className="cap num">Elo {q.rating} · {q.times_correct}/{q.times_asked} correct</span></div>)}
        </div>
      </div>
    </>
  );
}

function QuestionEditor({ monument, onClose }) {
  const toast = useToast();
  const [list, setList] = useState(null);
  const [f, setF] = useState(null);
  const load = () => api(`/admin/monuments/${monument.id}/questions`).then((d) => setList(d.results));
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);
  const save = async () => {
    try {
      if (f.id) await api(`/admin/questions/${f.id}`, { method: 'PUT', body: f });
      else await api(`/admin/monuments/${monument.id}/questions`, { method: 'POST', body: f });
      toast('Question saved', 'ok'); setF(null); load();
    } catch (e) { toast(e.message, 'err'); }
  };
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={`Questions for ${monument.name}`}>
      <div className="modal-card card pad-l">
        <div className="row between"><h3 style={{ margin: 0 }}>Quiz · {monument.name}</h3><button className="icon-btn" onClick={onClose} aria-label="Close"><X size={16} /></button></div>
        {!list ? <Loader /> : !f ? (
          <>
            {list.map((q) => (
              <div key={q.id} className="q-row">
                <span><b>{q.question}</b><span className="cap">Difficulty {q.difficulty} · Elo {q.rating} · {q.times_correct}/{q.times_asked} correct · answer: {q.options[q.answer_index]}</span></span>
                <button className="icon-btn" onClick={() => setF({ ...q })} aria-label="Edit question"><Pencil size={14} /></button>
                <button className="icon-btn" onClick={async () => { if (confirm('Delete this question?')) { await api(`/admin/questions/${q.id}`, { method: 'DELETE' }); load(); } }} aria-label="Delete question"><Trash2 size={14} /></button>
              </div>
            ))}
            <button className="btn sm" style={{ marginTop: '0.8rem' }} onClick={() => setF({ question: '', options: ['', '', '', ''], answer_index: 0, difficulty: 2, explanation: '' })}><Plus size={15} /> Add question</button>
          </>
        ) : (
          <div className="grid" style={{ gap: '0.7rem', marginTop: '1rem' }}>
            <div className="field"><label>Question</label><input className="input" value={f.question} onChange={(e) => setF({ ...f, question: e.target.value })} /></div>
            {f.options.map((o, i) => (
              <div key={i} className="row"><input type="radio" name="ans" checked={f.answer_index === i} onChange={() => setF({ ...f, answer_index: i })} aria-label={`Option ${i + 1} is correct`} /><input className="input" style={{ flex: 1 }} value={o} placeholder={`Option ${i + 1}`} onChange={(e) => { const opts = [...f.options]; opts[i] = e.target.value; setF({ ...f, options: opts }); }} /></div>
            ))}
            <div className="row"><label className="cap">Difficulty</label><input type="range" min="1" max="5" value={f.difficulty} onChange={(e) => setF({ ...f, difficulty: Number(e.target.value) })} /><b>{f.difficulty}</b></div>
            <div className="field"><label>Explanation shown after answering</label><input className="input" value={f.explanation} onChange={(e) => setF({ ...f, explanation: e.target.value })} /></div>
            <div className="row"><button className="btn" onClick={save}><Save size={15} /> Save</button><button className="btn ghost" onClick={() => setF(null)}>Cancel</button></div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Photo field: drag and drop, click to browse, or paste a link. Uploads go to /api/admin/uploads. */
function PhotoField({ value, onChange }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [over, setOver] = useState(false);
  const upload = async (file) => {
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) return setErr('The photo must be 6 MB or smaller');
    setBusy(true); setErr('');
    try {
      const res = await fetch('/api/admin/uploads', { method: 'POST', headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/octet-stream' }, body: file });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Upload failed');
      onChange(d.url);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  return (
    <div className="field">
      <label htmlFor="f-photo">Photo</label>
      <label
        className={`dropzone ${over ? 'over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); upload(e.dataTransfer.files?.[0]); }}
      >
        {value ? <img src={value} alt="Monument photo preview" /> : <ImagePlus size={28} />}
        <span>{busy ? 'Uploading…' : value ? 'Drop or click to replace the photo' : 'Drop a JPEG, PNG or WebP here, or click to choose (max 6 MB)'}</span>
        <input id="f-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => upload(e.target.files?.[0])} hidden />
      </label>
      <input className="input" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="…or paste an image link (e.g. Wikimedia Commons)" aria-label="Photo link" />
      {err && <span className="error-text">{err}</span>}
    </div>
  );
}

function MonumentForm({ initial, onClose, onSaved }) {
  const [f, setF] = useState({ ...EMPTY, ...initial, unesco: !!initial?.unesco, facts: initial?.facts || [] });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const save = async (e) => {
    e.preventDefault();
    setErr('');
    const body = { ...f, lat: Number(f.lat), lng: Number(f.lng), built_year: f.built_year ? Number(f.built_year) : null, visit_minutes: Number(f.visit_minutes) || 30, facts: String(Array.isArray(f.facts) ? f.facts.join('\n') : f.facts).split('\n').map((x) => x.trim()).filter(Boolean) };
    for (const k of ['fee_foreigner', 'fee_saarc', 'fee_nepali']) body[k] = f[k] === '' || f[k] == null ? null : Number(f[k]);
    try {
      if (initial?.id) await api(`/admin/monuments/${initial.id}`, { method: 'PUT', body });
      else await api('/admin/monuments', { method: 'POST', body });
      onSaved();
    } catch (x) { setErr(x.message); }
  };
  const F = ({ k, label, type = 'text', ...p }) => <div className="field"><label htmlFor={`f-${k}`}>{label}</label><input id={`f-${k}`} className="input" type={type} value={f[k] ?? ''} onChange={set(k)} {...p} /></div>;
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={initial?.id ? `Edit ${initial.name}` : 'Add monument'}>
      <form className="modal-card card pad-l" onSubmit={save}>
        <div className="row between"><h3 style={{ margin: 0 }}>{initial?.id ? `Edit ${initial.name}` : 'Add a monument'}</h3><button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><X size={16} /></button></div>
        <div className="form-grid">
          {F({ k: 'name', label: 'Name', required: true })}{F({ k: 'name_np', label: 'Name in Nepali', lang: 'ne' })}
          {F({ k: 'slug', label: 'Slug (URL)', required: true, pattern: '[a-z0-9-]{3,80}' })}{F({ k: 'city', label: 'City', required: true })}
          {F({ k: 'lat', label: 'Latitude', type: 'number', step: 'any', required: true })}{F({ k: 'lng', label: 'Longitude', type: 'number', step: 'any', required: true })}
          <div className="field"><label htmlFor="f-type">Type</label><Dropdown id="f-type" value={f.type} options={TYPES.map((t) => ({ value: t, label: TYPE_LABEL[t] }))} onChange={(v) => set('type')({ target: { value: v } })} /></div>
          <div className="field"><label htmlFor="f-rel">Religion</label><Dropdown id="f-rel" value={f.religion} options={['Hindu', 'Buddhist', 'Both', 'Secular'].map((t) => ({ value: t, label: t }))} onChange={(v) => set('religion')({ target: { value: v } })} /></div>
          {F({ k: 'deity', label: 'Deity' })}{F({ k: 'zone_slug', label: 'Inside zone (slug)' })}
          {F({ k: 'built_year', label: 'Built year', type: 'number' })}{F({ k: 'built_text', label: 'Built (text)' })}
          {F({ k: 'dynasty', label: 'Era / dynasty' })}{F({ k: 'visit_minutes', label: 'Typical visit (min)', type: 'number' })}
          {F({ k: 'open_time', label: 'Opens (HH:MM)', pattern: '[0-2][0-9]:[0-5][0-9]' })}{F({ k: 'close_time', label: 'Closes (HH:MM)', pattern: '[0-2][0-9]:[0-5][0-9]' })}
          {F({ k: 'fee_foreigner', label: 'Fee foreigner (Rs)', type: 'number' })}{F({ k: 'fee_saarc', label: 'Fee SAARC (Rs)', type: 'number' })}
          {F({ k: 'fee_nepali', label: 'Fee Nepali (Rs)', type: 'number' })}<label className="row cap" style={{ alignSelf: 'end' }}><input type="checkbox" checked={f.unesco} onChange={set('unesco')} /> UNESCO zone</label>
        </div>
        {F({ k: 'short_text', label: 'Tagline (one line)', maxLength: 200 })}
        {F({ k: 'architecture', label: 'Architecture' })}
        <div className="field"><label htmlFor="f-story">Audio-guide story</label><textarea id="f-story" className="textarea" value={f.story} onChange={set('story')} required /></div>
        <div className="field"><label htmlFor="f-legend">Legend (optional)</label><textarea id="f-legend" className="textarea" value={f.legend || ''} onChange={set('legend')} /></div>
        <div className="field"><label htmlFor="f-facts">Facts (one per line)</label><textarea id="f-facts" className="textarea" value={Array.isArray(f.facts) ? f.facts.join('\n') : f.facts} onChange={(e) => setF({ ...f, facts: e.target.value })} /></div>
        <PhotoField value={f.image_url} onChange={(url) => setF((x) => ({ ...x, image_url: url }))} />
        <div className="form-grid">{F({ k: 'image_page', label: 'Photo source page', type: 'url' })}{F({ k: 'image_credit', label: 'Photo credit (author · licence)' })}</div>
        {F({ k: 'tags', label: 'Tags (comma separated)' })}

        {err && <p className="error-text">{err}</p>}
        <div className="row" style={{ marginTop: '1rem' }}><button className="btn" type="submit"><Save size={15} /> Save monument</button><button type="button" className="btn ghost" onClick={onClose}>Cancel</button></div>
      </form>
    </div>
  );
}

function Monuments() {
  const [list, setList] = useState(null);
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const toast = useToast();
  const load = () => api('/admin/monuments').then((d) => setList(d.results));
  useEffect(() => { load(); }, []);
  const rows = useMemo(() => (list || []).filter((m) => `${m.name} ${m.city} ${m.type}`.toLowerCase().includes(q.toLowerCase())), [list, q]);
  if (!list) return <Loader />;
  return (
    <>
      <div className="row between" style={{ marginBottom: '1rem' }}>
        <label className="search" style={{ flex: 1, maxWidth: 380 }}><Search size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter monuments" aria-label="Filter monuments" /></label>
        <button className="btn" onClick={() => setEdit({})}><Plus size={16} /> Add monument</button>
      </div>
      <div className="table-wrap card">
        <table className="table">
          <thead><tr><th>Monument</th><th>City</th><th>Type</th><th>Questions</th><th>Rating</th><th /></tr></thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id}>
                <td><div className="row" style={{ flexWrap: 'nowrap' }}>{m.image_url && <img src={m.image_url} alt="" className="thumb" />}<span><Link to={`/m/${m.slug}`}><b>{m.name}</b></Link><br /><span className="cap" lang="ne">{m.name_np}</span></span></div></td>
                <td>{m.city}</td><td>{TYPE_LABEL[m.type] || m.type}{m.unesco ? ' · UNESCO' : ''}</td>
                <td className="num">{m.questions}</td><td className="num">{m.ratingCount ? `${m.avgRating.toFixed(1)} (${m.ratingCount})` : '—'}</td>
                <td><div className="row" style={{ flexWrap: 'nowrap' }}>
                  <button className="icon-btn" onClick={() => setQuiz(m)} aria-label={`Questions for ${m.name}`} title="Quiz questions"><Brain size={15} /></button>
                  <button className="icon-btn" onClick={() => setEdit(m)} aria-label={`Edit ${m.name}`}><Pencil size={15} /></button>
                  <button className="icon-btn" onClick={async () => { if (confirm(`Delete ${m.name}? Its questions, stamps and reviews are deleted too.`)) { await api(`/admin/monuments/${m.id}`, { method: 'DELETE' }); toast('Monument deleted', 'ok'); load(); } }} aria-label={`Delete ${m.name}`}><Trash2 size={15} /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {edit && <MonumentForm initial={edit.id ? edit : null} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); toast('Monument saved', 'ok'); load(); }} />}
      {quiz && <QuestionEditor monument={quiz} onClose={() => { setQuiz(null); load(); }} />}
    </>
  );
}

function UsersTab() {
  const [list, setList] = useState(null);
  const toast = useToast();
  const load = () => api('/admin/users').then((d) => setList(d.results));
  useEffect(() => { load(); }, []);
  if (!list) return <Loader />;
  return (
    <div className="table-wrap card">
      <table className="table">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Rating</th><th>Stamps</th><th>Status</th></tr></thead>
        <tbody>{list.map((u) => (
          <tr key={u.id}>
            <td><b>{u.name}</b></td><td>{u.email}</td><td>{u.role}</td><td className="num">{u.rating} ({u.answered})</td><td className="num">{u.stamps}</td>
            <td>{u.role === 'admin' ? <span className="tag ok">Active</span> : (
              <button className={`btn sm ${u.is_active ? 'ghost' : ''}`} onClick={async () => { try { await api(`/admin/users/${u.id}`, { method: 'PATCH', body: { active: !u.is_active } }); load(); } catch (e) { toast(e.message, 'err'); } }}>{u.is_active ? 'Deactivate' : 'Activate'}</button>
            )}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function Hunts() {
  const [list, setList] = useState(null);
  useEffect(() => { api('/admin/hunts').then((d) => setList(d.results)); }, []);
  if (!list) return <Loader />;
  return !list.length ? <p className="muted">No live hunts have finished yet.</p> : (
    <div className="table-wrap card"><table className="table">
      <thead><tr><th>Code</th><th>Winner</th><th>Players</th><th>Rounds</th><th>Finished</th></tr></thead>
      <tbody>{list.map((h) => <tr key={h.code + h.created_at}><td className="num"><b>{h.code}</b></td><td>{h.winner_name || '—'}</td><td>{h.players}</td><td>{h.rounds}</td><td>{h.finished_at ? new Date(h.finished_at).toLocaleString('en-GB') : 'running'}</td></tr>)}</tbody>
    </table></div>
  );
}

export default function Admin() {
  const [tab, setTab] = useState('dash');
  const TABS = [['dash', 'Dashboard', LayoutDashboard], ['mon', 'Monuments & quiz', Landmark], ['users', 'Explorers', Users], ['hunts', 'Live hunts', Trophy]];
  return (
    <div className="page wrap" style={{ paddingBottom: '3rem' }}>
      <div className="page-head"><div className="eyebrow">Admin · एडमिन</div><h1 style={{ fontSize: 'var(--fs-h2)' }}>Sampada control room</h1></div>
      <div className="seg" style={{ marginBottom: '1.4rem', flexWrap: 'wrap' }}>
        {TABS.map(([k, label, I]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}><I size={15} /> {label}</button>)}
      </div>
      {tab === 'dash' && <Dashboard />}
      {tab === 'mon' && <Monuments />}
      {tab === 'users' && <UsersTab />}
      {tab === 'hunts' && <Hunts />}
    </div>
  );
}
