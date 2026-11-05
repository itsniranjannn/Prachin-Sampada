// Pashupatinath Temple, Kathmandu. 1 unit = about 3 m.
// Orientation: +z = WEST (main gate and Nandi), -z = EAST (Bagmati river, Pandra Shivalaya terrace and the forested Mrigasthali hill).
// Because the camera looks east, real NORTH is toward -x (Gauri Ghat, upstream) and SOUTH toward +x (Ram Mandir, Panch Deval, Bhasmeshwar Ghat).
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Frame, EaveStruts, PillarStatue, Diyo, Tree, THREE, useMemo, useRef, useEffect, useState, curvedRoofGeometry, silverMat, roofMat } = K;

  /* ---------- geometry of the setting ---------- */
  const ANG = -0.3;
  const Z0 = 19;
  const HW = 13;
  const BED = -3.6;
  const SH = 19.8;
  const PZ = 15.0;
  const SIN = Math.sin(ANG);
  const COS = Math.cos(ANG);
  const toLocal = (x, z) => [COS * x + SIN * (z + Z0), -SIN * x + COS * (z + Z0)];
  const toWorld = (xl, zl) => [COS * xl - SIN * zl, -Z0 + SIN * xl + COS * zl];
  const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const WATER = -3.1;
  const APRON = -3.0;
  const TERR = -2.4;
  const DECK = -2.1;
  const HE = 4.6;
  const ROT = 0.25;
  const AX = -1;
  const ZT = 27.8;
  const STN = 12;
  const STRUN = 0.9;
  const STRISE = -APRON / STN;
  function hillY(xl, zl) {
    const d = -7 - zl;
    if (d <= 0) return TERR;
    let h = 32 * (1 - Math.exp(-Math.pow(d / 17, 1.3)));
    h += 3.2 * Math.sin(xl * 0.07 + 1.3) * sstep(5, 40, d);
    h += 1.6 * Math.sin(xl * 0.19 + zl * 0.11) * sstep(4, 25, d);
    h += 1.0 * Math.sin(xl * 0.43 - zl * 0.21) * sstep(4, 20, d);
    h += 8 * sstep(95, 140, d);
    return TERR + Math.max(0, h);
  }

  /* ---------- caches ---------- */
  const TX = {};
  const MC = {};
  const cm = (key, f) => { if (!MC[key]) MC[key] = f(); return MC[key]; };
  const mkTex = (id, w, h, draw) => {
    if (!TX[id]) {
      const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
      const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; TX[id] = t;
    }
    return TX[id];
  };
  const goldTile = () => cm('goldtile', () => {
    const map = mkTex('gt', 128, 128, (g, w, h) => {
      g.fillStyle = '#e6b436'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 8; i += 1) { g.fillStyle = '#a97a14'; g.fillRect(0, i * 16, w, 3); g.fillStyle = '#f7da7a'; g.fillRect(0, i * 16 + 3, w, 2); }
      for (let i = 0; i < 4; i += 1) { g.fillStyle = 'rgba(120,80,10,0.4)'; g.fillRect(i * 32 + 15, 0, 2, h); }
    }).clone();
    map.repeat.set(2, 2); map.needsUpdate = true;
    return new THREE.MeshStandardMaterial({ map, color: '#ffffff', metalness: 0.55, roughness: 0.36, emissive: '#6b4a08', emissiveIntensity: 0.3 });
  });
  const facadeTex = (lit) => mkTex(lit ? 'fl' : 'fd', 64, 60, (g, w, h) => {
    g.fillStyle = lit ? '#000' : '#fff'; g.fillRect(0, 0, w, h);
    if (!lit) { g.fillStyle = '#9a6a44'; g.fillRect(0, h - 5, w, 5); }
    g.fillStyle = lit ? '#000' : '#6b3d20'; g.fillRect(15, 10, 34, 36);
    g.fillStyle = lit ? '#ffb347' : '#2c1a10'; g.fillRect(18, 13, 28, 30);
    if (!lit) { g.fillStyle = '#6b3d20'; g.fillRect(31, 13, 2, 30); g.fillRect(18, 27, 28, 2); }
    g.fillStyle = lit ? '#000' : '#7a4a28'; g.fillRect(12, 46, 40, 4);
  });
  const facadeMat = (tint, rx, ry, dusk) => cm(`f|${tint}|${rx}|${ry}|${dusk ? 1 : 0}`, () => {
    const map = facadeTex(false).clone(); map.repeat.set(rx, ry); map.needsUpdate = true;
    const em = facadeTex(true).clone(); em.repeat.set(rx, ry); em.needsUpdate = true;
    return new THREE.MeshStandardMaterial({ map, color: tint, roughness: 0.9, emissive: '#ffffff', emissiveMap: em, emissiveIntensity: dusk ? 0.32 : 0 });
  });

  const paverMat = (rx, ry, tint) => cm(`pv|${rx}|${ry}|${tint}`, () => {
    const map = mkTex('pv', 128, 128, (g, w, h) => {
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
      for (let j = 0; j < 4; j += 1) for (let i = 0; i < 4; i += 1) { const v = 238 - ((i * 7 + j * 13) % 5) * 7; g.fillStyle = `rgb(${v},${v - 4},${v - 12})`; g.fillRect(i * 32 + 1, j * 32 + 1, 30, 30); }
      g.strokeStyle = 'rgba(70,60,45,0.55)'; g.lineWidth = 2;
      for (let k = 0; k <= 4; k += 1) { g.beginPath(); g.moveTo(k * 32, 0); g.lineTo(k * 32, h); g.stroke(); g.beginPath(); g.moveTo(0, k * 32); g.lineTo(w, k * 32); g.stroke(); }
    }).clone();
    map.repeat.set(rx, ry); map.needsUpdate = true;
    return new THREE.MeshStandardMaterial({ map, color: tint, roughness: 0.95 });
  });

  /* ---------- instancing helper ---------- */
  function Inst({ geo, mat, items, cast = false }) {
    const mesh = useMemo(() => {
      const im = new THREE.InstancedMesh(geo, mat, Math.max(1, items.length));
      const o = new THREE.Object3D();
      const c = new THREE.Color();
      items.forEach((it, i) => {
        o.position.set(it.p[0], it.p[1], it.p[2]);
        o.rotation.order = 'YXZ'; o.rotation.set(it.rx || 0, it.r || 0, it.rz || 0);
        const s = it.s === undefined ? 1 : it.s;
        if (Array.isArray(s)) o.scale.set(s[0], s[1], s[2]); else o.scale.set(s, s, s);
        o.updateMatrix();
        im.setMatrixAt(i, o.matrix);
        if (it.c) im.setColorAt(i, c.set(it.c));
      });
      im.count = items.length;
      im.instanceMatrix.needsUpdate = true;
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
      im.castShadow = cast; im.receiveShadow = true; im.frustumCulled = false;
      return im;
    }, [geo, mat, items, cast]);
    return <primitive object={mesh} />;
  }
  const part = (it, o, sx, sy, sz) => {
    const s = it.s === undefined ? 1 : it.s; const c = Math.cos(it.r || 0); const n = Math.sin(it.r || 0);
    return { p: [it.p[0] + (o[0] * c + o[2] * n) * s, it.p[1] + o[1] * s, it.p[2] + (-o[0] * n + o[2] * c) * s], r: it.r || 0, s: [s * sx, s * sy, s * sz] };
  };
  const unitBox = () => cm('ubox', () => new THREE.BoxGeometry(1, 1, 1));
  const V2 = (pts) => pts.map(([r, y]) => new THREE.Vector2(r, y));

  function useDusk() {
    const ref = useRef();
    const [dusk, setDusk] = useState(false);
    useEffect(() => {
      try { let o = ref.current; while (o && o.parent) o = o.parent; const c = o && o.background; if (c && c.isColor) setDusk(c.r + c.g + c.b < 0.7); } catch (e) { /* ignore */ }
    }, []);
    return [dusk, ref];
  }

  /* ---------- small shrines (Pandra Shivalaya style) ---------- */
  const shGeos = () => cm('shg', () => {
    const spire = new THREE.LatheGeometry(V2([[0.78, 0], [0.8, 0.04], [0.66, 0.08], [0.62, 0.22], [0.58, 0.25], [0.64, 0.3], [0.52, 0.34], [0.5, 0.46], [0.45, 0.5], [0.5, 0.54], [0.4, 0.58], [0.37, 0.7], [0.3, 0.74], [0.38, 0.77], [0.4, 0.81], [0.26, 0.85], [0.01, 0.86]]), 4);
    spire.rotateY(Math.PI / 4);
    const fin = new THREE.LatheGeometry(V2([[0.02, 0], [0.1, 0.02], [0.11, 0.07], [0.06, 0.12], [0.09, 0.17], [0.05, 0.2], [0.012, 0.36]]), 10);
    return { spire, fin };
  });
  function ShikharaSet({ items, tone = 'white' }) {
    const M = useM();
    const G = shGeos();
    const white = tone === 'white';
    const dk = tone === 'dark';
    const wall = M.plain(white ? '#f1ecdc' : dk ? '#4f4c48' : '#8d8a84', { roughness: 0.85, side: THREE.DoubleSide });
    const base = M.plain(white ? '#cfc8b8' : dk ? '#3d3b38' : '#6f6c66', { roughness: 0.95 });
    const dark = M.plain('#2a1a10');
    const trim = M.plain(white ? '#d9562a' : '#6a5a48', { roughness: 0.8 });
    const P = useMemo(() => ({
      plinth: items.map((it) => part(it, [0, 0.1, 0], 1.22, 0.2, 1.22)),
      body: items.map((it) => part(it, [0, 0.625, 0], 0.95, 0.85, 0.95)),
      door: items.map((it) => part(it, [0, 0.48, 0.48], 0.34, 0.52, 0.06)),
      band: items.map((it) => part(it, [0, 1.0, 0], 1.0, 0.08, 1.0)),
      spire: items.map((it) => part(it, [0, 1.05, 0], 1, 1, 1)),
      fin: items.map((it) => part(it, [0, 1.9, 0], 1, 1, 1)),
    }), [items]);
    return (
      <group>
        <Inst geo={unitBox()} mat={base} items={P.plinth} cast />
        <Inst geo={unitBox()} mat={wall} items={P.body} cast />
        <Inst geo={unitBox()} mat={dark} items={P.door} />
        <Inst geo={unitBox()} mat={trim} items={P.band} />
        <Inst geo={G.spire} mat={wall} items={P.spire} cast />
        <Inst geo={G.fin} mat={M.gold} items={P.fin} />
      </group>
    );
  }

  /* ---------- small red-roofed pagoda shrine ---------- */
  function MiniPagoda({ p, r = 0, s = 1, gold = false, two = false }) {
    const M = useM();
    const rm = gold ? M.gold : roofMat(M, 'clay-tile');
    return (
      <group position={p} rotation={[0, r, 0]} scale={s}>
        <Box s={[1.5, 0.22, 1.5]} p={[0, 0.11, 0]} m={M.stone} />
        <Box s={[0.95, 0.85, 0.95]} p={[0, 0.65, 0]} m={M.plain('#e9dcc2', { roughness: 0.85 })} />
        <Box s={[0.34, 0.5, 0.05]} p={[0, 0.5, 0.49]} m={M.plain('#3a2010')} />
        <EaveStruts w={0.95} d={0.95} y={1.1} n={2} h={0.3} />
        <Roof w={1.8} d={1.8} h={0.7} y={1.1} m={rm} fascia={false} />
        {two && <Box s={[0.6, 0.35, 0.6]} p={[0, 1.65, 0]} m={M.plain('#e9dcc2')} />}
        {two && <Roof w={1.2} d={1.2} h={0.5} y={1.8} m={rm} fascia={false} />}
        <mesh position={[0, two ? 2.4 : 1.95, 0]} material={M.gold}><coneGeometry args={[0.08, 0.5, 8]} /></mesh>
      </group>
    );
  }
  function Lodging({ p, r = 0, w = 2.4, d = 1.5, dusk }) {
    const M = useM();
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[w + 0.6, 0.5, d + 0.6]} p={[0, 0.1, 0]} m={M.stone} />
        <Box s={[w, 1.0, d]} p={[0, 0.8, 0]} m={facadeMat('#f1e6cc', Math.round(w / 0.9), 1, dusk)} />
        <Roof w={w + 0.5} d={d + 0.5} h={0.5} y={1.3} m={M.plain('#a8483a', { roughness: 0.7, metalness: 0.2 })} fascia={false} />
      </group>
    );
  }

  /* ---------- terrain (river-local frame) ---------- */
  function Terrain({ dusk }) {
    const geo = useMemo(() => {
      const xs = [];
      for (let x = -200; x < -80; x += 12) xs.push(x);
      for (let x = -80; x <= 80; x += 2.5) xs.push(x);
      for (let x = 92; x <= 200; x += 12) xs.push(x);
      const prof = (xl) => {
        const a = [[140, 0, 'p'], [60, 0, 'p'], [30, 0, 'p'], [ZT + 0.01, 0, 'p']];
        for (let i = 0; i < STN; i += 1) a.push([ZT - STRUN * i, -STRISE * i, 's'], [ZT - STRUN * (i + 1), -STRISE * i, 's']);
        a.push([ZT - STRUN * STN, APRON, 's'], [HW, APRON, 'a'], [HW, BED, 'w'], [-HE, BED, 'b'], [-HE, TERR, 'w'], [-7, TERR, 't']);
        for (let zl = -8; zl >= -62; zl -= 3) a.push([zl, hillY(xl, zl), 'h']);
        for (let zl = -68; zl >= -176; zl -= 6) a.push([zl, hillY(xl, zl), 'h']);
        return a;
      };
      const cols = xs.map((x) => prof(x));
      const nr = cols[0].length;
      const pos = []; const col = []; const idx = [];
      const C = new THREE.Color();
      const rr = rng(11);
      cols.forEach((pr, j) => {
        pr.forEach(([zl, y, k]) => {
          pos.push(xs[j], y - (k === 'p' ? 0.06 : 0), zl);
          const n = rr();
          if (k === 'p') C.set(dusk ? '#4a4a40' : '#9b917c').offsetHSL(0, 0, (n - 0.5) * 0.05);
          else if (k === 'w') C.set('#7a6955');
          else if (k === 'a') C.set('#9d9484');
          else if (k === 's') C.set(dusk ? '#757080' : '#a8a090').offsetHSL(0, 0, (n - 0.5) * 0.04);
          else if (k === 'b') C.set('#6f6c5e');
          else if (k === 't') C.set('#a69c88');
          else {
            const d = -7 - zl;
            C.set('#2b4d24').lerp(new THREE.Color('#47692f'), Math.max(0, 0.12 - d / 60) + n * 0.05).offsetHSL((n - 0.5) * 0.03, 0, (n - 0.5) * 0.06);
          }
          col.push(C.r, C.g, C.b);
        });
      });
      for (let j = 0; j < xs.length - 1; j += 1) {
        for (let i = 0; i < nr - 1; i += 1) {
          const A = j * nr + i; const B = (j + 1) * nr + i; const Cc = j * nr + i + 1; const D = (j + 1) * nr + i + 1;
          idx.push(A, B, Cc, B, D, Cc);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.setIndex(idx);
      g.computeVertexNormals();
      return g;
    }, [dusk]);
    const M = useM();
    return <mesh geometry={geo} material={M.plain('#ffffff', { vertexColors: true, roughness: 1, side: THREE.DoubleSide })} receiveShadow />;
  }

  /* ---------- forest on Mrigasthali ---------- */
  const PATHS = [
    [[-1, -7], [4, -12], [-3, -17], [3, -23], [-2, -29], [5, -36], [0, -44], [6, -52]],
    [[16, -7], [20, -13], [14, -19], [19, -26], [13, -33], [18, -40]],
    [[-18, -7], [-22, -12], [-16, -17], [-23, -24], [-17, -31], [-24, -38]],
  ];
  const SHRINES = { white: [], grey: [], dark: [], pagoda: [], lodge: [], gora: [[36, -47]] };
  {
    const R = rng(21);
    const kinds = ['white', 'white', 'grey', 'white', 'dark', 'white', 'pagoda', 'white', 'grey', 'lodge'];
    let n = 0;
    PATHS.forEach((pa, k) => pa.slice(1).forEach(([x, z], i) => {
      if ((i + k) % 3 === 2) return;
      const side = R() < 0.5 ? -1 : 1;
      const px = x + side * (3.5 + R() * 6.5); const pz = z - 3 + R() * 6;
      SHRINES[kinds[n % kinds.length]].push([px, pz]); n += 1;
    }));
    for (let i = 0; i < 56; i += 1) {
      const x = -46 + R() * 96; const z = -12 - Math.pow(R(), 0.9) * 34;
      if (PATHS.some((pa) => pa.some(([px, pz]) => Math.hypot(px - x, pz - z) < 5))) continue;
      SHRINES[kinds[(n + i * 3) % kinds.length]].push([x, z]); n += 1;
    }
    SHRINES.pagoda.push([-33, -42], [48, -28]);
    SHRINES.dark.push([40, -42]);
  }
  function Forest() {
    const M = useM();
    const data = useMemo(() => {
      const R = rng(5);
      const all = [...SHRINES.white, ...SHRINES.grey, ...SHRINES.dark, ...SHRINES.pagoda, ...SHRINES.lodge, ...SHRINES.gora];
      const pines = []; const rounds = [];
      const pc = ['#1c3519', '#1a3320', '#22401f', '#1d3a26'];
      const rc = ['#2a4a22', '#25401d', '#33552a', '#2a4824', '#35592a'];
      let guard = 0;
      while ((pines.length < 3200 || rounds.length < 2400) && guard < 40000) {
        guard += 1;
        const xl = (R() - 0.5) * 200;
        const zl = -7.5 - Math.pow(R(), 1.5) * 135;
        if (all.some(([x, z]) => Math.hypot(x - xl, z - zl) < 7.0)) continue;
        if (PATHS.some((pa) => pa.some(([x, z]) => Math.hypot(x - xl, z - zl) < 1.6))) continue;
        const y = hillY(xl, zl) - 0.1;
        const d = -7 - zl;
        if (R() < 0.5 && pines.length < 3200) {
          const s = 0.9 + R() * 0.7 + sstep(0, 80, d) * 0.6;
          pines.push({ p: [xl, y, zl], r: R() * 6, s: [s * 0.9, s * (0.9 + R() * 0.4), s * 0.9], c: pc[Math.floor(R() * pc.length)] });
        } else if (rounds.length < 2400) {
          const s = 0.85 + R() * 0.65 + sstep(0, 80, d) * 0.5;
          rounds.push({ p: [xl, y + 0.7 * s, zl], r: R() * 6, s: [s * 1.1, s * 0.9, s * 1.1], c: rc[Math.floor(R() * rc.length)] });
        }
      }
      const cone = new THREE.ConeGeometry(0.85, 3.2, 7); cone.translate(0, 1.6, 0);
      const bl = new THREE.IcosahedronGeometry(1, 1); bl.translate(0, 0.9, 0);
      return { pines, rounds, cone, bl };
    }, []);
    const m = M.plain('#ffffff', { roughness: 1 });
    return (
      <group>
        <Inst geo={data.cone} mat={m} items={data.pines} />
        <Inst geo={data.bl} mat={m} items={data.rounds} />
      </group>
    );
  }

  function HillShrines({ dusk }) {
    const M = useM();
    const at = (xl, zl) => [xl, hillY(xl, zl), zl];
    const items = useMemo(() => ({
      white: SHRINES.white.map(([x, z], i) => ({ p: at(x, z), r: 0.5 * Math.sin(i * 2.3), s: 1.9 + 0.3 * Math.sin(i * 1.7) })),
      grey: SHRINES.grey.map(([x, z], i) => ({ p: at(x, z), r: 0.6 * Math.sin(i * 1.3), s: 2.0 + 0.2 * Math.sin(i * 2.9) })),
      dark: SHRINES.dark.map(([x, z], i) => ({ p: at(x, z), r: 0.4 * Math.sin(i * 1.9), s: 2.1 })),
    }), []);
    const pad = M.mat('stone', 1, 1, { color: '#b9b2a2' });
    const padGeo = unitBox();
    const pads = useMemo(() => [
      ...SHRINES.white.map(([x, z]) => ({ p: [x, hillY(x, z) - 0.1, z], s: [3.0, 0.6, 3.0] })),
      ...SHRINES.grey.map(([x, z]) => ({ p: [x, hillY(x, z) - 0.1, z], s: [3.2, 0.6, 3.2] })),
      ...SHRINES.dark.map(([x, z]) => ({ p: [x, hillY(x, z) - 0.1, z], s: [3.4, 0.6, 3.4] })),
      ...SHRINES.pagoda.map(([x, z]) => ({ p: [x, hillY(x, z) - 0.1, z], s: [2.6, 0.5, 2.6] })),
      ...SHRINES.lodge.map(([x, z]) => ({ p: [x, hillY(x, z) - 0.1, z], s: [2.2, 0.4, 1.8] })),
      ...SHRINES.gora.map(([x, z]) => ({ p: [x, hillY(x, z) - 0.15, z], s: [3.0, 0.7, 3.0] })),
    ], []);
    const steps = useMemo(() => {
      const out = [];
      PATHS.forEach((pa) => {
        for (let i = 0; i < pa.length - 1; i += 1) {
          const [x0, z0] = pa[i]; const [x1, z1] = pa[i + 1];
          const L = Math.hypot(x1 - x0, z1 - z0); const n = Math.floor(L / 0.7);
          const ang = Math.atan2(-(z1 - z0), x1 - x0);
          for (let k = 0; k < n; k += 1) { const t = k / n; const x = x0 + (x1 - x0) * t; const z = z0 + (z1 - z0) * t; out.push({ p: [x, hillY(x, z) + 0.08, z], r: ang + Math.PI / 2, s: [1.1, 0.12, 0.42] }); }
        }
      });
      return out;
    }, []);
    return (
      <group>
        <Inst geo={padGeo} mat={pad} items={pads} />
        <Inst geo={padGeo} mat={M.plain('#d2c8b2', { roughness: 0.9 })} items={steps} />
        <ShikharaSet items={items.white} tone="white" />
        <ShikharaSet items={items.grey} tone="grey" />
        <ShikharaSet items={items.dark} tone="dark" />
        {SHRINES.pagoda.map(([x, z], i) => <MiniPagoda key={i} p={at(x, z)} r={i * 0.7} s={1.6} gold={i % 2 === 1} two={i % 3 === 0} />)}
        {SHRINES.lodge.map(([x, z], i) => <Lodging key={i} p={at(x, z)} r={i * 0.4 - 0.4} w={1.7 + (i % 3) * 0.3} d={1.1} dusk={dusk} />)}
        {SHRINES.gora.map(([x, z]) => (
          <group key="gora" position={at(x, z)} scale={1.5}>
            <MiniPagoda p={[0, 0, 0]} two gold />
          </group>
        ))}
      </group>
    );
  }

  /* ---------- river works: ghats, bridges, banks, the 15 shrines ---------- */
  function Bridge({ x, dusk }) {
    const M = useM();
    const stone = M.plain('#b9b1a1', { roughness: 0.95 });
    const steel = M.plain('#3b3f45', { metalness: 0.6, roughness: 0.5 });
    const zW = HW + 1.1; const zE = -HE - 0.8; const L = zW - zE + 0.4; const cz = (zW + zE) / 2; const z0 = cz + L / 2 - 0.4;
    const zM = (HW - HE) / 2;
    const posts = useMemo(() => Array.from({ length: 12 }, (_, i) => [-0.62, 0.62].map((px) => ({ p: [px, DECK + 0.3, z0 - i * 0.95], s: [0.06, 0.7, 0.06] }))).flat(), []);
    return (
      <group position={[x, 0, 0]}>
        <Box s={[1.4, 0.18, L]} p={[0, DECK - 0.09, cz]} m={stone} />
        <Box s={[1.5, DECK - BED - 0.18, 0.8]} p={[0, (DECK + BED - 0.18) / 2, zW]} m={stone} />
        <Box s={[1.2, DECK - BED - 0.18, 0.6]} p={[0, (DECK + BED - 0.18) / 2, zM]} m={stone} />
        <Box s={[1.5, DECK - BED - 0.18, 0.8]} p={[0, (DECK + BED - 0.18) / 2, zE]} m={stone} />
        {[-0.62, 0.62].map((px) => <Box key={px} s={[0.05, 0.05, L]} p={[px, DECK + 0.62, cz]} m={steel} cast={false} />)}
        {[-0.62, 0.62].map((px) => <Box key={`r${px}`} s={[0.04, 0.04, L]} p={[px, DECK + 0.34, cz]} m={steel} cast={false} />)}
        <Inst geo={unitBox()} mat={steel} items={posts} />
        {dusk && <pointLight position={[0, 0.3 + DECK, 0]} intensity={1.2} distance={7} color="#ffb35a" />}
      </group>
    );
  }
  function Smoke({ p, n = 3, dusk }) {
    const m = useMemo(() => new THREE.MeshStandardMaterial({ color: dusk ? '#8d8696' : '#b3afa8', transparent: true, opacity: dusk ? 0.22 : 0.3, depthWrite: false, roughness: 1, side: THREE.DoubleSide }), [dusk]);
    return (
      <group position={p}>
        {Array.from({ length: n }, (_, i) => {
          const h = 6 + i * 0.9; const rad = 0.7 + i * 0.3;
          return (
            <group key={i} position={[(i - (n - 1) / 2) * 0.45, h / 2, (i % 2) * 0.2]} rotation={[0.08 * (i - 1), 0, -0.22 - i * 0.07]}>
              <mesh rotation={[Math.PI, 0, 0]} material={m}><coneGeometry args={[rad, h, 10, 1, true]} /></mesh>
              <mesh position={[0, h * 0.15, 0]} rotation={[Math.PI, 0, 0]} scale={0.6} material={m}><coneGeometry args={[rad, h, 10, 1, true]} /></mesh>
            </group>
          );
        })}
      </group>
    );
  }
  function RiverWorks({ dusk }) {
    const M = useM();
    const stone = M.plain('#a69e8e', { roughness: 0.95 });
    const paveS = M.plain('#c4bcab', { roughness: 0.95 });
    const dkStone = M.plain('#7c7970', { roughness: 0.95 });
    const overlay = (x, w, key) => Array.from({ length: STN }, (_, i) => <Box key={`${key}${i}`} s={[w, STRISE, STRUN]} p={[x, -STRISE * i - STRISE / 2 + 0.02, ZT - (i + 0.5) * STRUN]} m={dkStone} />);
    const PLX = [AX + 14, AX + 17.8, AX + 21.6, AX + 25.4, AX + 29.2];
    const PSC = 1.75; const PTOP = TERR + 2.3;
    const wallItems = useMemo(() => Array.from({ length: 15 }, (_, i) => ({ p: [(i - 7) * 2.3, PTOP, -5.9], r: 0, s: PSC })), []);
    const logs = useMemo(() => PLX.flatMap((x) => [0, 1, 2].map((k) => ({ p: [x + (k - 1) * 0.12, APRON + 0.7 + 0.1 * k, PZ + (k - 1) * 0.08], s: [2.0, 0.1, 0.15], c: '#6a4a2c' }))), []);
    const garland = useMemo(() => {
      const out = [];
      for (let i = 0; i < STN; i += 1) { [-5.7, 5.7].forEach((dx) => out.push({ p: [AX + dx, -STRISE * i + 0.1, ZT - (i + 0.5) * STRUN], s: 0.14, c: i % 2 ? '#f08a1c' : '#f4b41a' })); }
      return out;
    }, []);
    const gb = useMemo(() => new THREE.IcosahedronGeometry(1, 0), []);
    const ghatTop = useMemo(() => {
      const white = []; const grey = [];
      for (let i = 0; i < 24; i += 1) {
        const xl = -38 + i * 2.5;
        if (xl > -1.5 && xl < 10.5) continue;
        if (xl > 13) continue;
        if (xl > -22.5 && xl < -13.5) continue;
        const it = { p: [xl, 0, ZT + 1.5], r: Math.PI + 0.05 * Math.sin(i * 3), s: 0.85 + 0.1 * Math.sin(i * 1.9) };
        (i % 3 === 1 ? grey : white).push(it);
      }
      return { white, grey };
    }, []);
    const people = useMemo(() => {
      const R = rng(31); const cols = ['#e07b1a', '#b52a2a', '#f1ede2', '#2f5fa0', '#e4b52e', '#6b2a6b', '#2a7a4a'];
      const out = [];
      const add = (x, z, y, n, wx, wz) => { for (let i = 0; i < n; i += 1) out.push({ p: [x + (R() - 0.5) * wx, y, z + (R() - 0.5) * wz], s: 1.3, c: cols[Math.floor(R() * cols.length)] }); };
      add(AX, PZ, APRON, 4, 7, 0.4); add(AX + 22, PZ, APRON, 7, 14, 0.3); add(-6, PZ - 0.1, APRON, 4, 4, 0.5); add(0, -4.0, TERR, 8, 16, 0.3);
      add(-18, PZ - 0.1, APRON, 5, 6, 0.5);
      for (let i = 1; i < STN; i += 2) add(AX, ZT - (i + 0.5) * STRUN, -STRISE * i, 2, 7, 0.3);
      return out;
    }, []);
    const pg = useMemo(() => { const g = new THREE.CapsuleGeometry(0.065, 0.26, 3, 6); g.translate(0, 0.2, 0); return g; }, []);
    const steel = M.plain('#1a1a1d', { metalness: 0.5, roughness: 0.5 });
    const lampX = [-6, -3, 0, 3, 6, 9, 12];
    return (
      <group>
        {/* the Bagmati */}
        <mesh position={[0, WATER, (HW - HE) / 2]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[400, HW + HE]} /><meshStandardMaterial color="#63765f" metalness={0.15} roughness={0.25} emissive="#44584a" emissiveIntensity={0.6} /></mesh>
        {[[-14, -0.2, 3.4, 0.9], [11, -1.8, 5, 1.0], [26, -0.9, 3, 0.8], [-34, -1.6, 4.2, 0.9], [45, -0.6, 5, 0.9]].map(([x, z, w, d], i) => <Ball key={i} rad={1} sc={[w, 0.08, d]} p={[x, WATER + 0.01, z]} m={M.plain('#9d9482', { roughness: 1 })} />)}
        {[[-14, 0.2], [26, -0.3], [-34, -1.0], [11, -1.2], [45, -0.2]].map(([x, z], i) => <Ball key={`g${i}`} rad={1} sc={[1.6, 0.12, 0.6]} p={[x, WATER + 0.06, z]} m={M.plain('#6e8a40', { roughness: 1 })} />)}
        {/* west bank: broad stepped stone ghats come down from the temple terrace (stepped in the terrain mesh) */}
        <Box s={[340, APRON - BED, 0.3]} p={[0, (APRON + BED) / 2, HW - 0.1]} m={stone} />
        <Box s={[120, TERR - BED, 0.4]} p={[0, (TERR + BED) / 2, -HE - 0.2]} m={stone} />
        <Box s={[120, 0.1, 0.55]} p={[0, TERR + 0.04, -HE - 0.2]} m={M.plain('#d4ccbb')} />
        {/* Arya Ghat (wide, weathered dark grey flight) and Gauri Ghat upstream */}
        {overlay(AX, 11, 'a')}
        {overlay(-18, 9, 'g')}
        {[0, 1].map((k) => <Box key={k} s={[11, 0.2 + 0.2 * k, 0.4]} p={[AX, WATER + 0.1 + 0.1 * k, HW - 0.2 - k * 0.4]} m={dkStone} />)}
        {[0, 1].map((k) => <Box key={`gg${k}`} s={[9, 0.2 + 0.2 * k, 0.4]} p={[-18, WATER + 0.1 + 0.1 * k, HW - 0.2 - k * 0.4]} m={dkStone} />)}
        <Inst geo={gb} mat={M.plain('#ffffff', { roughness: 0.9 })} items={garland} />
        {/* Bhasmeshwar cremation platforms with the black steel canopy beside Arya Ghat */}
        {PLX.map((x) => <Box key={x} s={[3.3, 0.6, 1.15]} p={[x, APRON + 0.3, PZ]} m={paveS} />)}
        <Inst geo={unitBox()} mat={M.plain('#ffffff', { roughness: 1 })} items={logs} />
        {[[-1.45, -0.85], [1.45, -0.85], [-1.45, 0.85], [1.45, 0.85]].map(([dx, dz], i) => <Cyl key={i} rt={0.07} h={2.3} p={[PLX[0] + dx, APRON + 0.6 + 1.15, PZ + dz * 0.55]} m={steel} seg={6} />)}
        <Box s={[4.5, 0.14, 3.1]} p={[PLX[0], APRON + 2.95, PZ]} r={[0.1, 0, 0]} m={steel} />
        <Smoke p={[PLX[0], APRON + 3.0, PZ]} dusk={dusk} />
        <Smoke p={[PLX[2], APRON + 1.0, PZ]} n={2} dusk={dusk} />
        <Smoke p={[PLX[4], APRON + 1.0, PZ]} n={2} dusk={dusk} />
        <Box s={[2.8, 0.34, 1.1]} p={[-7, APRON + 0.17, PZ]} m={paveS} />
        <Box s={[2.8, 0.34, 1.1]} p={[-3.8, APRON + 0.17, PZ]} m={paveS} />
        {/* shrines and open pavilions along the top of the west-bank ghats */}
        <ShikharaSet items={ghatTop.white} tone="white" />
        <ShikharaSet items={ghatTop.grey} tone="grey" />
        {/* bridges */}
        <Bridge x={AX} dusk={dusk} />
        <Bridge x={-27} dusk={dusk} />
        {/* east bank: a tall stone-faced terrace carrying the fifteen identical Shiva shrines (Pandra Shivalaya) */}
        <Box s={[36, 2.3, 5.2]} p={[0, TERR + 1.15, -7.1]} m={M.mat('stone', 9, 1, { color: '#c9c2b2' })} />
        {[1, 2, 3, 4, 5].map((k) => <Box key={k} s={[36.2, 0.08, 0.1]} p={[0, TERR + 0.4 * k, -4.5]} m={dkStone} cast={false} />)}
        <Box s={[36.4, 0.14, 0.4]} p={[0, PTOP, -4.6]} m={M.plain('#d8d0bf')} />
        <ShikharaSet items={wallItems} tone="white" />
        <Box s={[36, 0.12, 2.6]} p={[0, PTOP + 0.02, -5.9]} m={paveS} />
        <Inst geo={pg} mat={M.plain('#ffffff', { roughness: 0.9 })} items={people} />
        {/* lamps at dusk */}
        {dusk && (
          <>
            <pointLight position={[AX, APRON + 1.6, HW + 1.2]} intensity={7} distance={14} color="#ff9a3c" />
            <pointLight position={[AX, -2.2, HW + 3]} intensity={4} distance={11} color="#ffa04a" />
            <pointLight position={[PLX[0], APRON + 1.2, PZ]} intensity={6} distance={11} color="#ff6a20" />
            <pointLight position={[PLX[3], APRON + 1.2, PZ]} intensity={5} distance={10} color="#ff6a20" />
            <pointLight position={[0, PTOP + 1.2, -4.2]} intensity={5} distance={14} color="#ffb060" />
            <pointLight position={[-27, 0.4, 0]} intensity={1.5} distance={8} color="#ffb060" />
          </>
        )}
        {lampX.map((x) => (
          <group key={x} position={[x, PTOP + 0.18, -4.7]}><Diyo p={[0, 0, 0]} /></group>
        ))}
        {dusk && lampX.map((x) => <mesh key={`fl${x}`} position={[x, PTOP + 0.34, -4.7]}><sphereGeometry args={[0.09, 8, 6]} /><meshBasicMaterial color="#ffb02a" /></mesh>)}
        {dusk && Array.from({ length: STN * 2 }, (_, i) => <mesh key={`sd${i}`} position={[AX + (i % 2 ? 5.3 : -5.3), -STRISE * Math.floor(i / 2) + 0.14, ZT - (Math.floor(i / 2) + 0.5) * STRUN]}><sphereGeometry args={[0.07, 6, 5]} /><meshBasicMaterial color="#ffb02a" /></mesh>)}
        {dusk && Array.from({ length: 12 }, (_, i) => <mesh key={`ag${i}`} position={[AX - 5 + i * 0.9, APRON + 0.1, HW - 0.3]}><sphereGeometry args={[0.07, 6, 5]} /><meshBasicMaterial color="#ffa51f" /></mesh>)}
      </group>
    );
  }

  /* ---------- townscape (instanced) ---------- */
  function Town({ dusk }) {
    const M = useM();
    const data = useMemo(() => {
      const R = rng(7);
      const bodies = { 2: [], 3: [], 4: [], 5: [] };
      const shops = [];
      const roofs = [];
      const flats = [];
      const tanks = [];
      const tints = ['#fbf8f0', '#fbf8f0', '#f3ead6', '#f6f1e4', '#f0dca0', '#fbf8f0', '#e9e2d0', '#f3ead6'];
      const brick = ['#c9795a', '#b86b4c', '#d08868', '#a85a40', '#c47a5a'];
      const rcs = ['#a8402e', '#b5482f', '#9a3a2a', '#b3523a', '#a94a32', '#9a4a30', '#b8452c', '#8d4a38'];
      const tin = ['#8a8f94', '#7d7a74', '#9b4a2c', '#a4552f', '#6f7378'];
      const prot = (x, z) => (
        (Math.abs(x) < 12.4 && z > -10.4 && z < 12.2) ||
        (Math.abs(x) < 2.8 && z > 5) ||
        (x > 11 && x < 42 && z > 1 && z < 14.5)
      );
      for (let gx = -92; gx <= 92; gx += 2.9) {
        for (let gz = -34; gz <= 96; gz += 2.9) {
          const x = gx + (R() - 0.5) * 1.1; const z = gz + (R() - 0.5) * 1.1;
          const [, zl] = toLocal(x, z);
          if (zl < 11.5) continue;
          if (Math.abs(x) < 14 && z < -10.5) continue;
          if (x > 11 && z < -11) continue;
          if (Math.abs(z - 19.5) < 1.2 || Math.abs(z - 31) < 1.2 || (Math.abs(x - 14.5) < 1.2 && z > 10) || (Math.abs(x + 15) < 1.2 && z > 10)) continue;
          if (prot(x, z) || prot(x - 1.5, z) || prot(x + 1.5, z) || prot(x, z - 1.5) || prot(x, z + 1.5)) continue;
          const along = 0.51 * x + 0.86 * z; const perp = 0.86 * x - 0.51 * z;
          if (along > 8 && Math.abs(perp) < 17) continue;
          const rd = Math.hypot(x, z - 6);
          if (Math.hypot(x, z) > 92) continue;
          if (R() < 0.04 + rd * 0.0022) continue;
          const nearWall = rd < 24;
          const r0 = R();
          const n = nearWall ? (r0 < 0.5 ? 2 : r0 < 0.88 ? 3 : 4) : (r0 < 0.18 ? 2 : r0 < 0.5 ? 3 : r0 < 0.82 ? 4 : 5);
          const w = 1.7 + R() * 1.4; const d = 1.8 + R() * 1.2;
          const r = (R() < 0.5 ? 0 : Math.PI / 2) + (R() - 0.5) * 0.08;
          const k = R();
          const c = k < 0.3 ? brick[Math.floor(R() * brick.length)] : k < 0.38 ? '#d9b080' : tints[Math.floor(R() * tints.length)];
          bodies[n].push({ p: [x, -0.05, z], r, s: [w, 1, d], c });
          const top = -0.05 + n * 0.85;
          const rk = R();
          if (rk < 0.14) { flats.push({ p: [x, top + 0.07, z], r, s: [w + 0.1, 0.16, d + 0.1], c: '#cfc7b6' }); if (R() < 0.6) tanks.push({ p: [x + 0.3, top + 0.3, z - 0.2], s: [0.4, 0.34, 0.4], c: '#2f6aa8' }); }
          else if (rk < 0.34) roofs.push({ p: [x, top, z], r, s: [w + 0.4, 0.4 + n * 0.04, d + 0.4], c: tin[Math.floor(R() * tin.length)] });
          else roofs.push({ p: [x, top, z], r, s: [w + 0.5, 0.55 + n * 0.05, d + 0.5], c: rcs[Math.floor(R() * rcs.length)] });
          if (n === 2 && R() < 0.3) shops.push({ p: [x + Math.sin(r) * (d / 2 + 0.3), 1.05, z + Math.cos(r) * (d / 2 + 0.3)], r, s: [w * 0.7, 0.08, 0.7], c: ['#c8402a', '#d9a02a', '#3a6aa0'][shops.length % 3] });
        }
      }
      const trees = [];
      const tcs = ['#4a6b30', '#3d5a28', '#567a34', '#3f6130'];
      for (let i = 0; i < 260; i += 1) {
        const a = R() * Math.PI * 2; const rr = 22 + R() * 70;
        const x = Math.cos(a) * rr; const z = Math.sin(a) * rr;
        if (z < 12 || z > 110) continue;
        if (prot(x, z) || prot(x - 1, z) || prot(x + 1, z)) continue;
        const [, zl] = toLocal(x, z); if (zl < 11.5) continue;
        const sc = 1.0 + R() * 1.0;
        trees.push({ p: [x, 0.7 * sc - 0.05, z], r: R() * 6, s: [sc * 1.1, sc * 0.9, sc * 1.1], c: tcs[i % 4] });
      }
      for (let i = 0; i < 46; i += 1) {
        const x = 14 + R() * 56; const z = -9 + R() * 26;
        const along = 0.51 * x + 0.86 * z; const perp = 0.86 * x - 0.51 * z;
        if (along > 8 && Math.abs(perp) < 12) continue;
        if (z > -10 && z < 12 && x < 24) continue;
        const [, zl] = toLocal(x, z); if (zl < 11.5) continue;
        const sc = 0.9 + R() * 0.9;
        trees.push({ p: [x, 0.7 * sc - 0.05, z], r: R() * 6, s: [sc * 1.1, sc * 0.9, sc * 1.1], c: tcs[i % 4] });
      }
      const tg = new THREE.IcosahedronGeometry(1, 1);
      const geos = [2, 3, 4, 5].map((n) => { const g = new THREE.BoxGeometry(1, 0.85 * n, 1); g.translate(0, 0.425 * n, 0); return g; });
      const rg = curvedRoofGeometry(1, 1, 1, 1.15, 0.1, 4);
      return { bodies, roofs, flats, tanks, geos, rg, trees, tg, shops };
    }, []);
    const rm = M.plain('#ffffff', { roughness: 0.85, metalness: 0.1 });
    return (
      <group>
        {[2, 3, 4, 5].map((n, i) => <Inst key={n} geo={data.geos[i]} mat={facadeMat('#ffffff', 3, n, dusk)} items={data.bodies[n]} cast={n >= 4} />)}
        <Inst geo={data.rg} mat={rm} items={data.roofs} />
        <Inst geo={unitBox()} mat={M.plain('#ffffff', { roughness: 0.9 })} items={data.flats} />
        <Inst geo={unitBox()} mat={M.plain('#ffffff', { roughness: 0.7 })} items={data.tanks} />
        <Inst geo={unitBox()} mat={M.plain('#ffffff', { roughness: 0.9 })} items={data.shops} />
        {[[0, 19.5, 120, 1.9], [0, 31, 120, 1.9], [14.5, 50, 1.9, 80], [-15, 50, 1.9, 80]].map(([x, z, w, d], i) => <Box key={i} s={[w, 0.04, d]} p={[x, 0.02, z]} m={M.plain('#7a7062', { roughness: 1 })} cast={false} />)}
        <Inst geo={data.tg} mat={M.plain('#ffffff', { roughness: 1 })} items={data.trees} />
      </group>
    );
  }

  function Balustrade({ len, p, r = 0 }) {
    const M = useM();
    const n = Math.round(len / 0.5);
    const posts = useMemo(() => Array.from({ length: n + 1 }, (_, i) => ({ p: [-len / 2 + (i * len) / n, 0.45, 0], s: [0.14, 0.6, 0.14] })), [len, n]);
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[len, 0.22, 0.5]} p={[0, 0.11, 0]} m={M.stone} />
        <Inst geo={unitBox()} mat={M.plain('#e9dfc8', { roughness: 0.9 })} items={posts} />
        <Box s={[len, 0.14, 0.34]} p={[0, 0.83, 0]} m={M.mat('brick', 4, 1, { color: '#e4a48c' })} />
      </group>
    );
  }

  /* ---------- courtyard walls (galleries) ---------- */
  function WallRun({ len, h = 1.5, p, r = 0, dusk, lowbal = true, roof = true }) {
    const M = useM();
    const brick = M.mat('brick', 6, 1, { color: '#e4a48c' });
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[len, h, 1.0]} p={[0, h / 2, 0]} m={facadeMat('#f6efdd', Math.round(len / 0.9), Math.max(1, Math.round(h / 0.75)), dusk)} />
        <Box s={[len, 0.12, 1.1]} p={[0, 0.06, 0]} m={M.stone} />
        <Box s={[len, 0.28, 0.14]} p={[0, h + 0.14, 0.4]} m={brick} />
        {roof && <Box s={[len + 0.2, 0.07, 1.4]} p={[0, h + 0.1, -0.15]} r={[-0.28, 0, 0]} m={M.plain('#6f2f25', { roughness: 0.85 })} />}
      </group>
    );
  }
  function WestGate({ dusk }) {
    const M = useM();
    const cream = facadeMat('#f8f2e2', 1, 3, dusk);
    const red = M.plain('#7a2c22', { roughness: 0.85 });
    const gl = M.plain('#e0a82a', { metalness: 0.6, roughness: 0.35, emissive: '#6b4a08', emissiveIntensity: 0.3 });
    return (
      <group position={[0, 0, 9.5]}>
        {[-1, 1].map((k) => (
          <group key={k} position={[k * 2.55, 0, 0]}>
            <Box s={[1.0, 0.2, 1.0]} p={[0, 0.1, 0]} m={M.stone} />
            <Box s={[0.8, 2.4, 0.8]} p={[0, 1.4, 0]} m={cream} />
            <Roof w={1.5} d={1.5} h={0.55} y={2.6} m={red} fascia={false} />
            <mesh position={[0, 3.45, 0]} material={M.gold}><coneGeometry args={[0.08, 0.5, 8]} /></mesh>
          </group>
        ))}
        <Box s={[5.2, 0.28, 0.5]} p={[0, 2.55, 0]} m={red} />
        <Box s={[5.2, 0.08, 0.56]} p={[0, 2.74, 0]} m={gl} cast={false} />
        <mesh position={[0, 2.1, 0.05]} material={gl}><torusGeometry args={[1.6, 0.08, 6, 24, Math.PI]} /></mesh>
        <mesh position={[0, 2.1, 0.05]} material={gl}><torusGeometry args={[1.25, 0.04, 6, 24, Math.PI]} /></mesh>
        <Box s={[0.9, 0.5, 0.1]} p={[0, 3.0, 0]} m={gl} />
        <mesh position={[0, 3.45, 0]} material={M.gold}><coneGeometry args={[0.12, 0.6, 8]} /></mesh>
        {dusk && <pointLight position={[0, 2.2, 1.8]} intensity={3} distance={9} color="#ffb060" />}
      </group>
    );
  }

  /* ---------- Nandi ---------- */
  function NandiBull() {
    const M = useM();
    const g = M.gold;
    const stone = M.plain('#bdb6a8', { roughness: 0.95 });
    const red = M.plain('#b3202a', { roughness: 0.8 });
    return (
      <group>
        <Box s={[3.4, 0.2, 4.4]} p={[0, 0.1, 0]} m={stone} />
        <Box s={[3.0, 0.5, 4.0]} p={[0, 0.45, 0]} m={stone} />
        <Box s={[2.6, 0.4, 3.6]} p={[0, 0.9, 0]} m={M.plain('#d2cab8', { roughness: 0.9 })} />
        <Box s={[2.8, 0.1, 3.8]} p={[0, 1.15, 0]} m={M.plain('#e0d8c6')} />
        <group position={[0, 1.2, 0.1]} scale={1.55}>
          <Ball rad={0.42} sc={[0.85, 0.75, 1.55]} p={[0, 0.5, 0.2]} m={g} />
          <Ball rad={0.28} sc={[0.95, 1.15, 1.15]} p={[0, 0.9, -0.22]} m={g} />
          <Ball rad={0.24} sc={[0.8, 1.2, 1.3]} p={[0, 1.0, -0.62]} m={g} />
          <Ball rad={0.21} sc={[0.8, 0.9, 1.25]} p={[0, 1.2, -0.92]} m={g} />
          <Ball rad={0.12} sc={[0.9, 0.8, 1.2]} p={[0, 1.12, -1.15]} m={g} />
          {[-1, 1].map((k) => <mesh key={k} position={[k * 0.24, 1.46, -0.92]} rotation={[0.1, 0, -k * 0.7]} material={g}><coneGeometry args={[0.055, 0.6, 7]} /></mesh>)}
          {[-1, 1].map((k) => <Ball key={`e${k}`} rad={0.07} sc={[1.5, 0.5, 0.8]} p={[k * 0.28, 1.28, -0.84]} m={g} />)}
          {[-1, 1].map((k) => <Box key={`f${k}`} s={[0.16, 0.14, 0.7]} p={[k * 0.22, 0.1, -0.5]} m={g} />)}
          {[-1, 1].map((k) => <Ball key={`h${k}`} rad={0.2} sc={[0.8, 0.55, 1.2]} p={[k * 0.34, 0.18, 0.62]} m={g} />)}
          <Box s={[0.7, 0.05, 0.9]} p={[0, 1.0, 0.1]} m={red} cast={false} />
          <mesh position={[0, 1.0, -0.62]} rotation={[0, Math.PI / 2, 0]} material={red}><torusGeometry args={[0.24, 0.05, 6, 16]} /></mesh>
          <Cyl rt={0.025} rb={0.04} h={0.6} p={[0, 0.4, 0.98]} r={[0.2, 0, 0]} m={g} seg={6} />
        </group>
      </group>
    );
  }

  /* ---------- the temple ---------- */
  function GoldRoof({ w, h, y, sag = 1.35, lift = 0.2 }) {
    const M = useM();
    const geo = useMemo(() => curvedRoofGeometry(w, w, h, sag, lift, 20), [w, h, sag, lift]);
    const hips = useMemo(() => [[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([sx, sz]) => {
      const pts = [];
      for (let i = 0; i <= 14; i += 1) { const s = 1 - i / 14; pts.push(new THREE.Vector3(sx * s * w / 2, h * (1 - s) ** sag + lift * h * s ** 4.8 + 0.03, sz * s * w / 2)); }
      return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.09, 6);
    }), [w, h, sag, lift]);
    const rim = M.plain('#e9b934', { metalness: 0.6, roughness: 0.3, emissive: '#6b4a08', emissiveIntensity: 0.3 });
    const red = M.plain('#7a2a1e', { roughness: 0.75 });
    const hw = w / 2;
    return (
      <group position={[0, y, 0]}>
        <mesh geometry={geo} material={goldTile()} castShadow receiveShadow />
        {hips.map((g, i) => <mesh key={i} geometry={g} material={M.gold} />)}
        <Box s={[w + 0.1, 0.26, 0.14]} p={[0, 0.02, hw]} m={rim} cast={false} />
        <Box s={[w + 0.1, 0.26, 0.14]} p={[0, 0.02, -hw]} m={rim} cast={false} />
        <Box s={[0.14, 0.26, w + 0.1]} p={[hw, 0.02, 0]} m={rim} cast={false} />
        <Box s={[0.14, 0.26, w + 0.1]} p={[-hw, 0.02, 0]} m={rim} cast={false} />
        <Box s={[w, 0.3, 0.16]} p={[0, -0.22, hw - 0.04]} m={red} cast={false} />
        <Box s={[w, 0.3, 0.16]} p={[0, -0.22, -hw + 0.04]} m={red} cast={false} />
        <Box s={[0.16, 0.3, w]} p={[hw - 0.04, -0.22, 0]} m={red} cast={false} />
        <Box s={[0.16, 0.3, w]} p={[-hw + 0.04, -0.22, 0]} m={red} cast={false} />
      </group>
    );
  }
  function Temple({ dusk }) {
    const M = useM();
    const wallM = M.mat('brick', 3, 1, { color: '#9a4a35' });
    const stone = M.plain('#b8b1a3', { roughness: 0.95 });
    const silver = M.plain('#e4e7ea', { metalness: 0.35, roughness: 0.32, emissive: '#6a7078', emissiveIntensity: 0.45 });
    const gold = M.gold;
    const gl = M.plain('#e0a82a', { metalness: 0.6, roughness: 0.32, emissive: '#6b4a08', emissiveIntensity: 0.3 });
    const darkRed = M.plain('#7a2a1e', { roughness: 0.8 });
    const bells = useMemo(() => {
      const out = [];
      [[8.1, 2.3, 1.7], [5.9, 4.8, 1.8]].forEach(([w, y, h]) => {
        const hw = w / 2; const n = Math.round(w / 0.5);
        for (let i = 0; i <= n; i += 1) {
          const t = -hw + (i * w) / n; const lift = 0.28 * h * (Math.abs(t) / hw) ** 2.4;
          out.push({ p: [t, y + lift - 0.45, hw], s: 1 }, { p: [t, y + lift - 0.45, -hw], s: 1 }, { p: [hw, y + lift - 0.45, t], s: 1 }, { p: [-hw, y + lift - 0.45, t], s: 1 });
        }
      });
      return out;
    }, []);
    const [struts, strutCaps] = useMemo(() => {
      const a = []; const b = [];
      [[2.3, 1.45, 1.6, 7, 0.65, 0.79, 0.3], [2.4, 3.95, 1.15, 6, 0.74, 0.75, 0.22]].forEach(([face, y0, L, n, sp, tilt, t]) => {
        for (let side = 0; side < 4; side += 1) {
          const yaw = (side * Math.PI) / 2; const c = Math.cos(yaw); const sn = Math.sin(yaw);
          for (let k = 0; k < n; k += 1) {
            const lx = (k - (n - 1) / 2) * sp;
            const cx = lx * c + (face + (L / 2) * Math.sin(tilt)) * sn; const cz = -lx * sn + (face + (L / 2) * Math.sin(tilt)) * c;
            a.push({ p: [cx, y0 + (L / 2) * Math.cos(tilt), cz], r: yaw, rx: tilt, s: [t, L, t * 0.8] });
            const tx = lx * c + (face + L * Math.sin(tilt)) * sn; const tz = -lx * sn + (face + L * Math.sin(tilt)) * c;
            b.push({ p: [tx, y0 + L * Math.cos(tilt), tz], r: yaw, s: [t * 1.35, 0.1, t * 1.35] });
          }
        }
      });
      return [a, b];
    }, []);
    const bellGeo = useMemo(() => { const g = new THREE.ConeGeometry(0.07, 0.18, 6); g.rotateX(Math.PI); return g; }, []);
    const finial = useMemo(() => {
      const P = [[0.01, 0], [0.4, 0], [0.4, 0.1], [0.26, 0.2], [0.17, 0.32], [0.26, 0.46], [0.3, 0.58], [0.16, 0.7], [0.1, 0.85], [0.1, 1.1]];
      let y = 1.1;
      for (let i = 0; i < 7; i += 1) { const r = 0.25 - 0.025 * i; P.push([r, y], [r, y + 0.07], [0.09, y + 0.11], [0.09, y + 0.22]); y += 0.24; }
      P.push([0.06, y], [0.36, y + 0.04], [0.3, y + 0.09], [0.04, y + 0.34], [0.06, y + 0.36], [0.05, y + 0.5], [0.012, y + 0.8]);
      return new THREE.LatheGeometry(V2(P), 14);
    }, []);
    const doors = [0, 1, 2, 3].map((k) => {
      const big = k === 0;
      const dw = big ? 3.1 : 2.6; const dh = big ? 1.85 : 1.7;
      return (
        <group key={k} rotation={[0, (k * Math.PI) / 2, 0]}>
          <Box s={[dw, dh, 0.08]} p={[0, 0.55 + dh / 2, 2.32]} m={silver} />
          <Box s={[dw + 0.16, 0.12, 0.12]} p={[0, 0.55 + dh + 0.04, 2.33]} m={gold} />
          <Box s={[dw + 0.16, 0.12, 0.12]} p={[0, 0.55, 2.33]} m={gold} />
          {[-1, 1].map((s) => <Box key={`s${s}`} s={[0.12, dh + 0.1, 0.12]} p={[s * (dw / 2 + 0.02), 0.55 + dh / 2, 2.33]} m={gold} />)}
          <Box s={[1.1, 1.25, 0.06]} p={[0, 1.2, 2.37]} m={M.plain('#2a1a10')} />
          {[-1, 1].map((s) => <Box key={s} s={[0.5, 1.16, 0.08]} p={[s * 0.27, 1.2, 2.41]} m={silver} />)}
          {[-1, 1].map((s) => <Ball key={`b${s}`} rad={0.06} p={[s * 0.1, 1.2, 2.47]} m={gold} />)}
          {[-1, 1].map((s) => [-0.55, 0.55].map((dy) => <Box key={`p${s}${dy}`} s={[0.7, 0.55, 0.05]} p={[s * (dw / 2 - 0.45), 1.4 + dy * 0.9, 2.37]} m={gl} />))}
          <mesh position={[0, 1.95, 2.42]} material={gold}><torusGeometry args={[0.85, 0.07, 8, 24, Math.PI]} /></mesh>
          <mesh position={[0, 1.95, 2.42]} material={gold}><torusGeometry args={[0.58, 0.04, 8, 24, Math.PI]} /></mesh>
          {[-1, 1].map((s) => (
            <group key={`n${s}`} position={[s * 1.95, 1.15, 2.28]}>
              <Box s={[0.42, 0.95, 0.05]} p={[0, 0, 0.02]} m={M.plain('#3a1a10')} />
              <Box s={[0.18, 0.5, 0.08]} p={[0, -0.08, 0.06]} m={gold} />
              <Ball rad={0.09} p={[0, 0.27, 0.07]} m={gold} />
            </group>
          ))}
          <Box s={[2.6, 0.17, 0.6]} p={[0, 0.085, 4.1]} m={stone} />
          <Box s={[2.3, 0.34, 0.3]} p={[0, 0.17, 3.95]} m={stone} />
        </group>
      );
    });
    const storey = [0, 1, 2, 3].map((k) => (
      <group key={k} rotation={[0, (k * Math.PI) / 2, 0]}>
        <Box s={[4.9, 0.16, 0.12]} p={[0, 4.84, 2.4]} m={gl} />
        <Box s={[4.9, 0.16, 0.12]} p={[0, 2.98, 2.4]} m={darkRed} />
        <Box s={[1.9, 1.15, 0.08]} p={[0, 3.95, 2.43]} m={gl} />
        <Box s={[1.5, 0.85, 0.08]} p={[0, 3.95, 2.46]} m={M.plain('#2a1a10')} />
        {[-0.5, 0, 0.5].map((x) => <Box key={x} s={[0.05, 0.85, 0.06]} p={[x, 3.95, 2.5]} m={gold} />)}
        {[-1, 1].map((sd) => (
          <group key={sd}>
            <Box s={[0.9, 1.5, 0.07]} p={[sd * 1.75, 3.9, 2.43]} m={darkRed} />
            <Box s={[0.74, 1.34, 0.08]} p={[sd * 1.75, 3.9, 2.46]} m={gl} />
            <Box s={[0.5, 0.9, 0.08]} p={[sd * 1.75, 3.9, 2.5]} m={goldTile()} />
            <Ball rad={0.09} p={[sd * 1.75, 3.9, 2.56]} m={darkRed} />
          </group>
        ))}
      </group>
    ));
    return (
      <group>
        <Box s={[9.2, 0.25, 9.2]} p={[0, 0.125, 0]} m={stone} />
        <Box s={[8.2, 0.5, 8.2]} p={[0, 0.25, 0]} m={stone} />
        <Box s={[4.6, 1.85, 4.6]} p={[0, 1.42, 0]} m={wallM} />
        <Box s={[4.9, 0.14, 4.9]} p={[0, 2.28, 0]} m={M.dark} />
        <Box s={[4.8, 0.1, 4.8]} p={[0, 0.58, 0]} m={M.dark} />
        {doors}
        <Inst geo={unitBox()} mat={M.plain('#7a2a1e', { roughness: 0.7 })} items={struts} />
        <Inst geo={unitBox()} mat={gold} items={strutCaps} />
        <GoldRoof w={8.1} h={1.7} y={2.4} sag={1.3} lift={0.32} />
        <Box s={[4.8, 2.0, 4.8]} p={[0, 3.9, 0]} m={gl} />
        {[[2.4, 2.4], [-2.4, 2.4], [2.4, -2.4], [-2.4, -2.4]].map(([x, z], i) => <Box key={i} s={[0.24, 2.0, 0.24]} p={[x, 3.9, z]} m={darkRed} />)}
        {storey}
        <GoldRoof w={5.9} h={1.8} y={4.9} sag={1.3} lift={0.3} />
        <mesh geometry={finial} material={gold} position={[0, 6.55, 0]} castShadow />
        <Inst geo={bellGeo} mat={gold} items={bells} />
        {[[4.45, 4.45], [-4.45, 4.45], [4.45, -4.45], [-4.45, -4.45]].map(([x, z], i) => (
          <group key={i} position={[x, 0.5, z]}>
            <Cyl rt={0.03} h={2.6} p={[0, 1.3, 0]} m={gold} seg={5} />
            <Box s={[0.6, 0.22, 0.01]} p={[x > 0 ? 0.3 : -0.3, 2.4, 0]} m={M.plain('#d9561a')} cast={false} />
          </group>
        ))}
        {dusk && <pointLight position={[0, 4.5, 3.8]} intensity={5} distance={14} color="#ffc070" />}
        {dusk && Array.from({ length: 28 }, (_, i) => { const t = (i / 28) * 4; const sd = Math.floor(t); const u = (t - sd) * 7.8 - 3.9; const q = [[u, 3.9], [3.9, -u], [-u, -3.9], [-3.9, u]][sd]; return <mesh key={`ea${i}`} position={[q[0], 2.15, q[1]]}><sphereGeometry args={[0.07, 6, 5]} /><meshBasicMaterial color="#ffb02a" /></mesh>; })}
        {dusk && [-1.4, -0.7, 0.7, 1.4].map((x) => <group key={x} position={[x, 0.55, 4.5]}><mesh><sphereGeometry args={[0.12, 8, 6]} /><meshBasicMaterial color="#ffb02a" /></mesh><pointLight intensity={1.2} distance={4} color="#ff9a30" /></group>)}
      </group>
    );
  }

  function Pennants({ dusk }) {
    const geo = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-0.1, 0, 0, 0.1, 0, 0, 0, -0.34, 0], 3)); g.computeVertexNormals(); return g; }, []);
    const m = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffffff', side: THREE.DoubleSide }), []);
    const items = useMemo(() => {
      const out = []; const cols = ['#d9361a', '#f08a1c', '#d9361a', '#f4c430'];
      [[4.45, 3.1, 4.45, 9.6, 1.6, 8.8], [-4.45, 3.1, 4.45, -9.6, 1.6, 8.8], [4.45, 3.1, -4.45, 9.6, 1.4, -7.4], [-4.45, 3.1, -4.45, -9.6, 1.4, -7.4]].forEach(([x0, y0, z0, x1, y1, z1]) => {
        const n = 16; const ang = Math.atan2(-(z1 - z0), x1 - x0);
        for (let i = 1; i < n; i += 1) { const t = i / n; out.push({ p: [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t - Math.sin(t * Math.PI) * 0.7, z0 + (z1 - z0) * t], r: ang, c: cols[i % 4] }); }
      });
      return out;
    }, []);
    return <Inst geo={geo} mat={m} items={items} />;
  }

  function Courtyard({ dusk }) {
    const M = useM();
    const stone = M.mat('granite', 3, 3, { color: '#d9d1c0' });
    const paveCol = M.plain('#bdb39f', { roughness: 0.95 });
    const sh = useMemo(() => ({
      grey: [3.4, 4.5, 5.6].map((x) => ({ p: [x, 0, -7.4], r: 0, s: 0.8 })),
      brahma: [{ p: [-6.4, 0, 1.5], r: Math.PI / 2, s: 1.2 }],
      chad: [{ p: [6.6, 0, -3.8], r: -Math.PI / 2, s: 0.8 }, { p: [-4.4, 0, 7.4], r: Math.PI, s: 0.8 }, ...[-6.5, -4.2, -1.9, 0.4, 2.7, 5.0].map((z) => ({ p: [8.4, 0, z], r: -Math.PI / 2, s: 0.75 })), ...[-6.2, -3.9, -1.6, 0.7].map((x) => ({ p: [x, 0, -7.6], r: 0, s: 0.7 }))],
      stone: [...[-7.8, -5.0, -2.4, 2.4, 5.0].map((z) => ({ p: [-8.6, 0, z], r: Math.PI / 2, s: 0.9 })), { p: [6.2, 0, 6.2], r: Math.PI, s: 0.8 }, { p: [-6.2, 0, -6.4], r: 0, s: 0.85 }, { p: [4.6, 0, -6.6], r: 0, s: 0.85 }],
    }), []);
    return (
      <group>
        <Box s={[21.6, 0.14, 19.4]} p={[0, -0.07, 0.6]} m={paverMat(11, 10, '#d9d0bc')} />
        <Box s={[30, 0.04, 1.9]} p={[0, -0.04, -9.95]} m={paverMat(15, 1, '#d2c9b4')} />
        <Box s={[1.9, 0.14, 6.0]} p={[0, 0.0, 6.8]} m={stone} />
        <WallRun len={19.4} h={1.15} p={[-10.1, 0, 0.6]} r={Math.PI / 2} dusk={dusk} />
        <WallRun len={19.4} h={0.9} p={[10.1, 0, 0.6]} r={-Math.PI / 2} dusk={dusk} roof={false} />
        <Balustrade len={7.4} p={[-6.7, 0, 9.5]} />
        <Balustrade len={7.4} p={[6.7, 0, 9.5]} />
        <Balustrade len={8.0} p={[-6.4, 0, -8.5]} />
        <Balustrade len={8.0} p={[6.4, 0, -8.5]} />
        <WestGate dusk={dusk} />
        {/* east gate and the stair to the river, with a small red pagoda canopy beside it */}
        {[-1, 1].map((k) => (
          <group key={k} position={[k * 2.3, 0, -8.5]}>
            <Box s={[0.7, 1.7, 0.9]} p={[0, 0.85, 0]} m={facadeMat('#f6efdd', 1, 2, dusk)} />
            <Roof w={1.2} d={1.2} h={0.4} y={1.7} m={M.plain('#6f2f25', { roughness: 0.85 })} fascia={false} />
          </group>
        ))}
        {/* Vasuki small pagoda in the north-east corner, Shankaracharya shrine by the gate */}
        <MiniPagoda p={[-7.2, 0, -5.8]} s={1.2} />
        <MiniPagoda p={[7.0, 0, 5.6]} s={0.9} />
        <ShikharaSet items={sh.grey} tone="grey" />
        <ShikharaSet items={sh.brahma} tone="grey" />
        <ShikharaSet items={sh.chad} tone="white" />
        <ShikharaSet items={sh.stone} tone="dark" />
        <MiniPagoda p={[-8.0, 0, 6.6]} s={1.0} two />
        <MiniPagoda p={[7.8, 0, -7.0]} s={0.9} />
        {/* statue pillars of the Shah kings, south side */}
        <group position={[6.2, 0, 1.0]} scale={0.5}><PillarStatue p={[0, 0, 0]} king face={Math.PI / 2} /></group>
        <group position={[6.6, 0, -1.2]} scale={0.5}><PillarStatue p={[0, 0, 0]} king face={Math.PI / 2} /></group>
        {/* Nandi in front of the west door, facing the temple */}
        <group position={[0, 0, 7.2]}><NandiBull /></group>
        {/* tridents and lamps */}
        <group position={[-2.6, 0, 5.0]} scale={0.8}><Cyl rt={0.04} h={2.6} p={[0, 1.3, 0]} m={M.plain('#8a8580', { metalness: 0.8, roughness: 0.3 })} seg={6} />{[-0.2, 0, 0.2].map((x) => <mesh key={x} position={[x, 2.7 + (x ? 0 : 0.12), 0]} material={M.gold}><coneGeometry args={[0.05, x ? 0.4 : 0.55, 6]} /></mesh>)}</group>
        {[[-2.2, 7.4], [2.2, 7.4], [-3.2, 3.6], [3.2, 3.6], [-3.2, -3.6], [3.2, -3.6]].map(([x, z], i) => <Diyo key={i} p={[x, 0, z]} />)}
        {[[-3.0, 4.6], [3.0, 4.6]].map(([x, z], i) => <Cyl key={i} rt={0.28} rb={0.32} h={0.18} p={[x, 0.09, z]} m={M.plain('#f08a1c')} seg={12} />)}
        {dusk && (
          <>
            <pointLight position={[0, 1.4, 6.5]} intensity={4} distance={9} color="#ffa040" />
            <pointLight position={[-6, 1.2, -4]} intensity={2} distance={9} color="#ffb060" />
          </>
        )}
        <Pennants dusk={dusk} />
      </group>
    );
  }

  function PashupatiMain() {
    const [dusk, ref] = useDusk();
    return (
      <group ref={ref} rotation={[0, ROT, 0]}>
        <Temple dusk={dusk} />
        <Courtyard dusk={dusk} />
        <Frame s={[9.6, 9.6, 11.5]} p={[0, 4.6, 2.6]} />
      </group>
    );
  }

  /* ---------- the setting ---------- */
  function SouthNorth({ dusk }) {
    const M = useM();
    const at = (xl, zl) => toWorld(xl, zl);
    const lane = M.plain('#b3a893', { roughness: 1 });
    return (
      <group>
        <Box s={[3.4, 0.05, 56]} p={[0, -0.03, 38]} m={lane} cast={false} />
        {/* small red-roofed pagodas among the houses */}
        <MiniPagoda p={[-15, 0, 14]} s={1.6} two />
        <MiniPagoda p={[16, 0, 12.5]} s={1.4} />
        <MiniPagoda p={[-20, 0, 2]} s={1.3} />
        <MiniPagoda p={[22, 0, 20]} s={1.4} two />
        {/* tall slim dark cypresses behind the temple (photo 0) */}
        {[[4.2, -10.6, 11], [-6.5, -11.6, 6.2], [9.2, -11.2, 5.0]].map(([x, z, h], i) => (
          <group key={i} position={[x, 0, z]}>
            <mesh position={[0, h / 2, 0]} material={M.plain('#1f3a27', { roughness: 1 })} castShadow><coneGeometry args={[h > 8 ? 0.55 : 0.5, h, 8]} /></mesh>
            {h > 8 && <mesh position={[0, h * 0.35, 0]} material={M.plain('#1f3a27', { roughness: 1 })}><coneGeometry args={[0.85, h * 0.6, 8]} /></mesh>}
          </group>
        ))}
      </group>
    );
  }
  function LocalSouth({ dusk }) {
    const M = useM();
    const lane = M.plain('#b3a893', { roughness: 1 });
    return (
      <group>
        {[[44, 12, 1.2], [-30, 12, 1.3], [62, 12, 1.5]].map(([x, z, sc], i) => <Tree key={i} p={[x, 0, z]} s={sc * 1.3} />)}
      </group>
    );
  }
  function SouthWorld({ dusk }) {
    const M = useM();
    return (
      <group>
        {/* Panch Deval: five small temples in a row on the road south of the courtyard */}
        <ShikharaSet items={useMemo(() => [0, 1, 2, 3, 4].map((i) => ({ p: [15.5 + i * 2.0, 0, 5.2], r: Math.PI, s: 1.0 })), [])} tone="white" />
        <Box s={[10.6, 0.2, 2.0]} p={[19.5, 0.1, 5.2]} m={M.stone} />
        <Box s={[11.5, 1.3, 0.6]} p={[19.5, 0.65, 7.0]} m={facadeMat('#f3ead6', 12, 1, dusk)} />
        {/* Ram Mandir: walled Vaishnava compound with a small temple */}
        <group position={[33, 0, 8]}>
          <Box s={[11, 0.9, 0.4]} p={[0, 0.45, 4.4]} m={facadeMat('#f3ead6', 11, 1, dusk)} />
          <Box s={[11, 0.9, 0.4]} p={[0, 0.45, -4.4]} m={facadeMat('#f3ead6', 11, 1, dusk)} />
          <Box s={[0.4, 0.9, 8.8]} p={[5.4, 0.45, 0]} m={facadeMat('#f3ead6', 9, 1, dusk)} />
          <Box s={[0.4, 0.9, 8.8]} p={[-5.4, 0.45, 0]} m={facadeMat('#f3ead6', 9, 1, dusk)} />
          <MiniPagoda p={[0, 0, 0]} s={1.8} two />
          <Box s={[2.4, 1.6, 2.0]} p={[-3.4, 0.8, -2.6]} m={facadeMat('#efc9b0', 3, 2, dusk)} />
          <Roof w={3.0} d={2.6} h={0.7} y={1.6} m={roofMat(M, 'clay-tile')} fascia={false} />
        </group>
      </group>
    );
  }
  function PashupatiEnv() {
    const [dusk, ref] = useDusk();
    const M = useM();
    const bigL = useMemo(() => [[-17, -5.2, 1.5], [9, -6.5, 1.7], [18, -5.6, 1.4], [-24, -5, 1.6], [28, -5.4, 1.5], [-34, -6, 1.5], [-3, -7.5, 1.5]], []);
    return (
      <group ref={ref} rotation={[0, ROT, 0]}>
        <fog attach="fog" args={[dusk ? '#2a1a44' : '#eadcc8', 120, 440]} />
        <group position={[0, 0, -Z0]} rotation={[0, -ANG, 0]}>
         <group position={[0, 0, -SH]}>
          <Terrain dusk={dusk} />
          <RiverWorks dusk={dusk} />
          <Forest />
          <HillShrines dusk={dusk} />
          {bigL.map(([x, z, s], i) => <Tree key={i} p={[x, Math.abs(x) < 18 ? TERR + 2.3 : TERR, z]} s={s * 1.4} />)}
          <LocalSouth dusk={dusk} />
         </group>
        </group>
        <Town dusk={dusk} />
        <SouthNorth dusk={dusk} />
        <SouthWorld dusk={dusk} />
        {/* faint blue ridges on the horizon */}
        {[[-60, 30], [10, 38], [80, 28], [140, 34]].map(([x, h], i) => (
          <mesh key={i} position={[x, h * 0.2, -230 - (i % 2) * 20]} scale={[110, h, 40]}><sphereGeometry args={[1, 16, 8]} /><meshBasicMaterial color={dusk ? '#4d4478' : '#a9bbd0'} fog={false} /></mesh>
        ))}
      </group>
    );
  }

  return { pashupatinath: { Main: PashupatiMain, Env: PashupatiEnv } };
}
