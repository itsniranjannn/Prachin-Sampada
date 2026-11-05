// Monument recommendation: interest match + popularity (Bayesian rating) + novelty + nearness.
import { haversine } from './geo.js';

export const tagVector = (tags) => new Set(String(tags || '').split(',').map((t) => t.trim().toLowerCase()).filter(Boolean));

/** Cosine similarity between two tag sets (binary vectors). */
export function cosine(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / Math.sqrt(a.size * b.size);
}

/** Bayesian average: pulls places with few ratings toward the global mean. */
export const bayes = (avg, count, mean, m = 5) => (count * (avg || 0) + m * mean) / (count + m);

/**
 * monuments: [{id, tags, avgRating, ratingCount, lat, lng}]
 * user: {interests: [..], visited: Set(ids), near: {lat,lng} | null}
 */
export function recommend(monuments, user = {}, limit = 6) {
  const interests = tagVector((user.interests || []).join(','));
  const visited = user.visited || new Set();
  const rated = monuments.filter((m) => m.ratingCount > 0);
  const mean = rated.length ? rated.reduce((s, m) => s + m.avgRating, 0) / rated.length : 4;
  const hasNear = !!user.near;
  const w = interests.size ? { interest: 0.45, rating: 0.25, novelty: 0.15, near: 0.15 } : { interest: 0, rating: 0.55, novelty: 0.2, near: 0.25 };
  if (!hasNear) { w.rating += w.near; w.near = 0; }
  const scored = monuments
    .map((m) => {
      const interest = cosine(interests, tagVector(m.tags));
      const rating = bayes(m.avgRating, m.ratingCount, mean) / 5;
      const novelty = visited.has(m.id) ? 0 : 1;
      const dKm = hasNear ? haversine(user.near, m) / 1000 : 0;
      const near = hasNear ? 1 / (1 + dKm / 2) : 0;
      const score = w.interest * interest + w.rating * rating + w.novelty * novelty + w.near * near;
      const reasons = [];
      if (interest > 0.3) reasons.push('matches your interests');
      if (rating > 0.88) reasons.push('loved by explorers');
      if (!visited.has(m.id)) reasons.push('not yet explored');
      if (hasNear && dKm < 1.5) reasons.push(`${dKm < 1 ? Math.round(dKm * 1000) + ' m' : dKm.toFixed(1) + ' km'} away`);
      // small prior for whole UNESCO zones and famous single sites, so a new visitor starts with the icons
      const prior = m.unesco ? (m.isZone ? 0.06 : 0.03) : 0;
      return { id: m.id, city: m.city, score: Math.round((score + prior) * 1000) / 10, reasons };
    })
    .sort((a, b) => b.score - a.score || a.id - b.id);
  return diversify(scored, limit).map(({ city, ...r }) => r);
}

/**
 * Greedy diversity re-ranking: take the best remaining item, but an item from a city that is already
 * represented loses 12% of its score per earlier pick from that city, so one city cannot fill the list.
 */
export function diversify(sorted, limit) {
  const out = [];
  const perCity = new Map();
  const pool = sorted.slice();
  while (out.length < limit && pool.length) {
    let bi = 0;
    let best = -Infinity;
    pool.forEach((x, i) => {
      const adj = x.score * (1 - 0.12 * (perCity.get(x.city) || 0));
      if (adj > best) { best = adj; bi = i; }
    });
    const [pick] = pool.splice(bi, 1);
    perCity.set(pick.city, (perCity.get(pick.city) || 0) + 1);
    out.push(pick);
  }
  return out;
}
