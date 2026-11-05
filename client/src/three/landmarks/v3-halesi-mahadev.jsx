// Halesi Mahadev (Halesi-Maratika Caves), Khotang. A natural limestone cave, not a built temple: a ragged grey rock crag
// with a dark half-moon mouth (low overhanging slab on the upper left, sheer buttress on the right), a white-railed
// red-brown stair coming down from the dusty courtyard on the left to a concrete platform with white parapets and small
// shrines at the lip, a dark chamber with a small pink-red lingam, a skylight hole in the roof with foliage and a flag line.
// Around it: a red-orange 3-storey Tibetan monastery on the wooded slope behind, terraced hillside, blue-roofed brick-red
// village houses, the outer courtyard with a cream tiered shrine and big trees, hazy ridges beyond. No river.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Frame, Diyo, THREE, useMemo, useRef, useEffect } = K;
  const PI = Math.PI;

  /* ---------- maths helpers ---------- */
  const S = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const h2 = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };
  const vn = (x, y) => {
    const i = Math.floor(x); const j = Math.floor(y); const fx = x - i; const fy = y - j;
    const u = fx * fx * (3 - 2 * fx); const v = fy * fy * (3 - 2 * fy);
    return h2(i, j) * (1 - u) * (1 - v) + h2(i + 1, j) * u * (1 - v) + h2(i, j + 1) * (1 - u) * v + h2(i + 1, j + 1) * u * v;
  };
  const fbm = (x, y) => vn(x, y) * 0.6 + vn(x * 2.1 + 5, y * 2.1 + 9) * 0.28 + vn(x * 4.3 + 11, y * 4.3 + 3) * 0.12;

  /* ---------- the hillside: one height function shared by the terrain, houses, trees and stairs ---------- */
  const SX0 = -10; const SXL0 = -6.2; const SXL1 = -4.6; const SX1 = -0.6; const SY0 = 4.2; const YL = 1.4; const SY1 = -1.5; const SZ = 3.2; // two flights with a landing, down into the pit
  const FL = -1.5; const PITY = -1.75; // pit floor
  const stairY = (x) => (x < SXL0 ? SY0 - (SY0 - YL) * ((x - SX0) / (SXL0 - SX0)) : x < SXL1 ? YL : Math.max(SY1, YL - (YL - SY1) * ((x - SXL1) / (SX1 - SXL1))));
  const terr = (x, z) => {
    const r = Math.hypot(x, z);
    const left = 4.2 * S(-4.5, -9.5, x) + Math.min(5, 0.3 * Math.max(0, -x - 26));
    const back = 11 * S(-13, -30, z);
    let h = Math.max(left, back) - 6 * S(10, 40, x) - 3 * S(14, 40, z);
    h += (fbm(x * 0.09, z * 0.09) - 0.5) * 3.2 * S(14, 30, r);
    const q = h / 1.3; const fl = Math.floor(q);
    const tw = S(17, 28, r) * 0.9;
    h = h * (1 - tw) + (fl + S(0, 0.4, q - fl)) * 1.3 * tw;
    const pit = S(-6.9, -5.9, x) * S(8.9, 7.9, x) * S(-11, -9, z) * S(6.7, 5.9, z);
    h = h * (1 - pit) + PITY * pit;
    // the stair trench
    const sw = (1 - S(1.5, 2.7, Math.abs(z - SZ))) * S(SX0 - 0.8, SX0 + 0.5, x) * S(SX1 + 0.6, SX1 - 0.4, x);
    if (sw > 0) h = h * (1 - sw) + Math.min(h, stairY(Math.min(SX1, Math.max(SX0, x))) - 0.35) * sw;
    return h * (1 - S(46, 62, r)) - 3 * S(46, 62, r);
  };

  /* ---------- the rock crag: one sheet that rises up the face, over the crown and down the back ---------- */
  const NX = 96; const XMIN = -16; const XMAX = 16; const NY = 60; const NT = 26; const NB = 10;
  const Ht = (x) => (10.0 + (vn(x * 0.28, 7) - 0.5) * 2.2 + 1.6 * S(4, 8, x)) * (x >= 0 ? 1 - S(6.8, 9.2, x) : 1 - S(6.5, 13, -x)) - 0.5 * S(10, 16, Math.abs(x));
  const JUT = [[-5.5, 6.4, 2.6, 0.9, 2.3], [-2.2, 7.0, 2.8, 1.0, 1.8], [1.6, 8.2, 2.6, 0.9, 1.5], [-8.8, 5.4, 2.2, 0.9, 2.0]];
  const CRACK = [-9.8, -7.6, -5.0, -1.8, 2.4, 5.6, 6.9, 8.1, 9.4, 10.8];
  const zf = (x, y) => {
    const rb = S(4.5, 6, x);
    let z = -0.022 * x * x;
    z += 2.2 * S(-1, -8, x) * (1 - S(-12, -16, x)) * S(4.0, 6.5, y) * (1 - S(8.5, 10.8, y)); // the overhanging slab, upper left
    JUT.forEach(([x0, y0, w, hh, dz]) => { z += dz * S(x0 - w / 2 - 0.4, x0 - w / 2 + 0.4, x) * S(x0 + w / 2 + 0.4, x0 + w / 2 - 0.4, x) * S(y0 - hh / 2 - 0.5, y0 - hh / 2 + 0.3, y) * S(y0 + hh / 2 + 0.5, y0 + hh / 2 - 0.3, y); });
    CRACK.forEach((xc) => { z -= 0.6 * Math.exp(-(((x - xc) / 0.3) ** 2)) * S(2, 5, y); });
    z += 0.9 * rb * S(0.5, 2.5, y) * (1 - S(11, 13, x)); // the sheer buttress, right
    z += rb * S(1, 3, y) * ((((y * 0.62 + vn(x * 0.5, 5) * 3) % 1) - 0.5) * 1.3 + (vn(x * 2.4 + 7, y * 1.1) - 0.5) * 1.5 + (vn(x * 5.5, y * 2.6 + 3) - 0.5) * 0.7);
    const nz = ((fbm(x * 0.5, y * 0.5) - 0.5) * 2.3 + (vn(x * 2.2 + 1, y * 2.2) - 0.5) * 0.35 + (vn(x * 1.6, 0.5) - 0.5) * 0.9 + (vn(x * 3.3, y * 1.6) - 0.5) * 0.3 + (vn(x * 4.1, y * 1.1 + 3) - 0.5) * 0.35 * S(3, 7, x) + (vn(x * 7, y * 7) - 0.5) * 0.25) * (1 - 0.05 * rb);
    const led = (((y * 0.5 + vn(x * 0.7, 2) * 2.5) % 1) - 0.5) * 1.1 * rb * S(0.5, 3, y);
    return z + nz + led;
  };
  const inMouth = (x, y) => {
    const ry = 4.6 + 2.2 * S(-3.5, 2, x);
    const u = (x - 0.3) / 7.2; const v = Math.max(y, 0) / ry;
    return u * u + v * v < 1 + (vn(x * 2.3 + 4, y * 2.3) - 0.5) * 0.45;
  };
  const SKY = [-2.6, -7.4]; // skylight centre (x, z)
  const inSky = (x, z) => {
    const u = (x - SKY[0]) / 2.8; const v = (z - SKY[1]) / 2.1;
    return u * u + v * v < 1 + (vn(x * 2.1 + 2, z * 2.1) - 0.5) * 0.5;
  };
  const colAt = (c) => XMIN + (c * (XMAX - XMIN)) / NX;
  const crownY = (x, tt) => Ht(x) + (fbm(x * 0.35, tt * 4) - 0.5) * 1.4 * (1 - S(8, 15, Math.abs(x))) - 0.4 * S(10, 16, Math.abs(x)) + 0.8 * Math.sin(PI * tt) * (1 - S(6, 14, Math.abs(x)));
  const topAt = (x, z) => {
    const zt = zf(x, Ht(x)); const tt = Math.min(1, Math.max(0.02, (zt - z) / 14));
    return crownY(x, tt);
  };

  function buildCrag() {
    const cols = NX + 1;
    const R = NY + NT + NB + 1;
    const xs = new Float32Array(cols * R); const ys = new Float32Array(cols * R); const zs = new Float32Array(cols * R);
    const kind = new Uint8Array(cols * R);
    for (let c = 0; c < cols; c += 1) {
      const x = colAt(c); const Hh = Ht(x);
      let r = 0; let zTop = 0;
      for (; r <= NY; r += 1) {
        const y = -1.5 + ((Hh + 1.5) * r) / NY; const z = zf(x, y);
        const i = r * cols + c; xs[i] = x; ys[i] = y; zs[i] = z; kind[i] = 0; zTop = z;
      }
      let yEnd = 0; let zEnd = 0;
      for (let t = 1; t <= NT; t += 1) {
        const tt = t / NT; const i = (NY + t) * cols + c;
        xs[i] = x; zs[i] = zTop - 14 * tt; ys[i] = crownY(x, tt); kind[i] = 1; yEnd = ys[i]; zEnd = zs[i];
      }
      for (let b = 1; b <= NB; b += 1) {
        const bb = b / NB; const i = (NY + NT + b) * cols + c;
        xs[i] = x; zs[i] = zEnd - 1.5 * bb; ys[i] = yEnd * (1 - bb) - 0.3 * bb; kind[i] = 2;
      }
    }
    for (let i = 0; i < cols * R; i += 1) {
      if (kind[i] === 0 && xs[i] > 5) { const k = S(5, 8, xs[i]); xs[i] += (fbm(ys[i] * 0.9 + 3, zs[i] * 0.9) - 0.5) * 2.5 * k; zs[i] += (vn(ys[i] * 1.7, xs[i] * 1.3) - 0.5) * 1.5 * k; }
    }
    const pos = new Float32Array(cols * R * 3); const uv = new Float32Array(cols * R * 2); const col = new Float32Array(cols * R * 3);
    const tmp = new THREE.Color();
    for (let i = 0; i < cols * R; i += 1) {
      const x = xs[i]; const y = ys[i]; const z = zs[i];
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
      uv[i * 2] = x * 0.09; uv[i * 2 + 1] = (y - z) * 0.09;
      const n = Math.min(1, Math.max(0, (fbm(x * 0.7, (y + z) * 0.7) - 0.12) / 0.7));
      const fine = vn(x * 6, (y + z) * 6);
      let l = 0.55 + n * 0.45 - (vn(x * 2.6, 3.1) * 0.5 + vn(x * 5.5, y * 0.4) * 0.25) * 0.12;
      if (fine > 0.78) l *= 0.85; // pits
      if (x > 4) l *= 0.7 + 0.6 * vn(x * 2.2 + 4, y * 2.4 + z);
      if (x > 4) l *= 1 - 0.38 * S(0.5, 0.8, vn(x * 3.5, y * 0.22 + 2)); // dark vertical streaks
      CRACK.forEach((xc) => { l *= 1 - 0.6 * Math.exp(-(((x - xc) / 0.3) ** 2)) * S(2, 5, y); });
      const dm = Math.hypot((x - 0.3) / 7.2, Math.max(y, 0) / 6.2);
      if (kind[i] === 0 && dm < 1.6) l *= 0.38 + 0.62 * S(1, 1.6, dm);
      if (kind[i] === 0 && y > 4 && y < 10 && x < -0.5 && x > -12) l *= 0.82; // shadowed ceiling
      tmp.set('#7d7a70'); tmp.multiplyScalar(l * 1.05);
      const lich = S(0.58, 0.72, vn(x * 1.1 + 3, (y + z) * 1.1 + 1)) * (kind[i] === 0 ? (x > 4 ? 0.85 : 0.7) : 0.2);
      if (dm > 1.15) tmp.lerp(new THREE.Color('#b9b8a8').multiplyScalar(0.8 + 0.2 * l), lich);
      let r = tmp.r; let g = tmp.g; let b = tmp.b;
      if (kind[i] === 1) { const green = fbm(x * 0.4 + 9, z * 0.4) > 0.55 ? 0.3 : 0.06; r = r * (1 - green) + 0.3 * green; g = g * (1 - green) + 0.38 * green; b = b * (1 - green) + 0.18 * green; }
      if (kind[i] === 2) { r *= 0.8; g *= 0.8; b *= 0.8; }
      col[i * 3] = r; col[i * 3 + 1] = g; col[i * 3 + 2] = b;
    }
    const idx = [];
    for (let r = 0; r < R - 1; r += 1) {
      for (let c = 0; c < cols - 1; c += 1) {
        const a = r * cols + c; const b = a + 1; const d = a + cols; const e = d + 1;
        const xm = (xs[a] + xs[b]) / 2; const ym = (ys[a] + ys[e]) / 2; const zm = (zs[a] + zs[e]) / 2;
        if (r < NY && inMouth(xm, ym) && zm > -3) continue;
        if (r >= NY && r < NY + NT && inSky(xm, zm)) continue;
        idx.push(a, b, d, b, e, d);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  /* the dark chamber behind the mouth */
  function buildTunnel() {
    const NZ = 20; const NA = 30;
    const pos = []; const col = []; const idx = [];
    for (let k = 0; k <= NZ; k += 1) {
      const u = k / NZ; const z = -0.5 - 10.4 * u;
      const f = (1 - 0.22 * u) * (u < 0.72 ? 1 : Math.sqrt(Math.max(0.02, 1 - ((u - 0.72) / 0.28) ** 2)));
      const cx = 0.3 + 0.9 * Math.sin(u * 2.2);
      for (let i = 0; i <= NA; i += 1) {
        const th = (PI * i) / NA;
        const rx = 7.4 * f * (1 + 0.28 * (vn(i * 0.5 + u * 3, u * 2 + 5) - 0.5));
        const ry = 7.9 * f * (1 + 0.32 * (vn(i * 0.45, u * 3 + 9) - 0.5));
        pos.push(cx + rx * Math.cos(th), ry * Math.sin(th), z);
        const l = (0.15 - 0.09 * u) * (0.8 + 0.4 * vn(i * 0.9, u * 4));
        col.push(l * 1.05, l * 0.95, l * 0.82);
      }
    }
    for (let k = 0; k < NZ; k += 1) {
      for (let i = 0; i < NA; i += 1) {
        const a = k * (NA + 1) + i; const b = a + 1; const d = a + NA + 1; const e = d + 1;
        idx.push(a, d, b, b, d, e);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  /* ---------- hillside terrain ---------- */
  function Terrain() {
    const M = useM();
    const geo = useMemo(() => {
      const SZE = 124; const N = 90; const st = SZE / N;
      const pos = []; const col = []; const idx = []; const c = new THREE.Color();
      for (let j = 0; j <= N; j += 1) {
        for (let i = 0; i <= N; i += 1) {
          const x = -SZE / 2 + i * st; const z = -SZE / 2 + j * st;
          const y = terr(x, z);
          pos.push(x, y, z);
          const r = Math.hypot(x, z);
          const q = Math.max(0, y) / 1.3; const fi = Math.floor(q);
          const pick = h2(fi, 7);
          c.set(pick < 0.35 ? '#8a9a58' : pick < 0.7 ? '#7c8c4e' : '#8f9556');
          const forest = S(14, 26, r) * 0.7 + S(0, -12, z) * 0.3;
          c.lerp(new THREE.Color('#5f7040'), forest * (0.5 + 0.5 * vn(x * 0.15, z * 0.15)));
          if (r > 17) { const fr = q - fi; if (fr < 0.45 && y > 0.5) c.lerp(new THREE.Color('#9a9182'), 0.7 * S(17, 24, r)); }
          c.lerp(new THREE.Color('#c9b48c'), 0.5 * S(8, 4, Math.abs(x - 1)) * S(13, 9, z) * S(-14, -8, z)); // dusty ground at the cave
          c.lerp(new THREE.Color('#cdb792'), 0.6 * S(-9, -12, x) * S(-30, -27, x) * S(-9, -6, z) * S(17, 14, z)); // the courtyard
          c.multiplyScalar(0.88 + 0.2 * vn(x * 0.6, z * 0.6));
          col.push(c.r, c.g, c.b);
        }
      }
      for (let j = 0; j < N; j += 1) {
        for (let i = 0; i < N; i += 1) {
          const a = j * (N + 1) + i; const b = a + 1; const d = a + N + 1; const e = d + 1;
          idx.push(a, d, b, b, d, e);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.setIndex(idx);
      g.computeVertexNormals();
      return g;
    }, []);
    return <mesh geometry={geo} material={M.plain('#ffffff', { roughness: 1, vertexColors: true })} receiveShadow castShadow />;
  }

  function Ridge({ r, base = -8, hmin, hmax, color, seed = 0 }) {
    const M = useM();
    const geo = useMemo(() => {
      const N = 90; const pos = []; const idx = [];
      for (let i = 0; i <= N; i += 1) {
        const a = (i / N) * 2 * PI; const hh = hmin + (hmax - hmin) * fbm(Math.cos(a) * 2.2 + seed, Math.sin(a) * 2.2 + seed);
        pos.push(Math.sin(a) * r, base, Math.cos(a) * r, Math.sin(a) * (r - 6), hh, Math.cos(a) * (r - 6));
      }
      for (let i = 0; i < N; i += 1) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setIndex(idx); g.computeVertexNormals();
      return g;
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    return <mesh geometry={geo} material={M.plain(color, { roughness: 1, side: THREE.DoubleSide })} />;
  }

  /* ---------- flags ---------- */
  const FLAGC = ['#2f6db5', '#f2efe6', '#c0392b', '#2e8b57', '#e2b33c'];
  function FlagLine({ a, b, sag = 0.8, n = 14 }) {
    const M = useM();
    const g = useMemo(() => {
      const pos = []; const col = []; const idx = []; const tmp = new THREE.Color();
      const pt = (t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - Math.sin(PI * t) * sag, a[2] + (b[2] - a[2]) * t];
      const dx = b[0] - a[0]; const dz = b[2] - a[2]; const hl = Math.hypot(dx, dz) || 1;
      const L = Math.hypot(dx, dz, b[1] - a[1]);
      const wd = (L / n) * 0.62; const ux = (dx / hl) * wd; const uz = (dz / hl) * wd;
      for (let i = 0; i < n; i += 1) {
        const p = pt((i + 0.5) / n); const o = i * 4;
        pos.push(p[0], p[1], p[2], p[0] + ux, p[1], p[2] + uz, p[0] + ux, p[1] - 0.34, p[2] + uz, p[0], p[1] - 0.34, p[2]);
        tmp.set(FLAGC[i % 5]);
        for (let k = 0; k < 4; k += 1) col.push(tmp.r, tmp.g, tmp.b);
        idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
      }
      const fg = new THREE.BufferGeometry();
      fg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      fg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      fg.setIndex(idx); fg.computeVertexNormals();
      const curve = new THREE.CatmullRomCurve3(Array.from({ length: 10 }, (_, i) => new THREE.Vector3(...pt(i / 9))));
      return { fg, str: new THREE.TubeGeometry(curve, 24, 0.014, 4, false) };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    return (
      <group>
        <mesh geometry={g.fg} castShadow><meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={1} /></mesh>
        <mesh geometry={g.str} material={M.plain('#d9d2c0')} />
      </group>
    );
  }

  /* ---------- trees (instanced) ---------- */
  const LEAF = ['#6a7a48', '#76824a', '#5c6c40', '#8a8a52', '#80804a', '#a0683a', '#667448'];
  function Trees({ list }) {
    const M = useM();
    const refC = useRef(); const refT = useRef();
    const gC = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);
    const gT = useMemo(() => new THREE.CylinderGeometry(0.07, 0.13, 1, 6), []);
    useEffect(() => {
      const d = new THREE.Object3D(); const col = new THREE.Color(); let n = 0;
      const blobs = [[0, 1.65, 0, 1.0], [0.55, 1.3, 0.25, 0.7], [-0.5, 1.4, -0.2, 0.75]];
      list.forEach(([x, y, z, s, ci], i) => {
        blobs.forEach(([bx, by, bz, br], j) => {
          d.position.set(x + bx * s, y + by * s, z + bz * s); d.scale.set(br * s * 1.15, br * s * 0.85, br * s * 1.15); d.rotation.set(0, i + j, 0); d.updateMatrix();
          refC.current.setMatrixAt(n, d.matrix);
          col.set(LEAF[ci % LEAF.length]).offsetHSL(0, 0, (h2(i, j) - 0.5) * 0.08); refC.current.setColorAt(n, col); n += 1;
        });
        d.position.set(x, y + 0.7 * s, z); d.scale.set(s, 1.5 * s, s); d.rotation.set(0, 0, 0); d.updateMatrix();
        refT.current.setMatrixAt(i, d.matrix);
      });
      refC.current.instanceMatrix.needsUpdate = true; refT.current.instanceMatrix.needsUpdate = true;
      if (refC.current.instanceColor) refC.current.instanceColor.needsUpdate = true;
    }, [list]);
    return (
      <group>
        <instancedMesh ref={refC} args={[gC, M.plain('#ffffff', { roughness: 1, flatShading: true }), list.length * 3]} castShadow receiveShadow frustumCulled={false} />
        <instancedMesh ref={refT} args={[gT, M.plain('#5a4030'), list.length]} castShadow frustumCulled={false} />
      </group>
    );
  }
  function BareTree({ p, s = 1 }) {
    const M = useM();
    const m = M.plain('#6a5a4a');
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.07} rb={0.13} h={2.4} p={[0, 1.2, 0]} m={m} seg={6} />
        {[[0.5, 2.3, 0, -0.7], [-0.5, 2.5, 0.1, 0.7], [0.1, 2.9, 0.4, 0.25], [-0.2, 3.1, -0.3, -0.3]].map(([x, y, z, rz], i) => (
          <Cyl key={i} rt={0.025} rb={0.06} h={1.5} p={[x, y, z]} r={[0.2 * i, 0, rz]} m={m} seg={5} />
        ))}
      </group>
    );
  }

  /* ---------- people (scale) ---------- */
  function Person({ p, c = '#c0392b', r = 0 }) {
    const M = useM();
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Cyl rt={0.1} rb={0.13} h={0.5} p={[0, 0.3, 0]} m={M.plain(c)} seg={7} />
        <Ball rad={0.085} p={[0, 0.64, 0]} m={M.plain('#c99a76')} />
      </group>
    );
  }

  /* ---------- village house: brick-red concrete block, blue tin roof ---------- */
  const WALLS = ['#f0b79c', '#e8a98a', '#d99a80', '#f2c9b0', '#e6b08e'];
  function Home({ x, z, w = 3, d = 3.3, fl = 3, rot = 0, wi = 0, roof = '#2a62b8', cream = false, k = 1.2 }) {
    const M = useM();
    const y = Math.min(terr(x, z), terr(x + w / 2, z + d / 2), terr(x - w / 2, z - d / 2), terr(x + w / 2, z - d / 2), terr(x - w / 2, z + d / 2));
    const H = fl * 1.25;
    const wall = cream ? M.plain('#e5d3b6', { roughness: 0.9 }) : M.mat('brick', Math.max(1, w / 2), fl * 0.7, { color: WALLS[wi % WALLS.length] });
    const win = M.plain('#26364a', { roughness: 0.4, emissive: '#ffb55a', emissiveIntensity: 0.22 });
    return (
      <group position={[x, y, z]} rotation={[0, rot, 0]} scale={k}>
        <Box s={[w, H + 1.2, d]} p={[0, (H - 1.2) / 2, 0]} m={wall} />
        <Box s={[w + 0.15, 0.1, d + 0.15]} p={[0, H, 0]} m={M.plain('#d8cfc0')} />
        {Array.from({ length: fl }, (_, k) => (
          <group key={k}>
            <Box s={[w * 0.74, 0.34, 0.04]} p={[0, 0.75 + k * 1.25, d / 2 + 0.01]} m={win} cast={false} />
            <Box s={[0.04, 0.34, d * 0.66]} p={[w / 2 + 0.01, 0.75 + k * 1.25, 0]} m={win} cast={false} />
          </group>
        ))}
        <Roof w={w + 0.55} d={d + 0.55} h={0.9} y={H + 0.05} m={M.plain(roof, { metalness: 0.25, roughness: 0.5, emissive: '#10306a', emissiveIntensity: 0.25 })} sag={1} lift={0} fascia={false} />
      </group>
    );
  }

  /* ---------- the Tibetan monastery (Maratika Chimey Takten Choling) ---------- */
  function Monastery({ p, rot = 0 }) {
    const M = useM();
    const org = M.plain('#c9492a', { roughness: 0.85 });
    const org2 = M.plain('#d8602f', { roughness: 0.85 });
    const cream = M.plain('#eadbbd', { roughness: 0.85 });
    const redR = M.plain('#b13a22', { roughness: 0.8 });
    const win = M.plain('#2a2a34', { roughness: 0.4, emissive: '#ffb55a', emissiveIntensity: 0.25 });
    const gold = M.gold;
    const wins = (n, w, y, z, sz = 1) => Array.from({ length: n }, (_, i) => {
      const x = (i - (n - 1) / 2) * w;
      return (
        <group key={i} position={[x, y, z]}>
          <Box s={[0.62 * sz, 0.78 * sz, 0.05]} m={cream} cast={false} />
          <Box s={[0.46 * sz, 0.62 * sz, 0.06]} m={win} cast={false} />
        </group>
      );
    });
    return (
      <group position={p} rotation={[0, rot, 0]}>
        <Box s={[7.4, 1.5, 5.4]} p={[0, -0.25, 0]} m={M.mat('stone', 3, 1, { color: '#c9bca4' })} />
        <Box s={[6.6, 1.55, 4.8]} p={[0, 1.27, 0]} m={org} />
        {wins(4, 1.5, 1.2, 2.42, 0.85)}
        <Box s={[3.6, 1.1, 0.06]} p={[0, 0.85, 2.43]} m={cream} cast={false} />
        <Box s={[0.9, 0.9, 0.08]} p={[0, 0.75, 2.45]} m={M.plain('#5a2a1a')} cast={false} />
        <Box s={[7.1, 0.14, 5.5]} p={[0, 2.12, 0]} m={redR} />
        <Box s={[6.4, 1.4, 4.6]} p={[0, 2.89, -0.05]} m={org2} />
        {wins(5, 1.2, 2.95, 2.27)}
        <Box s={[7.0, 0.1, 0.9]} p={[0, 2.25, 2.6]} m={redR} />
        <Box s={[6.9, 0.3, 0.05]} p={[0, 2.5, 3.05]} m={cream} cast={false} />
        {Array.from({ length: 13 }, (_, i) => <Box key={i} s={[0.05, 0.3, 0.05]} p={[-3.4 + i * 0.567, 2.5, 3.05]} m={cream} cast={false} />)}
        <Box s={[7.2, 0.14, 5.4]} p={[0, 3.66, 0]} m={redR} />
        <Box s={[5.8, 1.3, 4.0]} p={[0, 4.38, -0.1]} m={org} />
        {wins(3, 1.5, 4.4, 1.92, 1.05)}
        <Box s={[6.2, 0.1, 0.9]} p={[0, 3.74, 2.35]} m={redR} />
        <Box s={[6.1, 0.05, 0.05]} p={[0, 4.12, 2.78]} m={cream} cast={false} />
        {Array.from({ length: 12 }, (_, i) => <Box key={i} s={[0.05, 0.38, 0.05]} p={[-2.9 + i * 0.527, 3.93, 2.78]} m={cream} cast={false} />)}
        <Box s={[6.9, 0.05, 0.05]} p={[0, 2.62, 3.05]} m={cream} cast={false} />
        <Box s={[7.5, 0.2, 5.8]} p={[0, 5.1, 0]} m={redR} />
        <Box s={[7.5, 0.09, 5.8]} p={[0, 4.96, 0]} m={cream} />
        {[[-3.5, 2.75], [3.5, 2.75], [-3.5, -2.75], [3.5, -2.75]].map(([x, z], i) => (
          <group key={i} position={[x, 5.2, z]}>
            <Cyl rt={0.07} rb={0.1} h={0.3} p={[0, 0.05, 0]} m={gold} seg={8} />
            <mesh position={[0, 0.5, 0]} material={gold} castShadow><coneGeometry args={[0.24, 0.8, 8]} /></mesh>
          </group>
        ))}
        {[-2.2, -0.7, 0.7, 2.2].map((x, i) => <mesh key={i} position={[x, 5.3, 2.8]} material={gold}><coneGeometry args={[0.1, 0.3, 6]} /></mesh>)}
        <Cyl rt={0.14} rb={0.22} h={0.5} p={[0, 5.45, 0]} m={gold} seg={10} />
        <Ball rad={0.2} p={[0, 5.8, 0]} m={gold} />
        <mesh position={[0, 6.15, 0]} material={gold}><coneGeometry args={[0.1, 0.5, 8]} /></mesh>
      </group>
    );
  }

  /* ---------- the small cream shrine with a two-tier tin roof ---------- */
  function CreamShrine({ p, rot = 0 }) {
    const M = useM();
    const tin = M.plain('#7d8d83', { roughness: 0.6, metalness: 0.25 });
    const cream = M.plain('#e8d3b8', { roughness: 0.9 });
    return (
      <group position={p} rotation={[0, rot, 0]}>
        <Box s={[2.9, 0.3, 2.5]} p={[0, 0.15, 0]} m={M.mat('stone', 2, 1, { color: '#cfc3ac' })} />
        <Box s={[2.5, 1.2, 2.1]} p={[0, 0.9, 0]} m={cream} />
        <Box s={[0.6, 0.85, 0.05]} p={[0, 0.72, 1.07]} m={M.plain('#4a2a1a')} cast={false} />
        <Box s={[2.65, 0.1, 2.25]} p={[0, 1.55, 0]} m={M.plain('#b89f84')} />
        <Roof w={3.3} d={2.9} h={0.7} y={1.6} m={tin} sag={1.2} lift={0.12} fascia={false} />
        <Box s={[1.2, 0.55, 1.1]} p={[0, 2.0, 0]} m={cream} />
        <Roof w={1.9} d={1.8} h={0.6} y={2.25} m={tin} sag={1.2} lift={0.12} fascia={false} />
        <Cyl rt={0.03} rb={0.05} h={0.5} p={[0, 3.15, 0]} m={M.gold} seg={6} />
      </group>
    );
  }

  /* ---------- MAIN ---------- */
  function HalesiMain() {
    const M = useM();
    const crag = useMemo(buildCrag, []);
    const tunnel = useMemo(buildTunnel, []);
    const white = M.plain('#f3f0ea', { roughness: 0.85 });
    const rail = M.plain('#8a3b2a', { roughness: 0.6 });
    const tread = M.plain('#a65a44', { roughness: 0.9 });
    const dark = M.plain('#1a1612', { roughness: 1 });
    const cloth = M.plain('#d9541f', { roughness: 0.9, emissive: '#c0401a', emissiveIntensity: 0.5 });
    const cloth2 = M.plain('#b3202a', { roughness: 0.9, emissive: '#901820', emissiveIntensity: 0.5 });
    const conc = M.plain('#a89c8c', { roughness: 0.95 });
    const sideGeo = useMemo(() => {
      const sh = new THREE.Shape();
      sh.moveTo(SX0, -2); sh.lineTo(SX1, -2); sh.lineTo(SX1, SY1 + 0.2); sh.lineTo(SXL1, YL + 0.2); sh.lineTo(SXL0, YL + 0.2); sh.lineTo(SX0, SY0 + 0.2); sh.closePath();
      return new THREE.ExtrudeGeometry(sh, { depth: 0.2, bevelEnabled: false });
    }, []);
    const N1 = 14; const N2 = 12;
    const dx1 = (SXL0 - SX0) / N1; const dr1 = (SY0 - YL) / N1; const dx2 = (SX1 - SXL1) / N2; const dr2 = (YL - SY1) / N2;
    const segs = [[SX0, SXL0], [SXL0, SXL1], [SXL1, SX1]];
    const PZ = 6.2; // lip of the pit
    const DT = FL + 0.2; // deck top
    const topY = (x, z) => topAt(x, z);
    const skyTop = topY(SKY[0], SKY[1]);
    const rimFoliage = [[-4.9, -7.3, 0.7], [-3.6, -9.5, 0.75], [-1.0, -9.4, 0.65], [-0.2, -7.4, 0.7], [-0.9, -5.4, 0.6], [-4.1, -5.3, 0.65], [-2.6, -9.8, 0.5]];
    return (
      <group>
        <mesh geometry={crag} castShadow receiveShadow material={M.plain('#ffffff', { roughness: 1, vertexColors: true, flatShading: true, side: THREE.DoubleSide })} />
        <mesh geometry={tunnel} position={[0, -1.5, 0]} material={M.plain('#ffffff', { roughness: 1, vertexColors: true, side: THREE.DoubleSide })} />
        <mesh position={[1.0, FL, -4.3]} rotation={[-PI / 2, 0, 0]} material={M.plain('#2a221a', { roughness: 1 })}><planeGeometry args={[14.4, 13]} /></mesh>
        {/* skylight shaft, a bright leafy disc seen through it, canopy and flag lines across */}
        <mesh position={[SKY[0], 4.5 + (skyTop - 4.5) / 2 - 0.15, SKY[1]]} scale={[1.18, 1, 0.9]} material={dark}><cylinderGeometry args={[2.35, 1.9, skyTop - 4.5, 16, 1, true]} /></mesh>
        <mesh position={[SKY[0], skyTop - 1.5, SKY[1]]} rotation={[-PI / 2, 0, 0]} scale={[1.18, 0.9, 1]} material={M.plain('#b7d68a', { roughness: 1, emissive: '#9fc070', emissiveIntensity: 0.55 })}><circleGeometry args={[2.25, 18]} /></mesh>
        {[[-3.6, -7.0, 0.8], [-1.7, -8.0, 0.7], [-2.7, -6.4, 0.6]].map(([x, z, r], i) => <Ball key={i} rad={r} sc={[1.2, 0.8, 1.1]} p={[x, skyTop - 1.2 - (i % 2) * 0.25, z]} m={M.plain(i % 2 ? '#7e8e52' : '#8c9a56', { roughness: 1 })} />)}
        {rimFoliage.map(([x, z, r], i) => <Ball key={i} rad={r} sc={[1.3, 0.8, 1.2]} p={[x, topY(x, z) + 0.05, z]} m={M.plain(i % 2 ? '#667a46' : '#788c48', { roughness: 1 })} />)}
        <FlagLine a={[-5.4, topY(-5.4, -7.4) + 0.5, -7.4]} b={[0.4, topY(0.4, -7.6) + 0.5, -7.6]} sag={0.5} n={9} />
        <FlagLine a={[-2.6, topY(-2.6, -10.4) + 0.5, -10.4]} b={[-2.6, topY(-2.6, -4.2) + 0.5, -4.2]} sag={0.4} n={8} />
        {/* crown scrub and a tree or two on the rock */}
        {[[-8, -3.5], [-9.5, -6], [6.5, -5], [9, -3], [3, -9], [6, -9]].map(([x, z], i) => <Ball key={i} rad={0.7} sc={[1.2, 0.8, 1.1]} p={[x, topY(x, z) + 0.1, z]} m={M.plain(i % 2 ? '#6a7c46' : '#7e8c4a', { roughness: 1 })} />)}
        {[[-7, -9], [7.5, -8]].map(([x, z], i) => <group key={i} position={[x, topY(x, z) - 0.2, z]} scale={1.4}><Cyl rt={0.08} rb={0.14} h={1.4} p={[0, 0.7, 0]} m={M.plain('#5a4030')} seg={6} /><Ball rad={0.9} p={[0, 1.8, 0]} m={M.plain('#667a46', { roughness: 1 })} /><Ball rad={0.6} p={[0.5, 1.5, 0.2]} m={M.plain('#76824a', { roughness: 1 })} /></group>)}

        {[[9.6, 2.6, 0.9], [10.6, 0.5, 0.7], [-9.5, -1.5, 0.8], [-11, -2.5, 0.6]].map(([x, z, r], i) => <Ball key={i} rad={r} sc={[1.2, 0.8, 1]} p={[x, terr(x, z) + r * 0.25, z]} m={M.plain(i % 2 ? '#8d897c' : '#9d998c', { roughness: 1, flatShading: true })} />)}

        {/* ragged outcrops breaking up the right-hand buttress */}
        {Array.from({ length: 22 }, (_, i) => {
          const x = 5.4 + h2(i, 31) * 5.2; const top = Math.max(1.5, Ht(x) - 0.6); const y = 0.8 + h2(i, 32) * (top - 0.8);
          const rr = 0.6 + h2(i, 33) * 0.8;
          return <mesh key={i} position={[x + (h2(i, 36) - 0.5) * 0.8, y, zf(x, y) + 0.15]} rotation={[h2(i, 34) * 3, h2(i, 35) * 3, 0]} scale={[rr * 1.5, rr * 0.7, rr]} material={M.plain(h2(i, 37) > 0.7 ? '#a9a899' : h2(i, 37) > 0.35 ? '#6c6a62' : '#55534c', { roughness: 1, flatShading: true })} castShadow><icosahedronGeometry args={[1, 0]} /></mesh>;
        })}
        {/* sheer rock lip of the pit, front, with grass on top */}
        <Box s={[16, 2.4, 1.6]} p={[1.0, PITY + 1.2 - 0.0, PZ + 1.2]} m={M.plain('#6f6c62', { roughness: 1 })} />
        {[-6.5, -4.4, -2.1, 0.3, 2.6, 4.9, 7.2].map((x, i) => <Ball key={i} rad={0.55 + 0.1 * (i % 3)} sc={[1.7, 0.45, 1.0]} p={[x, 0.45, PZ + 1.7]} m={M.plain(i % 2 ? '#6a6860' : '#78756a', { roughness: 1 })} />)}
        {[-5, -1.5, 2, 5.5].map((x, i) => <Ball key={i} rad={0.5} sc={[1.6, 0.5, 1.2]} p={[x, 0.7, PZ + 1.7]} m={M.plain(i % 2 ? '#6f8248' : '#7e9050', { roughness: 1 })} />)}
        {/* the pit: concrete deck at the bottom, a low white wall at the lip with posts and pipe rails above it */}
        <Box s={[11, 0.2, 4.5]} p={[2.9, FL + 0.1, 3.95]} m={conc} />
        {[[-1.2, 5.2, 1.3, 0.8, '#6a2a20'], [4.4, 2.6, 1.0, 0.7, '#7a2a28'], [7.0, 4.8, 1.4, 0.9, '#c4452b'], [1.6, 3.6, 0.8, 0.6, '#3b2a22'], [5.8, 3.4, 0.9, 0.6, '#d9a02e']].map(([x, z, w, d, c], i) => <Box key={i} s={[w, 0.015, d]} p={[x, DT + 0.01, z]} m={M.plain(c, { roughness: 1 })} cast={false} />)}
        <Box s={[15.2, 2.05, 0.3]} p={[1.0, PITY + 1.025, PZ + 0.1]} m={white} />
        <Box s={[0.3, 2.05, 7.8]} p={[8.4, PITY + 1.025, 2.3]} m={white} />
        <Box s={[0.3, 2.8, 4.8]} p={[-6.4, PITY + 1.4, 3.5]} m={white} />
        {Array.from({ length: 7 }, (_, i) => (
          <group key={i} position={[-5.8 + i * 2.2, 0.3, PZ + 0.1]}>
            <Box s={[0.3, 0.75, 0.3]} p={[0, 0.375, 0]} m={white} />
            <Box s={[0.38, 0.07, 0.38]} p={[0, 0.78, 0]} m={white} />
          </group>
        ))}
        {[0.9, 0.55].map((y, i) => <Box key={i} s={[14.2, 0.05, 0.05]} p={[0.8, y, PZ + 0.1]} m={rail} />)}
        {[0, 1, 2].map((i) => (
          <group key={i} position={[8.4, 0.3, 0.4 + i * 2.7]}>
            <Box s={[0.3, 0.75, 0.3]} p={[0, 0.375, 0]} m={white} />
            <Box s={[0.38, 0.07, 0.38]} p={[0, 0.78, 0]} m={white} />
          </group>
        ))}
        {[0.9, 0.55].map((y, i) => <Box key={i} s={[0.05, 0.05, 5.6]} p={[8.4, y + 0.3, 3.2]} m={rail} />)}
        {[-5.8, -1.4, 3.0, 7.4].map((x, i) => <Diyo key={i} p={[x, 1.1, PZ + 0.1]} light={i % 3 === 0} />)}
        {/* notice-board wall and the first shrines on the deck */}
        <Box s={[2.6, 0.62, 0.22]} p={[0.8, DT + 0.31, 2.2]} m={white} />
        <Box s={[1.7, 0.5, 0.05]} p={[0.8, DT + 0.85, 2.24]} m={M.plain('#f3e4dc')} cast={false} />
        <Box s={[1.7, 0.14, 0.06]} p={[0.8, DT + 1.0, 2.26]} m={cloth2} cast={false} />
        {[-0.3, 1.9].map((x, i) => <Box key={i} s={[0.2, 0.9, 0.2]} p={[x, DT + 0.45, 2.2]} m={white} />)}
        {[[3.8, 4.4], [6.2, 3.8]].map(([x, z], i) => (
          <group key={i} position={[x, DT, z]}>
            <Box s={[1.2, 0.36, 1.2]} p={[0, 0.18, 0]} m={white} />
            <Box s={[0.85, 0.06, 0.85]} p={[0, 0.39, 0]} m={cloth} />
            <Ball rad={0.16} sc={[1, 1.3, 1]} p={[0, 0.6, 0]} m={M.plain('#c4452b')} />
            <Cyl rt={0.03} h={0.65} p={[-0.5, 0.7, -0.5]} m={white} seg={5} />
            <Cyl rt={0.03} h={0.65} p={[0.5, 0.7, -0.5]} m={white} seg={5} />
            <Box s={[1.1, 0.04, 0.04]} p={[0, 1.02, -0.5]} m={white} />
          </group>
        ))}
        {/* hanging bell on a frame, right end of the deck */}
        <group position={[7.6, DT, 1.4]}>
          <Cyl rt={0.045} h={1.2} p={[-0.5, 0.6, 0]} m={white} seg={6} />
          <Cyl rt={0.045} h={1.2} p={[0.5, 0.6, 0]} m={white} seg={6} />
          <Box s={[1.1, 0.07, 0.07]} p={[0, 1.2, 0]} m={white} />
          <mesh position={[0, 0.95, 0]} material={M.gold} castShadow><coneGeometry args={[0.2, 0.36, 10]} /></mesh>
        </group>

        {/* inside the chamber: railed shrine cages, the lingam, a pipe lamp, orange-lit shrine silhouettes at the back */}
        {[[-2.6, -1.4], [0.4, -2.4], [3.2, -1.8]].map(([x, z], i) => (
          <group key={i} position={[x, FL + 0.04, z]}>
            <Box s={[1.5, 0.18, 1.3]} p={[0, 0.09, 0]} m={M.plain('#8a7a68')} />
            <Box s={[1.0, 0.34, 0.8]} p={[0, 0.35, 0]} m={i === 1 ? cloth2 : cloth} />
            {[[-0.7, -0.6], [0.7, -0.6], [-0.7, 0.6], [0.7, 0.6]].map(([px, pz], k) => <Cyl key={k} rt={0.03} h={0.8} p={[px, 0.58, pz]} m={white} seg={5} />)}
            <Box s={[1.5, 0.04, 0.04]} p={[0, 0.98, 0.6]} m={white} />
            <Box s={[1.5, 0.04, 0.04]} p={[0, 0.98, -0.6]} m={white} />
          </group>
        ))}
        {[[-3.2, -8.6, 1.1], [-0.6, -9.0, 1.4], [2.4, -8.8, 1.0], [4.6, -8.0, 0.8]].map(([x, z, h], i) => (
          <group key={i} position={[x, FL, z]}>
            <Box s={[0.9, h, 0.5]} p={[0, h / 2, 0]} m={M.plain('#4a2a14', { roughness: 1, emissive: '#d9541f', emissiveIntensity: 0.9 })} cast={false} />
            <Box s={[0.5, 0.25, 0.4]} p={[0, h + 0.12, 0]} m={M.plain('#6a3a14', { roughness: 1, emissive: '#e07a2a', emissiveIntensity: 0.9 })} cast={false} />
          </group>
        ))}
        <group position={[2.0, FL + 0.04, -0.7]}>
          <Box s={[1.8, 0.14, 1.5]} p={[0, 0.07, 0]} m={M.plain('#3b1e18')} />
          {[[-0.5, 0.3, '#c4252b'], [0.4, 0.4, '#e2b33c'], [-0.2, -0.45, '#e0527a'], [0.55, -0.3, '#d9541f'], [-0.65, -0.2, '#e2b33c'], [0.1, 0.5, '#c4252b']].map(([x, z, c], i) => <Ball key={i} rad={0.1} sc={[1, 0.6, 1]} p={[x, 0.17, z]} m={M.plain(c)} />)}
          <mesh position={[0, 0.65, 0]} rotation={[0, 0, 0.05]} material={M.plain('#e4543c', { roughness: 0.7, emissive: '#a02a1a', emissiveIntensity: 0.7 })} castShadow><cylinderGeometry args={[0.1, 0.24, 1.0, 10]} /></mesh>
          <Diyo p={[0.5, 0.14, 0.6]} light />
          <Diyo p={[-0.5, 0.14, 0.55]} />
          <pointLight position={[0, 1.6, 1.2]} intensity={30} distance={14} color="#ffb070" />
        </group>
        <group position={[-3.8, FL + 0.04, 0.2]}>
          <Cyl rt={0.04} h={1.5} p={[0, 0.75, 0]} m={white} seg={6} />
          <Box s={[0.6, 0.04, 0.04]} p={[0.25, 1.5, 0]} m={white} />
          <Ball rad={0.07} p={[0.55, 1.46, 0]} m={M.plain('#fff3c0', { emissive: '#ffd27a', emissiveIntensity: 0.9 })} />
        </group>

        {/* the stair: steep first flight from the courtyard (left), a landing, then the second flight into the pit */}
        {Array.from({ length: N1 }, (_, i) => {
          const top = SY0 - (i + 1) * dr1;
          return <Box key={i} s={[dx1 + 0.01, top + 2, 2.4]} p={[SX0 + (i + 0.5) * dx1, (top - 2) / 2, SZ]} m={tread} />;
        })}
        <Box s={[SXL1 - SXL0, YL + 2, 2.4]} p={[(SXL0 + SXL1) / 2, (YL - 2) / 2, SZ]} m={conc} />
        {Array.from({ length: N2 }, (_, i) => {
          const top = YL - (i + 1) * dr2;
          return <Box key={i} s={[dx2 + 0.01, top + 2, 2.4]} p={[SXL1 + (i + 0.5) * dx2, (top - 2) / 2, SZ]} m={tread} />;
        })}
        {[-1, 1].map((sd) => (
          <group key={sd}>
            <mesh geometry={sideGeo} position={[0, 0, SZ + sd * 1.2 - (sd > 0 ? 0 : 0.2)]} material={white} castShadow />
            {Array.from({ length: 13 }, (_, i) => {
              const x = SX0 + 0.3 + (i * (SX1 - SX0 - 0.6)) / 12;
              return <Box key={i} s={[0.3, 0.7, 0.3]} p={[x, stairY(x) + 0.75, SZ + sd * 1.1]} m={white} />;
            })}
            {segs.map(([xa, xb], k) => {
              const ya = stairY(xa); const yb = stairY(xb);
              const L = Math.hypot(xb - xa, yb - ya); const a = Math.atan2(yb - ya, xb - xa);
              return [0.9, 0.62].map((o, q) => <Box key={`${k}-${q}`} s={[L, 0.05, 0.05]} p={[(xa + xb) / 2, (ya + yb) / 2 + o + 0.1, SZ + sd * 1.1]} r={[0, 0, a]} m={rail} />);
            })}
          </group>
        ))}

        {/* flag lines across the stair and above the pit */}
        <Cyl rt={0.03} rb={0.045} h={3.0} p={[-6.7, 2.4, 5.2]} m={M.plain('#a98a54')} seg={5} />
        <Cyl rt={0.03} rb={0.045} h={3.4} p={[8.7, 1.7, 6.6]} m={M.plain('#a98a54')} seg={5} />
        <FlagLine a={[-6.7, 3.9, 5.2]} b={[8.7, 3.3, 6.6]} sag={0.9} n={18} />
        <FlagLine a={[-12.0, 6.4, 4.6]} b={[-6.7, 3.9, 5.2]} sag={0.7} n={9} />

        <Person p={[-8.2, stairY(-8.2), SZ + 0.3]} c="#c0392b" r={-1.5} />
        <Person p={[-2.2, DT, 5.0]} c="#2f6db5" r={0.6} />
        <Person p={[2.8, DT, 3.2]} c="#e2b33c" r={2.2} />
        <Person p={[-1.0, FL + 0.04, -1.2]} c="#8a2a2a" />
        <mesh position={[SKY[0] + 0.4, (skyTop - 1.5 + FL) / 2, SKY[1] + 0.4]} material={new THREE.MeshBasicMaterial({ color: '#fff0bc', transparent: true, opacity: 0.15, depthWrite: false, side: THREE.DoubleSide })}><cylinderGeometry args={[2.0, 3.4, skyTop - 1.5 - FL, 20, 1, true]} /></mesh>
        <mesh position={[SKY[0] + 0.4, FL + 0.03, SKY[1] + 0.4]} rotation={[-PI / 2, 0, 0]} material={new THREE.MeshBasicMaterial({ color: '#fff0bc', transparent: true, opacity: 0.2, depthWrite: false })}><circleGeometry args={[3.3, 20]} /></mesh>
        <Frame s={[22, 13.5, 15]} p={[-1, 5.2, 0]} />
      </group>
    );
  }

  /* ---------- ENV ---------- */
  const HOUSES = [
    [24, -6, 3.2, 3.6, 3, 0.3, 0], [29, 2, 3.0, 3.4, 4, -0.2, 1, '#2a62b8'], [23, 10, 3.2, 3.0, 3, 0.1, 2], [27, 15, 3.4, 3.2, 3, -0.3, 3],
    [34, -9, 3.2, 3.4, 3, 0.5, 4], [35, 7, 2.8, 3, 4, -0.1, 1], [39, 0, 3.4, 3.6, 3, 0.2, 2], [31, -17, 3.4, 3.2, 4, 0.1, 0], [19, -13, 3.0, 3.2, 3, -0.4, 3, '#2a62b8'],
    [-39, -3, 3.0, 3.4, 4, 0.2, 2, '#c4552a'], [-33, -14, 3.4, 3.0, 3, -0.2, 3], [-37, -10, 3.0, 3.2, 3, 0.3, 0], [-45, -5, 3.2, 3.2, 4, 0.1, 4],
    [10, -31, 3.2, 3.4, 3, 0.2, 2], [-6, -36, 3.4, 3.2, 3, 0.5, 1], [-18, -37, 3.0, 3.2, 4, -0.2, 3],
  ];
  function HalesiEnv() {
    const M = useM();
    const treeList = useMemo(() => {
      const out = [];
      const bigs = [[-15.5, -9, 2.4, 6], [-28, -12, 2.8, 2], [-35, -23.5, 1.9, 0], [-31, -22.5, 2.2, 2], [-27, -24, 1.8, 6], [-38.5, -26, 2.0, 4], [-24, -27, 1.7, 1], [-33.5, -25, 1.6, 3]];
      bigs.forEach(([x, z, s, c]) => out.push([x, terr(x, z) - 0.05, z, s, c]));
      for (let i = 0; i < 220 && out.length < 90; i += 1) {
        if (h2(i, 6) < 0.3) continue; // these become bare trees
        const a = h2(i, 1) * 2 * PI; const r = 9 + h2(i, 2) * 52;
        const x = Math.sin(a) * r; const z = Math.cos(a) * r;
        if (Math.abs(x) < 17 && z > -17 && z < 17) continue;
        if (x > -30 && x < -9 && z > -13 && z < 17) continue;
        if (x > -6 && z > 2 && r < 32) continue;
        if (x < -8 && z > -8 && r < 48) continue;
        if (Math.hypot(x + 31, z + 31) < 8) continue;
        if (HOUSES.some(([hx, hz]) => Math.hypot(hx - x, hz - z) < 4.2)) continue;
        if (r < 20 && h2(i, 5) < 0.5) continue;
        out.push([x, terr(x, z) - 0.05, z, 1.1 + h2(i, 3) * 1.2, Math.floor(h2(i, 4) * 7)]);
      }
      return out;
    }, []);
    const bare = useMemo(() => {
      const out = [];
      for (let i = 0; i < 220 && out.length < 22; i += 1) {
        if (h2(i, 6) >= 0.3) continue;
        const a = h2(i, 1) * 2 * PI; const r = 9 + h2(i, 2) * 52;
        const x = Math.sin(a) * r; const z = Math.cos(a) * r;
        if (Math.abs(x) < 17 && z > -17 && z < 17) continue;
        if (x > -30 && x < -9 && z > -13 && z < 17) continue;
        if (x > -6 && z > 2 && r < 32) continue;
        if (x < -8 && z > -8 && r < 48) continue;
        if (Math.hypot(x + 31, z + 31) < 8) continue;
        if (HOUSES.some(([hx, hz]) => Math.hypot(hx - x, hz - z) < 4.2)) continue;
        out.push([x, z, 0.9 + h2(i, 3) * 0.9]);
      }
      return out;
    }, []);
    const stone = M.mat('stone', 4, 1, { color: '#d8ccb6' });
    return (
      <group>
        <mesh rotation={[-PI / 2, 0, 0]} position={[0, -7, 0]} material={M.plain('#6f7f52', { roughness: 1 })}><circleGeometry args={[100, 48]} /></mesh>
        <Terrain />
        <Ridge r={66} hmin={7} hmax={16} color="#80906a" seed={3} />
        <Ridge r={80} base={-8} hmin={14} hmax={26} color="#a9b2a8" seed={11} />

        {/* the outer courtyard: dusty yard, low stone retaining walls, broad steps, big trees, cream shrine, red house */}
        <Box s={[18, 0.9, 0.45]} p={[-21, 3.6, 14.2]} m={stone} />
        <Box s={[0.45, 0.8, 24]} p={[-30.5, 4.4, 1.5]} m={stone} />
        {[0, 1, 2, 3, 4].map((i) => <Box key={i} s={[6, 0.22, 0.9]} p={[-20, 4.1 + i * 0.22, -13.5 - i * 0.9]} m={stone} />)}
        {[-23, -17].map((x, i) => <Box key={i} s={[0.3, 0.9, 5.4]} p={[x, 4.6, -15.6]} m={M.plain('#f3f0ea')} />)}
        <CreamShrine p={[-20.5, 4, 3.8]} rot={0.5} />
        <group position={[-27.2, 4, -6]} rotation={[0, 0.6, 0]}>
          <Box s={[5, 3.3, 4.2]} p={[0, 1.65, 0]} m={M.plain('#b5432e', { roughness: 0.9 })} />
          <Box s={[4.2, 0.35, 0.05]} p={[0, 2.35, 2.12]} m={M.plain('#26364a')} cast={false} />
          <Box s={[4.2, 0.35, 0.05]} p={[0, 0.95, 2.12]} m={M.plain('#26364a')} cast={false} />
          <Roof w={5.8} d={5.0} h={1.0} y={3.3} m={M.plain('#6f7f72', { metalness: 0.2, roughness: 0.6 })} sag={1} lift={0} fascia={false} />
        </group>
        <Person p={[-15.5, 4, 2.2]} c="#c0392b" />
        <Person p={[-16.2, 4, 3.0]} c="#2e8b57" r={1} />
        <Person p={[-22.5, 4, 8.5]} c="#e2b33c" r={2} />
        <Person p={[-24, 4, 7.7]} c="#2f6db5" r={3} />
        

        <group position={[-31, terr(-31, -31) + 0.6, -31]} rotation={[0, 0.45, 0]} scale={1.3}><Monastery p={[0, 0, 0]} rot={0} /></group>
        <FlagLine a={[-27, terr(-27, -28) + 8, -28]} b={[-9, 10.2, -9]} sag={1.6} n={14} />

        {HOUSES.map(([x, z, w, d, fl, rot, wi, rc], i) => <Home key={i} x={x} z={z} w={w} d={d} fl={fl} rot={rot} wi={wi} roof={rc || '#2a62b8'} cream={i === 6} />)}
        <Trees list={treeList} />
        {bare.map(([x, z, sc], i) => <BareTree key={i} p={[x, terr(x, z), z]} s={sc} />)}
        <BareTree p={[22, terr(22, -2), -2]} s={1.3} />
        <BareTree p={[30, terr(30, 9), 9]} s={1.5} />
        <BareTree p={[-36, terr(-36, -8), -8]} s={1.4} />
        <BareTree p={[-30, terr(-30, -16), -16]} s={1.2} />
      </group>
    );
  }

  return { 'halesi-mahadev': { Main: HalesiMain, Env: HalesiEnv } };
}
