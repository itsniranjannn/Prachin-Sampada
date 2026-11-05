// Kalinchowk Bhagawati Temple (Kuri, Kalinchowk Rural Municipality, Dolakha, Bagmati) at 3,842 m.
// Not a building: a tiny, low grey stone shrine (about 3.5 m wide) under an old pitched gable roof with an orange-red front,
// buried under layered multicolour flags, a thicket of black iron tridents, swords and hundreds of brass bells hung at random
// heights on irregular iron rods, with a small dark doorway and two red guardian lions at the front.
// Beside it: a black steel bell gate (slim posts, bracketed lintel, bell on chains), a pipe railing hung with flags, a rock-cut
// vermilion niche (the holy pond), a dry-stone slab stair coming up the bare brown ridge from Kuri, conifer patches below,
// and a long low jagged snow crest far away behind layers of blue haze.
// 1 unit is about 1 m. Front/entrance faces +z. Shapes are approximate (no published plan), counts are from the photos.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Frame, THREE, useMemo, useRef, useEffect } = K;

  /* ------------------------------------------------------------------ noise */
  const hash = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };
  function vnoise(x, z) {
    const i = Math.floor(x); const j = Math.floor(z);
    const fx = x - i; const fz = z - j;
    const u = fx * fx * (3 - 2 * fx); const v = fz * fz * (3 - 2 * fz);
    const a = hash(i, j); const b = hash(i + 1, j); const c = hash(i, j + 1); const d = hash(i + 1, j + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, z, o = 4) {
    let s = 0; let a = 0.5; let f = 1; let n = 0;
    for (let k = 0; k < o; k += 1) { s += a * vnoise(x * f, z * f); n += a; a *= 0.5; f *= 2.03; }
    return s / n;
  }
  const SH = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const rnd = (k, s = 1) => hash(k * 12.9898 + s * 7.31, k * 4.1 + s * 1.7);

  /* ------------------------------------------------------------------ terrain: a long bare ridge crest along x, shrine at the crest */
  function T(x, z) {
    const df = z - 5.5; const db = -z - 4.5; const ax = Math.abs(x) - 8;
    const dz = df > 0 ? (df < 6 ? 0.06 * df * df : 2.16 + (df - 6) * 0.66) : db > 0 ? (db < 4 ? 0.1 * db * db : 1.6 + (db - 4) * 1.5) : 0;
    const dx = ax > 0 ? (ax < 8 ? 0.035 * ax * ax : 2.24 + (ax - 8) * 0.55) : 0;
    const drop = dz + dx;
    const n = fbm(x * 0.05 + 3, z * 0.05 + 7, 4);
    const crag = SH(3, 18, drop) * (n - 0.5) * 11;
    return Math.max(-74, -drop + crag) - 0.05;
  }

  /* ------------------------------------------------------------------ small instancing helper */
  function Inst({ geo, mat, items, cast = false }) {
    const ref = useRef();
    useEffect(() => {
      const o = new THREE.Object3D();
      const col = new THREE.Color();
      items.forEach((it, i) => {
        o.position.set(it.p[0], it.p[1], it.p[2]);
        const r = it.r || [0, 0, 0];
        o.rotation.set(r[0], r[1], r[2]);
        const s = it.s || [1, 1, 1];
        o.scale.set(s[0], s[1], s[2]);
        o.updateMatrix();
        ref.current.setMatrixAt(i, o.matrix);
        if (it.c) ref.current.setColorAt(i, col.set(it.c));
      });
      ref.current.instanceMatrix.needsUpdate = true;
      if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    }, [items]);
    return <instancedMesh ref={ref} args={[geo, mat, items.length]} frustumCulled={false} castShadow={cast} receiveShadow />;
  }

  /* ------------------------------------------------------------------ shared geometry */
  const G = {
    shaft: new THREE.CylinderGeometry(0.055, 0.07, 1, 6).translate(0, 0.5, 0),
    spike: new THREE.ConeGeometry(0.08, 0.8, 5).translate(0, 0.36, 0),
    cross: new THREE.BoxGeometry(0.5, 0.045, 0.045).translate(0, 0.06, 0),
    sword: new THREE.BoxGeometry(0.07, 1, 0.014).translate(0, 0.5, 0),
    bell: new THREE.CylinderGeometry(0.045, 0.115, 0.17, 8).translate(0, -0.1, 0),
    bellTop: new THREE.SphereGeometry(0.05, 6, 4).translate(0, -0.015, 0),
    flag: new THREE.PlaneGeometry(0.5, 0.4).translate(0, -0.2, 0),
    strip: new THREE.PlaneGeometry(0.3, 0.9).translate(0, -0.45, 0),
    patch: new THREE.BoxGeometry(1, 0.05, 1),
    rod: new THREE.CylinderGeometry(0.02, 0.026, 1, 4).translate(0, 0.5, 0),
    box: new THREE.BoxGeometry(1, 1, 1),
    ico: new THREE.IcosahedronGeometry(1, 0),
    cone: new THREE.ConeGeometry(1, 1, 6).translate(0, 0.5, 0),
    cone5: new THREE.ConeGeometry(1, 1, 5).translate(0, 0.5, 0),
    cone4: new THREE.ConeGeometry(1, 1, 4).translate(0, 0.5, 0),
  };
  const horn = (sgn) => {
    const pts = [[0, 0], [0.1, 0.04], [0.23, 0.17], [0.27, 0.4], [0.2, 0.62]].map(([x, y]) => new THREE.Vector3(sgn * x, y, 0));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.05, 5, false);
  };
  G.hornL = horn(-1); G.hornR = horn(1);
  const gableShape = new THREE.Shape();
  gableShape.moveTo(-1.76, 0); gableShape.lineTo(1.76, 0); gableShape.lineTo(0, 0.88); gableShape.closePath();
  G.gable = new THREE.ExtrudeGeometry(gableShape, { depth: 0.2, bevelEnabled: false });

  const FLAG_COLS = ['#2a5fd1', '#d8261f', '#f2c81d', '#2f9e44', '#f2f2ec', '#f08a1c', '#2a5fd1', '#d8261f', '#f2c81d', '#2f9e44', '#e0338f', '#7a3fb0', '#ff6a1a', '#9a8fa0', '#c9b27a', '#9a8fa0', '#c9b27a', '#b8b0a4'];
  const pick = (arr, k, s) => arr[Math.floor(rnd(k, s) * arr.length) % arr.length];
  const RIDGE_Y = 2.62; // roof ridge height
  const slopeY = (x) => RIDGE_Y - Math.abs(x) * 0.483;

  /* ------------------------------------------------------------------ the trident forest (deterministic): matte black iron */
  const TRI = [];
  const addTri = (x, y, z, h, tilt = 0.18, sc = 1, k = 0) => {
    const rx = (rnd(k, 3) - 0.5) * tilt * 2; const rz = (rnd(k, 4) - 0.5) * tilt * 2;
    TRI.push({ p: [x, y, z], h, rx, rz, sc: sc, c: rnd(k, 9) < 0.9 ? '#141210' : '#2c241e' });
  };
  let ti = 0;
  // roof crown, rising from the ridge and slopes
  for (let i = 0; i < 6; i += 1) { ti += 1; const x = -1.4 + rnd(ti, 1) * 2.8; addTri(x, slopeY(x) - 0.05, -1.0 + rnd(ti, 2) * 1.8, 1.4 + rnd(ti, 5) * 1.3, 0.2, 1.0, ti); }
  // a few shorter ones behind and beside (1.5 to 3 m)
  for (let i = 0; i < 8; i += 1) { ti += 1; addTri(-3.2 + rnd(ti, 1) * 6.4, 0.25, -1.8 - rnd(ti, 2) * 1.0, 1.5 + rnd(ti, 5) * 1.5, 0.16, 1.0, ti); }
  for (let i = 0; i < 6; i += 1) { ti += 1; const sd = i % 2 ? 1 : -1; addTri(sd * (2.4 + rnd(ti, 1) * 1.2), 0.25, -1.1 + rnd(ti, 2) * 2.4, 1.4 + rnd(ti, 5) * 1.2, 0.2, 1.0, ti); }
  // dense short ones planted in front at bell height, none in the doorway
  for (let i = 0; i < 34; i += 1) { ti += 1; const x = -3.4 + rnd(ti, 1) * 6.8; if (Math.abs(x) < 1.0) continue; addTri(x, 0.3, 1.25 + rnd(ti, 2) * 1.0, 1.0 + rnd(ti, 5) * 1.0, 0.24, 1.0, ti); }
  TRI.forEach((t) => {
    const e = new THREE.Euler(t.rx, 0, t.rz); const v = new THREE.Vector3(0, t.h, 0).applyEuler(e);
    t.top = [t.p[0] + v.x, t.p[1] + v.y, t.p[2] + v.z];
  });
  const triShaft = TRI.map((t) => ({ p: t.p, r: [t.rx, 0, t.rz], s: [0.8, t.h, 0.8], c: t.c }));
  const triTop = TRI.map((t) => ({ p: t.top, r: [t.rx, 0, t.rz], s: [t.sc, t.sc, t.sc], c: t.c }));
  const triBar = TRI.map((t, i) => ({ p: [t.top[0], t.top[1] + 0.05 * t.sc, t.top[2]], r: [t.rx, 0, t.rz], s: [t.sc, 1, 1], c: t.c }));

  // swords planted among them
  const SWORDS = [];
  for (let i = 0; i < 34; i += 1) {
    const k = 6000 + i; const x = -3.3 + rnd(k, 1) * 6.6;
    if (Math.abs(x) < 0.95 && rnd(k, 2) < 0.9) continue;
    const front = rnd(k, 3) < 0.5;
    SWORDS.push({ p: [x, front ? 0.35 : 0.3, front ? 1.3 + rnd(k, 4) * 0.8 : -1.8 - rnd(k, 4) * 1.2], r: [(rnd(k, 5) - 0.5) * 0.7, 0, (rnd(k, 6) - 0.5) * 0.9], s: [1, 0.8 + rnd(k, 7) * 1.0, 1], c: '#242220' });
  }

  /* ------------------------------------------------------------------ the iron thicket: irregular rods, rails and bells */
  const IRON_ITEMS = []; // posts and rails, black iron
  const BELLS = [];
  const bellCol = (k) => (rnd(k, 5) < 0.3 ? '#8d6a26' : rnd(k, 5) < 0.6 ? '#c79a3b' : '#a47a2c');
  const inDoor = (x) => Math.abs(x) < 0.95;

  // vertical posts: uneven heights up to about 2.6 m, none in the doorway
  [[-3.2, 2.0], [-2.3, 1.95], [-1.45, 2.05], [1.4, 2.0], [2.2, 1.95], [3.2, 2.05], [-3.2, 1.45], [-1.8, 1.45], [1.7, 1.45], [3.2, 1.45], [-3.2, 0.7], [3.2, 0.7], [-3.2, 0.1], [3.2, 0.1]]
    .forEach(([x, z], i) => { const h = 1.6 + rnd(i, 11) * 0.5; IRON_ITEMS.push({ p: [x, 0.3 + h / 2, z], s: [0.08, h, 0.08], r: [(rnd(i, 12) - 0.5) * 0.05, 0, (rnd(i, 13) - 0.5) * 0.05] }); });

  // three irregular levels
  [1.0, 1.55, 2.05].forEach((ly, lv) => {
    [2.0, 1.45].forEach((z, zi) => {
      // rail segments (low levels skip the doorway)
      const segs = lv === 2 ? [[-3.3, 3.3]] : [[-3.3, -0.95], [0.95, 3.3]];
      segs.forEach(([a, b], si) => {
        const n = Math.max(1, Math.round((b - a) / 1.3));
        for (let s = 0; s < n; s += 1) {
          const k = lv * 100 + zi * 40 + si * 10 + s;
          const x0 = a + ((b - a) * s) / n; const x1 = a + ((b - a) * (s + 1)) / n;
          IRON_ITEMS.push({ p: [(x0 + x1) / 2, ly + (rnd(k, 1) - 0.5) * 0.22, z + (rnd(k, 2) - 0.5) * 0.12], s: [x1 - x0, 0.045, 0.045], r: [0, 0, (rnd(k, 3) - 0.5) * 0.08] });
        }
      });
      for (let x = -3.15; x <= 3.16; x += 0.27) {
        const k = lv * 200 + zi * 70 + Math.round((x + 4) * 4);
        if (lv < 2 && inDoor(x)) continue;
        if (rnd(k, 8) < 0.28) continue;
        BELLS.push({ p: [x + (rnd(k, 1) - 0.5) * 0.14, ly - 0.03 + (rnd(k, 2) - 0.5) * 0.4, z + (rnd(k, 3) - 0.5) * 0.3], s: [0.85 + rnd(k, 3) * 0.5, 0.85 + rnd(k, 4) * 0.55, 0.85 + rnd(k, 3) * 0.5], c: bellCol(k) });
      }
    });
    [-3.2, 3.2].forEach((x, xi) => {
      IRON_ITEMS.push({ p: [x, ly + (rnd(lv * 7 + xi, 21) - 0.5) * 0.2, 0.9], s: [0.045, 0.045, 1.9], r: [0, 0, 0] });
      for (let z = 0.2; z <= 1.95; z += 0.27) {
        const k = 1000 + lv * 40 + xi * 20 + Math.round(z * 4);
        if (rnd(k, 8) < 0.3) continue;
        BELLS.push({ p: [x + (rnd(k, 1) - 0.5) * 0.14, ly - 0.03 + (rnd(k, 2) - 0.5) * 0.4, z], s: [1, 0.9 + rnd(k, 4) * 0.5, 1], c: bellCol(k) });
      }
    });
  });

  // many vertical iron rods at random angles with bells hung on them
  const RODS = [];
  for (let i = 0; i < 105; i += 1) {
    const x = -3.4 + rnd(i, 1) * 6.8;
    const door = inDoor(x);
    const y0 = door ? 1.7 : 0.3 + rnd(i, 8) * 0.5;
    const len = door ? 0.5 + rnd(i, 6) * 0.3 : 0.8 + rnd(i, 6) * 1.2;
    const rx = (rnd(i, 4) - 0.5) * 0.7; const rz = (rnd(i, 5) - 0.5) * 0.8;
    const p = [x, y0, 1.3 + rnd(i, 3) * 0.85];
    RODS.push({ p, r: [rx, 0, rz], s: [1, len, 1], c: '#161412' });
    const dir = new THREE.Vector3(0, 1, 0).applyEuler(new THREE.Euler(rx, 0, rz));
    const nb = 2 + Math.floor(rnd(i, 9) * 3);
    for (let b = 0; b < nb; b += 1) {
      const t = (0.35 + 0.65 * ((b + rnd(i * 5 + b, 3)) / nb)) * len;
      if (door && y0 + t < 1.7) continue;
      BELLS.push({ p: [p[0] + dir.x * t, p[1] + dir.y * t, p[2] + dir.z * t], s: [0.9 + rnd(i + b, 3) * 0.4, 0.9 + rnd(i + b, 4) * 0.5, 0.9 + rnd(i + b, 3) * 0.4], c: bellCol(i * 7 + b) });
    }
  }
  for (let i = 0; i < 24; i += 1) { // strays dangling from the roof eave
    const x = -3.2 + rnd(i, 1) * 6.4; if (inDoor(x)) continue;
    BELLS.push({ p: [x, 1.7 + rnd(i, 2) * 0.3, 1.3 + rnd(i, 4) * 0.2], s: [1.1, 1.1, 1.1], c: bellCol(i + 300) });
  }

  /* ------------------------------------------------------------------ flags & cloth */
  const FLAGS = [];
  const addLine = (a, b, n, seed, sag = 0.15) => {
    const yaw = Math.atan2(b[0] - a[0], b[2] - a[2]) + Math.PI / 2;
    for (let i = 0; i < n; i += 1) {
      const t = (i + 0.5) / n; const k = seed * 100 + i;
      const y = a[1] + (b[1] - a[1]) * t - Math.sin(t * Math.PI) * sag;
      FLAGS.push({
        p: [a[0] + (b[0] - a[0]) * t, y, a[2] + (b[2] - a[2]) * t],
        r: [(rnd(k, 1) - 0.5) * 0.9, yaw + (rnd(k, 2) - 0.5) * 0.8, (rnd(k, 3) - 0.5) * 0.9],
        s: [0.8 + rnd(k, 4) * 0.7, (0.6 + rnd(k, 5) * 0.9) * (rnd(k, 8) < 0.25 ? 0.6 : 1), 1], c: pick(FLAG_COLS, k, 6),
      });
    }
  };
  addLine([-3.3, 2.25, 2.0], [3.3, 2.25, 2.0], 16, 1, 0.05);
  // tidy lines draped over the ridge and both slopes, front eave to back eave (the stone roof shows between them)
  [-1.6, -0.8, 0, 0.8, 1.6].forEach((x, i) => {
    addLine([x, slopeY(x) + 0.25, 1.5], [x, slopeY(x) + 0.25, -1.7], 9, 10 + i, 0.08);
  });
  // two long lines from the rear tridents to the front rail
  [-2.4, 2.4].forEach((x, i) => { addLine([x, 3.1, -2.2], [x * 1.3, 2.3, 2.0], 10, 20 + i, 0.25); });
  addLine([-3.4, 2.3, 1.9], [-3.4, 3.3, -1.8], 8, 30, 0.2);
  addLine([3.4, 2.3, 1.9], [3.4, 3.3, -1.8], 8, 31, 0.2);
  // railing flags (two stretches, gap for the stone steps)
  addLine([-9.2, 1.0, 6.3], [1.6, 1.0, 6.3], 22, 40, 0.0);
  addLine([4.6, 1.0, 6.3], [9.2, 1.0, 6.3], 10, 41, 0.0);
  addLine([-7.2, 2.95, 3.6], [-5.2, 2.95, 3.6], 5, 42, 0.05); // flags on the bell gate lintel
  // dense overhead canopy of overlapping, tattered flags above the bell cage (y 3.6 to 4.2)
  const CANOPY = [];
  for (let i = 0; i < 26; i += 1) {
    const k = 7000 + i;
    CANOPY.push({
      p: [-3.6 + rnd(k, 1) * 7.2, 2.7 + rnd(k, 2) * 0.5, -1.8 + rnd(k, 3) * 3.0],
      r: [Math.PI / 2 + (rnd(k, 4) - 0.5) * 1.1, rnd(k, 5) * 6.28, (rnd(k, 6) - 0.5) * 0.9],
      s: [1.1 + rnd(k, 7) * 0.9, 0.9 + rnd(k, 8) * 0.9, 1], c: pick(FLAG_COLS, k, 3),
    });
  }
  // big hanging cloth panels / scarves from the canopy edge
  for (let i = 0; i < 9; i += 1) {
    const k = 7500 + i; const side = i % 3 === 0 ? 1 : i % 3 === 1 ? 2 : 1;
    CANOPY.push({
      p: [side === 0 ? -3.6 + rnd(k, 1) * 7.2 : side === 1 ? -3.6 : 3.6, 2.4 + rnd(k, 2) * 0.3, -1.8 + rnd(k, 3) * 4.0],
      r: [(rnd(k, 4) - 0.5) * 0.3, side === 0 ? 0 : Math.PI / 2, (rnd(k, 6) - 0.5) * 0.4],
      s: [1.0 + rnd(k, 7) * 0.8, 1.0 + rnd(k, 8) * 0.9, 1], c: pick(['#ff6a1a', '#9a8fa0', '#c9b27a', '#d8261f', '#f08a1c', '#2a5fd1'], k, 5),
    });
  }

  const STRIPS = []; // cloth hanging off the roof edges and down the front gable
  for (let i = 0; i < 30; i += 1) {
    const side = i % 4; const k = 500 + i;
    let p; let yaw; let len = 0.5 + rnd(k, 1) * 0.6;
    if (side === 0 || side === 3) { const x = -1.9 + rnd(k, 2) * 3.8; p = [x, slopeY(x) - 0.04, side === 0 ? 1.32 : -1.72]; yaw = side === 0 ? 0 : Math.PI; len *= side === 0 ? 1.1 : 1.2; }
    else if (side === 1) { p = [-1.97, 1.7, -1.5 + rnd(k, 2) * 2.7]; yaw = -Math.PI / 2; len *= 0.7; }
    else { p = [1.97, 1.7, -1.5 + rnd(k, 2) * 2.7]; yaw = Math.PI / 2; len *= 0.7; }
    STRIPS.push({ p, r: [(rnd(k, 3) - 0.5) * 0.2, yaw, (rnd(k, 4) - 0.5) * 0.2], s: [0.8 + rnd(k, 5) * 0.8, len, 1], c: pick(FLAG_COLS, k, 7) });
  }
  const PATCH = []; // 4 dense layers of cloth draped over both roof slopes
  for (let l = 0; l < 2; l += 1) {
    for (let i = 0; i < 12; i += 1) {
      const k = 800 + l * 50 + i;
      const x = (rnd(k, 1) - 0.5) * 4.0; const sg = x >= 0 ? -1 : 1;
      PATCH.push({ p: [x, slopeY(x) + 0.1 + l * 0.05 + rnd(k, 2) * 0.03, -1.65 + rnd(k, 3) * 2.9], r: [(rnd(k, 4) - 0.5) * 0.3, (rnd(k, 5) - 0.5) * 0.6, sg * 0.45 + (rnd(k, 6) - 0.5) * 0.25], s: [0.7 + rnd(k, 7) * 0.9, 1, 0.7 + rnd(k, 8) * 0.9], c: pick(FLAG_COLS, k, 9) });
    }
  }
  // cloth tied round the lower walls at the sides and back
  const WRAP = [];
  for (let i = 0; i < 22; i += 1) {
    const k = 900 + i; const side = i % 3;
    if (side === 0) WRAP.push({ p: [-1.78, 0.9 + rnd(k, 1) * 0.5, -1.2 + rnd(k, 2) * 2.4], r: [0, 0, 0], s: [0.06, 0.25 + rnd(k, 3) * 0.3, 0.3 + rnd(k, 4) * 0.4], c: pick(FLAG_COLS, k, 3) });
    else if (side === 1) WRAP.push({ p: [1.78, 0.9 + rnd(k, 1) * 0.5, -1.2 + rnd(k, 2) * 2.4], r: [0, 0, 0], s: [0.06, 0.25 + rnd(k, 3) * 0.3, 0.3 + rnd(k, 4) * 0.4], c: pick(FLAG_COLS, k, 3) });
    else WRAP.push({ p: [-1.6 + rnd(k, 2) * 3.2, 0.9 + rnd(k, 1) * 0.5, -1.42], r: [0, 0, 0], s: [0.3 + rnd(k, 4) * 0.4, 0.25 + rnd(k, 3) * 0.3, 0.06], c: pick(FLAG_COLS, k, 3) });
  }

  /* ------------------------------------------------------------------ holy pond: flowers heaped in the rock niche */
  const FLOWERS = [];
  for (let i = 0; i < 60; i += 1) {
    const k = 1200 + i;
    FLOWERS.push({ p: [5.6 + (rnd(k, 1) - 0.5) * 1.2, 0.26 + rnd(k, 2) * 0.16, 2.5 + (rnd(k, 3) - 0.5) * 0.9], r: [0, rnd(k, 4) * 3, 0], s: [0.1 + rnd(k, 5) * 0.14, 0.06, 0.1 + rnd(k, 6) * 0.12], c: pick(['#f08a1c', '#e84a8a', '#f2c81d', '#d8261f', '#f6a623', '#ffffff'], k, 2) });
  }

  /* ------------------------------------------------------------------ the shrine */
  function Lion({ p, flip = 1 }) {
    const M = useM();
    const red = M.plain('#a8402a', { roughness: 0.9 });
    const dark = M.plain('#1b1210', { roughness: 0.8 });
    const mane = M.plain('#7a2c1c', { roughness: 1 });
    return (
      <group position={p} scale={flip === -1 ? [-1.25, 1.25, 1.25] : [1.25, 1.25, 1.25]}>
        <Ball rad={0.26} p={[0, 0.62, 0.05]} sc={[1.15, 1.05, 0.7]} m={mane} />
        <Box s={[0.5, 0.12, 0.7]} p={[0, 0.06, 0]} m={M.plain('#7d6e60', { roughness: 0.9 })} />
        <Box s={[0.42, 0.34, 0.4]} p={[0, 0.27, -0.12]} m={red} />
        <Box s={[0.36, 0.42, 0.28]} p={[0, 0.4, 0.06]} m={red} />
        <Box s={[0.1, 0.3, 0.1]} p={[-0.12, 0.27, 0.22]} m={red} />
        <Box s={[0.1, 0.3, 0.1]} p={[0.12, 0.27, 0.22]} m={red} />
        <Ball rad={0.2} p={[0, 0.66, 0.14]} sc={[1, 0.95, 0.9]} m={red} />
        <Box s={[0.26, 0.14, 0.14]} p={[0, 0.6, 0.3]} m={red} />
        <Box s={[0.08, 0.08, 0.08]} p={[-0.1, 0.72, 0.3]} m={dark} />
        <Box s={[0.08, 0.08, 0.08]} p={[0.1, 0.72, 0.3]} m={dark} />
        <Box s={[0.1, 0.1, 0.06]} p={[-0.14, 0.86, 0.1]} m={red} />
        <Box s={[0.1, 0.1, 0.06]} p={[0.14, 0.86, 0.1]} m={red} />
      </group>
    );
  }

  function Shrine() {
    const M = useM();
    const slate = M.mat('stone', 2, 1, { color: '#a4a29b' });
    const slateDk = M.mat('stone', 2, 1, { color: '#7d7b76' });
    const roofM = M.plain('#6e5b4a', { roughness: 0.95 });
    const orange = M.plain('#d9541e', { roughness: 0.9 });
    const orangeDk = M.plain('#b8420f', { roughness: 0.9 });
    const redDk = M.plain('#a42214', { roughness: 0.9 });
    const rockA = M.plain('#8c8274', { roughness: 1 });
    const rockB = M.plain('#6f6558', { roughness: 1 });
    const forecourtA = M.plain('#8f3a22', { roughness: 1 });
    const forecourtB = M.plain('#74301e', { roughness: 1 });
    return (
      <group>
        {/* rock platform on the ridge */}
        <Box s={[9, 0.2, 8]} p={[0, 0.1, 0.8]} r={[0, 0.04, 0]} m={M.plain('#8a7a58', { roughness: 1 })} />
        {Array.from({ length: 34 }, (_, i) => {
          const a = (i / 34) * Math.PI * 2 + rnd(i, 70) * 0.2; const k = 2400 + i;
          const sz = 0.3 + rnd(k, 1) * 0.4;
          return <Ball key={`rim${i}`} rad={sz} p={[Math.cos(a) * (4.5 + rnd(k, 2) * 0.7), sz * 0.25, 0.8 + Math.sin(a) * (4.1 + rnd(k, 3) * 0.7)]} sc={[1.2 + rnd(k, 5) * 0.8, 0.5 + rnd(k, 4) * 0.4, 0.8 + rnd(k, 6) * 0.5]} m={i % 3 ? rockB : rockA} />;
        })}
        {[[-3.1, 3.9, 0.5], [3.6, 3.0, 0.4], [-4.0, -1.8, 0.6], [4.1, -2.6, 0.5]].map(([x, z, s], i) => (
          <Ball key={`bl${i}`} rad={s} p={[x, s * 0.35, z]} sc={[1.1, 0.7, 0.9]} m={rockB} />
        ))}
        {/* small pale paved patch in front of the doorway */}
        <Box s={[4, 0.06, 3]} p={[0, 0.23, 2.9]} m={M.plain('#9b9382', { roughness: 1 })} />
        {[[-0.9, 0.5, 1.6], [1.1, 0.3, 1.3], [0.2, 1.6, 1.8], [-1.6, 1.8, 0.9]].map(([x, z, w], i) => (
          <Box key={`fc${i}`} s={[w, 0.03, w * 0.7]} p={[x, 0.27, 2.4 + z]} r={[0, i * 0.7 + 0.2, 0]} m={i % 2 ? forecourtA : forecourtB} />
        ))}
        {/* the low stone shrine */}
        <Box s={[3.5, 1.5, 2.5]} p={[0, 1.0, -0.2]} m={slate} />
        <Box s={[3.55, 0.1, 2.55]} p={[0, 0.35, -0.2]} m={slateDk} />
        {/* old pitched gable roof: ridge along z, two slopes tilted 0.45 rad, overhanging eaves */}
        <Box s={[2.2, 0.14, 3.0]} p={[0.98, 2.04, -0.2]} r={[0, 0, -0.45]} m={roofM} />
        <Box s={[2.2, 0.14, 3.0]} p={[-0.98, 2.04, -0.2]} r={[0, 0, 0.45]} m={roofM} />
        <Box s={[0.16, 0.14, 3.1]} p={[0, RIDGE_Y + 0.04, -0.2]} m={slateDk} />
        {/* orange-red front gable and back gable */}
        <mesh geometry={G.gable} material={orange} position={[0, 1.75, 1.05]} castShadow />
        <mesh geometry={G.gable} material={orangeDk} position={[0, 1.75, -1.46]} castShadow />
        <Box s={[3.5, 0.12, 0.12]} p={[0, 1.76, 1.28]} m={orangeDk} />
        {/* vermilion front panel, doorway, forecourt */}
        <Box s={[3.2, 1.3, 0.07]} p={[0, 1.0, 1.08]} m={orange} />
        <Box s={[1.0, 1.25, 0.1]} p={[0, 0.9, 1.1]} m={M.plain('#8a1f15', { roughness: 0.9 })} />
        <Box s={[0.8, 1.1, 0.14]} p={[0, 0.84, 1.13]} m={M.plain('#050302', { roughness: 1 })} />
        <Box s={[1.3, 0.18, 0.2]} p={[0, 1.5, 1.14]} m={slateDk} />
        {[[-1.45, 3.2], [1.5, 3.0], [0.1, 3.8], [-0.6, 4.0]].map(([x, z], i) => (
          <Box key={`sp${i}`} s={[1.2 - i * 0.1, 0.03, 0.8]} p={[x, 0.27, z]} r={[0, i * 0.9, 0]} m={i % 2 ? forecourtA : forecourtB} />
        ))}
        {/* cloth wraps and flags */}
        <Inst geo={G.strip} mat={M.flagMat} items={STRIPS} />
        <Inst geo={G.patch} mat={M.clothMat} items={PATCH} />
        <Inst geo={G.box} mat={M.clothMat} items={WRAP} />
        <Lion p={[-1.35, 0.26, 2.6]} />
        <Lion p={[1.35, 0.26, 2.6]} flip={-1} />
        {[[-0.5, 3.45], [0.5, 3.45], [-1.4, 3.7], [1.4, 3.7]].map(([x, z], i) => (
          <Cyl key={i} rt={0.07} rb={0.09} h={0.06} p={[x, 0.46, z]} m={M.plain('#f5a623', { emissive: '#f08a1c', emissiveIntensity: 0.8, roughness: 0.6 })} seg={8} />
        ))}
      </group>
    );
  }

  function Tridents() {
    const M = useM();
    const iron = M.plain('#ffffff', { roughness: 0.8, metalness: 0.2 });
    return (
      <group>
        <Inst geo={G.shaft} mat={iron} items={triShaft} cast />
        <Inst geo={G.spike} mat={iron} items={triTop} cast />
        <Inst geo={G.hornL} mat={iron} items={triTop} cast />
        <Inst geo={G.hornR} mat={iron} items={triTop} cast />
        <Inst geo={G.cross} mat={iron} items={triBar} />
        <Inst geo={G.sword} mat={iron} items={SWORDS} />
        <Inst geo={G.rod} mat={iron} items={RODS} />
      </group>
    );
  }

  function IronFrames() {
    const M = useM();
    const iron = M.plain('#ffffff', { roughness: 0.8, metalness: 0.2 });
    return (
      <group>
        <Inst geo={G.box} mat={iron} items={IRON_ITEMS.map((it) => ({ ...it, c: '#171513' }))} />
        <Inst geo={G.bell} mat={M.bellMat} items={BELLS} cast />
        <Inst geo={G.bellTop} mat={M.bellMat} items={BELLS} />
        <Inst geo={G.flag} mat={M.flagMat} items={FLAGS} />
        <Inst geo={G.flag} mat={M.flagMat} items={CANOPY} />
      </group>
    );
  }

  function BellFrame() {
    const M = useM();
    const iron = M.plain('#14110e', { roughness: 0.8, metalness: 0.2 });
    const steel = M.plain('#6f6c66', { roughness: 0.4, metalness: 0.7 });
    return (
      <group position={[-6.2, 0.25, 3.6]}>
        {/* slim posts (0.14) and a bracketed lintel, 2.8 m tall; the gate faces +z */}
        <Box s={[0.14, 2.7, 0.14]} p={[-1.0, 1.35, 0]} m={iron} />
        <Box s={[0.14, 2.7, 0.14]} p={[1.0, 1.35, 0]} m={iron} />
        <Box s={[2.5, 0.16, 0.16]} p={[0, 2.62, 0]} m={iron} />
        <Box s={[2.65, 0.07, 0.2]} p={[0, 2.74, 0]} m={iron} />
        {/* curved/triangular brackets at the lintel ends */}
        <Box s={[0.5, 0.1, 0.1]} p={[-0.82, 2.38, 0]} r={[0, 0, -0.75]} m={iron} />
        <Box s={[0.5, 0.1, 0.1]} p={[0.82, 2.38, 0]} r={[0, 0, 0.75]} m={iron} />
        <Box s={[0.3, 0.3, 0.1]} p={[-0.88, 2.42, 0]} r={[0, 0, Math.PI / 4]} m={iron} />
        <Box s={[0.3, 0.3, 0.1]} p={[0.88, 2.42, 0]} r={[0, 0, Math.PI / 4]} m={iron} />
        {/* bell on two chain links */}
        <Cyl rt={0.014} rb={0.014} h={0.42} p={[-0.07, 2.34, 0]} r={[0, 0, 0.1]} m={steel} seg={5} />
        <Cyl rt={0.014} rb={0.014} h={0.42} p={[0.07, 2.34, 0]} r={[0, 0, -0.1]} m={steel} seg={5} />
        <Ball rad={0.06} p={[0, 2.12, 0]} m={steel} />
        <Cyl rt={0.1} rb={0.3} h={0.55} p={[0, 1.78, 0]} m={steel} seg={12} />
        <Ball rad={0.12} p={[0, 2.04, 0]} sc={[1, 0.7, 1]} m={steel} />
        <Cyl rt={0.02} rb={0.03} h={0.4} p={[0, 1.3, 0]} m={M.plain('#2a1a14', { roughness: 1 })} seg={5} />
        <Box s={[0.12, 0.12, 0.12]} p={[0, 1.08, 0]} m={M.plain('#8a1f15')} />
        <Box s={[2.6, 0.2, 0.7]} p={[0, 0.1, 0]} m={M.mat('stone', 1, 1, { color: '#9a9488' })} />
      </group>
    );
  }

  function Pond() {
    const M = useM();
    const rock = M.mat('rock', 1.5, 1, { color: '#d2c3ae' });
    const rockDk = M.plain('#85766a', { roughness: 1 });
    const powder = M.plain('#b3261a', { roughness: 0.95 });
    const powderDk = M.plain('#8a1a10', { roughness: 0.95 });
    return (
      <group>
        {/* rough rock-cut niche: back and side walls, overhung roof, open to +z */}
        <Box s={[2.6, 1.5, 0.7]} p={[5.6, 0.75, 1.6]} r={[0, 0.03, 0]} m={rock} />
        <Box s={[0.7, 1.1, 1.7]} p={[4.45, 0.55, 2.5]} r={[0, 0.1, 0.05]} m={rock} />
        <Box s={[0.7, 1.0, 1.7]} p={[6.75, 0.5, 2.5]} r={[0, -0.1, -0.06]} m={rock} />
        {/* sloped rocky overhang, mouth about 0.9 m tall */}
        <Box s={[2.9, 0.5, 2.1]} p={[5.6, 1.35, 2.35]} r={[0.2, 0, 0.03]} m={rock} />
        {/* mound of rounded rocks burying the back, sides and roof */}
        {[[5.6, 1.9, 1.3, 1.1, 0.8], [4.0, 1.1, 1.9, 0.85, 0.8], [7.2, 1.05, 1.9, 0.8, 0.8], [5.2, 1.75, 2.5, 0.65, 0.5], [6.2, 1.7, 2.4, 0.6, 0.5], [5.7, 1.6, 3.1, 0.5, 0.4], [3.9, 0.35, 3.0, 0.5, 0.6], [7.4, 0.35, 2.9, 0.5, 0.6], [4.4, 0.35, 3.5, 0.4, 0.6], [6.9, 0.35, 3.5, 0.4, 0.6], [5.6, 0.9, 0.6, 1.2, 0.8]].map(([x, y, z, r, k], i) => (
          <Ball key={`pr${i}`} rad={r} p={[x, y, z]} sc={[1.25, k, 1]} m={i % 3 === 0 ? rockDk : rock} />
        ))}
        {/* vermilion streaks on the inside faces and a big powder spill in front */}
        <Box s={[1.9, 0.8, 0.05]} p={[5.6, 0.5, 1.93]} m={powder} />
        <Box s={[0.05, 0.6, 1.2]} p={[4.82, 0.45, 2.5]} m={powder} />
        <Box s={[0.05, 0.55, 1.2]} p={[6.38, 0.42, 2.5]} m={powder} />
        <Box s={[0.7, 0.4, 0.06]} p={[5.3, 0.75, 1.9]} m={powderDk} />
        <Box s={[3.0, 0.03, 1.2]} p={[5.6, 0.255, 3.7]} r={[0, 0.1, 0]} m={powder} />
        <Box s={[1.8, 0.03, 0.9]} p={[4.6, 0.26, 4.4]} r={[0, 0.5, 0]} m={powderDk} />
        <Box s={[1.4, 0.03, 0.8]} p={[6.6, 0.26, 4.3]} r={[0, -0.4, 0]} m={powder} />
        {/* deeper floor of flowers */}
        <Box s={[1.5, 0.1, 1.3]} p={[5.6, 0.2, 2.5]} m={powderDk} />
        <Inst geo={G.patch} mat={M.clothMat} items={FLOWERS} />
      </group>
    );
  }

  function Railing() {
    const M = useM();
    const pipe = M.plain('#8b8d90', { roughness: 0.5, metalness: 0.6 });
    const segs = [[-9.2, 1.6], [4.6, 9.2]];
    return (
      <group>
        {segs.map(([a, b], si) => {
          const n = Math.max(2, Math.round((b - a) / 2.2) + 1);
          return (
            <group key={si}>
              {Array.from({ length: n }, (_, i) => <Box key={i} s={[0.07, 1.15, 0.07]} p={[a + ((b - a) * i) / (n - 1), 0.82, 6.3]} m={pipe} />)}
              <Box s={[b - a, 0.05, 0.05]} p={[(a + b) / 2, 1.0, 6.3]} m={pipe} />
              <Box s={[b - a, 0.05, 0.05]} p={[(a + b) / 2, 0.55, 6.3]} m={pipe} />
            </group>
          );
        })}
        <Box s={[0.07, 1.15, 0.07]} p={[-9.2, 0.82, 4.3]} m={pipe} />
      </group>
    );
  }

  function Mats({ children }) {
    const M = useM();
    // materials with per-instance colour (shared through the cached M object)
    if (!M.flagMat) {
      M.flagMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.95, side: THREE.DoubleSide });
      M.clothMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.95, side: THREE.DoubleSide });
      M.bellMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.38, metalness: 0.75 });
    }
    return children;
  }

  function KalinchowkMain() {
    return (
      <Mats>
        <group>
          <Shrine />
          <Tridents />
          <IronFrames />
          <BellFrame />
          <Pond />
          <Railing />
          <pointLight position={[0, 1.2, 3.2]} color="#ffb060" intensity={0.5} distance={7} />
          <Frame s={[13, 6.2, 9.5]} p={[0, 3.1, 1.9]} />
        </group>
      </Mats>
    );
  }

  /* ------------------------------------------------------------------ environment */
  // dry-stacked slate slabs forming a visible stair line coming up the ridge towards the shrine from +z
  const STEPS = [];
  const stepX = (z) => 3.1 + 1.2 * Math.sin(z / 6);
  const TUFTS = [];
  for (let i = 0; i < 26; i += 1) {
    const z = 7.2 + i * 1.05; const x = stepX(z);
    const yaw = Math.atan2(1.2 / 6 * Math.cos(z / 6), 1);
    const k = 1500 + i; const base = T(x, z);
    // a narrow cairn-like stack of 3 to 5 thin slate slabs, 1.2 m wide stair
    const n = 3 + Math.floor(rnd(k, 1) * 3);
    for (let j = 0; j < n; j += 1) {
      const kk = k * 10 + j;
      STEPS.push({ p: [x + (rnd(kk, 1) - 0.5) * 0.16, base + 0.04 + j * 0.085, z + (rnd(kk, 2) - 0.5) * 0.12 - j * 0.03], r: [0, yaw + (rnd(kk, 3) - 0.5) * 0.25, (rnd(kk, 4) - 0.5) * 0.06], s: [1.0 + rnd(kk, 5) * 0.25 - j * 0.04, 0.08, 0.6 - j * 0.03], c: pick(['#5a5a54', '#4e4e49', '#66645c'], kk, 6) });
    }
    for (let q = 0; q < 3; q += 1) {
      const kk = k * 7 + q; const sd = q % 2 ? 1 : -1; const ox = sd * (1.1 + rnd(kk, 1) * 1.8);
      TUFTS.push({ p: [x + ox, T(x + ox, z + (rnd(kk, 2) - 0.5)) - 0.02, z + (rnd(kk, 2) - 0.5)], s: [0.22 + rnd(kk, 3) * 0.18, 0.14 + rnd(kk, 4) * 0.14, 0.22 + rnd(kk, 3) * 0.18], r: [0, rnd(kk, 5) * 3, 0], c: pick(['#6d5a3f', '#9c8450', '#7c6845', '#b79d62'], kk, 7) });
    }
  }
  const ROCKS = [];
  for (let i = 0; i < 30; i += 1) {
    const k = 1700 + i; const a = rnd(k, 1) * Math.PI * 2; const r = 9 + rnd(k, 2) * 26;
    const x = Math.cos(a) * r * 1.8; const z = Math.sin(a) * r * 0.9;
    const near = Math.abs(x - stepX(z)) < 3.5 && z > 5;
    if (near) continue;
    const s = 0.4 + rnd(k, 3) * 1.0;
    ROCKS.push({ p: [x, T(x, z) + s * 0.2, z], r: [rnd(k, 4), rnd(k, 5) * 3, rnd(k, 6)], s: [s * 1.3, s * 0.7, s], c: pick(['#7c7469', '#8d8477', '#6b655c', '#9a8f7e'], k, 8) });
  }
  // crag-like brown rocky outcrops on the ridge flanks (jagged, stacked)
  const CRAGS = [];
  for (let i = 0; i < 40; i += 1) {
    const k = 2900 + i; const sd = i % 2 ? 1 : -1;
    const x = sd * (13 + rnd(k, 1) * 26); const z = -10 + rnd(k, 2) * 26;
    const h = T(x, z); const s = 1.6 + rnd(k, 3) * 2.6;
    CRAGS.push({ p: [x, h - 0.4, z], r: [(rnd(k, 4) - 0.5) * 0.3, rnd(k, 5) * 3, (rnd(k, 6) - 0.5) * 0.3], s: [s * 1.2, s * (1.0 + rnd(k, 7) * 1.2), s], c: pick(['#6d5a3f', '#7d6a50', '#8a7a64', '#5f5242'], k, 8) });
  }
  // dark conifer patches on the slopes just below the summit
  const CONIFERS = [];
  for (let i = 0; i < 4000 && CONIFERS.length < 240; i += 1) {
    const k = 2200 + i; const x = (rnd(k, 1) - 0.5) * 80; const z = -14 + rnd(k, 2) * 64;
    const h = T(x, z);
    if (h > -2.5 || h < -26) continue;
    if (Math.abs(x - stepX(z)) < 3.2 && z > 5) continue;
    if (fbm(x * 0.07 + 5, z * 0.07 + 2, 2) < 0.52) continue;
    const s = 1.0 + rnd(k, 4) * 1.4;
    CONIFERS.push({ p: [x, h - 0.15, z], s: [s * 0.5, s * 2.8, s * 0.5], c: pick(['#1c3324', '#21392a', '#18291f', '#2a3b22'], k, 5) });
  }
  const TREES = [];
  for (let i = 0; i < 900 && TREES.length < 210; i += 1) {
    const k = 2000 + i; const x = (rnd(k, 1) - 0.5) * 210; const z = (rnd(k, 2) - 0.5) * 210;
    const h = T(x, z);
    if (h > -20 || h < -52) continue;
    if (fbm(x * 0.06, z * 0.06, 2) < 0.42 || rnd(k, 3) < 0.35) continue;
    const s = 1.6 + rnd(k, 4) * 1.6;
    TREES.push({ p: [x, h - 0.2, z], s: [s * 0.55, s * 2.6, s * 0.55], c: pick(['#2b4631', '#334f35', '#263d2c', '#3d4a2a'], k, 5) });
  }
  // far snow range: a long, low, jagged crest (6 to 12 degrees above the horizon), 44 narrow irregular peaks in a continuous band
  const PEAKS = [];
  for (let i = 0; i < 100; i += 1) {
    const a = (188 + (i / 99) * 164) * Math.PI / 180; const k = 3000 + i;
    const R = 560 + rnd(k, 1) * 30;
    const swell = 0.5 + 0.5 * Math.sin(i * 0.23 + 1.1) * Math.sin(i * 0.071 + 0.4); // massifs rising and falling along the crest
    const h = 12 + Math.pow(rnd(k, 2), 1.4) * 22 + swell * 20 + (i % 13 === 6 ? 10 : 0);
    PEAKS.push({ x: Math.cos(a) * R, z: Math.sin(a) * R, h, r: 9 + rnd(k, 3) * 12, rot: rnd(k, 4) * 3 });
  }
  const PEAK_BASE = -16;
  const PEAKS_ROCK = PEAKS.map((p) => ({ p: [p.x, PEAK_BASE, p.z], r: [0, p.rot, 0], s: [(p.h + 16) * 0.9, p.h + 16, (p.h + 16) * 0.9], c: '#a3b2cc' }));
  const PEAKS_SNOW = PEAKS.map((p) => { const sh = p.h * 0.5 + 3; const H = p.h + 16; return { p: [p.x, PEAK_BASE + H - sh, p.z], r: [0, p.rot, 0], s: [H * 0.9 * (sh / H) * 1.05, sh, H * 0.9 * (sh / H) * 1.05], c: '#f4f7fc' }; });
  // layered haze ridges in front: a low dark valley layer, then a paler blue one
  const RIDGES = [];
  for (let i = 0; i < 18; i += 1) {
    const a = (182 + (i / 17) * 176) * Math.PI / 180; const k = 4000 + i; const R = 240 + rnd(k, 1) * 50;
    RIDGES.push({ p: [Math.cos(a) * R, -75, Math.sin(a) * R], r: [0, rnd(k, 3) * 3, 0], s: [190 + rnd(k, 2) * 70, 28 + rnd(k, 4) * 8, 100 + rnd(k, 5) * 30], c: pick(['#8e9bb4', '#929fb7', '#8a97b0'], k, 6) });
  }
  for (let i = 0; i < 20; i += 1) {
    const a = (182 + (i / 19) * 176) * Math.PI / 180; const k = 4500 + i; const R = 340 + rnd(k, 1) * 40;
    RIDGES.push({ p: [Math.cos(a) * R, -75, Math.sin(a) * R], r: [0, rnd(k, 3) * 3, 0], s: [210 + rnd(k, 2) * 70, 58 + rnd(k, 4) * 6, 110 + rnd(k, 5) * 30], c: pick(['#a9b8d0', '#b2c0d6', '#a6b5cd'], k, 6) });
  }

  function Terrain() {
    const geo = useMemo(() => {
      const g = new THREE.PlaneGeometry(300, 300, 110, 110);
      g.rotateX(-Math.PI / 2);
      const pos = g.attributes.position; const col = new Float32Array(pos.count * 3); const c = new THREE.Color();
      for (let i = 0; i < pos.count; i += 1) {
        const x = pos.getX(i); const z = pos.getZ(i);
        const y = T(x, z); pos.setY(i, y);
        const n = fbm(x * 0.2, z * 0.2, 3); const m = fbm(x * 0.05 + 9, z * 0.05, 3);
        const steep = Math.abs(T(x + 2, z) - T(x - 2, z)) + Math.abs(T(x, z + 2) - T(x, z - 2));
        c.set(n > 0.55 ? '#b79d62' : '#a08652');
        c.lerp(new THREE.Color('#6d5a3f'), SH(0.4, 0.62, m) * 0.85);
        if (Math.hypot(x, z) < 11) c.lerp(new THREE.Color('#8a7a58'), 0.5);
        if (steep > 2.4 && n > 0.45) c.lerp(new THREE.Color('#756a5d'), Math.min(1, (steep - 2.4) * 0.35));
        if (y < -22) c.lerp(new THREE.Color('#58623f'), SH(-22, -34, y) * 0.8);
        const dist = Math.hypot(x, z);
        c.lerp(new THREE.Color('#9db0cc'), SH(70, 150, dist) * 0.85);
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      g.computeVertexNormals();
      return g;
    }, []);
    return <mesh geometry={geo} receiveShadow><meshStandardMaterial vertexColors flatShading roughness={1} fog={false} /></mesh>;
  }

  function Sky() {
    const geo = useMemo(() => {
      const g = new THREE.SphereGeometry(700, 24, 16);
      const pos = g.attributes.position; const col = new Float32Array(pos.count * 3); const c = new THREE.Color();
      for (let i = 0; i < pos.count; i += 1) {
        const t = Math.max(0, pos.getY(i) / 700);
        c.set('#cfe2f2').lerp(new THREE.Color('#2f72c9'), Math.pow(t, 0.55));
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      return g;
    }, []);
    return <mesh geometry={geo}><meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} toneMapped={false} depthWrite={false} /></mesh>;
  }

  function KalinchowkEnv() {
    const flat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, flatShading: true, fog: false }), []);
    const flatFog = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.95, flatShading: true }), []);
    const snowM = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.8, flatShading: true, fog: false, emissive: '#cfdcf0', emissiveIntensity: 0.25 }), []);
    return (
      <group>
        <Sky />
        <mesh position={[0, -76, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1500, 1500]} /><meshBasicMaterial color="#93a9c8" fog={false} /></mesh>
        <Terrain />
        <Inst geo={G.cone} mat={flat} items={RIDGES} />
        <Inst geo={G.cone5} mat={flat} items={PEAKS_ROCK} />
        <Inst geo={G.cone5} mat={snowM} items={PEAKS_SNOW} />
        <Inst geo={G.ico} mat={flatFog} items={ROCKS} cast />
        <Inst geo={G.cone5} mat={flatFog} items={CRAGS} cast />
        <Inst geo={G.cone4} mat={flatFog} items={TUFTS} />
        <Inst geo={G.cone} mat={flatFog} items={TREES} />
        <Inst geo={G.cone} mat={flatFog} items={CONIFERS} />
        <Inst geo={G.box} mat={flatFog} items={STEPS} cast />
      </group>
    );
  }

  return { 'kalinchowk-bhagawati': { Main: KalinchowkMain, Env: KalinchowkEnv } };
}
