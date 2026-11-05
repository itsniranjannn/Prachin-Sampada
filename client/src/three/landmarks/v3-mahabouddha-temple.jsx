// Mahabouddha (Temple of a Thousand Buddhas), Uku Bahal, Patan: ONE tall curvilinear (Mahabodhi-style) terracotta shikhara,
// broad deeply-panelled base with corner lion/makara heads, a smooth curving shaft of Buddha-relief tiles with strong cornices
// and vertical ribs, a wide amalaka crown, squeezed into a tiny brick courtyard ringed by dark-brick, plaster and concrete Newar houses.
// Units: 1 unit ~ 3.4 m. Tower base ~2.6 wide, ~9 tall incl. crown. Height/tier count are photo-based estimates, not facts.
// Front = +z (convention). Painted gateway on the +z house line, Maya Devi shrine in the front-left corner.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Frame, GroundDisc, roofMat, THREE, useMemo, useRef, useEffect, useState } = K;

  const TERRA = '#a95a3e';
  const TERRA_D = '#7a3b28';
  const TERRA_L = '#b9694a';
  const FIG = '#d0805a';
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const PLASTER = new Set(['#b9b2a6', '#a8a29a', '#c9b8a6', '#b99a92', '#c4a9a0', '#9fb59c', '#c99a9a']);
  const BRICKS = ['#7a4030', '#82432f', '#8a4a38', '#7f3f2d', '#8a4330', '#7a3b2c'];
  const PLAS = ['#b9b2a6', '#c9b8a6', '#9fb59c', '#c99a9a', '#c4a9a0'];
  const ROOFS = ['#a58068', '#947058', '#8a6a55', '#b08c72', '#7e6250'];

  /* ---------------- textures / materials (cached) ---------------- */
  const cache = new Map();
  const emI = { v: 0.25 };
  const mkTex = (c, rx = 1, ry = 1) => {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; t.repeat.set(rx, ry);
    return t;
  };
  /** one cell = a large Buddha relief tile: dark arched niche, light seated figure with a gilded crown on a lotus seat */
  function tileMat() {
    if (cache.has('tile')) return cache.get('tile');
    const S = 128, c = document.createElement('canvas'); c.width = c.height = S * 2;
    const g = c.getContext('2d'); const r = rng(7);
    for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) {
      const x0 = a * S, y0 = b * S;
      g.fillStyle = r() < 0.5 ? '#a95a3e' : '#b4633f'; g.fillRect(x0, y0, S, S);
      g.fillStyle = '#7c3c28'; g.fillRect(x0, y0, S, 6); g.fillRect(x0, y0, 6, S);
      g.fillStyle = '#8d4630'; g.fillRect(x0 + 10, y0 + 10, S - 20, 3);
      g.fillStyle = '#6a2e1d'; g.beginPath(); g.moveTo(x0 + 28, y0 + 114); g.lineTo(x0 + 28, y0 + 52); g.arc(x0 + 64, y0 + 52, 36, Math.PI, 0); g.lineTo(x0 + 100, y0 + 114); g.closePath(); g.fill();
      g.fillStyle = '#c47a56'; g.beginPath(); g.arc(x0 + 64, y0 + 56, 10, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.moveTo(x0 + 44, y0 + 102); g.lineTo(x0 + 52, y0 + 70); g.lineTo(x0 + 76, y0 + 70); g.lineTo(x0 + 84, y0 + 102); g.closePath(); g.fill();
      g.fillStyle = '#b5694a'; g.fillRect(x0 + 36, y0 + 102, 56, 8);
    }
    const m = new THREE.MeshStandardMaterial({ map: mkTex(c), roughness: 0.9, metalness: 0 });
    cache.set('tile', m); return m;
  }
  /** Newar house front: brick (or plaster) with timber lattice windows per storey; part-lit windows glow at dusk */
  function facadeMat(col, wcols, storeys, seed, plain) {
    const key = `fa|${col}|${wcols}|${storeys}|${seed}|${plain}`;
    if (cache.has(key)) return cache.get(key);
    const pl = PLASTER.has(col);
    const W = 128, H = 96, c = document.createElement('canvas'); c.width = W; c.height = H;
    const e = document.createElement('canvas'); e.width = W; e.height = H;
    const g = c.getContext('2d'), eg = e.getContext('2d'); const r = rng(seed * 7 + 3);
    g.fillStyle = col; g.fillRect(0, 0, W, H); eg.fillStyle = '#000'; eg.fillRect(0, 0, W, H);
    if (pl) {
      for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(70,60,50,${0.05 + r() * 0.07})`; g.fillRect(r() * W, r() * H, 6 + r() * 20, 2 + r() * 10); }
    } else {
      for (let y = 0; y < H; y += 6) { g.fillStyle = 'rgba(40,14,8,0.25)'; g.fillRect(0, y, W, 1); for (let x = (y / 6 % 2) * 8; x < W; x += 16) g.fillRect(x, y, 1, 6); }
    }
    g.fillStyle = '#3e2618'; g.fillRect(0, H - 5, W, 5);
    const v = seed % 3;
    const ww = v === 1 ? 54 : v === 2 ? 30 : 40, wh = v === 1 ? 38 : v === 2 ? 58 : 52, wx = (W - ww) / 2, wy = v === 1 ? 26 : 16;
    if (!plain) {
      g.fillStyle = '#34200f'; g.fillRect(wx - 5, wy - 5, ww + 10, wh + 10);
      g.fillStyle = '#18100a'; g.fillRect(wx, wy, ww, wh);
      g.strokeStyle = '#8a6240'; g.lineWidth = 2;
      const step = v === 1 ? 9 : 7;
      for (let x = wx + 6; x < wx + ww; x += step) { g.beginPath(); g.moveTo(x, wy); g.lineTo(x, wy + wh); g.stroke(); }
      for (let y = wy + 8; y < wy + wh; y += 12) { g.beginPath(); g.moveTo(wx, y); g.lineTo(wx + ww, y); g.stroke(); }
      if (v === 1) { g.fillStyle = '#34200f'; g.fillRect(wx + ww / 2 - 1.5, wy, 3, wh); }
      if (v === 2) { g.fillStyle = '#34200f'; g.beginPath(); g.arc(wx + ww / 2, wy - 2, ww / 2 + 5, Math.PI, 0); g.fill(); }
      g.fillStyle = '#3e2618'; g.fillRect(wx - 8, wy + wh + 4, ww + 16, 4);
      if (r() < 0.45) { eg.fillStyle = '#ffb35a'; eg.fillRect(wx + 2, wy + 2, ww - 4, wh - 4); }
    }
    const m = new THREE.MeshStandardMaterial({ map: mkTex(c, wcols, storeys), roughness: 0.9, emissive: '#ffffff', emissiveMap: mkTex(e, wcols, storeys), emissiveIntensity: emI.v });
    cache.set(key, m); return m;
  }
  function sideMat(col, storeys, w) {
    const key = `sd|${col}|${storeys}|${w}`;
    if (cache.has(key)) return cache.get(key);
    const pl = PLASTER.has(col); const r = rng(5);
    const W = 128, H = 96, c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'); g.fillStyle = col; g.fillRect(0, 0, W, H);
    if (!pl) for (let y = 0; y < H; y += 6) { g.fillStyle = 'rgba(40,14,8,0.25)'; g.fillRect(0, y, W, 1); for (let x = (y / 6 % 2) * 8; x < W; x += 16) g.fillRect(x, y, 1, 6); }
    else for (let i = 0; i < 30; i++) { g.fillStyle = 'rgba(70,60,50,0.08)'; g.fillRect(r() * W, r() * H, 10 + r() * 20, 4 + r() * 10); }
    const m = new THREE.MeshStandardMaterial({ map: mkTex(c, Math.max(1, Math.round(w / 0.8)), storeys), roughness: 0.92 });
    cache.set(key, m); return m;
  }

  /** watches the scene background so day/dusk can change the sky and window glow (Env/Main get no dusk prop) */
  function useDusk(ref) {
    const [dusk, setDusk] = useState(false);
    useEffect(() => {
      const chk = () => {
        let o = ref.current; while (o && o.parent) o = o.parent;
        const bg = o && o.background;
        if (bg && bg.isColor) { const d = bg.r < 0.4; setDusk((p) => (p === d ? p : d)); }
      };
      chk(); const id = setInterval(chk, 400); return () => clearInterval(id);
    }, []);
    return dusk;
  }

  /* ---------------- curvilinear shaft ---------------- */
  const Y0 = 1.4, SH = 6.0, HW0 = 1.1;                    // shaft starts at y 1.4, is 4.6 tall, half-width 1.2 at foot
  const hwAt = (t) => HW0 * (1 - 0.5 * Math.pow(t, 1.4));   // convex curve: 0.55 at the top, sides bow
  const LV = [0, 0.36, 0.68, 1.0];        // only three thin cornice lines
  const yAt = (t) => Y0 + t * SH;
  const CROWN = Y0 + SH;                                  // 7.4

  function shaftGeo() {
    const N = 24, C = [[-1, 1], [1, 1], [1, -1], [-1, -1]];
    const pos = [], uv = [], idx = [];
    for (let s = 0; s < 4; s++) {
      const a = C[s], b = C[(s + 1) % 4]; const base = pos.length / 3;
      for (let i = 0; i <= N; i++) {
        const t = i / N, hw = hwAt(t), y = yAt(t);
        pos.push(a[0] * hw, y, a[1] * hw, b[0] * hw, y, b[1] * hw);
        uv.push(0, t * 8, 4, t * 8);
      }
      for (let i = 0; i < N; i++) { const k = base + i * 2; idx.push(k, k + 1, k + 3, k, k + 3, k + 2); }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx); geo.computeVertexNormals();
    return geo;
  }

  /* ---------------- the tower ---------------- */
  /** lion / makara head projecting from a corner (local +z is outward along the corner diagonal) */
  function CornerBeast({ x, z, y, k }) {
    const M = useM(); const m = M.plain(TERRA_L, { roughness: 0.85 }); const d = M.plain(TERRA_D);
    const a = Math.atan2(x, z);
    return (
      <group position={[x, y, z]} rotation={[0, a, 0]}>
        <Ball rad={0.13 * k} p={[0, 0, -0.01 * k]} sc={[1.1, 1, 0.5]} m={d} />
        <Ball rad={0.09 * k} p={[0, 0, 0.05 * k]} m={m} />
        <Box s={[0.09 * k, 0.05 * k, 0.1 * k]} p={[0, -0.03 * k, 0.13 * k]} m={M.plain('#e09a6c')} cast={false} />
        <Box s={[0.15 * k, 0.03 * k, 0.05 * k]} p={[0, 0.06 * k, 0.1 * k]} m={d} cast={false} />
        <Ball rad={0.016 * k} p={[0.035 * k, 0.025 * k, 0.12 * k]} m={M.gold} />
        <Ball rad={0.016 * k} p={[-0.035 * k, 0.025 * k, 0.12 * k]} m={M.gold} />
      </group>
    );
  }
  /** small Buddha relief tile: terracotta frame, darker recess, terracotta seated figure (no gold) */
  function Niche({ x, y, hw, k, tilt }) {
    const M = useM();
    return (
      <group position={[x, y, hw - 0.01]} rotation={[tilt, 0, 0]}>
        <Box s={[0.22 * k, 0.32 * k, 0.06]} p={[0, 0, 0.03]} m={M.plain(TERRA_L)} cast={false} />
        <Box s={[0.17 * k, 0.26 * k, 0.05]} p={[0, -0.005, 0.06]} m={M.plain('#7e3a26')} cast={false} />
        <Ball rad={0.035 * k} p={[0, 0.06 * k, 0.1]} m={M.plain(FIG)} />
        <Box s={[0.1 * k, 0.12 * k, 0.04]} p={[0, -0.06 * k, 0.095]} m={M.plain(FIG)} cast={false} />
      </group>
    );
  }
  /** recessed relief panel on the base zone: framed arched niche with a gilded seated deity and a scalloped top */
  function BasePanel({ x, w = 0.74, hs = 0.8 }) {
    const M = useM(); const dk = M.plain('#7e3a26'); const fr = M.plain(TERRA_L);
    return (
      <group position={[x, 0.3 + 0.55 * hs + 0.05, 1.3]} scale={[1, hs, 1]}>
        <Box s={[w, 1.18, 0.1]} p={[0, 0, 0.03]} m={fr} cast={false} />
        <Box s={[w - 0.16, 0.98, 0.07]} p={[0, -0.02, 0.08]} m={dk} cast={false} />
        <Cyl rt={(w - 0.16) / 2} h={0.07} p={[0, 0.47, 0.08]} r={[Math.PI / 2, 0, 0]} m={dk} seg={14} />
        <Ball rad={0.075} p={[0, 0.2, 0.15]} m={M.plain(FIG)} />
        <Box s={[0.26, 0.28, 0.06]} p={[0, 0.02, 0.14]} m={M.plain(FIG)} cast={false} />
        <Box s={[0.4, 0.07, 0.08]} p={[0, -0.16, 0.14]} m={M.plain(FIG)} cast={false} />
        <Box s={[0.44, 0.09, 0.07]} p={[0, -0.34, 0.12]} m={M.plain('#9a4d34')} cast={false} />
      </group>
    );
  }
  function Tower() {
    const M = useM(); const ledge = M.plain(TERRA_D, { roughness: 0.9 }); const gold = M.gold;
    const geo = useMemo(() => shaftGeo(), []);
    const brickL = M.mat('brick', 3, 1, { color: '#c98a72' });
    const core = M.plain('#9a4d34', { roughness: 0.9 });
    const bays = [];
    for (let b = 0; b < LV.length - 1; b++) for (let s = 0; s < 2; s++) {
      const ta = LV[b] + (LV[b + 1] - LV[b]) * s * 0.5, tb = LV[b] + (LV[b + 1] - LV[b]) * (s + 1) * 0.5;
      bays.push({ b, ya: yAt(ta), yb: yAt(tb), ha: hwAt(ta), hb: hwAt(tb) });
    }
    return (
      <group>
        {/* three-step brick plinth */}
        <Box s={[3.9, 0.1, 3.9]} p={[0, 0.05, 0]} m={brickL} />
        <Box s={[3.5, 0.1, 3.5]} p={[0, 0.15, 0]} m={brickL} />
        <Box s={[3.1, 0.1, 3.1]} p={[0, 0.25, 0]} m={brickL} />
        {/* base zone: massive, panelled, 1.1 tall */}
        <Box s={[2.6, 1.1, 2.6]} p={[0, 0.85, 0]} m={core} />
        <Box s={[2.74, 0.1, 2.74]} p={[0, 0.36, 0]} m={ledge} />
        <Box s={[2.7, 0.06, 2.7]} p={[0, 0.8, 0]} m={ledge} cast={false} />
        <Box s={[2.9, 0.14, 2.9]} p={[0, 1.42, 0]} m={ledge} />
        <Box s={[2.74, 0.06, 2.74]} p={[0, 1.3, 0]} m={M.plain(TERRA_L)} cast={false} />
        {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz], i) => (
          <group key={'p' + i}>
            <Box s={[0.3, 1.1, 0.3]} p={[sx * 1.22, 0.85, sz * 1.22]} m={M.plain(TERRA_D)} />
            <CornerBeast x={sx * 1.38} z={sz * 1.38} y={1.08} k={1.1} />
            <CornerBeast x={sx * 1.38} z={sz * 1.38} y={0.62} k={0.7} />
          </group>
        ))}
        {/* relief panels on all four faces; +z leaves room for the prayer-room door */}
        {[0, 1, 2, 3].map((q) => (
          <group key={'f' + q} rotation={[0, (q * Math.PI) / 2, 0]}>
            {q === 0 ? <><BasePanel x={-0.96} w={0.62} hs={0.8} /><BasePanel x={0.96} w={0.62} hs={0.7} /></> : <><BasePanel x={-0.85} hs={0.7 + 0.05 * q} /><BasePanel x={0} hs={0.85} /><BasePanel x={0.85} hs={0.75 + 0.04 * q} /></>}
          </group>
        ))}
        {/* prayer-room doorway on +z: carved frame, dark opening, lamp, stair */}
        <Box s={[0.84, 0.86, 0.16]} p={[0, 0.88, 1.33]} m={M.plain(TERRA_L)} />
        <Box s={[0.5, 0.6, 0.12]} p={[0, 0.8, 1.4]} m={M.plain('#1c100a')} cast={false} />
        <Box s={[0.5, 0.06, 0.14]} p={[0, 1.12, 1.41]} m={M.plain('#4b2e20')} cast={false} />
        <Box s={[0.06, 0.64, 0.14]} p={[-0.28, 0.8, 1.41]} m={M.plain('#4b2e20')} cast={false} />
        <Box s={[0.06, 0.64, 0.14]} p={[0.28, 0.8, 1.41]} m={M.plain('#4b2e20')} cast={false} />
        <Box s={[0.18, 0.2, 0.04]} p={[0, 0.58, 1.43]} m={M.gold} cast={false} />
        <Ball rad={0.06} p={[0, 0.74, 1.43]} m={M.gold} />
        <Box s={[0.6, 0.16, 0.06]} p={[0, 1.27, 1.42]} m={M.plain(TERRA_D)} cast={false} />
        <Ball rad={0.045} p={[0, 1.27, 1.46]} m={M.plain(FIG)} />
        <Box s={[1.1, 0.1, 0.34]} p={[0, 0.34, 1.56]} m={brickL} />
        <Box s={[1.4, 0.1, 0.3]} p={[0, 0.22, 1.72]} m={brickL} />

        {/* the shaft: one smooth curved taper, tiled with Buddha reliefs */}
        <mesh geometry={geo} material={tileMat()} castShadow receiveShadow />
        {/* three thin cornice lines; small beast finials at the corners */}
        {LV.map((t, i) => {
          const hw = hwAt(t), y = yAt(t);
          return (
            <group key={'c' + i}>
              <Box s={[2 * hw + 0.16, 0.05, 2 * hw + 0.16]} p={[0, y, 0]} m={ledge} />
              {i > 0 && i < LV.length - 1 && [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz], q) => (
                <group key={q}>
                  <CornerBeast x={sx * (hw + 0.07)} z={sz * (hw + 0.07)} y={y + 0.08} k={0.5} />
                  <Cyl rt={0.004} rb={0.035} h={0.16} p={[sx * (hw + 0.03), y + 0.12, sz * (hw + 0.03)]} m={M.plain(TERRA_L)} seg={6} />
                </group>
              ))}
            </group>
          );
        })}
        {/* three projecting ribs per face, running the full shaft height */}
        {[0, 1, 2, 3].map((q) => (
          <group key={'r' + q} rotation={[0, (q * Math.PI) / 2, 0]}>
            {bays.map((s, i) => {
              const dy = s.yb - s.ya, dz = s.hb - s.ha, len = Math.hypot(dy, dz), hm = (s.ha + s.hb) / 2;
              const th = Math.atan2(dz, dy);
              return [-0.38, 0.38].map((u) => {
                
                return <Box key={i + '_' + u} s={[0.1, len, 0.15]} p={[u * hm, (s.ya + s.yb) / 2, hm + 0.02]} r={[th, 0, 0]} m={ledge} cast={false} />;
              });
            })}
          </group>
        ))}
        {/* two columns of small terracotta Buddha tiles in every band, between the ribs */}
        {[0, 1, 2, 3].map((q) => (
          <group key={'n' + q} rotation={[0, (q * Math.PI) / 2, 0]}>
            {Array.from({ length: 8 }, (_, b) => {
              const t = 0.07 + b * 0.125, hw = hwAt(t), tilt = -Math.atan2(hwAt(t - 0.03) - hwAt(t + 0.03), SH * 0.06);
              return [-0.76, 0, 0.76].map((u) => <Niche key={b + '_' + u} x={u * hw} y={yAt(t)} hw={hw} k={1 - b * 0.04} tilt={tilt} />);
            })}
          </group>
        ))}

        {/* crown: tapering upper section narrowing to a small square, ribbed amalaka disc, tall gilded kalasha */}
        <Box s={[1.16, 0.12, 1.16]} p={[0, CROWN + 0.04, 0]} m={ledge} />
        <Box s={[0.98, 0.26, 0.98]} p={[0, CROWN + 0.22, 0]} m={M.plain(TERRA)} />
        <Box s={[0.82, 0.26, 0.82]} p={[0, CROWN + 0.48, 0]} m={M.plain(TERRA_L)} />
        <Box s={[0.9, 0.04, 0.9]} p={[0, CROWN + 0.62, 0]} m={ledge} cast={false} />
        <Box s={[0.66, 0.26, 0.66]} p={[0, CROWN + 0.77, 0]} m={M.plain(TERRA)} />
        {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz], q) => <Cyl key={q} rt={0.004} rb={0.03} h={0.14} p={[sx * 0.55, CROWN + 0.14, sz * 0.55]} m={M.plain(TERRA_L)} seg={6} />)}
        <Cyl rt={0.45} rb={0.45} h={0.2} p={[0, CROWN + 1.0, 0]} m={M.plain(TERRA_D)} seg={12} />
        {Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return <Box key={'am' + i} s={[0.06, 0.2, 0.06]} p={[Math.sin(a) * 0.45, CROWN + 1.0, Math.cos(a) * 0.45]} r={[0, a, 0]} m={M.plain(TERRA_L)} cast={false} />; })}
        <Cyl rt={0.4} rb={0.45} h={0.05} p={[0, CROWN + 1.13, 0]} m={M.plain(TERRA_L)} seg={12} />
        <Cyl rt={0.16} rb={0.24} h={0.12} p={[0, CROWN + 1.2, 0]} m={M.plain(TERRA)} seg={10} />
        <Cyl rt={0.2} rb={0.16} h={0.08} p={[0, CROWN + 1.3, 0]} m={gold} seg={10} />
        <Ball rad={0.2} p={[0, CROWN + 1.48, 0]} sc={[1, 1.1, 1]} m={gold} />
        <Cyl rt={0.07} rb={0.12} h={0.22} p={[0, CROWN + 1.72, 0]} m={gold} seg={8} />
        <Ball rad={0.09} p={[0, CROWN + 1.86, 0]} m={gold} />
        <Cyl rt={0.012} rb={0.04} h={0.4} p={[0, CROWN + 2.1, 0]} m={gold} seg={6} />
      </group>
    );
  }

  /* ---------------- courtyard features ---------------- */
  function PrayerWheelRow({ p, r = 0, n = 5, gap = 0.2 }) {
    const M = useM(); const brass = M.plain('#6b5326', { roughness: 0.5, metalness: 0.6 });
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[n * gap + 0.04, 0.06, 0.2]} p={[0, 0.03, 0]} m={M.plain('#5a3224')} cast={false} />
        {Array.from({ length: n }, (_, i) => (
          <Cyl key={i} rt={0.06} h={0.15} p={[-((n - 1) * gap) / 2 + i * gap, 0.135, 0]} m={brass} seg={8} />
        ))}
      </group>
    );
  }
  /** Maya Devi shrine: small brick-and-terracotta temple topped by a miniature curvilinear shikhara */
  function MayaDevi({ p, r = 0 }) {
    const M = useM(); const t = M.plain(TERRA); const td = M.plain(TERRA_D);
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[0.95, 0.12, 0.95]} p={[0, 0.06, 0]} m={M.mat('brick', 1, 1, { color: '#d89a82' })} />
        <Box s={[0.7, 0.85, 0.7]} p={[0, 0.54, 0]} m={M.mat('brick', 1, 1, { color: '#d09078' })} />
        <Box s={[0.34, 0.5, 0.06]} p={[0, 0.45, 0.35]} m={M.plain('#1c100a')} cast={false} />
        <Ball rad={0.07} p={[0, 0.42, 0.37]} m={M.gold} />
        <Box s={[0.84, 0.08, 0.84]} p={[0, 0.99, 0]} m={td} />
        <Box s={[0.6, 0.2, 0.6]} p={[0, 1.13, 0]} m={t} />
        <Box s={[0.66, 0.04, 0.66]} p={[0, 1.24, 0]} m={td} cast={false} />
        <Box s={[0.5, 0.2, 0.5]} p={[0, 1.36, 0]} m={t} />
        <Box s={[0.55, 0.04, 0.55]} p={[0, 1.47, 0]} m={td} cast={false} />
        <Box s={[0.38, 0.2, 0.38]} p={[0, 1.58, 0]} m={t} />
        <Box s={[0.43, 0.04, 0.43]} p={[0, 1.69, 0]} m={td} cast={false} />
        <Box s={[0.27, 0.18, 0.27]} p={[0, 1.78, 0]} m={t} />
        <Cyl rt={0.17} rb={0.2} h={0.07} p={[0, 1.9, 0]} m={td} seg={8} />
        <Cyl rt={0.01} rb={0.05} h={0.2} p={[0, 2.03, 0]} m={M.gold} seg={6} />
      </group>
    );
  }

  /** Newar house: dark brick or plaster, timber lattice windows, projecting window bay, eave bands, low dull tile or flat concrete roof. Window face is local +z. */
  function Hse({ p, r = 0, w = 2.2, d = 1.8, st = 3, col = '#7a4030', roof = '#6b4a35', seed = 1, plain = false, bay = false, flat = false, sh = 0.9, dorm = false, balc = false }) {
    const M = useM();
    const H = st * sh;
    const wcols = Math.max(1, Math.round(w / 0.9));
    const front = facadeMat(col, wcols, st, seed, plain);
    const side = sideMat(col, st, d);
    const mats = [side, side, side, side, front, side];
    const bi = Math.floor(wcols / 2), bx = (bi + 0.5) * w / wcols - w / 2;
    const tim = M.plain('#43271a', { roughness: 0.9 });
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[w, H, d]} p={[0, H / 2, 0]} m={mats} />
        {Array.from({ length: st - 1 }, (_, i) => <Box key={i} s={[w + 0.06, 0.05, d + 0.06]} p={[0, (i + 1) * sh, 0]} m={tim} cast={false} />)}
        <Box s={[w + 0.14, 0.08, d + 0.14]} p={[0, H, 0]} m={tim} cast={false} />
        {flat ? (
          <>
            <Box s={[w + 0.06, 0.1, d + 0.06]} p={[0, H + 0.08, 0]} m={M.plain('#8d8880', { roughness: 1 })} />
            <Box s={[0.5, 0.35, 0.5]} p={[w * 0.2, H + 0.3, -d * 0.2]} m={M.plain('#9a958d', { roughness: 1 })} />
          </>
        ) : (
          <>
            <Roof w={w + 0.5} d={d + 0.4} h={st === 1 ? 0.3 : 0.5} y={H + 0.02} m={M.mat('roof', 3, 2, { color: roof })} sag={1.05} lift={0.02} fascia={false} />
            {dorm && st >= 3 && (
              <group position={[w * 0.15, H - 0.1, d / 2 - 0.05]}>
                <Box s={[0.55, 0.5, 0.3]} p={[0, 0.25, 0]} m={M.plain('#6a3f2c')} cast={false} />
                <Box s={[0.3, 0.3, 0.02]} p={[0, 0.25, 0.16]} m={M.plain('#18100a')} cast={false} />
                <Roof w={0.8} d={0.6} h={0.3} y={0.48} m={M.mat('roof', 1, 1, { color: roof })} sag={1.05} fascia={false} />
              </group>
            )}
          </>
        )}
        {balc && st >= 2 && (
          <group position={[0, 2 * sh, d / 2 + 0.17]}>
            <Box s={[w * 0.85, 0.05, 0.34]} m={tim} cast={false} />
            <Box s={[w * 0.85, 0.2, 0.03]} p={[0, 0.12, 0.16]} m={M.plain('#6b4a35')} cast={false} />
          </group>
        )}
        {bay && st >= 2 && (
          <group position={[bx, sh + 0.49, d / 2]}>
            <Box s={[0.82, 0.62, 0.2]} p={[0, 0, 0.1]} m={tim} />
            <Box s={[0.68, 0.46, 0.03]} p={[0, 0, 0.215]} m={M.plain('#8a6240')} cast={false} />
            <Box s={[0.94, 0.05, 0.32]} p={[0, 0.36, 0.14]} m={M.plain('#5a3a28')} cast={false} />
          </group>
        )}
        {bay && st >= 2 && <Box s={[w + 0.04, 0.04, 0.3]} p={[0, sh - 0.04, d / 2 + 0.14]} r={[0.3, 0, 0]} m={M.plain('#5e4331', { roughness: 1 })} cast={false} />}
      </group>
    );
  }

  /* painted arched courtyard gateway: terracotta field, yellow border, Buddha niches, layered blue and gold scalloped fan crest */
  function Gateway({ p, r = 0 }) {
    const M = useM(); const red = M.plain('#b3402f', { roughness: 0.7 }); const yel = M.plain('#e3b341', { roughness: 0.6 }); const blue = M.plain('#2a8fa8', { roughness: 0.6 });
    const glow = useMemo(() => new THREE.MeshBasicMaterial({ color: '#f0b46a', toneMapped: false }), []);
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[2.3, 1.9, 0.7]} p={[0, 0.95, 0]} m={M.mat('brick', 2, 2, { color: '#c08a74' })} />
        <Box s={[0.5, 1.5, 0.05]} p={[-0.8, 0.8, 0.36]} m={red} cast={false} />
        <Box s={[0.5, 1.5, 0.05]} p={[0.8, 0.8, 0.36]} m={red} cast={false} />
        <Box s={[2.3, 0.45, 0.06]} p={[0, 1.55, 0.36]} m={red} cast={false} />
        <Box s={[0.05, 1.5, 0.07]} p={[-1.06, 0.8, 0.37]} m={yel} cast={false} />
        <Box s={[0.05, 1.5, 0.07]} p={[1.06, 0.8, 0.37]} m={yel} cast={false} />
        <Box s={[2.3, 0.05, 0.07]} p={[0, 1.78, 0.37]} m={yel} cast={false} />
        {/* passage: dark arch with a lit shop lane glowing behind */}
        <Box s={[0.9, 1.0, 0.8]} p={[0, 0.55, 0]} m={M.plain('#120a06')} cast={false} />
        <Cyl rt={0.45} h={0.8} p={[0, 1.05, 0]} r={[Math.PI / 2, 0, 0]} m={M.plain('#120a06')} seg={18} />
        <Box s={[0.52, 0.7, 0.01]} p={[0, 0.5, 0.405]} m={glow} cast={false} />
        <mesh position={[0, 0.85, 0.405]} material={glow}><circleGeometry args={[0.26, 14, 0, Math.PI]} /></mesh>
        <Box s={[0.14, 0.4, 0.015]} p={[-0.1, 0.35, 0.41]} m={M.plain('#3a1c10')} cast={false} />
        <Box s={[0.12, 0.34, 0.015]} p={[0.12, 0.32, 0.41]} m={M.plain('#5a2a1a')} cast={false} />
        <mesh position={[0, 1.05, 0.38]} material={yel}><torusGeometry args={[0.5, 0.045, 6, 20, Math.PI]} /></mesh>
        {[-0.7, -0.35, 0, 0.35, 0.7].map((x, i) => (
          <group key={i} position={[x, 1.62, 0.4]}>
            <Box s={[0.2, 0.26, 0.04]} m={M.plain('#e8dcc0')} cast={false} />
            <Ball rad={0.04} p={[0, 0, 0.03]} m={M.gold} />
          </group>
        ))}
        {/* crest: layered blue and gold half-discs with a scalloped rim */}
        <Box s={[1.5, 0.12, 0.3]} p={[0, 1.96, 0]} m={M.plain('#a86a52')} />
        <group position={[0, 2.02, 0.12]} scale={0.9}>
          <mesh material={blue}><circleGeometry args={[0.66, 28, 0, Math.PI]} /></mesh>
          <mesh position={[0, 0, 0.01]} material={M.gold}><circleGeometry args={[0.54, 28, 0, Math.PI]} /></mesh>
          <mesh position={[0, 0, 0.02]} material={blue}><circleGeometry args={[0.42, 28, 0, Math.PI]} /></mesh>
          <mesh position={[0, 0, 0.03]} material={M.gold}><circleGeometry args={[0.3, 28, 0, Math.PI]} /></mesh>
          <mesh position={[0, 0, 0.04]} material={blue}><circleGeometry args={[0.16, 20, 0, Math.PI]} /></mesh>
          {Array.from({ length: 13 }, (_, i) => { const a = (i / 12) * Math.PI; return <mesh key={i} position={[Math.cos(a) * 0.66, Math.sin(a) * 0.66, 0.005]} material={i % 2 ? M.gold : blue}><circleGeometry args={[0.07, 10]} /></mesh>; })}
          {Array.from({ length: 9 }, (_, i) => { const a = 0.2 + (i / 8) * (Math.PI - 0.4); return <Box key={i} s={[0.025, 0.3, 0.02]} p={[Math.cos(a) * 0.38, Math.sin(a) * 0.38, 0.05]} r={[0, 0, a - Math.PI / 2]} m={blue} cast={false} />; })}
          <Ball rad={0.06} p={[0, 0.72, 0.01]} m={M.gold} />
        </group>
      </group>
    );
  }

  /** Uku Bahal (Rudravarna Mahavihara): two-tier gilded roof monastery, glimpsed over the south houses */
  function UkuBahal({ p, r = 0 }) {
    const M = useM(); const g = roofMat(M, 'gilded-copper');
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[3.0, 2.6, 2.6]} p={[0, 1.3, 0]} m={M.mat('brick', 3, 3, { color: '#a8705c' })} />
        <Roof w={3.8} d={3.4} h={0.8} y={2.55} m={g} sag={1.4} lift={0.2} />
        <Box s={[2.0, 0.9, 1.8]} p={[0, 3.05, 0]} m={M.mat('brick', 2, 1, { color: '#a8705c' })} />
        <Roof w={2.8} d={2.6} h={0.75} y={3.45} m={g} sag={1.4} lift={0.2} />
        <Cyl rt={0.02} rb={0.1} h={0.65} p={[0, 4.5, 0]} m={M.gold} seg={8} />
      </group>
    );
  }

  /* ---------------- Main ---------------- */
  function MahaMain() {
    const ref = useRef();
    const dusk = useDusk(ref);
    return (
      <group ref={ref}>
        <Tower />
        <pointLight position={[0, CROWN + 1.2, 0.6]} intensity={dusk ? 2.2 : 0.7} distance={8} color="#ffb070" />
        <PrayerWheelRow p={[-1.5, 0.0, 2.14]} r={0} n={5} gap={0.2} />
        <PrayerWheelRow p={[1.5, 0.0, 2.14]} r={0} n={5} gap={0.2} />
        <PrayerWheelRow p={[2.14, 0.0, 0.0]} r={Math.PI / 2} n={20} gap={0.2} />
        <PrayerWheelRow p={[-2.14, 0.0, 0.0]} r={Math.PI / 2} n={20} gap={0.2} />
        <Frame s={[5.0, 9.6, 6.6]} p={[0, 4.8, 1.2]} />
      </group>
    );
  }

  /* ---------------- Env ---------------- */
  function MahaEnv() {
    const M = useM(); const ref = useRef();
    const dusk = useDusk(ref);
    useEffect(() => { emI.v = dusk ? 0.65 : 0.25; cache.forEach((m, k) => { if (k.startsWith('fa|')) m.emissiveIntensity = emI.v; }); }, [dusk]);
    const sky = useMemo(() => {
      const g = new THREE.SphereGeometry(95, 24, 14); const pos = g.attributes.position; const col = [];
      const hz = new THREE.Color(dusk ? '#f09a5a' : '#f3f1ea'), zn = new THREE.Color(dusk ? '#2a1a44' : '#8fbce6'), md = new THREE.Color(dusk ? '#b5566a' : '#bcd5ec'), c = new THREE.Color();
      for (let i = 0; i < pos.count; i++) { const t = Math.min(1, Math.max(0, pos.getY(i) / 95)); if (t < 0.3) c.copy(hz).lerp(md, t / 0.3); else c.copy(md).lerp(zn, Math.pow((t - 0.3) / 0.7, 0.8)); col.push(c.r, c.g, c.b); }
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); return g;
    }, [dusk]);
    const city = useMemo(() => {
      const r = rng(11); const out = [];
      for (let gx = -11; gx <= 11; gx++) for (let gz = -11; gz <= 11; gz++) {
        const x = gx * 3.3 + (r() - 0.5) * 0.9, z = gz * 3.3 + (r() - 0.5) * 0.9;
        const dist = Math.hypot(x, z);
        if (Math.max(Math.abs(x), Math.abs(z)) < 6.4 || dist > 38) continue;
        if (r() < 0.18) continue;
        if (z > 0 && Math.abs(x) < 1.6 && z < 20) continue; // narrow lane in front of the tower
        if (Math.hypot(x + 6, z - 9.5) < 4.4) continue; // keep Uku Bahal visible
        if (Math.hypot(x + 3.6, z - 5.2) < 2.8) continue; // keep the gate clear
        const front = z > 4 && z < 16 && x > -9 && x < 10;   // keep the view to the front low
        const st = front ? 1 + Math.floor(r() * 2) : dist < 16 ? 2 + Math.floor(r() * 3) : 2 + Math.floor(r() * 4);
        const pl = r() < 0.2;
        out.push({ x, z, st, sh: front ? 0.75 : 0.9, w: 1.9 + r() * 0.7, d: 1.9 + r() * 0.7, rot: Math.round(r() * 4) * (Math.PI / 2) + (r() - 0.5) * 0.2, col: pl ? PLAS[Math.floor(r() * PLAS.length)] : BRICKS[Math.floor(r() * BRICKS.length)], roof: ROOFS[Math.floor(r() * ROOFS.length)], seed: Math.floor(r() * 6), plain: r() < 0.2, flat: r() < 0.05, dorm: r() < 0.3, balc: r() < 0.3 });
      }
      return out;
    }, []);
    const lane = M.mat('brick', 10, 10, { color: '#b17f68' });
    return (
      <group ref={ref}>
        <mesh geometry={sky} renderOrder={-10}><meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} toneMapped={false} /></mesh>
        <GroundDisc r={64} m={M.plain('#8d6a54', { roughness: 1 })} y={-0.03} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} material={lane} receiveShadow><planeGeometry args={[30, 30]} /></mesh>

        {/* courtyard ring, faces 2.8-2.9 from the tower: tall N and W blocks, lower E, low 1-storey shop row S */}
        <Hse p={[-2.4, 0, -3.8]} r={0} w={2.5} d={2.2} st={4} sh={0.92} col="#7a4030" roof="#a58068" seed={1} bay dorm />
        <Hse p={[0.2, 0, -3.8]} r={0} w={2.5} d={2.2} st={3} sh={0.95} col="#9fb59c" roof="#8a6a55" seed={2} bay balc />
        <Hse p={[2.8, 0, -3.8]} r={0} w={2.6} d={2.2} st={4} sh={0.9} col="#82432f" roof="#947058" seed={3} dorm />
        <Hse p={[-3.9, 0, -1.6]} r={Math.PI / 2} w={2.7} d={2.2} st={4} sh={0.95} col="#8a4a38" roof="#b08c72" seed={4} bay balc />
        <Hse p={[-3.9, 0, 0.9]} r={Math.PI / 2} w={2.0} d={2.0} st={3} sh={0.9} col="#c99a9a" roof="#7e6250" seed={5} balc />
        <Hse p={[3.9, 0, -1.7]} r={-Math.PI / 2} w={2.8} d={2.2} st={4} sh={0.88} col="#7f3f2d" roof="#947058" seed={2} bay dorm />
        <Hse p={[4.1, 0, 1.0]} r={-Math.PI / 2} w={2.2} d={1.8} st={2} sh={0.75} col="#8a4330" roof="#a58068" seed={1} />
        {/* south (front) lane houses: one storey, roofs below 0.9, so the base zone stays visible; painted gate set in the line */}
        <Hse p={[-6.4, 0, 5.7]} r={0} w={2.6} d={1.6} st={2} sh={0.7} col="#8a4330" roof="#8a6a55" seed={3} />
        <Gateway p={[-3.6, 0, 5.2]} r={0.35} />
        <Hse p={[6.6, 0, 5.7]} r={0} w={2.4} d={1.6} st={2} sh={0.7} col="#82432f" roof="#b08c72" seed={2} />
        {/* second row behind the front line, so the lane to Uku Bahal reads */}
        <UkuBahal p={[-6, 0, 9.5]} r={0.15} />
        {city.map((h, i) => <Hse key={i} p={[h.x, 0, h.z]} r={h.rot} w={h.w} d={h.d} st={h.st} col={h.col} roof={h.roof} seed={h.seed} plain={h.plain} flat={h.flat} sh={h.sh} dorm={h.dorm} balc={h.balc} />)}
        {/* lamps / diyas by the plinth and the gate */}
        <pointLight position={[0, 1.4, 2.8]} intensity={dusk ? 1.4 : 0.8} distance={7} color="#ffb35a" />
        <pointLight position={[-3.4, 1.4, 5.9]} intensity={dusk ? 1.3 : 0.7} distance={5} color="#ffb35a" />
        {[[-3.4, 5.9], [-2.7, 5.9], [-4.1, 5.9]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.08, z]}><coneGeometry args={[0.03, 0.08, 8]} /><meshBasicMaterial color="#ffcf7a" toneMapped={false} /></mesh>
        ))}
        <MayaDevi p={[-3.0, 0, 3.0]} r={0.3} />
      </group>
    );
  }

  return { 'mahabouddha-temple': { Main: MahaMain, Env: MahaEnv } };
}
