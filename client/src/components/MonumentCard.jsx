import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, MapPin, Star, Images } from 'lucide-react';

export const TYPE_LABEL = {
  pagoda: 'Pagoda temple', stupa: 'Stupa', shikhara: 'Shikhara temple', palace: 'Palace', square: 'Durbar Square', courtyard: 'Courtyard',
  pond: 'Sacred pond', tower: 'Tower', statue: 'Sculpture', sculpture: 'Sculpture', museum: 'Museum', bahal: 'Monastery courtyard', gate: 'Gateway',
  gateway: 'Gateway', window: 'Carved window', temple: 'Temple', cave: 'Cave shrine', monastery: 'Monastery', fort: 'Fort (gadhi)', pillar: 'Pillar',
  ghat: 'Ghat', 'lake-shrine': 'Lake shrine', 'dome-temple': 'Domed temple', garden: 'Sacred garden', 'archaeological-site': 'Archaeological site',
};

export function MonumentCard({ m, index = 0, stamped = false }) {
  const photos = (m.galleryCount || 0) + (m.image ? 1 : 0);
  return (
    <motion.div initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.7, delay: Math.min(index, 8) * 0.05, ease: [0.22, 0.9, 0.24, 1] }}>
      <Link to={`/m/${m.slug}`} className="mcard">
        <div className="mcard-img">
          {m.image ? <img src={m.image} alt={m.name} loading="lazy" /> : <div className="jaali" style={{ width: '100%', height: '100%' }} />}
          <div className="mcard-tags">
            {m.unesco && <span className="tag gold">UNESCO</span>}
            <span className="tag light">{TYPE_LABEL[m.type] || m.type}</span>
            {photos > 1 && <span className="tag light"><Images size={11} /> {photos}</span>}
          </div>
          {m.name_np && <span className="mcard-np" lang="ne">{m.name_np}</span>}
        </div>
        {stamped && <span className="stamp-mark">छाप<br />✓</span>}
        <div className="mcard-body">
          <h4>{m.name}</h4>
          <p>{m.short}</p>
          <div className="mcard-meta">
            <span><MapPin size={13} /> {m.city}{m.province && m.province !== 'Bagmati' ? `, ${m.province}` : ''}</span>
            {m.visitMinutes && <span><Clock size={13} /> {m.visitMinutes} min</span>}
            {m.ratingCount > 0 && <span><Star size={13} fill="currentColor" /> {m.avgRating.toFixed(1)}</span>}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
