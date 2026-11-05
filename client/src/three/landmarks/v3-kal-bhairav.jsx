// Kal Bhairav, Hanuman Dhoka / Kathmandu Durbar Square: a ~3 m black-stone six-armed wrathful Shiva, vermilion-smeared,
// standing in a pointed black stone arch with a red-orange flame halo and a teal field, trampling a prostrate demon,
// flanked by two weathered stone lions (one painted white), with a railing, lamp table and bell in front. The image sits in a
// stone bay at the corner of the palace under a two-tier red-fringed pent roof with three gold finials. Vishnu, Indrapur and
// Degu Taleju pagodas stand off to the left on the flagstone square. Front = +z.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Gajur, Frame, GroundDisc, Tree, THREE, useMemo, useRef, useEffect } = K;

  const BLACK = '#1c1b1c', VERM = '#b3261b', BONE = '#efe7d3', GOLDC = '#d1a62a';

  /* ---------- instanced boxes / spheres / cylinders ---------- */
  function Inst({ items, m, kind = 'box', cast = false }) {
    const ref = useRef();
    useEffect(() => {
      if (!ref.current) return;
      const o = new THREE.Object3D();
      items.forEach((it, i) => {
        o.position.set(it[0], it[1], it[2]); o.rotation.set(0, it[6] || 0, 0); o.scale.set(it[3], it[4], it[5]);
        o.updateMatrix(); ref.current.setMatrixAt(i, o.matrix);
      });
      ref.current.instanceMatrix.needsUpdate = true;
    }, [items]);
    return (
      <instancedMesh ref={ref} args={[null, null, items.length]} material={m} castShadow={cast} receiveShadow frustumCulled={false}>
        {kind === 'box' ? <boxGeometry args={[1, 1, 1]} /> : kind === 'cyl' ? <cylinderGeometry args={[0.5, 0.5, 1, 10]} /> : <sphereGeometry args={[0.5, 10, 8]} />}
      </instancedMesh>
    );
  }

  /** Cylinder limb from point a (radius r1) to point b (radius r2). */
  function Limb({ a, b, r1 = 0.17, r2 = 0.14, m, seg = 8 }) {
    const { pos, q, len } = useMemo(() => {
      const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
      const d = B.clone().sub(A); const l = d.length();
      const qq = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
      return { pos: A.clone().add(B).multiplyScalar(0.5).toArray(), q: qq, len: l };
    }, [a, b]);
    return (
      <mesh position={pos} quaternion={q} material={m} castShadow receiveShadow>
        <cylinderGeometry args={[r2, r1, len, seg]} />
      </mesh>
    );
  }

  function archShape(hw, sp, apex, y0 = 0) {
    const s = new THREE.Shape();
    const k = apex - sp;
    s.moveTo(-hw, y0); s.lineTo(-hw, sp);
    s.bezierCurveTo(-hw, sp + k * 0.62, -hw * 0.28, apex - k * 0.1, 0, apex);
    s.bezierCurveTo(hw * 0.28, apex - k * 0.1, hw, sp + k * 0.62, hw, sp);
    s.lineTo(hw, y0); s.closePath();
    return s;
  }
  function archFrameGeo(o, i, depth, y0 = -0.3) {
    const s = archShape(o[0], o[1], o[2], y0);
    const h = new THREE.Path(); h.setFromPoints(archShape(i[0], i[1], i[2]).getPoints(24).reverse()); s.holes.push(h);
    return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
  }

  /* ---------- static item lists ---------- */
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  // skull garland: V from the shoulders to the thighs
  const GARLAND = [];
  for (let i = 0; i <= 17; i += 1) {
    const t = i / 17;
    GARLAND.push([-1.0 + 2.0 * t, 3.75 - 2.45 * Math.sin(Math.PI * t) ** 0.85, 0.68 + 0.2 * Math.sin(Math.PI * t), 0.24, 0.26, 0.24]);
  }
  const BELT = [-0.7, -0.45, -0.2, 0.05, 0.3, 0.55, 0.75].map((x) => [x * 0.95, 2.05, 0.62, 0.17, 0.18, 0.17]);
  const SPLASH = (() => { const r = rng(31); const a = []; for (let i = 0; i < 14; i += 1) { const w = 0.08 + r() * 0.34, h = 0.06 + r() * 0.3; a.push([-1.0 + r() * 2.0, 2.4 + r() * 1.5, 0.71 + (i % 3) * 0.004, w, h, 0.03, (r() - 0.5) * 0.8]); } return a; })();
  // vermilion along the arms, down the belly and on the lower edge of the niche
  const SPLASH2 = (() => { const r = rng(44); const a = []; for (let i = 0; i < 11; i += 1) { const s = i % 2 ? 1 : -1; const t = r(); a.push([s * (1.2 + t * 0.9), 3.0 + r() * 1.3, 0.5 + t * 0.25, 0.12 + r() * 0.22, 0.08 + r() * 0.16, 0.12, (r() - 0.5)]); } for (let i = 0; i < 4; i += 1) a.push([-0.35 + r() * 0.7, 1.9 + r() * 0.9, 0.78, 0.1 + r() * 0.2, 0.2 + r() * 0.4, 0.03, (r() - 0.5) * 0.5]); return a; })();
  const BASESPL = (() => { const r = rng(12); const a = []; for (let i = 0; i < 12; i += 1) a.push([-2.7 + r() * 5.4, 0.33 + r() * 0.1, 1.66, 0.2 + r() * 0.5, 0.08 + r() * 0.12, 0.04, (r() - 0.5) * 0.3]); return a; })();

  // lamp stands: rows of dark brass cups on the offering table, with uneven flames
  const CUPS = [], FLAMES = [];
  { const r = rng(5);
    for (let rw = 0; rw < 3; rw += 1) for (let i = 0; i < 15; i += 1) {
      const x = -1.9 + i * 0.27 + (r() - 0.5) * 0.04, z = 2.75 + rw * 0.3 + (r() - 0.5) * 0.04, y = 0.7 + rw * 0.06;
      CUPS.push([x, y, z, 0.12, 0.07, 0.12]);
      if ((i + rw) % 3 !== 1 && r() > 0.12) { const fh = 0.08 + r() * 0.17; FLAMES.push([x + (r() - 0.5) * 0.03, y + 0.05 + fh / 2, z, 0.05 + r() * 0.03, fh, 0.05 + r() * 0.03]); }
    } }
  const MARIGA = (() => { const r = rng(7); const a = []; for (let i = 0; i < 6; i += 1) a.push([-1.7 + r() * 3.4, 0.7, 3.2 + r() * 0.3, 0.16 + r() * 0.07, 0.1, 0.16]); return a; })();
  const MARIGB = (() => { const r = rng(17); const a = []; for (let i = 0; i < 4; i += 1) a.push([-1.5 + r() * 3.0, 0.7, 3.2 + r() * 0.3, 0.16 + r() * 0.05, 0.1, 0.16]); return a; })();
  const FLAMEH = FLAMES.map((f) => [f[0], f[1], f[2], 0.3, 0.3, 0.3]);
  const MARIG2 = (() => { const r = rng(9); const a = []; for (let i = 0; i < 6; i += 1) a.push([-3.2 + r() * 1.0, 0.2, 5 + r() * 0.8, 0.2, 0.12, 0.2]); return a; })();
  const POSTS = []; for (let i = 0; i <= 18; i += 1) POSTS.push([-5.85 + i * 0.65, 0.3, 4.1, 0.06, 0.6, 0.06]);
  // carved studs along the black arch frame, alternating red and gold
  const STUDSR = [], STUDSG = [];
  archShape(2.6, 3.9, 6.7, 0).getPoints(60).forEach((p, i) => { if (i % 2 === 0 && p.y > 0.3) (i % 4 === 0 ? STUDSR : STUDSG).push([p.x, p.y, 0.4, 0.17, 0.22, 0.1]); });
  const SPIKES = (() => {
    const a = []; const N = 46;
    for (let i = 0; i < N; i += 1) a.push(-Math.PI * 0.3 + (i / (N - 1)) * Math.PI * 1.6);
    return a;
  })();

  /* ---------- the sculpture ---------- */
  function Figure() {
    const M = useM();
    const blk = M.plain(BLACK, { roughness: 0.55, metalness: 0.15 });
    const blk2 = M.plain('#2f2c2c', { roughness: 0.7 });
    const red = M.plain(VERM, { roughness: 0.85 });
    const redD = M.plain('#7c150f', { roughness: 0.85 });
    const skirt = M.plain('#2a1210', { roughness: 0.9 });
    const bone = M.plain(BONE, { roughness: 0.6 });
    const gold = M.plain(GOLDC, { roughness: 0.35, metalness: 0.7 });
    const steel = M.plain('#1b1d21', { roughness: 0.3, metalness: 0.6 });
    const edge = M.plain('#8a8f97', { roughness: 0.3, metalness: 0.7 });
    const dem = M.plain('#74211a', { roughness: 0.85 });
    const demR = M.plain('#4e130d', { roughness: 0.85 });
    const demF = M.plain('#d9b9a0', { roughness: 0.7 });
    const sock = M.plain('#240808', { roughness: 0.6 });
    const white = M.plain('#f4f1ea', { roughness: 0.3 });
    const flesh = M.plain('#c99a78', { roughness: 0.7 });
    const eyeRim = M.plain('#a8180f', { roughness: 0.6 });
    const S = [-1, 1];
    const sw = 0.7, dx = -Math.sin(sw), dy = Math.cos(sw);
    const H = [-1.7, 4.5, 0.5];

    return (
      <group position={[0, 0.5, 0.35]} scale={1.05}>
        {/* the prostrate demon trampled underfoot: head, torso, arms and bent legs */}
        <group position={[0, -0.1, 1.2]} scale={1.4}>
          <Ball rad={0.3} p={[-2.12, 0.24, 0.28]} sc={[1, 0.7, 1]} m={demF} />
          <Box s={[1.7, 0.5, 1.0]} p={[-0.9, 0.03, 0]} m={dem} />
          <Box s={[0.9, 0.34, 0.8]} p={[0.15, -0.02, 0]} m={dem} />
          <Ball rad={0.42} p={[-2.1, 0.06, 0.05]} sc={[1, 0.9, 1]} m={dem} />
          <Box s={[0.14, 0.12, 0.14]} p={[-2.35, 0.05, 0.3]} m={demR} />
          <Ball rad={0.2} p={[-2.3, 0.2, -0.1]} sc={[1, 0.6, 1]} m={blk} />
          <Limb a={[-1.55, 0.02, 0.4]} b={[-2.15, -0.02, 0.95]} r1={0.15} r2={0.12} m={dem} />
          <Limb a={[-2.15, -0.02, 0.95]} b={[-2.6, 0.02, 0.8]} r1={0.12} r2={0.1} m={dem} />
          <Limb a={[-1.4, 0.02, -0.4]} b={[-2.0, 0.0, -0.9]} r1={0.15} r2={0.12} m={dem} />
          <Limb a={[0.3, 0, 0.1]} b={[1.4, 0.12, 0.35]} r1={0.22} r2={0.18} m={dem} />
          <Limb a={[1.4, 0.12, 0.35]} b={[2.1, -0.05, 0.95]} r1={0.17} r2={0.13} m={dem} />
          <Limb a={[0.3, 0, -0.1]} b={[1.3, 0.1, -0.45]} r1={0.2} r2={0.16} m={dem} />
          <Limb a={[1.3, 0.1, -0.45]} b={[2.0, -0.05, -0.2]} r1={0.16} r2={0.12} m={dem} />
          {[[-1.2, 0.2, 0.15, 0.7, 0.04, 0.5], [0.3, 0.17, 0.0, 0.5, 0.04, 0.4], [-2.05, 0.3, 0.1, 0.3, 0.05, 0.3]].map((q, i) => <Box key={i} s={[q[3], q[4], q[5]]} p={[q[0], q[1], q[2]]} m={demR} />)}
        </group>

        {/* legs: wide fighting stance, thighs splayed, knees bent outward */}
        {S.map((s) => (
          <group key={s}>
            <Limb a={[s * 0.45, 1.95, 0.05]} b={[s * 1.3, 1.1, 0.6]} r1={0.5} r2={0.38} m={blk} />
            <Ball rad={0.33} p={[s * 1.3, 1.1, 0.6]} m={blk} />
            <Limb a={[s * 1.3, 1.1, 0.6]} b={[s * 1.45, 0.3, 0.42]} r1={0.3} r2={0.22} m={blk} />
            <Box s={[0.85, 0.24, 1.05]} p={[s * 1.45, 0.14, 0.62]} m={blk} />
            {[-0.28, 0, 0.28].map((t) => <Ball key={t} rad={0.12} p={[s * 1.45 + t, 0.14, 1.15]} m={blk} />)}
            <Cyl rt={0.26} h={0.1} p={[s * 1.44, 0.5, 0.42]} m={gold} seg={10} />
            <Ball rad={0.1} p={[s * 1.44, 0.5, 0.7]} m={bone} />
          </group>
        ))}

        {/* draped red skirt and belt */}
        <group position={[0, 1.65, 0.15]} scale={[1, 1, 0.66]}>
          <Cyl rt={0.5} rb={0.78} h={0.6} m={skirt} seg={12} />
        </group>
        <Box s={[0.5, 0.95, 0.1]} p={[0, 1.2, 0.72]} r={[0.12, 0, 0]} m={skirt} />
        <Box s={[0.4, 0.7, 0.1]} p={[-0.55, 1.3, 0.62]} r={[0.1, 0, 0.2]} m={skirt} />
        <Box s={[0.4, 0.7, 0.1]} p={[0.55, 1.3, 0.62]} r={[0.1, 0, -0.2]} m={skirt} />
        <group position={[0, 2.05, 0.15]} scale={[1, 1, 0.7]}><Cyl rt={0.86} rb={0.86} h={0.16} m={gold} seg={12} /></group>

        {/* broad muscular torso, chest about 2.2 m wide */}
        <Box s={[1.55, 0.7, 0.85]} p={[0, 2.5, 0.15]} m={blk} />
        <Box s={[2.2, 1.15, 0.9]} p={[0, 3.3, 0.15]} m={blk} />
        {S.map((s) => <Box key={s} s={[0.98, 0.8, 0.12]} p={[s * 0.52, 3.4, 0.62]} m={blk2} />)}
        <Box s={[1.2, 0.5, 0.1]} p={[0, 2.55, 0.6]} m={blk2} />
        <Cyl rt={0.32} rb={0.42} h={0.35} p={[0, 3.98, 0.15]} m={blk} seg={10} />
        {S.map((s) => <Ball key={s} rad={0.38} p={[s * 1.2, 3.6, 0.1]} m={blk} />)}

        {/* six arms */}
        {S.map((s) => (
          <group key={s}>
            {/* upper: raised, elbow out */}
            <Limb a={[s * 1.2, 3.65, 0.1]} b={[s * 2.05, 4.05, 0.35]} r1={0.28} r2={0.22} m={blk} />
            <Limb a={[s * 2.05, 4.05, 0.35]} b={[s * 1.7, 4.5, 0.5]} r1={0.22} r2={0.19} m={blk} />
            <Ball rad={0.22} p={[s * 1.7, 4.5, 0.5]} m={blk} />
            {/* middle: out and gripping */}
            <Limb a={[s * 1.1, 3.25, 0.15]} b={[s * 2.05, 3.0, 0.5]} r1={0.27} r2={0.21} m={blk} />
            <Limb a={[s * 2.05, 3.0, 0.5]} b={[s * 2.4, 3.2, 0.7]} r1={0.21} r2={0.18} m={blk} />
            <Ball rad={0.22} p={[s * 2.4, 3.2, 0.7]} m={blk} />
            {/* lower: in front of the chest */}
            <Limb a={[s * 1.05, 2.95, 0.2]} b={[s * 1.3, 2.45, 0.6]} r1={0.24} r2={0.19} m={blk} />
            <Limb a={[s * 1.3, 2.45, 0.6]} b={[s * 0.7, 2.35, 0.98]} r1={0.19} r2={0.16} m={blk} />
            <Ball rad={0.18} p={[s * 0.7, 2.35, 0.98]} m={blk} />
            <Ball rad={0.22} sc={[1, 0.45, 1]} p={[s * 2.05, 4.05, 0.35]} m={gold} />
          </group>
        ))}
        {/* the long sword: upper left hand grips the hilt, blade angled up and out about 40 degrees */}
        <Box s={[0.15, 0.55, 0.15]} p={[H[0] - dx * 0.0, H[1] + 0.0, H[2] + 0.02]} r={[0, 0, sw]} m={gold} />
        <Ball rad={0.13} p={[H[0] + dx * 0.4, H[1] - dy * 0.4, H[2]]} m={gold} />
        <Box s={[0.6, 0.09, 0.14]} p={[H[0] - dx * 0.3, H[1] + dy * 0.3, H[2]]} r={[0, 0, sw]} m={gold} />
        <Box s={[0.26, 2.3, 0.07]} p={[H[0] - dx * 1.5, H[1] + dy * 1.5, H[2]]} r={[0, 0, sw]} m={steel} />
        <Box s={[0.04, 2.3, 0.09]} p={[H[0] - dx * 1.5 + 0.1, H[1] + dy * 1.5 + 0.08, H[2]]} r={[0, 0, sw]} m={edge} cast={false} />
        {/* trident: the shaft passes through the fist of the middle left hand */}
        <Limb a={[-2.15, 1.0, 0.7]} b={[-2.15, 4.2, 0.7]} r1={0.06} r2={0.06} m={steel} />
        <Ball rad={0.25} p={[-2.15, 3.2, 0.7]} m={blk} />
        <Cyl rt={0.14} h={0.1} p={[-2.15, 3.45, 0.7]} m={gold} seg={8} />
        <Box s={[0.55, 0.07, 0.07]} p={[-2.15, 4.15, 0.7]} m={gold} />
        {[-0.24, 0, 0.24].map((x, i) => <mesh key={i} position={[-2.15 + x, 4.5 + (i === 1 ? 0.1 : 0), 0.7]} material={gold} castShadow><coneGeometry args={[0.065, i === 1 ? 0.75 : 0.55, 6]} /></mesh>)}
        {/* red disc held in the upper right hand */}
        <Cyl rt={0.55} h={0.08} p={[1.7, 5.05, 0.5]} r={[Math.PI / 2, 0, 0]} m={red} seg={20} />
        <Cyl rt={0.32} h={0.1} p={[1.7, 5.05, 0.52]} r={[Math.PI / 2, 0, 0]} m={gold} seg={16} />
        {/* severed head held by the hair in the middle right hand */}
        <Limb a={[2.15, 3.15, 0.7]} b={[2.15, 2.6, 0.7]} r1={0.03} r2={0.03} m={blk} />
        <Ball rad={0.28} p={[2.15, 2.32, 0.7]} sc={[0.9, 1.05, 0.9]} m={flesh} />
        <Ball rad={0.11} p={[2.15, 2.6, 0.7]} m={blk} />
        {S.map((s, i) => <Ball key={i} rad={0.04} p={[2.15 + s * 0.09, 2.36, 0.94]} m={blk} />)}
        {/* skull cup and bowl in the lower hands */}
        <Ball rad={0.17} p={[-0.7, 2.5, 0.98]} m={bone} />
        <Cyl rt={0.2} rb={0.12} h={0.16} p={[0.7, 2.5, 0.98]} m={gold} seg={10} />

        {/* HEAD: red-rimmed face, heavy brows, bulging eyes, fanged mouth, gold skull crown */}
        <group position={[0, 4.4, 0.2]} scale={1.1}>
          <Box s={[1.35, 1.2, 0.1]} p={[0, 0, 0.0]} m={redD} />
          <Box s={[1.1, 1.0, 0.8]} p={[0, 0, 0.25]} m={blk} />
          <Box s={[0.95, 0.35, 0.7]} p={[0, -0.5, 0.28]} m={blk} />
          {S.map((s) => (
            <group key={s}>
              <Ball rad={0.22} p={[s * 0.29, 0.06, 0.62]} m={eyeRim} />
              <Ball rad={0.19} p={[s * 0.29, 0.06, 0.66]} m={sock} />
              <Ball rad={0.115} p={[s * 0.29, 0.05, 0.78]} m={white} />
              <Ball rad={0.06} p={[s * 0.29, 0.04, 0.88]} m={M.plain('#050505')} />
              <Box s={[0.6, 0.17, 0.2]} p={[s * 0.3, 0.3, 0.7]} r={[0, 0, s * 0.35]} m={blk2} />
              <Box s={[0.14, 0.45, 0.25]} p={[s * 0.62, 0, 0.2]} m={blk} />
              <Ball rad={0.15} p={[s * 0.7, -0.22, 0.2]} m={gold} />
              <Box s={[0.1, 0.34, 0.12]} p={[s * 0.7, -0.5, 0.2]} m={gold} />
            </group>
          ))}
          <Box s={[0.22, 0.34, 0.26]} p={[0, -0.12, 0.76]} m={blk2} />
          <Box s={[0.8, 0.09, 0.12]} p={[0, -0.24, 0.72]} m={blk2} />
          <Box s={[0.62, 0.3, 0.1]} p={[0, -0.45, 0.66]} m={sock} />
          <Box s={[0.34, 0.12, 0.06]} p={[0, -0.54, 0.72]} m={eyeRim} />
          {[-0.2, -0.07, 0.07, 0.2].map((x, i) => <mesh key={i} position={[x, -0.36, 0.73]} rotation={[Math.PI, 0, 0]} material={bone}><coneGeometry args={[0.04, 0.16, 4]} /></mesh>)}
          {[-0.26, 0.26].map((x, i) => <mesh key={i} position={[x, -0.52, 0.73]} material={bone}><coneGeometry args={[0.05, 0.2, 4]} /></mesh>)}
          {/* crown with white skulls and a central male face */}
          <Box s={[1.25, 0.3, 0.85]} p={[0, 0.62, 0.22]} m={gold} />
          <Box s={[1.7, 0.62, 0.1]} p={[0, 0.98, 0.05]} m={gold} />
          <Box s={[1.1, 0.4, 0.1]} p={[0, 1.42, 0.03]} m={gold} />
          {[-0.55, -0.28, 0.28, 0.55].map((x, i) => <Ball key={i} rad={0.11} p={[x, 0.95 - Math.abs(x) * 0.1, 0.5]} m={bone} />)}
          <Ball rad={0.18} p={[0, 0.98, 0.52]} m={flesh} />
          {[-0.55, -0.28, 0, 0.28, 0.55].map((x, i) => <mesh key={i} position={[x, 1.72 + (2 - Math.abs(i - 2)) * 0.07, 0.1]} material={gold}><coneGeometry args={[0.1, 0.35, 4]} /></mesh>)}
        </group>

        {/* skull garland, belt, vermilion smears */}
        <Inst items={GARLAND} m={bone} kind="ball" />
        <Inst items={BELT} m={bone} kind="ball" />
        <Inst items={SPLASH} m={redD} />
        <Inst items={SPLASH2} m={redD} />
        <Box s={[0.5, 0.24, 0.03]} p={[-0.2, 4.1, 1.1]} m={red} />
        <Box s={[0.5, 0.2, 0.03]} p={[0.4, 4.1, 1.1]} m={red} />
      </group>
    );
  }

  /* ---------- arched niche: teal field in the upper arch, big flame halo, black carved arch ---------- */
  function Niche() {
    const M = useM();
    const outer = useMemo(() => archFrameGeo([2.95, 3.9, 7.0], [2.4, 3.9, 6.45], 0.4), []);
    const goldBand = useMemo(() => archFrameGeo([2.85, 3.9, 6.9], [2.75, 3.9, 6.8], 0.04, 0), []);
    const redEdge = useMemo(() => archFrameGeo([2.4, 3.9, 6.45], [2.24, 3.9, 6.29], 0.05, 0), []);
    const inner = useMemo(() => new THREE.ShapeGeometry(archShape(2.4, 3.9, 6.45), 24), []);
    const blk = M.plain('#171617', { roughness: 0.8 });
    const teal = M.plain('#2a8fa0', { roughness: 0.8, side: THREE.DoubleSide, emissive: '#0f5560', emissiveIntensity: 0.6 });
    const wash = M.plain('#4aa9c8', { roughness: 0.8, emissive: '#16566e', emissiveIntensity: 0.5 });
    const orange = M.plain('#d9501c', { roughness: 0.8, emissive: '#6a1a05', emissiveIntensity: 0.6 });
    const red = M.plain('#c22d1f', { roughness: 0.8, emissive: '#5a0e08', emissiveIntensity: 0.7 });
    const redD = M.plain('#8e1a14', { roughness: 0.8 });
    const lowred = M.plain('#4a1612', { roughness: 0.9 });
    const gold = M.plain('#d1a62a', { roughness: 0.4, metalness: 0.6 });
    const studR = M.plain('#b3261b', { roughness: 0.8 });
    const studG = M.plain('#d1a62a', { roughness: 0.4, metalness: 0.6 });
    const CY = 4.85;
    return (
      <group position={[0, 0, -0.28]}>
        <mesh geometry={inner} material={teal} position={[0, 0, 0.1]} receiveShadow />
        <Box s={[4.7, 3.1, 0.02]} p={[0, 1.55, 0.112]} m={lowred} cast={false} />
        <mesh position={[0, CY, 0.115]} material={wash}><circleGeometry args={[1.95, 44]} /></mesh>
        {SPIKES.map((a, i) => (
          <mesh key={i} position={[Math.cos(a) * 1.72, CY + Math.sin(a) * 1.72, 0.13]} rotation={[0, 0, a - Math.PI / 2]} material={i % 2 ? orange : red}>
            <coneGeometry args={[0.18, 0.5, 3]} />
          </mesh>
        ))}
        <mesh position={[0, CY, 0.14]} material={orange}><circleGeometry args={[1.62, 44]} /></mesh>
        <mesh position={[0, CY, 0.15]} material={red}><ringGeometry args={[1.2, 1.58, 44]} /></mesh>
        <mesh position={[0, CY, 0.16]} material={redD}><ringGeometry args={[1.08, 1.14, 44]} /></mesh>
        <mesh geometry={outer} material={blk} castShadow receiveShadow />
        <mesh geometry={goldBand} material={gold} position={[0, 0, 0.4]} />
        <mesh geometry={redEdge} material={red} position={[0, 0, 0.36]} />
        <Inst items={STUDSR} m={studR} />
        <Inst items={STUDSG} m={studG} />
      </group>
    );
  }

  /* ---------- guardian stone lion: heavy, crouched, weathered, curled mane ---------- */
  function StoneLion({ p, r = 0, white = false }) {
    const M = useM();
    const m = white ? M.plain('#4f4d4a', { roughness: 0.9 }) : M.plain('#3b3a38', { roughness: 0.95 });
    const mane = white ? M.plain('#6a665f', { roughness: 0.9 }) : M.plain('#3a3836', { roughness: 0.95 });
    const lite = white ? M.plain('#8a857c', { roughness: 0.9 }) : M.plain('#55524e', { roughness: 0.95 });
    const dk = M.plain('#0e0d0d');
    const rd = M.plain('#a8211a', { roughness: 0.85 });
    const tooth = M.plain('#efe9dc');
    const base = M.mat('granite', 1, 1, { color: '#6a625a' });
    const HC = [0, 1.65, 0.4];
    const curls = useMemo(() => {
      const a = [];
      [[0.72, 11, 0], [0.88, 13, -0.1]].forEach(([rad, n, dz], row) => {
        for (let i = 0; i < n; i += 1) {
          const ang = -0.05 * Math.PI + (i / (n - 1)) * Math.PI * 1.1;
          a.push({ x: Math.cos(ang) * rad, y: Math.sin(ang) * rad * 0.9, z: dz + (i % 2) * 0.05, a: ang, row });
        }
      });
      return a;
    }, []);
    return (
      <group position={p} rotation={[0, r, 0]} scale={1.05}>
        <Box s={[1.4, 0.4, 1.6]} p={[0, 0.2, 0.1]} m={base} />
        <Box s={[1.5, 0.08, 1.7]} p={[0, 0.43, 0.1]} m={lite} cast={false} />
        {/* crouched haunches and leaning chest */}
        <Ball rad={0.56} p={[0, 0.95, -0.4]} sc={[1.25, 0.95, 1.0]} m={m} />
        {[-0.42, 0.42].map((x) => <Ball key={x} rad={0.34} p={[x, 0.7, -0.35]} sc={[0.8, 1, 1.2]} m={m} />)}
        <Ball rad={0.56} p={[0, 1.3, 0.12]} sc={[1, 1.05, 0.95]} m={m} />
        <Box s={[0.5, 0.5, 0.5]} p={[0, 0.75, 0.38]} r={[-0.3, 0, 0]} m={m} />
        {[-0.3, 0.3].map((x) => (<group key={x}><Box s={[0.24, 1.0, 0.26]} p={[x, 0.95, 0.68]} m={m} /><Box s={[0.3, 0.12, 0.42]} p={[x, 0.5, 0.78]} m={lite} /><Box s={[0.08, 0.5, 0.2]} p={[x + Math.sign(x) * 0.14, 0.95, 0.6]} m={lite} cast={false} /></group>))}
        <Box s={[0.16, 0.7, 0.14]} p={[0, 0.95, -0.95]} r={[0.5, 0, 0]} m={m} />
        <Ball rad={0.18} p={[0, 1.3, -1.0]} sc={[1, 1, 0.8]} m={mane} />
        {/* big, wide head: flat snout, heavy brow, small deep eyes, bared fangs */}
        <Ball rad={0.56} p={[0, 1.75, 0.45]} sc={[1.1, 0.95, 0.9]} m={m} />
        <Box s={[0.72, 0.34, 0.46]} p={[0, 1.59, 1.0]} m={m} />
        <Box s={[0.84, 0.12, 0.2]} p={[0, 1.45, 1.08]} m={dk} />
        <Box s={[0.9, 0.2, 0.42]} p={[0, 2.01, 0.88]} m={mane} />
        <Box s={[0.3, 0.3, 0.3]} p={[0, 1.8, 1.18]} m={lite} />
        {[-0.24, 0.24].map((x) => (<group key={x}><Ball rad={0.06} p={[x, 1.89, 1.02]} m={dk} /><Box s={[0.3, 0.1, 0.2]} p={[x, 1.97, 1.0]} r={[0, 0, -Math.sign(x) * 0.35]} m={mane} /><Box s={[0.14, 0.2, 0.12]} p={[x * 2.15, 2.23, 0.4]} m={m} /></group>))}
        {[-0.28, -0.14, 0, 0.14, 0.28].map((x) => <mesh key={x} position={[x, 1.45, 1.17]} rotation={[Math.PI, 0, 0]} material={tooth}><coneGeometry args={[0.04, 0.16, 4]} /></mesh>)}
        {[-0.34, 0.34].map((x) => <mesh key={x} position={[x, 1.65, 1.2]} material={tooth}><coneGeometry args={[0.04, 0.14, 4]} /></mesh>)}
        {/* mane: three rows of flat carved curls around and behind the head */}
        {curls.map((c, i) => <Box key={i} s={[0.26, 0.2, 0.14]} p={[HC[0] + c.x, HC[1] + c.y * 0.9, HC[2] + c.z - 0.12 - c.row * 0.06]} r={[0, 0, c.a - Math.PI / 2]} m={c.row === 1 ? lite : mane} cast={false} />)}
        {white && (
          <group>
            <Box s={[0.3, 0.2, 0.04]} p={[0.05, 2.05, 0.95]} r={[-0.3, 0, 0.2]} m={rd} />
            <Box s={[0.3, 0.3, 0.04]} p={[-0.25, 1.2, 0.86]} r={[0.2, 0, 0.1]} m={tooth} />
            <Box s={[0.26, 0.2, 0.04]} p={[0.2, 1.0, 0.9]} r={[0.2, 0, -0.2]} m={tooth} />
            <Box s={[0.34, 0.3, 0.04]} p={[0.0, 1.25, 0.9]} r={[0.2, 0, -0.15]} m={rd} />
            <Box s={[0.2, 0.18, 0.04]} p={[0.22, 0.75, 0.88]} r={[0.2, 0, 0.3]} m={rd} />
          </group>
        )}
      </group>
    );
  }

  /* ---------- Main ---------- */
  function KalBhairavMain() {
    const M = useM();
    const slab = M.plain('#4a4540', { roughness: 0.95 });
    const slab2 = M.plain('#3a3631', { roughness: 0.95 });
    const panel = M.plain('#2c2824', { roughness: 0.95 });
    const tile = M.mat('roof', 4, 2, { color: '#c9a08a' });
    const iron = M.plain('#161515', { roughness: 0.5, metalness: 0.5 });
    const stone = M.plain('#6f675e', { roughness: 0.95 });
    const fringe = M.plain('#a8211a', { roughness: 0.85 });
    const wood = M.plain('#3a2415', { roughness: 0.85 });
    const brass = M.plain('#c9a227', { roughness: 0.3, metalness: 0.8 });
    const cup = M.plain('#6b4a1a', { roughness: 0.4, metalness: 0.6 });
    const flame = <meshBasicMaterial color="#ffb347" toneMapped={false} />;
    const bulb = <meshBasicMaterial color="#fff0b8" toneMapped={false} />;
    const marig = M.plain('#f2a516', { roughness: 0.8 });
    const marigR = M.plain('#e2561a', { roughness: 0.8 });
    const verm = M.plain('#a8211a', { roughness: 0.9 });
    return (
      <group>
        <Frame s={[13, 9.6, 6.6]} p={[0, 4.8, 1.8]} />
        {/* weathered grey stone bay with carved panels, set forward of the brick wing */}
        <Box s={[7.2, 7.4, 0.8]} p={[0, 3.7, -0.65]} m={slab} />
        <Box s={[0.6, 7.4, 1.0]} p={[-3.85, 3.7, -0.55]} m={slab2} />
        <Box s={[0.6, 7.4, 1.0]} p={[3.85, 3.7, -0.55]} m={slab2} />
        {[-3.85, 3.85].map((x) => [1.2, 3.0, 4.8, 6.4].map((y) => <Box key={`${x}${y}`} s={[0.4, 0.9, 0.06]} p={[x, y, 0.0]} m={panel} cast={false} />))}
        <Box s={[0.9, 1.6, 1.3]} p={[4.4, 0.8, -0.2]} m={stone} />
        {[-2.6, -1.4, 1.4, 2.6].map((x) => [1.0, 2.4, 3.8, 5.2, 6.4].map((y) => <Box key={`p${x}${y}`} s={[0.7, 0.9, 0.05]} p={[x * 1.28, y, -0.2]} m={panel} cast={false} />))}
        <Niche />
        {/* canopy: two stacked red-fringed pent roofs and three small gold finials */}
        <Box s={[6.6, 0.26, 0.5]} p={[0, 7.25, 0.8]} m={wood} />
        {[-3.0, -1.5, 0, 1.5, 3.0].map((x) => <Box key={x} s={[0.14, 0.5, 0.5]} p={[x, 6.95, 0.75]} m={wood} cast={false} />)}
        <group position={[0, 0, 0.2]}>
          <Roof w={6.8} d={3.2} h={0.75} y={7.4} m={tile} />
          <Box s={[6.8, 0.34, 0.06]} p={[0, 7.25, 1.62]} m={fringe} cast={false} />
          <Box s={[2.2, 0.4, 1.1]} p={[0, 7.9, 0]} m={slab2} />
          <Roof w={4.6} d={2.1} h={0.65} y={8.15} m={tile} />
          <Box s={[4.6, 0.3, 0.06]} p={[0, 8.02, 1.1]} m={fringe} cast={false} />
          {[-1.3, 0, 1.3].map((x) => <group key={x} position={[x, 0, 0]}><Gajur y={8.7} s={0.4} /></group>)}
        </group>
        {/* the figure's base */}
        <Box s={[6.8, 0.28, 2.5]} p={[0, 0.14, 0.5]} m={stone} />
        <Box s={[6.2, 0.2, 2.1]} p={[0, 0.38, 0.5]} m={slab} />
        <Inst items={BASESPL} m={verm} />
        <Figure />
        {/* lions flanking, in front of the bay edges; the left one painted white */}
        <StoneLion p={[-4.5, 0, 2.2]} r={0.2} white />
        <StoneLion p={[4.5, 0, 2.2]} r={-0.2} />
        {/* offering table: dark, with rows of brass diyas, flowers, hanging bells */}
        <Box s={[5.0, 0.55, 1.15]} p={[0, 0.3, 3.05]} m={M.plain('#231f1d', { roughness: 0.8 })} />
        <Box s={[5.1, 0.08, 1.25]} p={[0, 0.62, 3.05]} m={M.plain('#3a3532', { roughness: 0.9 })} />
        <Inst items={CUPS} m={cup} kind="cyl" />
        <Inst items={FLAMES} m={flame} kind="ball" />
        <Inst items={MARIGA} m={marig} kind="ball" />
        <Inst items={MARIGB} m={marigR} kind="ball" />
        {[-2.9, -1.3].map((x) => <Box key={x} s={[0.08, 1.2, 0.08]} p={[x, 1.2, 3.55]} m={iron} cast={false} />)}
        <Box s={[1.7, 0.07, 0.07]} p={[-2.1, 1.78, 3.55]} m={iron} cast={false} />
        {[-2.7, -2.4, -2.1, -1.8, -1.5].map((x, i) => (
          <group key={x}><Box s={[0.02, 0.18 + (i % 2) * 0.08, 0.02]} p={[x, 1.65, 3.55]} m={iron} cast={false} /><mesh position={[x, 1.46 - (i % 2) * 0.04, 3.55]} material={brass} castShadow><coneGeometry args={[0.1, 0.2, 10]} /></mesh></group>
        ))}
        {/* low iron railing */}
        <Box s={[11.9, 0.06, 0.06]} p={[0, 0.6, 4.1]} m={iron} cast={false} />
        <Box s={[11.9, 0.05, 0.05]} p={[0, 0.3, 4.1]} m={iron} cast={false} />
        <Inst items={POSTS} m={iron} />
        <Box s={[0.06, 0.6, 1.3]} p={[-5.85, 0.3, 3.5]} m={iron} cast={false} />
        <Box s={[0.06, 0.6, 1.3]} p={[5.85, 0.3, 3.5]} m={iron} cast={false} />
        {/* bell on a stone post */}
        <Box s={[0.4, 1.5, 0.4]} p={[-6.6, 0.75, 3.2]} m={stone} />
        <Box s={[1.1, 0.1, 0.12]} p={[-6.3, 1.5, 3.2]} m={wood} />
        <mesh position={[-5.9, 1.2, 3.2]} material={brass} castShadow><coneGeometry args={[0.22, 0.4, 14]} /></mesh>
        {/* bulbs hung at the niche, lamp glow */}
        {[-2.6, 2.6].map((x) => <mesh key={x} position={[x, 6.9, 1.2]}><sphereGeometry args={[0.14, 10, 8]} />{bulb}</mesh>)}
        {[-2.6, 2.6].map((x) => <mesh key={`h${x}`} position={[x, 6.9, 1.2]}><sphereGeometry args={[0.45, 12, 10]} /><meshBasicMaterial color="#ffd88a" transparent opacity={0.22} depthWrite={false} toneMapped={false} /></mesh>)}
        <Inst items={FLAMEH} m={M.plain('#ff9a3a', { emissive: '#ff9a3a', emissiveIntensity: 1, transparent: true, opacity: 0.28, depthWrite: false })} kind="ball" />
        <pointLight position={[0, 1.0, 3.1]} intensity={3} distance={8} color="#ffa040" />
        <pointLight position={[0, 1.4, 3.6]} intensity={5} distance={12} color="#ff9d4a" />
        <pointLight position={[0, 6.4, 1.8]} intensity={3} distance={12} color="#ffc27a" />
      </group>
    );
  }

  /* ---------- tiered red-brick pagoda on a stepped plinth ---------- */
  function Pagoda({ p, r = 0, tiers = 3, w = 3.8, th = 2.3, steps = 5, st = 0.32, pin = false, rw0 = 1.45 }) {
    const M = useM();
    const brick = M.mat('brick', 3, 3, { color: '#e2a98b' });
    const wood = M.plain('#3b2416', { roughness: 0.85 });
    const fringe = M.plain('#a8211a', { roughness: 0.85 });
    const tile = M.mat('roof', 4, 4, { color: '#d6ab96' });
    const pl = M.mat('brick', 4, 1, { color: '#d6a487' });
    const gold = M.plain(GOLDC, { roughness: 0.3, metalness: 0.75 });
    const out = [];
    let y = 0;
    for (let s = 0; s < steps; s += 1) { const ww = w * 2.0 - s * (w * 0.2); out.push(<Box key={`s${s}`} s={[ww, st, ww]} p={[0, y + st / 2, 0]} m={pl} />); y += st; }
    let topRw = 0;
    for (let i = 0; i < tiers; i += 1) {
      const bw = w * 0.78 * 0.84 ** i, h = th * (1 - i * 0.12), rw = w * rw0 * 0.8 ** i;
      topRw = rw;
      out.push(<Box key={`b${i}`} s={[bw, h, bw]} p={[0, y + h / 2, 0]} m={brick} />);
      out.push(<Box key={`d${i}`} s={[bw * 0.4, h * 0.6, 0.06]} p={[0, y + h * 0.45, bw / 2]} m={wood} cast={false} />);
      out.push(<Box key={`dw${i}`} s={[bw * 0.3, h * 0.5, 0.06]} p={[bw * 0.3, y + h * 0.5, bw / 2 + 0.01]} m={wood} cast={false} />);
      y += h;
      out.push(<Roof key={`r${i}`} w={rw} d={rw} h={rw * 0.34} y={y} m={tile} />);
      out.push(<Box key={`f1${i}`} s={[rw, 0.36, 0.06]} p={[0, y - 0.22, rw / 2]} m={fringe} cast={false} />);
      out.push(<Box key={`f2${i}`} s={[rw, 0.36, 0.06]} p={[0, y - 0.22, -rw / 2]} m={fringe} cast={false} />);
      out.push(<Box key={`f3${i}`} s={[0.06, 0.36, rw]} p={[rw / 2, y - 0.22, 0]} m={fringe} cast={false} />);
      out.push(<Box key={`f4${i}`} s={[0.06, 0.36, rw]} p={[-rw / 2, y - 0.22, 0]} m={fringe} cast={false} />);
      y += 0.25;
    }
    const top = y + topRw * 0.34 * 0.6 - 0.1;
    return (
      <group position={p} rotation={[0, r, 0]}>{out}
        {pin ? (
          <group position={[0, top - 0.2, 0]}>
            <Cyl rt={0.5} rb={0.7} h={0.5} p={[0, 0.25, 0]} m={gold} seg={12} />
            {[0, 1, 2, 3, 4].map((i) => <Cyl key={i} rt={0.5 - i * 0.08} rb={0.62 - i * 0.08} h={0.14} p={[0, 0.65 + i * 0.2, 0]} m={gold} seg={12} />)}
            <Ball rad={0.3} p={[0, 1.8, 0]} m={gold} />
            <mesh position={[0, 3.0, 0]} material={gold} castShadow><coneGeometry args={[0.2, 2.2, 8]} /></mesh>
            <Ball rad={0.12} p={[0, 4.15, 0]} m={gold} />
          </group>
        ) : <Gajur y={top} s={1.6} />}
      </group>
    );
  }

  /* ---------- small brick shikhara with bell dome (right of the niche) ---------- */
  function Shikhara({ p }) {
    const M = useM();
    const brick = M.mat('brick', 1, 2, { color: '#cfa88c' });
    const plas = M.plain('#d9d2c2', { roughness: 0.9 });
    const redc = M.plain('#a8211a');
    const gold = M.plain(GOLDC, { roughness: 0.35, metalness: 0.7 });
    return (
      <group position={p}>
        <Box s={[1.9, 0.4, 1.9]} p={[0, 0.2, 0]} m={brick} />
        <Box s={[1.5, 2.6, 1.5]} p={[0, 1.7, 0]} m={brick} />
        <Box s={[1.9, 0.18, 1.9]} p={[0, 3.1, 0]} m={plas} />
        <Box s={[1.95, 0.22, 1.95]} p={[0, 3.3, 0]} m={redc} cast={false} />
        <Box s={[1.4, 0.3, 1.4]} p={[0, 3.55, 0]} m={plas} />
        <Ball rad={0.62} p={[0, 4.0, 0]} sc={[1, 1.1, 1]} m={plas} />
        <Cyl rt={0.14} rb={0.2} h={0.4} p={[0, 4.7, 0]} m={plas} />
        {[0, 1, 2].map((i) => <Cyl key={i} rt={0.28 - i * 0.07} h={0.07} p={[0, 4.95 + i * 0.12, 0]} m={gold} seg={12} />)}
        {[[-0.7, 3.27, 0.8], [0.6, 3.27, 0.85], [0.9, 3.65, 0.2], [-0.2, 3.8, 0.7]].map((q, i) => <Box key={i} s={[0.16, 0.12, 0.22]} p={q} m={M.plain('#8a8a90')} />)}
      </group>
    );
  }

  /* ---------- Env ---------- */
  const WINF = [], WINI = [], WINB = [];
  [-9.0, -7.5, -6.0, -4.9, 4.9, 6.0, 7.5, 9.0].forEach((x) => [4.1, 6.7].forEach((y) => {
    WINF.push([x, y, 0, 1.0, 1.35, 0.5]); WINI.push([x, y, 0.1, 0.72, 1.07, 0.5]);
    [-0.24, 0, 0.24].forEach((dx) => WINB.push([x + dx, y, 0.22, 0.05, 1.07, 0.06]));
  }));
  // second brick wing set back behind the first: three stepped storeys of lattice windows
  const WINF2 = [], WINI2 = [];
  [-4.5, -2.25, 0, 2.25, 4.5].forEach((x) => [7.0, 9.6, 12.2].forEach((y) => { WINF2.push([x, y, 0, 1.0, 1.4, 0.3]); WINI2.push([x, y, 0.1, 0.72, 1.1, 0.3]); }));
  const COL = []; for (let i = 0; i < 6; i += 1) COL.push([-4 + i * 1.6, 1.4, 0, 0.3, 2.8, 0.3]);
  const SKY = (() => {
    const r = rng(55); const a = [];
    for (let i = 0; i < 22; i += 1) {
      const ang = Math.PI + 0.15 + (i / 21) * (Math.PI - 0.3) + (r() - 0.5) * 0.1;
      const rad = 40 + r() * 20;
      a.push({ x: Math.cos(ang) * rad, z: Math.sin(ang) * rad, w: 5 + r() * 5, h: 5 + r() * 6, c: r() > 0.5 ? '#b9a99c' : '#a99b8f' });
    }
    return a;
  })();
  const CROWD = (() => {
    const r = rng(23); const cs = ['#8a3a30', '#cfc8b8', '#6b5a48', '#4a4a52', '#7a6a58', '#a88a6a', '#2a2624', '#9a5a44'];
    const a = []; for (let i = 0; i < 24; i += 1) a.push({ x: -8 + r() * 18, z: 6.4 + r() * 7, h: 0.7 + r() * 0.2, c: cs[i % cs.length] });
    for (let i = 0; i < 26; i += 1) a.push({ x: -5.2 + r() * 10.4, z: 4.5 + r() * 2.2, h: 0.7 + r() * 0.2, c: cs[(i + 3) % cs.length] });
    return a;
  })();

  function Person({ x, z, h, c, M }) {
    return (
      <group position={[x, 0, z]}>
        <Cyl rt={0.14} rb={0.2} h={h * 0.7} p={[0, h * 0.35, 0]} m={M.plain(c, { roughness: 0.95 })} seg={8} />
        <Ball rad={0.12} p={[0, h * 0.7 + 0.1, 0]} m={M.plain('#8a5a3a', { roughness: 0.9 })} />
      </group>
    );
  }

  function Shop({ p, r = 0, w = 6, h = 6, d = 5, c = '#dcb9a4' }) {
    const M = useM();
    const brick = M.mat('brick', 3, 2, { color: c });
    const dark = M.plain('#2a1a10', { roughness: 0.85 });
    const tile = M.mat('roof', 4, 2, { color: '#c9a08a' });
    const fringe = M.plain('#8f2a20', { roughness: 0.85 });
    const wins = [];
    for (let i = 0; i < Math.floor(w / 1.6); i += 1) {
      const x = -w / 2 + 0.9 + i * 1.6;
      [h * 0.52, h * 0.8].forEach((y, k) => wins.push(<Box key={`${i}${k}`} s={[0.9, 1.2, 0.2]} p={[x, y, d / 2 + 0.05]} m={dark} cast={false} />));
    }
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[w, h, d]} p={[0, h / 2, 0]} m={brick} />
        <Box s={[w - 0.4, 2.2, 0.2]} p={[0, 1.1, d / 2 + 0.05]} m={dark} cast={false} />
        <Box s={[w + 0.3, 0.16, 0.5]} p={[0, 2.35, d / 2 + 0.3]} m={fringe} cast={false} />
        {wins}
        <Roof w={w + 0.8} d={d + 0.8} h={1.2} y={h} m={tile} />
      </group>
    );
  }

  function Stall({ p, r = 0, c = '#9a4a3a' }) {
    const M = useM();
    const cl = M.plain(c, { roughness: 0.95 });
    const wood = M.plain('#4a3220', { roughness: 0.9 });
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[1.8, 0.6, 0.9]} p={[0, 0.3, 0]} m={wood} />
        <Box s={[1.9, 0.05, 1.0]} p={[0, 0.62, 0]} m={cl} cast={false} />
        {[-0.85, 0.85].map((x) => <Box key={x} s={[0.06, 1.7, 0.06]} p={[x, 0.85, 0.4]} m={wood} cast={false} />)}
        <Box s={[2.1, 0.06, 1.3]} p={[0, 1.7, 0.1]} r={[0.15, 0, 0]} m={cl} cast={false} />
        <Ball rad={0.2} p={[-0.4, 0.78, 0]} sc={[1, 0.6, 1]} m={M.plain('#f0a81a')} />
        <Ball rad={0.18} p={[0.3, 0.76, 0]} sc={[1, 0.6, 1]} m={M.plain('#d9501c')} />
      </group>
    );
  }

  function KalBhairavEnv() {
    const M = useM();
    const brick = M.mat('brick', 3, 1.5, { color: '#ffe2cc' });
    const plas = M.plain('#c9a58a', { roughness: 0.95 });
    const dark = M.plain('#2a1a10', { roughness: 0.85 });
    const lat = M.plain('#3a2414', { roughness: 0.8 });
    const timber = M.plain('#4a2c16', { roughness: 0.8 });
    const fringe = M.plain('#8f2a20', { roughness: 0.85 });
    const gold = M.plain('#c9a227', { roughness: 0.4, metalness: 0.6 });
    const tile = M.mat('roof', 8, 2, { color: '#c9a08a' });
    const pave = M.plain('#8c8579', { roughness: 0.95 });
    const stoneP = M.plain('#8b8378', { roughness: 0.95 });
    return (
      <group>
        <GroundDisc r={75} m={pave} y={-0.02} />
        {/* the Hanuman Dhoka palace wing behind the bay: plaster and brick, projecting timber windows, deep red-fringed eave */}
        <group position={[0, 0, -1.9]}>
          <Box s={[22, 9.4, 1.4]} p={[0, 4.7, 0]} m={brick} />
          <Box s={[22, 1.6, 1.42]} p={[0, 0.8, 0]} m={plas} />
          <Box s={[22.4, 0.35, 1.8]} p={[0, 9.5, 0.2]} m={dark} cast={false} />
          <Box s={[22.6, 0.2, 1.8]} p={[0, 9.75, -0.2]} r={[0.1, 0, 0]} m={tile} />
          <Box s={[22, 0.22, 0.06]} p={[0, 5.4, 0.74]} m={fringe} cast={false} />
          <Box s={[22, 0.2, 0.06]} p={[0, 9.2, 0.94]} m={gold} cast={false} />
          <group position={[0, 0, 0.78]}>
            <Inst items={WINF} m={timber} /><Inst items={WINI} m={dark} /><Inst items={WINB} m={lat} />
          </group>
          {/* projecting carved timber bay windows */}
          {[-8.2, 8.2].map((x) => (
            <group key={x} position={[x, 5.2, 1.2]}>
              <Box s={[2.6, 2.0, 0.9]} p={[0, 0, 0]} m={timber} />
              <Box s={[2.2, 1.5, 0.12]} p={[0, 0, 0.5]} m={dark} cast={false} />
              {[-0.8, -0.4, 0, 0.4, 0.8].map((q) => <Box key={q} s={[0.05, 1.5, 0.06]} p={[q, 0, 0.58]} m={lat} cast={false} />)}
              <Box s={[2.9, 0.12, 1.2]} p={[0, 1.06, 0]} m={tile} />
              <Box s={[2.7, 0.2, 0.06]} p={[0, 0.94, 0.62]} m={fringe} cast={false} />
            </group>
          ))}
        </group>
        {/* taller brick wing set back, three stepped storeys with lattice windows */}
        <group position={[0, 0, -5.2]}>
          <Box s={[13, 14.4, 4.0]} p={[0, 7.2, 0]} m={brick} />
          <Box s={[13.4, 0.3, 4.4]} p={[0, 9.0, 0]} m={tile} cast={false} />
          <Box s={[13.4, 0.3, 4.4]} p={[0, 11.5, 0]} m={tile} cast={false} />
          <Roof w={14} d={5} h={1.8} y={14.4} m={tile} />
          <group position={[0, 0, 2.05]}><Inst items={WINF2} m={timber} /><Inst items={WINI2} m={dark} /></group>
        </group>
        {/* Basantapur-style tiered tower deep behind */}
        <Pagoda p={[3, 0, -14]} tiers={4} w={3.6} th={2.6} steps={4} pin />
        <Pagoda p={[22, 0, -26]} tiers={4} w={3.4} th={2.5} />
        {/* timber pati colonnade on the left: open posts, red-fringed eave */}
        <group position={[-25, 0, 4.0]}>
          <Box s={[9, 0.3, 4]} p={[0, 0.15, 0]} m={stoneP} />
          <group position={[-0.8, 0.3, 1.6]}><Inst items={COL} m={dark} /></group>
          <group position={[-0.8, 0.3, -1.6]}><Inst items={COL} m={dark} /></group>
          <Box s={[9.4, 0.3, 4.4]} p={[0, 3.25, 0]} m={dark} />
          <Box s={[9.6, 0.14, 4.6]} p={[0, 3.5, 0]} m={tile} />
          <Box s={[9.4, 0.3, 0.06]} p={[0, 3.05, 2.22]} m={fringe} cast={false} />
        </group>
        {/* Degu Taleju (nearest, tall, gilded pinnacle), Indrapur (low and broad), Vishnu (3 tiers): spread apart, facing the square */}
        <Pagoda p={[-14, 0, -5]} tiers={3} w={4.4} th={3.2} r={0.45} steps={6} st={0.4} pin />
        <Pagoda p={[-22.5, 0, -8]} tiers={2} w={5.0} th={2.0} r={0.4} steps={5} st={0.34} rw0={1.6} />
        <Pagoda p={[-30.5, 0, -11]} tiers={3} w={4.0} th={2.6} r={0.4} steps={6} st={0.36} />
        {/* small brick shikhara with bell dome to the right */}
        <Shikhara p={[9.4, 0, 2.2]} />
        {/* brick houses and shopfronts on the right, set back from the viewing side */}
        <Shop p={[16, 0, -4]} w={7} h={7} d={5} r={-0.1} />
        <Shop p={[24, 0, -9]} w={6} h={9} d={5} r={-0.2} c="#d4ad96" />
        <Shop p={[32, 0, -4]} w={7} h={6.5} d={5} r={-0.3} c="#e0bfa8" />
        <Shop p={[14, 0, -13]} w={8} h={10} d={5} r={-0.05} c="#cfa890" />
        <Stall p={[12.5, 0, 6.0]} r={-0.4} c="#9a4a3a" />
        <Stall p={[14.5, 0, 8.4]} r={-0.6} c="#8a6a4a" />
        <Stall p={[-9.0, 0, 9.5]} r={0.4} c="#a8844a" />
        {/* vendors' baskets on cloth mats on the left */}
        {[[-8, 6.2, '#a8844a'], [-6.8, 7.4, '#6a6a72'], [-9.4, 5.2, '#8a4a3a']].map(([x, z, c], i) => (
          <group key={i} position={[x, 0, z]}>
            <Box s={[1.0, 0.03, 0.8]} p={[0, 0.02, 0]} r={[0, i * 0.4, 0]} m={M.plain(c, { roughness: 0.95 })} cast={false} />
            <Cyl rt={0.42} rb={0.34} h={0.22} p={[0, 0.15, 0]} m={M.plain('#8a5a2a')} seg={14} />
            <Ball rad={0.36} p={[0, 0.28, 0]} sc={[1, 0.5, 1]} m={M.plain('#f0a81a')} />
          </group>
        ))}
        {/* devotees and passers-by in the square */}
        {CROWD.map((q, i) => <Person key={i} {...q} M={M} />)}
        {/* hazy skyline of low brick houses */}
        {SKY.map((b, i) => (
          <group key={i} position={[b.x, 0, b.z]}>
            <Box s={[b.w, b.h, b.w * 0.8]} p={[0, b.h / 2, 0]} m={M.plain(b.c, { roughness: 1 })} cast={false} />
            <Box s={[b.w * 1.15, 0.5, b.w * 0.95]} p={[0, b.h + 0.2, 0]} m={M.plain('#a08672', { roughness: 1 })} cast={false} />
          </group>
        ))}
        <Tree p={[40, 0, -2]} s={2.2} />
        <Tree p={[-34, 0, 14]} s={1.8} />
      </group>
    );
  }

  return { 'kal-bhairav': { Main: KalBhairavMain, Env: KalBhairavEnv } };
}
