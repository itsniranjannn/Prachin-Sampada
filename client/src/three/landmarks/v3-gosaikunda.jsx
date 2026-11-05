// Gosaikunda, the sacred glacial lake at 4,380 m, Langtang National Park (Rasuwa, Bagmati).
// A landscape, not a monument: a long irregular dark lake in a treeless cirque of grey rock and snow-streaked peaks,
// stone cairns standing in the shallows, a tiny whitewashed Shiva shrine and a few low tin-roofed lodges on the arrival
// (south, +z) shore, the white Himalaya behind, and the small deep-blue Bhairav Kunda in a distant rock notch.
// Scale: 1 unit is about 10 m for the lake and mountains (lake ~ 400 x 200 m). Shrine, cairns and figures are
// deliberately drawn about 2-5 times larger than true size so they stay readable. Viewer shore at +z, lake runs to -z.
export default function make(K) {
  const { useM, Box, Cyl, Frame, PrayerFlags, Trident, THREE, useMemo, useRef, useEffect } = K;

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

  /* ------------------------------------------------------------------ the lake */
  const LK = { a: 38, b: 19, zc: 0, rot: 0.28 };
  const CR = Math.cos(LK.rot); const SR = Math.sin(LK.rot);
  const radiusAt = (t) => { const e = Math.sin(t) ** 2; return 1 + 0.07 * (0.5 + 0.5 * e) * Math.sin(3 * t + 1) + 0.075 * Math.sin(5 * t + 2.3) * (0.5 + 0.5 * e) + 0.07 * e * Math.sin(8 * t + 0.4) + 0.05 * e * Math.sin(13 * t) + 0.04 * (1 - e); };
  function lakeE(x, z) {
    const dx = x; const dz = z - LK.zc;
    const lx = (dx * CR + dz * SR) / LK.a; const lz = (-dx * SR + dz * CR) / LK.b;
    return Math.sqrt(lx * lx + lz * lz) / radiusAt(Math.atan2(lz, lx));
  }
  function shorePoint(t, k = 1) {
    const r = radiusAt(t) * k;
    const lx = LK.a * r * Math.cos(t); const lz = LK.b * r * Math.sin(t);
    return [lx * CR - lz * SR, LK.zc + lx * SR + lz * CR];
  }

  // z of the near (+z) shore at a given x, for shore-relative placement (k < 1 inside the lake)
  function nearShoreZ(x, k = 1) { let z = 40; while (z > -40 && lakeE(x, z) > k) z -= 0.1; return z; }
  const SHRINE_X = 7; const SHRINE_Z = nearShoreZ(SHRINE_X, 1.05) + 2.4;
  const LODGE_X = [-17.5, -14, -10.5, -7, -3.5];
  const LODGE_PTS = LODGE_X.map((x, i) => [x, nearShoreZ(x, 1.06) + 2.8 + (i % 2) * 1.5]);
  const LC = [LODGE_PTS.reduce((a, q) => a + q[0], 0) / LODGE_PTS.length, LODGE_PTS.reduce((a, q) => a + q[1], 0) / LODGE_PTS.length];

  /* ------------------------------------------------------------------ terrain */
  // [x, z, height, radiusX, radiusZ]
  const PEAKS = [
    [32, -33, 26, 18, 18], // the dominant steep pyramid, right
    [-38, -38, 21, 29, 21, 1], // massive flat-topped block shoulder, left
    [3, -56, 12, 15, 14], // small pyramid seen through the saddle
    [-14, -52, 8, 16, 14],
    [-62, -98, 28, 40, 34], [-22, -104, 29, 38, 34], [22, -108, 30, 40, 34], [66, -100, 27, 38, 34], [102, -92, 24, 34, 30], [-104, -90, 23, 34, 30],
    [-48, -12, 8, 22, 18], [50, -14, 9, 24, 18], [-52, -40, 15, 24, 24], [60, -44, 16, 26, 24],
  ];
  const PADS = [[LC[0], LC[1] + 0.5, 12, 0.55], [SHRINE_X, SHRINE_Z, 6, 0.5]];
  const BH = { x: -8, z: -72, rx: 6, rz: 4, S: 7 }; // Bhairav Kunda shelf, small and far
  const PATH = [[-6, 52], [-4.4, 38], [-1.4, 28], [0.4, 24], [1.2, 20]];
  function segD(px, pz, pts) {
    let best = 1e9;
    for (let i = 0; i < pts.length - 1; i += 1) {
      const [ax, az] = pts[i]; const [bx, bz] = pts[i + 1];
      const vx = bx - ax; const vz = bz - az;
      const t = Math.min(1, Math.max(0, ((px - ax) * vx + (pz - az) * vz) / (vx * vx + vz * vz)));
      best = Math.min(best, Math.hypot(px - (ax + vx * t), pz - (az + vz * t)));
    }
    return best;
  }
  function H(x, z, nb) {
    const e = lakeE(x, z);
    if (e < 1) return -4 * Math.pow(1 - e, 0.55);
    const dist = Math.min((e - 1) * 17, 46);
    const far = SH(LK.zc + 3, LK.zc - 9, z);
    const side = SH(14, 34, Math.abs(x)) * (1 - SH(4, 20, z));
    const sad = 1 - 0.62 * Math.exp(-(((x - 1) / 15) ** 2)) * SH(-8, -24, z);
    const wallK = (0.16 + 0.84 * Math.max(far, side * 0.8)) * (far > 0.5 ? sad : 1);
    let h = Math.min(dist, 2.4) * 0.28 + wallK * (0.1 * Math.max(0, dist - 2) + 0.0014 * Math.max(0, dist - 2) ** 2);
    h += (fbm(x * 0.5, z * 0.5) - 0.5) * (0.22 + 0.04 * Math.min(dist, 30) * (0.25 + 0.75 * Math.max(far, side)));
    const rg = 1 - Math.abs(2 * fbm(x * 0.085 + 9, z * 0.085) - 1);
    h += SH(1.5, 9, dist) * wallK * rg * rg * (0.6 + 0.07 * dist) * (0.3 + 0.7 * Math.max(far, side));
    // jagged peaks
    let pk = 0;
    for (let i = 0; i < PEAKS.length; i += 1) {
      const [px, pz, ph, rx, rz, flat] = PEAKS[i];
      const w1 = fbm(x * 0.06 + i * 3, z * 0.06 + 5) - 0.5;
      const d = Math.sqrt(((x - px) / rx) ** 2 + ((z - pz) / rz) ** 2) + 0.26 * w1;
      if (d < 1) {
        const rr = 1 - Math.abs(2 * fbm(x * 0.17 + i, z * 0.17 + 2) - 1);
        let v = ph * Math.pow(1 - d, 1.22) * (0.72 + 0.55 * rr);
        if (flat) { v = ph * Math.pow(1 - d, 0.95) * (0.97 + 0.06 * rr) * 1.25; v = Math.min(v, ph * 0.74 + 0.8 * rr); }
        if (v > pk) pk = v;
      }
    }
    h += pk;
    // the viewer's side drops away steeply below the shore so the water is the hero
    h -= SH(0, 14, z) * 0.5 * Math.min(Math.max(0, e - 1.1) * 12, 9);
    // pads for the lodges and the shrine
    for (let i = 0; i < PADS.length; i += 1) {
      const [px, pz, pr, ph] = PADS[i];
      const w = (1 - SH(pr * 0.55, pr, Math.hypot(x - px, z - pz))) * SH(1.0, 1.1, e);
      h = h + (ph - h) * w;
    }
    // Bhairav Kunda: a shallow rock bowl dug into the saddle, dammed by a low moraine on the downhill side
    if (!nb) {
      const dd = Math.sqrt(((x - BH.x) / BH.rx) ** 2 + ((z - BH.z) / BH.rz) ** 2);
      if (dd < 1.8) {
        const rim = BH.S + 0.5 + 3.5 * SH(0.9, 1.8, dd);
        h += (Math.min(Math.max(h, BH.S - 0.3), rim) - h) * (1 - SH(1.3, 1.8, dd));
        h += (BH.S - 0.45 - h) * (1 - SH(0.7, 1.0, dd));
      }
    }
    return h;
  }

  BH.S = H(BH.x, BH.z, true) - 0.2;
  const C = (hex) => new THREE.Color(hex);
  const ROCK_D = C('#4a4a4f'); const ROCK_B = C('#5f5a52'); const SNOW = C('#f1f5fb'); const SNOW_S = C('#cdd9ea');
  const TUND1 = C('#7f7656'); const TUND2 = C('#66683f'); const WET = C('#6c6a66'); const SCREE = C('#6a665f'); const PATHC = C('#8a7f6c'); const HAZE = C('#b2c3dc'); const GRAV = C('#77736d');
  const tmp = new THREE.Color();

  function buildTerrain() {
    const x0 = -125; const x1 = 125; const z0 = -130; const z1 = 90;
    const nx = 400; const nz = 350;
    const sx = (x1 - x0) / nx; const sz = (z1 - z0) / nz;
    const W = nx + 1;
    const pos = new Float32Array(W * (nz + 1) * 3);
    const col = new Float32Array(W * (nz + 1) * 3);
    const hs = new Float32Array(W * (nz + 1));
    for (let j = 0; j <= nz; j += 1) for (let i = 0; i <= nx; i += 1) hs[j * W + i] = H(x0 + i * sx, z0 + j * sz);
    for (let j = 0; j <= nz; j += 1) {
      for (let i = 0; i <= nx; i += 1) {
        const x = x0 + i * sx; const z = z0 + j * sz; const h = hs[j * W + i];
        const k = j * W + i;
        const hx = (hs[j * W + Math.min(nx, i + 1)] - hs[j * W + Math.max(0, i - 1)]) / (2 * sx);
        const hz = (hs[Math.min(nz, j + 1) * W + i] - hs[Math.max(0, j - 1) * W + i]) / (2 * sz);
        const sl = Math.hypot(hx, hz);
        pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z;
        const n1 = fbm(x * 0.25, z * 0.25); const n2 = fbm(x * 0.9 + 7, z * 0.9);
        tmp.copy(ROCK_D).lerp(ROCK_B, SH(0.35, 0.65, n1));
        tmp.multiplyScalar(0.82 + 0.34 * n2);
        const lowFlat = (1 - SH(3, 9, h)) * (1 - SH(0.5, 1.15, sl)) * SH(0.56, 0.7, fbm(x * 0.17 + 20, z * 0.17));
        if (lowFlat > 0.01 && h > -0.5) { const tc = tmp.clone().lerp(TUND1, 0); tc.copy(TUND1).lerp(TUND2, SH(0.3, 0.7, n1)); tmp.lerp(tc, lowFlat * 0.5); }
        if (h < 0.5 && h > -0.5) tmp.lerp(GRAV, 0.5);
        // snow: higher line on flats, streaks along the gullies, dusting on the far slopes
        const far = SH(LK.zc - 8, LK.zc - 26, z);
        const line = 12 + 4 * fbm(x * 0.05, z * 0.05 + 4) - 1.5 * far;
        const flat = 1 - SH(0.8, 1.7, sl);
        let s = SH(line - 1.5, line + 2.2, h + 1.6 * n2) * (0.04 + 0.34 * flat) * (sl > 1.4 ? 0.3 : 1);
        const st = fbm(x * 0.95, z * 0.18 + 11);
        s = Math.max(s, SH(0.62, 0.72, st) * SH(line - 3, line + 1, h) * 0.8);
        if (h < 6.5) s = 0;
        if (z > 9) s = 0;
        tmp.lerp(sl > 1.4 ? SNOW_S : SNOW, Math.min(1, s));
        const eL = lakeE(x, z);
        if (eL > 0.99 && eL < 1.08 && h > -0.6) tmp.lerp(WET, 0.7 * (1 - SH(1.02, 1.08, eL)));
        const nearK = SH(2, 8, z) * (1 - SH(35, 60, z));
        if (eL > 1.02 && nearK > 0) tmp.lerp(SCREE, nearK * 0.25 * SH(0.38, 0.55, n2));
        const dp = segD(x, z, PATH);
        if (z > 7 && h > 0.2) tmp.lerp(PATHC, (1 - SH(0.12, 0.5, dp)) * 0.55 * SH(0.4, 0.55, fbm(x * 1.7, z * 1.7)));
        // Bhairav shelf rim is rock; haze with distance
        const dcam = Math.hypot(x, z - 45);
        if (z > 12) tmp.multiplyScalar(0.5); tmp.lerp(HAZE, Math.max(SH(120, 230, dcam) * 0.72, 0));
        col[k * 3] = tmp.r; col[k * 3 + 1] = tmp.g; col[k * 3 + 2] = tmp.b;
      }
    }
    const idx = new Uint32Array(nx * nz * 6);
    let q = 0;
    for (let j = 0; j < nz; j += 1) {
      for (let i = 0; i < nx; i += 1) {
        const a = j * W + i; const b = a + 1; const c = a + W; const d = c + 1;
        if ((i + j) % 2) { idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d; } else { idx[q++] = a; idx[q++] = c; idx[q++] = d; idx[q++] = a; idx[q++] = d; idx[q++] = b; }
      }
    }
    const T = idx.length / 3;
    const fp = new Float32Array(T * 9); const fc = new Float32Array(T * 9);
    for (let t = 0; t < T; t += 1) {
      const v = [idx[t * 3], idx[t * 3 + 1], idx[t * 3 + 2]];
      const j = 0.975 + 0.05 * hash(t * 0.7, 1.9);
      const cr = (col[v[0] * 3] + col[v[1] * 3] + col[v[2] * 3]) / 3 * j;
      const cg = (col[v[0] * 3 + 1] + col[v[1] * 3 + 1] + col[v[2] * 3 + 1]) / 3 * j;
      const cb = (col[v[0] * 3 + 2] + col[v[1] * 3 + 2] + col[v[2] * 3 + 2]) / 3 * j;
      for (let k = 0; k < 3; k += 1) {
        fp[t * 9 + k * 3] = pos[v[k] * 3]; fp[t * 9 + k * 3 + 1] = pos[v[k] * 3 + 1]; fp[t * 9 + k * 3 + 2] = pos[v[k] * 3 + 2];
        fc[t * 9 + k * 3] = cr; fc[t * 9 + k * 3 + 1] = cg; fc[t * 9 + k * 3 + 2] = cb;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(fp, 3));
    g.setAttribute('color', new THREE.BufferAttribute(fc, 3));
    g.computeVertexNormals();
    return g;
  }

  /* ------------------------------------------------------------------ merged stone geometry */
  const DOD = new THREE.DodecahedronGeometry(1, 0);
  function mergeParts(parts) {
    let n = 0;
    const gs = parts.map((p) => {
      const g = DOD.clone();
      const m = new THREE.Matrix4().compose(new THREE.Vector3(...p.p), new THREE.Quaternion().setFromEuler(new THREE.Euler(p.r[0], p.r[1], p.r[2])), new THREE.Vector3(...p.s));
      g.applyMatrix4(m);
      const ng = g.toNonIndexed();
      n += ng.attributes.position.count;
      return [ng, p.c];
    });
    const pos = new Float32Array(n * 3); const col = new Float32Array(n * 3);
    let o = 0;
    gs.forEach(([g, c]) => {
      const a = g.attributes.position.array;
      for (let i = 0; i < a.length; i += 3) {
        pos[o * 3] = a[i]; pos[o * 3 + 1] = a[i + 1]; pos[o * 3 + 2] = a[i + 2];
        const vv = 0.9 + 0.2 * hash(o * 0.37, 3.3);
        col[o * 3] = c.r * vv; col[o * 3 + 1] = c.g * vv; col[o * 3 + 2] = c.b * vv; o += 1;
      }
      g.dispose();
    });
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    out.setAttribute('color', new THREE.BufferAttribute(col, 3));
    out.computeVertexNormals();
    return out;
  }
  const STONE_COLS = ['#6a6a6c', '#5b5b5f', '#7a7773', '#4f5054', '#85807a', '#666158'].map(C);
  /** a stacked-stone cairn: n flat stones, narrowing upwards. */
  function cairnParts(x, y, z, s, seed, nOver) {
    const parts = [];
    const n = nOver || 3 + Math.floor(rnd(seed, 1) * 6);
    let h = y;
    for (let i = 0; i < n; i += 1) {
      const w = s * (0.3 - i * 0.032) * (0.85 + 0.3 * rnd(seed + i, 2));
      const t = w * (0.42 + 0.2 * rnd(seed + i, 5));
      parts.push({ p: [x + (rnd(seed + i, 3) - 0.5) * w * 0.35, h + t * 0.9, z + (rnd(seed + i, 4) - 0.5) * w * 0.35], r: [0, rnd(seed + i, 6) * 6, 0], s: [w * (1 + 0.2 * rnd(seed + i, 8)), t, w], c: STONE_COLS[(seed + i) % 6] });
      h += t * 1.55;
    }
    return parts;
  }

  /* ------------------------------------------------------------------ water texture */
  const DUSKF = { on: false };
  const waterTexs = {};
  function getWaterTex(dusk) {
    const key = dusk ? 'd' : 'n';
    if (waterTexs[key]) return waterTexs[key];
    const W = 1024; const Hh = 512;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = Hh;
    const g = cv.getContext('2d');
    const bg = g.createLinearGradient(0, 0, 0, Hh);
    if (dusk) { bg.addColorStop(0, '#3a4560'); bg.addColorStop(0.45, '#2b3550'); bg.addColorStop(1, '#1a2238'); } else { bg.addColorStop(0, '#2a4a68'); bg.addColorStop(0.45, '#1b3a5a'); bg.addColorStop(1, '#10243a'); }
    g.fillStyle = bg; g.fillRect(0, 0, W, Hh);
    // mirror images of the far skyline: dark rock with white snow, fading toward the viewer
    const mirror = (colr, amp, base, seed, alpha) => {
      g.fillStyle = colr; g.globalAlpha = alpha;
      g.beginPath(); g.moveTo(0, 0);
      for (let x = 0; x <= W; x += 6) {
        const u = x / W;
        const prof = 0.25 + 0.75 * Math.abs(Math.sin(u * 7 + seed)) * (0.5 + 0.5 * vnoise(u * 9 + seed, seed));
        g.lineTo(x, base + amp * prof * (0.55 + 0.7 * vnoise(u * 24, seed + 3)));
      }
      g.lineTo(W, 0); g.closePath(); g.fill();
    };
    g.filter = 'blur(9px)';
    g.filter = 'blur(5px)';
    mirror(dusk ? '#14182a' : '#141b24', 190, 10, 1.3, 0.8);
    mirror(dusk ? '#5a4a60' : '#5f7288', 120, 0, 4.1, 0.5);
    mirror(dusk ? "#f0a89a" : "#a9bdd4", 70, 0, 7.7, dusk ? 0.55 : 0.7);
    g.filter = 'blur(14px)'; g.globalAlpha = dusk ? 0.9 : 0.22;
    const sh = g.createLinearGradient(0, 120, 0, 380);
    const sc = dusk ? '240,150,150' : '190,206,224';
    sh.addColorStop(0, `rgba(${sc},0)`); sh.addColorStop(0.5, `rgba(${sc},0.62)`); sh.addColorStop(1, `rgba(${sc},0)`);
    g.fillStyle = sh; g.fillRect(dusk ? 300 : 120, 90, dusk ? 420 : 780, 320);
    g.filter = 'none'; g.globalAlpha = 1;
    // faint ripple streaks
    for (let i = 0; i < 260; i += 1) {
      const y = rnd(i, 1) * Hh; const x = rnd(i, 2) * W; const w = 30 + rnd(i, 3) * 120;
      g.fillStyle = `rgba(210,225,240,${0.015 + 0.03 * rnd(i, 4)})`; g.fillRect(x, y, w, 1.4 + y / Hh * 1.6);
    }
    const wt = new THREE.CanvasTexture(cv);
    wt.colorSpace = THREE.SRGBColorSpace;
    wt.anisotropy = 4;
    waterTexs[key] = wt;
    return wt;
  }
  const WB = { x0: -50, x1: 50, z0: -30, z1: 30 };

  /* ------------------------------------------------------------------ Main */
  const FLAGC = ['#2f6fd0', '#f4f4f0', '#d63a2f', '#2f9a4a', '#f2c230'];
  function FlagLine({ a, b, hh = 4 }) {
    const M = useM();
    const pole = M.plain('#6b5640');
    const n = 12; const ang = Math.atan2(b[0] - a[0], b[2] - a[2]);
    const A = [a[0], a[1] + hh, a[2]]; const B = [b[0], b[1] + hh * 0.78, b[2]];
    const fm = useMemo(() => FLAGC.map((c) => new THREE.MeshStandardMaterial({ color: c, side: THREE.DoubleSide, roughness: 1 })), []);
    return (
      <group>
        <Cyl rt={0.05} rb={0.07} h={hh} p={[a[0], a[1] + hh / 2, a[2]]} m={pole} seg={5} />
        <Cyl rt={0.05} rb={0.07} h={hh * 0.78} p={[b[0], b[1] + hh * 0.39, b[2]]} m={pole} seg={5} />
        {Array.from({ length: n }, (_, i) => {
          const t = (i + 0.5) / n; const sag = Math.sin(t * Math.PI) * 0.35;
          return <mesh key={i} position={[A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t - sag - 0.28, A[2] + (B[2] - A[2]) * t]} rotation={[0, ang + Math.PI / 2, 0]} material={fm[i % 5]}><planeGeometry args={[0.42, 0.5]} /></mesh>;
        })}
      </group>
    );
  }
  function Lodge({ p, r = 0, w = 1.3, d = 0.75, h = 0.42, roof = '#7a7f85', wall = '#efece4', lit = true, sc = 1 }) {
    const M = useM();
    const wm = M.plain(wall, { roughness: 0.9 });
    const rm = M.plain(roof, { roughness: 0.45, metalness: 0.55 });
    const rise = 0.2; const half = d / 2 + 0.08;
    const L = Math.hypot(half, rise); const ang = Math.atan2(rise, half);
    const gable = useMemo(() => {
      const sh = new THREE.Shape(); sh.moveTo(-d / 2, 0); sh.lineTo(d / 2, 0); sh.lineTo(0, rise); sh.closePath();
      const g = new THREE.ExtrudeGeometry(sh, { depth: w, bevelEnabled: false }); g.translate(0, 0, -w / 2); return g;
    }, [d, w]);
    const glass = M.plain('#2a2420', { roughness: 0.6 });
    const glow = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3a2a1a', emissive: '#ffb64d', emissiveIntensity: lit ? 0.85 : 0.1, roughness: 0.6 }), [lit]);
    return (
      <group position={p} rotation={[0, r, 0]} scale={sc}>
        <Box s={[w, h, d]} p={[0, h / 2, 0]} m={wm} />
        <mesh geometry={gable} position={[0, h, 0]} rotation={[0, Math.PI / 2, 0]} material={wm} castShadow />
        <Box s={[w + 0.12, 0.03, L]} p={[0, h + rise / 2 + 0.02, half / 2]} r={[ang, 0, 0]} m={rm} />
        <Box s={[w + 0.12, 0.03, L]} p={[0, h + rise / 2 + 0.02, -half / 2]} r={[-ang, 0, 0]} m={rm} />
        <Box s={[0.17, 0.27, 0.02]} p={[w * 0.3, 0.135, d / 2 + 0.005]} m={glass} />
        <mesh position={[-w * 0.22, h * 0.58, d / 2 + 0.008]} material={glow}><boxGeometry args={[0.16, 0.13, 0.02]} /></mesh>
        <mesh position={[-w * 0.02, h * 0.58, d / 2 + 0.008]} material={glow}><boxGeometry args={[0.16, 0.13, 0.02]} /></mesh>
        <Cyl rt={0.035} rb={0.035} h={0.2} p={[w * 0.32, h + rise + 0.06, -d * 0.2]} m={glass} seg={6} />
      </group>
    );
  }
  function Pilgrim({ p, c = '#b3402e', s = 1, r = 0 }) {
    const M = useM();
    return (
      <group position={p} scale={s} rotation={[0, r, 0]}>
        <mesh position={[0, 0.1, 0]} material={M.plain(c, { roughness: 0.9 })}><capsuleGeometry args={[0.045, 0.1, 4, 8]} /></mesh>
        <mesh position={[0, 0.215, 0]} material={M.plain('#caa07c')}><sphereGeometry args={[0.035, 8, 6]} /></mesh>
      </group>
    );
  }
  function Shrine({ p }) {
    const M = useM();
    const white = M.plain('#f4f1ea', { roughness: 0.9 });
    const slate = M.plain('#6f7882', { roughness: 0.5, metalness: 0.45 });
    return (
      <group position={p}>
        <Box s={[0.62, 0.1, 0.62]} p={[0, 0.05, 0]} m={M.plain('#8d8a84', { roughness: 1 })} />
        <Box s={[0.4, 0.34, 0.4]} p={[0, 0.27, 0]} m={white} />
        <Box s={[0.14, 0.2, 0.02]} p={[0, 0.2, 0.205]} m={M.plain('#2b1d16')} />
        <Box s={[0.5, 0.025, 0.5]} p={[0, 0.455, 0]} m={white} />
        <mesh position={[0, 0.585, 0]} rotation={[0, Math.PI / 4, 0]} material={slate} castShadow><coneGeometry args={[0.42, 0.26, 4]} /></mesh>
        <mesh position={[0, 0.76, 0]} material={M.gold}><coneGeometry args={[0.03, 0.14, 8]} /></mesh>
        <group position={[0.48, 0.08, 0.28]} scale={0.26}><Trident p={[0, 0, 0]} h={2.6} /></group>
        <group position={[-0.5, 0.08, 0.3]} scale={0.2}><Trident p={[0, 0, 0]} h={2.4} /></group>
      </group>
    );
  }

  const SHRINE_P = [SHRINE_X, H(SHRINE_X, SHRINE_Z), SHRINE_Z];
  const LODGE_STYLE = [[1.5, 0.8, 0.46, '#7a7f85'], [1.2, 0.74, 0.42, '#8a5a48'], [1.6, 0.82, 0.48, '#7a7f85'], [1.3, 0.76, 0.44, '#8a5a48'], [1.5, 0.8, 0.46, '#6f757b']];
  const LODGES = LODGE_X.map((x, i) => {
    const z = LODGE_PTS[i][1];
    const [w, d, h, rc] = LODGE_STYLE[i];
    return [x, z, w, d, h, rc, i % 2 ? '#f4f1ea' : '#efece4', (i % 2 ? -0.06 : 0.05)];
  });
  const LS = 1.8;
  // three groups of flat dark slabs standing in the shallows, each carrying irregular cairns of different heights
  const SLAB_GROUPS = [[-18, 0.8, 5.6], [5, 0.78, 5.2], [24, 0.82, 4.8]];
  const SLABS = []; const CAIRNS = [];
  SLAB_GROUPS.forEach(([gx, k, sz], gi) => {
    const gz = nearShoreZ(gx, k);
    SLABS.push([gx, gz, sz, 0]);
    for (let q = 0; q < 3; q += 1) SLABS.push([gx + (rnd(gi * 10 + q, 11) - 0.5) * sz * 1.7, gz + (rnd(gi * 10 + q, 12) - 0.5) * sz * 1.0, sz * (0.35 + 0.2 * rnd(gi * 10 + q, 13)), q + 1]);
    for (let c = 0; c < 6; c += 1) {
      const tall = c === 1 || (c === 4 && gi !== 1);
      const px = gx + (rnd(gi * 20 + c, 14) - 0.5) * sz * 1.1; const pz = gz + (rnd(gi * 20 + c, 15) - 0.5) * sz * 0.8;
      CAIRNS.push([px, pz, tall ? 1.5 : 0.7 + 0.5 * rnd(gi * 20 + c, 16), tall ? 7 + (c % 2) : 3 + Math.floor(rnd(gi * 20 + c, 17) * 4), gi * 20 + c]);
    }
  });
  // a few lone cairns on small rocks
  [[-30, 0.85], [-9, 0.88], [14, 0.9], [33, 0.86]].forEach(([x, k], i) => { SLABS.push([x + 0.7 * (i - 1), nearShoreZ(x, k), 1.4, 5]); CAIRNS.push([x + 0.7 * (i - 1), nearShoreZ(x, k), 0.8 + 0.3 * (i % 2), 3 + i, 90 + i]); });

  function GosaiMain() {
    const M = useM();
    const wtex = useMemo(() => getWaterTex(false), []);
    const wtexD = useMemo(() => getWaterTex(true), []);
    const wref = useRef();
    useEffect(() => {
      const m = wref.current; if (!m) return undefined;
      let last = '';
      m.onBeforeRender = (r, scene) => {
        const bg = scene.background; const dusk = DUSKF.on || (bg && bg.isColor ? bg.r < 0.5 : false);
        const key = dusk ? 'd' : 'n';
        if (key === last) return;
        last = key; const mt = m.material;
        mt.map = dusk ? wtexD : wtex; mt.color.set(dusk ? "#6f86a8" : "#b9c6d6"); mt.envMapIntensity = dusk ? 0.05 : 0.6;
        mt.emissive.set(dusk ? "#2b3a52" : "#000000"); mt.emissiveIntensity = dusk ? 0.4 : 0; mt.needsUpdate = true;
      };
      return () => { m.onBeforeRender = () => {}; };
    }, [wtex, wtexD]);
    const lakeGeo = useMemo(() => {
      const N = 120; const pts = [];
      for (let i = 0; i < N; i += 1) pts.push(shorePoint((i / N) * Math.PI * 2, 1.0));
      const pos = []; const uv = [];
      const put = (x, z) => { pos.push(x, 0, z); uv.push((x - WB.x0) / (WB.x1 - WB.x0), (WB.z1 - z) / (WB.z1 - WB.z0)); };
      for (let i = 0; i < N; i += 1) {
        const a = pts[i]; const b = pts[(i + 1) % N];
        put(LK.zc * 0 + 0, LK.zc); put(b[0], b[1]); put(a[0], a[1]);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.computeVertexNormals();
      return g;
    }, []);
    const stoneGeo = useMemo(() => {
      const parts = [];
      const DARK = [C('#34353a'), C('#3e3f45'), C('#46464b'), C('#3a3b40')];
      SLABS.forEach(([x, z, sz], i) => {
        parts.push({ p: [x, -0.06, z], r: [0, rnd(i, 1) * 6, 0], s: [sz * 0.55, 0.26, sz * 0.4], c: DARK[i % 4] });
        parts.push({ p: [x + sz * 0.2, -0.02, z - sz * 0.1], r: [0, rnd(i, 2) * 6, 0], s: [sz * 0.34, 0.2, sz * 0.28], c: DARK[(i + 1) % 4] });
      });
      CAIRNS.forEach(([x, z, s, n, sd]) => { cairnParts(x, 0.12, z, s * 2.6, sd, n).forEach((q) => parts.push(q)); });
      // the venerated boulder at the middle of the lake ("Shiva resting")
      parts.push({ p: [-2.2, 0.1, -3.2], r: [0.05, 0.4, 0.04], s: [2.5, 0.75, 1.35], c: C('#4c4d52') });
      parts.push({ p: [-1.0, 0.45, -3.0], r: [0.1, 1.0, 0.1], s: [1.2, 0.55, 0.9], c: C('#5a5a5f') });
      parts.push({ p: [-1.1, 0.88, -3.0], r: [0.1, 1.0, 0.1], s: [0.7, 0.16, 0.55], c: C('#e9eff6') });
      parts.push({ p: [-3.4, 0.0, -3.3], r: [0, 0.2, 0], s: [0.9, 0.35, 0.7], c: C('#505156') });
      return mergeParts(parts);
    }, []);
    const stoneMat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95 }), []);
    return (
      <group>
        <mesh ref={wref} geometry={lakeGeo} position={[0, 0.0, 0]} receiveShadow>
          <meshStandardMaterial map={wtex} color="#b9c6d6" roughness={0.18} metalness={0.2} envMapIntensity={0.6} />
        </mesh>
        <mesh geometry={stoneGeo} material={stoneMat} castShadow receiveShadow />
        {LODGES.map(([x, z, w, d, h, rc, wc, ry], i) => <Lodge key={i} r={ry} p={[x, H(x, z) - 0.04, z]} w={w} d={d} h={h} roof={rc} wall={wc} sc={LS} />)}
        <group position={SHRINE_P} scale={3.5}><Shrine p={[0, 0, 0]} /></group>
        <FlagLine a={[SHRINE_X - 4.2, SHRINE_P[1], SHRINE_Z + 0.8]} b={[SHRINE_X + 0.4, SHRINE_P[1], SHRINE_Z - 0.4]} hh={4.2} />
        <FlagLine a={[SHRINE_X + 0.4, SHRINE_P[1], SHRINE_Z - 0.4]} b={[SHRINE_X + 5, SHRINE_P[1], SHRINE_Z + 1.2]} hh={4} />
        <Pilgrim p={[SHRINE_X - 3.4, SHRINE_P[1] + 0.02, SHRINE_Z + 3.2]} c="#b3402e" s={3.4} r={0.4} />
        <Pilgrim p={[SHRINE_X + 2.6, SHRINE_P[1] + 0.02, SHRINE_Z + 3.6]} c="#2e5a8a" s={3.2} r={-0.5} />
        <Pilgrim p={[SHRINE_X + 4.4, SHRINE_P[1] + 0.02, SHRINE_Z + 2.4]} c="#d08a2a" s={3.4} r={2.4} />
        <Frame s={[50, 5, 24]} p={[0, 0.3, 1]} />
      </group>
    );
  }

  /* ------------------------------------------------------------------ Env */
  const SKY_DAY = [[0, '#2a58b0'], [0.3, '#3f78c8'], [0.46, '#9cc4ec'], [0.5, '#d7e8f7'], [1, '#d7e8f7']];
  const SKY_DUSK = [[0, '#241a4a'], [0.3, '#4a3a86'], [0.45, '#c77a8e'], [0.5, '#f6b27a'], [1, '#f6b27a']];
  function skyTex(stops) {
    const cv = document.createElement('canvas'); cv.width = 4; cv.height = 256;
    const g = cv.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 256);
    stops.forEach(([o, c]) => gr.addColorStop(o, c));
    g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  }

  function Sky() {
    const ref = useRef(); const cloudRef = useRef();
    const tex = useMemo(() => ({ day: skyTex(SKY_DAY), dusk: skyTex(SKY_DUSK) }), []);
    const cloudGeo = useMemo(() => {
      const parts = [];
      const clusters = [[-120, 62, -190, 34], [-20, 48, -200, 40], [100, 70, -185, 38], [10, 105, -150, 30], [-150, 100, -110, 26], [160, 92, -120, 28], [60, 46, -215, 30]];
      const sph = new THREE.SphereGeometry(1, 12, 8);
      const gs = [];
      clusters.forEach(([cx, cy, cz, r], ci) => {
        for (let k = 0; k < 8; k += 1) {
          const rr = r * (0.35 + 0.4 * rnd(ci * 9 + k, 1));
          const m = new THREE.Matrix4().compose(
            new THREE.Vector3(cx + (rnd(ci * 9 + k, 2) - 0.5) * r * 2.2, cy + rnd(ci * 9 + k, 3) * r * 0.55, cz + (rnd(ci * 9 + k, 4) - 0.5) * r * 0.8),
            new THREE.Quaternion(), new THREE.Vector3(rr * 1.3, rr * 0.62, rr * 0.7));
          const g = sph.clone().applyMatrix4(m); gs.push(g);
        }
      });
      let n = 0; gs.forEach((g) => { n += g.attributes.position.count; });
      const pos = new Float32Array(n * 3); const nor = new Float32Array(n * 3); const idx = [];
      let o = 0;
      gs.forEach((g) => {
        const a = g.attributes.position.array; const nn = g.attributes.normal.array; const ix = g.index.array;
        const base = o;
        for (let i = 0; i < a.length; i += 3) { pos.set([a[i], a[i + 1], a[i + 2]], o * 3); nor.set([nn[i], nn[i + 1], nn[i + 2]], o * 3); o += 1; }
        for (let i = 0; i < ix.length; i += 1) idx.push(ix[i] + base);
      });
      const out = new THREE.BufferGeometry();
      out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      out.setIndex(idx);
      return out;
    }, []);
    useEffect(() => {
      const m = ref.current; const cm = cloudRef.current;
      if (!m) return undefined;
      let last = '';
      m.onBeforeRender = (r, scene) => {
        const bg = scene.background;
        const dusk = bg && bg.isColor ? bg.r < 0.5 : false; DUSKF.on = dusk;
        const key = dusk ? 'dusk' : 'day';
        if (key !== last) {
          last = key;
          m.material.map = tex[key]; m.material.needsUpdate = true;
          if (cm) { cm.material.color.set(dusk ? '#f0b4a8' : '#ffffff'); cm.material.emissive.set(dusk ? '#7a4a58' : '#dfe9f5'); }
        }
      };
      return () => { m.onBeforeRender = () => {}; };
    }, [tex]);
    return (
      <group>
        <mesh ref={ref} renderOrder={-10}>
          <sphereGeometry args={[480, 24, 16]} />
          <meshBasicMaterial map={tex.day} side={THREE.BackSide} fog={false} depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh ref={cloudRef} geometry={cloudGeo}>
          <meshStandardMaterial color="#ffffff" emissive="#dfe9f5" emissiveIntensity={0.55} roughness={1} fog={false} />
        </mesh>
      </group>
    );
  }

  function GosaiEnv() {
    const terr = useMemo(() => buildTerrain(), []);
    const terrMat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.96, metalness: 0, fog: false }), []);
    const rocks = useMemo(() => {
      const parts = [];
      const clear = (x, z) => LODGES.some(([lx, lz]) => Math.hypot(x - lx, z - lz) < 3.4) || Math.hypot(x - SHRINE_X, z - SHRINE_Z) < 8 || segD(x, z, PATH) < 0.9;
      for (let k = 0; k < 150; k += 1) {
        const x = (rnd(k, 1) - 0.5) * 100; const z = -30 + rnd(k, 2) * 80;
        const e = lakeE(x, z);
        if (e < 1.03 || clear(x, z)) continue;
        const near = SH(2.2, 1.04, e);
        const sz = (0.14 + rnd(k, 3) * rnd(k, 4) * 0.7) * (1 + near * 0.8) * (1 + SH(-5, -30, z) * 1.2);
        const h = H(x, z);
        const snowy = h > 7 && rnd(k, 5) < 0.5;
        parts.push({ p: [x, h + sz * 0.02, z], r: [rnd(k, 6) * 0.5, rnd(k, 7) * 6, rnd(k, 8) * 0.5], s: [sz, sz * (0.5 + 0.4 * rnd(k, 9)), sz * (0.7 + 0.4 * rnd(k, 10))], c: STONE_COLS[k % 6] });
        if (snowy && sz > 0.35) parts.push({ p: [x, h + sz * 0.46, z], r: [0, rnd(k, 7) * 6, 0], s: [sz * 0.7, sz * 0.2, sz * 0.55], c: C('#eef3f9') });
      }
      // boulder-strewn scree ring around the shore
      for (let k = 0; k < 170; k += 1) {
        const t = rnd(k, 21) * Math.PI * 2; const kk = 1.03 + 0.3 * rnd(k, 22) * rnd(k, 23);
        const [x, z] = shorePoint(t, kk);
        if (clear(x, z)) continue;
        const h = H(x, z); const sz = 0.18 + 0.75 * rnd(k, 24) * rnd(k, 25);
        parts.push({ p: [x, h + sz * 0.05, z], r: [rnd(k, 6) * 0.5, rnd(k, 7) * 6, rnd(k, 8) * 0.5], s: [sz, sz * (0.5 + 0.4 * rnd(k, 9)), sz * (0.7 + 0.4 * rnd(k, 10))], c: STONE_COLS[(k + 1) % 6] });
      }
      // dark rocks ringing Bhairav Kunda, some with a snow cap
      for (let k = 0; k < 16; k += 1) {
        const ang = (k / 16) * Math.PI * 2 + rnd(k, 31) * 0.3; const rr = 1.15 + 0.35 * rnd(k, 32);
        const x = BH.x + Math.cos(ang) * BH.rx * rr; const z = BH.z + Math.sin(ang) * BH.rz * rr;
        const h = H(x, z); const sz = 0.3 + 0.5 * rnd(k, 33);
        const rt = [rnd(k, 6) * 0.5, rnd(k, 7) * 6, rnd(k, 8) * 0.5];
        parts.push({ p: [x, h + sz * 0.1, z], r: rt, s: [sz * 1.3, sz * (0.5 + 0.5 * rnd(k, 34)), sz * 0.8], c: STONE_COLS[k % 4 + 1] });
        if (k % 3 === 0) parts.push({ p: [x, h + sz * 0.45, z], r: rt, s: [sz * 0.8, sz * 0.16, sz * 0.55], c: C('#e9eff6') });
      }
      // a few shore cairns on the rocks
      [0.5, 1.2, 2.0, 2.7, 3.5, 4.3, 5.4].forEach((t, i) => {
        const [x, z] = shorePoint(t, 1.05);
        if (clear(x, z) || lakeE(x, z) < 1.02) return;
        const h = H(x, z);
        parts.push({ p: [x, h + 0.08, z], r: [0, i, 0], s: [0.9, 0.25, 0.7], c: STONE_COLS[i % 6] });
        cairnParts(x, h + 0.2, z, 2.2, 90 + i).forEach((q) => parts.push(q));
      });
      return mergeParts(parts);
    }, []);
    const rockMat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95 }), []);
    const bhW = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1c3f6e', roughness: 0.2, metalness: 0.3, fog: false }), []);
    return (
      <group>
        <Sky />
        <mesh geometry={terr} material={terrMat} receiveShadow />
        <mesh geometry={rocks} material={rockMat} castShadow receiveShadow />
        {/* Bhairav Kunda: the small deep-blue lake in its rock notch, far beyond */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[BH.x, BH.S, BH.z]} scale={[BH.rx * 0.95, BH.rz * 1.0, 1]} material={bhW}><circleGeometry args={[1, 28]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 8]} receiveShadow visible={false}><planeGeometry args={[1, 1]} /></mesh>
      </group>
    );
  }

  return { gosaikunda: { Main: GosaiMain, Env: GosaiEnv } };
}
