// Adaptive quiz engine.
// Elo rating: the player and every question have a rating; a correct answer moves the player up and the
// question down by an amount that depends on how surprising the result was. The next question is chosen
// so the predicted chance of success is close to a target (about 70%), which keeps the quiz challenging
// but not discouraging. Questions the player missed come back on an SM-2 spaced-repetition schedule.

export const BASE_PLAYER = 1000;
export const MIN_RATING = 600;
export const MAX_RATING = 1800;
const clamp = (n) => Math.min(MAX_RATING, Math.max(MIN_RATING, n));
export const difficultyToRating = (d) => 800 + (Math.min(5, Math.max(1, d)) - 1) * 150; // 1 -> 800 ... 5 -> 1400

/** Probability that a player with rating rp answers a question with rating rq correctly. */
export const expected = (rp, rq) => 1 / (1 + 10 ** ((rq - rp) / 400));

/** K factor shrinks as a player answers more questions, so ratings settle. */
export const kFactor = (answered) => (answered < 10 ? 40 : answered < 30 ? 28 : 18);

/**
 * Update ratings after one answer.
 * Returns { player, question, delta, expected } with new ratings.
 */
export function updateElo(playerRating, questionRating, correct, answered = 0, timeMs = null, limitMs = 25000) {
  const p = expected(playerRating, questionRating);
  // fast correct answers count slightly more (max +15%); slow ones slightly less
  const speed = correct && timeMs != null ? 1 + 0.15 * Math.max(0, 1 - timeMs / limitMs) : 1;
  const score = correct ? 1 : 0;
  const delta = kFactor(answered) * speed * (score - p);
  return {
    player: clamp(Math.round(playerRating + delta)),
    question: clamp(Math.round(questionRating - delta * 0.5)), // questions move more slowly than players
    delta: clamp(Math.round(playerRating + delta)) - Math.round(playerRating), // the change actually applied, after the 600-1800 bounds
    expected: p,
  };
}

/**
 * Pick the next question.
 * pool: [{id, rating, monumentId}], seen: Set of ids answered this session,
 * due: ids due for review (SM-2), target: desired success probability.
 */
export function pickNext(playerRating, pool, { seen = new Set(), due = [], target = 0.7, recentMonuments = [] } = {}) {
  const dueSet = new Set(due);
  const fresh = pool.filter((q) => !seen.has(q.id));
  if (!fresh.length) return null;
  const review = fresh.filter((q) => dueSet.has(q.id));
  const candidates = review.length ? review : fresh;
  let best = null;
  for (const q of candidates) {
    const gap = Math.abs(expected(playerRating, q.rating) - target);
    const variety = recentMonuments.includes(q.monumentId) ? 0.08 : 0; // avoid the same site twice in a row
    const score = gap + variety;
    if (!best || score < best.score || (score === best.score && q.id < best.q.id)) best = { q, score };
  }
  return best.q;
}

/** Level names for a rating, used in the UI and badges. */
export function levelFor(rating) {
  if (rating >= 1350) return { key: 'guru', label: 'Sampada Guru', np: 'सम्पदा गुरु' };
  if (rating >= 1200) return { key: 'pandit', label: 'Heritage Pandit', np: 'सम्पदा पण्डित' };
  if (rating >= 1080) return { key: 'yatri', label: 'Valley Yatri', np: 'उपत्यका यात्री' };
  if (rating >= 960) return { key: 'sikaru', label: 'Curious Sikaru', np: 'जिज्ञासु सिकारु' };
  return { key: 'naya', label: 'New Explorer', np: 'नयाँ अन्वेषक' };
}

/**
 * SM-2 spaced repetition update.
 * card: { ease, interval (days), reps }, quality 0-5 (>=3 = remembered).
 */
export function sm2(card = { ease: 2.5, interval: 0, reps: 0 }, quality) {
  let { ease, interval, reps } = card;
  if (quality < 3) {
    reps = 0;
    interval = 1;
  } else {
    reps += 1;
    interval = reps === 1 ? 1 : reps === 2 ? 6 : Math.round(interval * ease);
  }
  ease = Math.max(1.3, ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  return { ease: Math.round(ease * 100) / 100, interval, reps };
}
