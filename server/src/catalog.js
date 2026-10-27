// In-memory catalog of monuments, questions and clues, refreshed every 60 s or on admin edits.
import { query } from './db.js';

let cache = null;
let loadedAt = 0;
const TTL = 60_000;

const parse = (v, d) => {
  if (v == null) return d;
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch { return d; }
};

export async function getCatalog() {
  if (cache && Date.now() - loadedAt < TTL) return cache;
  const [monuments, questions, clues, ratingRows] = await Promise.all([
    query('SELECT * FROM monuments ORDER BY id'),
    query('SELECT id, monument_id, question, options, answer_index, difficulty, rating, explanation FROM questions'),
    query('SELECT id, monument_id, clue FROM clues'),
    query('SELECT monument_id, AVG(stars) AS avg, COUNT(*) AS n FROM ratings GROUP BY monument_id'),
  ]);
  const ratings = new Map(ratingRows.map((r) => [r.monument_id, { avg: Number(r.avg), n: Number(r.n) }]));
  const list = monuments.map((m) => ({
    ...m,
    facts: parse(m.facts, []),
    sources: parse(m.sources, []),
    festivals: parse(m.festivals, []),
    gallery: parse(m.gallery, []),
    model: parse(m.model, null),
    unesco: !!m.unesco,
    avgRating: ratings.get(m.id)?.avg || 0,
    ratingCount: ratings.get(m.id)?.n || 0,
  }));
  cache = {
    monuments: list,
    byId: new Map(list.map((m) => [m.id, m])),
    bySlug: new Map(list.map((m) => [m.slug, m])),
    questions: questions.map((q) => ({ ...q, options: parse(q.options, []) })),
    clues,
  };
  loadedAt = Date.now();
  return cache;
}

/** Which great tradition a site belongs to, from its deity, religion and name. */
export function faithOf(m) {
  const d = `${m.deity || ''} ${m.name}`.toLowerCase();
  if (/shiva|mahadev|pashupati|bhairav|bhairab|ishwar|eshwar|eshwor|kedar|lingam|nath|bhimsen/.test(d)) return 'shiva';
  if (/vishnu|narayan|krishna|ram|rama|sita|janaki|jagannath|dattatreya|muktinath|garud/.test(d)) return 'vishnu';
  if (/ganesh|binayak|ganapati/.test(d)) return 'ganesh';
  if (/devi|durga|kali|taleju|bhagawati|bhagwati|kumari|parvati|laxmi|lakshmi|barahi|guhyeshwari|tara|mai|sundari|bhadrakali|ugratara|malika|shailesh|chandeshwori|bajrayogini|vatsala/.test(d)) return 'devi';
  if (m.religion === 'Buddhist' || /buddh|stupa|gumba|gompa|lokeshwar|bihar|vihar|chaitya|maya devi/.test(d)) return 'buddha';
  return m.religion === 'Buddhist' ? 'buddha' : 'other';
}

export function invalidateCatalog() {
  cache = null;
}

/** Public card shape for lists and the map. */
export const card = (m) => ({
  id: m.id, slug: m.slug, name: m.name, name_np: m.name_np, city: m.city, province: m.province, district: m.district, zone: m.zone_slug,
  lat: m.lat, lng: m.lng, type: m.type, religion: m.religion, deity: m.deity, unesco: m.unesco,
  short: m.short_text, built: m.built_text, builtYear: m.built_year, dynasty: m.dynasty,
  image: m.image_url, imageCredit: m.image_credit, tags: m.tags, visitMinutes: m.visit_minutes,
  open: m.open_time, close: m.close_time, avgRating: m.avgRating, ratingCount: m.ratingCount,
  galleryCount: m.gallery?.length || 0, modelKind: m.model?.kind || null, model: m.model || null,
});
