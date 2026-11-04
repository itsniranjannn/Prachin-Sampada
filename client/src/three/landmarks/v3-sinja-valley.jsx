// Sinja Valley (Hat Sinja, Jumla, Karnali) - a rural valley LANDSCAPE, not a monument.
// Hero (Main): the carved-timber gateway pillars with human-figure finials at the head of a stone-slab footbridge over the Hima river,
// with two shorter ringed posts in front, a leaning slate stele and boulder embankments.
// Env: a procedural terraced U-shaped valley (heightfield), meandering river, dry ochre hills, conifer patches, snow ridges, Narakot's
// blue-roofed stone houses, 3 small stone shikhara temples, rows of leaning steles, a cliff with caves, ruined Yatse fort mound, a naula.
// Scale: 1 unit ~ 1.1 m near the bridge, compressed further out so the whole valley reads (pillar heights are estimates, not surveyed).
// Orientation: valley axis along x, river flows along x, bridge crosses it along z, gateway at the far (-z) end; default camera looks NW.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Frame, THREE, useMemo, useRef, useEffect } = K;

  /* ---------- terrain model (shared by Env pieces so things sit on the ground) ---------- */
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const nse = (x, z) => Math.sin(x * 0.11 + z * 0.07) * 0.5 + Math.sin(x * 0.23 - z * 0.19 + 2) * 0.3 + Math.sin(x * 0.05 + z * 0.31) * 0.2;
  const rz = (x) => Math.min(1, (x / 6) ** 2) * (3.4 * Math.sin(x * 0.14) + 1.5 * Math.sin(x * 0.33));
  const rw = (x) => 0.8 * (3.0 + 0.55 * Math.sin(x * 0.21 + 1) + 0.5 * Math.sin(x * 0.57)) * (1 - sm(46, 68, Math.abs(x < 0 ? x + 6 : x - 6)) * 0.7);
  const Wf = (x) => 1.7 * Math.min(20, Math.max(10, 13 - x * 0.08));
  const STEP = 0.9;
  function terr(x, z) {
    const wf = Wf(x) * (z < 0 ? 1.05 : 1);
    const b = Math.max(0, Math.abs(z) - wf);
    let raw = b < 12 ? 0.38 * b : 4.56 + 0.42 * (b - 12);
    if (z < 0) raw *= 1.12;
    const nz = nse(x, z);
    const g = Math.pow(Math.abs(Math.sin(x * 0.33 + Math.sin(z * 0.11) * 2.2)), 12);
    raw += nz * Math.min(b, 30) * 0.12 - g * 1.2 * sm(10, 30, b);
    raw = Math.max(0, raw);
    raw = 17 * Math.tanh(raw / 17) + 0.5 * Math.max(0, b - 42);
    const r = Math.hypot(x, z);
    if (b === 0) raw += 0.06 * nz * sm(6, 16, r);
    const tw = 1 - sm(5, 8, raw);
    let fl = 0, fr = 0, hh = raw;
    if (raw > 0.05 && tw > 0) {
      const s = raw / STEP; fl = Math.floor(s); fr = s - fl;
      hh = raw + ((fl + sm(0.78, 1, fr)) * STEP - raw) * tw;
    }
    const head = Math.max(0, -x - 60) * 0.3 * (0.75 + 0.35 * Math.sin(z * 0.07 + 1) + 0.2 * Math.sin(z * 0.19));
    const tail = Math.max(0, x - 70) * 0.4;
    hh += head + tail;
    hh += 30 * sm(50, 105, -x) * (0.85 + 0.3 * Math.sin(z * 0.06 + 1)) + 28 * sm(50, 105, -z) * (0.85 + 0.3 * Math.sin(x * 0.07));
    const cliff = 0;
    const d = Math.abs(z - rz(x));
    const w = rw(x);
    const cut = (1 - sm(w - 0.2, w + 1.4, d)) * (1 - sm(60, 72, Math.abs(x - 4)));
    hh -= 0.7 * cut;
    return { h: hh, cliff, raw, b, tw, fl, fr, nz, g, d, w, cut };
  }
  const H = (x, z) => terr(x, z).h;
  const mkRng = (seed) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const C = (h) => new THREE.Color(h);
  const COL = {
    green: C('#5c9e32'), green2: C('#58823a'), gold: C('#cfae48'), bund: C('#4a3e26'), path: C('#9a9460'), riser: C('#8a7650'),
    ochre: C('#a88f6a'), tan: C('#8a6f4c'), stub: C('#b09a58'), red: C('#8a5a3e'), rock: C('#7f705c'), snow: C('#f1f3f6'), gravel: C('#a9a392'), bed: C('#9a9c8e'),
  };

  /* ---------- small helpers ---------- */
  function Rock({ p, s = [1, 0.7, 1], c = '#8a857b', r = [0, 0, 0] }) {
    const M = useM();
    return <mesh position={p} scale={s} rotation={r} material={M.plain(c, { roughness: 1 })} castShadow receiveShadow><dodecahedronGeometry args={[0.5, 0]} /></mesh>;
  }
  function Inst({ geo, mat, items, shadow = false }) {
    const ref = useRef();
    useEffect(() => {
      const o = new THREE.Object3D();
      const col = new THREE.Color();
      items.forEach((it, i) => {
        o.position.set(it.p[0], it.p[1], it.p[2]); o.scale.set(it.s[0], it.s[1], it.s[2]); o.rotation.set(it.rx || 0, it.ry || 0, it.rz || 0);
        o.updateMatrix(); ref.current.setMatrixAt(i, o.matrix);
        if (it.c) { col.set(it.c); ref.current.setColorAt(i, col); }
      });
      ref.current.instanceMatrix.needsUpdate = true;
      if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    }, [items]);
    return <instancedMesh ref={ref} args={[geo, mat, items.length]} frustumCulled={false} castShadow={shadow} />;
  }

  /* carved human figure that crowns each tall post: head, neck, shoulders, arms */
  function Figure({ p, dark, s = 1 }) {
    const M = useM();
    const w = useMemo(() => M.plain(dark ? '#5a4836' : '#b8a68e', { roughness: 0.9 }), [M, dark]);
    const w2 = useMemo(() => M.plain(dark ? '#443426' : '#8c7a64', { roughness: 0.9 }), [M, dark]);
    const eye = useMemo(() => M.plain('#2a2018'), [M]);
    return (
      <group position={p} scale={s}>
        <Box s={[0.3, 0.3, 0.26]} p={[0, 0.15, 0]} m={w2} />
        <Box s={[0.5, 0.58, 0.3]} p={[0, 0.58, 0]} m={w} />
        <Box s={[0.11, 0.52, 0.13]} p={[-0.31, 0.56, 0.02]} m={w2} />
        <Box s={[0.11, 0.52, 0.13]} p={[0.31, 0.56, 0.02]} m={w2} />
        <Box s={[0.14, 0.1, 0.14]} p={[0, 0.92, 0]} m={w2} />
        <Ball rad={0.2} p={[0, 1.17, 0]} sc={[1, 1.2, 1]} m={w} />
        <Box s={[0.36, 0.1, 0.34]} p={[0, 1.42, 0]} m={w2} />
        <Box s={[0.06, 0.12, 0.07]} p={[0, 1.15, 0.2]} m={w2} />
        <Box s={[0.05, 0.04, 0.03]} p={[-0.07, 1.22, 0.2]} m={eye} />
        <Box s={[0.05, 0.04, 0.03]} p={[0.07, 1.22, 0.2]} m={eye} />
      </group>
    );
  }

  /* tall carved timber gateway post: ringed shaft, carved-face block, capital, figure on top */
  function TallPost({ p, dark, board, lean = [0, 0] }) {
    const M = useM();
    const wood = useMemo(() => M.plain(dark ? '#7a6450' : '#a39482', { roughness: 0.9 }), [M, dark]);
    const ring = useMemo(() => M.plain(dark ? '#4a3a2c' : '#7e6f5c', { roughness: 0.9 }), [M, dark]);
    const paint = useMemo(() => M.plain('#d9d6cc', { roughness: 0.9 }), [M]);
    const blue = useMemo(() => M.plain('#3a6fb0', { roughness: 0.8 }), [M]);
    const eye = useMemo(() => M.plain('#241a14'), [M]);
    return (
      <group position={p}>
        <Rock p={[0, 0.2, 0]} s={[1.5, 0.55, 1.5]} />
        <Rock p={[0.55, 0.14, 0.45]} s={[0.8, 0.4, 0.7]} c="#9a9488" />
        <group rotation={[lean[0], 0, lean[1]]}>
          <Cyl rt={0.46} rb={0.52} h={0.5} p={[0, 0.55, 0]} m={wood} seg={10} />
          <Cyl rt={0.4} rb={0.46} h={3.0} p={[0, 2.3, 0]} m={wood} seg={10} />
          {[0.9, 1.35, 1.8, 2.25, 2.7].map((y, i) => <Cyl key={i} rt={0.5 - i * 0.02} rb={0.5 - i * 0.02} h={0.1} p={[0, y, 0]} m={ring} seg={10} />)}
          <Cyl rt={0.42} rb={0.42} h={0.09} p={[0, 1.62, 0]} m={paint} seg={10} />
          <Cyl rt={0.41} rb={0.41} h={0.07} p={[0, 1.54, 0]} m={blue} seg={10} />
          {/* carved face block just below the figure */}
          <Box s={[0.72, 0.62, 0.55]} p={[0, 3.52, 0.02]} m={ring} />
          <Box s={[0.14, 0.08, 0.06]} p={[-0.17, 3.62, 0.31]} m={eye} />
          <Box s={[0.14, 0.08, 0.06]} p={[0.17, 3.62, 0.31]} m={eye} />
          <Box s={[0.1, 0.22, 0.1]} p={[0, 3.5, 0.33]} m={wood} />
          <Box s={[0.3, 0.06, 0.05]} p={[0, 3.3, 0.31]} m={eye} />
          <Cyl rt={0.5} rb={0.42} h={0.18} p={[0, 3.9, 0]} m={ring} seg={10} />
          <Cyl rt={0.3} rb={0.34} h={0.22} p={[0, 4.1, 0]} m={wood} seg={10} />
          <Figure p={[0, 4.2, 0]} dark={false} s={1.7} />
          {board && <group position={[-0.1, 1.25, 0.5]}><Box s={[0.95, 0.36, 0.05]} m={paint} /><Box s={[0.95, 0.07, 0.06]} p={[0, 0.1, 0]} m={blue} /></group>}
        </group>
      </group>
    );
  }

  /* shorter, thicker segmented post (stacked turned discs), slightly leaning */
  function RingPost({ p, lean = [0, 0] }) {
    const M = useM();
    const a = useMemo(() => M.plain('#968a78', { roughness: 0.9 }), [M]);
    const b = useMemo(() => M.plain('#76685a', { roughness: 0.9 }), [M]);
    return (
      <group position={p}>
        <Rock p={[0, 0.18, 0]} s={[1.3, 0.5, 1.3]} c="#948f84" />
        <group rotation={[lean[0], 0, lean[1]]}>
          {Array.from({ length: 15 }, (_, i) => <Cyl key={i} rt={i % 2 ? 0.31 : 0.37} rb={i % 2 ? 0.31 : 0.37} h={0.2} p={[0, 0.45 + i * 0.2, 0]} m={i % 2 ? b : a} seg={10} />)}
          <Ball rad={0.33} p={[0, 3.55, 0]} sc={[1, 0.8, 1]} m={a} />
        </group>
      </group>
    );
  }

  /* leaning dark slate stele: wide slab, chipped top, rubble, sunk into the slope */
  function Stele({ p, h = 2.7, lean = 0.14, leanX = 0, ry = 0, rubble = true }) {
    const M = useM();
    const m = useMemo(() => M.plain('#5c5c58', { roughness: 0.95 }), [M]);
    const m2 = useMemo(() => M.plain('#6c6a64', { roughness: 0.95 }), [M]);
    return (
      <group position={[p[0], p[1] - 0.15, p[2]]} rotation={[0, ry, 0]}>
        <group rotation={[leanX, 0, lean]}>
          <Box s={[0.75, h, 0.26]} p={[0, h / 2, 0]} m={m} />
          <Box s={[0.5, 0.26, 0.26]} p={[-0.13, h + 0.02, 0]} r={[0, 0, 0.35]} m={m} />
          <Box s={[0.28, 0.2, 0.22]} p={[0.2, h - 0.02, 0.02]} r={[0.2, 0, -0.5]} m={m2} />
        </group>
        <Rock p={[0.62, 0.25, 0.4]} s={[0.7, 0.4, 0.5]} c="#9a9488" />
        <Rock p={[-0.6, 0.22, 0.35]} s={[0.55, 0.34, 0.5]} c="#8a857b" />
        <Rock p={[0.25, 0.2, 0.62]} s={[0.4, 0.3, 0.38]} c="#7c776d" />
        {rubble && <Box s={[1.0, 0.18, 0.3]} p={[1.0, 0.2, -0.2]} r={[0, 0.6, 0.12]} m={m} />}
      </group>
    );
  }

  /* ================= MAIN: bridge + gateway ================= */
  function SinjaMain() {
    const M = useM();
    const deck = useMemo(() => M.plain('#9d998d', { roughness: 0.9 }), [M]);
    const curb = useMemo(() => M.plain('#aaa595', { roughness: 0.95 }), [M]);
    const edge = useMemo(() => M.plain('#6c685e', { roughness: 0.95 }), [M]);
    const paint = useMemo(() => M.plain('#e8e6dc', { roughness: 0.9 }), [M]);
    const blueP = useMemo(() => M.plain('#3a6fb0', { roughness: 0.8 }), [M]);
    const wood = useMemo(() => M.plain('#8a7a68', { roughness: 0.9 }), [M]);
    const bush = useMemo(() => M.plain('#5d7a38', { roughness: 1 }), [M]);
    const bush2 = useMemo(() => M.plain('#7d8a46', { roughness: 1 }), [M]);
    const rng = useMemo(() => mkRng(11), []);
    const rocks = useMemo(() => {
      const out = [];
      for (let i = 0; i < 24; i++) {
        const side = i % 2 ? 1 : -1; const end = i % 3 === 0 ? 1 : -1;
        out.push({ p: [side * (1.4 + rng() * 2.6), 0.12 + rng() * 0.2, end * (3.3 + rng() * 2.2)], s: [0.5 + rng() * 0.9, 0.4 + rng() * 0.6, 0.5 + rng() * 0.9], c: ['#8a857b', '#9a9488', '#7c776d', '#a49c8c'][i % 4], r: [rng(), rng() * 3, rng()] });
      }
      return out;
    }, [rng]);
    return (
      <group>
        {/* walkway: rough stone slabs, deck tilted ~7 degrees down toward the viewer (+z) */}
        <group position={[0, 0.62, 0]} rotation={[0.12, 0, 0]}>
          <Box s={[1.7, 0.3, 2.9]} p={[0, 0, -2.9]} m={deck} />
          <Box s={[1.65, 0.3, 2.9]} p={[0.02, 0.03, 0]} r={[0, 0.02, 0.01]} m={deck} />
          <Box s={[1.7, 0.3, 2.9]} p={[0, -0.02, 2.9]} r={[0, -0.015, 0]} m={deck} />
          {[[-0.86, -3.4, 0.9], [0.84, -2.2, 0.7], [-0.84, 0.2, 1.1], [0.86, 1.6, 0.8], [-0.85, 3.2, 1.0], [0.85, 4.0, 0.6]].map(([x, z, l], i) => <Box key={i} s={[0.22, 0.34, l]} p={[x, 0.02, z]} r={[0, (i - 2.5) * 0.04, 0.04 * (i % 2 ? 1 : -1)]} m={edge} />)}
          {[-4.2, -2.5, -0.8, 0.9, 2.6, 4.1].map((z, i) => <Box key={'k' + i} s={[0.3, 0.34, 1.5]} p={[-0.95, 0.3, z]} r={[0, (i % 3 - 1) * 0.03, 0]} m={curb} />)}
          <Box s={[0.3, 0.32, 1.4]} p={[0.95, 0.29, -3.6]} m={curb} />
        </group>
        {/* rubble abutments under the slab ends */}
        <Rock p={[0, 0.5, -4.1]} s={[2.4, 1.0, 1.5]} c="#7c776d" />
        <Rock p={[0, 0.1, 4.6]} s={[2.4, 0.5, 1.4]} c="#8f8a7f" />
        <Rock p={[0, 0.22, 0]} s={[1.6, 0.5, 1.2]} c="#6f6a60" />
        {/* boulder piles at both ends */}
        {[[-1.6, -4.9, 1.1], [1.7, -5.2, 1.2], [-0.4, -5.7, 1.0], [-2.3, 4.7, 1.0], [2.2, 5.1, 1.2], [0.2, 5.8, 0.9], [-1.2, 5.3, 0.7]].map(([x, z, k], i) => <Rock key={'b' + i} p={[x, 0.3 * k, z]} s={[k * 1.3, k * 0.8, k * 1.1]} c={['#8a857b', '#9a9488', '#7c776d'][i % 3]} r={[i * 0.5, i, 0.2]} />)}
        {/* gateway: two tall carved posts, thick lintel at the capital, hanging board on the right post */}
        <TallPost p={[-1.45, 0, -4.4]} dark lean={[0, 0.02]} />
        <TallPost p={[1.45, 0, -4.4]} lean={[0.015, -0.025]} />
        <Box s={[3.4, 0.3, 0.3]} p={[0, 3.92, -4.4]} m={wood} />
        <Box s={[0.34, 0.2, 0.34]} p={[-1.45, 3.92, -4.4]} m={wood} />
        <Box s={[0.34, 0.2, 0.34]} p={[1.45, 3.92, -4.4]} m={wood} />
        <group position={[1.0, 3.38, -4.2]}><Box s={[1.15, 0.5, 0.06]} m={paint} /><Box s={[1.15, 0.1, 0.07]} p={[0, -0.16, 0]} m={blueP} /><Box s={[0.04, 0.3, 0.04]} p={[-0.45, 0.38, 0]} m={wood} /><Box s={[0.04, 0.3, 0.04]} p={[0.45, 0.38, 0]} m={wood} /></group>
        {/* two shorter thick ringed posts at the sides, beside the gateway */}
        <RingPost p={[-2.7, 0, -3.0]} lean={[0.03, 0.05]} />
        <RingPost p={[2.7, 0, -3.2]} lean={[-0.035, -0.04]} />
        {/* a slate stele on the bank */}
        <Stele p={[5.4, 0, -2.4]} h={2.7} lean={0.15} leanX={0.05} ry={0.4} />
        {rocks.map((r, i) => <Rock key={i} {...r} />)}
        {[[-3.6, -6.5], [3.9, -6.4], [-3.8, 5.6], [4.6, 5.8]].map(([x, z], i) => <group key={i} position={[x, 0, z]}><Ball rad={0.55} p={[0, 0.35, 0]} sc={[1.3, 0.8, 1.1]} m={i % 2 ? bush : bush2} /><Ball rad={0.4} p={[0.5, 0.25, 0.2]} m={bush2} /></group>)}
        <Frame s={[14, 17, 16]} p={[0.4, 7, -0.6]} />
      </group>
    );
  }

  /* ================= ENV pieces ================= */
  function Sky() {
    const mat = useMemo(() => new THREE.ShaderMaterial({
      uniforms: { uDusk: { value: 0 } }, side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: 'varying float vT; void main(){ vT = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'varying float vT; uniform float uDusk; void main(){ float t = max(vT,0.0);'
        + ' vec3 dayC = mix(mix(vec3(0.77,0.84,0.90), vec3(0.56,0.73,0.90), smoothstep(0.0,0.25,t)), vec3(0.18,0.44,0.77), smoothstep(0.25,0.85,t));'
        + ' vec3 dk = mix(vec3(0.99,0.74,0.42), vec3(0.78,0.52,0.50), smoothstep(0.0,0.16,t));'
        + ' dk = mix(dk, vec3(0.30,0.26,0.50), smoothstep(0.12,0.55,t)); dk = mix(dk, vec3(0.13,0.12,0.30), smoothstep(0.5,1.0,t));'
        + ' gl_FragColor = vec4(mix(dayC, dk, uDusk), 1.0); }',
    }), []);
    const geo = useMemo(() => new THREE.SphereGeometry(260, 24, 16), []);
    return <mesh geometry={geo} material={mat} onBeforeRender={(r, sc) => { mat.uniforms.uDusk.value = sc.background && sc.background.isColor && sc.background.r < 0.5 ? 1 : 0; }} renderOrder={-10} />;
  }

  function Terrain() {
    const geo = useMemo(() => {
      const SZ = 300, N = 320;
      const g = new THREE.PlaneGeometry(SZ, SZ, N, N); g.rotateX(-Math.PI / 2);
      const p = g.attributes.position; const cols = new Float32Array(p.count * 3);
      const c = new THREE.Color();
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), z = p.getZ(i);
        const t = terr(x, z);
        p.setY(i, t.h);
        // colour
        let hill = c.clone().copy(COL.ochre).lerp(COL.tan, Math.min(1, Math.max(0, t.nz * 0.9 + 0.62 + 0.25 * Math.sin(x * 0.13 - z * 0.09))));
        if (t.g > 0.7 && t.b > 6) hill.lerp(COL.red, Math.min(1, (t.g - 0.7) * 3.3));
        { const fo = Math.sin(x * 0.09 + z * 0.13) + Math.sin(x * 0.17 - z * 0.07 + 1); if (fo > 0.5 && t.b > 5) hill.lerp(C('#4a6a34'), Math.min(0.75, (fo - 0.5) * 0.8) * (z < 0 ? 1 : 0.6)); }
        if (t.h > 20) hill.lerp(COL.rock, sm(20, 30, t.h));
        { const far = sm(48, 80, Math.hypot(x, z)); const th = 34 - 11 * far + t.nz * 3; if (t.h > th) hill.lerp(COL.snow, sm(th, th + 4, t.h) * 0.97); }
        if (t.cliff > 0.4) { const band = Math.floor(t.h * 1.4) % 2; hill.copy(band ? C('#a89a86') : C('#928470')).lerp(COL.red, 0.12 * band); }
        let field;
        if (t.b <= 0) {
          const px = Math.floor((x + 3) / 9), pz = Math.floor((z + 2) / 7);
          const k = (Math.abs(px * 7 + pz * 13)) % 8;
          field = k < 3 ? COL.green : k < 6 ? COL.gold : COL.stub;
          const fx = (x + 3) / 9 - px, fz = (z + 2) / 7 - pz;
          const bund = fx < 0.1 || fz < 0.12;
          const r = Math.hypot(x, z);
          c.copy(bund ? COL.bund : field);
          if (r < 9) c.lerp(COL.path, 1 - sm(4, 9, r));
        } else if (t.cliff > 0.4) c.copy(hill);
        else if (t.tw > 0.02) {
          if (t.fr > 0.78) c.copy(COL.riser);
          else { const k = (t.fl + Math.floor(x / 14)) % 3; c.copy(k === 0 ? COL.gold : k === 1 ? COL.green : COL.stub); }
          c.lerp(hill, 1 - t.tw);
        } else c.copy(hill);
        // river bed and gravel bars
        {
          const gb = 1.0 + 1.0 * (0.5 + 0.5 * Math.sin(x * 0.31 + (z > rz(x) ? 0 : 2))) + 0.9 * (0.5 + 0.5 * Math.sin(x * 0.83 + 1));
          const wm = (1 - sm(60, 72, Math.abs(x - 4)));
          if (t.d < t.w * 0.95) c.copy(COL.bed).lerp(COL.gravel, 0.15);
          else if (t.d < t.w + gb * wm) c.copy(COL.gravel).lerp(c, sm(t.w + gb * wm - 0.5, t.w + gb * wm + 0.3, t.d) * 0.7);
        }
        cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
      }
      g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
      g.computeVertexNormals();
      return g;
    }, []);
    const mat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true }), []);
    return <mesh geometry={geo} material={mat} receiveShadow onBeforeRender={(r, sc) => { const d = sc.background && sc.background.isColor && sc.background.r < 0.5; mat.color.set(d ? '#a0a0b0' : '#ffffff'); }} />;
  }

  function River() {
    const geo = useMemo(() => {
      const pos = [], idx = [];
      const X0 = -64, X1 = 66, n = 180;
      for (let i = 0; i <= n; i++) {
        const x = X0 + (X1 - X0) * (i / n);
        const w = rw(x) * 0.92; const zc = rz(x);
        pos.push(x, -0.3, zc - w, x, -0.3, zc + w);
        if (i < n) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      return g;
    }, []);
    const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8fb0b8', roughness: 0.5, metalness: 0, side: THREE.DoubleSide }), []);
    const foam = useMemo(() => {
      const r = mkRng(5), out = [];
      let tries = 0;
      while (out.length < 18 && tries < 3000) {
        tries++;
        const x = -58 + r() * 120; const zc = rz(x), w = rw(x);
        const narrow = Math.min(1, 2.6 / w);
        if (r() > narrow * narrow) continue;
        const sx = 0.25 + r() * 0.4;
        out.push({ p: [x, -0.255, zc + (r() - 0.5) * w * 1.6], s: [sx, 1, 0.25 + r() * 0.4], ry: r() * 6.28 });
      }
      return out;
    }, []);
    const bars = useMemo(() => [[-24, 0.3, 4.2, 1.6], [16, 0.4, 3.2, 1.2], [34, 0.2, 5, 1.4], [-44, 0.1, 3.6, 1.1]].map(([x, o, l, wd]) => ({ p: [x, -0.3, rz(x) + o * 0.5], s: [l * 0.5, 0.3, wd * 0.5], ry: o })), []);
    const bg = useMemo(() => new THREE.CylinderGeometry(0.5, 0.5, 0.04, 6), []);
    const sg = useMemo(() => new THREE.SphereGeometry(1, 9, 5), []);
    const wm = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f4f8f8', roughness: 0.7 }), []);
    const sandm = useMemo(() => new THREE.MeshStandardMaterial({ color: '#c4bba6', roughness: 1, flatShading: true }), []);
    return <group><mesh geometry={geo} material={mat} /><Inst geo={bg} mat={wm} items={foam} /><Inst geo={sg} mat={sandm} items={bars} /></group>;
  }

  function Trees() {
    const data = useMemo(() => {
      const r = mkRng(77);
      const pines = [], pops = [], bushes = [];
      let tries = 0;
      while (pines.length < 560 && tries < 40000) {
        tries++;
        const x = -110 + r() * 200, z = -110 + r() * 200;
        const t = terr(x, z);
        if (t.b < 4 || t.h < 2.5 || t.h > 42) continue;
        const patch = Math.sin(x * 0.09 + z * 0.13) + Math.sin(x * 0.17 - z * 0.07 + 1);
        if (patch < (z > 0 ? 1.0 : z < -12 ? -0.3 : 1.2)) continue;
        if (Math.hypot(x, z) < 20) continue;
        const s = (z < -12 ? 2.2 : 1.6) + r() * 2.0;
        pines.push({ p: [x, t.h + s * 0.45, z], s: [s * 0.36, s, s * 0.36], ry: r() * 6, c: r() < 0.5 ? '#2e4a2a' : '#284224' });
      }
      for (let i = 0; i < 55; i++) {
        const x = -56 + i * 2.35 + r() * 1.4;
        if (Math.abs(x) < 9) continue;
        const side = r() < 0.5 ? -1 : 1;
        const z = rz(x) + side * (rw(x) + 1.6 + r() * 2.2);
        const t = terr(x, z); const s = 2.2 + r() * 1.6;
        pops.push({ p: [x, t.h + s * 0.55, z], s: [s * 0.32, s * 0.55, s * 0.32], c: r() < 0.5 ? '#5f8f35' : '#74a040' });
      }
      for (let i = 0; i < 70; i++) {
        const x = -90 + r() * 150, z = -70 + r() * 62;
        const t = terr(x, z);
        if (t.b < 1.5 || t.h > 16 || Math.hypot(x, z) < 12) continue;
        const s = 0.6 + r() * 0.7;
        bushes.push({ p: [x, t.h + s * 0.02, z], s: [s * 1.3, s * 0.3, s], c: r() < 0.5 ? '#7a8a3e' : '#8c8a4a', ry: r() * 3 });
      }
      return { pines, pops, bushes };
    }, []);
    const cone = useMemo(() => new THREE.ConeGeometry(1, 1, 7), []);
    const sph = useMemo(() => new THREE.SphereGeometry(1, 9, 7), []);
    const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, flatShading: true }), []);
    return <group>
      <Inst geo={cone} mat={mat} items={data.pines} shadow />
      <Inst geo={sph} mat={mat} items={data.pops} />
      <Inst geo={sph} mat={mat} items={data.bushes} />
    </group>;
  }

  /* Narakot: stone houses with blue tin roofs on the valley floor */
  function Village() {
    const M = useM();
    const wall = useMemo(() => M.plain('#b9ab92', { roughness: 1 }), [M]);
    const wall2 = useMemo(() => M.plain('#cdbd9e', { roughness: 1 }), [M]);
    const blue = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2f6fb3', roughness: 0.55, metalness: 0.3 }), []);
    const door = useMemo(() => M.plain('#3a2a20'), [M]);
    const lit = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffd9a0', emissive: '#ffa640', emissiveIntensity: 1.5 }), []);
    const hs = useMemo(() => [
      [-9, -8.2, 0.2, 3.4, 2.6], [-12.5, -9.6, -0.3, 3.0, 2.4], [-15.5, -8.0, 0.1, 3.6, 2.8], [-18.5, -10.4, 0.4, 3.0, 2.4],
      [-21.5, -8.6, -0.1, 3.4, 2.6], [-14, -12, 0.5, 2.6, 2.2], [-25, -10, 0.2, 3.0, 2.4], [-28, -8, -0.2, 2.6, 2.2],
      [12.5, -6.5, 0.1, 3.4, 2.6], [16.5, -5, -0.2, 3.0, 2.4], [20.5, -7.5, 0.2, 3.2, 2.6], [9.5, -9, 0, 2.8, 2.2],
    ], []);
    return <group>
      {hs.map(([x, z, ry, w, d], i) => {
        const y = H(x, z) - 0.05; const h = 1.7 + (i % 3) * 0.2;
        return <group key={i} position={[x, y, z]} rotation={[0, ry, 0]}>
          <Box s={[w, h, d]} p={[0, h / 2, 0]} m={i % 3 === 1 ? wall2 : wall} />
          <group position={[0, h + 0.1, 0]}>
            <Box s={[w + 0.4, 0.1, d / 2 + 0.3]} p={[0, 0.16, d * 0.22]} r={[0.2, 0, 0]} m={blue} />
            <Box s={[w + 0.4, 0.1, d / 2 + 0.3]} p={[0, 0.16, -d * 0.22]} r={[-0.2, 0, 0]} m={blue} />
          </group>
          <Box s={[0.5, 1.0, 0.06]} p={[-w * 0.25, 0.5, d / 2 + 0.02]} m={door} />
          <Box s={[0.6, 0.5, 0.06]} p={[w * 0.22, h * 0.6, d / 2 + 0.02]} m={lit} />
        </group>;
      })}
      {/* naula: stone fountain with a spout slab */}
      <group position={[-6.5, H(-6.5, -7.5), -7.5]}>
        <Box s={[1.6, 0.5, 0.8]} p={[0, 0.25, 0]} m={wall} />
        <Box s={[1.2, 0.15, 0.55]} p={[0, 0.56, 0]} m={lit} cast={false} />
        <Box s={[0.9, 0.9, 0.2]} p={[0, 0.7, -0.45]} m={wall} />
        <Box s={[0.12, 0.1, 0.4]} p={[0, 0.5, 0.5]} m={wall} />
      </group>
    </group>;
  }

  function Shikhara({ p, s = 1, N = 6, tone = '#9a9588', tone2 = '#b0aa9c' }) {
    const M = useM();
    const st = useMemo(() => M.plain(tone, { roughness: 1 }), [M, tone]);
    const st2 = useMemo(() => M.plain(tone2, { roughness: 1 }), [M, tone2]);
    const dk = useMemo(() => M.plain('#2a2420'), [M]);
    const SH = 0.42;
    const top = 1.35 + N * SH;
    return (
      <group position={p} scale={s}>
        <Box s={[1.5, 0.25, 1.5]} p={[0, 0.12, 0]} m={st2} />
        <Box s={[1.0, 1.0, 1.0]} p={[0, 0.75, 0]} m={st} />
        <Box s={[0.34, 0.55, 0.05]} p={[0, 0.55, 0.52]} m={dk} />
        <Box s={[1.1, 0.1, 1.1]} p={[0, 1.3, 0]} m={st2} />
        {Array.from({ length: N }, (_, i) => {
          const t = i / (N - 1); const w = 0.96 * (1 - Math.pow(t, 1.7) * 0.68); const y = 1.35 + i * SH;
          return <group key={i}>
            <Box s={[w, SH, w]} p={[0, y + SH / 2, 0]} m={i % 2 ? st2 : st} />
            <Box s={[w + 0.07, 0.05, w + 0.07]} p={[0, y + SH, 0]} m={st2} />
          </group>;
        })}
        <Cyl rt={0.34} rb={0.3} h={0.14} p={[0, top + 0.08, 0]} m={st2} seg={12} />
        <Cyl rt={0.3} rb={0.34} h={0.1} p={[0, top + 0.2, 0]} m={st} seg={12} />
        <Ball rad={0.1} p={[0, top + 0.34, 0]} m={st2} />
        <Cyl rt={0.01} rb={0.04} h={0.22} p={[0, top + 0.5, 0]} m={st2} seg={5} />
      </group>
    );
  }

  /* natural rock face on the far bank: irregular outcrop lumps sitting on the slope with a few small dark cave mouths */
  function Cliff() {
    const M = useM();
    const dk = useMemo(() => M.plain('#14100c'), [M]);
    const items = useMemo(() => {
      const r = mkRng(21), out = [], caves = [];
      for (let i = 0; i < 26; i++) {
        const x = -68 + r() * 22, z = -44 - r() * 7;
        const h = H(x, z); const sc = 1.6 + r() * 2.4;
        out.push({ p: [x, h + sc * 0.25, z], s: [sc * 1.6, sc * (0.6 + r() * 0.7), sc * 1.2], c: ['#8a8274', '#9a8f7c', '#7c7466', '#8c7b64'][i % 4], r: [r(), r() * 6, r()] });
      }
      [[-62, -45.5], [-57, -47], [-52, -45], [-65, -49]].forEach(([x, z]) => caves.push({ p: [x, H(x, z) + 0.9, z + 0.8], s: [1.1, 0.8, 0.5] }));
      return { out, caves };
    }, []);
    return <group>
      {items.out.map((q, i) => <Rock key={i} {...q} />)}
      {items.caves.map((q, i) => <mesh key={'c' + i} position={q.p} scale={q.s} material={dk}><sphereGeometry args={[1, 8, 6]} /></mesh>)}
    </group>;
  }

  /* low-poly snow-capped ridge at the head of the valley (-x) and along the far side */
  function SnowPeaks() {
    const M = useM();
    const rock = useMemo(() => new THREE.MeshStandardMaterial({ color: '#6b6c74', roughness: 1, flatShading: true }), []);
    const snow = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f4f6fa', emissive: '#9aa4b8', emissiveIntensity: 0.3, roughness: 0.9, flatShading: true }), []);
    const pk = [[-122, -52, 1.0], [-134, -8, 1.2], [-126, 32, 0.95], [-96, -92, 1.0], [-52, -112, 1.05], [-8, -118, 0.9]];
    return <group>
      {pk.map(([x, z, k], i) => {
        const y = H(x, z) - 4; const h = 34 * k, r = 24 * k;
        return <group key={i} position={[x, y, z]} rotation={[0, i, 0]}>
          <mesh material={rock} position={[0, h / 2, 0]}><coneGeometry args={[r, h, 6]} /></mesh>
          <mesh material={snow} position={[0, h * 0.75, 0]}><coneGeometry args={[r * 0.5, h * 0.5, 6]} /></mesh>
        </group>;
      })}
    </group>;
  }

  /* Yatse: only a low, broken rubble mound on a spur, no standing walls */
  function Fort() {
    const M = useM();
    const st = useMemo(() => M.plain('#9a9286', { roughness: 1 }), [M]);
    const earth = useMemo(() => M.plain('#a58c62', { roughness: 1 }), [M]);
    const x = -12, z = -50;
    const stubs = useMemo(() => {
      const r = mkRng(3), out = [];
      for (let i = 0; i < 10; i++) { const a = i * 0.66 - 0.4; const px = x + Math.cos(a) * 3.4, pz = z + Math.sin(a) * 2.8; const h = 0.35 + r() * 0.3; out.push({ p: [px, H(px, pz) + h / 2 - 0.05, pz], len: 1.4 + r() * 1.2, ry: -a + Math.PI / 2, h }); }
      return out;
    }, []);
    return <group>
      {stubs.map((q, i) => <Box key={i} s={[q.len, q.h, 0.5]} p={q.p} r={[0, q.ry, 0]} m={st} />)}
      <Rock p={[x + 0.3, H(x, z) + 0.2, z + 0.2]} s={[1.6, 0.6, 1.3]} c="#8c8478" />
    </group>;
  }

  function Steles() {
    const pts = useMemo(() => {
      const out = [];
      [[-3, -11], [0.2, -11.4], [3.5, -10.9], [7, -11.5], [10.5, -11]].forEach(([x, z], i) => out.push({ x, z, h: 2.4 + (i % 3) * 0.3, lean: (i % 2 ? -0.1 : 0.14), leanX: (i % 3 - 1) * 0.07, ry: 0.5 * i }));
      [[-26, 12], [-23, 13], [-20, 12.4]].forEach(([x, z], i) => out.push({ x, z, h: 2.5 + i * 0.2, lean: -0.12 + i * 0.12, leanX: 0.08 - i * 0.07, ry: 1 + i }));
      return out;
    }, []);
    return <group>{pts.map((q, i) => <Stele key={i} p={[q.x, H(q.x, q.z), q.z]} h={q.h} lean={q.lean} leanX={q.leanX} ry={q.ry} rubble={i % 2 === 0} />)}</group>;
  }

  function SinjaEnv() {
    const temples = [[26, -22, 0.7, 6, '#9a9588', '#b0aa9c'], [-36, -26, 0.55, 4, '#8a8478', '#a39d8e']];
    return (
      <group>
        <Sky />
        <Terrain />
        <River />
        <Trees />
        <Village />
        <Steles />
        <Cliff />
        <Fort />
        <SnowPeaks />
        {temples.map(([x, z, k, n, a, b], i) => <Shikhara key={i} p={[x, H(x, z) - 0.05, z]} s={k} N={n} tone={a} tone2={b} />)}
      </group>
    );
  }

  return { 'sinja-valley': { Main: SinjaMain, Env: SinjaEnv } };
}
