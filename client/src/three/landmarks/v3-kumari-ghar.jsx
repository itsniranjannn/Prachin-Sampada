// Kumari Ghar (1757), Basantapur Durbar Square, Kathmandu: three-storey red-brick Newar bahal round a small courtyard.
// Street front: plain brick wall, tall carved dark doorway with a big toran on a stone stair guarded by two huge white
// lions; three deep carved dark-wood window banks (3 lattice openings, arched tympanum) on the 1st and 2nd floors,
// small windows in the top storey, single modest tile roof. Courtyard: carved pillar arcade, stupa, tree, shoring poles.
// Front = +z. Setting: brick-paved plaza, white Gaddi Baithak, Trailokya Mohan, Basantapur tower, Newar houses.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Frame, GroundDisc, Diyo, THREE, useMemo } = K;

  /* ---------- dimensions ---------- */
  const W = 7.0, D = 6.4;
  const T = 0.8;
  const IW = W - 2 * T, ID = D - 2 * T;
  const RW = (W + IW) / 2, RD = (D + ID) / 2;
  const PLH = 0.3;
  const G0 = PLH, G1 = 2.4, F1 = 3.8, F2 = 5.1, EAVE = 6.2;
  const Y1 = 3.1, Y2 = 4.45, YT = 5.65; // centres of the 1st / 2nd floor window rows
  const WOOD = '#2a1a0e', WOOD_L = '#4e3320', IRON = '#1d1a18';
  const BRICK_TINT = '#f7b896';
  const ROOF_TINT = '#a05c42';
  const NB_TINT = '#b98d78';

  /* ---------- shared caches ---------- */
  const texCache = new Map();
  function carveTex() {
    if (texCache.has('c')) return texCache.get('c');
    const c = document.createElement('canvas'); c.width = 192; c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#2a1a0e'; g.fillRect(0, 0, 192, 128);
    for (let i = 0; i < 3; i++) {
      const x = 8 + i * 59;
      g.fillStyle = '#4e3320'; g.fillRect(x - 3, 10, 52, 112);
      g.fillStyle = '#0c0705'; g.fillRect(x, 16, 46, 76);
      g.strokeStyle = '#5a3c24'; g.lineWidth = 3;
      for (let x2 = x + 11; x2 < x + 46; x2 += 12) { g.beginPath(); g.moveTo(x2, 16); g.lineTo(x2, 92); g.stroke(); }
      g.fillStyle = '#4a2f1b'; g.fillRect(x, 94, 46, 24);
      g.fillStyle = '#5a3c24'; g.fillRect(x + 6, 100, 34, 4); g.fillRect(x + 14, 108, 18, 4);
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    texCache.set('c', t); return t;
  }
  function paneMat(lit) {
    const k = lit ? 'pl' : 'pd';
    if (texCache.has(k)) return texCache.get(k);
    const m = new THREE.MeshStandardMaterial({ map: carveTex(), emissiveMap: carveTex(), emissive: '#ff9a40', emissiveIntensity: lit ? 0.35 : 0.08, roughness: 0.85 });
    texCache.set(k, m); return m;
  }
  function archGeo(hw, hh, depth) {
    const k = `a${hw.toFixed(3)}_${hh.toFixed(3)}_${depth.toFixed(3)}`;
    if (texCache.has(k)) return texCache.get(k);
    const s = new THREE.Shape();
    s.moveTo(-hw, 0);
    for (let i = 0; i <= 18; i++) { const a = Math.PI - (i / 18) * Math.PI; s.lineTo(Math.cos(a) * hw, Math.sin(a) * hh); }
    s.lineTo(-hw, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
    texCache.set(k, g); return g;
  }
  function gableGeo(hw, hh, depth) {
    const k = `g${hw.toFixed(3)}_${hh.toFixed(3)}_${depth.toFixed(3)}`;
    if (texCache.has(k)) return texCache.get(k);
    const s = new THREE.Shape();
    s.moveTo(-hw, 0); s.lineTo(hw, 0); s.lineTo(0, hh); s.lineTo(-hw, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
    texCache.set(k, g); return g;
  }
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  function Arch({ hw, hh, depth, p, m }) {
    const geo = archGeo(hw, hh, depth);
    return <mesh geometry={geo} position={p} material={m} castShadow />;
  }

  /* ---------- carved window bank: 3 lattice openings, projecting dark frame, arched crown ---------- */
  function Bank({ p, r = [0, 0, 0], w = 1.7, h = 0.5, crown = 0.34, lit = false }) {
    const M = useM();
    const dk = M.plain(WOOD, { roughness: 0.85 });
    const lt = M.plain(WOOD_L, { roughness: 0.8 });
    const blk = M.plain('#1a1009', { roughness: 0.7 });
    const pil = 0.07, ow = (w - pil * 4) / 3;
    const xo = [0, 1, 2].map((i) => -w / 2 + pil + ow / 2 + i * (ow + pil));
    const hw = (w + 0.3) / 2;
    return (
      <group position={p} rotation={r}>
        <Box s={[w + 0.22, h + 0.14, 0.18]} p={[0, 0, 0.09]} m={dk} cast={false} />
        {xo.map((x, i) => (
          <group key={i}>
            <Box s={[ow, h, 0.02]} p={[x, 0, 0.19]} m={blk} cast={false} />
            {[-0.2, 0.2].map((f, k) => <Box key={k} s={[0.022, h, 0.03]} p={[x + f * ow, 0, 0.205]} m={lt} cast={false} />)}
          </group>
        ))}
        {[0, 1, 2, 3].map((k) => <Box key={k} s={[pil, h + 0.04, 0.06]} p={[-w / 2 + pil / 2 + k * (ow + pil), 0, 0.2]} m={lt} cast={false} />)}
        <Box s={[w, 0.05, 0.06]} p={[0, h / 2 + 0.01, 0.2]} m={lt} cast={false} />
        <Box s={[w, 0.05, 0.06]} p={[0, -h / 2 - 0.01, 0.2]} m={lt} cast={false} />
        <Box s={[w + 0.34, 0.15, 0.26]} p={[0, -h / 2 - 0.12, 0.13]} m={dk} cast={false} />
        <Box s={[w + 0.2, 0.04, 0.04]} p={[0, -h / 2 - 0.12, 0.27]} m={lt} cast={false} />
        <Box s={[w + 0.34, 0.07, 0.3]} p={[0, h / 2 + 0.1, 0.15]} m={lt} cast={false} />
        <Arch hw={hw} hh={crown} depth={0.2} p={[0, h / 2 + 0.13, 0]} m={dk} />
        <Arch hw={hw * 0.72} hh={crown * 0.72} depth={0.26} p={[0, h / 2 + 0.13, 0]} m={lt} />
        <Arch hw={hw * 0.5} hh={crown * 0.5} depth={0.3} p={[0, h / 2 + 0.13, 0]} m={dk} />
      </group>
    );
  }
  /** Small single gabled window between the banks. */
  function Gabled({ p, r = [0, 0, 0], w = 0.4, h = 0.44 }) {
    const M = useM();
    const dk = M.plain(WOOD, { roughness: 0.85 });
    const lt = M.plain(WOOD_L, { roughness: 0.8 });
    const blk = M.plain('#1a1009', { roughness: 0.7 });
    return (
      <group position={p} rotation={r}>
        <Box s={[w + 0.14, h + 0.12, 0.12]} p={[0, 0, 0.06]} m={dk} cast={false} />
        <Box s={[w, h, 0.02]} p={[0, 0, 0.13]} m={blk} cast={false} />
        {[-0.25, 0.25].map((f, k) => <Box key={k} s={[0.025, h, 0.03]} p={[f * w, 0, 0.145]} m={lt} cast={false} />)}
        <Box s={[w, 0.025, 0.03]} p={[0, 0, 0.145]} m={lt} cast={false} />
        <mesh geometry={gableGeo((w + 0.2) / 2, 0.2, 0.15)} position={[0, h / 2 + 0.06, 0]} material={lt} castShadow />
        <mesh geometry={gableGeo((w + 0.04) / 2, 0.14, 0.19)} position={[0, h / 2 + 0.06, 0]} material={dk} />
        <Box s={[w + 0.24, 0.05, 0.16]} p={[0, -h / 2 - 0.07, 0.08]} m={lt} cast={false} />
      </group>
    );
  }
  /** Cheap textured window used on sides, rear and courtyard. */
  function CWin({ p, r = [0, 0, 0], w = 0.8, h = 0.5, lit = false }) {
    const M = useM();
    const dk = M.plain(WOOD, { roughness: 0.85 });
    const lt = M.plain(WOOD_L, { roughness: 0.85 });
    return (
      <group position={p} rotation={r}>
        <Box s={[w + 0.14, h + 0.12, 0.1]} m={dk} cast={false} />
        <mesh position={[0, 0, 0.055]} material={paneMat(lit)}><boxGeometry args={[w, h, 0.03]} /></mesh>
        <Box s={[w + 0.12, 0.06, 0.15]} p={[0, h / 2 + 0.09, 0.03]} m={lt} cast={false} />
        <Box s={[w * 0.6, 0.06, 0.13]} p={[0, h / 2 + 0.15, 0.02]} m={dk} cast={false} />
        <Box s={[w + 0.2, 0.06, 0.17]} p={[0, -h / 2 - 0.09, 0.04]} m={lt} cast={false} />
      </group>
    );
  }
  function BlackWin({ p, w = 0.5, h = 0.26, r = [0, 0, 0] }) {
    const M = useM();
    const dk = M.plain('#0e0907', { roughness: 0.7 });
    const fr = M.plain('#3a2616', { roughness: 0.85 });
    const lt = M.plain(WOOD_L, { roughness: 0.85 });
    return (
      <group position={p} rotation={r}>
        <Box s={[w + 0.1, h + 0.1, 0.07]} m={fr} cast={false} />
        <Box s={[w, h, 0.09]} m={dk} cast={false} />
        <Box s={[0.03, h, 0.1]} p={[-w / 6, 0, 0]} m={lt} cast={false} />
        <Box s={[0.03, h, 0.1]} p={[w / 6, 0, 0]} m={lt} cast={false} />
        <Box s={[w + 0.14, 0.04, 0.1]} p={[0, h / 2 + 0.07, 0.01]} m={lt} cast={false} />
      </group>
    );
  }

  /** Dark timber floor band (cornice) around a rectangle. */
  function Band({ y, w, d, grow = 0.07, thick = 0.09 }) {
    const M = useM();
    const dk = M.plain(WOOD, { roughness: 0.85 });
    const lt = M.plain(WOOD_L, { roughness: 0.85 });
    const a = w + grow * 2, b = d + grow * 2;
    return (
      <group position={[0, y, 0]}>
        <Box s={[a, thick, 0.1]} p={[0, 0, d / 2 + grow / 2]} m={dk} cast={false} />
        <Box s={[a, thick, 0.1]} p={[0, 0, -d / 2 - grow / 2]} m={dk} cast={false} />
        <Box s={[0.1, thick, b]} p={[w / 2 + grow / 2, 0, 0]} m={dk} cast={false} />
        <Box s={[0.1, thick, b]} p={[-w / 2 - grow / 2, 0, 0]} m={dk} cast={false} />
        <Box s={[a + 0.04, 0.035, 0.15]} p={[0, thick / 2 + 0.01, d / 2 + grow / 2]} m={lt} cast={false} />
        <Box s={[a + 0.04, 0.035, 0.15]} p={[0, thick / 2 + 0.01, -d / 2 - grow / 2]} m={lt} cast={false} />
        <Box s={[0.15, 0.035, b + 0.04]} p={[w / 2 + grow / 2, thick / 2 + 0.01, 0]} m={lt} cast={false} />
        <Box s={[0.15, 0.035, b + 0.04]} p={[-w / 2 - grow / 2, thick / 2 + 0.01, 0]} m={lt} cast={false} />
      </group>
    );
  }

  /** Instanced copies of one geometry. pts: [x,y,z,ry,tilt,tiltZ] */
  function Inst({ geo, color, pts, rough = 0.85 }) {
    const mesh = useMemo(() => {
      const im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color, roughness: rough }), pts.length);
      const o = new THREE.Object3D(); o.rotation.order = 'YXZ';
      pts.forEach((q, i) => { o.position.set(q[0], q[1], q[2]); o.rotation.set(q[4] || 0, q[3] || 0, q[5] || 0); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
      im.castShadow = true; im.receiveShadow = true; return im;
    }, [geo, color, pts, rough]);
    return <primitive object={mesh} />;
  }

  function Struts({ w, d, y, step = 0.42 }) {
    const geo = useMemo(() => new THREE.BoxGeometry(0.07, 0.46, 0.07), []);
    const pts = useMemo(() => {
      const a = []; const tilt = 0.62;
      const nx = Math.round(w / step), nz = Math.round(d / step);
      for (let i = 0; i <= nx; i++) { const x = -w / 2 + (i * w) / nx; a.push([x, y - 0.2, d / 2 + 0.13, 0, tilt]); a.push([x, y - 0.2, -d / 2 - 0.13, Math.PI, tilt]); }
      for (let j = 1; j < nz; j++) { const z = -d / 2 + (j * d) / nz; a.push([w / 2 + 0.13, y - 0.2, z, Math.PI / 2, tilt]); a.push([-w / 2 - 0.13, y - 0.2, z, -Math.PI / 2, tilt]); }
      return a;
    }, [w, d, y, step]);
    return <Inst geo={geo} color={WOOD_L} pts={pts} />;
  }
  /** Row of small dentils (carved cornice teeth) under the eave. */
  function Dentils({ w, d, y }) {
    const geo = useMemo(() => new THREE.BoxGeometry(0.11, 0.1, 0.11), []);
    const pts = useMemo(() => {
      const a = []; const s = 0.22;
      for (let x = -w / 2; x <= w / 2 + 0.01; x += s) { a.push([x, y, d / 2 + 0.2, 0]); a.push([x, y, -d / 2 - 0.2, 0]); }
      for (let z = -d / 2 + s; z < d / 2 - 0.01; z += s) { a.push([w / 2 + 0.2, y, z, 0]); a.push([-w / 2 - 0.2, y, z, 0]); }
      return a;
    }, [w, d, y]);
    return <Inst geo={geo} color="#5a3a22" pts={pts} />;
  }

  /** Ring roof */
  function ringRoofGeo(ow, od, rw, rd, iw, id, h, drop) {
    const pos = [], uv = [], idx = [];
    const rect = (w, d, y) => [[-w / 2, y, d / 2], [w / 2, y, d / 2], [w / 2, y, -d / 2], [-w / 2, y, -d / 2]];
    const O = rect(ow, od, 0), R = rect(rw, rd, h), I = rect(iw, id, drop);
    const strip = (A, B) => {
      for (let k = 0; k < 4; k++) {
        const a = A[k], b = A[(k + 1) % 4], c = B[(k + 1) % 4], e = B[k];
        const n = pos.length / 3;
        [a, b, c, e].forEach((q) => { pos.push(q[0], q[1], q[2]); uv.push(q[0] / 1.2, q[2] / 1.2); });
        idx.push(n, n + 2, n + 1, n, n + 3, n + 2);
      }
    };
    strip(O, R); strip(R, I);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  }
  function RingRoof({ y }) {
    const M = useM();
    const geo = useMemo(() => ringRoofGeo(W + 0.7, D + 0.7, RW, RD, IW - 0.1, ID - 0.1, 0.3, -0.1), []);
    const mat = useMemo(() => { const m = M.mat('roof', 2, 2, { color: ROOF_TINT }).clone(); m.side = THREE.DoubleSide; return m; }, [M]);
    const dk = M.plain(WOOD, { roughness: 0.85 });
    const ridgeY = 0.3;
    return (
      <group position={[0, y, 0]}>
        <mesh geometry={geo} material={mat} castShadow receiveShadow />
        <Box s={[W + 0.7, 0.1, 0.08]} p={[0, -0.02, (D + 0.7) / 2]} m={dk} cast={false} />
        <Box s={[W + 0.7, 0.1, 0.08]} p={[0, -0.02, -(D + 0.7) / 2]} m={dk} cast={false} />
        <Box s={[0.08, 0.1, D + 0.7]} p={[(W + 0.7) / 2, -0.02, 0]} m={dk} cast={false} />
        <Box s={[0.08, 0.1, D + 0.7]} p={[-(W + 0.7) / 2, -0.02, 0]} m={dk} cast={false} />
        <Box s={[RW, 0.07, 0.1]} p={[0, ridgeY + 0.02, RD / 2]} m={dk} />
        <Box s={[RW, 0.07, 0.1]} p={[0, ridgeY + 0.02, -RD / 2]} m={dk} />
        <Box s={[0.1, 0.07, RD]} p={[RW / 2, ridgeY + 0.02, 0]} m={dk} />
        <Box s={[0.1, 0.07, RD]} p={[-RW / 2, ridgeY + 0.02, 0]} m={dk} />
        {/* small tile gables breaking the front eave */}
        {[-2.5, 0, 2.5].map((x, i) => (
          <group key={i} position={[x, 0.0, RD / 2 - 0.1]}>
            <mesh geometry={gableGeo(0.42, 0.34, 0.5)} material={mat} castShadow />
            <Box s={[0.9, 0.05, 0.06]} p={[0, 0.0, 0.52]} m={dk} cast={false} />
          </group>
        ))}
      </group>
    );
  }

  /* ---------- white stone lion: upright, bulky, open snarling mouth, red outlines, red mane slabs, gold/green collar ---------- */
  function LionW({ s = 1, tilt = 0 }) {
    const M = useM();
    const wh = M.plain('#f4f0e6', { roughness: 0.7 });
    const red = M.plain('#c8262c', { roughness: 0.7 });
    const mouth = M.plain('#6a0c14');
    const blk = M.plain('#1a1210');
    const green = M.plain('#2f7d4a', { roughness: 0.6 });
    const gold = M.gold;
    return (
      <group scale={s}>
        {/* haunches, rear and broad chest */}
        <Ball rad={0.27} p={[0, 0.3, -0.22]} sc={[1.25, 1.05, 1.2]} m={wh} />
        <Ball rad={0.22} p={[0, 0.55, -0.15]} sc={[1.1, 1.3, 1]} m={wh} />
        <Ball rad={0.26} p={[0, 0.52, 0.06]} sc={[1.35, 1.25, 1]} m={wh} />
        {/* red outline strokes on flank and haunch */}
        <Box s={[0.03, 0.34, 0.03]} p={[-0.34, 0.34, -0.22]} m={red} cast={false} />
        <Box s={[0.03, 0.34, 0.03]} p={[0.34, 0.34, -0.22]} m={red} cast={false} />
        <Box s={[0.5, 0.03, 0.03]} p={[0, 0.12, -0.48]} m={red} cast={false} />
        <Box s={[0.34, 0.03, 0.03]} p={[0, 0.62, 0.3]} m={red} cast={false} />
        {/* straight planted front legs and paws */}
        {[-0.14, 0.14].map((x, i) => (
          <group key={i}>
            <Cyl rt={0.075} rb={0.085} h={0.42} p={[x, 0.21, 0.26]} m={wh} seg={8} />
            <Box s={[0.15, 0.06, 0.2]} p={[x, 0.03, 0.32]} m={wh} />
            <Box s={[0.15, 0.025, 0.025]} p={[x, 0.3, 0.35]} m={red} cast={false} />
          </group>
        ))}
        {/* mane: flat red slabs over the shoulders and down the back */}
        <Box s={[0.62, 0.62, 0.07]} p={[0, 0.9, -0.02]} r={[-0.15, 0, 0]} m={red} />
        <Box s={[0.5, 0.06, 0.55]} p={[0, 0.72, -0.2]} r={[0.35, 0, 0]} m={red} />
        <Box s={[0.4, 0.06, 0.5]} p={[0, 0.55, -0.45]} r={[0.5, 0, 0]} m={red} />
        <Box s={[0.28, 0.05, 0.4]} p={[0, 0.38, -0.62]} r={[0.7, 0, 0]} m={red} />
        {/* head, tilted slightly towards the door */}
        <group position={[0, 0, 0.1]} rotation={[0, tilt, 0]}>
          <Ball rad={0.22} p={[0, 0.92, 0.08]} sc={[1.1, 0.95, 1]} m={wh} />
          <Box s={[0.3, 0.09, 0.26]} p={[0, 0.85, 0.3]} m={wh} />
          <Box s={[0.26, 0.07, 0.22]} p={[0, 0.7, 0.27]} m={wh} />
          <Box s={[0.24, 0.07, 0.2]} p={[0, 0.775, 0.27]} m={mouth} />
          {[-0.1, -0.03, 0.03, 0.1].map((x, i) => <Box key={i} s={[0.025, 0.06, 0.02]} p={[x, 0.795, 0.4]} m={wh} cast={false} />)}
          {[-0.08, 0.08].map((x, i) => <Box key={i} s={[0.025, 0.05, 0.02]} p={[x, 0.74, 0.375]} m={wh} cast={false} />)}
          <Ball rad={0.035} p={[0, 0.9, 0.4]} sc={[1.4, 0.8, 1]} m={blk} />
          {[-0.1, 0.1].map((x, i) => <Ball key={i} rad={0.035} p={[x, 0.98, 0.26]} m={blk} />)}
          <Box s={[0.34, 0.03, 0.03]} p={[0, 1.04, 0.28]} m={red} cast={false} />
          {[-0.17, 0.17].map((x, i) => <Ball key={i} rad={0.05} p={[x, 1.1, 0.0]} m={wh} />)}
          {/* gold and green collar with bell */}
          <mesh position={[0, 0.66, 0.02]} rotation={[Math.PI / 2.2, 0, 0]} material={gold}><torusGeometry args={[0.2, 0.03, 8, 18]} /></mesh>
          <mesh position={[0, 0.63, 0.04]} rotation={[Math.PI / 2.2, 0, 0]} material={green}><torusGeometry args={[0.215, 0.018, 8, 18]} /></mesh>
          <Ball rad={0.045} p={[0, 0.55, 0.24]} m={gold} />
        </group>
      </group>
    );
  }

  /* ---------- Main ---------- */
  function KumariMain() {
    const M = useM();
    const dk = M.plain(WOOD, { roughness: 0.85 });
    const lt = M.plain(WOOD_L, { roughness: 0.8 });
    const gold = M.gold;
    const stone = M.plain('#a9a398', { roughness: 0.95 });
    const stair = M.plain('#9a9488', { roughness: 0.95 });
    const floorStone = useMemo(() => new THREE.MeshStandardMaterial({ color: '#b9b3a5', emissive: '#7a766a', roughness: 1 }), []);
    const mk = (a, b) => M.mat('brick', a / 0.75, b / 0.75, { color: BRICK_TINT });
    const hh = EAVE - G1;
    const DH = 1.5; // door height above plinth
    const bSide = mk(D, G1 - G0), bFront = mk(W / 2 - 0.85, G1 - G0), bAbove = mk(1.7, G1 - (PLH + DH + 0.1));
    const bUp = mk(W, hh), bUpSIn = mk(D - 2 * T, hh), bBack = mk(W, G1 - G0);
    const pillarGeo = useMemo(() => new THREE.BoxGeometry(0.14, G1 - G0, 0.14), []);
    const pillarPts = useMemo(() => {
      const a = []; const nx = 6, nz = 5;
      for (let i = 0; i <= nx; i++) { const x = -IW / 2 + (i * IW) / nx; a.push([x, (G0 + G1) / 2, ID / 2 - 0.08]); a.push([x, (G0 + G1) / 2, -ID / 2 + 0.08]); }
      for (let j = 1; j < nz; j++) { const z = -ID / 2 + (j * ID) / nz; a.push([IW / 2 - 0.08, (G0 + G1) / 2, z]); a.push([-IW / 2 + 0.08, (G0 + G1) / 2, z]); }
      return a;
    }, []);
    const capGeo = useMemo(() => new THREE.BoxGeometry(0.22, 0.08, 0.22), []);
    const capPts = useMemo(() => pillarPts.map((q) => [q[0], G1 - 0.06, q[2], 0]), [pillarPts]);
    const railGeo = useMemo(() => new THREE.BoxGeometry(0.04, 0.4, 0.04), []);
    const railPts = useMemo(() => {
      const a = []; const h = 0.98;
      for (let i = -3; i <= 3; i++) { a.push([i * h / 3, 0.5, h]); a.push([i * h / 3, 0.5, -h]); a.push([h, 0.5, i * h / 3]); a.push([-h, 0.5, i * h / 3]); }
      return a;
    }, []);
    const poleGeo = useMemo(() => new THREE.CylinderGeometry(0.07, 0.08, 4.2, 7), []);
    const polePts = useMemo(() => {
      const a = [];
      // black shoring poles leaning diagonally against the inner walls: [x,y,z,ry,tiltX,tiltZ]
      [-1.7, -0.4, 1.2].forEach((x) => a.push([x, 2.0, -ID / 2 + 0.7, 0, -0.32, 0]));
      [-1.0, 0.9].forEach((z) => a.push([-IW / 2 + 0.7, 2.0, z, 0, 0, 0.32]));
      [-0.9, 1.1].forEach((z) => a.push([IW / 2 - 0.7, 2.0, z, 0, 0, -0.32]));
      return a;
    }, []);
    const cy = 0.1;
    const lionX = 1.85, lionZ = D / 2 + 0.85;

    return (
      <group>
        <Frame s={[W + 1.4, EAVE + 0.8, D + 3.6]} p={[0, (EAVE + 0.8) / 2, 0.9]} />

        {/* plinth, narrow 3-step stair of weathered sandstone and two lion plinths */}
        <Box s={[W + 0.4, PLH, D + 0.4]} p={[0, PLH / 2, 0]} m={stone} />
        <Box s={[2.6, 0.3, 0.55]} p={[0, 0.15, D / 2 + 0.2 + 0.275]} m={stair} />
        <Box s={[2.6, 0.2, 0.9]} p={[0, 0.1, D / 2 + 0.2 + 0.45]} m={stair} />
        <Box s={[2.6, 0.1, 1.25]} p={[0, 0.05, D / 2 + 0.2 + 0.625]} m={stair} />
        {[-lionX, lionX].map((x, i) => (
          <group key={i}>
            <Box s={[1.15, 0.5, 1.2]} p={[x, 0.25, lionZ]} m={stone} />
            <Box s={[1.25, 0.06, 1.3]} p={[x, 0.5, lionZ]} m={stair} />
          </group>
        ))}
        <mesh position={[0, PLH + 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={floorStone}><planeGeometry args={[IW, ID]} /></mesh>

        {/* ground storey: plain brick, tall doorway in the centre of the front */}
        <Box s={[W / 2 - 0.85, G1 - G0, 0.5]} p={[-(W / 2 + 0.85) / 2, (G0 + G1) / 2, D / 2 - 0.25]} m={bFront} />
        <Box s={[W / 2 - 0.85, G1 - G0, 0.5]} p={[(W / 2 + 0.85) / 2, (G0 + G1) / 2, D / 2 - 0.25]} m={bFront} />
        <Box s={[1.7, G1 - (PLH + DH + 0.1), 0.5]} p={[0, (PLH + DH + 0.1 + G1) / 2, D / 2 - 0.25]} m={bAbove} />
        <Box s={[W, G1 - G0, 0.5]} p={[0, (G0 + G1) / 2, -D / 2 + 0.25]} m={bBack} />
        <Box s={[0.5, G1 - G0, D - 1]} p={[-W / 2 + 0.25, (G0 + G1) / 2, 0]} m={bSide} />
        <Box s={[0.5, G1 - G0, D - 1]} p={[W / 2 - 0.25, (G0 + G1) / 2, 0]} m={bSide} />

        {/* upper storeys as one ring of wings */}
        <Box s={[W, hh, T]} p={[0, G1 + hh / 2, D / 2 - T / 2]} m={bUp} />
        <Box s={[W, hh, T]} p={[0, G1 + hh / 2, -D / 2 + T / 2]} m={bUp} />
        <Box s={[T, hh, D - 2 * T]} p={[-W / 2 + T / 2, G1 + hh / 2, 0]} m={bUpSIn} />
        <Box s={[T, hh, D - 2 * T]} p={[W / 2 - T / 2, G1 + hh / 2, 0]} m={bUpSIn} />
        <Box s={[W - 1.0, 0.05, 0.62]} p={[0, G1 - 0.02, ID / 2 + 0.3]} m={dk} cast={false} />
        <Box s={[W - 1.0, 0.05, 0.62]} p={[0, G1 - 0.02, -ID / 2 - 0.3]} m={dk} cast={false} />

        {/* floor bands, deep carved cornice, struts, dentils (all dark carved timber) */}
        <Band y={G1} w={W} d={D} grow={0.09} thick={0.12} />
        <Band y={F1} w={W} d={D} />
        <Band y={F2} w={W} d={D} grow={0.09} thick={0.12} />
        <Band y={EAVE - 0.05} w={W} d={D} grow={0.12} thick={0.16} />
        <Band y={EAVE - 0.22} w={W} d={D} grow={0.15} thick={0.1} />
        <Struts w={W + 0.2} d={D + 0.2} y={EAVE - 0.05} />
        <Dentils w={W} d={D} y={EAVE - 0.34} />
        <Band y={F1} w={IW} d={ID} grow={-0.07} />
        <Band y={F2} w={IW} d={ID} grow={-0.07} />
        <Band y={EAVE - 0.06} w={IW} d={ID} grow={-0.1} thick={0.12} />

        {/* ===== street front: doorway, plain brick, one bank at floor 2, a few small gabled windows ===== */}
        <group position={[0, 0, D / 2]}>
          {[-0.76, 0.76].map((x, i) => (
            <group key={i}>
              <Box s={[0.22, DH, 0.28]} p={[x, PLH + DH / 2, 0.0]} m={dk} />
              {[0.3, 0.7, 1.1].map((y, k) => <Box key={k} s={[0.13, 0.08, 0.05]} p={[x, PLH + y, 0.15]} m={lt} cast={false} />)}
              <Box s={[0.05, DH - 0.1, 0.04]} p={[x + (i ? -0.07 : 0.07), PLH + DH / 2, 0.15]} m={lt} cast={false} />
            </group>
          ))}
          <Box s={[1.95, 0.16, 0.3]} p={[0, PLH + DH + 0.08, 0.0]} m={dk} />
          <Box s={[1.3, DH - 0.05, 0.08]} p={[0, PLH + DH / 2, -0.14]} m={dk} />
          <Box s={[0.05, DH - 0.1, 0.05]} p={[0, PLH + DH / 2, -0.1]} m={lt} />
          {[-0.33, 0.33].map((x, i) => <Box key={i} s={[0.45, 0.95, 0.03]} p={[x, PLH + 0.8, -0.095]} m={lt} cast={false} />)}
          {[-0.33, 0.33].map((x, i) => <Box key={i} s={[0.4, 0.9, 0.04]} p={[x, PLH + 0.8, -0.09]} m={dk} cast={false} />)}
          {/* toran: clear semicircle of dark carving with a gold finial */}
          <Arch hw={0.92} hh={0.84} depth={0.14} p={[0, 2.0, -0.02]} m={dk} />
          <Arch hw={0.76} hh={0.69} depth={0.18} p={[0, 2.0, -0.02]} m={lt} />
          <Arch hw={0.6} hh={0.54} depth={0.22} p={[0, 2.0, -0.02]} m={dk} />
          {Array.from({ length: 11 }, (_, i) => {
            const a = Math.PI * (0.06 + (i / 10) * 0.88);
            return <Ball key={i} rad={0.04} p={[Math.cos(a) * 0.68, 2.02 + Math.sin(a) * 0.62, 0.2]} m={lt} />;
          })}
          {Array.from({ length: 7 }, (_, i) => {
            const a = Math.PI * (0.12 + (i / 6) * 0.76);
            return <Box key={i} s={[0.05, 0.14, 0.04]} p={[Math.cos(a) * 0.4, 2.08 + Math.sin(a) * 0.36, 0.23]} r={[0, 0, a - Math.PI / 2]} m={lt} cast={false} />;
          })}
          <Box s={[0.18, 0.26, 0.05]} p={[0, 2.12, 0.24]} m={lt} />
          <Cyl rt={0.03} rb={0.05} h={0.14} p={[0, 2.92, 0.1]} m={gold} seg={8} />
          <Ball rad={0.05} p={[0, 3.02, 0.1]} m={gold} />
        </group>
        {/* two huge white lions on high plinths flanking the stair, heads turned to the door */}
        <group position={[-lionX, 0.53, lionZ]} rotation={[0, 0.12, 0]}><LionW s={1.5} tilt={0.22} /></group>
        <group position={[lionX, 0.53, lionZ]} rotation={[0, -0.12, 0]}><LionW s={1.5} tilt={-0.22} /></group>
        {/* small dark carved windows either side of the door */}
        {[-2.75, 2.75].map((x, i) => <CWin key={`g${i}`} p={[x, 1.3, D / 2 + 0.03]} w={0.6} h={0.5} lit={i === 0} />)}

        {/* first floor: small gabled windows; second floor: one carved bank + two gabled; top: small windows */}
        {[-2.4, -1.2, 1.2, 2.4].map((x, i) => <Gabled key={`g1${i}`} p={[x, Y1, D / 2]} w={0.32} h={0.44} />)}
        <Bank p={[0, Y2, D / 2]} w={2.0} h={0.58} crown={0.34} lit />
        {[-2.4, 2.4].map((x, i) => <Gabled key={`g2${i}`} p={[x, Y2, D / 2]} w={0.34} h={0.46} />)}
        {[-3.0, -1.5, 0, 1.5, 3.0].map((x, i) => <BlackWin key={`a${i}`} p={[x, YT, D / 2 + 0.03]} w={0.4} h={0.2} />)}

        {/* ===== rear and side faces ===== */}
        {[-2.2, 0, 2.2].map((x, i) => <CWin key={`rb1${i}`} p={[x, Y1, -D / 2 - 0.04]} r={[0, Math.PI, 0]} w={1.0} h={0.5} />)}
        {[-2.2, 0, 2.2].map((x, i) => <CWin key={`rb2${i}`} p={[x, Y2, -D / 2 - 0.04]} r={[0, Math.PI, 0]} w={1.0} h={0.5} />)}
        {[-1.3, 1.3].map((z) => [1, -1].map((sx) => <CWin key={`sd1${z}${sx}`} p={[sx * (W / 2 + 0.04), Y1, z]} r={[0, sx * Math.PI / 2, 0]} w={0.9} h={0.5} />))}
        {[-1.3, 1.3].map((z) => [1, -1].map((sx) => <CWin key={`sd2${z}${sx}`} p={[sx * (W / 2 + 0.04), Y2, z]} r={[0, sx * Math.PI / 2, 0]} w={0.9} h={0.5} />))}
        {[-1.3, 1.3].map((z) => [1, -1].map((sx) => <BlackWin key={`sa${z}${sx}`} p={[sx * (W / 2 + 0.03), YT, z]} r={[0, sx * Math.PI / 2, 0]} w={0.4} h={0.2} />))}

        {/* ===== inner courtyard (bahal): carved pillar arcade, big three-opening banks on floors 1 and 2 ===== */}
        <Inst geo={pillarGeo} color="#2a1a0e" pts={pillarPts} />
        <Inst geo={capGeo} color="#4e3320" pts={capPts} />
        {[-1.7, -0.55, 0.6, 1.75].map((x, i) => <Box key={`bd${i}`} s={[0.5, 1.1, 0.04]} p={[x, PLH + 0.55, -ID / 2 - 0.02]} m={dk} cast={false} />)}
        {[-1.3, 0, 1.3].map((z, i) => <Box key={`ld${i}`} s={[0.04, 1.1, 0.5]} p={[-IW / 2 - 0.02, PLH + 0.55, z]} m={dk} cast={false} />)}
        {[-1.3, 0, 1.3].map((z, i) => <Box key={`rd${i}`} s={[0.04, 1.1, 0.5]} p={[IW / 2 + 0.02, PLH + 0.55, z]} m={dk} cast={false} />)}
        {[Y1, Y2].map((y, k) => (
          <group key={`cb${k}`}>
            {[-1.45, 1.45].map((x, i) => <Bank key={`r${i}`} p={[x, y, -ID / 2 + 0.03]} w={1.7} h={0.5} crown={0.3} lit={k === 0 && i === 0} />)}
            {[-1.45, 1.45].map((x, i) => <Bank key={`f${i}`} p={[x, y, ID / 2 - 0.03]} r={[0, Math.PI, 0]} w={1.7} h={0.5} crown={0.3} />)}
            <Bank p={[-IW / 2 + 0.03, y, 0]} r={[0, Math.PI / 2, 0]} w={1.9} h={0.5} crown={0.3} lit={k === 1} />
            <Bank p={[IW / 2 - 0.03, y, 0]} r={[0, -Math.PI / 2, 0]} w={1.9} h={0.5} crown={0.3} />
          </group>
        ))}
        {[-1.4, 0, 1.4].map((x, i) => <BlackWin key={`ia${i}`} p={[x, YT, -ID / 2 + 0.03]} w={0.4} h={0.2} />)}
        <Inst geo={poleGeo} color="#0a0808" pts={polePts} />

        {/* dharmadhatu disc, larger chaitya, brown-trunked tree, iron railing */}
        <group position={[0, PLH, cy]}>
          <Cyl rt={0.74} rb={0.8} h={0.08} p={[0, 0.04, 0]} m={stone} seg={20} />
          <Cyl rt={0.58} rb={0.62} h={0.1} p={[0, 0.13, 0]} m={M.plain('#8a8076', { roughness: 0.95 })} seg={20} />
          <Cyl rt={0.54} h={0.05} p={[0, 0.2, 0]} m={M.plain('#7e756b', { roughness: 0.9 })} seg={20} />
          <Ball rad={0.07} p={[0.25, 0.24, 0.2]} m={M.plain('#d23a55')} />
          <group position={[-0.05, 0.2, -0.05]} scale={1.9}>
            <Box s={[0.34, 0.2, 0.34]} p={[0, 0.1, 0]} m={stone} />
            <mesh position={[0, 0.2, 0]} material={stone} castShadow><sphereGeometry args={[0.15, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
            <Box s={[0.1, 0.08, 0.1]} p={[0, 0.38, 0]} m={stone} />
            <mesh position={[0, 0.54, 0]} material={gold}><coneGeometry args={[0.05, 0.24, 8]} /></mesh>
          </group>
          <Cyl rt={0.07} rb={0.1} h={1.4} p={[-1.15, 0.7, 0.1]} m={M.plain('#4a3220')} seg={8} />
          {[[-1.15, 1.7, 0.1, 0.5], [-0.75, 1.5, 0.25, 0.38], [-1.5, 1.55, 0.2, 0.38], [-1.15, 2.05, -0.1, 0.34]].map(([x, y, z, r], i) => (
            <Ball key={i} rad={r} p={[x, y, z]} sc={[1, 0.75, 1]} m={M.plain(i % 2 ? '#586f42' : '#62794a', { roughness: 1 })} />
          ))}
          <Inst geo={railGeo} color={IRON} pts={railPts} />
          <Box s={[2.0, 0.04, 0.04]} p={[0, 0.6, 0.98]} m={M.plain(IRON)} cast={false} />
          <Box s={[2.0, 0.04, 0.04]} p={[0, 0.6, -0.98]} m={M.plain(IRON)} cast={false} />
          <Box s={[0.04, 0.04, 2.0]} p={[0.98, 0.6, 0]} m={M.plain(IRON)} cast={false} />
          <Box s={[0.04, 0.04, 2.0]} p={[-0.98, 0.6, 0]} m={M.plain(IRON)} cast={false} />
        </group>

        <RingRoof y={EAVE} />

        <Diyo p={[-0.9, PLH, D / 2 + 0.55]} light />
        <pointLight position={[0, 3.5, 0]} intensity={3.5} distance={8} color="#ffd9a0" />
        <Diyo p={[0.9, PLH, D / 2 + 0.55]} />
      </group>
    );
  }

  /* ---------- Env ---------- */
  function Pagoda3({ p, w = 2.6, r = 0, sc = 1 }) {
    const M = useM();
    const brick = M.plain('#4a3020', { roughness: 0.9 });
    const roof = M.mat('roof', 2, 2, { color: ROOF_TINT });
    const dk = M.plain(WOOD);
    const step = M.mat('brick', 2, 1, { color: NB_TINT });
    return (
      <group position={p} rotation={[0, r, 0]} scale={sc}>
        {[0, 1, 2, 3, 4].map((i) => <Box key={i} s={[w + 1.6 - i * 0.28, 0.2, w + 1.6 - i * 0.28]} p={[0, 0.1 + i * 0.2, 0]} m={step} />)}
        {[0, 1, 2].map((i) => {
          const y = 1.0 + i * 1.15, ww = w - i * 0.35;
          return (
            <group key={i}>
              <Box s={[ww - 0.3, 0.9, ww - 0.3]} p={[0, y + 0.45, 0]} m={brick} />
              <Box s={[ww - 0.1, 0.12, ww - 0.1]} p={[0, y + 0.8, 0]} m={dk} />
              <Roof w={ww + 0.7} d={ww + 0.7} h={0.55} y={y + 0.9} m={roof} sag={1.4} lift={0.15} />
            </group>
          );
        })}
        <mesh position={[0, 4.65, 0]} material={M.gold}><coneGeometry args={[0.1, 0.8, 8]} /></mesh>
        <Box s={[0.6, 0.55, 0.05]} p={[0, 1.4, w / 2 - 0.1]} m={dk} />
      </group>
    );
  }
  function LowHall({ p, w = 3.2, r = 0 }) {
    const M = useM();
    const roof = M.mat('roof', 2, 2, { color: ROOF_TINT });
    const dk = M.plain(WOOD);
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[w + 0.6, 0.3, w + 0.6]} p={[0, 0.15, 0]} m={M.stone} />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], i) => <Cyl key={i} rt={0.07} h={0.9} p={[a * w * 0.42, 0.75, b * w * 0.42]} m={dk} seg={8} />)}
        <Roof w={w + 0.6} d={w + 0.6} h={0.6} y={1.2} m={roof} sag={1.3} lift={0.12} />
        <Roof w={w - 0.4} d={w - 0.4} h={0.55} y={1.75} m={roof} sag={1.3} lift={0.12} />
        <Roof w={w - 1.2} d={w - 1.2} h={0.5} y={2.25} m={roof} sag={1.3} lift={0.12} />
        <mesh position={[0, 3.1, 0]} material={M.gold}><coneGeometry args={[0.07, 0.5, 8]} /></mesh>
      </group>
    );
  }
  /** Gaddi Baithak: white neoclassical Rana block with columned portico and pediment. */
  function GaddiBaithak({ p, r = 0, sc = 1 }) {
    const M = useM();
    const white = M.plain('#f1ece0', { roughness: 0.9 });
    const shade = M.plain('#d8d0bf', { roughness: 0.9 });
    const dkw = M.plain('#2a2420', { roughness: 0.8 });
    const roofm = M.plain('#6e6a64', { roughness: 0.9 });
    const pedGeo = useMemo(() => gableGeo(3.5, 1.1, 0.4), []);
    return (
      <group position={p} rotation={[0, r, 0]} scale={sc}>
        <Box s={[9.4, 0.4, 6.8]} p={[0, 0.2, 0]} m={M.stone} />
        <Box s={[8.8, 5.6, 6.2]} p={[0, 3.2, 0]} m={white} />
        <Box s={[8.95, 0.16, 6.35]} p={[0, 3.35, 0]} m={shade} />
        <Box s={[9.0, 0.3, 6.4]} p={[0, 6.1, 0]} m={shade} />
        <Roof w={9.2} d={6.6} h={0.9} y={6.25} m={roofm} sag={1} lift={0} />
        {/* portico */}
        <Box s={[6.4, 0.2, 1.4]} p={[0, 0.5, 3.6]} m={M.stone} />
        {[-2.7, -0.9, 0.9, 2.7].map((x, i) => <Cyl key={i} rt={0.24} rb={0.26} h={5.0} p={[x, 3.1, 3.9]} m={white} seg={14} />)}
        <Box s={[6.8, 0.4, 1.3]} p={[0, 5.8, 3.65]} m={shade} />
        <mesh geometry={pedGeo} position={[0, 6.0, 3.3]} material={white} castShadow />
        {/* arched windows, two rows */}
        {[-3.65, 3.65].map((x) => [1.9, 4.5].map((y, k) => (
          <group key={`${x}${k}`} position={[x, y, 3.1]}>
            <Box s={[0.75, 1.3, 0.08]} m={dkw} cast={false} />
            <Arch hw={0.375} hh={0.3} depth={0.08} p={[0, 0.65, -0.04]} m={dkw} />
            <Box s={[1.0, 0.1, 0.14]} p={[0, -0.7, 0.03]} m={shade} cast={false} />
          </group>
        )))}
        {[-2.0, 0, 2.0].map((z) => [1.9, 4.5].map((y, k) => (
          [1, -1].map((sx) => (
            <group key={`${z}${y}${sx}`} position={[sx * 4.4, y, z]} rotation={[0, sx * Math.PI / 2, 0]}>
              <Box s={[0.75, 1.3, 0.08]} m={dkw} cast={false} />
              <Arch hw={0.375} hh={0.3} depth={0.08} p={[0, 0.65, -0.04]} m={dkw} />
            </group>
          ))
        )))}
        {/* tall portico doors */}
        {[-1.8, 0, 1.8].map((x, i) => <Box key={i} s={[0.9, 2.0, 0.06]} p={[x, 1.6, 3.12]} m={dkw} cast={false} />)}
      </group>
    );
  }
  /** Basantapur (Nautale) tower: nine-storey tower, tapering. */
  function Nautale({ p }) {
    const M = useM();
    const brick = M.mat('brick', 1.2, 0.6, { color: NB_TINT });
    const white = M.plain('#ece4d4', { roughness: 0.9 });
    const dk = M.plain(WOOD);
    const roof = M.mat('roof', 2, 2, { color: ROOF_TINT });
    return (
      <group position={p}>
        <Box s={[6, 0.6, 6]} p={[0, 0.3, 0]} m={M.stone} />
        {Array.from({ length: 9 }, (_, i) => {
          const w = 3.0 - i * 0.12, y = 0.6 + i * 1.25;
          return (
            <group key={i}>
              <Box s={[w, 1.0, w]} p={[0, y + 0.5, 0]} m={i < 5 ? brick : white} />
              <Box s={[w + 0.5, 0.14, w + 0.5]} p={[0, y + 1.07, 0]} m={dk} />
              <Box s={[0.4, 0.5, 0.05]} p={[0, y + 0.5, w / 2 + 0.02]} m={dk} cast={false} />
            </group>
          );
        })}
        <Roof w={3.4} d={3.4} h={0.9} y={11.9} m={roof} sag={1.3} lift={0.1} />
        <mesh position={[0, 13.4, 0]} material={M.gold}><coneGeometry args={[0.12, 1.0, 8]} /></mesh>
      </group>
    );
  }
  function BHouse({ p, w = 4, d = 4, h = 3, r = 0, plaster = false, tile = '#8a6a5a', tint = NB_TINT, rooms = 3, seed = 1 }) {
    const M = useM();
    const wall = plaster ? M.plain('#cfc3a8', { roughness: 0.9 }) : M.mat('brick', w / 0.9, h / 0.9, { color: tint });
    const roof = M.mat('roof', 2, 2, { color: tile });
    const dk = M.plain(WOOD);
    const q = rng(seed);
    const floors = Math.max(1, Math.round(h / 1.2));
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[w, h, d]} p={[0, h / 2, 0]} m={wall} />
        <Roof w={w + 0.5} d={d + 0.5} h={0.45 + q() * 0.4} y={h} m={roof} sag={1} lift={0} />
        {Array.from({ length: floors - 1 }, (_, f) => (
          <group key={f}>
            <Box s={[w + 0.06, 0.08, d + 0.06]} p={[0, 1.2 * (f + 1), 0]} m={dk} cast={false} />
            {Array.from({ length: rooms }, (_, k) => (
              <Box key={k} s={[0.6, 0.55, 0.06]} p={[-w / 2 + (k + 0.5) * (w / rooms), 1.2 * (f + 1) + 0.55, d / 2 + 0.02]} m={dk} cast={false} />
            ))}
          </group>
        ))}
      </group>
    );
  }

  function KumariEnv() {
    const M = useM();
    const earth = M.plain('#7a7468', { roughness: 1 });
    const slabs = M.plain('#8a8478', { roughness: 0.95 });
    const strip = M.plain('#7a4a3a', { roughness: 0.95 });
    const hill1 = M.plain('#5f7a68', { roughness: 1 });
    const hill2 = M.plain('#7a8f86', { roughness: 1 });
    const haze = useMemo(() => new THREE.MeshBasicMaterial({ color: '#d4d6d6', transparent: true, opacity: 0.4, side: THREE.BackSide, fog: false, depthWrite: false }), []);
    const tiles = ['#8a6a5a', '#7a5a4c', '#6e5a50', '#9a7a62'];
    const tints = [NB_TINT, '#a98068', '#c19a82'];
    const ring = useMemo(() => {
      const a = []; const r = rng(21);
      for (let i = 0; i < 26; i++) {
        const ang = Math.PI * (0.04 + (i / 25) * 0.92) + Math.PI;
        const rad = 24 + r() * 12;
        a.push({ p: [Math.cos(ang) * rad * 1.35, 0, Math.sin(ang) * rad - 6], w: 4.5 + r() * 4, d: 4.5 + r() * 3.5, h: 3.0 + Math.floor(r() * 3) * 0.4, rot: -ang + Math.PI / 2, plaster: r() < 0.25, tile: tiles[Math.floor(r() * 4)], tint: tints[Math.floor(r() * 3)], rooms: 2 + Math.floor(r() * 3), seed: i + 2 });
      }
      return a;
    }, []);
    return (
      <group>
        <GroundDisc r={70} m={earth} y={-0.03} />
        {/* stone-slab plaza at the foot of the steps with darker brick-band strips */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 8]} receiveShadow material={slabs}><planeGeometry args={[46, 36]} /></mesh>
        <Box s={[40, 0.03, 0.45]} p={[0, 0.0, 15]} m={strip} cast={false} />
        <Box s={[40, 0.03, 0.45]} p={[0, 0.0, 6]} m={strip} cast={false} />
        <Box s={[0.45, 0.03, 30]} p={[7, 0.0, 6]} m={strip} cast={false} />
        <Box s={[0.45, 0.03, 30]} p={[-7, 0.0, 6]} m={strip} cast={false} />

        {/* hazy valley-rim hills */}
        <mesh position={[0, 6, 0]} material={haze}><cylinderGeometry args={[66, 66, 12, 48, 1, true]} /></mesh>
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return <mesh key={i} position={[Math.cos(a) * 62, -1.2, Math.sin(a) * 62]} scale={[16 + (i % 3) * 4, 4 + (i % 4) * 1.5, 9]} rotation={[0, -a + Math.PI / 2, 0]} material={i % 2 ? hill1 : hill2}><sphereGeometry args={[1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>;
        })}

        {/* low adjoining houses on both sides, well below the Kumari Ghar eave */}
        <BHouse p={[-11.4, 0, -0.3]} w={5.2} d={6.2} h={3.4} rooms={3} seed={3} />
        <BHouse p={[11.4, 0, -0.4]} w={5} d={6} h={3.6} rooms={4} seed={11} tint="#a98068" tile="#7a5a4c" />
        <BHouse p={[16.8, 0, 1.0]} w={4.2} d={5} h={3.2} plaster rooms={2} seed={8} />
        {/* rear houses pushed to the sides, so no wall of brick stands directly behind */}
        <BHouse p={[-12.5, 0, -9.5]} w={7} d={5} h={4.2} rooms={5} seed={13} />
        <BHouse p={[13, 0, -9.5]} w={6} d={5} h={3.8} rooms={4} seed={14} tile="#6e5a50" plaster />
        <BHouse p={[0, 0, -16]} w={6} d={4} h={3.2} rooms={3} seed={15} tint="#c19a82" />

        {/* Gaddi Baithak (white Rana block) visible on the left, Trailokya Mohan far north-west behind, Basantapur tower far */}
        <GaddiBaithak p={[-20.5, 0, 5]} r={0.35} sc={0.78} />
        <Pagoda3 p={[-28, 0, -22]} w={2.6} sc={1.4} />
        <Nautale p={[30, 0, -18]} />
        {/* low open pavilion near the lions */}
        <LowHall p={[-9.5, 0, 13]} w={2.4} r={0.2} />

        {/* small stone chaityas on the paved square */}
        {[[6, 15], [-4, 12], [19, 6], [-6, 22]].map(([x, z], i) => (
          <group key={i} position={[x, 0, z]}>
            <Box s={[0.7, 0.35, 0.7]} p={[0, 0.17, 0]} m={M.stone} />
            <mesh position={[0, 0.35, 0]} material={M.stone}><sphereGeometry args={[0.28, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
            <mesh position={[0, 0.95, 0]} material={M.gold}><coneGeometry args={[0.1, 0.55, 8]} /></mesh>
          </group>
        ))}
        {[[22, 0, 20], [-24, 0, 26]].map(([x, y, z], i) => (
          <group key={i} position={[x, y, z]}>
            <Box s={[2.6, 0.4, 2.6]} p={[0, 0.2, 0]} m={M.stone} />
            <Cyl rt={0.2} rb={0.3} h={2.2} p={[0, 1.4, 0]} m={M.plain('#5a4030')} seg={8} />
            {[[0, 3.2, 0, 1.4], [0.9, 2.8, 0.4, 1.0], [-0.9, 2.9, -0.3, 1.1], [0.2, 3.9, 0.2, 0.9]].map(([a, b, c, rr], k) => <Ball key={k} rad={rr} p={[a, b, c]} sc={[1.1, 0.8, 1.1]} m={M.plain('#566f42', { roughness: 1 })} />)}
          </group>
        ))}
        {ring.map((o, i) => <BHouse key={i} p={o.p} w={o.w} d={o.d} h={o.h} r={o.rot} plaster={o.plaster} tile={o.tile} tint={o.tint} rooms={o.rooms} seed={o.seed} />)}
      </group>
    );
  }

  return { 'kumari-ghar': { Main: KumariMain, Env: KumariEnv } };
}
