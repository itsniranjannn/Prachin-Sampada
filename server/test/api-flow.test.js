// End-to-end API tests against a running server on a freshly seeded database (npm run db:init first).
import { test } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.BASE_URL || 'http://localhost:5050';
const call = async (path, { method = 'GET', body, token } = {}) => {
  const res = await fetch(`${BASE}/api${path}`, {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
};
const stamp = `${process.pid}${Date.now() % 100000}`;
let token, token2, admin;

test('AT-01 health check', async () => {
  const r = await call('/health');
  assert.equal(r.status, 200);
  assert.equal(r.data.ok, true);
});

test('AT-02 catalog metadata: 42 monuments, 7 UNESCO zones', async () => {
  const r = await call('/monuments/meta');
  assert.equal(r.status, 200);
  assert.ok(r.data.monuments >= 42);
  assert.equal(r.data.unescoZones, 7);
  assert.ok(r.data.questions >= 200);
});

test('AT-03 search and filters', async () => {
  const s = await call('/monuments?q=nyatapola');
  assert.equal(s.data.results[0].slug, 'nyatapola-temple');
  const u = await call('/monuments?unesco=1');
  assert.ok(u.data.results.every((m) => m.unesco));
  const st = await call('/monuments?type=stupa');
  assert.ok(st.data.results.length >= 3 && st.data.results.every((m) => m.type === 'stupa'));
});

test('AT-04 monument detail with zone members and nearby; 404 for unknown', async () => {
  const r = await call('/monuments/kathmandu-durbar-square');
  assert.equal(r.status, 200);
  assert.ok(r.data.inside.length >= 5);
  assert.ok(r.data.monument.story.length > 200);
  assert.equal((await call('/monuments/no-such-place')).status, 404);
});

test('AT-05 recommendations are diverse across cities and explained', async () => {
  const r = await call('/monuments/recommend?limit=8');
  const cities = new Set(r.data.results.map((m) => m.city));
  assert.ok(cities.size >= 3, `only ${[...cities]}`);
  assert.ok(r.data.results.every((m) => Array.isArray(m.reasons)));
});

test('AT-06 walk planner respects opening hours and the end time', async () => {
  const r = await call('/tours/plan', { method: 'POST', body: { start: { lat: 27.7041, lng: 85.3069 }, interests: ['pagoda'], startTime: '09:00', endTime: '13:00' } });
  assert.equal(r.status, 200);
  assert.ok(r.data.plan.stops.length >= 3);
  assert.ok(r.data.plan.finish <= '13:00');
  for (const s of r.data.plan.stops) {
    if (s.monument.open) assert.ok(s.start >= s.monument.open);
    if (s.monument.close) assert.ok(s.end <= s.monument.close);
  }
});

test('AT-07 planner rejects bad input', async () => {
  assert.equal((await call('/tours/plan', { method: 'POST', body: { startTime: '09:00', endTime: '12:00' } })).status, 400);
  assert.equal((await call('/tours/plan', { method: 'POST', body: { start: { lat: 27.7, lng: 85.3 }, startTime: '15:00', endTime: '10:00' } })).status, 400);
});

test('AT-08 register validates and rejects duplicates', async () => {
  assert.equal((await call('/auth/register', { method: 'POST', body: { name: 'A', email: 'bad', password: '1' } })).status, 400);
  const r = await call('/auth/register', { method: 'POST', body: { name: 'Test Explorer', email: `t${stamp}@sampada.np`, password: 'secret123', interests: ['stupa', 'hacking'] } });
  assert.equal(r.status, 201);
  assert.deepEqual(r.data.user.interests, ['stupa']);
  token = r.data.token;
  assert.equal((await call('/auth/register', { method: 'POST', body: { name: 'Test Explorer', email: `t${stamp}@sampada.np`, password: 'secret123' } })).status, 409);
});

test('AT-09 login and protected routes', async () => {
  assert.equal((await call('/auth/login', { method: 'POST', body: { email: `t${stamp}@sampada.np`, password: 'wrong' } })).status, 401);
  assert.equal((await call('/auth/login', { method: 'POST', body: { email: `t${stamp}@sampada.np`, password: 'secret123' } })).status, 200);
  assert.equal((await call('/passport')).status, 401);
  assert.equal((await call('/passport', { token: 'not-a-jwt' })).status, 401);
});

test('AT-10 adaptive quiz: next question, answer moves the rating, missed question enters review', async () => {
  const n = await call('/play/quiz/next', { token });
  assert.equal(n.status, 200);
  const q = n.data.question;
  assert.equal(q.options.length, 4);
  assert.ok(!('answer_index' in q) && !('answerIndex' in q), 'answer must not be sent with the question');
  const wrong = await call('/play/quiz/answer', { method: 'POST', token, body: { questionId: q.id, choice: 9, timeMs: 5000 } });
  assert.equal(wrong.data.correct, false);
  assert.ok(wrong.data.rating < 1000);
  const p = await call('/passport', { token });
  assert.equal(p.data.stats.quizAnswered, 1);
});

test('AT-11 GPS stamp: refused far away, accepted on site; manual stamp; badge', async () => {
  const far = await call('/passport/stamp/boudhanath', { method: 'POST', token, body: { position: { lat: 27.70, lng: 85.30, accuracy: 10 } } });
  assert.equal(far.status, 422);
  const near = await call('/passport/stamp/boudhanath', { method: 'POST', token, body: { position: { lat: 27.72152, lng: 85.36201, accuracy: 8 } } });
  assert.equal(near.status, 201);
  assert.equal(near.data.method, 'gps');
  assert.ok(near.data.badges.some((b) => b.key === 'pahilo-paila'));
  const manual = await call('/passport/stamp/nyatapola-temple', { method: 'POST', token, body: {} });
  assert.equal(manual.data.method, 'manual');
});

test('AT-12 favorites and reviews (one per explorer, updatable)', async () => {
  assert.equal((await call('/monuments/swayambhunath/favorite', { method: 'POST', token })).data.favorite, true);
  assert.equal((await call('/monuments/swayambhunath/rate', { method: 'POST', token, body: { stars: 9 } })).status, 400);
  assert.equal((await call('/monuments/swayambhunath/rate', { method: 'POST', token, body: { stars: 4, comment: 'Go at dawn' } })).status, 201);
  assert.equal((await call('/monuments/swayambhunath/rate', { method: 'POST', token, body: { stars: 5 } })).status, 201);
  const d = await call('/monuments/swayambhunath', { token });
  assert.equal(d.data.me.rating.stars, 5);
  assert.equal(d.data.reviews.filter((r) => r.name === 'Test Explorer').length, 1);
});

test('AT-13 save, share and protect a walk', async () => {
  const s = await call('/tours', { method: 'POST', token, body: { title: 'Patan morning', start: { lat: 27.6735, lng: 85.3251 }, interests: ['buddhist'], startTime: '08:00', endTime: '11:00' } });
  assert.equal(s.status, 201);
  assert.ok(s.data.badges.some((b) => b.key === 'yatri'));
  const shared = await call(`/tours/shared/${s.data.shareCode}`);
  assert.equal(shared.status, 200);
  const other = await call('/auth/register', { method: 'POST', body: { name: 'Second Explorer', email: `s${stamp}@sampada.np`, password: 'secret123' } });
  token2 = other.data.token;
  assert.equal((await call(`/tours/${s.data.id}`, { method: 'DELETE', token: token2 })).status, 403);
  assert.equal((await call(`/tours/${s.data.id}`, { method: 'DELETE', token })).status, 200);
});

test('AT-14 Find the Monument: rounds hide answers, scoring by distance, finished game saved', async () => {
  const g = await call('/play/game/start', { method: 'POST', body: { rounds: 3 } });
  assert.equal(g.data.rounds.length, 3);
  assert.ok(g.data.rounds.every((r) => !('lat' in r) && !('monumentId' in r)));
  let last;
  for (const r of g.data.rounds) last = await call('/play/game/guess', { method: 'POST', token, body: { gameId: g.data.gameId, round: r.index, lat: 27.7, lng: 85.33, timeMs: 10000 } });
  assert.equal(last.data.finished, true);
  assert.equal((await call('/play/game/guess', { method: 'POST', token, body: { gameId: g.data.gameId, round: 0, lat: 27.7, lng: 85.33 } })).status, 409);
});

test('AT-15 explorers cannot use admin routes', async () => {
  assert.equal((await call('/admin/stats', { token })).status, 403);
});

test('AT-16 admin: stats, add monument with validation, add question, delete', async () => {
  admin = (await call('/auth/login', { method: 'POST', body: { email: 'admin@sampada.np', password: 'admin123' } })).data.token;
  assert.equal((await call('/admin/stats', { token: admin })).status, 200);
  const bad = await call('/admin/monuments', { method: 'POST', token: admin, body: { slug: 'x', name: 'X', city: 'Kathmandu', lat: 40, lng: 85.3, type: 'pagoda', story: 'x' } });
  assert.equal(bad.status, 400);
  const add = await call('/admin/monuments', { method: 'POST', token: admin, body: { slug: `test-${stamp}`, name: 'Test Shrine', city: 'Kathmandu', lat: 27.7, lng: 85.32, type: 'pagoda', story: 'A test shrine.', facts: ['one'] } });
  assert.equal(add.status, 201);
  assert.equal((await call(`/admin/monuments/${add.data.id}/questions`, { method: 'POST', token: admin, body: { question: 'Is this a test?', options: ['a', 'b'], answer_index: 0 } })).status, 400);
  assert.equal((await call(`/admin/monuments/${add.data.id}/questions`, { method: 'POST', token: admin, body: { question: 'Is this a test shrine?', options: ['Yes', 'No', 'Maybe', 'Never'], answer_index: 0, difficulty: 1 } })).status, 201);
  assert.equal((await call(`/monuments/test-${stamp}`)).status, 200);
  assert.equal((await call(`/admin/monuments/${add.data.id}`, { method: 'DELETE', token: admin })).status, 200);
  assert.equal((await call(`/monuments/test-${stamp}`)).status, 404);
});

test('AT-17 admin deactivates an explorer who then cannot log in', async () => {
  const me2 = await call('/auth/me', { token: token2 });
  assert.equal((await call(`/admin/users/${me2.data.user.id}`, { method: 'PATCH', token: admin, body: { active: false } })).status, 200);
  assert.equal((await call('/auth/login', { method: 'POST', body: { email: `s${stamp}@sampada.np`, password: 'secret123' } })).status, 403);
  assert.equal((await call('/passport', { token: token2 })).status, 401, 'old token stops working at once');
});

test('AT-18 passport summary shows stamps, badges and UNESCO progress', async () => {
  const p = await call('/passport', { token });
  assert.equal(p.data.stats.stamps, 2);
  assert.equal(p.data.unesco.length, 7);
  assert.ok(p.data.unesco.find((z) => z.slug === 'boudhanath').done);
  assert.ok(p.data.badges.find((b) => b.key === 'pahilo-paila').earned);
});
