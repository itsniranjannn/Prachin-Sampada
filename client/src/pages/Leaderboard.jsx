import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Brain, Crosshair } from 'lucide-react';
import { api } from '../lib/api.js';
import { Loader } from '../components/Shell.jsx';

const Medal = ({ i }) => <span className={`medal m${i}`}>{i + 1}</span>;

export default function Leaderboard() {
  const [d, setD] = useState(null);
  useEffect(() => { api('/play/leaderboard').then(setD).catch(() => setD({ quiz: [], game: [] })); }, []);
  return (
    <div className="page wrap" style={{ paddingBottom: '3rem' }}>
      <div className="page-head">
        <div className="eyebrow">Leaderboard · अग्रता सूची</div>
        <h1 style={{ fontSize: 'var(--fs-h2)' }}>Keepers of Nepal’s stories</h1>
      </div>
      {!d ? <Loader /> : (
        <div className="grid-2">
          <div className="card pad-l">
            <h4><Brain size={18} /> Quiz ratings</h4>
            {!d.quiz.length ? <p className="muted">No one has a rating yet. <Link to="/quiz">Be the first</Link>.</p> : (
              <ol className="lb">{d.quiz.map((u, i) => <li key={u.name + i}><Medal i={i} /><span><b>{u.name}</b><span className="cap">{u.level.label} · {u.answered} answered</span></span><b className="num">{u.rating}</b></li>)}</ol>
            )}
          </div>
          <div className="card pad-l">
            <h4><Crosshair size={18} /> Find the Monument best scores</h4>
            {!d.game.length ? <p className="muted">No games yet. <Link to="/find">Play one</Link>.</p> : (
              <ol className="lb">{d.game.map((g, i) => <li key={g.name + i}><Medal i={i} /><span><b>{g.name}</b></span><b className="num">{Number(g.points).toLocaleString()}</b></li>)}</ol>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
