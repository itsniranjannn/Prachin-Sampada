import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { Loader } from '../components/Shell.jsx';

export default function Credits() {
  const [list, setList] = useState(null);
  useEffect(() => { api('/monuments').then((d) => setList(d.results)).catch(() => setList([])); }, []);
  return (
    <div className="page wrap" style={{ paddingBottom: '3rem', maxWidth: 900 }}>
      <div className="page-head">
        <div className="eyebrow">Credits</div>
        <h1 style={{ fontSize: 'var(--fs-h2)' }}>Photo credits and sources</h1>
        <p className="muted">Photos are from Wikimedia Commons under Creative Commons licences; each monument page links its photo source and the references used for its story. Map data © OpenStreetMap contributors, tiles by OpenFreeMap. Fonts: Rozha One, Eczar, Mukta, Noto Sans Devanagari and Yatra One (SIL Open Font License).</p>
      </div>
      {!list ? <Loader /> : (
        <ul className="credit-list">
          {list.map((m) => <li key={m.id}><Link to={`/m/${m.slug}`}>{m.name}</Link><span className="cap">{m.imageCredit || '—'}</span></li>)}
        </ul>
      )}
    </div>
  );
}
