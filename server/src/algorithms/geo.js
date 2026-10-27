// Distances and travel times inside Kathmandu Valley.
// Old-city lanes are not straight lines, so walking distance = great-circle distance x a detour factor.

const R = 6371000; // mean Earth radius, metres
const rad = (d) => (d * Math.PI) / 180;

/** Great-circle distance in metres between two {lat, lng} points (Haversine formula). */
export function haversine(a, b) {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export const WALK = { detour: 1.35, kmh: 4.2 }; // lanes and courtyards; relaxed sightseeing pace
export const RIDE = { detour: 1.45, kmh: 16, baseNpr: 150, perKmNpr: 60, waitMin: 8 }; // taxi / ride-hail in valley traffic
export const WALK_LIMIT_M = 2500; // above this a leg is taken by taxi

/**
 * One leg between two places: walk when it is short, otherwise ride.
 * Returns { mode, metres, minutes, costNpr }.
 */
export function leg(a, b, { walkLimit = WALK_LIMIT_M } = {}) {
  const straight = haversine(a, b);
  const walkM = straight * WALK.detour;
  if (walkM <= walkLimit) {
    return { mode: 'walk', metres: Math.round(walkM), minutes: Math.max(1, Math.round((walkM / 1000 / WALK.kmh) * 60)), costNpr: 0 };
  }
  const rideM = straight * RIDE.detour;
  const minutes = Math.round((rideM / 1000 / RIDE.kmh) * 60 + RIDE.waitMin);
  const costNpr = Math.round((RIDE.baseNpr + (rideM / 1000) * RIDE.perKmNpr) / 10) * 10;
  return { mode: 'ride', metres: Math.round(rideM), minutes, costNpr };
}

/** Square matrix of legs between points (index 0 is usually the start). */
export function legMatrix(points, opts) {
  return points.map((a, i) => points.map((b, j) => (i === j ? { mode: 'walk', metres: 0, minutes: 0, costNpr: 0 } : leg(a, b, opts))));
}

/** "HH:MM" -> minutes after midnight. */
export const toMin = (hhmm) => {
  if (!hhmm) return null;
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + (m || 0);
};
export const fmtMin = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(Math.round(m % 60)).padStart(2, '0')}`;
