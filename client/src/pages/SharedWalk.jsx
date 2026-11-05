import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Footprints, Car, Clock } from 'lucide-react';
import MapView from '../components/MapView.jsx';
import { api, npr, fmtM } from '../lib/api.js';
import { PageLoader } from '../components/Shell.jsx';

export default function SharedWalk() {
  const { code } = useParams();
  const [tour, setTour] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api(`/tours/shared/${code}`).then((d) => setTour(d.tour)).catch((e) => setErr(e.message)); }, [code]);
  const markers = useMemo(() => (tour ? tour.plan.stops.map((s) => s.monument) : []), [tour]);
  const route = useMemo(() => (tour ? tour.plan.stops.map((s) => [s.monument.lng, s.monument.lat]) : null), [tour]);
  if (err) return <div className="page wrap"><div className="empty brick-wall"><h3>{err}</h3><Link className="btn" to="/walk">Plan your own walk</Link></div></div>;
  if (!tour) return <PageLoader />;
  const p = tour.plan;
  return (
    <div className="page wrap">
      <div className="page-head">
        <div className="eyebrow">Shared heritage walk</div>
        <h1 style={{ fontSize: 'var(--fs-h2)' }}>{tour.title}</h1>
        <p className="muted">By {tour.owner} · {p.stops.length} stops · {p.startTime}–{p.finish} · {fmtM(p.walkMetres || 0)} on foot{p.rideCostNpr ? ` · ${npr(p.rideCostNpr)} taxi` : ''}</p>
      </div>
      <div className="walk-grid">
        <div className="card walk-map" style={{ minHeight: 420 }}><MapView markers={markers} numbered route={route} fitOnChange popup={false} pitch={45} /></div>
        <div className="card pad-l">
          <ol className="timeline">
            {p.stops.map((s, i) => (
              <li key={s.id}>
                <div className="tl-leg">{s.leg.mode === 'walk' ? <Footprints size={14} /> : <Car size={14} />} {s.leg.mode === 'walk' ? `Walk ${fmtM(s.leg.metres)}` : `Taxi ${fmtM(s.leg.metres)}`} · {s.leg.minutes} min</div>
                <span className="tl-dot num">{i + 1}</span>
                <Link to={`/m/${s.monument.slug}`} className="tl-stop">
                  {s.monument.image && <img src={s.monument.image} alt="" loading="lazy" />}
                  <div><b>{s.monument.name}</b><span className="cap"><Clock size={12} /> {s.start}–{s.end}</span></div>
                </Link>
              </li>
            ))}
          </ol>
          <Link className="btn" to="/walk" style={{ marginTop: '1rem' }}>Plan your own walk</Link>
        </div>
      </div>
    </div>
  );
}
