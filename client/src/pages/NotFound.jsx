import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="page wrap" style={{ display: 'grid', placeItems: 'center' }}>
      <div className="empty brick-wall card" style={{ maxWidth: 520 }}>
        <div className="icon"><Compass size={28} /></div>
        <h2>This lane leads nowhere</h2>
        <p className="muted">The page you looked for is not on our map. Even old Kathmandu’s alleys end somewhere.</p>
        <div className="row" style={{ justifyContent: 'center' }}><Link className="btn" to="/">Home</Link><Link className="btn ghost" to="/explore">Open the map</Link></div>
      </div>
    </div>
  );
}
