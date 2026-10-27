// "Find the Monument" scoring and multiplayer hunt ranking.
import { haversine } from './geo.js';

export const MAX_POINTS = 1000;
export const DIST_SCALE_M = 1200; // at 1.2 km the distance score has fallen to 1/e
export const PERFECT_M = 40; // within 40 m counts as standing on the site
/** Round scope: inside one valley the curve works in metres; across Nepal it works in kilometres. */
export const SCOPES = { valley: { perfect: PERFECT_M, scale: DIST_SCALE_M }, nepal: { perfect: 1000, scale: 40000 } };
export const inValley = (m) => m.lat > 27.55 && m.lat < 27.82 && m.lng > 85.18 && m.lng < 85.56;

/**
 * Score one guess. guess/target: {lat, lng}; timeMs: answer time; limitMs: round limit; hints: hints used.
 * points = distance part (exponential decay) + speed bonus, minus hint penalty.
 */
export function scoreGuess(guess, target, { timeMs = 0, limitMs = 60000, hints = 0, scope = 'valley' } = {}) {
  const d = haversine(guess, target);
  const { perfect, scale } = SCOPES[scope] || SCOPES.valley;
  const distPart = d <= perfect ? 800 : Math.round(800 * Math.exp(-(d - perfect) / scale));
  const speedPart = Math.round(200 * Math.max(0, 1 - timeMs / limitMs) * (distPart / 800));
  const penalty = hints * 100;
  const points = Math.max(0, Math.min(MAX_POINTS, distPart + speedPart - penalty));
  return { metres: Math.round(d), points, distPart, speedPart, penalty, perfect: d <= perfect };
}

/** On-site check-in for the GPS trail: true when the device is within radius of the monument. */
export const isAtSite = (pos, site, radiusM = 60) => haversine(pos, site) <= Math.max(radiusM, pos.accuracy || 0);

/**
 * Rank players in a hunt: total points desc, then total time asc, then earliest join.
 * players: [{id, name, points, timeMs, joinedAt}]
 */
export function rankPlayers(players) {
  const sorted = players.slice().sort((a, b) => b.points - a.points || a.timeMs - b.timeMs || a.joinedAt - b.joinedAt);
  const out = [];
  sorted.forEach((p, i) => {
    const prev = out[i - 1];
    const tied = prev && prev.points === p.points && prev.timeMs === p.timeMs; // exact ties share a rank
    out.push({ ...p, rank: tied ? prev.rank : i + 1 });
  });
  return out;
}

/** Pick n distinct rounds from a pool with a seeded shuffle so every player in a room gets the same order. */
export function pickRounds(pool, n, seed) {
  const a = pool.slice();
  let s = seed >>> 0 || 1;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, Math.min(n, a.length));
}
