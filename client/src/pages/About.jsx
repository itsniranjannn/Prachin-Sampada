import { Link } from 'react-router-dom';
import { Route, Brain, Crosshair, Sparkles, Users, Headphones } from 'lucide-react';

const SECTIONS = [
  { I: Route, t: 'Heritage walk planner', d: 'An Orienteering Problem with Time Windows. Every monument gets a value from your interests (with a small UNESCO bonus, and a large one for places you chose). Starting empty, the planner inserts the place with the best value per extra minute at its cheapest feasible position, checking that each visit starts after opening and ends before closing and that the day ends on time. Then 2-opt reverses parts of the route while that shortens it, and the freed minutes are filled again. Legs under about 2.5 km of lane walking are walked; longer ones become a taxi with an estimated fare. On small cases the result matches exhaustive search.' },
  { I: Brain, t: 'Adaptive quiz (Elo + SM-2)', d: 'You and every question carry an Elo rating. Your chance of answering is predicted as 1 / (1 + 10^((question − you)/400)). After each answer both ratings move in proportion to how surprising the result was, a little more for fast correct answers. The next question is the one whose predicted success is closest to 70%. Questions you miss enter an SM-2 spaced-repetition queue and come back after 1, 6, then a growing number of days.' },
  { I: Crosshair, t: 'Find the Monument scoring', d: 'Your pin is compared with the real location using the Haversine great-circle distance. Within 40 m scores a perfect 800; beyond that the distance score decays exponentially with a 1.2 km scale. A speed bonus of up to 200 is scaled by accuracy, and a hint costs 100. The server holds the answers, so they cannot be read from the page.' },
  { I: Users, t: 'Live heritage hunts', d: 'Rooms run over Socket.io. The server picks the rounds with a seeded shuffle, times each round, scores every guess the moment it arrives and broadcasts a live leaderboard ranked by points, then total time. Dropped players can rejoin with the same name and keep their score.' },
  { I: Sparkles, t: 'Recommendations', d: 'A weighted score of interest match (cosine similarity of tag sets), a Bayesian-averaged explorer rating, novelty (places you have not stamped) and nearness when your location is known. Each suggestion lists its reasons.' },
  { I: Headphones, t: 'Audio guide', d: 'Stories are read aloud by your device’s speech engine, split into chapters (story, legend, facts). Nothing is downloaded, so it also works on slow connections.' },
];

export default function About() {
  return (
    <div className="page wrap" style={{ paddingBottom: '3rem', maxWidth: 900 }}>
      <div className="page-head">
        <div className="eyebrow">How it works</div>
        <h1 style={{ fontSize: 'var(--fs-h2)' }}>The engine behind Hamro Prachin Sampada</h1>
        <p className="lead">Classical, explainable algorithms adapted to Nepal’s lanes, hill roads, opening hours and stories. Free resources only: OpenStreetMap data via OpenFreeMap tiles, Wikimedia Commons photos, and open-source libraries.</p>
      </div>
      <div className="grid">
        {SECTIONS.map((s) => (
          <div key={s.t} className="how-item card"><div className="how-icon"><s.I size={20} /></div><div><h4 style={{ marginBottom: '0.3rem' }}>{s.t}</h4><p className="muted" style={{ margin: 0 }}>{s.d}</p></div></div>
        ))}
      </div>
      <div className="card pad-l" style={{ marginTop: '1.5rem' }}>
        <h4>Respecting living heritage</h4>
        <p className="muted" style={{ margin: 0 }}>These are active places of worship. Walk clockwise around stupas and temples, remove shoes where asked, do not photograph inside shrines where it is not allowed, and note that some temples (for example the main Pashupatinath shrine) admit only Hindus. Fees and hours change; check at the gate.</p>
      </div>
      <p className="muted small" style={{ marginTop: '1.5rem' }}>See <Link to="/credits">photo credits and sources</Link>.</p>
    </div>
  );
}
