// Bhairavnath Temple, Taumadhi Square, Bhaktapur: broad rectangular three-roofed brick pagoda.
// Units: 1 unit is about 1.5 m. Front faces +z. Nyatapola (5 tiers) stands left (-x), Betal temple right (+x).
export default function make(K) {
  const { useM, Box, Cyl, Ball, Gajur, Lion, Frame, THREE, useMemo, Diyo } = K;

  /* ---------- geometry helpers: everything static is merged into a few vertex-coloured meshes ---------- */
  const _e = new THREE.Euler();
  const _q = new THREE.Quaternion();
  const _p = new THREE.Vector3();
  const _s = new THREE.Vector3(1, 1, 1);
  const _m = new THREE.Matrix4();
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const place = (g, x, y, z, ry = 0, rx = 0) => {
    _e.set(rx, ry, 0, 'YXZ'); _q.setFromEuler(_e); _p.set(x, y, z); _m.compose(_p, _q, _s); g.applyMatrix4(_m); return g;
  };
  const GAIN = { brick: 1.2, roof: 1.0, stone: 1.25, tim: 1, gold: 1, glow: 1 };
  const paint = (g, hex, gain = 1) => {
    const c = new THREE.Color(hex).multiplyScalar(gain); const n = g.attributes.position.count; const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i += 1) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g;
  };
  const newBag = () => ({ brick: [], tim: [], roof: [], stone: [], gold: [], glow: [] });
  /** Box into a bag: size w,h,d; centre x,y,z; colour; yaw ry; tilt rx. UVs scaled to world size so textures keep their scale. */
  function B(bag, key, w, h, d, x, y, z, c = '#ffffff', ry = 0, rx = 0, tile = 1.3) {
    const g = new THREE.BoxGeometry(w, h, d);
    const uv = g.attributes.uv;
    const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f += 1) for (let k = 0; k < 4; k += 1) { const i = f * 4 + k; uv.setXY(i, (uv.getX(i) * dims[f][0]) / tile, (uv.getY(i) * dims[f][1]) / tile); }
    place(g, x, y, z, ry, rx); paint(g, c, GAIN[key]); bag[key].push(g);
  }
  /** Pagoda roof: concave hipped slopes from the eave (w x d, at y) up to a flat plateau cw x cd; vertex colours give moss patches. */
  function roofG(bag, w, d, h, cw, cd, x, y, z, o = {}) {
    const { sag = 1.6, lift = 0.14, N = 18, moss = 0, seed = 0, base = '#a98a62', mossC = '#6f8a3e', ry = 0 } = o;
    const hw = w / 2; const hd = d / 2;
    const cx = Math.min(0.95, cw / w); const cz = Math.min(0.95, cd / d);
    const b = new THREE.Color(base); const mc = new THREE.Color(mossC); const tmp = new THREE.Color();
    const pos = []; const uv = []; const col = []; const idx = [];
    for (let j = 0; j <= N; j += 1) {
      for (let i = 0; i <= N; i += 1) {
        const px = -hw + (w * i) / N; const pz = -hd + (d * j) / N;
        const ax = Math.abs(px) / hw; const az = Math.abs(pz) / hd;
        const qx = Math.max(0, (ax - cx) / (1 - cx)); const qz = Math.max(0, (az - cz) / (1 - cz));
        const s = Math.min(1, Math.max(qx, qz));
        pos.push(px, h * (1 - s) ** sag + lift * (qx * qz) ** 2, pz);
        uv.push(px / 1.5, pz / 1.5);
        const n = 0.5 + 0.25 * Math.sin(px * 1.3 + seed) * Math.cos(pz * 1.9 + seed * 1.7) + 0.25 * Math.sin(px * 3.1 + pz * 2.3 + seed * 3);
        const mm = moss * clamp((n - 0.42) * 3.2, 0, 1) * (0.3 + 0.7 * s);
        tmp.copy(b).lerp(mc, mm);
        const jit = 0.9 + 0.2 * (0.5 + 0.5 * Math.sin(i * 12.9898 + j * 78.233 + seed));
        col.push(tmp.r * jit * GAIN.roof, tmp.g * jit * GAIN.roof, tmp.b * jit * GAIN.roof);
      }
    }
    for (let j = 0; j < N; j += 1) for (let i = 0; i < N; i += 1) { const a = j * (N + 1) + i; const bb = a + 1; const c = a + N + 1; const e = c + 1; idx.push(a, c, bb, bb, c, e); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx); g.computeVertexNormals();
    place(g, x, y, z, ry); bag.roof.push(g);
  }
  function mergeG(list) {
    if (!list.length) return null;
    let nv = 0; let ni = 0;
    list.forEach((g) => { nv += g.attributes.position.count; ni += g.index.count; });
    const pos = new Float32Array(nv * 3); const nor = new Float32Array(nv * 3); const uv = new Float32Array(nv * 2); const cl = new Float32Array(nv * 3); const idx = new Uint32Array(ni);
    let vo = 0; let io = 0;
    list.forEach((g, gi) => {
      const c = g.attributes.position.count;
      if (g.attributes.position.array.some((v) => !Number.isFinite(v))) console.warn('NANGEO', gi, c);
      pos.set(g.attributes.position.array, vo * 3); nor.set(g.attributes.normal.array, vo * 3); uv.set(g.attributes.uv.array, vo * 2); cl.set(g.attributes.color.array, vo * 3);
      for (let i = 0; i < g.index.count; i += 1) idx[io + i] = g.index.array[i] + vo;
      vo += c; io += g.index.count; g.dispose();
    });
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    out.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); out.setAttribute('color', new THREE.BufferAttribute(cl, 3));
    out.setIndex(new THREE.BufferAttribute(idx, 1)); return out;
  }
  function BagMesh({ bag }) {
    const M = useM();
    const geo = useMemo(() => { const o = {}; Object.keys(bag).forEach((k) => { o[k] = mergeG(bag[k]); }); return o; }, [bag]);
    const mats = {
      brick: M.mat('brick', 1, 1, { vertexColors: true, color: '#ffffff' }),
      roof: M.mat('roof', 1, 1, { vertexColors: true, color: '#e4e4d2' }),
      tim: M.plain('#ffffff', { vertexColors: true, roughness: 0.8 }),
      stone: M.mat('stone', 1, 1, { vertexColors: true, color: '#ffffff' }),
      gold: M.gold,
      glow: M.plain('#6a4a2a', { emissive: '#ff9d3a', emissiveIntensity: 0.16, roughness: 0.8 }),
    };
    return <group>{Object.keys(geo).map((k) => (geo[k] ? <mesh key={k} geometry={geo[k]} material={mats[k]} castShadow receiveShadow /> : null))}</group>;
  }

  /* ---------- architectural pieces (into bags) ---------- */
  const T = '#3a2416';
  const FR = '#4a2c18';
  const SL = '#9a6230';
  const loc = (ox, oz, yaw, lx, lz) => [ox + lx * Math.cos(yaw) + lz * Math.sin(yaw), oz - lx * Math.sin(yaw) + lz * Math.cos(yaw)];
  /** Carved timber window on a wall whose outward direction is yaw (0 = +z). */
  function win(bag, ox, oy, oz, yaw, w, h, bars = 4, glow = false) {
    const put = (key, lx, ly, lz, bw, bh, bd, c) => { const [X, Z] = loc(ox, oz, yaw, lx, lz); B(bag, key, bw, bh, bd, X, oy + ly, Z, c, yaw); };
    put('tim', 0, 0, 0.02, w + 0.12, h + 0.12, 0.08, FR);
    if (glow) put('glow', 0, 0, 0.05, w, h, 0.06);
    else put('tim', 0, 0, 0.05, w, h, 0.06, '#150b06');
    for (let k = 0; k < bars; k += 1) put('tim', -w / 2 + ((k + 0.5) * w) / bars, 0, 0.085, 0.03, h * 0.92, 0.04, SL);
    if (bars) put('tim', 0, h * 0.15, 0.085, w, 0.03, 0.04, SL);
    put('tim', 0, -h / 2 - 0.07, 0.06, w + 0.18, 0.05, 0.14, FR);
  }
  /** Raked carved struts (tunala) holding an eave on all four sides. */
  function struts(bag, wx, wz, y, rise, runX, runZ, sp, c = T) {
    [[0, wx, wz / 2, runZ], [Math.PI, wx, wz / 2, runZ], [Math.PI / 2, wz, wx / 2, runX], [-Math.PI / 2, wz, wx / 2, runX]].forEach(([yaw, len, half, run]) => {
      const n = Math.max(2, Math.round((len * 0.88) / sp));
      const th = Math.atan2(run, rise); const L = Math.hypot(run, rise);
      for (let k = 0; k < n; k += 1) {
        const t = ((k + 0.5) / n - 0.5) * len * 0.92;
        const [X, Z] = loc(0, 0, yaw, t, half + run / 2);
        B(bag, 'tim', 0.12, L, 0.12, X, y - rise / 2, Z, c, yaw, th);
      }
    });
  }
  /** Dark soffit plate and fascia boards of a roof whose eave (w x d) sits at y. */
  function eave(bag, w, d, y, x = 0, z = 0, yaw = 0) {
    B(bag, 'tim', w, 0.14, d, x, y - 0.07, z, '#2a170d', yaw);
    const f = (lx, lz, bw, bd) => { const [X, Z] = loc(x, z, yaw, lx, lz); B(bag, 'tim', bw, 0.2, bd, X, y - 0.02, Z, '#3b2315', yaw); };
    f(0, d / 2, w + 0.04, 0.1); f(0, -d / 2, w + 0.04, 0.1); f(w / 2, 0, 0.1, d); f(-w / 2, 0, 0.1, d);
  }
  const BRICKS = ['#c4968a', '#bd8f80', '#b98c7c', '#c79d8c', '#b88a78'];

  /** One Newar brick house: tiled hip roof, shop opening, timber windows on the upper floors. */
  function house(bag, x, z, w, d, n, yaw, i, opt = {}) {
    const sh = 0.95; const H = sh * n;
    const plaster = i % 7 === 3;
    const c = plaster ? '#c9b896' : BRICKS[i % BRICKS.length];
    const wallKey = plaster ? 'tim' : 'brick';
    B(bag, wallKey, w, H, d, x, H / 2, z, c, yaw, 0);
    roofG(bag, w + 0.6, d + 0.6, 0.55, w * 0.5, 0.12, x, H - 0.12, z, { ry: yaw, moss: 0.2, seed: i * 1.7, N: 8, lift: 0.08, base: i % 4 === 0 ? '#8a6c48' : '#9a7a58' });
    eave(bag, w + 0.6, d + 0.6, H - 0.1, x, z, yaw);
    const put = (key, lx, ly, lz, bw, bh, bd, cc) => { const [X, Z] = loc(x, z, yaw, lx, lz); B(bag, key, bw, bh, bd, X, ly, Z, cc, yaw); };
    put('tim', 0, 0.45, d / 2 + 0.02, w * 0.62, 0.78, 0.06, '#1b0f08');
    put('tim', 0, 0.86, d / 2 + 0.04, w * 0.68, 0.08, 0.1, T);
    { const [AX, AZ] = loc(x, z, yaw, 0, d / 2 + 0.34); B(bag, 'tim', w * 0.66, 0.05, 0.7, AX, 1.02, AZ, ['#a8481f', '#2f5d7a', '#8a6a1c'][i % 3], yaw, 0.28); }
    for (let s = 1; s < n; s += 1) {
      put('tim', 0, s * sh, d / 2 + 0.03, w + 0.04, 0.07, 0.07, T);
      if ((i + s) % 3 === 0) { put('tim', 0, s * sh + 0.5, d / 2 + 0.14, w * 0.5, 0.58, 0.26, '#5a331a'); put('tim', 0, s * sh + 0.5, d / 2 + 0.28, w * 0.4, 0.4, 0.04, '#150b06'); put('tim', 0, s * sh + 0.78, d / 2 + 0.16, w * 0.54, 0.05, 0.32, T); }
      const k = w > 3.3 ? 3 : 2;
      for (let q = 0; q < k; q += 1) {
        const lx = (q - (k - 1) / 2) * (w / (k + 0.2));
        const gl = opt.glow && (i * 5 + s * 3 + q) % 3 === 0;
        const [X, Z] = loc(x, z, yaw, lx, d / 2);
        win(bag, X, s * sh + sh * 0.52, Z, yaw, 0.46, 0.52, 0, gl);
      }
    }
  }
  /** A tiled roof wrapped for yaw-rotated houses needs its own eave boards; keep houses simple: fascia is skipped for rotated ones. */

  /* =====================================================================
     THE TEMPLE
     ===================================================================== */
  function buildTemple() {
    const bag = newBag();
    const BR = '#c9795c';
    // plinth: two low steps, brick over stone
    B(bag, 'tim', 9.6, 0.17, 6.4, 0, 0.085, 0.5, '#a99a85', 0, 0, 1.8);
    B(bag, 'brick', 8.6, 0.17, 5.8, 0, 0.255, 0.4, '#d9a58f');
    B(bag, 'tim', 2.4, 0.17, 0.55, 0, 0.085, 4.0, '#a99a85', 0, 0, 1.8);
    B(bag, 'tim', 2.2, 0.17, 0.5, 0, 0.255, 3.55, '#a99a85', 0, 0, 1.8);
    // ground storey: tall solid brick
    B(bag, 'brick', 7.6, 3.06, 4.2, 0, 0.34 + 1.53, 0, BR);
    B(bag, 'tim', 7.8, 0.22, 4.4, 0, 3.28, 0, T);
    B(bag, 'tim', 7.7, 0.09, 4.3, 0, 1.0, 0, '#4a2c18');
    B(bag, 'tim', 7.7, 0.09, 4.3, 0, 2.3, 0, '#4a2c18');
    // central doorway framed by carved pillars
    B(bag, 'tim', 1.04, 1.3, 0.06, 0, 0.34 + 0.65, 2.12, '#1a0d07');
    B(bag, 'tim', 0.5, 1.2, 0.05, -0.26, 0.34 + 0.62, 2.16, '#5a331a');
    B(bag, 'tim', 0.5, 1.2, 0.05, 0.26, 0.34 + 0.62, 2.16, '#5a331a');
    [-0.62, 0.62].forEach((x) => B(bag, 'tim', 0.2, 1.4, 0.22, x, 0.34 + 0.7, 2.2, '#5a331a'));
    B(bag, 'tim', 1.7, 0.16, 0.24, 0, 1.76, 2.2, '#7a4a24');
    B(bag, 'tim', 1.3, 0.1, 0.2, 0, 1.9, 2.2, '#5a331a');
    // carved window over the door, flanking windows, pale panels
    B(bag, 'tim', 2.56, 0.84, 0.06, 0, 2.85, 2.11, '#d6c29c');
    win(bag, 0, 2.85, 2.1, 0, 2.2, 0.5, 11);
    [-1, 1].forEach((sx) => {
      win(bag, sx * 2.05, 1.7, 2.1, 0, 0.9, 0.85, 6);
      win(bag, sx * 3.15, 1.7, 2.1, 0, 0.6, 0.85, 4);
      B(bag, 'tim', 0.56, 0.42, 0.06, sx * 2.6, 2.85, 2.13, FR);
      B(bag, 'tim', 0.46, 0.32, 0.07, sx * 2.6, 2.85, 2.15, '#cfbd9a');
    });
    // sides and back
    [-1, 1].forEach((sx) => [-1.2, 0, 1.2].forEach((z) => win(bag, sx * 3.8, 2.0, z, sx * Math.PI / 2, 0.7, 0.85, 4)));
    [-2.4, 0, 2.4].forEach((x) => win(bag, x, 2.0, -2.1, Math.PI, 0.8, 0.85, 4));
    // porch of timber posts with carved brackets and a beam
    for (let k = 0; k < 6; k += 1) {
      const x = -3.7 + (k * 7.4) / 5;
      B(bag, 'tim', 0.17, 1.78, 0.17, x, 0.34 + 0.89, 2.65, '#4e2d17');
      B(bag, 'tim', 0.32, 0.14, 0.32, x, 0.41, 2.65, '#a99a85', 0, 0, 1.8);
      B(bag, 'tim', 0.36, 0.12, 0.24, x, 2.14, 2.65, '#5a331a');
    }
    B(bag, 'tim', 7.95, 0.14, 0.2, 0, 2.3, 2.65, '#4a2916');
    // pedestals with small brass figures on the plinth ledge
    [-3.4, -2.3, 2.3, 3.4].forEach((x) => { B(bag, 'tim', 0.3, 0.3, 0.3, x, 0.32, 3.5, '#a99a85', 0, 0, 1.8); B(bag, 'gold', 0.16, 0.22, 0.16, x, 0.58, 3.5, '#ffffff'); });
    // stacked planks and chariot parts beside the plinth
    [0, 1, 2].forEach((k) => B(bag, 'tim', 1.8, 0.07, 0.3, -5.6, 0.1 + k * 0.1, 2.6 + (k % 2) * 0.05, '#6e4222', 0.15 * k));
    const mark = Object.fromEntries(Object.keys(bag).map((k) => [k, bag[k].length]));
    // roof 1 (huge, mossy) on raked struts
    roofG(bag, 9.4, 5.8, 1.05, 4.2, 2.4, 0, 2.95, 0, { moss: 1.6, seed: 1, N: 34, lift: 0.3, base: '#9c7a55', mossC: '#6f9238' });
    eave(bag, 9.4, 5.8, 2.95);
    struts(bag, 7.6, 4.2, 2.86, 0.8, 0.9, 0.8, 0.55);
    // storey 2
    const band = (w, d, y, h) => { B(bag, 'tim', w + 0.04, h, 0.05, 0, y, d / 2 + 0.01, '#2e1a0e'); B(bag, 'tim', w + 0.04, h, 0.05, 0, y, -d / 2 - 0.01, '#2e1a0e'); B(bag, 'tim', 0.05, h, d + 0.04, w / 2 + 0.01, y, 0, '#2e1a0e'); B(bag, 'tim', 0.05, h, d + 0.04, -w / 2 - 0.01, y, 0, '#2e1a0e'); };
    B(bag, 'brick', 4.2, 1.4, 2.4, 0, 4.65, 0, BR);
    band(4.2, 2.4, 4.65, 0.8);
    B(bag, 'tim', 4.3, 0.12, 2.5, 0, 5.34, 0, T);
    for (let q = 0; q < 5; q += 1) {
      const x = (q - 2) * 0.72;
      win(bag, x, 4.65, 1.2, 0, 0.5, 0.6, 4); win(bag, x, 4.65, -1.2, Math.PI, 0.5, 0.6, 4);
    }
    [-1, 1].forEach((sx) => [-0.72, 0, 0.72].forEach((z) => win(bag, sx * 2.1, 4.65, z, sx * Math.PI / 2, 0.5, 0.6, 4)));
    roofG(bag, 6.6, 3.8, 0.8, 2.2, 1.2, 0, 5.35, 0, { moss: 0.5, seed: 3, N: 24, lift: 0.24, base: '#8c694a', mossC: '#6f9238' });
    eave(bag, 6.6, 3.8, 5.35);
    struts(bag, 4.2, 2.4, 5.3, 0.5, 1.2, 0.7, 0.5);
    // storey 3
    B(bag, 'brick', 2.2, 1.0, 1.2, 0, 6.6, 0, BR);
    band(2.2, 1.2, 6.6, 0.6);
    B(bag, 'tim', 2.3, 0.1, 1.3, 0, 7.12, 0, T);
    [-0.6, 0, 0.6].forEach((x) => { win(bag, x, 6.6, 0.6, 0, 0.42, 0.5, 3); win(bag, x, 6.6, -0.6, Math.PI, 0.42, 0.5, 3); });
    [-1, 1].forEach((sx) => win(bag, sx * 1.1, 6.6, 0, sx * Math.PI / 2, 0.42, 0.5, 3));
    roofG(bag, 3.9, 2.2, 0.7, 2.2, 1.2, 0, 7.15, 0, { moss: 0.05, seed: 5, N: 18, base: '#6a4830', mossC: '#4f5f2c' });
    eave(bag, 3.9, 2.2, 7.15);
    struts(bag, 2.2, 1.2, 7.1, 0.45, 0.85, 0.5, 0.55);
    // top roof ridge and gilded base
    B(bag, 'roof', 2.1, 0.18, 0.6, 0, 7.94, 0, '#4a2e1c');
    B(bag, 'gold', 1.9, 0.12, 0.3, 0, 8.08, 0, '#ffffff');
    // hanging brass ornaments at the eave corners
    [[4.55, 2.75, 2.8], [6.6 / 2 + 0, 5.25, 1.85], [1.9, 7.05, 1.05]].forEach(([x, y, z]) => [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => B(bag, 'gold', 0.09, 0.2, 0.09, sx * x, y, sz * z, '#ffffff'))));
    Object.keys(bag).forEach((k) => bag[k].slice(mark[k]).forEach((g) => g.translate(0, 0.5, 0)));
    return bag;
  }
  function TempleMain() {
    const M = useM();
    const bag = useMemo(buildTemple, []);
    const wood = M.plain('#6a3c1e', { roughness: 0.85 });
    const wheelDark = M.plain('#3b2414', { roughness: 0.85 });
    return (
      <group>
        <BagMesh bag={bag} />
        {/* five-spike gilded pinnacle: tall centre spire with smaller flanking finials */}
        {[[-1.0, 0.3], [-0.5, 0.45], [0, 0.8], [0.5, 0.45], [1.0, 0.3]].map(([x, s], i) => (
          <group key={i} position={[x, 0, 0]}><Gajur y={8.58} s={s} /></group>
        ))}
        {/* stone lions flanking the doorway */}
        {[-1.05, 1.05].map((x) => <group key={x} position={[x, 0.34, 3.0]} scale={1.3}><Lion m={M.stone} /></group>)}
        {/* chariot wheels of the Bisket Jatra leaning at the right */}
        {[[14.2, 0.85, 7.6], [16.4, 0.85, 9.4], [12.8, 0.85, 10.6]].map(([x, y, z], i) => (
          <group key={i} position={[x, y, z]} rotation={[0, 0.25, 0]}>
            <Cyl rt={0.85} rb={0.85} h={0.22} r={[Math.PI / 2, 0, 0]} m={wood} seg={20} />
            <Cyl rt={0.24} rb={0.24} h={0.34} r={[Math.PI / 2, 0, 0]} m={wheelDark} seg={10} />
            <Box s={[1.96, 0.12, 0.14]} p={[0, 0, 0.1]} m={wheelDark} />
            <Box s={[0.12, 1.96, 0.14]} p={[0, 0, 0.1]} m={wheelDark} />
            <Box s={[1.4, 0.1, 0.14]} p={[0, 0, 0.1]} r={[0, 0, 0.785]} m={wheelDark} />
            <Box s={[1.4, 0.1, 0.14]} p={[0, 0, 0.1]} r={[0, 0, -0.785]} m={wheelDark} />
          </group>
        ))}
        {/* diyas on the plinth */}
        {[-1.6, -0.8, 0.8, 1.6].map((x, i) => <group key={x} scale={3.2}><Diyo p={[x / 3.2, 0.17 / 3.2 + 0.006, 4.0 / 3.2]} light={i % 2 === 0} /></group>)}
        <Frame s={[12.4, 10.2, 7.2]} p={[0.4, 5.1, 0.7]} />
      </group>
    );
  }

  /* =====================================================================
     THE SQUARE: Nyatapola, Betal temple, brick houses, hills
     ===================================================================== */
  function nyatapola(bag, cx, cz) {
    const sw = [13.4, 11.6, 10.0, 8.6, 7.4];
    sw.forEach((w, i) => B(bag, 'tim', w, 0.62, w, cx, 0.31 + i * 0.62, cz, '#b3a58e', 0, 0, 2));
    B(bag, 'tim', 2.6, 0.62 * 5, 0.0 + 1.0, cx, 0.31 * 5, cz + 6.3, '#b3a58e', 0, 0, 2);
    const wallW = [5.6, 4.8, 4.1, 3.4, 2.7];
    const roofW = [8.6, 7.4, 6.3, 5.3, 4.3];
    for (let i = 0; i < 5; i += 1) {
      const b = 3.1 + i * 2.45; const w = wallW[i]; const rw = roofW[i];
      B(bag, 'brick', w, 1.6, w, cx, b + 0.8, cz, '#f5b296');
      B(bag, 'tim', w + 0.1, 0.14, w + 0.1, cx, b + 1.52, cz, T);
      B(bag, 'tim', w + 0.08, 0.1, w + 0.08, cx, b + 0.5, cz, FR);
      [[0, 1], [Math.PI, 1], [Math.PI / 2, 1], [-Math.PI / 2, 1]].forEach(([yaw]) => {
        const [wx, wz] = loc(cx, cz, yaw, 0, w / 2);
        [-1, 0, 1].forEach((q) => { const [X, Z] = loc(wx, wz, yaw, q * w * 0.28, 0); win(bag, X, b + 1.0, Z, yaw, w * 0.16, 0.45, 0); });
      });
      const next = i < 4 ? wallW[i + 1] : 0.7;
      roofG(bag, rw, rw, 0.85, next, next, cx, b + 1.65, cz, { moss: 0.5, seed: i * 2.3, N: 20 });
      eave(bag, rw, rw, b + 1.65, cx, cz);
      const run = (rw - w) / 2;
      const grp = newBag();
      struts(grp, w, w, b + 1.58, 0.7, run, run, 0.6);
      grp.tim.forEach((g) => { g.translate(cx, 0, cz); bag.tim.push(g); });
    }
    B(bag, 'gold', 0.8, 0.12, 0.8, cx, 15.5, cz, '#ffffff');
  }
  const BX = 10.8; const BZ = 3;
  function betal(outer, cx, cz) {
    const bag = newBag(); const BRK = '#c9795c'; const k0 = 0.74;
    B(bag, 'tim', 4.4, 0.18, 4.4, cx, 0.09, cz, '#b3a58e', 0, 0, 1.8);
    B(bag, 'tim', 3.8, 0.18, 3.8, cx, 0.27, cz, '#a99a85', 0, 0, 1.8);
    B(bag, 'tim', 1.6, 0.18, 0.5, cx, 0.09, cz + 2.4, '#b3a58e', 0, 0, 1.8);
    B(bag, 'brick', 2.7, 1.8, 2.7, cx, 1.26, cz, BRK);
    B(bag, 'tim', 2.8, 0.12, 2.8, cx, 2.2, cz, T);
    B(bag, 'tim', 0.84, 1.2, 0.06, cx, 0.96, cz + 1.37, '#150b06');
    [-0.5, 0.5].forEach((x) => B(bag, 'tim', 0.12, 1.25, 0.14, cx + x, 0.98, cz + 1.4, '#5a331a'));
    win(bag, cx - 1.0, 1.55, cz + 1.35, 0, 0.4, 0.5, 3); win(bag, cx + 1.0, 1.55, cz + 1.35, 0, 0.4, 0.5, 3);
    [-1, 1].forEach((sx) => win(bag, cx + sx * 1.35, 1.55, cz, sx * Math.PI / 2, 0.5, 0.5, 3));
    roofG(bag, 4.9, 4.9, 0.9, 1.9, 1.9, cx, 2.2, cz, { moss: 0.5, seed: 9, N: 16, lift: 0.2, base: '#8c694a', mossC: '#6f9238' });
    eave(bag, 4.9, 4.9, 2.2, cx, cz);
    const sb = newBag(); struts(sb, 2.7, 2.7, 2.15, 0.6, 1.1, 1.1, 0.6); sb.tim.forEach((g) => { g.translate(cx, 0, cz); bag.tim.push(g); });
    B(bag, 'brick', 1.9, 1.1, 1.9, cx, 3.65, cz, BRK);
    B(bag, 'tim', 2.0, 0.1, 2.0, cx, 4.2, cz, T);
    win(bag, cx, 3.7, cz + 0.95, 0, 0.8, 0.5, 5); win(bag, cx, 3.7, cz - 0.95, Math.PI, 0.8, 0.5, 5);
    [-1, 1].forEach((sx) => win(bag, cx + sx * 0.95, 3.7, cz, sx * Math.PI / 2, 0.8, 0.5, 5));
    roofG(bag, 3.4, 3.4, 0.75, 0.6, 0.6, cx, 4.22, cz, { moss: 0.2, seed: 4, N: 14, base: '#6a4830' });
    eave(bag, 3.4, 3.4, 4.22, cx, cz);
    B(bag, 'gold', 0.7, 0.14, 0.7, cx, 5.05, cz, '#ffffff');
    Object.keys(bag).forEach((k) => bag[k].forEach((g) => { g.scale(k0, k0, k0); g.translate(BX, 0, BZ); outer[k].push(g); }));
  }
  function stall(bag, x, z, c, yaw = 0) {
    [[-0.6, -0.4], [0.6, -0.4], [-0.6, 0.4], [0.6, 0.4]].forEach(([a, b]) => { const [X, Z] = loc(x, z, yaw, a, b); B(bag, 'tim', 0.07, 1.0, 0.07, X, 0.5, Z, '#4e2d17'); });
    B(bag, 'tim', 1.5, 0.05, 1.1, x, 1.05, z, c, yaw, 0.12);
    B(bag, 'tim', 1.1, 0.35, 0.6, x, 0.2, z, '#6e4222', yaw);
    B(bag, 'glow', 0.25, 0.14, 0.25, x - 0.3, 0.45, z, '#ffffff'); B(bag, 'gold', 0.2, 0.2, 0.2, x + 0.3, 0.47, z, '#ffffff');
  }
  function shrine(bag, x, z) {
    B(bag, 'tim', 1.3, 0.2, 1.3, x, 0.1, z, '#a99a85', 0, 0, 1.8);
    B(bag, 'brick', 0.8, 0.8, 0.8, x, 0.6, z, '#d9886a');
    B(bag, 'tim', 0.34, 0.5, 0.05, x, 0.45, z + 0.42, '#150b06');
    roofG(bag, 1.5, 1.5, 0.45, 0.3, 0.3, x, 1.0, z, { moss: 0.3, seed: x, N: 8 });
    B(bag, 'gold', 0.12, 0.3, 0.12, x, 1.58, z, '#ffffff');
  }
  function buildSquare() {
    const bag = newBag();
    nyatapola(bag, -21, -1);
    betal(bag, 0, 0);
    // brick and stone paving in front of the temple
    B(bag, 'brick', 26, 0.03, 26, 0, 0.015, 17, '#bd8870');
    const PT = ['#c4917a', '#b58068', '#c99b84', '#ae7b66', '#bf8a72'];
    for (let a = -5; a <= 5; a += 1) for (let c = 0; c < 11; c += 1) { if ((a * 7 + c * 3) % 3 !== 0) B(bag, 'brick', 2.15, 0.034, 2.15, a * 2.2, 0.02, 5.4 + c * 2.2, PT[(a * 5 + c * 3 + 50) % 5]); }
    B(bag, 'tim', 2.4, 0.045, 24, 0, 0.025, 17, '#b3a08a', 0, 0, 1.8);
    stall(bag, -7.5, 7.2, '#d9701f', 0.3); stall(bag, 10.5, 8, '#2f5d7a', -0.3); stall(bag, 13.5, 6, '#a8481f', 0.1);
    shrine(bag, -5.2, 8.2); shrine(bag, 4.2, 9.5);
    // chariot platform and yoke beam of the Bisket Jatra
    B(bag, 'tim', 2.6, 0.5, 2.6, 11.5, 0.25, 11.5, '#6a3c1e', 0.3);
    B(bag, 'tim', 0.28, 0.28, 7, 11.5, 0.7, 12.5, '#4e2d17', 0.3);
    // low brick dance platform (pati) in the square
    B(bag, 'brick', 6.4, 0.55, 3.2, -9.5, 0.275, 12, '#d99a80');
    B(bag, 'tim', 6.8, 0.1, 3.6, -9.5, 0.58, 12, '#a99a85', 0, 0, 1.8);
    // houses: [x, z, w, d, storeys, yaw]; cursor helpers
    let idx = 0;
    const H = (x, z, w, d, n, yaw = 0, glow = true) => { house(bag, x, z, w, d, n, yaw, idx, { glow }); idx += 1; };
    // left of the temple (towards Nyatapola)
    [[-7.9, -0.2, 3.4, 4.4, 3], [-11.3, -0.2, 3.4, 4.4, 3]].forEach((a) => H(...a));
    // right of the temple, beyond Betal
    [[15.2, -0.4, 3.4, 4.4, 3], [18.6, -0.4, 3.4, 4.4, 3], [22.0, -0.4, 3.4, 4.4, 4], [25.4, -0.4, 3.4, 4.4, 3]].forEach((a) => H(...a));
    // behind the temple: two continuous rows
    for (let k = 6; k < 17; k += 1) H(-27 + k * 3.45, -6.6, 3.4, 4.2, 3 + ((k * 7) % 5 === 0 ? 1 : 0), 0);
    for (let k = 3; k < 15; k += 1) H(-25 + k * 3.6, -11.6, 3.5, 4.2, 3 + ((k * 5) % 4 === 0 ? 1 : 0), 0, false);
    // flanks of the square
    for (let k = 0; k < 8; k += 1) H(33, -3 + k * 4.3, 3.6, 3.6, 3 + (k % 2), -Math.PI / 2);
    for (let k = 0; k < 6; k += 1) H(-34, -8 + k * 4.3 + 25, 3.6, 3.6, 3 + (k % 2), Math.PI / 2, false);
    // far side of the square (behind the viewer)
    for (let k = 0; k < 14; k += 1) H(-24 + k * 3.7, 40, 3.5, 3.8, 3 + (k % 2), Math.PI, false);
    // orange cloth banner on the house at the right
    B(bag, 'tim', 0.06, 1.6, 0.9, 15.2 - 1.72, 2.4, 2.4, '#d9701f');
    return bag;
  }
  function TempleEnv() {
    const M = useM();
    const bag = useMemo(buildSquare, []);
    const paving = M.plain('#8d6a56', { roughness: 1 });
    const far = M.mat('grass', 40, 40, { color: '#a8b878' });
    const hill = (c) => M.plain(c, { roughness: 1 });
    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow material={paving}><circleGeometry args={[46, 64]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} receiveShadow material={far}><circleGeometry args={[150, 48]} /></mesh>
        {/* stone paving strip leading from the temple steps into the square */}
        
        <BagMesh bag={bag} />
        {/* Nyatapola pinnacle */}
        <group position={[-21, 0, -1]}><Gajur y={15.55} s={2.1} /></group>
        <group position={[BX, 0, BZ]}><Gajur y={5.08 * 0.74} s={0.55} /></group>
        {[-0.8, 0.8].map((x) => <group key={x} position={[BX + x * 0.8, 0.27, BZ + 1.8]} scale={0.66}><Lion m={M.stone} /></group>)}
        {/* Betal temple lion pair is omitted; green Kathmandu Valley hills on the horizon */}
        {[[-80, -2, -125, 60, 0.2], [-10, -2, -140, 70, 0.24], [70, -2, -130, 60, 0.2], [125, -2, -100, 48, 0.2], [-130, -2, -95, 48, 0.2]].map(([x, y, z, r, k], i) => (
          <Ball key={i} rad={r} p={[x, y, z]} sc={[1.7, k, 1]} m={hill(i % 2 ? '#4a6a58' : '#41604f')} />
        ))}
      </group>
    );
  }

  return { 'bhairavnath-temple': { Main: TempleMain, Env: TempleEnv } };
}
