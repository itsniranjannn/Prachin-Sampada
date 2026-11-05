import { test } from 'node:test';
import assert from 'node:assert/strict';
import { haversine, leg } from './geo.js';
import { planTour, bruteForce } from './tour.js';
import { expected, updateElo, pickNext, sm2, difficultyToRating, levelFor } from './adaptive.js';
import { scoreGuess, rankPlayers, pickRounds, isAtSite, inValley } from './game.js';
import { recommend, cosine, tagVector } from './recommend.js';

// Real anchor points in the valley
const KDS = { lat: 27.7046, lng: 85.3074 }; // Kathmandu Durbar Square
const PDS = { lat: 27.6727, lng: 85.3253 }; // Patan Durbar Square
const BDS = { lat: 27.672, lng: 85.428 }; // Bhaktapur Durbar Square

test('UT-01 haversine: Kathmandu to Patan Durbar Square is about 4 km', () => {
  const d = haversine(KDS, PDS);
  assert.ok(d > 3600 && d < 4200, `got ${d}`);
  assert.equal(Math.round(haversine(KDS, KDS)), 0);
});

test('UT-02 leg: short hops are walked, long ones ridden with a fare', () => {
  const near = leg(KDS, { lat: 27.7058, lng: 85.3079 });
  assert.equal(near.mode, 'walk');
  assert.equal(near.costNpr, 0);
  const far = leg(KDS, BDS);
  assert.equal(far.mode, 'ride');
  assert.ok(far.costNpr > 500 && far.minutes > 30, JSON.stringify(far));
});

test('UT-03 tour: respects opening hours and the end time', () => {
  const sites = [
    { id: 1, lat: 27.7046, lng: 85.3074, value: 5, visit: 40, open: '09:00', close: '17:00' },
    { id: 2, lat: 27.7049, lng: 85.3066, value: 3, visit: 20, open: '10:00', close: '16:00' },
    { id: 3, lat: 27.7149, lng: 85.2904, value: 4, visit: 60, open: '06:00', close: '19:00' },
    { id: 4, lat: 27.6727, lng: 85.3253, value: 4, visit: 50, open: '09:00', close: '17:00' },
  ];
  const plan = planTour(KDS, sites, { startTime: '09:00', endTime: '13:00' });
  assert.ok(plan.stops.length >= 2);
  for (const s of plan.stops) {
    const site = sites.find((x) => x.id === s.id);
    assert.ok(s.start >= site.open && s.end <= site.close, `${s.id} ${s.start}-${s.end}`);
  }
  assert.ok(plan.finish <= '13:00');
});

test('UT-04 tour: closed sites are skipped with a reason', () => {
  const plan = planTour(KDS, [{ id: 9, lat: 27.7046, lng: 85.3074, value: 5, visit: 30, open: '15:00', close: '16:00' }], { startTime: '09:00', endTime: '12:00' });
  assert.equal(plan.stops.length, 0);
  assert.match(plan.skipped[0].reason, /closed/);
});

test('UT-05 tour heuristic matches brute force on a small instance', () => {
  const sites = [
    { id: 1, lat: 27.7046, lng: 85.3074, value: 5, visit: 30 },
    { id: 2, lat: 27.7058, lng: 85.3079, value: 2, visit: 20 },
    { id: 3, lat: 27.7149, lng: 85.2904, value: 4, visit: 45 },
    { id: 4, lat: 27.7215, lng: 85.362, value: 5, visit: 40 },
    { id: 5, lat: 27.6727, lng: 85.3253, value: 3, visit: 40 },
  ];
  const opts = { startTime: '09:00', endTime: '12:30' };
  const h = planTour(KDS, sites, opts);
  const b = bruteForce(KDS, sites, opts);
  assert.equal(h.totalValue, b.value);
});

test('UT-06 elo: expected score is 50% for equal ratings and moves the right way', () => {
  assert.equal(expected(1000, 1000), 0.5);
  const win = updateElo(1000, 1000, true, 0);
  const loss = updateElo(1000, 1000, false, 0);
  assert.ok(win.player > 1000 && win.question < 1000);
  assert.ok(loss.player < 1000 && loss.question > 1000);
  assert.ok(updateElo(1000, 1400, true, 0).delta > updateElo(1000, 800, true, 0).delta, 'beating a hard question pays more');
});

test('UT-07 adaptive picker targets about 70% success and prefers due reviews', () => {
  const pool = [1, 2, 3, 4, 5].map((d) => ({ id: d, rating: difficultyToRating(d), monumentId: d }));
  const q = pickNext(1000, pool);
  assert.equal(q.id, 1); // rating 800 gives 76% success, the closest to the 70% target (950 gives 57%)
  assert.equal(pickNext(1200, pool).id, 3); // a stronger player gets a harder question
  const due = pickNext(1000, pool, { due: [5] });
  assert.equal(due.id, 5);
  assert.equal(pickNext(1000, pool, { seen: new Set([1, 2, 3, 4, 5]) }), null);
});

test('UT-08 sm2: lapses reset, successes grow the interval', () => {
  let c = sm2(undefined, 5);
  assert.equal(c.interval, 1);
  c = sm2(c, 5);
  assert.equal(c.interval, 6);
  c = sm2(c, 4);
  assert.ok(c.interval > 6);
  const lapse = sm2(c, 1);
  assert.equal(lapse.interval, 1);
  assert.equal(lapse.reps, 0);
  assert.ok(lapse.ease >= 1.3);
});

test('UT-09 find-the-monument scoring decays with distance and rewards speed', () => {
  const t = { lat: 27.7215, lng: 85.362 }; // Boudhanath
  const exact = scoreGuess(t, t, { timeMs: 0 });
  assert.equal(exact.points, 1000);
  assert.ok(exact.perfect);
  const near = scoreGuess({ lat: 27.7225, lng: 85.362 }, t, { timeMs: 30000 });
  const far = scoreGuess(KDS, t, { timeMs: 30000 });
  assert.ok(near.points > far.points && far.points < 200);
  assert.equal(scoreGuess(t, t, { hints: 2 }).points, 800);
  assert.ok(isAtSite({ lat: 27.72152, lng: 85.36201, accuracy: 10 }, t));
});

test('UT-10 ranking: points first, then time, ties share a rank; rounds are seeded', () => {
  const r = rankPlayers([
    { id: 'a', points: 900, timeMs: 30000, joinedAt: 1 },
    { id: 'b', points: 900, timeMs: 20000, joinedAt: 2 },
    { id: 'c', points: 500, timeMs: 10000, joinedAt: 3 },
    { id: 'd', points: 500, timeMs: 10000, joinedAt: 4 },
  ]);
  assert.deepEqual(r.map((p) => [p.id, p.rank]), [['b', 1], ['a', 2], ['c', 3], ['d', 3]]);
  assert.deepEqual(pickRounds([1, 2, 3, 4, 5, 6], 3, 42), pickRounds([1, 2, 3, 4, 5, 6], 3, 42));
});

test('UT-11 recommender ranks interest matches first and explains why', () => {
  assert.equal(cosine(tagVector('buddhist,stupa'), tagVector('stupa,buddhist')), 1);
  const list = recommend([
    { id: 1, tags: 'hindu,pagoda', avgRating: 4.5, ratingCount: 10, lat: 27.7, lng: 85.3 },
    { id: 2, tags: 'buddhist,stupa', avgRating: 4.2, ratingCount: 3, lat: 27.72, lng: 85.36 },
  ], { interests: ['buddhist'], visited: new Set() });
  assert.equal(list[0].id, 2);
  assert.ok(list[0].reasons.includes('matches your interests'));
  assert.equal(levelFor(1000).key, 'sikaru');
});

test('UT-12 scoring scope: a 5 km miss is near zero in the valley but strong across Nepal', () => {
  const target = { lat: 27.7172, lng: 85.3240 };
  const miss = { lat: 27.7172 + 0.045, lng: 85.3240 }; // about 5 km north
  const valley = scoreGuess(miss, target, { timeMs: 60000, limitMs: 60000 });
  const nepal = scoreGuess(miss, target, { timeMs: 60000, limitMs: 60000, scope: 'nepal' });
  assert.ok(valley.points < 40, `valley ${valley.points}`);
  assert.ok(nepal.points > 600, `nepal ${nepal.points}`);
  assert.equal(scoreGuess({ lat: 27.7180, lng: 85.3240 }, target, { scope: 'nepal' }).perfect, true);
  assert.equal(inValley({ lat: 27.67, lng: 85.43 }), true); // Bhaktapur
  assert.equal(inValley({ lat: 27.48, lng: 83.28 }), false); // Lumbini
});
