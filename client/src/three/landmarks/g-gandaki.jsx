// Hand-built landmarks for Gandaki Province (and nearby hill towns): Gorkha, Pokhara, Bandipur, Mustang, Kali Gandaki, Devghat, Baglung.
import { useMemo, useRef, useLayoutEffect } from 'react';

export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Gajur, Doorway, LatticeWindow, EaveStruts, Spire, PrayerFlags, Lion, Frame, Water, THREE, wallMat, roofMat, lighten, Trident, Chaitya, Lingam, Nandi, BellPavilion, Chhatri, TripleWindow, Elephant, Diyo, ringOf, Tree, SacredTree } = K;

  /* ================= shared helpers ================= */
  const hash2 = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
  const vn = (x, y) => {
    const xi = Math.floor(x); const yi = Math.floor(y); const xf = x - xi; const yf = y - yi;
    const u = xf * xf * (3 - 2 * xf); const v = yf * yf * (3 - 2 * yf);
    const a = hash2(xi, yi); const b = hash2(xi + 1, yi); const c = hash2(xi, yi + 1); const d = hash2(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  const fbm = (x, y) => vn(x, y) * 0.55 + vn(x * 2.1 + 5.2, y * 2.1 + 1.3) * 0.3 + vn(x * 4.3 + 9.1, y * 4.3 + 3.7) * 0.15;
  const prng = (seed) => { let s = (seed * 9301 + 49297) % 233280; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; };
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const mix = (a, b, t) => a + (b - a) * t;
  const PAPER = '#f0b49c';

  /** Procedural light paving: grid of slabs with tonal variation (the kit stone textures read far too dark). */
  const slabCache = new Map();
  function slabMat(color = '#d9cfbd', rx = 4, ry = 4) {
    const key = `${color}|${rx}|${ry}`;
    if (!slabCache.has(key)) {
      const c = document.createElement('canvas'); c.width = 256; c.height = 256;
      const g = c.getContext('2d'); g.fillStyle = '#b9b2a4'; g.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 4; i += 1) for (let j = 0; j < 4; j += 1) { const v = 232 + Math.floor(hash2(i * 3.1 + rx, j * 7.7 + ry) * 22); g.fillStyle = `rgb(${v},${v},${v - 5})`; g.fillRect(i * 64 + 2, j * 64 + 2, 60, 60); }
      const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
      slabCache.set(key, new THREE.MeshStandardMaterial({ map: t, color, roughness: 0.95 }));
    }
    return slabCache.get(key);
  }
  /** Procedural dressed-stone masonry: courses of stones of varied width and tone, dark mortar between. */
  const wallCache = new Map();
  function stoneM(color = '#b9b1a2', rx = 3, ry = 1) {
    const key = `${color}|${rx}|${ry}`;
    if (!wallCache.has(key)) {
      const c = document.createElement('canvas'); c.width = 256; c.height = 256;
      const g = c.getContext('2d'); g.fillStyle = '#7d766a'; g.fillRect(0, 0, 256, 256);
      let y = 0; let row = 0;
      while (y < 256) {
        const h = 26 + Math.floor(hash2(row, rx + 1) * 14); let x = -Math.floor(hash2(row, 3) * 40);
        while (x < 256) {
          const w = 38 + Math.floor(hash2(x * 0.1 + row, row * 1.7) * 52); const v = 196 + Math.floor(hash2(x * 0.3, row * 2.1 + 5) * 52);
          g.fillStyle = `rgb(${v},${v - 4},${v - 12})`; g.fillRect(x + 2, y + 2, w - 4, h - 4); x += w;
        }
        y += h; row += 1;
      }
      const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
      wallCache.set(key, new THREE.MeshStandardMaterial({ map: t, color, roughness: 1 }));
    }
    return wallCache.get(key);
  }
  /** Faceted, untextured crag material for cliffs and boulders. */
  const cragCache = new Map();
  const crag = (color) => { if (!cragCache.has(color)) cragCache.set(color, new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 1 })); return cragCache.get(color); };
  const G = (M) => M.plain('#e4b43e', { metalness: 0.5, roughness: 0.38, emissive: '#7a5410', emissiveIntensity: 0.3 });

  /** Many copies of one simple shape in a single draw call. items: [{p, s, r, c}]. */
  function Inst({ items, geo = 'box', m, cast = true, seg = 8 }) {
    const ref = useRef();
    useLayoutEffect(() => {
      const o = new THREE.Object3D();
      const col = new THREE.Color();
      items.forEach((it, i) => {
        o.position.set(it.p[0], it.p[1], it.p[2]);
        o.rotation.set(...(it.r || [0, 0, 0]));
        o.scale.set(...(it.s || [1, 1, 1]));
        o.updateMatrix();
        ref.current.setMatrixAt(i, o.matrix);
        if (it.c) ref.current.setColorAt(i, col.set(it.c));
      });
      ref.current.instanceMatrix.needsUpdate = true;
      if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    }, [items]);
    if (!items.length) return null;
    return (
      <instancedMesh key={items.length} ref={ref} args={[null, null, items.length]} material={m} castShadow={cast} receiveShadow frustumCulled={false}>
        {geo === 'box' && <boxGeometry args={[1, 1, 1]} />}
        {geo === 'cyl' && <cylinderGeometry args={[1, 1, 1, seg]} />}
        {geo === 'cone' && <coneGeometry args={[1, 1, seg]} />}
        {geo === 'ball' && <sphereGeometry args={[1, 10, 8]} />}
        {geo === 'rock' && <icosahedronGeometry args={[1, 0]} />}
      </instancedMesh>
    );
  }

  /** Coloured height-field terrain in one mesh. hf(x,z) -> y; cf(x,z,y) -> colour. */
  function Terrain({ w, d, nx = 80, nz = 80, hf, cf, p = [0, 0, 0], flat = true, fog = true }) {
    const geo = useMemo(() => {
      const pos = []; const col = []; const idx = []; const c = new THREE.Color();
      for (let j = 0; j <= nz; j += 1) {
        for (let i = 0; i <= nx; i += 1) {
          const x = -w / 2 + (w * i) / nx; const z = -d / 2 + (d * j) / nz; const y = hf(x, z);
          pos.push(x, y, z); c.set(cf(x, z, y)); col.push(c.r, c.g, c.b);
        }
      }
      for (let j = 0; j < nz; j += 1) {
        for (let i = 0; i < nx; i += 1) {
          const a = j * (nx + 1) + i; const b = a + 1; const cc = a + nx + 1; const e = cc + 1;
          idx.push(a, cc, b, b, cc, e);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.setIndex(idx); g.computeVertexNormals();
      return g;
    }, []);
    const mat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: flat, fog }), []);
    return <mesh geometry={geo} material={mat} position={p} receiveShadow />;
  }

  /** A mountain range backdrop (snow peaks above brown or green foothills) built from a list of peaks. */
  function Range({ p, w = 150, d = 40, peaks, snowAt = 16, lo = '#6c6a63', hi = '#8d8a86', foot = null, footH = 3, seed = 1, rot = 0 }) {
    const HS = 0.72; const SA = snowAt * HS;
    const hf = useMemo(() => (x, z) => {
      let y = 0;
      for (const k of peaks) {
        const dx = (x - k.x) / (k.sx || k.s); const dz = (z - k.z) / (k.sz || k.s);
        const t = Math.max(0, 1 - Math.hypot(dx, dz));
        const v = k.h * HS * Math.pow(t, k.k || 1.25) * (1 + (fbm(x * 0.13 + seed, z * 0.13) - 0.5) * 0.7 * t);
        if (v > y) y = v;
      }
      return y + fbm(x * 0.07 + seed * 3, z * 0.07) * 2.4;
    }, []);
    const cf = useMemo(() => (x, z, y) => {
      const sl = SA + (fbm(x * 0.2, z * 0.2 + seed) - 0.5) * SA * 0.35;
      const haze = (col) => new THREE.Color(col).lerp(new THREE.Color('#eadcc8'), (1 - smooth(1, 15, y)) * 0.93).getStyle();
      if (y > sl) return y > sl + 3 ? '#f7f9fd' : '#e6ecf4';
      if (foot && y < footH) return haze(foot);
      const t = Math.min(1, y / (SA * 1.1)); const n = fbm(x * 0.4, z * 0.4);
      const c1 = new THREE.Color(lo); const c2 = new THREE.Color(hi);
      return haze(c1.lerp(c2, Math.min(1, t * 0.8 + n * 0.35)).getStyle());
    }, []);
    return (
      <group position={p} rotation={[0, rot, 0]}>
        <Terrain w={w} d={d} nx={Math.round(w * 0.7)} nz={Math.round(d * 0.7)} hf={hf} cf={cf} fog={false} />
      </group>
    );
  }

  /** Scatter trees on a terrain, using rejection sampling. kind: pine | broad | sal | poplar. */
  function Forest({ n, hf = () => 0, ok = () => true, seed = 1, area = [60, 60], center = [0, 0], sc = [0.8, 1.5], kind = 'pine', cols, lift = 0 }) {
    const M = useM();
    const { trunks, crowns, crowns2 } = useMemo(() => {
      const r = prng(seed); const tr = []; const cr = []; const cr2 = [];
      const palette = cols || (kind === 'pine' ? ['#2f5a34', '#3a6a3a', '#27502f'] : kind === 'poplar' ? ['#d6b44a', '#c9a23a', '#b59a3a'] : ['#4d7a3a', '#5b8a40', '#3f6c34']);
      let tries = 0;
      while (tr.length < n && tries < n * 20) {
        tries += 1;
        const x = center[0] + (r() - 0.5) * area[0]; const z = center[1] + (r() - 0.5) * area[1];
        if (!ok(x, z)) continue;
        const y = hf(x, z) + lift; const s = mix(sc[0], sc[1], r()); const c = palette[Math.floor(r() * palette.length)];
        if (kind === 'pine') {
          tr.push({ p: [x, y + 0.5 * s, z], s: [0.1 * s, 1.0 * s, 0.1 * s], c: '#5a4030' });
          cr.push({ p: [x, y + 1.35 * s, z], s: [0.62 * s, 1.5 * s, 0.62 * s], c });
          cr2.push({ p: [x, y + 2.0 * s, z], s: [0.42 * s, 1.1 * s, 0.42 * s], c });
        } else if (kind === 'sal') {
          tr.push({ p: [x, y + 1.3 * s, z], s: [0.09 * s, 2.6 * s, 0.09 * s], c: '#6a5444' });
          cr.push({ p: [x, y + 2.9 * s, z], s: [0.75 * s, 0.7 * s, 0.75 * s], c });
          cr2.push({ p: [x + 0.2 * s, y + 2.4 * s, z - 0.1 * s], s: [0.5 * s, 0.45 * s, 0.5 * s], c });
        } else if (kind === 'poplar') {
          tr.push({ p: [x, y + 0.9 * s, z], s: [0.07 * s, 1.8 * s, 0.07 * s], c: '#7a6a58' });
          cr.push({ p: [x, y + 2.0 * s, z], s: [0.32 * s, 1.5 * s, 0.32 * s], c });
        } else {
          tr.push({ p: [x, y + 0.5 * s, z], s: [0.11 * s, 1.0 * s, 0.11 * s], c: '#5a4030' });
          cr.push({ p: [x, y + 1.4 * s, z], s: [0.8 * s, 0.7 * s, 0.8 * s], c });
          cr2.push({ p: [x + 0.3 * s, y + 1.1 * s, z + 0.1 * s], s: [0.55 * s, 0.5 * s, 0.55 * s], c });
        }
      }
      return { trunks: tr, crowns: cr, crowns2: cr2 };
    }, []);
    const leaf = M.plain('#ffffff', { roughness: 1 });
    const bark = M.plain('#ffffff', { roughness: 1 });
    const cg = kind === 'pine' || kind === 'poplar' ? 'cone' : 'ball';
    return (
      <group>
        <Inst items={trunks} geo="cyl" m={bark} seg={6} cast={false} />
        <Inst items={crowns} geo={cg} m={leaf} seg={7} cast={false} />
        {crowns2.length > 0 && <Inst items={crowns2} geo={cg} m={leaf} seg={7} cast={false} />}
      </group>
    );
  }

  /** Flat strip along a smooth curve through [x,z] points: rivers, paths, streets. */
  function Ribbon({ pts, w = 2, y = 0.01, color = '#5b7f80', metal = 0.05, rough = 0.35, m, seg = 40, wf }) {
    const geo = useMemo(() => {
      const curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, y, z)));
      const P = curve.getPoints(seg);
      const pos = []; const uv = []; const idx = [];
      P.forEach((q, i) => {
        const a = P[Math.max(0, i - 1)]; const b = P[Math.min(P.length - 1, i + 1)];
        let dx = b.x - a.x; let dz = b.z - a.z; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
        const hw = (wf ? wf(i / (P.length - 1)) : w) / 2;
        pos.push(q.x - dz * hw, y, q.z + dx * hw, q.x + dz * hw, y, q.z - dx * hw);
        uv.push(0, i / 6, 1, i / 6);
        if (i < P.length - 1) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setIndex(idx); g.computeVertexNormals();
      return g;
    }, []);
    const mat = useMemo(() => m || new THREE.MeshStandardMaterial({ color, metalness: metal, roughness: rough, side: THREE.DoubleSide }), []);
    return <mesh geometry={geo} material={mat} receiveShadow />;
  }

  /** A flight of steps from a (top) to b (bottom), each step a box. solid: fill down to the base height. */
  function Stair({ a, b, w = 1.4, n = 12, m, rise, solid = false, base = 0 }) {
    const items = useMemo(() => {
      const dx = a[0] - b[0]; const dz = a[2] - b[2]; const yaw = Math.atan2(dx, dz); const L = Math.hypot(dx, dz);
      const run = L / n; const out = [];
      for (let k = 0; k < n; k += 1) {
        const t = (k + 1) / n; const x = b[0] + dx * (k + 0.5) / n; const z = b[2] + dz * (k + 0.5) / n;
        const top = b[1] + (a[1] - b[1]) * t; const hgt = solid ? top - base : (rise || Math.abs(a[1] - b[1]) / n) * 1.5;
        out.push({ p: [x, solid ? base + hgt / 2 : top - hgt / 2, z], s: [w, hgt, run * 1.04], r: [0, yaw, 0] });
      }
      return out;
    }, []);
    return <Inst items={items} m={m} />;
  }

  /** Posts joined by a rail along a polyline of [x,y,z] points (chain-link fence, balustrade). */
  function Rail({ pts, h = 0.45, m, bar, gap = 0.55, closed = false, thick = 0.035 }) {
    const { posts, bars } = useMemo(() => {
      const P = closed ? [...pts, pts[0]] : pts; const ps = []; const bs = [];
      for (let i = 0; i < P.length - 1; i += 1) {
        const [x1, y1, z1] = P[i]; const [x2, y2, z2] = P[i + 1];
        const L = Math.hypot(x2 - x1, z2 - z1); const n = Math.max(1, Math.round(L / gap)); const yaw = Math.atan2(x2 - x1, z2 - z1);
        for (let k = 0; k <= n; k += 1) { const t = k / n; ps.push({ p: [mix(x1, x2, t), mix(y1, y2, t) + h / 2, mix(z1, z2, t)], s: [thick * 1.4, h, thick * 1.4] }); }
        bs.push({ p: [(x1 + x2) / 2, (y1 + y2) / 2 + h, (z1 + z2) / 2], s: [thick, thick, L], r: [Math.atan2(y2 - y1, L) * -1, yaw, 0] });
        bs.push({ p: [(x1 + x2) / 2, (y1 + y2) / 2 + h * 0.55, (z1 + z2) / 2], s: [thick * 0.6, thick * 0.6, L], r: [Math.atan2(y2 - y1, L) * -1, yaw, 0] });
      }
      return { posts: ps, bars: bs };
    }, []);
    return <group><Inst items={posts} m={m} cast={false} /><Inst items={bars} m={bar || m} cast={false} /></group>;
  }

  /** A displaced boulder / cliff chunk. */
  const rockGeoCache = new Map();
  function rockGeo(seed, detail = 1) {
    const key = `${seed}|${detail}`;
    if (!rockGeoCache.has(key)) {
      const g = new THREE.IcosahedronGeometry(1, detail);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i += 1) {
        const x = p.getX(i); const y = p.getY(i); const z = p.getZ(i);
        const k = 0.78 + fbm(x * 1.7 + seed, z * 1.7 + y * 1.3) * 0.55;
        p.setXYZ(i, x * k, y * k, z * k);
      }
      g.computeVertexNormals();
      rockGeoCache.set(key, g);
    }
    return rockGeoCache.get(key);
  }
  function Rock({ p = [0, 0, 0], s = [1, 1, 1], r = [0, 0, 0], seed = 1, m, c, detail = 1 }) {
    return <mesh position={p} scale={s} rotation={r} geometry={rockGeo(seed, detail)} material={c ? crag(c) : m} castShadow receiveShadow />;
  }

  /** Suspension-bridge cable or hanging line through [x,y,z] points. */
  function Cable({ pts, r = 0.03, m }) {
    const geo = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(...q))), 48, r, 5, false), []);
    return <mesh geometry={geo} material={m} castShadow />;
  }

  /** Triangular-prism gable roof: ridge along x, slopes down to +/- z. Origin at the eave plane centre. */
  function Gable({ w, d, h, y = 0, m, ov = 0.2 }) {
    const geo = useMemo(() => {
      const hw = w / 2 + ov; const hd = d / 2 + ov;
      const v = [-hw, 0, hd, hw, 0, hd, hw, 0, -hd, -hw, 0, -hd, -hw, h, 0, hw, h, 0];
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 2, 2, 0, 2, 0, 1, 2, 1], 2));
      g.setIndex([0, 1, 5, 0, 5, 4, 2, 3, 4, 2, 4, 5, 0, 4, 3, 1, 2, 5]);
      g.computeVertexNormals();
      return g;
    }, [w, d, h, ov]);
    return <mesh geometry={geo} material={m} position={[0, y, 0]} castShadow receiveShadow />;
  }

  /** Ornate lamp post with a cluster of glass lanterns (Bandipur, Pokhara). */
  function Lamp({ p, h = 2.2 }) {
    const M = useM();
    const iron = M.plain('#3a2a22', { metalness: 0.6, roughness: 0.5 });
    const glow = M.plain('#ffe6b0', { emissive: '#ffd27a', emissiveIntensity: 0.6, roughness: 0.4 });
    return (
      <group position={p}>
        <Cyl rt={0.14} rb={0.2} h={0.5} p={[0, 0.25, 0]} m={iron} seg={10} />
        <Cyl rt={0.05} rb={0.07} h={h} p={[0, h / 2, 0]} m={iron} seg={8} />
        <Ball rad={0.1} p={[0, h * 0.55, 0]} m={iron} />
        {[[0, 0.18], [0.2, 0], [-0.2, 0], [0, -0.18]].map(([x, z], k) => (
          <group key={k} position={[x, h + 0.1, z]}>
            <Box s={[0.03, 0.05, 0.03]} p={[0, -0.08, 0]} m={iron} cast={false} />
            <Ball rad={0.08} sc={[1, 1.2, 1]} m={glow} />
          </group>
        ))}
        <Box s={[0.5, 0.04, 0.04]} p={[0, h, 0]} m={iron} cast={false} />
      </group>
    );
  }

  /** Multi-storey brick hall with carved window rows and a hip roof. Faces +z. */
  function Hall({ p = [0, 0, 0], r = 0, w, d, storeys = 3, sh = 0.9, tint = PAPER, roofH = 0.9, ov = 0.5, roofM, wall, sag = 1.2, wd = 0.34, doorGap = false, plaster, flat = false }) {
    const M = useM();
    const H = storeys * sh;
    const wm = wall || (plaster ? M.plain(plaster, { roughness: 0.9 }) : M.mat('brick', w / 1.2, H / 0.8, { color: tint }));
    const dark = M.plain('#2a1a10'); const frame = M.plain('#6b4a2a');
    const n = Math.max(2, Math.floor((w - 0.3) / (wd + 0.55)));
    const panes = []; const frames = [];
    for (let s = 0; s < storeys; s += 1) {
      for (let k = 0; k < n; k += 1) {
        const x = -w / 2 + (k + 0.5) * (w / n);
        if (doorGap && s === 0 && Math.abs(x) < 0.5) continue;
        panes.push({ p: [x, s * sh + sh * 0.55, d / 2 + 0.03], s: [wd, sh * 0.5, 0.05] });
        frames.push({ p: [x, s * sh + sh * 0.55, d / 2 + 0.015], s: [wd + 0.1, sh * 0.58, 0.05] });
      }
      for (const sx of [-1, 1]) {
        const ns = Math.max(1, Math.floor(d / 1.1));
        for (let k = 0; k < ns; k += 1) {
          const z = -d / 2 + (k + 0.5) * (d / ns);
          panes.push({ p: [sx * (w / 2 + 0.03), s * sh + sh * 0.55, z], s: [0.05, sh * 0.5, wd] });
          frames.push({ p: [sx * (w / 2 + 0.015), s * sh + sh * 0.55, z], s: [0.05, sh * 0.58, wd + 0.1] });
        }
      }
    }
    const bands = Array.from({ length: storeys }, (_, s) => ({ p: [0, (s + 1) * sh - 0.025, 0], s: [w + 0.06, 0.05, d + 0.06] }));
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[w, H, d]} p={[0, H / 2, 0]} m={wm} />
        <Inst items={frames} m={frame} cast={false} />
        <Inst items={panes} m={dark} cast={false} />
        <Inst items={bands} m={frame} cast={false} />
        {flat
          ? <Box s={[w + 0.12, 0.1, d + 0.12]} p={[0, H + 0.05, 0]} m={wm} />
          : <Roof w={w + 2 * ov} d={d + 2 * ov} h={roofH} y={H - 0.04} m={roofM || roofMat(M, 'clay-tile')} sag={sag} lift={0.1} />}
      </group>
    );
  }

  /** Newar-style pagoda from a list of tiers. Each tier: {w,d,h,wall,roof,ov,rh,open,pil,struts,win,door,fringe,sag}. */
  function Pg({ tiers, y0 = 0, finS = 1, doorGold = false, torana = false, bells = true, finM }) {
    const M = useM();
    const out = [];
    let y = y0;
    tiers.forEach((t, i) => {
      const { w, d, h, wall, roof, ov = 0.5, rh = 0.6, open, pil, struts = true, win = 0, door = i === 0, fringe, sag = 1.5, lift = 0.2, beam } = t;
      const rw = w + 2 * ov; const rd = d + 2 * ov;
      if (open) {
        const cw = w * 0.6; const cd = d * 0.6;
        out.push(<Box key={`c${i}`} s={[cw, h, cd]} p={[0, y + h / 2, 0]} m={wall} />);
        const nxp = Math.max(2, Math.round(w / 0.8) + 1); const nzp = Math.max(2, Math.round(d / 0.8) + 1);
        const pts = [];
        for (let a = 0; a < nxp; a += 1) { const x = -w / 2 + 0.12 + (a * (w - 0.24)) / (nxp - 1); pts.push([x, d / 2 - 0.12], [x, -d / 2 + 0.12]); }
        for (let b = 1; b < nzp - 1; b += 1) { const z = -d / 2 + 0.12 + (b * (d - 0.24)) / (nzp - 1); pts.push([w / 2 - 0.12, z], [-w / 2 + 0.12, z]); }
        out.push(<Inst key={`p${i}`} geo="cyl" seg={8} m={pil || M.plain('#7a2a1c')} items={pts.map(([x, z]) => ({ p: [x, y + h / 2, z], s: [0.065, h, 0.065] }))} />);
        out.push(<Box key={`bm${i}`} s={[w + 0.12, 0.12, d + 0.12]} p={[0, y + h - 0.05, 0]} m={beam || M.dark} />);
        if (i === 0 && door) out.push(<Doorway key="door" p={[0, y, cd / 2 + 0.01]} w={0.55} h={h * 0.72} gold={doorGold} arch={torana} />);
      } else {
        out.push(<Box key={`w${i}`} s={[w, h, d]} p={[0, y + h / 2, 0]} m={wall} />);
        out.push(<Box key={`b${i}`} s={[w + 0.06, 0.07, d + 0.06]} p={[0, y + h - 0.035, 0]} m={beam || M.dark} />);
        if (i === 0 && door) out.push(<Doorway key="door" p={[0, y, d / 2 + 0.01]} w={Math.min(0.62, w * 0.24)} h={h * 0.74} gold={doorGold} arch={torana} />);
        if (win > 0) {
          const ww = Math.min(0.46, w * 0.26);
          for (let k = 0; k < win; k += 1) {
            const x = win === 1 ? 0 : -w * 0.28 + (k * w * 0.56) / (win - 1);
            if (i === 0 && door && Math.abs(x) < 0.45) continue;
            out.push(<LatticeWindow key={`fw${i}${k}`} p={[x, y + h * 0.55, d / 2 + 0.01]} w={ww} h={h * 0.5} bars={3} />);
          }
          [[w / 2 + 0.01, 0, Math.PI / 2], [-w / 2 - 0.01, 0, -Math.PI / 2], [0, -d / 2 - 0.01, Math.PI]].forEach(([x, z, ry], k) => out.push(
            <LatticeWindow key={`sw${i}${k}`} p={[x, y + h * 0.55, z]} r={ry} w={ww} h={h * 0.5} bars={3} detail={false} />,
          ));
        }
      }
      if (struts) out.push(<EaveStruts key={`st${i}`} w={w} d={d} y={y + h + 0.02} n={Math.max(2, Math.round(w * 1.1))} h={Math.min(0.62, ov * 0.95 + 0.1)} color={t.sc || undefined} />);
      out.push(<Roof key={`r${i}`} w={rw} d={rd} h={rh} y={y + h - 0.05} m={roof} sag={sag} lift={lift} />);
      if (fringe) {
        out.push(<Box key={`fr1${i}`} s={[rw, 0.13, 0.04]} p={[0, y + h - 0.1, rd / 2 + 0.01]} m={fringe} cast={false} />);
        out.push(<Box key={`fr2${i}`} s={[rw, 0.13, 0.04]} p={[0, y + h - 0.1, -rd / 2 - 0.01]} m={fringe} cast={false} />);
        out.push(<Box key={`fr3${i}`} s={[0.04, 0.13, rd]} p={[rw / 2 + 0.01, y + h - 0.1, 0]} m={fringe} cast={false} />);
        out.push(<Box key={`fr4${i}`} s={[0.04, 0.13, rd]} p={[-rw / 2 - 0.01, y + h - 0.1, 0]} m={fringe} cast={false} />);
      }
      if (bells) [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz], k) => out.push(
        <mesh key={`bl${i}${k}`} position={[(sx * rw) / 2 * 0.97, y + h - 0.15, (sz * rd) / 2 * 0.97]} material={G(M)}><coneGeometry args={[0.045, 0.13, 8]} /></mesh>,
      ));
      y += h + rh * 0.6;
    });
    out.push(<Gajur key="fin" y={y - 0.05} s={finS} />);
    return <group>{out}</group>;
  }

  /** Greens, soil colours and the like used by several terrains. */
  const GRASS = (x, z) => (fbm(x * 0.3, z * 0.3) > 0.55 ? '#6f9448' : '#5f8640');

  /** A crowd of pilgrims as instanced cylinders and balls. */
  function Crowd({ n, ok = () => true, area = [8, 8], center = [0, 0], y = 0, seed = 3, cols }) {
    const M = useM();
    const { bodies, heads } = useMemo(() => {
      const r = prng(seed); const palette = cols || ['#c0392b', '#2e6fb5', '#e2b33c', '#f2efe6', '#2e8b57', '#8a3a8a', '#d9573b', '#3a3a44'];
      const b = []; const h = []; let tries = 0;
      while (b.length < n && tries < n * 30) {
        tries += 1;
        const x = center[0] + (r() - 0.5) * area[0]; const z = center[1] + (r() - 0.5) * area[1];
        if (!ok(x, z)) continue;
        const k = 0.85 + r() * 0.3;
        b.push({ p: [x, y + 0.17 * k, z], s: [0.085 * k, 0.34 * k, 0.085 * k], c: palette[Math.floor(r() * palette.length)] });
        h.push({ p: [x, y + 0.4 * k, z], s: [0.055 * k, 0.055 * k, 0.055 * k], c: r() > 0.5 ? '#c58b66' : '#a8714f' });
      }
      return { bodies: b, heads: h };
    }, []);
    const base = M.plain('#ffffff', { roughness: 0.9 });
    return <group><Inst items={bodies} geo="cyl" seg={6} m={base} cast={false} /><Inst items={heads} geo="ball" m={base} cast={false} /></group>;
  }

  /* ===================== 1. Gorkha Durbar ===================== */
  const gorkhaH = (x, z) => {
    const dz = Math.max(0, Math.abs(z) - 8.5); const dx = Math.max(0, Math.abs(x) - 9);
    let drop = dz * dz * 0.05 + dx * dx * 0.012 + (dz + dx) * 0.3;
    drop = Math.min(drop, 38);
    const r = Math.hypot(x, z);
    return -drop + fbm(x * 0.09, z * 0.09) * 5 * smooth(0, 12, drop) + smooth(48, 80, r) * (r - 44) * 0.45;
  };
  function GorkhaMain() {
    const M = useM();
    const T = 2.4;
    const stone = stoneM('#c9c0af', 5, 1.2);
    const stone2 = slabMat('#e0d8c8', 5, 1.4);
    const tile = M.mat('roof', 3, 3, { color: '#8a5e4c' });
    const tin = M.plain('#8d9296', { metalness: 0.5, roughness: 0.45 });
    const dark = M.plain('#3a2616');
    const slits = useMemo(() => { const a = []; for (let r = 0; r < 2; r += 1) for (let k = 0; k < 14; k += 1) a.push({ p: [-5.6 + k * 0.86, 0.9 + r * 0.8, 3.64], s: [0.1, 0.18, 0.06] }); return a; }, []);
    const slitsSide = useMemo(() => { const a = []; for (let k = 0; k < 6; k += 1) for (const sx of [-1, 1]) a.push({ p: [sx * 6.14, 1.0 + (k % 2) * 0.8, -2.6 + k * 1.0], s: [0.06, 0.18, 0.1] }); return a; }, []);
    return (
      <group>
        <Box s={[12.8, 0.7, 7.8]} p={[0, 0.35, 0]} m={stone2} />
        <Box s={[12, 1.7, 7]} p={[0, 1.55, 0]} m={stone} />
        <Box s={[12.2, 0.14, 7.2]} p={[0, T + 0.02, 0]} m={stone2} />
        <Inst items={slits} m={dark} cast={false} />
        <Inst items={slitsSide} m={dark} cast={false} />
        <Stair a={[0, T, 3.6]} b={[0, 0.05, 7.4]} w={1.7} n={14} m={stone2} solid />
        {[-1, 1].map((k) => <Box key={k} s={[0.22, 1.1, 3.9]} p={[k * 1.0, 0.8, 5.55]} r={[Math.atan2(T, 3.8) * 0.0, 0, 0]} m={stone} />)}
        <Box s={[11.4, 0.42, 0.28]} p={[-3.35, T + 0.3, 3.2]} m={stone2} />
        <Box s={[4.2, 0.42, 0.28]} p={[4.3, T + 0.3, 3.2]} m={stone2} />
        {/* the long red-brick palace and its tower */}
        <Hall p={[0, T, -1.8]} w={8.8} d={2.3} storeys={3} sh={0.88} roofH={0.85} ov={0.55} roofM={tile} doorGap />
        <Hall p={[-0.4, T + 2.52, -1.8]} w={3.2} d={2.1} storeys={1} sh={1.0} roofH={1.0} ov={0.6} roofM={tile} wall={M.plain('#4a3020', { roughness: 0.85 })} />
        <Gajur y={T + 2.52 + 1.0 + 0.9} s={0.8} />
        {[-1, 1].map((k) => <Hall key={k} p={[k * 3.85, T, 0.55]} w={1.9} d={3.0} storeys={2} sh={0.9} roofH={0.7} ov={0.45} roofM={tile} />)}
        <TripleWindow p={[0, T + 1.75, -0.6]} w={1.6} h={0.8} />
        <Doorway p={[0, T, -0.65]} w={0.7} h={1.1} />
        <mesh position={[0, T + 1.2, -0.6]} material={G(M)}><torusGeometry args={[0.6, 0.035, 8, 20, Math.PI]} /></mesh>
        {/* courtyard: tin-roofed shelter, two flag poles and the stone-paved floor */}
        <Box s={[5.6, 0.04, 3.2]} p={[0, T + 0.12, 0.9]} m={slabMat('#d8cdb8', 3, 2)} cast={false} />
        <group position={[1.1, T + 0.12, 0.9]}>
          {[[-0.5, -0.4], [0.5, -0.4], [-0.5, 0.4], [0.5, 0.4]].map(([x, z]) => <Box key={`${x}${z}`} s={[0.07, 0.9, 0.07]} p={[x, 0.45, z]} m={dark} />)}
          <Roof w={1.7} d={1.4} h={0.35} y={0.9} m={tin} sag={1.1} lift={0.05} />
        </group>
        {[[-1.4, 1.5], [-0.8, 1.7]].map(([x, z], k) => (
          <group key={k} position={[x, T + 0.12, z]}>
            <Cyl rt={0.03} h={3.2} p={[0, 1.6, 0]} m={M.plain('#8a6a40')} seg={6} />
            <Box s={[0.55, 0.4, 0.01]} p={[0.28, 2.9, 0]} m={M.plain('#b3202a')} />
          </group>
        ))}
        <PrayerFlags from={[-3.9, T + 2.2, 1.4]} to={[3.9, T + 2.2, 1.4]} n={26} />
        <Frame s={[14, 9, 13]} p={[0, 4.5, 1]} />
      </group>
    );
  }
  function GorkhaEnv() {
    const M = useM();
    const cf = useMemo(() => (x, z, y) => {
      const r = Math.hypot(x * 0.8, z);
      if (r < 6.6 && y > -0.4) return '#9d9788';
      const n = fbm(x * 0.35, z * 0.35);
      if (y > -2 && r < 14) return n > 0.5 ? '#6f8f4a' : '#7d9a52';
      return n > 0.55 ? '#456b3a' : n > 0.35 ? '#3d6334' : '#4c7340';
    }, []);
    const stone = stoneM('#c9c0af', 4, 1);
    return (
      <group>
        <Terrain w={170} d={170} nx={113} nz={113} hf={gorkhaH} cf={cf} />
        <Forest n={340} hf={gorkhaH} area={[150, 150]} ok={(x, z) => Math.hypot(x * 0.8, z) > 8 && gorkhaH(x, z) > -33} kind="pine" seed={4} />
        <Forest n={220} hf={gorkhaH} area={[150, 150]} ok={(x, z) => Math.hypot(x * 0.8, z) > 8.5 && gorkhaH(x, z) > -30} kind="broad" seed={9} sc={[1, 1.7]} />
        {/* stone retaining ramparts stepping down the ridge toward the east and west */}
        {[-1, 1].map((k) => <Box key={k} s={[6, 1.0, 7]} p={[k * 9.2, -0.5, 0]} m={stone} />)}
        <Range p={[0, -30, -105]} w={250} d={60} snowAt={36} lo="#5f6f58" hi="#8e8e92" foot="#5a7a4e" footH={6} seed={3}
          peaks={[{ x: -75, z: 0, h: 78, s: 34 }, { x: -30, z: 0, h: 98, s: 38 }, { x: 10, z: 8, h: 88, s: 32 }, { x: 55, z: 0, h: 74, s: 34 }, { x: 100, z: 4, h: 62, s: 30 }, { x: -110, z: 6, h: 56, s: 30 }]} />
      </group>
    );
  }

  /* ===================== 2. Manakamana ===================== */
  const manaH = (x, z) => {
    const r = Math.hypot(x, z * 0.9);
    const drop = Math.min(40, Math.max(0, r - 11) * 1.15 + Math.max(0, r - 18) ** 2 * 0.02);
    return -drop + fbm(x * 0.08, z * 0.08) * 4 * smooth(0, 16, drop) + smooth(46, 84, r) * (r - 42) * 0.5;
  };
  function ManakamanaMain() {
    const M = useM();
    const woodDark = M.plain('#4a3022', { roughness: 0.75 });
    const timber = M.mat('wood', 2, 1, { color: '#8a6244' });
    const brick = M.mat('brick', 2, 1, { color: '#f4b8a0' });
    const stone = slabMat('#e8dccb', 2, 2);
    const gold = G(M);
    const red = M.plain('#b3342a');
    const tiers = [
      { w: 3.1, d: 3.1, h: 1.05, wall: timber, roof: gold, ov: 0.85, rh: 0.66, open: true, pil: woodDark, fringe: red, sag: 1.4, door: true },
      { w: 2.0, d: 2.0, h: 0.95, wall: brick, roof: gold, ov: 0.66, rh: 0.62, win: 3, fringe: red, sag: 1.4, beam: woodDark, door: false },
    ];
    const y0 = 0.62;
    return (
      <group>
        <Box s={[6.6, 0.3, 6.6]} p={[0, 0.15, 0]} m={stone} />
        <Box s={[5.6, 0.32, 5.6]} p={[0, 0.46, 0]} m={stone} />
        <Pg tiers={tiers} y0={y0} finS={1.05} doorGold />
        {/* the gilded strip that runs from the finial down the front roof slope */}
        <Box s={[0.1, 0.02, 1.9]} p={[0, 3.0, 0.78]} r={[0.32, 0, 0]} m={gold} cast={false} />
        <Box s={[0.1, 0.02, 1.4]} p={[0, 2.05, 1.75]} r={[0.32, 0, 0]} m={gold} cast={false} />
        {/* chain-link railing round the sanctum, as in every photograph */}
        <Rail pts={[[-2.55, 0.62, -2.55], [2.55, 0.62, -2.55], [2.55, 0.62, 2.55], [-2.55, 0.62, 2.55]]} closed h={0.5} m={woodDark} bar={M.plain('#2a2a2e', { metalness: 0.6 })} gap={0.45} />
        <Stair a={[0, 0.62, 2.8]} b={[0, 0.02, 3.9]} w={1.2} n={3} m={stone} solid />
        {/* hanging bell and offering lamps */}
        <BellPavilion p={[-3.9, 0, 3.4]} s={0.6} />
        {[0, 1, 2].map((k) => <Diyo key={k} p={[0.6 + k * 0.28, 0.62, 2.5]} />)}
        <Box s={[1.3, 0.3, 0.8]} p={[2.9, 0.15, 3.3]} m={M.plain('#5a4a40')} />
        {[0, 1, 2, 3].map((k) => <Ball key={`f${k}`} rad={0.1} sc={[1, 1.5, 1]} p={[2.5 + k * 0.28, 0.5, 3.3]} m={M.plain('#ff9a2a', { emissive: '#ff7a1a', emissiveIntensity: 1.2 })} />)}
        <Crowd n={34} area={[8, 5.4]} center={[0, 4.6]} ok={(x, z) => !(Math.abs(x) < 2.8 && z < 3.0)} seed={5} />
        <Frame s={[10.5, 6.2, 9.8]} p={[0, 3.0, 2]} />
      </group>
    );
  }
  function ManakamanaEnv() {
    const M = useM();
    const cf = useMemo(() => (x, z, y) => {
      const r = Math.hypot(x, z * 0.9);
      if (r < 11 && y > -0.2) return '#b7ae9b';
      const n = fbm(x * 0.3, z * 0.3);
      if (y > -26 && n > 0.62) return '#c9bf6a';
      return n > 0.5 ? '#6f9448' : n > 0.32 ? '#587f3e' : '#4a7338';
    }, []);
    const blue = M.plain('#2f6aa8', { roughness: 0.6, metalness: 0.2 });
    const stalls = useMemo(() => Array.from({ length: 11 }, (_, k) => { const a = 0.35 + k * 0.5; return { a, x: Math.cos(a) * 10.4, z: Math.sin(a) * 10.4 }; }).filter((q) => q.a > 2.5 && q.a < 5.9), []);
    const cabinCurve = (t) => [-9 - t * 38, 3 - t * 36, 6 + t * 24];
    return (
      <group>
        <Terrain w={170} d={170} nx={113} nz={113} hf={manaH} cf={cf} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow material={slabMat('#efe4d2', 8, 8)}><circleGeometry args={[9.6, 56]} /></mesh>
        <Forest n={300} hf={manaH} area={[150, 150]} ok={(x, z) => Math.hypot(x, z * 0.9) > 13 && manaH(x, z) > -34} kind="broad" seed={11} sc={[1, 1.8]} />
        <Forest n={140} hf={manaH} area={[150, 150]} ok={(x, z) => Math.hypot(x, z * 0.9) > 14 && manaH(x, z) > -30} kind="pine" seed={12} />
        {/* shops and rest houses ringing the hilltop courtyard */}
        {stalls.map((q, i) => (
          <group key={i} position={[q.x, 0, q.z]} rotation={[0, -q.a + Math.PI / 2 + Math.PI, 0]}>
            <Box s={[2.2, 2.0 + (i % 3) * 0.8, 1.6]} p={[0, (2.0 + (i % 3) * 0.8) / 2, 0]} m={M.plain(['#e8d9bf', '#d98a6a', '#e9e2d0', '#c9a27a'][i % 4], { roughness: 0.9 })} />
            <Box s={[2.4, 0.08, 1.8]} p={[0, 2.04 + (i % 3) * 0.8, 0.05]} m={i % 2 ? blue : M.plain('#8a3a2a')} />
          </group>
        ))}
        {/* the cable-car station and its two cable lines down to the Trishuli valley */}
        <group position={[-9.5, 0, 7]} rotation={[0, -0.6, 0]}>
          <Box s={[4.4, 2.6, 3]} p={[0, 1.3, 0]} m={M.plain('#f1ece0')} />
          <Box s={[4.6, 0.12, 3.2]} p={[0, 2.66, 0]} m={blue} />
          <Box s={[3.4, 0.08, 2.6]} p={[0, 2.9, 0]} r={[0, 0, 0.12]} m={blue} />
          <Box s={[1.6, 1.3, 0.06]} p={[0, 0.85, 1.52]} m={M.plain('#8fb4c4', { metalness: 0.5, roughness: 0.2 })} />
          <Cyl rt={0.5} h={0.18} p={[-2.0, 2.2, 0]} r={[Math.PI / 2, 0, 0]} m={M.plain('#444')} />
        </group>
        {[0, 1].map((k) => (
          <Cable key={k} pts={Array.from({ length: 6 }, (_, i) => { const t = i / 5; const q = cabinCurve(t); return [q[0] - 0.4 * k, q[1] + 2.2 - Math.sin(t * Math.PI) * 0.6, q[2] + 0.5 * k]; })} r={0.045} m={M.plain('#3a3a3e', { metalness: 0.7 })} />
        ))}
        {[0.3, 0.62].map((t, k) => { const q = cabinCurve(t); return (
          <group key={k} position={[q[0], q[1] + 0.6 - Math.sin(t * Math.PI) * 0.6, q[2] + (k ? 0 : 0.5)]} rotation={[0, -0.6, 0]}>
            <Cyl rt={0.03} h={0.7} p={[0, 0.85, 0]} m={M.dark} seg={5} />
            <Box s={[1.0, 0.8, 0.8]} p={[0, 0.1, 0]} m={M.plain(k ? '#2f6aa8' : '#c0392b', { roughness: 0.5 })} />
            <Box s={[1.02, 0.35, 0.82]} p={[0, 0.2, 0]} m={M.plain('#9fc4d6', { metalness: 0.4, roughness: 0.2 })} cast={false} />
          </group>
        ); })}
        <Ribbon pts={[[-60, -60], [-30, -50], [10, -57], [40, -50], [70, -55]]} w={5} y={-37} color="#6a9a98" seg={30} />
        <Range p={[0, -24, -105]} w={260} d={60} snowAt={38} lo="#5b6b54" hi="#8c8b8e" foot="#58794c" footH={6} seed={7}
          peaks={[{ x: -80, z: 0, h: 70, s: 32 }, { x: -35, z: 4, h: 92, s: 36 }, { x: 10, z: 0, h: 102, s: 40 }, { x: 55, z: 6, h: 80, s: 34 }, { x: 105, z: 0, h: 64, s: 30 }]} />
      </group>
    );
  }

  /* ===================== 3. Muktinath ===================== */
  const muktiH = (x, z) => {
    const back = Math.max(0, -z - 9); const side = Math.max(0, Math.abs(x) - 15); const front = Math.max(0, z - 18);
    const up = Math.min(48, back * back * 0.05 + side * side * 0.05 + back * 0.4 + side * 0.5);
    return up + fbm(x * 0.06, z * 0.06) * 6 * smooth(4, 26, back + side) - front * front * 0.03;
  };
  function MuktiMain() {
    const M = useM();
    const white = M.plain('#f3efe6', { roughness: 0.85 });
    const stone = stoneM('#c9c1b0', 3, 1);
    const wall = stoneM('#8f8574', 6, 1.4);
    const roofDark = M.plain('#3a2a1c', { roughness: 0.55, metalness: 0.35 });
    const tin = M.plain('#8d949a', { metalness: 0.55, roughness: 0.4 });
    const timber = M.plain('#2a1a12');
    const brass = M.plain('#c9a23a', { metalness: 0.8, roughness: 0.3 });
    const spouts = useMemo(() => Array.from({ length: 108 }, (_, k) => { const a = Math.PI + 0.22 + (k / 107) * (Math.PI - 0.44); return { p: [Math.cos(a) * 5.55, 1.05, Math.sin(a) * 5.55 - 0.6], s: [0.1, 0.1, 0.26], r: [0, -a + Math.PI / 2, 0] }; }), []);
    const wallSeg = useMemo(() => Array.from({ length: 40 }, (_, k) => { const a = Math.PI + 0.18 + (k / 39) * (Math.PI - 0.36); return { p: [Math.cos(a) * 5.95, 0.7, Math.sin(a) * 5.95 - 0.6], s: [0.62, 1.4, 0.55], r: [0, -a + Math.PI / 2, 0] }; }), []);
    const capSeg = useMemo(() => Array.from({ length: 40 }, (_, k) => { const a = Math.PI + 0.18 + (k / 39) * (Math.PI - 0.36); return { p: [Math.cos(a) * 5.75, 1.42, Math.sin(a) * 5.75 - 0.6], s: [0.85, 0.12, 0.8], r: [0, -a + Math.PI / 2, 0] }; }), []);
    const tiers = [[2.2, 0.72], [1.8, 0.66], [1.4, 0.62]];
    let y = 1.42; const tw = [];
    tiers.forEach(([w, h], i) => {
      const rw = w + 0.9;
      tw.push(<group key={i}>
        <Box s={[w, h, w]} p={[0, y + h / 2, -0.25]} m={white} />
        {[-0.38, 0.38].map((x) => [1, -1].map((s) => <Box key={`p${x}${s}`} s={[0.07, h, 0.05]} p={[x * w * 1.0, y + h / 2, -0.25 + s * (w / 2 + 0.02)]} m={timber} cast={false} />))}
        <Box s={[w + 0.06, 0.07, w + 0.06]} p={[0, y + h - 0.04, -0.25]} m={timber} />
        <LatticeWindow p={[0, y + h * 0.5, -0.25 + w / 2 + 0.01]} w={w * 0.3} h={h * 0.5} bars={3} />
        <group position={[0, 0, -0.25]}><Roof w={rw} d={rw} h={0.46} y={y + h - 0.05} m={roofDark} sag={1.4} lift={0.22} /></group>
        {[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([sx, sz], k) => <mesh key={k} position={[sx * rw * 0.485, y + h - 0.17, -0.25 + sz * rw * 0.485]} material={brass}><coneGeometry args={[0.04, 0.12, 6]} /></mesh>)}
      </group>);
      y += h + 0.25;
    });
    return (
      <group>
        <Box s={[7.6, 0.12, 7.6]} p={[0, 0.06, 0.6]} m={slabMat('#d9d0c0', 3, 3)} cast={false} />
        {/* the whitewashed hall with its tin gable, and the dark timber porch */}
        <Box s={[5.0, 0.28, 2.5]} p={[0, 0.14, 0.2]} m={M.plain('#9a5a40')} />
        <Box s={[4.8, 1.2, 2.3]} p={[0, 0.88, 0.2]} m={white} />
        <Gable w={4.8} d={2.3} h={0.62} y={1.48} m={tin} ov={0.28} />
        <Box s={[1.5, 1.05, 0.9]} p={[0, 0.78, 1.55]} m={M.plain('#3a2416')} />
        <Gable w={1.5} d={0.9} h={0.45} y={1.3} m={roofDark} ov={0.12} />
        {[-1.65, 1.65].map((x) => <Box key={x} s={[0.7, 0.55, 0.05]} p={[x, 0.95, 1.36]} m={M.plain('#2a2a2e')} cast={false} />)}
        <Box s={[0.6, 0.35, 0.03]} p={[-1.9, 0.5, 1.37]} m={M.plain('#2a58a0')} cast={false} />
        {tw}
        <Gajur y={y - 0.05} s={0.7} />
        {/* the arc of 108 brass bull-head spouts in its dry-stone wall */}
        <Inst items={wallSeg} m={wall} />
        <Inst items={capSeg} m={stone} />
        <Inst items={spouts} m={brass} cast={false} />
        {/* the two sacred kunds in front of the temple */}
        {[-1, 1].map((k) => (
          <group key={k} position={[k * 2.15, 0, 3.7]}>
            <Box s={[3.3, 0.2, 2.0]} p={[0, 0.1, 0]} m={stone} />
            <Water w={2.8} d={1.5} p={[0, 0.22, 0]} color="#7fa89a" />
          </group>
        ))}
        {[[-5.5, 4.5], [5.5, 4.5], [-4, -4.5], [4, -4.5]].map(([x, z], k) => <PrayerFlags key={k} from={[0, y + 0.3, -0.25]} to={[x, 0.7, z]} n={20} />)}
        <Frame s={[14, 5.2, 13]} p={[0, 2.6, 0.5]} />
      </group>
    );
  }
  function MuktiEnv() {
    const M = useM();
    const cf = useMemo(() => (x, z, y) => {
      if (y < 0.3 && Math.abs(x) < 13 && z > -8.5) return '#b9ad98';
      const n = fbm(x * 0.25, z * 0.25); const t = Math.min(1, y / 40);
      const c = new THREE.Color(n > 0.5 ? '#9a8266' : '#85705a');
      return c.lerp(new THREE.Color('#7b7268'), t * 0.8).getStyle();
    }, []);
    const lodge = M.plain('#f1ece0', { roughness: 0.9 });
    const tin = M.plain('#9aa0a6', { metalness: 0.5, roughness: 0.45 });
    const wood = M.plain('#6b4a2a');
    const rocks = useMemo(() => Array.from({ length: 70 }, (_, k) => { const r = prng(k + 3); const x = (r() - 0.5) * 120; const z = -10 - r() * 50; return { x, z, y: muktiH(x, z), s: [0.8 + r() * 1.6, 0.6 + r(), 0.8 + r() * 1.4], k }; }), []);
    const rockM = crag('#a08c72');
    return (
      <group>
        <Terrain w={170} d={170} nx={113} nz={113} hf={muktiH} cf={cf} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 3]} receiveShadow material={slabMat('#cfc5b3', 7, 7)}><planeGeometry args={[19, 22]} /></mesh>
        {/* the pilgrims' lodge with its wooden balcony, left of the temple */}
        <group position={[-9, 0, 2.5]} rotation={[0, Math.PI / 2, 0]}>
          <Box s={[7.5, 2.3, 2.2]} p={[0, 1.15, 0]} m={lodge} />
          <Box s={[7.5, 0.1, 0.9]} p={[0, 1.2, 1.5]} m={wood} />
          <Rail pts={[[-3.7, 1.2, 1.95], [3.7, 1.2, 1.95]]} h={0.5} m={wood} gap={0.4} />
          <Gable w={7.5} d={2.2} h={0.8} y={2.3} m={tin} ov={0.35} />
          {Array.from({ length: 7 }, (_, k) => <Box key={k} s={[0.4, 0.55, 0.05]} p={[-3 + k * 1.0, 1.55, 1.12]} m={M.plain('#2a1a10')} cast={false} />)}
        </group>
        <Forest n={34} hf={muktiH} area={[40, 34]} center={[0, 3]} ok={(x, z) => Math.abs(x) > 9.5 && Math.abs(x) < 17 && z > -9 && z < 16} kind="poplar" seed={21} sc={[1.2, 2]} />
        <Forest n={20} hf={muktiH} area={[36, 12]} center={[0, -9]} ok={(x, z) => Math.abs(x) < 15 && z < -7} kind="poplar" seed={22} sc={[1.2, 2]} />
                <Range p={[0, -8, -112]} w={270} d={64} snowAt={42} lo="#7b6650" hi="#9b8b76" seed={5}
          peaks={[{ x: -95, z: 0, h: 74, s: 34 }, { x: -50, z: 4, h: 98, s: 38 }, { x: -2, z: 0, h: 112, s: 42 }, { x: 48, z: 4, h: 92, s: 38 }, { x: 98, z: 0, h: 70, s: 32 }]} />
      </group>
    );
  }

  /** Little town houses scattered over terrain: instanced boxes with pyramid roofs. */
  function Town({ n, hf = () => 0, ok = () => true, area = [60, 60], center = [0, 0], seed = 1, sc = [1.1, 2.0], walls, roofs, tall = 1 }) {
    const M = useM();
    const { bodies, tops } = useMemo(() => {
      const r = prng(seed); const b = []; const t = []; let tries = 0;
      const wc = walls || ['#efe6d6', '#e8d9bf', '#d98a6a', '#e9e2d0', '#c9d6c4', '#f1ece0'];
      const rc = roofs || ['#a8452f', '#2f6aa8', '#8a3a2a', '#5a7a4a', '#9aa0a6'];
      while (b.length < n && tries < n * 25) {
        tries += 1;
        const x = center[0] + (r() - 0.5) * area[0]; const z = center[1] + (r() - 0.5) * area[1];
        if (!ok(x, z)) continue;
        const y = hf(x, z); const w = mix(sc[0], sc[1], r()); const h = w * (0.8 + r() * 0.7) * tall; const rot = Math.floor(r() * 4) * 0.4 + r() * 0.1;
        b.push({ p: [x, y + h / 2, z], s: [w, h, w * (0.9 + r() * 0.3)], r: [0, rot, 0], c: wc[Math.floor(r() * wc.length)] });
        t.push({ p: [x, y + h + w * 0.2, z], s: [w * 0.82, w * 0.4, w * 0.82], r: [0, rot + Math.PI / 4, 0], c: rc[Math.floor(r() * rc.length)] });
      }
      return { bodies: b, tops: t };
    }, []);
    const base = M.plain('#ffffff', { roughness: 0.9 });
    return <group><Inst items={bodies} m={base} cast={false} /><Inst items={tops} geo="cone" seg={4} m={base} cast={false} /></group>;
  }

  /** A wooden pleasure boat of Phewa Lake. */
  function Boat({ p, r = 0, c = '#c0392b', s = 1 }) {
    const M = useM();
    const hull = M.plain(c, { roughness: 0.6 });
    return (
      <group position={p} rotation={[0, r, 0]} scale={s}>
        <Box s={[0.6, 0.22, 2.2]} p={[0, 0.11, 0]} m={hull} />
        <mesh position={[0, 0.13, 1.35]} rotation={[Math.PI / 2, Math.PI / 4, 0]} material={hull}><coneGeometry args={[0.31, 0.6, 4]} /></mesh>
        <mesh position={[0, 0.13, -1.35]} rotation={[-Math.PI / 2, Math.PI / 4, 0]} material={hull}><coneGeometry args={[0.31, 0.6, 4]} /></mesh>
        <Box s={[0.5, 0.04, 1.6]} p={[0, 0.24, 0]} m={M.plain('#e8dcc0')} cast={false} />
        <Box s={[0.7, 0.04, 1.2]} p={[0, 0.9, -0.1]} m={M.plain('#2f6aa8')} cast={false} />
        {[[-0.28, -0.6], [0.28, -0.6], [-0.28, 0.4], [0.28, 0.4]].map(([x, z], k) => <Box key={k} s={[0.03, 0.66, 0.03]} p={[x, 0.55, z]} m={M.dark} cast={false} />)}
      </group>
    );
  }

  const annapurna = [
    { x: -62, z: 2, h: 78, s: 34 }, { x: -34, z: 0, h: 92, s: 30 }, { x: -8, z: 0, h: 84, sx: 11, sz: 22 }, { x: 4, z: 0, h: 80, sx: 10, sz: 22 },
    { x: 34, z: 4, h: 88, s: 32 }, { x: 70, z: 6, h: 74, s: 34 }, { x: 108, z: 0, h: 62, s: 30 }, { x: -105, z: 8, h: 56, s: 30 },
  ];

  /* ===================== 4. Tal Barahi ===================== */
  const talH = (x, z) => {
    const r = Math.hypot(x, z);
    return -4 + smooth(36, 46, r) * 5 + Math.max(0, r - 46) * 0.5 + fbm(x * 0.07, z * 0.07) * 9 * smooth(44, 75, r);
  };
  function TalMain() {
    const M = useM();
    const grey = M.plain('#8c9094', { metalness: 0.5, roughness: 0.45 });
    const wood = M.mat('wood', 2, 1, { color: '#7a5640' });
    const woodD = M.plain('#3e2a20', { roughness: 0.8 });
    const cream = M.plain('#f2e6cc', { roughness: 0.8 });
    const stone = slabMat('#e8dccb', 2, 2);
    const white = M.plain('#f4f1ea', { roughness: 0.8 });
    const redBrick = M.plain('#c05a3a', { roughness: 0.9 });
    const rail = useMemo(() => Array.from({ length: 26 }, (_, k) => { const a = Math.PI / 2 + 0.3 + (k / 25) * (Math.PI * 2 - 0.6); return [Math.cos(a) * 6.2, 0, Math.sin(a) * 6.2]; }), []);
    const tiers = [
      { w: 2.1, d: 2.1, h: 0.9, wall: wood, roof: grey, ov: 0.88, rh: 0.5, fringe: cream, sag: 1.4, beam: woodD },
      { w: 1.4, d: 1.4, h: 0.72, wall: wood, roof: grey, ov: 0.66, rh: 0.44, fringe: cream, sag: 1.4, beam: woodD, door: false, win: 1 },
    ];
    return (
      <group>
        <Cyl rt={6.6} rb={7.5} h={0.9} p={[0, -0.45, 0]} m={crag('#7a7266')} seg={36} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow material={M.mat('grass', 4, 4, { color: '#8aa862' })}><circleGeometry args={[6.6, 36]} /></mesh>
        <Box s={[7.4, 0.03, 7.4]} p={[0, 0.02, 0.4]} m={slabMat('#e2d6c2', 3, 3)} cast={false} />
        <Box s={[4.6, 0.3, 4.6]} p={[0, 0.15, -0.1]} m={stone} />
        <Box s={[3.8, 0.24, 3.8]} p={[0, 0.42, -0.1]} m={stone} />
        <group position={[0, 0, -0.1]}><Pg tiers={tiers} y0={0.54} finS={0.9} doorGold /></group>
        {/* red-brick lamp pillars at the foot of the landing */}
        {[-1, 1].map((k) => <group key={k} position={[k * 1.9, 0, 5.3]}><Box s={[0.34, 1.0, 0.34]} p={[0, 0.5, 0]} m={redBrick} /><Box s={[0.46, 0.1, 0.46]} p={[0, 1.04, 0]} m={white} /><Box s={[0.22, 0.26, 0.22]} p={[0, 1.22, 0]} m={M.plain('#f6d27a', { emissive: '#e0a030', emissiveIntensity: 0.5 })} /></group>)}
        <Stair a={[0, 0.02, 5.7]} b={[0, -0.42, 7.5]} w={3.4} n={5} m={M.plain('#c4614a')} solid base={-0.45} />
        <Box s={[3.8, 0.03, 1.8]} p={[0, -0.38, 8.3]} m={M.plain('#d9c9a0')} cast={false} />
        {/* the little grey-roofed pavilion beside the temple */}
        <group position={[3.7, 0, -0.1]}>
          {[[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]].map(([x, z]) => <Box key={`${x}${z}`} s={[0.09, 1.0, 0.09]} p={[x, 0.5, z]} m={woodD} />)}
          <Roof w={1.9} d={1.9} h={0.55} y={1.0} m={grey} sag={1.2} lift={0.1} />
          <Box s={[1.4, 0.12, 1.4]} p={[0, 0.06, 0]} m={stone} />
        </group>
        <Rail pts={rail} h={0.42} m={white} gap={0.5} />
        <Forest n={26} area={[15, 15]} ok={(x, z) => { const r = Math.hypot(x, z); return r > 3.6 && r < 6.2 && z < -0.4; }} kind="broad" seed={31} sc={[1.0, 1.7]} />
        <Frame s={[16, 6, 17]} p={[0, 2.6, 1.5]} />
      </group>
    );
  }
  function TalEnv() {
    const M = useM();
    const cf = useMemo(() => (x, z, y) => {
      const n = fbm(x * 0.3, z * 0.3);
      if (y < 0.6) return '#6a8a4a';
      return n > 0.55 ? '#486f3a' : n > 0.35 ? '#3d6334' : '#55803e';
    }, []);
    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]} receiveShadow><circleGeometry args={[70, 72]} /><meshStandardMaterial color="#3f7f78" metalness={0.35} roughness={0.1} /></mesh>
        <Terrain w={170} d={170} nx={113} nz={113} hf={talH} cf={cf} />
        <Forest n={320} hf={talH} area={[150, 150]} ok={(x, z) => Math.hypot(x, z) > 47 && talH(x, z) < 22} kind="broad" seed={32} sc={[1.1, 2]} />
        <Forest n={120} hf={talH} area={[150, 150]} ok={(x, z) => Math.hypot(x, z) > 50} kind="pine" seed={33} />
        <Town n={40} hf={talH} area={[50, 50]} center={[-26, -26]} ok={(x, z) => { const r = Math.hypot(x, z); return r > 38 && r < 47; }} seed={4} sc={[1.2, 2]} />
        <Boat p={[-2.6, -0.4, 10.8]} r={0.25} c="#c0392b" />
        <Boat p={[2.4, -0.4, 12.4]} r={-0.4} c="#2f6aa8" />
        <Boat p={[5.8, -0.4, 9.6]} r={0.7} c="#e2b33c" />
        <Boat p={[-12, -0.4, 6]} r={1.2} c="#2e8b57" s={1.1} />
        <Range p={[0, -10, -112]} w={280} d={64} snowAt={44} lo="#5e6a58" hi="#8a8a8e" foot="#476c3e" footH={12} seed={8} peaks={annapurna} />
      </group>
    );
  }

  /* ===================== 5. Bindhyabasini (Pokhara) ===================== */
  const bindhyaH = (x, z) => {
    const r = Math.hypot(x, z);
    return -Math.min(11, Math.max(0, r - 12) * 0.9) + fbm(x * 0.09, z * 0.09) * 2 * smooth(12, 30, r) + smooth(52, 86, r) * (r - 48) * 0.55;
  };
  function BindhyaMain() {
    const M = useM();
    const white = M.plain('#f7f4ee', { roughness: 0.82 });
    const red = M.plain('#c0302a', { roughness: 0.8 });
    const bronze = M.plain('#5a4326', { metalness: 0.6, roughness: 0.45 });
    const gold = G(M);
    const stone = slabMat('#e2d8c6', 2, 2);
    const lionGold = M.plain('#d9a82a', { metalness: 0.6, roughness: 0.35 });
    const domeGeo = useMemo(() => {
      const prof = [[1.66, 0], [1.66, 0.12], [1.52, 0.17], [1.56, 0.5], [1.4, 0.55], [1.45, 0.85], [1.3, 1.0], [1.25, 1.35], [1.05, 1.8], [0.8, 2.25], [0.5, 2.65], [0.3, 2.95], [0.14, 3.2]];
      return new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 32);
    }, []);
    const fringe = useMemo(() => Array.from({ length: 44 }, (_, k) => { const a = (k / 44) * Math.PI * 2; const side = Math.floor(((a + Math.PI / 4) % (Math.PI * 2)) / (Math.PI / 2)); const t = (((a + Math.PI / 4) % (Math.PI / 2)) / (Math.PI / 2)) * 2 - 1; const hw = 1.58; const x = side % 2 === 0 ? hw * (side === 0 ? 1 : -1) : hw * t * (side === 1 ? -1 : 1); const z = side % 2 === 0 ? hw * t * (side === 0 ? 1 : -1) : hw * (side === 1 ? 1 : -1); return { p: [x, 1.55, z], s: [0.16, 0.2, 0.16], c: k % 2 ? '#c0302a' : '#e8b8a0' }; }), []);
    return (
      <group>
        <Box s={[5.4, 0.22, 5.4]} p={[0, 0.11, 0]} m={stone} />
        <Box s={[4.6, 0.24, 4.6]} p={[0, 0.34, 0]} m={stone} />
        <group position={[0, 0.46, 0]}>
          <Box s={[2.9, 1.45, 2.9]} p={[0, 0.72, 0]} m={white} />
          <Box s={[3.4, 0.2, 3.4]} p={[0, 1.55, 0]} m={red} />
          <Box s={[3.5, 0.06, 3.5]} p={[0, 1.68, 0]} m={gold} cast={false} />
          <Inst items={fringe} m={M.plain('#ffffff')} cast={false} />
          <mesh geometry={domeGeo} material={white} position={[0, 1.66, 0]} castShadow receiveShadow />
          <Gajur y={1.66 + 3.3} s={0.85} />
          <Box s={[0.05, 3.4, 0.05]} p={[0, 3.3, 1.2]} r={[0.0, 0, 0]} m={gold} cast={false} />
          {/* carved bronze porch with its gilded door, on the front face */}
          <Box s={[1.6, 1.5, 0.3]} p={[0, 0.75, 1.55]} m={bronze} />
          <Box s={[1.0, 1.1, 0.06]} p={[0, 0.55, 1.72]} m={M.plain('#f6d27a', { emissive: '#d99a30', emissiveIntensity: 0.55 })} cast={false} />
          <mesh position={[0, 1.1, 1.72]} material={M.plain('#2a1a10')}><circleGeometry args={[0.5, 24, 0, Math.PI]} /></mesh>
          <mesh position={[0, 1.1, 1.75]} material={gold}><torusGeometry args={[0.56, 0.05, 8, 24, Math.PI]} /></mesh>
          <Roof w={1.9} d={1.0} h={0.4} y={1.5} m={bronze} sag={1.3} lift={0.1} />
          <Stair a={[0, 0, 1.75]} b={[0, -0.46, 2.9]} w={1.3} n={4} m={stone} solid base={-0.46} />
          {[-1, 1].map((k) => <group key={k} position={[k * 1.1, 0, 2.25]}><Box s={[0.5, 0.35, 0.5]} p={[0, 0.17, 0]} m={stone} /><group position={[0, 0.35, 0]} scale={1.5}><Lion m={lionGold} /></group></group>)}
        </group>
        {/* stone door-frames with their bells, and two miniature white shrines */}
        {[[-3.9, 3.0], [3.9, 3.3]].map(([x, z], k) => (
          <group key={k} position={[x, 0, z]}>
            {[-0.55, 0.55].map((dx) => <Box key={dx} s={[0.22, 1.6, 0.22]} p={[dx, 0.8, 0]} m={white} />)}
            <Box s={[1.5, 0.22, 0.3]} p={[0, 1.65, 0]} m={white} />
            <Cyl rt={0.02} h={0.3} p={[0, 1.4, 0]} m={M.dark} seg={5} />
            <Cyl rt={0.03} rb={0.17} h={0.3} p={[0, 1.1, 0]} m={gold} seg={12} />
          </group>
        ))}
        {[[4.6, 0.6], [5.3, -0.2]].map(([x, z], k) => (
          <group key={k} position={[x, 0, z]}>
            <Box s={[0.7, 0.7, 0.7]} p={[0, 0.35, 0]} m={white} />
            <mesh position={[0, 0.7, 0]} material={white} castShadow><sphereGeometry args={[0.42, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
            <mesh position={[0, 1.3, 0]} material={gold}><coneGeometry args={[0.06, 0.3, 8]} /></mesh>
          </group>
        ))}
        {/* the long open pavilion of carved timber pillars */}
        <group position={[-6.4, 0, -2.6]} rotation={[0, 0.35, 0]}>
          <Box s={[6.4, 0.3, 2.8]} p={[0, 0.15, 0]} m={M.plain('#4a4440')} />
          <Inst geo="cyl" seg={8} m={M.plain('#a8742e')} items={Array.from({ length: 9 }, (_, k) => [{ p: [-3 + k * 0.75, 1.2, 1.2], s: [0.1, 1.8, 0.1] }, { p: [-3 + k * 0.75, 1.2, -1.2], s: [0.1, 1.8, 0.1] }]).flat()} />
          <Box s={[6.4, 0.16, 2.9]} p={[0, 2.15, 0]} m={M.plain('#6a4a2a')} />
          <Gable w={6.4} d={2.8} h={0.75} y={2.2} m={M.mat('roof', 4, 2, { color: '#b08060' })} ov={0.3} />
          <Box s={[5.8, 1.4, 0.12]} p={[0, 1.0, -1.25]} m={white} />
        </group>
        <Crowd n={14} area={[8, 5]} center={[0, 5.2]} seed={8} ok={(x, z) => z > 3.4} />
        <Tree p={[6.2, 0, -4]} s={1.9} />
        <Frame s={[17, 6.8, 14]} p={[-0.5, 3.2, 0]} />
      </group>
    );
  }
  function BindhyaEnv() {
    const M = useM();
    const cf = useMemo(() => (x, z, y) => {
      const n = fbm(x * 0.3, z * 0.3);
      if (y < -9.4) return n > 0.5 ? '#8a9a58' : '#a3a868';
      return n > 0.5 ? '#6f9448' : '#587f3e';
    }, []);
    return (
      <group>
        <Terrain w={170} d={170} nx={113} nz={113} hf={bindhyaH} cf={cf} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow material={slabMat('#efe4d2', 8, 8)}><circleGeometry args={[12.2, 56]} /></mesh>
        <Forest n={110} hf={bindhyaH} area={[60, 60]} ok={(x, z) => { const r = Math.hypot(x, z); return r > 14 && r < 24; }} kind="broad" seed={41} sc={[1, 1.6]} />
        <Forest n={16} area={[26, 26]} ok={(x, z) => { const r = Math.hypot(x, z); return r > 9.5 && r < 11.5 && z < 2; }} kind="broad" seed={43} sc={[1.0, 1.5]} />
        <Town n={190} hf={bindhyaH} area={[130, 130]} ok={(x, z) => Math.hypot(x, z) > 26 && Math.hypot(x, z) < 62} seed={6} />
        <Forest n={160} hf={bindhyaH} area={[150, 150]} ok={(x, z) => Math.hypot(x, z) > 58} kind="pine" seed={44} />
        <Range p={[0, -10, -112]} w={280} d={64} snowAt={44} lo="#5e6a58" hi="#8a8a8e" foot="#476c3e" footH={12} seed={9} peaks={annapurna} />
      </group>
    );
  }

  /* ===================== 6. Bhadrakali (Pokhara) ===================== */
  const bhadraH = (x, z) => {
    const r = Math.hypot(x, z);
    return -Math.min(14, Math.max(0, r - 7.5) * 0.82) + fbm(x * 0.09, z * 0.09) * 2.2 * smooth(12, 30, r) + smooth(46, 84, r) * (r - 44) * 0.5;
  };
  function BhadraMain() {
    const M = useM();
    const white = M.plain('#f7f4ee', { roughness: 0.82 });
    const slate = M.plain('#6f6a66', { roughness: 0.8 });
    const red = M.plain('#b3342a');
    const redO = M.plain('#c8553a', { roughness: 0.85 });
    const rubble = stoneM('#aaa090', 5, 1);
    const stoneTop = slabMat('#d8cdb8', 4, 3);
    const lionGold = M.plain('#d9a82a', { metalness: 0.5, roughness: 0.4 });
    const tiers = [
      { w: 2.7, d: 2.7, h: 1.0, wall: white, roof: slate, ov: 0.95, rh: 0.5, fringe: red, sag: 1.5, beam: M.plain('#7a2a1c'), win: 1, door: true },
      { w: 1.7, d: 1.7, h: 0.85, wall: white, roof: slate, ov: 0.7, rh: 0.46, fringe: red, sag: 1.5, beam: M.plain('#7a2a1c'), win: 1, door: false },
    ];
    const T = 1.3;
    return (
      <group>
        <Box s={[9.2, T, 7.6]} p={[0, T / 2, 0]} m={rubble} />
        <Box s={[9.4, 0.1, 7.8]} p={[0, T + 0.02, 0]} m={slabMat('#c9bea8', 4, 3)} />
        <Box s={[9.0, 0.05, 7.4]} p={[0, T + 0.08, 0]} m={stoneTop} cast={false} />
        <Stair a={[0, T, 3.8]} b={[0, 0.03, 6.4]} w={2.1} n={8} m={slabMat('#cfc3ae', 2, 1)} solid />
        {[-1, 1].map((k) => <group key={k} position={[k * 1.45, T, 3.7]}><Box s={[0.55, 0.3, 0.55]} p={[0, 0.15, 0]} m={slabMat('#cfc3ae', 1, 1)} /><group position={[0, 0.3, 0]} scale={1.7}><Lion m={lionGold} /></group></group>)}
        <group position={[0, T + 0.1, -0.3]}>
          <Box s={[3.3, 0.35, 3.3]} p={[0, 0.17, 0]} m={redO} />
          <Pg tiers={tiers} y0={0.35} finS={0.85} />
          {/* red porch posts and the two hanging bells in front of the doorway */}
          {[-1.1, -0.4, 0.4, 1.1].map((x) => <Box key={x} s={[0.14, 0.95, 0.14]} p={[x, 0.82, 1.55]} m={redO} />)}
          <Box s={[2.6, 0.12, 0.2]} p={[0, 1.34, 1.55]} m={M.plain('#7a2a1c')} />
          {[-0.4, 0.4].map((x) => <group key={x} position={[x, 1.28, 1.55]}><Cyl rt={0.015} h={0.2} p={[0, -0.1, 0]} m={M.dark} seg={4} /><Cyl rt={0.03} rb={0.12} h={0.22} p={[0, -0.3, 0]} m={G(M)} seg={10} /></group>)}
        </group>
        <Rail pts={[[-4.1, T + 0.1, -3.4], [4.1, T + 0.1, -3.4], [4.1, T + 0.1, 3.4], [-4.1, T + 0.1, 3.4]]} closed h={0.55} m={M.plain('#8a8580', { metalness: 0.5 })} bar={M.plain('#3a3a3e', { metalness: 0.6 })} gap={0.9} thick={0.045} />
        {/* the carved lion pillar of the temple grounds */}
        <group position={[-3.6, T + 0.1, 3.0]}>
          <Cyl rt={0.28} rb={0.34} h={0.9} p={[0, 0.45, 0]} m={M.plain('#b5683f')} seg={12} />
          <Cyl rt={0.4} rb={0.28} h={0.18} p={[0, 0.98, 0]} m={M.plain('#9a5a38')} seg={12} />
          <group position={[0, 1.05, 0]} scale={1.2}><Lion m={M.plain('#5a6a58', { metalness: 0.4 })} /></group>
        </group>
        <Ball rad={1.2} sc={[1.3, 0.9, 1.2]} p={[-6.4, 3.2, 3]} m={M.plain('#c2185b', { roughness: 1 })} />
        <Cyl rt={0.12} rb={0.18} h={2.4} p={[-6.4, 1.2, 3]} m={M.plain('#5a4030')} seg={6} />
        <Crowd n={12} area={[7, 5]} center={[0, 5.4]} seed={12} y={0} ok={(x, z) => z > 7} />
        <Frame s={[16, 7, 15]} p={[0, 3.4, 1.5]} />
      </group>
    );
  }
  function BhadraEnv() {
    const M = useM();
    const cf = useMemo(() => (x, z, y) => {
      const n = fbm(x * 0.3, z * 0.3);
      if (y < -12.8) return n > 0.5 ? '#8a9a58' : '#a3a868';
      return n > 0.5 ? '#5f8a45' : '#4c7a3c';
    }, []);
    const stairStone = slabMat('#cfc3ae', 2, 1);
    return (
      <group>
        <Terrain w={170} d={170} nx={113} nz={113} hf={bhadraH} cf={cf} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow material={slabMat('#e2d8c4', 6, 6)}><circleGeometry args={[8.2, 48]} /></mesh>
        {/* the long stone stairway climbing the hill from the south, flanked by trees */}
        <Stair a={[0, 0.03, 8.4]} b={[0, -11.3, 22.2]} w={2.2} n={50} m={stairStone} />
        <Forest n={280} hf={bhadraH} area={[100, 100]} ok={(x, z) => Math.hypot(x, z) > 9 && Math.hypot(x, z) < 34 && !(Math.abs(x) < 2.6 && z > 7)} kind="broad" seed={51} sc={[1.2, 2]} />
        <Forest n={90} hf={bhadraH} area={[100, 100]} ok={(x, z) => Math.hypot(x, z) > 10 && Math.hypot(x, z) < 30 && !(Math.abs(x) < 2.6 && z > 7)} kind="pine" seed={52} />
        <Town n={200} hf={bhadraH} area={[130, 130]} ok={(x, z) => Math.hypot(x, z) > 27 && Math.hypot(x, z) < 64} seed={7} />
        <Forest n={150} hf={bhadraH} area={[150, 150]} ok={(x, z) => Math.hypot(x, z) > 58} kind="pine" seed={54} />
        <Range p={[0, -10, -112]} w={280} d={64} snowAt={44} lo="#5e6a58" hi="#8a8a8e" foot="#476c3e" footH={12} seed={13} peaks={annapurna} />
      </group>
    );
  }

  /** A tall Newar shop-house of Bandipur: shutters below, balcony and carved windows above, slate roof. Faces +z. */
  function ShopHouse({ p, r = 0, w = 3.2, d = 2.6, storeys = 3, plaster = '#eadcb8', roofM, wood, balcony = true }) {
    const M = useM();
    const sh = 0.95; const H = storeys * sh;
    const wd = wood || M.plain('#4a2e1a', { roughness: 0.8 });
    const panes = []; const frames = [];
    const n = Math.max(2, Math.floor(w / 0.95));
    for (let s = 0; s < storeys; s += 1) {
      for (let k = 0; k < n; k += 1) {
        const x = -w / 2 + (k + 0.5) * (w / n);
        if (s === 0) { panes.push({ p: [x, sh * 0.42, d / 2 + 0.03], s: [w / n - 0.2, sh * 0.7, 0.05] }); }
        else { panes.push({ p: [x, s * sh + sh * 0.5, d / 2 + 0.03], s: [0.34, sh * 0.5, 0.05] }); frames.push({ p: [x, s * sh + sh * 0.5, d / 2 + 0.015], s: [0.46, sh * 0.6, 0.05] }); }
      }
    }
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[w, H, d]} p={[0, H / 2, 0]} m={M.plain(plaster, { roughness: 0.92 })} />
        <Box s={[w + 0.1, 0.12, d + 0.1]} p={[0, 0.06, 0]} m={slabMat('#d8cfbc', 2, 2)} cast={false} />
        <Inst items={panes} m={M.plain('#1d130c')} cast={false} />
        <Inst items={frames} m={wd} cast={false} />
        {Array.from({ length: storeys - 1 }, (_, s) => <Box key={s} s={[w + 0.06, 0.06, d + 0.06]} p={[0, (s + 1) * sh, 0]} m={wd} cast={false} />)}
        {balcony && storeys > 1 && <group><Box s={[w + 0.2, 0.08, 0.55]} p={[0, sh * 2 - 0.05, d / 2 + 0.28]} m={wd} cast={false} /><Rail pts={[[-w / 2 - 0.1, sh * 2, d / 2 + 0.52], [w / 2 + 0.1, sh * 2, d / 2 + 0.52]]} h={0.42} m={wd} gap={0.22} thick={0.03} /></group>}
        <Gable w={w} d={d} h={0.85} y={H} m={roofM || M.plain('#7a7e84', { roughness: 0.85 })} ov={0.3} />
      </group>
    );
  }

  /* ===================== 7. Bindebasini Temple, Bandipur ===================== */
  const bandipurH = (x, z) => {
    const e = Math.max(0, x > 0 ? x - 16 : -x - 40, Math.abs(z) - 16);
    return -Math.min(34, e * e * 0.07 + e * 0.6) + fbm(x * 0.07, z * 0.07) * 2.5 * smooth(0, 14, e) + smooth(40, 80, Math.hypot(x, z)) * 6;
  };
  const bandipurPeaks = [
    { x: -90, z: 0, h: 70, s: 34 }, { x: -50, z: 6, h: 84, s: 32 }, { x: -12, z: 0, h: 104, s: 38 }, { x: 28, z: 4, h: 92, s: 34 },
    { x: 66, z: 0, h: 80, s: 36 }, { x: 104, z: 6, h: 64, s: 30 },
  ];
  function BindebasiniMain() {
    const M = useM();
    const slate = M.plain('#6a6a68', { roughness: 0.85 });
    const wood = M.plain('#3a2a20', { roughness: 0.8 });
    const brick = M.mat('brick', 2, 1, { color: '#e8a58f' });
    const redWall = M.plain('#a8322a', { roughness: 0.85 });
    const stone = stoneM('#b9b2a4', 2, 2);
    const teal = M.plain('#2f8f86');
    const tiers = [
      { w: 2.7, d: 2.4, h: 1.05, wall: brick, roof: slate, ov: 0.92, rh: 0.5, fringe: M.plain('#c0302a'), sag: 1.35, beam: wood, win: 2, door: true, sc: '#2f8f86' },
      { w: 1.75, d: 1.6, h: 0.85, wall: redWall, roof: slate, ov: 0.72, rh: 0.46, fringe: M.plain('#c0302a'), sag: 1.35, beam: wood, win: 1, door: false, sc: '#2f8f86' },
    ];
    return (
      <group>
        <Box s={[5.6, 0.28, 5.2]} p={[0, 0.14, 0]} m={stone} />
        <Box s={[4.8, 0.28, 4.4]} p={[0, 0.42, 0]} m={stone} />
        <Stair a={[0, 0.56, 2.2]} b={[0, 0.02, 3.4]} w={2.0} n={4} m={stone} solid />
        <Pg tiers={tiers} y0={0.56} finS={0.9} doorGold torana />
        {/* bells hung on timber posts before the door, and the cast-iron lamp-posts of the square */}
        {[-0.85, 0.85].map((x) => <group key={x} position={[x, 0.56, 1.85]}><Box s={[0.1, 0.9, 0.1]} p={[0, 0.45, 0]} m={wood} /><Cyl rt={0.03} rb={0.11} h={0.2} p={[0, 0.68, 0.12]} m={G(M)} seg={10} /></group>)}
        <Lamp p={[-3.6, 0, 3.8]} h={2.6} />
        <Lamp p={[3.7, 0, -2.2]} h={2.4} />
        {[-1, 1].map((k) => <Box key={k} s={[0.34, 0.5, 0.34]} p={[k * 2.9, 0.25, 3.0]} m={stone} />)}
        <Crowd n={9} area={[6, 4]} center={[0, 5]} seed={14} ok={(x, z) => z > 3.2} />
        <Frame s={[12, 6.2, 11]} p={[0, 3, 1.5]} />
      </group>
    );
  }
  function BindebasiniEnv() {
    const M = useM();
    const cf = useMemo(() => (x, z, y) => { const n = fbm(x * 0.3, z * 0.3); return y > -0.5 ? '#9a8f7c' : n > 0.5 ? '#587f3e' : '#4a7338'; }, []);
    const creams = ['#eadcb8', '#e6d2a0', '#efe6d2', '#e8c9a0'];
    const reds = ['#b03a2a', '#a8322a', '#c0482e'];
    return (
      <group>
        <Terrain w={170} d={170} nx={113} nz={113} hf={bandipurH} cf={cf} />
        <Box s={[58, 0.04, 32]} p={[-14, 0.01, 0]} m={slabMat('#cdc3b0', 20, 11)} cast={false} />
        <Box s={[18, 0.05, 15]} p={[0, 0.03, 0]} m={slabMat('#e8dfce', 8, 7)} cast={false} />
        {/* the street of tall Newar shop-houses running south from the square: cream plaster to the west, red brick to the east */}
        {Array.from({ length: 6 }, (_, k) => <ShopHouse key={`n${k}`} p={[-9 - k * 3.7, 0, -8.4]} r={0} w={3.4} d={2.8} storeys={3 + (k % 2)} plaster={creams[k % 4]} />)}
        {Array.from({ length: 6 }, (_, k) => <ShopHouse key={`s${k}`} p={[-9 - k * 3.7, 0, 8.4]} r={Math.PI} w={3.4} d={2.8} storeys={3 + ((k + 1) % 2)} plaster={reds[k % 3]} />)}
        <ShopHouse p={[-33, 0, 0]} r={Math.PI / 2} w={4.4} d={3.0} storeys={3} plaster={creams[1]} />
        {Array.from({ length: 4 }, (_, k) => <ShopHouse key={`b${k}`} p={[-5.5 + k * 5.0, 0, -8.6]} r={0} w={4.2} d={3.0} storeys={3} plaster={k % 2 ? creams[k] : reds[k % 3]} />)}
        <ShopHouse p={[9.6, 0, -3.8]} r={-Math.PI / 2} w={3.4} d={2.8} storeys={3} plaster={reds[1]} />
        <ShopHouse p={[9.6, 0, 0.2]} r={-Math.PI / 2} w={3.4} d={2.8} storeys={4} plaster={creams[2]} />
        {/* power lines are part of the real scene: a pole and sagging wires */}
        <Cyl rt={0.07} h={5} p={[-4.6, 2.5, 5.5]} m={M.plain('#6a6a6a')} seg={6} />
        <Box s={[0.8, 0.06, 0.06]} p={[-4.6, 4.8, 5.5]} m={M.plain('#444')} cast={false} />
        <Forest n={170} hf={bandipurH} area={[150, 150]} ok={(x, z) => (Math.abs(x) > 15 || z < -11 || z > 34) && bandipurH(x, z) > -32} kind="broad" seed={61} sc={[1, 1.8]} />
        <Forest n={140} hf={bandipurH} area={[150, 150]} ok={(x, z) => (Math.abs(x) > 15 || z < -11 || z > 34) && bandipurH(x, z) > -32} kind="pine" seed={62} />
        <Range p={[0, -26, -108]} w={280} d={64} snowAt={42} lo="#5e6a58" hi="#8c8c90" foot="#4a7040" footH={10} seed={15} peaks={bandipurPeaks} />
      </group>
    );
  }

  /* ===================== 8. Khadga Devi Temple, Bandipur ===================== */
  const khadgaH = (x, z) => {
    const r = Math.hypot(x, z);
    return -Math.min(22, Math.max(0, r - 18) * 0.8) + fbm(x * 0.08, z * 0.08) * 2.2 * smooth(18, 40, r) + smooth(46, 84, r) * (r - 44) * 0.4;
  };
  function KhadgaMain() {
    const M = useM();
    const brick = M.mat('brick', 3, 2, { color: '#ffb59a' });
    const brickG = M.mat('brick', 1.4, 1, { color: '#ffb59a' });
    const tile = M.mat('roof', 4, 2, { color: '#d0906c' });
    const stone = stoneM('#b9b2a4', 2, 2);
    const carve = M.plain('#7a4a2a', { roughness: 0.8 });
    const gold = G(M);
    const dark = M.plain('#1d130c');
    const gableEnd = useMemo(() => { const s = new THREE.Shape(); s.moveTo(-1.95, 0); s.lineTo(1.95, 0); s.lineTo(0, 1.35); s.lineTo(-1.95, 0); return new THREE.ShapeGeometry(s); }, []);
    const W = 3.6; const D = 3.2; const H = 2.5; const T = 0.9;
    return (
      <group>
        {/* the shrine stands on a brick-edged stone terrace, reached by a broad flight of steps */}
        <Box s={[W + 1.2, T * 0.5, D + 1.0]} p={[0, T * 0.25, 0]} m={stone} />
        <Box s={[W + 0.6, T * 0.5, D + 0.5]} p={[0, T * 0.75, 0]} m={stone} />
        <Stair a={[0, T, D / 2 + 0.35]} b={[0, 0.02, D / 2 + 3.2]} w={2.7} n={7} m={stone} solid />
        {[-1, 1].map((k) => <Box key={k} s={[0.3, 0.5, 2.6]} p={[k * 1.45, 0.3, D / 2 + 1.9]} r={[0.28, 0, 0]} m={stone} />)}
        <group position={[0, T, 0]}>
          <Box s={[W, H, D]} p={[0, H / 2, 0]} m={brick} />
          <Box s={[W + 0.1, 0.16, D + 0.1]} p={[0, 1.15, 0]} m={M.plain('#b25a3a')} cast={false} />
          {/* iron-grilled central door, two small pointed niches, and the stepped plinth of the porch */}
          <Box s={[0.95, 1.5, 0.08]} p={[0, 0.85, D / 2 + 0.03]} m={dark} />
          <Box s={[1.2, 1.7, 0.06]} p={[0, 0.9, D / 2 + 0.01]} m={carve} cast={false} />
          {[-1.15, 1.15].map((x) => <Box key={x} s={[0.26, 0.5, 0.06]} p={[x, 1.55, D / 2 + 0.03]} m={dark} cast={false} />)}
          <Box s={[1.5, 0.22, 0.6]} p={[0, 0.11, D / 2 + 0.3]} m={stone} />
          {/* the single steep gable roof, ridge front-to-back, with upswept carved eaves */}
          <group position={[0, H, 0]} rotation={[0, Math.PI / 2, 0]}>
            <Gable w={D + 0.2} d={W} h={1.35} y={0} m={tile} ov={0.45} />
          </group>
          <mesh geometry={gableEnd} material={brickG} position={[0, H + 0.02, D / 2 + 0.03]} />
          <mesh geometry={gableEnd} material={brickG} position={[0, H + 0.02, -D / 2 - 0.03]} rotation={[0, Math.PI, 0]} />
          <Box s={[W + 1.1, 0.2, 0.14]} p={[0, H + 0.02, D / 2 + 0.52]} m={carve} />
          <Box s={[W + 1.1, 0.07, 0.16]} p={[0, H - 0.05, D / 2 + 0.52]} m={gold} cast={false} />
          {[-1, 1].map((k) => <Box key={k} s={[0.55, 0.1, 0.16]} p={[k * (W / 2 + 0.78), H + 0.17, D / 2 + 0.52]} r={[0, 0, k * 0.55]} m={carve} />)}
          <Box s={[0.12, 1.15, 0.03]} p={[0, H + 0.6, D / 2 + 0.06]} m={gold} cast={false} />
          <Box s={[0.12, 0.78, 0.03]} p={[0, H - 0.4, D / 2 + 0.62]} r={[0, 0, 0]} m={gold} cast={false} />
          {/* the small raised lantern on the ridge, and the gilded finial */}
          <Box s={[1.1, 0.7, 1.1]} p={[0, H + 1.2, -0.4]} m={brick} />
          <Roof w={1.6} d={1.6} h={0.5} y={H + 1.5} m={tile} sag={1.3} lift={0.1} />
          <Gajur y={H + 1.95} s={0.55} />
        </group>
        {/* stone door-frames with white lattice leaves, and the cast-iron lamp with its wheel */}
        {[[-2.9, 0, 3.6], [2.9, 0, 3.3]].map(([x, y, z], k) => (
          <group key={k} position={[x, y, z]}>
            {[-0.5, 0.5].map((dx) => <Box key={dx} s={[0.2, 1.7, 0.2]} p={[dx, 0.85, 0]} m={M.plain('#6e6a66')} />)}
            <Box s={[1.4, 0.2, 0.25]} p={[0, 1.75, 0]} m={M.plain('#6e6a66')} />
            <Box s={[0.9, 1.5, 0.05]} p={[0.2, 0.8, 0.1]} r={[0, 0.3, 0.1]} m={M.plain('#f1eee8')} />
          </group>
        ))}
        <Lamp p={[-4.4, 0, 4.6]} h={2.8} />
        <mesh position={[-4.4, 2.0, 4.6]} rotation={[0, 0, 0]} material={M.plain('#3a2a22', { metalness: 0.6 })}><torusGeometry args={[0.25, 0.03, 6, 16]} /></mesh>
        <Frame s={[13, 6.5, 12]} p={[0, 3.1, 2]} />
      </group>
    );
  }
  function KhadgaEnv() {
    const M = useM();
    const cf = useMemo(() => (x, z, y) => { const n = fbm(x * 0.3, z * 0.3); const r = Math.hypot(x, z); if (r < 18.5 && y > -0.3) return '#a89f8a'; return n > 0.5 ? '#5f8a45' : '#4a7338'; }, []);
    const tin = M.plain('#2a62b0', { metalness: 0.4, roughness: 0.5 });
    const redHall = M.plain('#c0392b', { roughness: 0.9 });
    return (
      <group>
        <Terrain w={170} d={170} nx={113} nz={113} hf={khadgaH} cf={cf} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow material={slabMat('#cfc7b4', 12, 12)}><circleGeometry args={[18, 56]} /></mesh>
        {/* the long red hall under its blue tin roof, left of the shrine */}
        <group position={[-8.2, 0, 5.2]} rotation={[0, 0.12, 0]}>
          <Box s={[9, 1.9, 2.6]} p={[0, 0.95, 0]} m={redHall} />
          <Gable w={9} d={2.6} h={0.55} y={1.9} m={tin} ov={0.3} />
          {Array.from({ length: 5 }, (_, k) => <Box key={k} s={[0.6, 0.7, 0.05]} p={[-3.4 + k * 1.7, 1.0, 1.32]} m={M.plain('#2a1a10')} cast={false} />)}
          <Box s={[0.7, 0.95, 0.05]} p={[3.9, 0.7, 1.32]} m={M.plain('#f2efe6')} cast={false} />
        </group>
        {/* the great pipal trees of the open ground */}
        {[[9.6, -2.5, 1.2], [-6.5, -9.5, 1.1], [12, -8, 1.0]].map(([x, z, s], k) => (
          <group key={k} position={[x, 0, z]}>
            <Box s={[2.6 * s * 0.6, 0.4, 2.6 * s * 0.6]} p={[0, 0.2, 0]} m={slabMat('#d8cfbc', 2, 2)} />
            <Cyl rt={0.35 * s} rb={0.55 * s} h={2.2 * s} p={[0, 1.1 * s, 0]} m={M.plain('#6a5444')} seg={8} />
            {[[0, 3.3, 0, 2.2], [1.7, 2.9, 0.6, 1.6], [-1.6, 3.0, -0.5, 1.7], [0.3, 4.0, -0.9, 1.5], [0.8, 3.0, 1.6, 1.4]].map(([a, b, c, rr], i) => <Ball key={i} rad={rr * s * 0.8} sc={[1, 0.7, 1]} p={[a * s * 0.8, b * s * 0.8, c * s * 0.8]} m={M.plain(['#4d7a3a', '#5b8a40', '#3f6c34'][i % 3], { roughness: 1 })} />)}
          </group>
        ))}
        <Rail pts={[[-15, 0, -13], [15, 0, -13]]} h={0.5} m={slabMat('#d8cfbc', 2, 2)} gap={1.1} thick={0.08} />
        <Forest n={150} hf={khadgaH} area={[150, 150]} ok={(x, z) => Math.hypot(x, z) > 19 && khadgaH(x, z) > -25} kind="broad" seed={71} sc={[1, 1.8]} />
        <Forest n={100} hf={khadgaH} area={[150, 150]} ok={(x, z) => Math.hypot(x, z) > 20 && khadgaH(x, z) > -25} kind="pine" seed={72} />
        <Town n={90} hf={khadgaH} area={[140, 140]} ok={(x, z) => Math.hypot(x, z) > 32 && Math.hypot(x, z) < 58 && khadgaH(x, z) < -14} seed={9} sc={[1.2, 2.4]} />
        <Range p={[0, -22, -108]} w={280} d={64} snowAt={42} lo="#5e6a58" hi="#8c8c90" foot="#4a7040" footH={10} seed={16} peaks={bandipurPeaks} />
      </group>
    );
  }

  /* ===================== 9. Lo Manthang walled city ===================== */
  const loH = (x, z) => {
    const r = Math.hypot(x, z * 0.9);
    return smooth(30, 90, r) * (r - 28) * 0.55 * (0.5 + fbm(x * 0.05, z * 0.05)) + fbm(x * 0.12, z * 0.12) * 0.5 * smooth(14, 40, r);
  };
  function LoMain() {
    const M = useM();
    const mud = M.mat('ochre', 3, 1, { color: '#c4a77a' });
    const wallM = M.mat('ochre', 8, 1, { color: '#e0bf8c' });
    const white = M.plain('#e9e3d4', { roughness: 0.95 });
    const red = M.plain('#a9362a', { roughness: 0.95 });
    const dark = M.plain('#2a1a10');
    const gold = G(M);
    const W = 19; const D = 13.5; const hw = W / 2; const hd = D / 2;
    const houses = useMemo(() => {
      const r = prng(17); const b = []; const wood = []; const win = [];
      const tints = ['#e9e3d4', '#e1d8c4', '#cfc3aa', '#d8cdb4', '#efe9dc', '#bfae92'];
      const zone = (x, z) => (x > -6.4 && x < -1.2 && z > -4.8 && z < 4.8) || (x > 2.8 && x < 7.2 && z > -5.6 && z < -1.2) || (x > 0.2 && x < 4.5 && z > 1.8 && z < 6.2 && false);
      for (let ix = 0; ix < 11; ix += 1) {
        for (let iz = 0; iz < 7; iz += 1) {
          const x = -hw + 0.9 + ix * 1.62 + (r() - 0.5) * 0.3; const z = -hd + 0.9 + iz * 1.7 + (r() - 0.5) * 0.3;
          if (ix % 4 === 3 || iz === 3 && ix % 2 === 0) continue;
          if (zone(x, z) || r() < 0.08) continue;
          if (Math.abs(x + 3) < 1.0 && z > 3) continue;
          const w = 1.15 + r() * 0.4; const d = 1.2 + r() * 0.35; const h = 0.9 + Math.floor(r() * 3) * 0.55;
          b.push({ p: [x, h / 2, z], s: [w, h, d], c: tints[Math.floor(r() * tints.length)] });
          b.push({ p: [x, h + 0.06, z], s: [w + 0.1, 0.12, d + 0.1], c: '#cdbfa2' });
          wood.push({ p: [x + (r() - 0.5) * 0.2, h + 0.2, z], s: [w * 0.82, 0.22, d * 0.74], c: ['#8a6a46', '#7a5a3a', '#9a7a52'][Math.floor(r() * 3)] });
          win.push({ p: [x - w * 0.15, h * 0.62, z + d / 2 + 0.02], s: [0.16, 0.2, 0.03] });
          if (h > 1.4) win.push({ p: [x + w * 0.2, h * 0.3, z + d / 2 + 0.02], s: [0.14, 0.2, 0.03] });
          win.push({ p: [x + w / 2 + 0.02, h * 0.6, z], s: [0.03, 0.2, 0.16] });
        }
      }
      return { b, wood, win };
    }, []);
    const base = M.plain('#ffffff', { roughness: 0.95 });
    const bigRed = (w, d, h, x, z, k) => (
      <group key={k} position={[x, 0, z]}>
        <Box s={[w, h, d]} p={[0, h / 2, 0]} m={red} />
        <Box s={[w + 0.12, 0.16, d + 0.12]} p={[0, h + 0.08, 0]} m={white} />
        <Box s={[w * 0.7, 0.55, d * 0.7]} p={[0, h + 0.4, 0]} m={red} />
        <Box s={[w * 0.72, 0.1, d * 0.72]} p={[0, h + 0.7, 0]} m={dark} />
        {[-1, 1].map((s) => <group key={s} position={[s * w * 0.28, h + 0.78, 0]}><Cyl rt={0.07} h={0.3} p={[0, 0.15, 0]} m={dark} seg={8} /><mesh position={[0, 0.42, 0]} material={gold}><coneGeometry args={[0.08, 0.26, 8]} /></mesh></group>)}
        {Array.from({ length: 5 }, (_, i) => <Cyl key={i} rt={0.07} h={h * 0.62} p={[-w / 2 + 0.4 + i * ((w - 0.8) / 4), h * 0.31, d / 2 + 0.22]} m={M.plain('#8a2a1e')} seg={8} />)}
        <Box s={[w, 0.12, 0.5]} p={[0, h * 0.62 + 0.08, d / 2 + 0.22]} m={M.plain('#3a2416')} />
        <Box s={[0.7, h * 0.5, 0.05]} p={[0, h * 0.26, d / 2 + 0.03]} m={dark} cast={false} />
      </group>
    );
    return (
      <group>
        {/* the earthen wall with its single gate, its corner bastions and the watchtower */}
        {[[0, -hd, W, 0.5], [0, hd, W, 0.5]].map(([x, z, w, d], k) => <Box key={k} s={[w, 1.5, d]} p={[x, 0.75, z]} m={wallM} />)}
        {[[-hw, 0], [hw, 0]].map(([x, z], k) => <Box key={`v${k}`} s={[0.5, 1.5, D]} p={[x, 0.75, z]} m={wallM} />)}
        {[[-hw, -hd], [hw, -hd], [-hw, hd], [hw, hd]].map(([x, z], k) => <group key={`c${k}`} position={[x, 0, z]}><Cyl rt={0.55} rb={0.7} h={2.1} p={[0, 1.05, 0]} m={wallM} seg={10} /><Cyl rt={0.62} h={0.14} p={[0, 2.15, 0]} m={mud} seg={10} /></group>)}
        <Box s={[W + 0.2, 0.14, 0.6]} p={[0, 1.55, -hd]} m={mud} cast={false} />
        <group position={[-3, 0, hd]}>
          <Box s={[2.2, 2.7, 1.3]} p={[0, 1.35, 0]} m={wallM} />
          <Box s={[1.0, 1.7, 0.1]} p={[0, 0.85, 0.66]} m={dark} />
          <mesh position={[0, 1.7, 0.67]} material={dark}><circleGeometry args={[0.5, 16, 0, Math.PI]} /></mesh>
          <Box s={[2.4, 0.16, 1.5]} p={[0, 2.75, 0]} m={white} />
          <Box s={[0.5, 0.45, 0.5]} p={[0, 3.05, 0]} m={white} />
        </group>
        <Box s={[W, 0.04, D]} p={[0, 0.02, 0]} m={M.plain('#b89a72', { roughness: 1 })} cast={false} />
        <Inst items={houses.b} m={base} />
        <Inst items={houses.wood} m={base} cast={false} />
        <Inst items={houses.win} m={dark} cast={false} />
        {/* the tall many-cornered royal palace, and the three blood-red monastery halls */}
        <group position={[5.0, 0, -3.4]}>
          <Box s={[3.4, 2.4, 2.9]} p={[0, 1.2, 0]} m={white} />
          <Box s={[3.0, 1.3, 2.6]} p={[-0.1, 3.05, 0.0]} m={white} />
          <Box s={[2.4, 1.1, 2.2]} p={[-0.3, 4.25, 0.1]} m={white} />
          <Box s={[1.7, 0.9, 1.5]} p={[-0.6, 5.25, 0]} m={white} />
          {[[1.78, 1.6, 0], [1.78, 3.2, 0], [0, 1.6, 1.5], [0, 3.2, 1.35], [-1.3, 4.3, 1.15]].map(([x, y, z], k) => <group key={k}><Box s={x ? [0.14, 0.8, 1.3] : [1.3, 0.8, 0.14]} p={[x, y, z]} m={M.plain('#5a3a22')} /><Box s={x ? [0.16, 0.6, 1.1] : [1.1, 0.6, 0.16]} p={[x, y, z]} m={dark} cast={false} /></group>)}
          {[0, 1, 2, 3].map((k) => <Box key={`b${k}`} s={[3.5 - k * 0.5, 0.12, 3.0 - k * 0.45]} p={[-k * 0.1, 2.4 + k * 1.15 + (k > 0 ? 0.0 : 0), 0.0]} m={M.plain('#a9362a')} cast={false} />)}
          <Cyl rt={0.03} h={1.4} p={[-0.6, 6.4, 0]} m={M.dark} seg={5} />
          <PrayerFlags from={[-0.6, 6.9, 0]} to={[1.6, 5.0, 1.4]} n={12} />
        </group>
        {bigRed(4.2, 3.2, 2.3, -3.8, -1.0, 'a')}
        {bigRed(3.4, 2.8, 1.8, -3.9, 3.7, 'b')}
        {bigRed(3.2, 2.5, 1.7, 1.2, -4.4, 'c')}
        {[[-0.8, 5.5], [0.9, 5.6]].map(([x, z], k) => <group key={k} position={[x, 0, z]}><Cyl rt={0.4} rb={0.5} h={0.5} p={[0, 0.25, 0]} m={white} seg={4} r={[0, Math.PI / 4, 0]} /><Cyl rt={0.35} h={0.7} p={[0, 0.85, 0]} m={white} seg={14} /><mesh position={[0, 1.4, 0]} material={gold}><coneGeometry args={[0.2, 0.5, 10]} /></mesh></group>)}
        {Array.from({ length: 3 }, (_, k) => <PrayerFlags key={k} from={[-4.4, 2.8, -2.6 + k * 2]} to={[0, 3.2, 0.5 + k]} n={14} />)}
        <Frame s={[23, 7.4, 18]} p={[0, 3.4, 0.5]} />
      </group>
    );
  }
  function LoEnv() {
    const M = useM();
    const cf = useMemo(() => (x, z, y) => {
      const n = fbm(x * 0.2, z * 0.2); const band = Math.sin(y * 0.9 + n * 3) > 0.2;
      if (y < 0.5) return n > 0.55 ? '#d6b57c' : '#c9a468';
      return band ? '#a58460' : '#85694c';
    }, []);
    const fields = useMemo(() => { const r = prng(23); const a = []; for (let i = 0; i < 48; i += 1) { const ang = r() * Math.PI * 2; const rad = 13.5 + r() * 15; const x = Math.cos(ang) * rad * 1.15; const z = Math.sin(ang) * rad * 0.95; if (Math.abs(x + 3) < 3.2 && z > 0) continue; a.push({ x, z, w: 2.6 + r() * 3.6, d: 2.2 + r() * 3, c: ['#6f9a3a', '#8db048', '#c9b84a', '#5a8a3a', '#d8c45a'][Math.floor(r() * 5)], rot: r() * 0.4 }); } return a; }, []);
    return (
      <group>
        <Terrain w={170} d={170} nx={113} nz={113} hf={loH} cf={cf} />
        {/* the patchwork of barley and buckwheat fields round the walls, and poplar groves */}
        {fields.map((f, i) => <mesh key={i} rotation={[-Math.PI / 2, 0, f.rot]} position={[f.x, 0.03, f.z]} receiveShadow><planeGeometry args={[f.w, f.d]} /><meshStandardMaterial color={f.c} roughness={1} /></mesh>)}
        <Forest n={60} area={[56, 46]} ok={(x, z) => { const q = Math.hypot(x * 0.87, z * 1.05); return q > 13 && q < 27 && !(Math.abs(x + 3) < 3.5 && z > 0); }} kind="poplar" seed={81} sc={[1.0, 1.8]} cols={['#6f9a3a', '#8db048', '#a8b848', '#c9b84a']} />
        <Ribbon pts={[[-3, 7], [-4, 16], [-12, 28], [-30, 44], [-46, 60]]} w={2.4} y={0.025} color="#b9a07a" metal={0} rough={1} seg={20} />
        <Ribbon pts={[[-70, 18], [-45, 22], [-22, 16], [-6, 24], [20, 20], [50, 30], [80, 26]]} w={3.4} y={0.012} color="#8aa09c" seg={30} />
        {Array.from({ length: 50 }, (_, k) => { const r = prng(k + 40); const x = (r() - 0.5) * 130; const z = -20 - r() * 45; return <Rock key={k} p={[x, loH(x, z) + 0.3, z]} s={[1 + r() * 2, 0.8 + r() * 1.2, 1 + r() * 2]} seed={k} c="#a88a68" detail={0} />; })}
        <Range p={[0, -4, -118]} w={290} d={64} snowAt={50} lo="#8a7058" hi="#a89478" seed={19}
          peaks={[{ x: -100, z: 0, h: 82, s: 36 }, { x: -55, z: 4, h: 104, s: 38 }, { x: -8, z: 0, h: 118, s: 44 }, { x: 44, z: 4, h: 100, s: 38 }, { x: 96, z: 0, h: 78, s: 34 }]} />
      </group>
    );
  }

  /* ===================== 10. Kagbeni and Kag Chode ===================== */
  const kagH = (x, z) => {
    const back = Math.max(0, -z - 7); const side = Math.max(0, Math.abs(x) - 20); const front = Math.max(0, z - 26);
    return Math.min(55, back * back * 0.075 + back * 0.5 + side * side * 0.05) + fbm(x * 0.06, z * 0.06) * 5 * smooth(2, 24, back + side) + smooth(10, 30, z) * 0 - front * front * 0.02 + smooth(70, 90, Math.hypot(x, z)) * 6;
  };
  function KagMain() {
    const M = useM();
    const red = M.plain('#a9362a', { roughness: 0.95 });
    const redO = M.plain('#b8452f', { roughness: 0.95 });
    const white = M.plain('#efe9dc', { roughness: 0.95 });
    const dark = M.plain('#2a1a10');
    const spur = crag('#96805f');
    const gold = G(M);
    const houses = useMemo(() => {
      const r = prng(31); const b = []; const win = []; const cols = ['#d8cdb4', '#e9e3d4', '#b8a888', '#c9b79a', '#d9a890'];
      for (let i = 0; i < 26; i += 1) {
        const x = -7.5 + r() * 15; const z = 2.4 + r() * 6.2; if (Math.abs(x) < 3.0 && z < 5) continue;
        const w = 1.1 + r() * 0.8; const d = 1.0 + r() * 0.7; const h = 0.8 + r() * 0.9; const y = -Math.max(0, z - 4.6) * 0.18;
        b.push({ p: [x, y + h / 2, z], s: [w, h, d], c: cols[Math.floor(r() * cols.length)] });
        b.push({ p: [x, y + h + 0.05, z], s: [w + 0.08, 0.1, d + 0.08], c: '#a89474' });
        win.push({ p: [x, y + h * 0.6, z + d / 2 + 0.02], s: [0.16, 0.2, 0.03] });
      }
      return { b, win };
    }, []);
    const base = M.plain('#ffffff', { roughness: 0.95 });
    const slitsFront = useMemo(() => [-1.2, 0, 1.2].flatMap((x) => [0.9, 1.8, 2.5].map((y) => ({ p: [x, y, 1.53], s: [0.34, 0.42, 0.06] }))), []);
    return (
      <group>
        {/* the rocky spur */}
        <Rock p={[0, 0.2, -0.5]} s={[6.4, 2.3, 4.8]} seed={3} m={spur} />
        <Rock p={[-2.6, -0.1, 1.2]} s={[3.2, 1.5, 3.0]} seed={5} m={spur} />
        <Rock p={[3.0, -0.2, 1.8]} s={[3.2, 1.4, 2.8]} seed={8} m={spur} />
        <Rock p={[0.4, -0.5, 4.0]} s={[4.6, 1.2, 2.4]} seed={11} m={spur} />
        <group position={[0, 1.9, -0.3]}>
          <Box s={[4.4, 3.4, 3.1]} p={[0, 1.7, 0]} m={red} />
          <Box s={[4.1, 0.1, 2.9]} p={[0, 3.45, 0]} m={white} />
          <Box s={[4.6, 0.22, 3.3]} p={[0, 3.62, 0]} m={white} />
          <Box s={[3.6, 0.4, 2.7]} p={[0, 3.93, 0]} m={M.plain('#2a1a10')} />
          <Inst items={slitsFront} m={dark} cast={false} />
          {[-1.2, 0, 1.2].flatMap((x) => [0.9, 1.8, 2.5].map((y) => <Box key={`${x}${y}`} s={[0.46, 0.54, 0.04]} p={[x, y, 1.53]} m={white} cast={false} />))}
          <Box s={[0.9, 1.3, 0.1]} p={[0, 0.65, 1.57]} m={dark} />
          <Cyl rt={0.05} h={4.4} p={[2.9, 2.2, 1.8]} m={M.plain('#8a6a40')} seg={6} />
          <PrayerFlags from={[2.9, 4.3, 1.8]} to={[-0.5, 3.6, 1.8]} n={14} />
          <PrayerFlags from={[2.9, 4.3, 1.8]} to={[4.8, 0.4, 3.4]} n={12} />
          {/* the lower block and the little gilded hall */}
          <Box s={[2.9, 1.9, 2.5]} p={[-3.4, 0.95, 0.4]} m={redO} />
          <Box s={[3.1, 0.14, 2.7]} p={[-3.4, 1.98, 0.4]} m={white} />
          <group position={[3.0, 0, 1.2]}>
            <Box s={[2.2, 1.7, 1.9]} p={[0, 0.85, 0]} m={white} />
            <Box s={[2.3, 0.35, 2.0]} p={[0, 1.2, 0]} m={redO} />
            <Box s={[1.3, 0.8, 1.2]} p={[0, 2.1, 0]} m={white} />
            <Roof w={1.9} d={1.7} h={0.55} y={2.45} m={gold} sag={1.3} lift={0.18} />
            <Gajur y={2.95} s={0.5} />
            {[-0.8, 0.8].map((x) => <Box key={x} s={[0.22, 0.2, 0.22]} p={[x, 1.85, 0.8]} m={gold} />)}
          </group>
        </group>
        {/* a whitewashed chorten with its timber canopy, houses of mud and stone, ruined adobe towers */}
        <group position={[-1.8, 0, 4.2]}>
          <Box s={[1.1, 0.4, 1.1]} p={[0, 0.2, 0]} m={M.plain('#b8a888')} />
          <Cyl rt={0.4} h={0.8} p={[0, 0.8, 0]} m={white} seg={14} />
          {[[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]].map(([x, z]) => <Box key={`${x}${z}`} s={[0.05, 0.8, 0.05]} p={[x, 0.8, z]} m={redO} />)}
          <Box s={[1.2, 0.12, 1.2]} p={[0, 1.26, 0]} m={M.plain('#5a4a38')} />
          <mesh position={[0, 1.55, 0]} material={M.plain('#8a8478')}><coneGeometry args={[0.22, 0.5, 8]} /></mesh>
        </group>
        <Inst items={houses.b} m={base} />
        <Inst items={houses.win} m={dark} cast={false} />
        {[[-6.8, 2.0, 2.6], [6.4, 4.4, 2.2], [-5.0, 8.0, 2.0]].map(([x, z, h], k) => (
          <group key={k} position={[x, 0, z]}>
            <Cyl rt={0.55} rb={0.85} h={h} p={[0, h / 2, 0]} m={M.mat('ochre', 2, 2, { color: '#b8946a' })} seg={4} r={[0, Math.PI / 4, 0]} />
            <Box s={[0.5, 0.5, 0.5]} p={[0.2, h + 0.1, 0.1]} m={M.mat('ochre', 1, 1, { color: '#a88458' })} />
          </group>
        ))}
        <Frame s={[16, 7.2, 14]} p={[0, 3.2, 3.5]} />
      </group>
    );
  }
  function KagEnv() {
    const M = useM();
    const cf = useMemo(() => (x, z, y) => {
      const n = fbm(x * 0.22, z * 0.22);
      if (z > 12 && z < 32 && y < 1) return '#8c8f8a';
      if (y < 0.6) return n > 0.5 ? '#b09a74' : '#a28c68';
      const band = Math.sin(y * 1.1 + n * 4) > 0.1;
      return band ? '#6a5039' : '#8a6c4c';
    }, []);
    return (
      <group>
        <Terrain w={170} d={170} nx={113} nz={113} hf={kagH} cf={cf} />
        {/* the grey braided Kali Gandaki in front of the village, with gravel bars and a plank bridge */}
        <Ribbon pts={[[-90, 20], [-50, 22], [-20, 18], [10, 21], [40, 17], [90, 24]]} w={13} y={0.03} color="#8c9a98" seg={40} />
        <Ribbon pts={[[-90, 22], [-40, 18], [0, 20], [30, 19], [90, 22]]} w={7} y={0.05} color="#7f9ea2" seg={40} />
        <Ribbon pts={[[-90, 13], [-45, 15], [0, 14], [45, 13], [90, 15]]} w={3.4} y={0.04} color="#aab0aa" metal={0} rough={1} seg={40} />
        {[[-24, 17, 3], [-8, 22, 2.4], [14, 17, 3.2], [30, 22, 2.6], [-40, 21, 2.8]].map(([x, z, s], k) => <Rock key={k} p={[x, 0.1, z]} s={[s * 1.6, 0.18, s * 0.8]} seed={k + 20} m={M.plain('#b8b4a8', { roughness: 1 })} detail={0} />)}
        <Box s={[10, 0.12, 1.2]} p={[-3, 0.34, 20.5]} m={M.plain('#6b4a2a')} />
        <Forest n={50} hf={kagH} area={[110, 14]} center={[0, 11]} ok={(x, z) => Math.abs(x) > 6 || z > 9} kind="poplar" seed={91} sc={[1.1, 1.9]} cols={['#6f9a3a', '#8db048', '#c9b84a', '#d8c45a']} />
        <Range p={[0, -4, -118]} w={290} d={64} snowAt={52} lo="#7b6650" hi="#9b8b76" seed={25}
          peaks={[{ x: -90, z: 0, h: 80, s: 36 }, { x: -40, z: 4, h: 108, s: 40 }, { x: 8, z: 0, h: 120, s: 44 }, { x: 56, z: 4, h: 96, s: 38 }, { x: 104, z: 0, h: 74, s: 34 }]} />
      </group>
    );
  }

  /* ===================== 11. Galeshwor Dham ===================== */
  const galeH = (x, z) => {
    const e = Math.max(0, Math.abs(x - 4) - 20); const n = Math.max(0, -z - 30); const s = Math.max(0, z - 50);
    return -5.5 + Math.min(70, e * e * 0.1 + e * 1.1 + n * n * 0.08 + s * s * 0.06) + fbm(x * 0.07, z * 0.07) * 6 * smooth(0, 20, e + n + s);
  };
  const makeDist = (pts) => { const P = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z))).getPoints(80); return (x, z) => { let m = 1e9; for (const q of P) { const d = Math.hypot(q.x - x, q.z - z); if (d < m) m = d; } return m; }; };
  const galeKali = [[8, -90], [9, -44], [7, -14], [9, 6], [12, 34], [14, 90]];
  const galeRahu = [[-90, -22], [-44, -14], [-16, -6], [1, -3.5], [8, -2]];
  const galeDk = makeDist(galeKali); const galeDr = makeDist(galeRahu);
  function GaleshMain() {
    const M = useM();
    const rock = crag('#9b988c');
    const rock2 = crag('#8a8678');
    const white = M.plain('#f4f1ea', { roughness: 0.8 });
    const roofRed = M.plain('#b5503c', { metalness: 0.3, roughness: 0.55 });
    const yellow = M.plain('#e8c840', { roughness: 0.7 });
    const wallLow = M.mat('brick', 2, 1, { color: '#e0b898' });
    const cream = M.plain('#ecd890', { roughness: 0.85 });
    const tiers = [
      { w: 2.7, d: 2.5, h: 0.95, wall: wallLow, roof: roofRed, ov: 0.95, rh: 0.55, fringe: yellow, sag: 1.35, beam: yellow, win: 2, door: true },
      { w: 1.7, d: 1.6, h: 0.78, wall: cream, roof: roofRed, ov: 0.72, rh: 0.5, fringe: yellow, sag: 1.35, beam: yellow, door: false, win: 1 },
    ];
    const rail = useMemo(() => [[-3.5, 0, -3.1], [3.5, 0, -3.1], [3.5, 0, 3.1], [-3.5, 0, 3.1], [-3.5, 0, -3.1]].map((q) => q), []);
    return (
      <group>
        {/* the huge riverside rock of Galeshwor, bedded like slate, standing between the two rivers */}
        <Rock p={[0, -2.9, 0]} s={[5.2, 3.2, 4.8]} seed={2} m={rock} />
        <Rock p={[-1.8, -3.0, 1.4]} s={[3.4, 3.0, 3.2]} seed={6} m={rock2} />
        <Rock p={[2.6, -3.1, 0.8]} s={[3.2, 3.2, 3.2]} seed={9} m={rock2} />
        <Rock p={[0.6, -3.4, -2.6]} s={[3.8, 3.0, 2.6]} seed={13} m={rock} />
        <Rock p={[-3.2, -3.9, -1.0]} s={[2.4, 2.0, 2.4]} seed={17} m={rock2} />
        <Box s={[7.2, 0.5, 6.4]} p={[0, -0.25, 0]} m={rock} />
        <Box s={[7.3, 0.1, 6.5]} p={[0, -0.02, 0]} m={slabMat('#d8d0c0', 3, 3)} cast={false} />
        <Box s={[4.9, 0.3, 4.4]} p={[0, 0.15, -0.2]} m={white} />
        <Box s={[4.2, 0.24, 3.8]} p={[0, 0.42, -0.2]} m={white} />
        <group position={[0, 0, -0.2]}><Pg tiers={tiers} y0={0.54} finS={0.9} doorGold /></group>
        <Box s={[1.1, 0.9, 0.9]} p={[2.8, 0.45, 2.0]} m={white} />
        <group position={[2.8, 0.9, 2.0]} scale={0.9}><Nandi p={[0, 0, 0]} face={Math.PI} /></group>
        <Trident p={[-2.5, 0, 2.2]} h={2.1} />
        {[-1, 1].map((k) => <group key={k} position={[k * 1.25, 0, 3.0]}><Box s={[0.3, 1.1, 0.3]} p={[0, 0.55, 0]} m={white} /><Box s={[0.4, 0.1, 0.4]} p={[0, 1.15, 0]} m={white} /><mesh position={[0, 1.4, 0]} material={G(M)}><coneGeometry args={[0.13, 0.35, 8]} /></mesh></group>)}
        <Rail pts={rail} h={0.5} m={white} gap={0.55} thick={0.05} />
        {/* white concrete stairway cut into the rock, descending to the grey river */}
        <Stair a={[-3.4, -0.05, 2.2]} b={[-8.6, -5.2, 5.8]} w={1.2} n={22} m={M.plain('#e8e4da')} />
        <Rail pts={[[-3.0, -0.05, 2.8], [-8.2, -5.2, 6.4]]} h={0.55} m={white} gap={0.7} thick={0.06} />
        <Rail pts={[[-3.8, -0.05, 1.6], [-9.0, -5.2, 5.2]]} h={0.55} m={white} gap={0.7} thick={0.06} />
        <Frame s={[15, 8, 15]} p={[-1.5, 2.2, 1.0]} />
      </group>
    );
  }
  function GaleshEnv() {
    const M = useM();
    const cf = useMemo(() => (x, z, y) => {
      const n = fbm(x * 0.25, z * 0.25);
      const dd = Math.min(galeDk(x, z) - 5.8, galeDr(x, z) - 2.8);
      if (dd < 1.5 && y < -4.6) return n > 0.5 ? '#aaa592' : '#9a9584';
      if (y < -4.6) return n > 0.55 ? '#8fb85a' : '#7fa84a';
      if (y > 22) return n > 0.5 ? '#8a8478' : '#9a9488';
      if (y > 12 && n > 0.62) return '#9a9488';
      return n > 0.55 ? '#4a7a3a' : n > 0.3 ? '#3d6a32' : '#587f3e';
    }, []);
    const fields = useMemo(() => { const r = prng(55); const a = []; for (let i = 0; i < 26; i += 1) { const x = -34 + r() * 28; const z = 8 + r() * 34; if (galeH(x, z) > -4.8 || Math.abs(x - 10) < 8) continue; a.push({ x, z, w: 3 + r() * 3, d: 2 + r() * 2.5, c: ['#7fbf3a', '#9ccf4a', '#6aa83a'][i % 3] }); } return a; }, []);
    return (
      <group>
        <Terrain w={170} d={170} nx={113} nz={113} hf={galeH} cf={cf} />
        <Ribbon pts={galeKali} w={11} y={-5.2} color="#97a39e" metal={0.2} rough={0.25} seg={50} />
        <Ribbon pts={galeKali.map(([x, z]) => [x + 1.5, z])} w={4} y={-5.15} color="#cfd8d4" metal={0} rough={0.9} seg={50} />
        <Ribbon pts={galeRahu} w={5} y={-5.15} color="#b8c6c2" metal={0.1} rough={0.4} seg={40} />
        {fields.map((f, i) => <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[f.x, -5.34, f.z]}><planeGeometry args={[f.w, f.d]} /><meshStandardMaterial color={f.c} roughness={1} /></mesh>)}
        {Array.from({ length: 36 }, (_, k) => { const r = prng(k + 8); const x = (r() - 0.5) * 36; const z = -40 + r() * 100; return <Rock key={k} p={[x + (x > 0 ? 6 : -6), -5.3, z]} s={[0.6 + r() * 1.4, 0.5 + r() * 0.8, 0.6 + r() * 1.2]} seed={k} c="#b6afa0" detail={0} />; })}
        <Forest n={380} hf={galeH} area={[150, 150]} ok={(x, z) => galeH(x, z) > -4.5 && Math.hypot(x, z) > 7} kind="broad" seed={101} sc={[1.1, 2.2]} />
        <Forest n={160} hf={galeH} area={[150, 150]} ok={(x, z) => galeH(x, z) > -3 && galeH(x, z) < 30} kind="pine" seed={102} />
        <Town n={40} hf={galeH} area={[30, 36]} center={[-14, 26]} ok={(x, z) => galeH(x, z) > -5.2 && galeH(x, z) < -3.6} seed={12} sc={[1.2, 2.2]} />
        <Range p={[0, -16, -118]} w={290} d={64} snowAt={52} lo="#5c6a54" hi="#8a8a8c" foot="#4a7040" footH={14} seed={29}
          peaks={[{ x: -80, z: 0, h: 74, s: 36 }, { x: -30, z: 4, h: 96, s: 38 }, { x: 24, z: 0, h: 112, s: 42 }, { x: 76, z: 4, h: 88, s: 36 }]} />
      </group>
    );
  }

  /* ===================== 12. Devghat Dham ===================== */
  const nWf = (t) => 26 * (0.32 + 0.68 * smooth(0, 0.22, t));
  const devRivers = [
    { pts: [[0, 8], [2, 30], [9, 58], [18, 92]], wf: nWf },
    { pts: [[-56, -62], [-36, -36], [-17, -15], [-6, -1], [-1, 7]], wf: () => 13 },
    { pts: [[60, -54], [40, -30], [19, -12], [7, 0], [2, 7]], wf: () => 13 },
  ];
  const devSamples = devRivers.map((rv) => {
    const c = new THREE.CatmullRomCurve3(rv.pts.map(([x, z]) => new THREE.Vector3(x, 0, z)));
    const P = c.getPoints(60);
    return P.map((q, i) => ({ x: q.x, z: q.z, hw: rv.wf(i / 60) / 2 }));
  });
  const devDr = (x, z) => { let m = 1e9; for (const s of devSamples) for (const q of s) { const d = Math.hypot(q.x - x, q.z - z) - q.hw; if (d < m) m = d; } return m; };
  const devH = (x, z) => {
    const dr = devDr(x, z);
    return -2.7 + smooth(-2.5, 2.5, dr) * 2.7 + smooth(10, 46, dr) * (16 + fbm(x * 0.06, z * 0.06) * 16) + smooth(46, 90, Math.hypot(x, z)) * 6;
  };
  function DevMain() {
    const M = useM();
    const white = M.plain('#f4f1ea', { roughness: 0.8 });
    const slate = M.plain('#7d7a76', { roughness: 0.8 });
    const brick = M.mat('brick', 2, 1, { color: '#ee9a74' });
    const orange = M.plain('#d4622f', { roughness: 0.9 });
    const stone = slabMat('#e4dac8', 2, 2);
    const gold = G(M);
    const cone = useMemo(() => new THREE.LatheGeometry([[0.95, 0], [0.98, 0.1], [0.8, 0.22], [0.62, 0.55], [0.42, 0.95], [0.24, 1.35], [0.1, 1.65]].map(([r, y]) => new THREE.Vector2(r, y)), 20), []);
    const tiers = [
      { w: 2.3, d: 2.3, h: 0.95, wall: brick, roof: slate, ov: 0.85, rh: 0.5, sag: 1.4, win: 2, door: true },
      { w: 1.5, d: 1.5, h: 0.75, wall: brick, roof: slate, ov: 0.65, rh: 0.44, sag: 1.4, win: 1, door: false },
    ];
    return (
      <group>
        <Box s={[15, 0.1, 9.5]} p={[0, 0.05, -0.5]} m={stone} cast={false} />
        {/* the two-roofed temple among the trees */}
        <Box s={[3.6, 0.28, 3.6]} p={[-3.8, 0.14, -1.2]} m={stone} />
        <group position={[-3.8, 0.28, -1.2]}><Pg tiers={tiers} finS={0.8} doorGold /></group>
        {/* red shikhara huts with white conical caps, as in the Bageshwori temple */}
        <group position={[2.8, 0, -1.4]}>
          <Box s={[2.0, 0.3, 2.0]} p={[0, 0.15, 0]} m={stone} />
          <Box s={[1.7, 1.5, 1.7]} p={[0, 1.05, 0]} m={orange} />
          <Box s={[1.9, 0.14, 1.9]} p={[0, 1.85, 0]} m={white} />
          <mesh geometry={cone} material={white} position={[0, 1.9, 0]} scale={1.05} castShadow />
          <mesh position={[0, 3.62, 0]} material={gold}><coneGeometry args={[0.07, 0.34, 8]} /></mesh>
          <Box s={[0.6, 1.0, 0.06]} p={[0, 0.8, 0.88]} m={M.plain('#2a1a10')} cast={false} />
        </group>
        <group position={[5.4, 0, -1.8]}>
          <Cyl rt={0.75} rb={0.8} h={0.95} p={[0, 0.48, 0]} m={M.plain('#e08a58')} seg={14} />
          <mesh position={[0, 0.95, 0]} material={white} castShadow><sphereGeometry args={[0.8, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
          <mesh position={[0, 1.8, 0]} material={gold}><coneGeometry args={[0.06, 0.3, 8]} /></mesh>
        </group>
        {/* the golden-lit entrance arch above the bathing steps */}
        {[-1, 1].map((k) => <Box key={k} s={[0.34, 2.3, 0.34]} p={[k * 2.0, 1.15, 3.2]} m={orange} />)}
        <mesh position={[0, 2.3, 3.2]} material={M.plain('#e8b830', { metalness: 0.6, roughness: 0.4 })}><torusGeometry args={[2.0, 0.1, 8, 32, Math.PI]} /></mesh>
        <Stair a={[0, 0.0, 3.4]} b={[0, -1.35, 7.4]} w={9.4} n={9} m={stone} solid base={-1.4} />
        {[-1, 1].map((k) => <group key={k} position={[k * 5.6, 0, 3.4]}><Box s={[0.8, 0.5, 0.8]} p={[0, 0.25, 0]} m={white} /><Lingam p={[0, 0.5, 0]} /></group>)}
        <Trident p={[-6.2, 0, 1.4]} h={2.2} />
        <Trident p={[6.4, 0, 1.2]} h={2.2} />
        <BellPavilion p={[-1.4, 0, 1.2]} s={0.5} />
        {Array.from({ length: 8 }, (_, k) => <Diyo key={k} p={[-1.4 + k * 0.4, 0.02 - k * 0.0, 3.6]} />)}
        <PrayerFlags from={[-6.2, 2.4, 1.4]} to={[6.4, 2.4, 1.2]} n={30} />
        <Forest n={34} area={[17, 7]} center={[0, -5.4]} ok={(x, z) => z < -3.6} kind="broad" seed={111} sc={[1.5, 2.5]} />
        <Crowd n={18} area={[9, 3.4]} center={[0, 5.2]} y={-0.3} seed={21} ok={(x, z) => z > 4.2} />
        <Frame s={[16, 6.2, 14]} p={[0, 2.6, 1.5]} />
      </group>
    );
  }
  function DevEnv() {
    const M = useM();
    const cf = useMemo(() => (x, z, y) => {
      const dr = devDr(x, z); const n = fbm(x * 0.3, z * 0.3);
      if (dr < 1) return '#d4c8a0';
      if (dr < 4) return '#b8b78a';
      if (y > 8) return n > 0.5 ? '#3f6a32' : '#4a7a3a';
      return n > 0.5 ? '#6f9448' : '#5f8640';
    }, []);
    const steel = M.plain('#8a8d92', { metalness: 0.7, roughness: 0.4 });
    const bz = 30;
    const cableY = (x) => 1.9 + 4.6 * ((x - 2.5) / 14.7) ** 2;
    const hangers = useMemo(() => Array.from({ length: 28 }, (_, k) => { const x = -11 + k * 1.0; const y = cableY(x); return [-0.75, 0.75].map((dz) => ({ p: [x, (0.65 + y) / 2, bz + dz], s: [0.02, y - 0.65, 0.02] })); }).flat(), []);
    const sands = [[-9, 16, 7, 3], [17, 20, 9, 3.5], [14, 44, 11, 3], [-4, 50, 8, 3], [24, 70, 12, 3.4]];
    return (
      <group>
        <Terrain w={170} d={170} nx={113} nz={113} hf={devH} cf={cf} />
        <Ribbon pts={devRivers[0].pts} wf={nWf} y={-1.4} color="#6f9488" seg={60} />
        <Ribbon pts={devRivers[1].pts} w={13} y={-1.4} color="#7f9e94" seg={60} />
        <Ribbon pts={devRivers[2].pts} w={13} y={-1.4} color="#6aa0a0" seg={60} />
        {sands.map(([x, z, w, d], k) => <mesh key={k} position={[x, -1.33, z]} scale={[w, 1, d]} rotation={[0, k, 0]}><cylinderGeometry args={[1, 1, 0.1, 18]} /><meshStandardMaterial color="#d8cfae" roughness={1} /></mesh>)}
        {/* the long suspension bridge across the Narayani, hung with prayer flags */}
        <Box s={[34, 0.12, 1.6]} p={[2.5, 0.6, bz]} m={M.plain('#6b5a48')} />
        {[-1, 1].map((k) => <Rail key={k} pts={[[-14, 0.66, bz + k * 0.78], [19, 0.66, bz + k * 0.78]]} h={0.8} m={steel} gap={1.6} thick={0.03} />)}
        {[-12, 17].map((x) => (
          <group key={x} position={[x, 0, bz]}>
            {[-0.95, 0.95].map((dz) => <Box key={dz} s={[0.34, 6.4, 0.34]} p={[0, 3.2, dz]} m={M.plain('#c9c4b8')} />)}
            <Box s={[0.34, 0.3, 2.4]} p={[0, 6.2, 0]} m={M.plain('#c9c4b8')} />
            <Box s={[0.3, 0.2, 2.2]} p={[0, 3.6, 0]} m={M.plain('#c9c4b8')} />
          </group>
        ))}
        {[-0.95, 0.95].map((dz) => <Cable key={dz} pts={[[-12, 6.4, bz + dz], [-6, 3.2, bz + dz], [2.5, 1.9, bz + dz], [10, 3.3, bz + dz], [17, 6.4, bz + dz]]} r={0.06} m={steel} />)}
        <Inst items={hangers} m={steel} cast={false} />
        <PrayerFlags from={[-12, 2.0, bz]} to={[17, 2.0, bz]} n={44} />
        {/* ashram roofs on the wedge of land between the rivers */}
        <Town n={48} hf={devH} area={[26, 28]} center={[0, -14]} ok={(x, z) => devDr(x, z) > 3 && z < -5 && Math.abs(x) < 12} seed={14} sc={[1.2, 2.2]} walls={['#f1ece0', '#e8d9bf', '#d9c9a0', '#efe6d2']} roofs={['#b8402e', '#a8452f', '#c0482e', '#5a7a4a']} />
        <Forest n={220} hf={devH} area={[150, 150]} ok={(x, z) => devDr(x, z) > 4 && Math.hypot(x, z - 4) > 12 && !(z > 24 && z < 36)} kind="sal" seed={112} sc={[1.2, 2.2]} />
        <Forest n={140} hf={devH} area={[150, 150]} ok={(x, z) => devDr(x, z) > 8 && devH(x, z) > 4} kind="broad" seed={113} sc={[1.3, 2.3]} />
        {Array.from({ length: 22 }, (_, k) => { const r = prng(k + 90); const x = -40 + r() * 80; const z = 38 + r() * 40; if (devDr(x, z) < 6 || Math.abs(devH(x, z)) > 0.5) return null; return <mesh key={k} rotation={[-Math.PI / 2, 0, r() * 0.5]} position={[x, 0.03, z]}><planeGeometry args={[3 + r() * 4, 2 + r() * 3]} /><meshStandardMaterial color={['#c8b45a', '#7fa04a', '#9ccf4a'][k % 3]} roughness={1} /></mesh>; })}
        <Range p={[0, -4, -116]} w={290} d={64} snowAt={55} lo="#5c6a54" hi="#8a8a8c" foot="#4a7040" footH={14} seed={33}
          peaks={[{ x: -80, z: 0, h: 66, s: 36 }, { x: -20, z: 4, h: 82, s: 38 }, { x: 40, z: 0, h: 70, s: 36 }, { x: 96, z: 4, h: 60, s: 32 }]} />
      </group>
    );
  }

  /* ===================== 13. Siddha Cave, Bimalnagar ===================== */
  const siddhaH = (x, z) => {
    const up = Math.max(0, -z - 6); const down = Math.max(0, z - 3);
    return up * 0.62 - Math.min(26, down * 0.55) + Math.pow(Math.max(0, Math.abs(x) - 9), 1.3) * 0.5 + fbm(x * 0.08, z * 0.08) * 3 * smooth(4, 24, Math.abs(x) + up + down);
  };
  function SiddhaMain() {
    const M = useM();
    const lime = crag('#a9a89b');
    const moss = crag('#7e9566');
    const inner = M.mat('rock', 3, 2, { color: '#b8956a', side: THREE.BackSide });
    const cream = M.plain('#e0cfa8', { roughness: 0.7 });
    const stone = slabMat('#cfc7b6', 2, 2);
    const blue = M.plain('#3f7fb5', { roughness: 0.6 });
    const gold = G(M);
    const st = useMemo(() => {
      const r = prng(7); const down = []; const up = [];
      for (let k = 0; k < 46; k += 1) {
        const x = (r() - 0.5) * 3.0; const z = -6.8 + r() * 6.9; const ceil = 1.5 + Math.sqrt(Math.max(0.2, 3.9 - x * x)); const len = 0.35 + r() * 1.3; const rr = 0.07 + r() * 0.15;
        down.push({ p: [x, ceil - len / 2 - 0.05, z], s: [rr, len, rr], r: [Math.PI, 0, 0] });
      }
      for (let k = 0; k < 16; k += 1) { const x = (r() - 0.5) * 3.0; const z = -6.8 + r() * 6.6; const len = 0.3 + r() * 0.9; const rr = 0.1 + r() * 0.2; up.push({ p: [x, 0.3 + len / 2, z], s: [rr, len, rr] }); }
      return { down, up };
    }, []);
    const ring = useMemo(() => Array.from({ length: 11 }, (_, k) => { const a = (-0.12 + (k / 10) * 1.24) * Math.PI; return { x: Math.cos(a) * 2.8, y: 1.5 + Math.sin(a) * 2.8, k }; }), []);
    return (
      <group>
        {/* the cliff of mossy limestone with the cave mouth in its face */}
        <Rock p={[0, 4.3, -2.4]} s={[6.4, 2.6, 5.0]} seed={4} m={moss} />
        <Rock p={[-4.6, 1.8, -1.0]} s={[3.4, 3.2, 4.2]} seed={7} m={lime} />
        <Rock p={[5.4, 2.0, -3.2]} s={[3.0, 3.2, 3.4]} seed={10} m={moss} />
        <Rock p={[-4.0, 0.6, 0.4]} s={[1.6, 1.2, 1.6]} seed={13} m={lime} />
        <Rock p={[4.6, 0.6, -0.6]} s={[1.3, 1.1, 1.3]} seed={16} m={moss} />
        <Rock p={[0, 5.2, -4.2]} s={[5.6, 3.4, 4.0]} seed={19} m={moss} />
        {ring.map((q) => <Rock key={q.k} p={[q.x, q.y, 0.9]} s={[0.7, 0.7, 1.0]} seed={q.k + 30} m={q.k % 3 ? lime : moss} detail={1} />)}
        <mesh position={[0, 1.5, -2.9]} rotation={[Math.PI / 2, 0, 0]} material={inner}><cylinderGeometry args={[2.1, 2.1, 9.5, 28, 1, true]} /></mesh>
        <Box s={[4.0, 0.3, 9.5]} p={[0, 0.15, -2.9]} m={M.plain('#6a5038', { roughness: 1 })} />
        <Box s={[4.4, 4.4, 0.2]} p={[0, 2.1, -7.8]} m={M.plain('#1a120c')} />
        <Inst items={st.down} geo="cone" seg={7} m={cream} cast={false} />
        <Inst items={st.up} geo="cone" seg={7} m={cream} cast={false} />
        <Ball rad={1.0} sc={[1.2, 0.8, 1.0]} p={[-1.3, 0.8, -5.4]} m={cream} />
        <pointLight position={[0, 2.2, -2.5]} intensity={5} distance={11} color="#ffb060" />
        {/* the shrine inside: a lingam draped in red and gold cloth, and visitors with headlamps */}
        <group position={[-1.2, 0.3, -0.9]}><Cyl rt={0.2} rb={0.3} h={0.7} p={[0, 0.35, 0]} m={M.plain('#6a7a3a')} seg={10} /><Box s={[0.5, 0.2, 0.4]} p={[0, 0.78, 0]} m={M.plain('#b3202a')} /><Box s={[0.3, 0.2, 0.3]} p={[0, 0.95, 0]} m={gold} /></group>
        <Crowd n={7} area={[2.6, 5]} center={[0.3, -3.8]} y={0.3} seed={44} />
        {Array.from({ length: 7 }, (_, k) => <Ball key={k} rad={0.04} p={[0.3 + (k % 3 - 1) * 0.6, 0.78, -2 - k * 0.7]} m={M.plain('#fff6c0', { emissive: '#ffe890', emissiveIntensity: 2 })} />)}
        {/* stone landing, the small stone frame with its bell, steps and the blue ticket booth */}
        <Box s={[4.2, 0.3, 2.4]} p={[0, 0.15, 2.6]} m={stone} />
        <group position={[-2.3, 0.3, 2.2]}>{[-0.4, 0.4].map((x) => <Box key={x} s={[0.14, 0.9, 0.14]} p={[x, 0.45, 0]} m={stone} />)}<Box s={[1.0, 0.14, 0.2]} p={[0, 0.95, 0]} m={stone} /><Cyl rt={0.02} rb={0.1} h={0.2} p={[0, 0.78, 0]} m={gold} seg={8} /></group>
        <Stair a={[0, 0.3, 3.8]} b={[0, -1.8, 8.4]} w={3.0} n={8} m={stone} solid base={-2.0} />
        {[-1, 1].map((k) => <Rail key={k} pts={[[k * 1.7, 0.3, 3.8], [k * 1.7, -1.8, 8.4]]} h={0.9} m={blue} gap={0.8} thick={0.05} />)}
        <group position={[-3.4, -1.5, 7.2]}>
          <Box s={[1.7, 1.5, 1.5]} p={[0, 0.75, 0]} m={blue} />
          <Gable w={1.7} d={1.5} h={0.5} y={1.5} m={M.plain('#2a62b0')} ov={0.2} />
          <Box s={[0.7, 0.6, 0.05]} p={[0, 0.95, 0.77]} m={M.plain('#cfe6f2', { metalness: 0.3 })} cast={false} />
        </group>
        <Frame s={[14, 8.4, 14]} p={[0, 2.6, 3]} />
      </group>
    );
  }
  function SiddhaEnv() {
    const M = useM();
    const cf = useMemo(() => (x, z, y) => { const n = fbm(x * 0.3, z * 0.3); if (Math.abs(x) < 2 && z > 3) return '#a89f8a'; return n > 0.55 ? '#4a7a3a' : n > 0.3 ? '#3d6a32' : '#587f3e'; }, []);
    return (
      <group>
        <Terrain w={170} d={170} nx={113} nz={113} hf={siddhaH} cf={cf} />
        <Stair a={[0, -1.8, 8.4]} b={[0, -9.2, 21.6]} w={2.6} n={34} m={slabMat('#cfc7b6', 2, 1)} />
        {[-1, 1].map((k) => <Rail key={k} pts={[[k * 1.5, -1.8, 8.4], [k * 1.5, -9.2, 21.6]]} h={0.9} m={M.plain('#3f7fb5')} gap={0.8} thick={0.05} />)}
        <Forest n={360} hf={siddhaH} area={[150, 150]} ok={(x, z) => !(Math.abs(x) < 3.2 && z > 3) && Math.hypot(x, z * 0.8) > 7 && siddhaH(x, z) > -26} kind="broad" seed={121} sc={[1.2, 2.2]} />
        <Forest n={220} hf={siddhaH} area={[150, 150]} ok={(x, z) => !(Math.abs(x) < 3.2 && z > 3) && Math.hypot(x, z * 0.8) > 7} kind="sal" seed={122} sc={[1.2, 2]} />
        <Forest n={90} hf={siddhaH} area={[150, 150]} ok={(x, z) => !(Math.abs(x) < 3.2 && z > 3) && Math.hypot(x, z * 0.8) > 8 && siddhaH(x, z) > 2} kind="pine" seed={123} />
        {[[-10, -4], [11, -2], [-8, 8], [9, 10], [-14, 2]].map(([x, z], k) => <Rock key={k} p={[x, siddhaH(x, z) + 0.6, z]} s={[2.4, 1.8, 2.2]} seed={k + 40} c="#a8b08a" />)}
        <Range p={[0, -10, -112]} w={280} d={64} snowAt={46} lo="#5e6a58" hi="#8c8c90" foot="#4a7040" footH={14} seed={35} peaks={annapurna} />
      </group>
    );
  }

  /* ===================== 14. Kalika Bhagawati, Baglung ===================== */
  const kalH = (x, z) => { const r = Math.hypot(x, z); return smooth(30, 84, r) * (r - 28) * 0.32 * (0.6 + fbm(x * 0.05, z * 0.05)) + fbm(x * 0.1, z * 0.1) * 0.4 * smooth(10, 30, r); };
  function KGate({ p, r = 0 }) {
    const M = useM();
    const pink = M.plain('#e8a890', { roughness: 0.85 });
    const yel = M.plain('#cfc464', { roughness: 0.6 });
    const redf = M.plain('#c0302a');
    const brick = M.mat('brick', 1, 1, { color: '#e8a58f' });
    return (
      <group position={p} rotation={[0, r, 0]}>
        {[-1.5, 1.5].map((x) => <Box key={x} s={[0.7, 3.0, 0.8]} p={[x, 1.5, 0]} m={pink} />)}
        <Box s={[3.7, 0.5, 0.9]} p={[0, 3.2, 0]} m={pink} />
        <Box s={[2.3, 0.4, 0.3]} p={[0, 3.55, 0.45]} m={M.plain('#f2e4a0')} cast={false} />
        <Roof w={5.0} d={2.0} h={0.6} y={3.4} m={yel} sag={1.3} lift={0.15} />
        <Box s={[5.0, 0.12, 0.05]} p={[0, 3.38, 1.0]} m={redf} cast={false} />
        <Box s={[1.1, 1.0, 1.0]} p={[0, 4.4, 0]} m={brick} />
        <Roof w={1.9} d={1.8} h={0.5} y={4.85} m={yel} sag={1.3} lift={0.15} />
        <Gajur y={5.3} s={0.5} />
        {[-1, 1].map((k) => (
          <group key={k} position={[k * 3.3, 0, 0]}>
            <Box s={[1.8, 2.0, 1.5]} p={[0, 1.0, 0]} m={pink} />
            <mesh position={[0, 0.9, 0.76]} material={M.plain('#2a1a10')}><circleGeometry args={[0.55, 16, 0, Math.PI]} /></mesh>
            <Box s={[1.1, 0.9, 0.05]} p={[0, 0.45, 0.76]} m={M.plain('#2a1a10')} cast={false} />
            <Roof w={2.4} d={2.0} h={0.5} y={2.0} m={yel} sag={1.3} lift={0.15} />
            <Box s={[0.5, 0.35, 0.5]} p={[0, 2.8, 0]} m={pink} />
          </group>
        ))}
        {[-1, 1].map((k) => <group key={`l${k}`} position={[k * 1.1, 0, 1.4]}><Box s={[0.5, 0.4, 0.5]} p={[0, 0.2, 0]} m={slabMat('#d8cfbc', 2, 2)} /><group position={[0, 0.4, 0]} scale={1.5}><Lion m={M.plain('#3a3532', { metalness: 0.5 })} /></group></group>)}
      </group>
    );
  }
  function KalikaMain() {
    const M = useM();
    const brick = M.mat('brick', 2, 1, { color: '#ec9a86' });
    const tin = M.plain('#5f7a72', { metalness: 0.45, roughness: 0.5 });
    const orange = M.plain('#e8a020', { roughness: 0.7 });
    const redP = M.plain('#a8322a', { roughness: 0.8 });
    const stone = slabMat('#d4ccbc', 3, 3);
    const tiers = [
      { w: 4.7, d: 3.9, h: 1.45, wall: brick, roof: tin, ov: 1.1, rh: 0.8, open: true, pil: redP, fringe: orange, sag: 1.35, beam: M.plain('#7a2a1c') },
      { w: 2.5, d: 2.1, h: 1.0, wall: brick, roof: tin, ov: 0.72, rh: 0.52, fringe: orange, sag: 1.35, win: 2, door: false, beam: M.plain('#7a2a1c') },
      { w: 1.6, d: 1.4, h: 0.8, wall: brick, roof: tin, ov: 0.56, rh: 0.46, fringe: orange, sag: 1.35, win: 1, door: false, beam: M.plain('#7a2a1c') },
    ];
    const tint = useMemo(() => { const a = []; for (let r = 0; r < 2; r += 1) for (let k = 0; k < 16; k += 1) a.push({ p: [-2.4 + k * 0.32, 0.45 + r * 0.32, 0.27], s: [0.3, 0.3, 0.04], c: (k + r) % 2 ? '#7d7d79' : '#d6d4ce' }); return a; }, []);
    const niches = useMemo(() => Array.from({ length: 12 }, (_, k) => ({ p: [-2.2 + k * 0.4, 1.45, 0.27], s: [0.16, 0.34, 0.05] })), []);
    const humps = useMemo(() => Array.from({ length: 7 }, (_, k) => ({ p: [-2.1 + k * 0.7, 2.05, 0], s: [0.38, 0.3, 0.26] })), []);
    return (
      <group>
        <Box s={[7.6, 0.3, 6.6]} p={[0, 0.15, 0]} m={stone} />
        <group position={[0, 0.3, 0]}><Pg tiers={tiers} finS={0.9} doorGold /></group>
        <Box s={[1.9, 0.4, 1.1]} p={[-2.0, 0.5, 3.9]} m={orange} />
        <Box s={[1.6, 0.06, 0.8]} p={[-2.0, 0.73, 3.9]} m={M.plain('#2a1a10')} />
        {[0, 1, 2, 3].map((k) => <Ball key={k} rad={0.1} sc={[1, 1.4, 1]} p={[-2.5 + k * 0.33, 0.85, 3.9]} m={M.plain('#ff9a2a', { emissive: '#ff7a1a', emissiveIntensity: 1.2 })} />)}
        {/* small red wayside shrines of the courtyard */}
        {[[-6.5, 0.6, 0.4], [6.4, 1.8, -0.4]].map(([x, z, ry], k) => (
          <group key={k} position={[x, 0, z]} rotation={[0, ry, 0]}>
            <Box s={[1.6, 0.2, 1.6]} p={[0, 0.1, 0]} m={stone} />
            <group position={[0, 0.2, 0]}><Pg tiers={[{ w: 1.0, d: 1.0, h: 0.7, wall: brick, roof: tin, ov: 0.42, rh: 0.35, struts: false, fringe: orange, beam: redP }, { w: 0.62, d: 0.62, h: 0.5, wall: brick, roof: tin, ov: 0.32, rh: 0.3, struts: false, fringe: orange, beam: redP, door: false }]} finS={0.45} bells={false} /></group>
          </group>
        ))}
        {/* the grey stone wall of niches with its zig-zag courses */}
        <group position={[-6.2, 0, -4.4]} rotation={[0, 0.5, 0]}>
          <Box s={[5.6, 2.2, 0.5]} p={[0, 1.1, 0]} m={stoneM('#b9b1a3', 3, 1)} />
          <Inst items={tint} m={M.plain('#ffffff')} cast={false} />
          <Inst items={niches} m={M.plain('#1d130c')} cast={false} />
          <Inst items={humps} geo="ball" m={stoneM('#b9b1a3', 1, 1)} />
        </group>
        <Crowd n={12} area={[6, 3]} center={[0, 5.4]} seed={31} ok={(x, z) => z > 3.6} />
        <Frame s={[17, 7.4, 13]} p={[0, 3.3, 0.6]} />
      </group>
    );
  }
  function KalikaEnv() {
    const M = useM();
    const cf = useMemo(() => (x, z, y) => { const n = fbm(x * 0.3, z * 0.3); const r = Math.hypot(x, z); if (r < 26) return n > 0.5 ? '#b5a584' : '#a89878'; return n > 0.55 ? '#6f9448' : n > 0.3 ? '#587f3e' : '#c9b878'; }, []);
    const blueB = M.plain('#2f6aa8', { roughness: 0.7 });
    const cloth = useMemo(() => { const r = prng(61); return Array.from({ length: 80 }, () => { const a = Math.PI + r() * Math.PI; const rad = 17 + r() * 14; return { p: [Math.cos(a) * rad, 3.4 + r() * 2.4, Math.sin(a) * rad], s: [0.9 + r() * 0.8, 0.5, 0.02], r: [0.2 * (r() - 0.5), r() * 3, 0.2 * (r() - 0.5)], c: ['#c0302a', '#d9603a', '#e8a020', '#a8322a'][Math.floor(r() * 4)] }; }); }, []);
    return (
      <group>
        <Terrain w={170} d={170} nx={113} nz={113} hf={kalH} cf={cf} />
        <Box s={[31, 0.05, 31]} p={[0, 0.02, 0]} m={slabMat('#d8d0c0', 10, 10)} cast={false} />
        <KGate p={[0, 0, 15.6]} r={0} />
        <KGate p={[0, 0, -15.6]} r={Math.PI} />
        <KGate p={[15.6, 0, 0]} r={Math.PI / 2} />
        <KGate p={[-15.6, 0, 0]} r={-Math.PI / 2} />
        {/* flower and coconut stalls along the east side of the courtyard, under a blue-painted roof */}
        <group position={[12.2, 0, 8.4]} rotation={[0, -Math.PI / 2, 0]}>
          <Box s={[11, 2.8, 2.4]} p={[0, 1.4, 0]} m={M.plain('#f1ece0')} />
          <Box s={[11.2, 0.5, 0.2]} p={[0, 2.6, 1.3]} m={blueB} />
          {Array.from({ length: 8 }, (_, k) => <Box key={k} s={[1.0, 1.4, 0.06]} p={[-4.5 + k * 1.3, 0.8, 1.22]} m={M.plain('#2a1a10')} cast={false} />)}
          <Gable w={11} d={2.4} h={0.7} y={2.8} m={blueB} ov={0.35} />
        </group>
        <Inst items={cloth} m={M.plain('#ffffff', { side: THREE.DoubleSide })} cast={false} />
        <Forest n={300} hf={kalH} area={[110, 110]} ok={(x, z) => Math.hypot(x, z) > 17.5 && (z < -4 || x < -17 || Math.hypot(x, z) > 44) && !(Math.abs(x) < 5 && Math.abs(z) > 15) && !(Math.abs(z) < 5 && Math.abs(x) > 15)} kind="sal" seed={131} sc={[1.8, 2.8]} />
        <Forest n={90} hf={kalH} area={[110, 110]} ok={(x, z) => Math.hypot(x, z) > 40} kind="pine" seed={132} sc={[1.4, 2.2]} />
        <Town n={90} hf={kalH} area={[150, 150]} ok={(x, z) => Math.hypot(x, z) > 52 && Math.hypot(x, z) < 78} seed={18} />
        <Range p={[0, -4, -122]} w={290} d={64} snowAt={52} lo="#5e6a58" hi="#8c8c90" foot="#4a7040" footH={12} seed={37}
          peaks={[{ x: -80, z: 0, h: 78, s: 36 }, { x: -22, z: 4, h: 118, s: 42 }, { x: 22, z: 0, h: 108, s: 38 }, { x: 72, z: 4, h: 84, s: 36 }, { x: 110, z: 0, h: 64, s: 30 }]} />
      </group>
    );
  }

  /* ===================== 15. Gupteshwor Mahadev Cave ===================== */
  function GupteMain() {
    const M = useM();
    const blue = M.plain('#3f7fb5', { roughness: 0.75, side: THREE.DoubleSide });
    const redO = M.plain('#c8553a', { roughness: 0.8 });
    const rail = M.plain('#4a4a50', { roughness: 0.5, metalness: 0.4 });
    const gray = M.plain('#a8a498', { roughness: 0.9 });
    const cream = M.plain('#e6dcc4', { roughness: 0.85 });
    const D = 5.2; const N = 46; const turns = 1.5;
    const steps = useMemo(() => Array.from({ length: N }, (_, k) => {
      const a = Math.PI / 2 + (k / N) * turns * Math.PI * 2; const top = -((k + 1) / N) * (D - 0.3); const rr = 4.3; const hgt = top + D;
      return { p: [Math.cos(a) * rr, -D + hgt / 2, Math.sin(a) * rr], s: [1.5, hgt, 0.62], r: [0, -a + Math.PI / 2 + Math.PI / 2, 0], top, a };
    }), []);
    const posts = useMemo(() => steps.flatMap((s, k) => [0, 0.5].map((t) => { const a = s.a + t * (turns * Math.PI * 2 / N); const top = s.top - t * ((D - 0.3) / N); return { p: [Math.cos(a) * 3.55, top + 0.28, Math.sin(a) * 3.55], s: [0.1, 0.56, 0.1] }; })), [steps]);
    const railGeo = useMemo(() => {
      const pts = Array.from({ length: 80 }, (_, i) => { const t = i / 79; const a = Math.PI / 2 + t * turns * Math.PI * 2 + 0.06; const top = -(t * (D - 0.3)) - 0.1; return new THREE.Vector3(Math.cos(a) * 3.55, top + 0.6, Math.sin(a) * 3.55); });
      return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.05, 6, false);
    }, []);
    const figs = useMemo(() => Array.from({ length: 24 }, (_, k) => { const a = (k / 24) * Math.PI * 2; const rr = 5.35; return { p: [Math.cos(a) * rr * 0.98, -1.9 - (k % 3) * 0.2, Math.sin(a) * rr * 0.98], s: [0.34, 0.95, 0.18], r: [0, -a + Math.PI / 2, 0], c: '#7a5a40' }; }), []);
    const rim = useMemo(() => Array.from({ length: 40 }, (_, k) => { const a = (k / 40) * Math.PI * 2; return [Math.cos(a) * 5.8, 0, Math.sin(a) * 5.8]; }), []);
    const niches = useMemo(() => Array.from({ length: 5 }, (_, k) => ({ p: [-1.6 + k * 0.8, 1.3, 0.27], s: [0.4, 0.8, 0.05] })), []);
    const arches = useMemo(() => Array.from({ length: 8 }, (_, k) => { const a = (k / 8) * Math.PI * 2; return { p: [Math.cos(a) * 1.92, 1.4, Math.sin(a) * 1.92], s: [0.04, 0.8, 0.5], r: [0, -a + Math.PI / 2 + Math.PI / 2, 0] }; }), []);
    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow material={slabMat('#d8cdb8', 8, 8)}><ringGeometry args={[5.6, 11, 64]} /></mesh>
        <mesh position={[0, -D / 2, 0]} material={blue} receiveShadow><cylinderGeometry args={[5.6, 5.0, D, 44, 1, true]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -D + 0.02, 0]} receiveShadow material={gray}><circleGeometry args={[5.0, 40]} /></mesh>
        <Inst items={figs} m={M.plain('#ffffff')} cast={false} />
        <Inst items={steps} m={gray} />
        <Inst items={posts} geo="cyl" seg={6} m={redO} cast={false} />
        <mesh geometry={railGeo} material={rail} castShadow />
        {/* the garden at the bottom of the pit, and the dark cave mouth with its glimpse of waterfall */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -D + 0.05, 0]} material={M.plain('#5f8a45', { roughness: 1 })}><circleGeometry args={[2.1, 24]} /></mesh>
        {[[0.6, 0.3], [-0.8, -0.4], [0.2, -1.0], [-0.5, 0.8], [1.2, -0.6]].map(([x, z], k) => <Ball key={k} rad={0.38 + (k % 2) * 0.15} sc={[1, 0.8, 1]} p={[x, -D + 0.3, z]} m={M.plain(k % 2 ? '#4d7a3a' : '#6a9a48', { roughness: 1 })} />)}
        <mesh position={[0, -D + 1.0, -4.97]}><circleGeometry args={[1.0, 20, 0, Math.PI]} /><meshBasicMaterial color="#0c0907" side={THREE.DoubleSide} /></mesh>
        <Box s={[0.5, 1.6, 0.05]} p={[0, -D + 0.9, -4.93]} m={M.plain('#e8f4ff', { emissive: '#bfe4ff', emissiveIntensity: 0.9 })} cast={false} />
        <Rail pts={rim} closed h={0.62} m={redO} bar={rail} gap={0.28} thick={0.06} />
        {/* the temple with its hip roof on the orange terrace above the pit */}
        <group position={[-7.4, 0, -1.8]} rotation={[0, 0.35, 0]} scale={0.85}>
          <Box s={[5.0, 0.55, 4.0]} p={[0, 0.27, 0]} m={redO} />
          <Box s={[4.6, 0.06, 3.6]} p={[0, 0.58, 0]} m={cream} />
          <Box s={[2.5, 1.7, 2.0]} p={[0, 1.4, -0.3]} m={M.plain('#9a3a2a', { roughness: 0.85 })} />
          {[-1.1, -0.35, 0.35, 1.1].map((x) => <Cyl key={x} rt={0.07} h={1.7} p={[x, 1.4, 1.0]} m={M.plain('#6a4a2a')} seg={8} />)}
          <Roof w={4.2} d={3.4} h={1.1} y={2.3} m={M.mat('wood', 3, 2, { color: '#a87a4a' })} sag={1.3} lift={0.15} />
          <Gajur y={3.3} s={0.6} />
        </group>
        <Tree p={[-9.5, 0, 3.4]} s={1.6} />
        {/* the round monument tower with its balconies and arches */}
        <group position={[6.4, 0, -5.4]} scale={0.8}>
          <Cyl rt={2.0} h={2.9} p={[0, 1.45, 0]} m={cream} seg={24} />
          <Inst items={arches} m={M.plain('#2a1a10')} cast={false} />
          <Cyl rt={2.45} h={0.18} p={[0, 2.95, 0]} m={cream} seg={24} />
          <Cyl rt={1.55} h={2.0} p={[0, 4.1, 0]} m={cream} seg={22} />
          <Cyl rt={1.95} h={0.16} p={[0, 5.15, 0]} m={cream} seg={22} />
          <mesh position={[0, 5.2, 0]} material={cream} castShadow><sphereGeometry args={[1.3, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
          <Gajur y={6.5} s={0.5} />
          <Cyl rt={0.55} h={3.9} p={[2.4, 1.95, 1.2]} m={cream} seg={14} />
          <mesh position={[2.4, 4.1, 1.2]} material={cream} castShadow><sphereGeometry args={[0.7, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
        </group>
        {/* walled terrace with arched niches, right of the pit */}
        <group position={[4.6, 0, 6.6]} rotation={[0, -0.6, 0]}>
          <Box s={[4.6, 2.0, 0.5]} p={[0, 1.0, 0]} m={stoneM('#b9b1a3', 2, 1)} />
          <Inst items={niches} m={M.plain('#2a1a10')} cast={false} />
        </group>
        <Frame s={[19, 10.4, 17]} p={[0, 0.4, 0]} />
      </group>
    );
  }
  function GupteEnv() {
    const M = useM();
    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow material={slabMat('#b9b2a2', 20, 20)}><ringGeometry args={[10.8, 95, 72]} /></mesh>
        <Ribbon pts={[[-30, -60], [-26, -24], [-27, 6], [-33, 30], [-42, 70]]} w={6} y={0.02} color="#7f9ea2" seg={36} />
        <Box s={[8, 0.3, 2.4]} p={[-27, 0.15, 6]} m={slabMat('#d8cfbc', 2, 2)} />
        <Ribbon pts={[[0, 15], [4, 30], [12, 52], [20, 90]]} w={4.4} y={0.015} m={M.plain('#6f6c66', { roughness: 1 })} seg={20} />
        <Ribbon pts={[[-90, -30], [-40, -34], [0, -30], [40, -36], [90, -30]]} w={4.4} y={0.015} m={M.plain('#6f6c66', { roughness: 1 })} seg={20} />
        <Town n={150} area={[150, 150]} ok={(x, z) => Math.hypot(x, z) > 19 && Math.hypot(x, z) < 70 && !(Math.abs(x + 28) < 6) && !(Math.abs(x - 4 - (z - 15) * 0.19) < 3 && z > 12) && !(Math.abs(z + 33) < 3)} seed={22} sc={[1.2, 2.0]} tall={1.1} />
        <Forest n={60} area={[150, 150]} ok={(x, z) => Math.hypot(x, z) > 17 && Math.hypot(x, z) < 60} kind="broad" seed={141} sc={[1.2, 2]} />
        <Range p={[0, -6, -112]} w={280} d={64} snowAt={44} lo="#5e6a58" hi="#8a8a8e" foot="#476c3e" footH={12} seed={39} peaks={annapurna} />
      </group>
    );
  }

  // @@SITES

  return {
    'gorkha-durbar': { Main: GorkhaMain, Env: GorkhaEnv },
    'manakamana-temple': { Main: ManakamanaMain, Env: ManakamanaEnv },
    'muktinath-temple': { Main: MuktiMain, Env: MuktiEnv },
    'tal-barahi-temple': { Main: TalMain, Env: TalEnv },
    'bindhyabasini-temple-pokhara': { Main: BindhyaMain, Env: BindhyaEnv },
    'bhadrakali-temple-pokhara': { Main: BhadraMain, Env: BhadraEnv },
    'bindebasini-temple-bandipur': { Main: BindebasiniMain, Env: BindebasiniEnv },
    'khadga-devi-temple-bandipur': { Main: KhadgaMain, Env: KhadgaEnv },
    'lo-manthang-walled-city': { Main: LoMain, Env: LoEnv },
    'kagbeni-kag-chode-monastery': { Main: KagMain, Env: KagEnv },
    'galeshwor-dham': { Main: GaleshMain, Env: GaleshEnv },
    'devghat-dham': { Main: DevMain, Env: DevEnv },
    'siddha-cave-bimalnagar': { Main: SiddhaMain, Env: SiddhaEnv },
    'kalika-bhagawati-temple-baglung': { Main: KalikaMain, Env: KalikaEnv },
    'gupteshwor-mahadev-cave': { Main: GupteMain, Env: GupteEnv },
    // @@MAP
  };
}
