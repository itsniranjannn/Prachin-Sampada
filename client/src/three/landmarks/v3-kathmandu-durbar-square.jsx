// Kathmandu Durbar Square: the whole plaza as an open L. Model frame (1 unit ~ 3.2 m): the Hanuman Dhoka palace (long brick facade with
// its gate, Kal Bhairav screen, Gaddi Baithak and Basantapur tower) closes the BACK; Taleju's gilded roofs rise behind it. The red-brick
// pagodas stand in the open stone plaza on the west: Maju Dega on nine steps, Trailokya Mohan with its Garuda, Shiva-Parvati, the white
// shikhara shrine, Jagannath with Pratap Malla's pillar, Kageshwar and Indrapur. Kasthamandap and Kumari Ghar close the south side.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Gajur, Lion, Garuda, Doorway, TripleWindow, Frame, Tree, Spire, THREE, useMemo } = K;

  const RED = '#c0301f', TIMBER = '#4a2c1a', TILE = '#8a4a32', BRICK = '#c8693f', WING = '#d6805a', GOLDC = '#c9a227';
  const SAND = '#d4b896';
  const g = {
    box: new THREE.BoxGeometry(1, 1, 1),
    plane: new THREE.PlaneGeometry(1, 1),
    cone: new THREE.ConeGeometry(0.5, 1, 8),
    cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 10),
    cap: new THREE.CapsuleGeometry(0.3, 0.5, 3, 8),
  };
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const at = (ry, a, o) => [a * Math.cos(ry) + o * Math.sin(ry), -a * Math.sin(ry) + o * Math.cos(ry)];
  const SIDES = [0, Math.PI / 2, Math.PI, -Math.PI / 2];

  let latM = null;
  function latMat() {
    if (latM) return latM;
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d');
    x.fillStyle = '#3a2112'; x.fillRect(0, 0, 64, 64);
    x.strokeStyle = '#b8894a'; x.lineWidth = 3;
    for (let i = 6; i < 64; i += 12) { x.beginPath(); x.moveTo(i, 3); x.lineTo(i, 61); x.stroke(); x.beginPath(); x.moveTo(3, i); x.lineTo(61, i); x.stroke(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    latM = new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: '#ff9a40', emissiveIntensity: 0.15, roughness: 0.85 });
    return latM;
  }

  /** Many copies of one geometry in one draw call. items: {p, r, s, c} */
  function Inst({ geo, m, items, shadow = false }) {
    const mesh = useMemo(() => {
      if (!items.length) return null;
      const im = new THREE.InstancedMesh(geo, m, items.length);
      const o = new THREE.Object3D(); o.rotation.order = 'YXZ';
      const col = new THREE.Color();
      items.forEach((it, i) => {
        o.position.set(it.p[0], it.p[1], it.p[2]);
        o.rotation.set((it.r && it.r[0]) || 0, (it.r && it.r[1]) || 0, (it.r && it.r[2]) || 0);
        const s = it.s || [1, 1, 1]; o.scale.set(s[0], s[1], s[2]);
        o.updateMatrix(); im.setMatrixAt(i, o.matrix);
        if (it.c) im.setColorAt(i, col.set(it.c));
      });
      im.castShadow = shadow; im.receiveShadow = true; im.frustumCulled = false;
      return im;
    }, [geo, m, items, shadow]);
    return mesh ? <primitive object={mesh} /> : null;
  }
  /** Lattice windows (+ their warm timber frames) as two instanced meshes. */
  function Windows({ win, fr }) {
    const M = useM();
    return (
      <>
        <Inst geo={g.plane} m={latMat()} items={win} />
        <Inst geo={g.box} m={M.plain('#6a3a20', { roughness: 0.8 })} items={fr} />
      </>
    );
  }
  const fringe = (RWx, RWz, y) => [[0, 1], [0, -1], [1, 0], [-1, 0]].map(([ex, ez]) => ({ p: [ex * RWx / 2, y, ez * RWz / 2], s: ex ? [0.07, 0.22, RWz] : [RWx, 0.22, 0.07] }));
  const winAt = (win, fr, ry, a, y, o, w, h) => {
    const [x, z] = at(ry, a, o + 0.035); const [fx, fz] = at(ry, a, o);
    win.push({ p: [x, y, z], r: [0, ry, 0], s: [w, h, 1] });
    fr.push({ p: [fx, y, fz], r: [0, ry, 0], s: [w + 0.1, h + 0.1, 0.07] });
  };

  /* ---------- the red-brick Newar pagoda: tiers of brick wall, struts, red-edged tiled roof, gilded finial ---------- */
  function Pagoda({ p = [0, 0, 0], r = 0, w = 3, tiers = 3, wh = [1.6, 1.1, 0.9], ov = 0.85, rise = 0.25, taper = 0.7, door = true, gold = false, open = false, fin = 1, woodWall = false, doorGold = false, dw, brick = BRICK, tile = TILE, edge = RED }) {
    const M = useM();
    const els = [], fr = [], dk = [], st = [], wi = [], wf = [], bl = [];
    const roofM = gold ? M.gold : M.mat('roof', 3, 3, { color: tile });
    let y = 0, W = w, top = 0;
    for (let i = 0; i < tiers; i += 1) {
      const H = wh[Math.min(i, wh.length - 1)];
      const O = ov * (i ? 0.88 : 1);
      const RW = W + 2 * O, RH = RW * rise, yr = y + H - 0.04;
      if (open && i === 0) {
        els.push(<Box key="in" s={[W * 0.82, H * 0.92, W * 0.82]} p={[0, y + H * 0.46, 0]} m={M.plain('#4a2c1a', { roughness: 0.9 })} />);
        const n = 6;
        SIDES.forEach((ry) => { for (let k = 0; k < n; k += 1) { const [px, pz] = at(ry, (k / (n - 1) - 0.5) * (W - 0.3), W / 2 - 0.14); dk.push({ p: [px, y + H / 2, pz], s: [0.2, H, 0.2] }); } });
        dk.push({ p: [0, y + 0.1, 0], s: [W + 0.1, 0.2, W + 0.1] });
      } else {
        els.push(<Box key={`w${i}`} s={[W, H, W]} p={[0, y + H / 2, 0]} m={woodWall && i > 0 ? M.plain('#7a5236', { roughness: 0.9 }) : M.mat('brick', W / 1.5, H / 0.75, { color: brick })} />);
      }
      dk.push({ p: [0, y + H - 0.07, 0], s: [W + 0.1, 0.14, W + 0.1] });
      dk.push({ p: [0, yr - 0.03, 0], s: [RW - 0.12, 0.06, RW - 0.12] });
      fringe(RW, RW, yr - 0.1).forEach((f) => fr.push(f));
      const n = Math.max(2, Math.round(W / 0.75));
      SIDES.forEach((ry) => { for (let k = 0; k < n; k += 1) { const [px, pz] = at(ry, ((k + 0.5) / n - 0.5) * W * 0.86, W / 2 + 0.2); st.push({ p: [px, y + H - 0.3, pz], r: [0.6, ry, 0], s: [0.07, 0.55, 0.07] }); } });
      if (i >= 1 || (i === 0 && !door && !open)) {
        const nw = W > 2.3 ? 2 : 1; const ww = Math.min(dw || 0.7, W * 0.28); const hh = H * 0.62;
        SIDES.forEach((ry) => { for (let k = 0; k < nw; k += 1) winAt(wi, wf, ry, nw === 1 ? 0 : ((k + 0.5) / nw - 0.5) * W * 0.62, y + H * 0.48, W / 2, ww, hh); });
      } else if (i === 0 && !open) {
        [1, 2, 3].forEach((s) => winAt(wi, wf, SIDES[s], 0, y + H * 0.55, W / 2, 0.55, H * 0.5));
        if (W > 2.4) [-1, 1].forEach((k) => winAt(wi, wf, 0, k * W * 0.3, y + H * 0.55, W / 2, 0.55, H * 0.5));
      }
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz]) => bl.push({ p: [sx * RW / 2 * 0.97, yr - 0.2, sz * RW / 2 * 0.97], r: [Math.PI, 0, 0], s: [0.1, 0.2, 0.1] }));
      els.push(<Roof key={`r${i}`} w={RW} d={RW} h={RH} y={yr} m={roofM} fascia={false} />);
      top = yr + RH;
      y = yr + RH * Math.pow(Math.max(0, 1 - (W * taper) / RW), 1.5) - 0.05;
      W *= taper;
    }
    const W0 = w;
    return (
      <group position={p} rotation={[0, r, 0]}>
        {els}
        {door && !open && <Doorway p={[0, 0, W0 / 2 + 0.01]} w={Math.min(0.9, W0 * 0.26)} h={Math.min(1.4, wh[0] * 0.78)} gold={doorGold} arch={doorGold} />}
        <Inst geo={g.box} m={M.plain(TIMBER, { roughness: 0.85 })} items={dk} />
        <Inst geo={g.box} m={M.plain(edge, { roughness: 0.7 })} items={fr} />
        <Inst geo={g.box} m={M.plain('#6a4228', { roughness: 0.8 })} items={st} />
        <Inst geo={g.cone} m={M.gold} items={bl} />
        <Windows win={wi} fr={wf} />
        <Gajur y={top - 0.02} s={fin * w / 3.1} />
      </group>
    );
  }

  /** Concentric steps (Maju Dega has nine). */
  function Steps({ p = [0, 0, 0], n = 9, w0 = 9, dw = 0.6, h = 0.32, tint = '#e0a186' }) {
    const M = useM();
    return (
      <group position={p}>
        {Array.from({ length: n }, (_, i) => {
          const ww = w0 - dw * i;
          return <Box key={i} s={[ww, h, ww]} p={[0, h * i + h / 2, 0]} m={M.mat('brick', ww / 1.6, 0.5, { color: tint })} />;
        })}
      </group>
    );
  }

  /* ---------- Hanuman Dhoka palace: long red-brick wings, three storeys, two tiled pent-roof levels on struts ---------- */
  function Wing({ p = [0, 0, 0], w, d, st = 3, sh = 1.95, roofH = 1.3, space = 2.1, skip = () => false, ww = 1.0, tint = WING }) {
    const M = useM();
    const H = st * sh;
    const win = [], fr = [], bands = [], struts = [];
    for (let s = 0; s < st; s += 1) {
      const n = Math.max(1, Math.floor((w - 1) / space));
      for (let k = 0; k < n; k += 1) {
        const x = (k - (n - 1) / 2) * space;
        if (skip(x, s)) continue;
        const ws = s === 0 ? 0.62 : ww, hs = s === 0 ? 0.75 : sh * 0.58;
        winAt(win, fr, 0, x, s * sh + sh * (s === 0 ? 0.6 : 0.52) + 0.1, d / 2, ws, hs);
      }
      if (s) bands.push({ p: [0, s * sh, 0], s: [w + 0.05, 0.12, d + 0.05] });
    }
    const ns = Math.floor(w / 1.1);
    [sh, H].forEach((yy) => { for (let k = 0; k < ns; k += 1) struts.push({ p: [(k + 0.5 - ns / 2) * (w / ns), yy - 0.3, d / 2 + 0.32], r: [0.62, 0, 0], s: [0.08, 0.7, 0.08] }); });
    return (
      <group position={p}>
        <Box s={[w + 0.2, 0.3, d + 0.2]} p={[0, 0.15, 0]} m={M.mat('granite', 3, 1, { color: '#cfc4b0' })} />
        <Box s={[w, H, d]} p={[0, H / 2, 0]} m={M.mat('brick', w / 2.2, H / 1.1, { color: tint })} />
        <Roof w={w + 1.6} d={d + 1.6} h={0.5} y={sh + 0.05} m={M.mat('roof', 4, 2, { color: TILE })} sag={1.1} fascia={false} />
        <Roof w={w + 1.6} d={d + 1.6} h={roofH} y={H} m={M.mat('roof', 4, 2, { color: TILE })} sag={1.3} lift={0.12} fascia={false} />
        <Inst geo={g.box} m={M.plain(RED)} items={[{ p: [0, sh + 0.02, (d + 1.6) / 2], s: [w + 1.6, 0.14, 0.08] }, { p: [0, H - 0.02, (d + 1.6) / 2], s: [w + 1.6, 0.14, 0.08] }]} />
        <Inst geo={g.box} m={M.plain(TIMBER)} items={bands} />
        <Inst geo={g.box} m={M.plain('#6a4228')} items={struts} />
        <Windows win={win} fr={fr} />
      </group>
    );
  }

  function HanumanGate() {
    const M = useM();
    const orange = M.plain('#e0662a', { roughness: 0.9 });
    return (
      <group position={[0, 0, -10.95]}>
        <Box s={[4.2, 4.4, 0.16]} p={[0, 2.2, -0.02]} m={M.plain('#6a3a20')} />
        <Doorway p={[0, 0.3, 0.1]} w={3.2} h={3.6} />
        <Box s={[3.4, 3.8, 0.12]} p={[0, 2.0, 0.06]} m={M.plain('#3a2214', { roughness: 0.85 })} />
        <Box s={[3.4, 0.2, 0.3]} p={[0, 0.1, 0.4]} m={M.stone} />
        <Box s={[3.9, 0.3, 0.3]} p={[0, 4.05, 0.14]} m={M.plain(TIMBER)} />
        <Box s={[4.2, 0.14, 0.34]} p={[0, 4.3, 0.14]} m={M.plain(RED)} />
        <Box s={[0.28, 4.1, 0.3]} p={[-1.85, 2.3, 0.14]} m={M.plain(TIMBER)} />
        <Box s={[0.28, 4.1, 0.3]} p={[1.85, 2.3, 0.14]} m={M.plain(TIMBER)} />
        <mesh position={[0, 3.75, 0.2]} material={M.gold}><torusGeometry args={[1.65, 0.035, 6, 22, Math.PI]} /></mesh>
        <mesh position={[0, 5.45, 0.2]} material={M.gold}><coneGeometry args={[0.16, 0.5, 8]} /></mesh>
        <TripleWindow p={[0, 5.5, 0.06]} w={3.6} h={1.4} />
        {[-2.7, 2.7].map((x) => (
          <group key={x} position={[x, 0, 1.0]}>
            <Box s={[0.9, 0.7, 0.9]} p={[0, 0.35, 0]} m={M.stone} />
            <group position={[0, 0.7, 0]} scale={2.0}><Lion m={M.stone} /></group>
          </group>
        ))}
        {/* Hanuman: stone figure wrapped in orange-red cloth, under a small red parasol, at the left of the gate */}
        <group position={[-4.3, 0, 1.3]} scale={1.4}>
          <Box s={[1.1, 0.7, 0.9]} p={[0, 0.35, 0]} m={M.stone} />
          <Box s={[0.7, 0.95, 0.5]} p={[0, 1.2, 0]} m={orange} />
          <Ball rad={0.27} p={[0, 1.9, 0.03]} m={M.plain('#c8341c')} />
          <Cyl rt={0.03} h={1.5} p={[0.45, 1.75, 0]} m={M.dark} seg={6} />
          <mesh position={[0.45, 2.55, 0]} material={M.plain('#c01818', { roughness: 0.8 })} castShadow><coneGeometry args={[0.8, 0.34, 14]} /></mesh>
        </group>
      </group>
    );
  }

  /* ---------- Basantapur (Nautale) tower: nine storeys of brick with projecting bay windows, plastered top ---------- */
  function Tower({ p }) {
    const M = useM();
    const win = [], fr = [], bands = [], bays = [];
    const SH = 1.12;
    const secs = [{ w: 4.0, y: 0.3, n: 3 }, { w: 3.4, y: 0.3 + 3 * SH + 0.3, n: 4 }, { w: 2.9, y: 0.3 + 7 * SH + 0.6, n: 2 }];
    const els = [];
    secs.forEach((s, i) => {
      const H = s.n * SH;
      els.push(<Box key={`b${i}`} s={[s.w, H, s.w]} p={[0, s.y + H / 2, 0]} m={i === 2 ? M.plain('#e6dcc4', { roughness: 0.9 }) : M.mat('brick', s.w / 1.5, H / 1.0, { color: i ? '#d27a52' : '#c96d46' })} />);
      for (let k = 0; k < s.n; k += 1) {
        const yc = s.y + k * SH + 0.58;
        SIDES.forEach((ry) => [-1, 1].forEach((q) => winAt(win, fr, ry, q * s.w * 0.27, yc, s.w / 2, 0.52, 0.66)));
        if (k) bands.push({ p: [0, s.y + k * SH, 0], s: [s.w + 0.05, 0.1, s.w + 0.05] });
      }
      const yb = s.y + SH + 0.58;
      SIDES.forEach((ry) => { const [bx, bz] = at(ry, 0, s.w / 2 + 0.26); bays.push({ p: [bx, yb, bz], r: [0, ry, 0], s: [1.0, 0.85, 0.5] }); winAt(win, fr, ry, 0, yb, s.w / 2 + 0.52, 0.75, 0.6); });
      els.push(<Roof key={`e${i}`} w={s.w + 1.4} d={s.w + 1.4} h={i === 2 ? 0.8 : 0.45} y={s.y + H - 0.03} m={M.mat('roof', 3, 3, { color: TILE })} sag={i === 2 ? 1.3 : 1.15} fascia={false} />);
    });
    const top = secs[2].y + 2 * SH + 0.6;
    return (
      <group position={p}>
        <Box s={[4.4, 0.3, 4.4]} p={[0, 0.15, 0]} m={M.mat('granite', 3, 1, { color: '#cfc4b0' })} />
        {els}
        <Inst geo={g.box} m={M.plain(TIMBER)} items={bands} />
        <Inst geo={g.box} m={M.plain('#6a3a20')} items={bays} />
        <Windows win={win} fr={fr} />
        <Box s={[1.5, 0.9, 1.5]} p={[0, top + 0.45, 0]} m={M.plain('#e6dcc4', { roughness: 0.9 })} />
        <Roof w={2.7} d={2.7} h={0.8} y={top + 0.85} m={M.mat('roof', 2, 2, { color: TILE })} sag={1.3} fascia={false} />
        <Gajur y={top + 1.6} s={0.6} />
      </group>
    );
  }

  /* ---------- white neoclassical Gaddi Baithak ---------- */
  const pedGeo = (() => { const s = new THREE.Shape(); s.moveTo(-1, 0); s.lineTo(1, 0); s.lineTo(0, 0.45); s.closePath(); return new THREE.ExtrudeGeometry(s, { depth: 0.5, bevelEnabled: false }); })();
  function GaddiBaithak({ p }) {
    const M = useM();
    const wh = M.plain('#f6f2e8', { roughness: 0.8 });
    const win = [], fr = [], col = [];
    const W = 8.4, D = 3.6, H = 4.0;
    for (let s = 0; s < 3; s += 1) for (let k = 0; k < 6; k += 1) {
      const x = (k - 2.5) * 1.28; if (s * 1.65 + 1.0 > H - 0.7) continue;
      if (Math.abs(x) < 1.7 && s < 2) continue;
      win.push({ p: [x, s * 1.65 + 1.0, D / 2 + 0.03], s: [0.55, 0.95, 1], c: null });
      fr.push({ p: [x, s * 1.65 + 1.0, D / 2 + 0.0], s: [0.7, 1.1, 0.07] });
    }
    for (let k = 0; k < 6; k += 1) col.push({ p: [(k - 2.5) * 0.72, 1.6, D / 2 + 1.05], s: [0.34, 3.2, 0.34] });
    return (
      <group position={p}>
        <Box s={[W + 0.3, 0.3, D + 0.3]} p={[0, 0.15, 0]} m={M.mat('granite', 3, 1, { color: '#d8d0c0' })} />
        <Box s={[W, H, D]} p={[0, H / 2, 0]} m={wh} />
        <Box s={[W + 0.2, 0.18, D + 0.2]} p={[0, 1.7, 0]} m={wh} />
        <Box s={[W + 0.2, 0.18, D + 0.2]} p={[0, 3.35, 0]} m={wh} />
        <Box s={[W + 0.3, 0.25, D + 0.3]} p={[0, H + 0.1, 0]} m={wh} />
        {Array.from({ length: 14 }, (_, k) => <Box key={k} s={[0.14, 0.4, 0.14]} p={[-W / 2 + 0.2 + k * (W - 0.4) / 13, H + 0.4, D / 2 + 0.1]} m={wh} />)}
        <Roof w={W - 0.4} d={D - 0.2} h={0.7} y={H + 0.22} m={M.plain('#6d7d74', { roughness: 0.8 })} sag={1.2} fascia={false} />
        <Box s={[3.9, 0.22, 1.8]} p={[0, 3.3, D / 2 + 0.95]} m={wh} />
        <Box s={[3.9, 0.35, 1.8]} p={[0, 0.3, D / 2 + 0.95]} m={wh} />
        <mesh geometry={pedGeo} position={[0, 3.4, D / 2 + 0.1]} scale={[2.0, 1, 1.8]} material={wh} castShadow />
        <Inst geo={g.cyl} m={wh} items={col} shadow />
        <Windows win={win} fr={fr} />
      </group>
    );
  }

  /* ---------- Kumari Ghar: three-storey brick courtyard house, carved dark timber windows ---------- */
  function KumariGhar({ p, r = 0 }) {
    const M = useM();
    const win = [], fr = [];
    const W = 6.6, H = 5.2, sh = 1.7;
    SIDES.forEach((ry, si) => {
      const on = si === 0 || si === 3;
      for (let s = 0; s < 3; s += 1) {
        for (let k = 0; k < 3; k += 1) {
          if (si === 0 && s === 0 && k === 1) continue;
          if (s === 1 && k === 1) continue;
          const wd = s === 2 ? 0.75 : 1.1, hd = s === 2 ? 0.85 : 1.2;
          const a = (k - 1) * 1.9;
          winAt(win, fr, ry, a, s * sh + 1.1 + (s === 0 ? 0.25 : 0), W / 2, on ? wd : wd * 0.85, on ? hd : hd * 0.85);
        }
      }
    });
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[W + 0.3, 0.35, W + 0.3]} p={[0, 0.17, 0]} m={M.mat('granite', 3, 1, { color: '#cfc4b0' })} />
        <Box s={[W, H, W]} p={[0, H / 2, 0]} m={M.mat('brick', W / 1.6, H / 1.0, { color: '#cc6e4a' })} />
        {[1, 2].map((s) => <Box key={s} s={[W + 0.06, 0.14, W + 0.06]} p={[0, s * sh, 0]} m={M.plain(TIMBER)} />)}
        <Roof w={W + 2.4} d={W + 2.4} h={1.25} y={H} m={M.mat('roof', 3, 3, { color: TILE })} sag={1.3} lift={0.14} fascia={false} />
        <Roof w={W + 2.0} d={W + 2.0} h={0.4} y={sh * 2 + 0.05} m={M.mat('roof', 3, 3, { color: TILE })} sag={1.1} fascia={false} />
        {SIDES.map((ry, i) => { const [bx, bz] = at(ry, 0, W / 2 + 0.03); return <Box key={`bd${i}`} s={[W * 0.9, 1.5, 0.1]} p={[bx, sh + 1.15, bz]} r={[0, ry, 0]} m={M.plain('#4a2c18', { roughness: 0.85 })} />; })}
        <TripleWindow p={[0, sh + 1.15, W / 2 + 0.08]} w={3.6} h={1.3} />
        <TripleWindow p={[0, sh + 1.15, -W / 2 - 0.08]} r={Math.PI} w={3.6} h={1.3} />
        <Doorway p={[0, 0.3, W / 2 + 0.03]} w={1.0} h={1.5} />
        <TripleWindow p={[-W / 2 - 0.08, sh + 1.15, 0]} r={-Math.PI / 2} w={3.6} h={1.3} />
        <TripleWindow p={[W / 2 + 0.08, sh + 1.15, 0]} r={Math.PI / 2} w={3.6} h={1.3} />
        <Windows win={win} fr={fr} />
      </group>
    );
  }

  /* ---------- Shiva-Parvati (Navayogini): long low two-roof temple on a three-step plinth, long face toward +z ---------- */
  function ShivaParvati({ p, r = 0 }) {
    const M = useM();
    const wi = [], wf = [];
    winAt(wi, wf, 0, -1.7, 1.25, 1.0, 0.65, 0.75); winAt(wi, wf, 0, 1.7, 1.25, 1.0, 0.65, 0.75);
    winAt(wi, wf, 0, -0.55, 3.0, 0.65, 0.8, 0.8); winAt(wi, wf, 0, 0.55, 3.0, 0.65, 0.8, 0.8);
    [-1.9, 1.9].forEach((x) => winAt(wi, wf, 0, x, 3.0, 0.65, 0.6, 0.65));
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Steps n={3} w0={7.4} dw={0.4} h={0.22} tint={SAND} />
        <Box s={[5.2, 1.6, 2.0]} p={[0, 0.66 + 0.8, 0]} m={M.mat('brick', 3.4, 2, { color: BRICK })} />
        <Box s={[5.3, 0.14, 2.1]} p={[0, 2.18, 0]} m={M.plain(TIMBER)} />
        <Roof w={7.6} d={4.0} h={1.0} y={2.2} m={M.mat('roof', 4, 2, { color: TILE })} sag={1.3} fascia={false} />
        <Inst geo={g.box} m={M.plain(RED)} items={fringe(7.6, 4.0, 2.1)} />
        <Box s={[3.6, 1.1, 1.3]} p={[0, 2.2 + 0.55 + 0.25, 0]} m={M.mat('brick', 2.4, 1, { color: BRICK })} />
        <Roof w={5.6} d={3.1} h={0.85} y={3.45} m={M.mat('roof', 3, 2, { color: TILE })} sag={1.3} fascia={false} />
        <Inst geo={g.box} m={M.plain(RED)} items={fringe(5.6, 3.1, 3.35)} />
        <Doorway p={[0, 0.66, 1.01]} w={0.7} h={1.05} />
        {[-0.55, 0.55].map((x) => <Ball key={x} rad={0.13} p={[x, 3.12, 0.7]} m={M.plain(x < 0 ? '#c9b49a' : '#d9a08a')} />)}
        <Windows win={wi} fr={wf} />
        <Gajur y={4.25} s={0.5} />
      </group>
    );
  }

  /* Pratap Malla's pillar: tall sandstone shaft with stepped capital, gilded king under a cobra hood and umbrella. */
  function Pillar({ p }) {
    const M = useM();
    const sand = M.plain('#cdbd9c', { roughness: 0.9 });
    return (
      <group position={p}>
        <Steps n={3} w0={2.5} dw={0.42} h={0.26} tint={SAND} />
        <Cyl rt={0.32} rb={0.45} h={9.2} p={[0, 0.78 + 4.6, 0]} m={sand} seg={14} />
        <Cyl rt={0.5} rb={0.34} h={0.35} p={[0, 10.15, 0]} m={sand} seg={14} />
        <Cyl rt={0.62} rb={0.5} h={0.3} p={[0, 10.45, 0]} m={sand} seg={14} />
        <Cyl rt={0.7} h={0.14} p={[0, 10.7, 0]} m={M.gold} seg={14} />
        <group position={[0, 10.74, 0]} scale={3.3}>
          <Box s={[0.34, 0.2, 0.3]} p={[0, 0.1, 0]} m={M.gold} />
          <Box s={[0.26, 0.34, 0.2]} p={[0, 0.4, 0]} m={M.gold} />
          <Ball rad={0.1} p={[0, 0.66, 0.02]} m={M.gold} />
          <Ball rad={0.2} p={[0, 0.62, -0.2]} sc={[1, 1.5, 0.3]} m={M.gold} />
          <Ball rad={0.07} p={[0, 0.98, -0.18]} sc={[1, 0.8, 1.2]} m={M.gold} />
          <Cyl rt={0.02} h={0.5} p={[0, 0.8, 0.0]} m={M.gold} seg={6} />
          <mesh position={[0, 1.08, 0]} material={M.gold} castShadow><coneGeometry args={[0.3, 0.12, 16]} /></mesh>
          <mesh position={[0, 1.18, 0]} material={M.gold}><coneGeometry args={[0.03, 0.2, 8]} /></mesh>
        </group>
      </group>
    );
  }

  /* Jagannath: long two-tier temple, very broad low roofs on a tall six-step plinth, wide open carved ground floor. */
  function RSteps({ n, w0, d0, dw, h, tint }) {
    const M = useM();
    return <group>{Array.from({ length: n }, (_, i) => <Box key={i} s={[w0 - dw * i, h, d0 - dw * i]} p={[0, h * i + h / 2, 0]} m={M.mat('brick', (w0 - dw * i) / 1.6, 0.5, { color: tint })} />)}</group>;
  }
  function Jagannath({ p }) {
    const M = useM();
    const W = 5.6, D = 3.6, H1 = 2.3, H2 = 1.7, Y0 = 6 * 0.32;
    const wi = [], wf = [], st = [], cols = [];
    for (let k = 0; k < 7; k += 1) cols.push({ p: [(k - 3) * 0.85, Y0 + H1 / 2, D / 2 + 0.02], s: [0.22, H1 - 0.1, 0.22] });
    [-1.5, -0.5, 0.5, 1.5].forEach((x) => winAt(wi, wf, 0, x, Y0 + H1 + 0.8 + H2 * 0.5, D * 0.31, 0.62, 0.9));
    for (let k = 0; k < 12; k += 1) st.push({ p: [(k - 5.5) * 0.5, Y0 + H1 - 0.3, D / 2 + 0.3], r: [0.6, 0, 0], s: [0.08, 0.6, 0.08] });
    return (
      <group position={p}>
        <RSteps n={6} w0={7.0} d0={5.0} dw={0.32} h={0.32} tint="#e0a186" />
        <Box s={[W, H1, D]} p={[0, Y0 + H1 / 2, 0]} m={M.mat('brick', 3.6, 1.6, { color: '#c8693f' })} />
        <Box s={[W - 0.4, H1 * 0.82, 0.12]} p={[0, Y0 + H1 * 0.47, D / 2 + 0.02]} m={M.plain('#2f1a0e', { roughness: 0.9 })} />
        <Inst geo={g.box} m={M.plain('#7a4a2a')} items={cols} />
        <Box s={[W + 0.05, 0.14, D + 0.05]} p={[0, Y0 + H1 - 0.05, 0]} m={M.plain(TIMBER)} />
        <Roof w={W + 3.2} d={D + 3.0} h={1.05} y={Y0 + H1 - 0.04} m={M.mat('roof', 4, 3, { color: '#8f4a32' })} sag={1.4} fascia={false} />
        <Inst geo={g.box} m={M.plain(RED)} items={fringe(W + 3.2, D + 3.0, Y0 + H1 - 0.1)} />
        <Inst geo={g.box} m={M.plain('#6a4228')} items={st} />
        <Box s={[W * 0.62, H2, D * 0.62]} p={[0, Y0 + H1 + 0.8 + H2 / 2 - 0.1, 0]} m={M.mat('brick', 2.4, 1.2, { color: '#c8693f' })} />
        <Roof w={W * 0.62 + 2.2} d={D * 0.62 + 2.2} h={1.1} y={Y0 + H1 + 0.8 + H2 - 0.14} m={M.mat('roof', 3, 3, { color: '#8f4a32' })} sag={1.4} fascia={false} />
        <Inst geo={g.box} m={M.plain(RED)} items={fringe(W * 0.62 + 2.2, D * 0.62 + 2.2, Y0 + H1 + 0.8 + H2 - 0.2)} />
        <Windows win={wi} fr={wf} />
        <Gajur y={Y0 + H1 + 0.8 + H2 + 0.9} s={0.9} />
      </group>
    );
  }

  function KalBhairav({ p }) {
    const M = useM();
    const KS = 1.7;
    const win = [{ p: [0, 1.0, 0.74], s: [1.5, 1.25, 1] }];
    const fr = [{ p: [0, 1.0, 0.7], s: [1.6, 1.35, 0.06] }];
    const blk = M.plain('#16120f', { roughness: 0.45 });
    return (
      <group position={p} scale={KS}>
        <Box s={[2.2, 0.3, 1.5]} p={[0, 0.15, 0]} m={M.stone} />
        <Box s={[2.1, 2.2, 0.16]} p={[0, 1.4, -0.45]} m={M.plain('#f4f0e6', { roughness: 0.9 })} />
        <Box s={[0.7, 1.1, 0.3]} p={[0, 0.9, -0.1]} m={blk} />
        <Ball rad={0.26} p={[0, 1.6, -0.08]} m={blk} />
        <Box s={[0.18, 0.5, 0.14]} p={[-0.5, 1.05, -0.08]} r={[0, 0, 0.4]} m={blk} />
        <Box s={[0.18, 0.5, 0.14]} p={[0.5, 1.05, -0.08]} r={[0, 0, -0.4]} m={blk} />
        <mesh position={[0, 1.4, -0.3]} material={M.gold}><torusGeometry args={[0.6, 0.04, 6, 18, Math.PI]} /></mesh>
        {[-0.95, 0.95].map((x) => <Box key={x} s={[0.1, 1.7, 0.1]} p={[x, 1.15, 0.72]} m={M.plain(RED)} />)}
        <Box s={[2.1, 0.1, 0.12]} p={[0, 2.02, 0.72]} m={M.plain(RED)} />
        <Box s={[1.8, 1.4, 0.08]} p={[0, 1.0, 0.68]} m={M.plain('#4a2c18', { roughness: 0.85 })} />
        <Windows win={win} fr={fr} />
      </group>
    );
  }

  function WhiteShrine({ p }) {
    const M = useM();
    const wh = M.plain('#efeae0', { roughness: 0.85 });
    return (
      <group position={p}>
        <Box s={[1.5, 0.35, 1.5]} p={[0, 0.17, 0]} m={wh} />
        <Box s={[1.0, 0.9, 1.0]} p={[0, 0.8, 0]} m={wh} />
        <Spire r0={0.62} h={1.7} y={1.25} m={wh} />
        <mesh position={[0, 3.05, 0]} material={M.gold}><coneGeometry args={[0.07, 0.3, 8]} /></mesh>
      </group>
    );
  }

  /* ---------- the main scene ---------- */
  function Main() {
    const M = useM();
    return (
      <group>
        {/* palace facade along the back */}
        <Wing p={[-15, 0, -13.3]} w={22} d={4.2} st={3} sh={2.0} roofH={1.3} />
        <Wing p={[0, 0, -13.5]} w={6.4} d={5} st={3} sh={2.2} roofH={1.9} space={2.6} skip={(x, s) => s < 2} />
        <Wing p={[7.8, 0, -13.2]} w={8.6} d={4.6} st={3} sh={2.1} roofH={1.1} />
        <HanumanGate />
        <KalBhairav p={[5.6, 0, -9.6]} />
        <group position={[15, 0, -9]}><GaddiBaithak p={[0, 0, 0]} /></group>
        <Tower p={[21.5, 0, -14.5]} />

        {/* Taleju: gilded three-tier pagoda on twelve steps, rising clearly above the palace roofline */}
        <group position={[-2, 0, -19]}>
          <Steps n={12} w0={9} dw={0.45} h={0.28} tint={SAND} />
          <Pagoda p={[0, 3.36, 0]} w={3.8} tiers={3} wh={[3.2, 2.6, 2.2]} ov={1.0} rise={0.24} gold doorGold fin={1.3} brick="#a8412a" />
        </group>

        {/* Jagannath: broad two-tier temple on a six-step plinth, Pratap Malla's pillar on its axis before it */}
        <Jagannath p={[-7, 0, -5]} />
        <Pillar p={[-7, 0, 0.8]} />

        {/* Kageshwar (two tiers, dark roofs) and Indrapur (three narrow tiers) at the palace's north end */}
        <group position={[-18, 0, -10.2]}>
          <Steps n={2} w0={3.8} dw={0.4} h={0.28} tint={SAND} />
          <Pagoda p={[0, 0.56, 0]} w={2.3} tiers={2} wh={[1.7, 1.2]} ov={0.8} rise={0.3} taper={0.6} tile="#6a4034" brick="#d98c62" edge="#9c2a1c" />
        </group>
        <group position={[-13, 0, -10.2]}>
          <Steps n={2} w0={3.0} dw={0.4} h={0.26} tint={SAND} />
          <Pagoda p={[0, 0.52, 0]} w={1.5} tiers={3} wh={[1.3, 1.0, 0.9]} ov={0.55} rise={0.34} taper={0.72} tile="#8a5a3c" brick="#b8553a" />
        </group>

        {/* Maju Dega: the tallest, broadest-roofed pagoda on its nine-step pale-brick pyramid */}
        <group position={[-16, 0, -1]}>
          <Steps n={9} w0={11} dw={0.7} h={0.42} tint="#d9876a" />
          <Box s={[2.4, 0.16, 4.8]} p={[0, 1.9, 4.15]} r={[0.93, 0, 0]} m={M.mat('brick', 1.2, 2.4, { color: '#e8ad90' })} />
          <Pagoda p={[0, 3.78, 0]} w={4.4} tiers={3} wh={[2.9, 2.0, 1.8]} ov={1.4} rise={0.27} taper={0.66} fin={1.4} tile="#7d3e2b" />
        </group>

        {/* Trailokya Mohan (Narayan): taller, narrower three-tier on a three-step plinth, Garuda before it */}
        <group position={[-8, 0, 6.5]}>
          <Steps n={3} w0={5.2} dw={0.5} h={0.3} tint={SAND} />
          <Pagoda p={[0, 0.9, 0]} w={2.7} tiers={3} wh={[2.4, 1.7, 1.4]} ov={0.7} rise={0.3} taper={0.72} tile="#a45a3c" brick="#b9552f" edge="#d03a22" />
        </group>
        <group position={[-8, 0, 11.2]}>
          <Box s={[0.8, 0.8, 0.8]} p={[0, 0.4, 0]} m={M.stone} />
          <group position={[0, 0.8, 0]} rotation={[0, Math.PI * 0.8, 0]} scale={1.5}><Garuda m={M.plain('#3a3633', { roughness: 0.6 })} /></group>
        </group>
        <WhiteShrine p={[-12.4, 0, 6.4]} />

        <ShivaParvati p={[-15, 0, 10]} />

        {/* south-west corner, pushed to the edge of the view: Kasthamandap and Kumari Ghar */}
        <group position={[-29, 0, 9]}>
          <Steps n={2} w0={7.2} dw={0.5} h={0.25} tint={SAND} />
          <Pagoda p={[0, 0.5, 0]} w={6} tiers={3} wh={[1.7, 1.1, 1.0]} ov={1.2} rise={0.2} taper={0.9} brick="#b85c3a" tile="#7d4430" fin={0.6} door={false} />
          <Box s={[2.4, 1.45, 0.1]} p={[0, 1.22, 3.05]} m={M.plain('#2c180c', { roughness: 0.9 })} />
          {[-1.0, 0, 1.0].map((x) => <Box key={x} s={[0.2, 1.45, 0.2]} p={[x * 1.1, 1.22, 3.12]} m={M.plain('#6a3a20')} />)}
        </group>
        <KumariGhar p={[-24, 0, 20]} r={Math.PI} />

        <Frame s={[35, 12, 20]} p={[-3, 6, -3]} />
      </group>
    );
  }

  /* ---------- surroundings ---------- */
  function Houses({ list }) {
    const M = useM();
    const win = [], fr = [];
    const tints = ['#e0956f', '#d48a68', '#c97f5e', '#dba07c', '#bf7a58'];
    const plas = ['#e6d4b8', '#d8c8ac'];
    const out = list.map((h, i) => {
      const sh = 0.95, H = h.st * sh;
      for (let s = 1; s < h.st; s += 1) {
        const n = Math.max(1, Math.floor(h.w / 1.35));
        for (let k = 0; k < n; k += 1) {
          const a = (k - (n - 1) / 2) * 1.2;
          winAt(win, fr, h.ry, a, s * sh + 0.5, h.d / 2, 0.5, 0.6);
          winAt(win, fr, h.ry + Math.PI, a, s * sh + 0.5, h.d / 2, 0.5, 0.6);
        }
      }
      const wall = h.kind === 0 ? M.mat('brick', h.w / 1.5, h.st, { color: tints[i % tints.length] }) : M.plain(plas[i % plas.length], { roughness: 0.9 });
      return (
        <group key={i} position={[h.x, 0, h.z]} rotation={[0, h.ry, 0]}>
          <Box s={[h.w, H, h.d]} p={[0, H / 2, 0]} m={wall} cast={false} />
          <Roof w={h.w + 0.4} d={h.d + 0.4} h={0.55} y={H} m={M.mat('roof', 3, 3, { color: TILE })} sag={1.2} lift={0.1} fascia={false} />
        </group>
      );
    });
    return <group>{out}<Windows win={win} fr={fr} /></group>;
  }

  function makeHouses() {
    const r = rng(21);
    const L = [];
    let n = 0;
    const row = (ax, c, from, to, ry, stMin, stMax) => {
      let t = from;
      while (t < to) {
        const w = 2.6 + r() * 1.4;
        const st = stMin + Math.floor(r() * (stMax - stMin + 1));
        const kind = n % 5 === 4 ? 1 : 0;
        L.push({ x: ax === 'z' ? c + (r() - 0.5) * 0.5 : t + w / 2, z: ax === 'z' ? t + w / 2 : c + (r() - 0.5) * 0.5, w, d: 3.4 + r() * 0.8, ry, st, kind });
        n += 1; t += w + 0.1;
      }
    };
    row('x', -32, -50, 50, 0, 4, 6);                 // north: rooftops behind the palace
    row('z', -38, -30, 24, Math.PI / 2, 3, 5);       // west flank
    row('z', 36, -30, 20, -Math.PI / 2, 3, 5);       // east flank, behind the tower
    row('z', -46, -40, 30, Math.PI / 2, 4, 6);
    row('z', 44, -40, 20, -Math.PI / 2, 4, 6);
    return L;
  }

  function Peepal({ p, s = 1 }) {
    const M = useM();
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.18} rb={0.3} h={2.2} p={[0, 1.1, 0]} m={M.plain('#5a4430', { roughness: 1 })} seg={7} />
        <Ball rad={1.5} p={[0, 3.0, 0]} sc={[1.15, 0.85, 1.15]} m={M.plain('#3f6a3a', { roughness: 1 })} />
        <Ball rad={1.1} p={[0.9, 3.7, 0.3]} m={M.plain('#35603a', { roughness: 1 })} />
        <Ball rad={1.0} p={[-0.8, 3.5, -0.4]} m={M.plain('#47743f', { roughness: 1 })} />
      </group>
    );
  }

  function Env() {
    const M = useM();
    const houses = useMemo(makeHouses, []);
    const crowd = useMemo(() => {
      const r = rng(5), cols = ['#b3202a', '#2f6db5', '#e0a030', '#f2efe6', '#2e8b57', '#7a3b6e', '#c9622b'];
      const L = [];
      [[-2, 2], [-1.5, 10], [3, -5.5], [4, 5], [9, 1], [8, 12], [-3.5, 15], [-2.4, -3.8], [1.5, -7.2], [-10, 12]].forEach(([cx, cz]) => {
        for (let k = 0; k < 5; k += 1) L.push({ p: [cx + (r() - 0.5) * 2.6, 0.2, cz + (r() - 0.5) * 2.6], s: [0.36, 0.36, 0.36], c: cols[Math.floor(r() * cols.length)] });
      });
      return L;
    }, []);
    const pigeons = useMemo(() => {
      const r = rng(9), L = [];
      for (let k = 0; k < 22; k += 1) {
        const a = r() * Math.PI * 2, d = 2.0 + r() * 2.4;
        L.push({ p: [-7 + Math.cos(a) * d, 0.08, 2.4 + Math.sin(a) * d * 0.8], r: [0, r() * 6, 0], s: [0.14, 0.14, 0.26], c: r() > 0.5 ? '#6f6c68' : '#b8b4ac' });
      }
      return L;
    }, []);
    const hills = [[-90, -85, 48, 13], [-35, -90, 42, 15], [20, -92, 48, 17], [70, -88, 44, 14], [112, -70, 40, 12], [-118, -50, 38, 12], [-60, -140, 70, 30], [40, -145, 80, 34]];
    const pads = [[-7, -5, 7.4], [-16, -1, 12.4], [-8, 6.5, 6.2], [-15, 10, 9], [-29, 9, 9.2], [-7, 0.8, 4.2], [-24, 20, 8.5]];
    const trees = [[-33, -16, 1.15], [-33, -4, 1.0], [-31, 4, 1.1], [26, -2, 1.1], [27, -20, 1.2], [-26, -20, 1.2], [-9, -27, 1.2], [9, -27, 1.1], [26, 6, 1.0]];
    const lamps = [[-7, 3, 4], [-8, 3, 9], [-15, 3, 2], [-7, 4, -8], [4, 3, -9], [-2, 3, -15], [-15, 3, 12], [12, 3, -6], [-13, 3, -9], [0, 3, 8]];
    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]} receiveShadow material={M.plain('#5f6a52', { roughness: 1 })}><circleGeometry args={[130, 40]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow material={M.plain('#6a665c', { roughness: 1 })}><circleGeometry args={[50, 48]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-5, 0.006, -1]} receiveShadow material={M.plain('#86837a', { roughness: 1 })}><planeGeometry args={[50, 38]} /></mesh>
        {[[-5, 18.6, 50, 1.2], [-30.6, -1, 1.2, 38], [20.6, -1, 1.2, 38]].map(([x, z, w, d], i) => (
          <mesh key={`bd${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.014, z]} receiveShadow material={M.mat('herring', w / 1.5, d / 1.5, { color: '#cf8264' })}><planeGeometry args={[w, d]} /></mesh>
        ))}
        {pads.map(([x, z, s], i) => (
          <mesh key={`pd${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.012, z]} receiveShadow material={M.mat('herring', s / 1.6, s / 1.6, { color: '#d9987e' })}><planeGeometry args={[s, s]} /></mesh>
        ))}
        {[[0, -3, 2.4, 16], [3, 6, 14, 1.6]].map(([x, z, w, d], i) => (
          <mesh key={`pt${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.016, z]} receiveShadow material={M.mat('herring', w / 2, d / 2, { color: '#d9987e' })}><planeGeometry args={[w, d]} /></mesh>
        ))}
        <Houses list={houses} />
        {trees.map(([x, z, s], i) => <Peepal key={i} p={[x, 0, z]} s={s} />)}
        <Inst geo={g.cap} m={M.plain('#ffffff', { roughness: 0.9 })} items={crowd} />
        <Inst geo={g.box} m={M.plain('#ffffff', { roughness: 0.9 })} items={pigeons} />
        {hills.map(([x, z, r, h], i) => (
          <mesh key={i} position={[x, -0.5, z]} scale={[r, h, r * 0.6]} material={M.plain(i % 2 ? '#6b8872' : '#7a9680', { roughness: 1 })}><sphereGeometry args={[1, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
        ))}
        {lamps.map(([x, y, z], i) => <pointLight key={i} position={[x, y, z]} intensity={2.6} distance={18} color="#ffb35a" />)}
      </group>
    );
  }

  return { 'kathmandu-durbar-square': { Main, Env } };
}
