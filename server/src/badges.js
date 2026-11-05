// Heritage passport badges. Each badge has a check run against the explorer's current progress.
import { query } from './db.js';
import { getCatalog } from './catalog.js';

export const BADGES = [
  { key: 'pahilo-paila', name: 'Pahilo Paila', np: 'पहिलो पाइला', desc: 'Stamp your first monument in the passport.', icon: 'footprints' },
  { key: 'tin-durbar', name: 'Tin Durbar', np: 'तीन दरबार', desc: 'Stamp all three Durbar Squares: Kathmandu, Patan and Bhaktapur.', icon: 'landmark' },
  { key: 'sapta-sampada', name: 'Sapta Sampada', np: 'सप्त सम्पदा', desc: 'Stamp all seven UNESCO monument zones of the Kathmandu Valley.', icon: 'crown' },
  { key: 'das-stamp', name: 'Das Thau', np: 'दस ठाउँ', desc: 'Stamp ten different monuments.', icon: 'stamp' },
  { key: 'gyani', name: 'Gyani', np: 'ज्ञानी', desc: 'Reach a quiz rating of 1200 (Heritage Pandit).', icon: 'book-open' },
  { key: 'pachis-uttar', name: 'Pachis Uttar', np: 'पच्चीस उत्तर', desc: 'Answer 25 quiz questions correctly.', icon: 'check-circle' },
  { key: 'shikari', name: 'Sampada Shikari', np: 'सम्पदा शिकारी', desc: 'Score 4,000 or more in a Find the Monument game.', icon: 'crosshair' },
  { key: 'saathi', name: 'Saathi', np: 'साथी', desc: 'Finish a live heritage hunt with friends.', icon: 'users' },
  { key: 'yatri', name: 'Yatri', np: 'यात्री', desc: 'Save your first heritage walk.', icon: 'route' },
  { key: 'saat-pradesh', name: 'Saat Pradesh', np: 'सात प्रदेश', desc: 'Stamp a heritage site in all seven provinces of Nepal.', icon: 'map' },
  { key: 'tirtha-yatri', name: 'Tirtha Yatri', np: 'तीर्थयात्री', desc: 'Stamp sites in three provinces outside Bagmati.', icon: 'route' },
];

// The seven UNESCO monument zones (slugs used in the dataset)
export const UNESCO_ZONES = ['kathmandu-durbar-square', 'patan-durbar-square', 'bhaktapur-durbar-square', 'swayambhunath', 'boudhanath', 'pashupatinath', 'changu-narayan-temple'];
const DURBARS = UNESCO_ZONES.slice(0, 3);

/** Award every badge whose condition is now met; returns the newly earned ones. */
export async function checkBadges(userId) {
  const cat = await getCatalog();
  const [have, visits, user, correct, bestGame, hunts, tours] = await Promise.all([
    query('SELECT badge_key FROM badges WHERE user_id = ?', [userId]),
    query('SELECT monument_id FROM visits WHERE user_id = ?', [userId]),
    query('SELECT rating FROM users WHERE id = ?', [userId]),
    query('SELECT COUNT(*) AS n FROM quiz_attempts WHERE user_id = ? AND correct = 1', [userId]),
    query("SELECT COALESCE(MAX(points),0) AS p FROM game_scores WHERE user_id = ? AND mode = 'solo'", [userId]),
    query("SELECT COUNT(*) AS n FROM game_scores WHERE user_id = ? AND mode = 'hunt'", [userId]),
    query('SELECT COUNT(*) AS n FROM tours WHERE user_id = ?', [userId]),
  ]);
  const owned = new Set(have.map((r) => r.badge_key));
  // a stamp on a monument inside a zone also counts for the zone
  const zones = new Set();
  const provinces = new Set();
  for (const v of visits) {
    const m = cat.byId.get(v.monument_id);
    if (!m) continue;
    zones.add(m.slug);
    provinces.add(m.province);
    if (m.zone_slug) zones.add(m.zone_slug);
  }
  const met = {
    'pahilo-paila': visits.length >= 1,
    'tin-durbar': DURBARS.every((z) => zones.has(z)),
    'sapta-sampada': UNESCO_ZONES.every((z) => zones.has(z)),
    'das-stamp': visits.length >= 10,
    gyani: (user[0]?.rating || 0) >= 1200,
    'pachis-uttar': correct[0].n >= 25,
    shikari: bestGame[0].p >= 4000,
    saathi: hunts[0].n >= 1,
    yatri: tours[0].n >= 1,
    'saat-pradesh': provinces.size >= 7,
    'tirtha-yatri': [...provinces].filter((p) => p !== 'Bagmati').length >= 3,
  };
  const fresh = BADGES.filter((b) => met[b.key] && !owned.has(b.key));
  for (const b of fresh) await query('INSERT IGNORE INTO badges (user_id, badge_key) VALUES (?, ?)', [userId, b.key]);
  return fresh;
}
