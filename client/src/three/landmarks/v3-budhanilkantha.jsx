/* Budhanilkantha (Jalashayana Narayan): a 5 m black basalt Vishnu asleep on the coils of Shesha, lying in a long narrow sunken tank.
   Open air. Units are about 1 m. Tank long axis = x, viewer at +z; head of the god at -x, feet at +x.
   Behind the far (-z) side: low orange-brown timber platform, red niched tank wall, white-and-red Newar building, Shivapuri hill. */
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Gajur, Frame, THREE, useMemo } = K;

  const rnd = (i) => { const v = Math.sin(i * 12.9898 + 1.7) * 43758.5453; return v - Math.floor(v); };

  /* a tapered limb between two points */
  function BkLimb({ a, b, r0 = 0.2, r1 = 0.15, m }) {
    const g = useMemo(() => {
      const va = new THREE.Vector3(...a); const vb = new THREE.Vector3(...b);
      const d = vb.clone().sub(va); const len = d.length();
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
      return { pos: va.clone().add(vb).multiplyScalar(0.5).toArray(), q, len };
    }, [a[0], a[1], a[2], b[0], b[1], b[2]]); // eslint-disable-line react-hooks/exhaustive-deps
    return <mesh position={g.pos} quaternion={g.q} material={m} castShadow><cylinderGeometry args={[r1, r0, g.len, 10]} /></mesh>;
  }

  /* a worshipper: robe, shawl, arms, head, hair */
  function BkPerson({ p, c = '#e6741a', r = 0, s = 1, head = '#8a5a3c', shawl = '#f4f0e6' }) {
    const M = useM();
    const skin = M.plain(head);
    return (
      <group position={p} rotation={[0, r, 0]} scale={s}>
        <Cyl rt={0.17} rb={0.3} h={1.05} p={[0, 0.55, 0]} m={M.plain(c, { roughness: 0.9 })} seg={10} />
        <Ball rad={0.24} sc={[1.15, 0.7, 0.8]} p={[0, 1.08, 0]} m={M.plain(c, { roughness: 0.9 })} />
        <Ball rad={0.2} sc={[1.2, 0.35, 0.9]} p={[0.04, 1.2, 0.04]} m={M.plain(shawl, { roughness: 0.95 })} />
        {[1, -1].map((k) => <Cyl key={k} rt={0.05} rb={0.065} h={0.55} p={[k * 0.28, 0.88, 0.1]} r={[0.5, 0, k * 0.12]} m={M.plain(c, { roughness: 0.9 })} seg={6} />)}
        {[1, -1].map((k) => <Ball key={`h${k}`} rad={0.06} p={[k * 0.3, 0.66, 0.28]} m={skin} />)}
        <Cyl rt={0.07} h={0.12} p={[0, 1.3, 0]} m={skin} seg={8} />
        <Ball rad={0.15} sc={[1, 1.1, 1]} p={[0, 1.46, 0]} m={skin} />
        <Ball rad={0.155} sc={[1, 0.6, 1]} p={[0, 1.54, -0.02]} m={M.plain('#1a1410')} />
      </group>
    );
  }

  /* sweep a circle (radius rf(t)) along a curve: fat knotted serpent body */
  function sweepGeo(curve, N, R, rf, closed) {
    const fr = curve.computeFrenetFrames(N, closed);
    const pos = []; const nor = []; const idx = [];
    for (let i = 0; i <= N; i += 1) {
      const t = i / N;
      const c = curve.getPointAt(Math.min(t, 1));
      const rr = rf(t);
      for (let j = 0; j <= R; j += 1) {
        const a = (j / R) * Math.PI * 2;
        const n = new THREE.Vector3().addScaledVector(fr.normals[i % (N + 1)], Math.cos(a)).addScaledVector(fr.binormals[i % (N + 1)], Math.sin(a));
        pos.push(c.x + n.x * rr, c.y + n.y * rr, c.z + n.z * rr);
        nor.push(n.x, n.y, n.z);
      }
    }
    for (let i = 0; i < N; i += 1) {
      for (let j = 0; j < R; j += 1) {
        const a = i * (R + 1) + j; const b = (i + 1) * (R + 1) + j;
        idx.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setIndex(idx);
    return g;
  }

  /* one fat lumpy coil loop of the serpent, wavy in height so loops cross over each other */
  function BkCoil({ cx = 0, cz = 0, y, rx, rz, r, m, ph = 0, amp = 0.12, lump = 0.14 }) {
    const g = useMemo(() => {
      const pts = [];
      const n = 28;
      for (let i = 0; i < n; i += 1) {
        const a = (i / n) * Math.PI * 2;
        pts.push(new THREE.Vector3(cx + Math.cos(a) * rx, y + amp * Math.sin(a * 3 + ph), cz + Math.sin(a) * rz * (1 + 0.06 * Math.sin(a * 2 + ph))));
      }
      const cu = new THREE.CatmullRomCurve3(pts, true);
      return sweepGeo(cu, 120, 10, (t) => r * (1 + lump * Math.sin(t * Math.PI * 2 * 14 + ph)), true);
    }, [cx, cz, y, rx, rz, r, ph, amp, lump]);
    return <mesh geometry={g} material={m} castShadow receiveShadow />;
  }

  /* open S-shaped body segment lying over the coils; radius tapers optionally */
  function BkSeg({ pts, r0, r1, m }) {
    const g = useMemo(() => {
      const cu = new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(...q)));
      return sweepGeo(cu, 50, 10, (t) => (r0 + (r1 - r0) * t) * (1 + 0.1 * Math.sin(t * 22)), false);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    return <mesh geometry={g} material={m} castShadow receiveShadow />;
  }

  /* ---------- the god ---------- */
  function BkVishnu() {
    const M = useM();
    const blk = M.plain('#4a4a53', { roughness: 0.5, metalness: 0.1 });
    const blkL = M.plain('#55555f', { roughness: 0.5, metalness: 0.1 });
    const dk = useMemo(() => new THREE.MeshStandardMaterial({ color: '#26262c', roughness: 0.7, metalness: 0, side: THREE.DoubleSide }), []);
    const lt = useMemo(() => new THREE.MeshStandardMaterial({ color: '#62626a', roughness: 0.7, metalness: 0, side: THREE.DoubleSide }), []);
    const hoodM = useMemo(() => new THREE.MeshStandardMaterial({ color: '#35353c', roughness: 0.45, metalness: 0.15, side: THREE.DoubleSide }), []);
    const gold = M.gold;
    const silver = M.plain('#d4d6da', { metalness: 0.9, roughness: 0.28 });
    const mari = [M.plain('#e88a1c', { roughness: 0.95 }), M.plain('#f2b81a', { roughness: 0.95 }), M.plain('#d86a1c', { roughness: 0.95 })];
    const cloth = M.plain('#ee9420', { roughness: 0.95 });
    const dark = M.plain('#0a0a0c');
    const hoods = Array.from({ length: 9 }, (_, i) => (i - 4) * 19 * Math.PI / 180);
    const hoodRim = useMemo(() => new THREE.MeshStandardMaterial({ color: '#6c6c74', roughness: 0.5, metalness: 0.1, side: THREE.DoubleSide }), []);
    const coils = [
      { cx: 0.1, cz: 0, y: 0.08, rx: 3.1, rz: 1.85, r: 0.55, m: dk, ph: 0.3, amp: 0.2, lump: 0.05 },
      { cx: 0.2, cz: 0.04, y: 0.36, rx: 2.65, rz: 1.5, r: 0.5, m: lt, ph: 1.9, amp: 0.2, lump: 0.05 },
      { cx: 0.05, cz: -0.04, y: 0.62, rx: 2.2, rz: 1.18, r: 0.47, m: dk, ph: 3.4, amp: 0.18, lump: 0.05 },
      { cx: 0.1, cz: 0.02, y: 0.84, rx: 1.75, rz: 0.88, r: 0.44, m: lt, ph: 5.0, amp: 0.15, lump: 0.05 },
    ];
    const topY = (x, z) => {
      const e1 = 1 - ((x + 1.15) / 0.7) ** 2 - (z / 0.74) ** 2;
      const e2 = 1 - ((x + 0.15) / 1.0) ** 2 - (z / 0.64) ** 2;
      const y1 = e1 > 0 ? 1.05 + 0.46 * Math.sqrt(e1) : -9;
      const y2 = e2 > 0 ? 0.95 + 0.44 * Math.sqrt(e2) : -9;
      return Math.max(y1, y2, 1.0);
    };
    const garlands = [-1.55, -1.3, -1.05, -0.7, -0.35].map((x, i) => {
      const pts = [];
      for (let k = 0; k <= 8; k += 1) { const z = (k / 8 - 0.5) * 1.3; pts.push([x + 0.05 * Math.sin(k), topY(x, z) + 0.06, z]); }
      return { pts, c: i % 3 };
    });
    return (
      <group>
        {/* serpent bed: separate, fat, knotted coil loops, half submerged */}
        {coils.map((q, i) => <BkCoil key={i} {...q} />)}
        {/* crossover knot at the foot end */}
        <BkSeg pts={[[2.4, 0.55, 1.1], [3.1, 0.82, 0.3], [3.5, 0.78, -0.4], [3.8, 0.45, -1.0]]} r0={0.34} r1={0.3} m={lt} />
        <BkSeg pts={[[2.4, 0.5, -1.1], [3.1, 0.7, -0.3], [3.5, 0.9, 0.4], [3.8, 0.5, 1.0]]} r0={0.34} r1={0.3} m={dk} />
        {/* tail tapers away over the end coils */}
        <BkSeg pts={[[2.0, 0.95, 0.2], [2.5, 0.98, 0.5], [3.0, 0.8, 0.55], [3.4, 0.55, 0.3], [3.3, 0.3, -0.2]]} r0={0.36} r1={0.06} m={lt} />

        {/* hood fan: nine flattened spade-shaped hoods in one tight arc behind the head, tilted back */}
        {hoods.map((a, i) => {
          const c = Math.cos(a); const hy = 0.55 + 0.75 * c; const hz = Math.sin(a) * 1.0; const hx = -2.95 - 0.12 * c;
          const hm = i % 2 ? hoodM : lt;
          return (
            <group key={i} position={[hx, hy, hz]} rotation={[0, -a * 0.55, 0.35]}>
              <Ball rad={0.31} sc={[0.2, 1.05, 0.92]} m={hoodRim} />
              <Ball rad={0.27} sc={[0.2, 0.98, 0.84]} p={[0.045, 0, 0]} m={hm} />
              <Ball rad={0.13} sc={[0.5, 0.9, 0.9]} p={[0.09, 0.22, 0]} m={hoodRim} />
              {[-0.06, 0.06].map((z) => <Ball key={z} rad={0.028} p={[0.12, 0.16, z]} m={M.plain('#e8d8a0', { emissive: '#8a7a40', emissiveIntensity: 0.4 })} />)}
            </group>
          );
        })}

        {/* the body, tilted so the head end is raised and the face looks up toward the viewer */}
        <group position={[1.2, 1.0, 0]} rotation={[0.1, 0, -0.1]}>
          <group position={[-1.2, -1.0, 0]}>
            <Ball rad={1} sc={[0.7, 0.46, 0.74]} p={[-1.15, 1.05, 0]} m={blk} />
            <Ball rad={1} sc={[1.0, 0.44, 0.64]} p={[-0.15, 0.95, 0]} m={blk} />
            <Ball rad={1} sc={[0.65, 0.4, 0.58]} p={[0.7, 0.92, 0]} m={blk} />
            <Cyl rt={0.24} h={0.45} p={[-1.62, 1.08, 0]} r={[0, 0, Math.PI / 2]} m={blk} seg={10} />
            <group position={[-1.9, 1.0, 0]} rotation={[0.3, 0, 0]}><group position={[1.9, -1.0, 0]}>
            {/* head: calm closed-eyed oval face, about 0.6 m wide */}
            <Ball rad={0.5} sc={[1.0, 0.82, 0.62]} p={[-2.0, 1.05, 0]} m={blkL} />
            <Ball rad={1} sc={[0.045, 0.013, 0.12]} p={[-1.93, 1.425, 0.16]} m={dark} />
            <Ball rad={1} sc={[0.045, 0.013, 0.12]} p={[-1.93, 1.425, -0.16]} m={dark} />
            <Ball rad={1} sc={[0.03, 0.012, 0.14]} p={[-2.02, 1.445, 0.17]} r={[0, 0.2, 0]} m={dark} />
            <Ball rad={1} sc={[0.03, 0.012, 0.14]} p={[-2.02, 1.445, -0.17]} r={[0, -0.2, 0]} m={dark} />
            <Ball rad={1} sc={[0.2, 0.065, 0.055]} p={[-1.76, 1.425, 0]} m={blkL} />
            <Ball rad={1} sc={[0.09, 0.03, 0.14]} p={[-1.56, 1.3, 0]} m={M.plain('#5a2a2a')} />
            <Ball rad={0.05} p={[-2.2, 1.45, 0]} m={M.plain('#c8102e')} />
            {[-0.34, 0.34].map((z) => <Ball key={z} rad={0.11} sc={[0.8, 1.3, 0.8]} p={[-1.98, 0.98, z]} m={gold} />)}
            {/* low stepped crown: gold flared band, two silver steps, small silver finial, kirtimukha */}
            <group position={[-2.28, 1.4, 0]} rotation={[0, 0, 0.6]}>
              <Cyl rt={0.4} rb={0.48} h={0.12} p={[0, 0.06, 0]} m={gold} seg={16} />
              <Cyl rt={0.3} rb={0.4} h={0.12} p={[0, 0.18, 0]} m={silver} seg={16} />
              <Cyl rt={0.2} rb={0.3} h={0.16} p={[0, 0.32, 0]} m={silver} seg={14} />
              <mesh position={[0, 0.46, 0]} material={silver}><coneGeometry args={[0.07, 0.13, 8]} /></mesh>
              <Ball rad={0.1} sc={[0.6, 1, 1.2]} p={[0.22, 0.12, 0]} m={gold} />
            </group>
            </group></group>
            {/* legs: two bent thighs, knees up, ankles crossed */}
            {[1, -1].map((s) => (
              <group key={s}>
                <BkLimb a={[0.75, 0.95, s * 0.28]} b={[1.5, 1.75, s * 0.8]} r0={0.36} r1={0.3} m={blk} />
                <BkLimb a={[1.5, 1.75, s * 0.8]} b={[s > 0 ? 2.25 : 2.1, s > 0 ? 1.4 : 1.22, -s * 0.15]} r0={0.28} r1={0.17} m={blk} />
                <Ball rad={0.3} p={[1.5, 1.77, s * 0.8]} m={blk} />
                <Ball rad={1} sc={[0.32, 0.15, 0.2]} p={[s > 0 ? 2.45 : 2.3, s > 0 ? 1.4 : 1.22, -s * 0.15]} m={blkL} />
              </group>
            ))}
            {/* arms: lower pair on the chest; upper pair out, near hand holds the chakra, far hand the club */}
            {[1, -1].map((s) => (
              <group key={`ar${s}`}>
                <BkLimb a={[-1.2, 1.2, s * 0.55]} b={[-0.8, 1.05, s * 0.98]} r0={0.25} r1={0.2} m={blkL} />
                <BkLimb a={[-0.8, 1.05, s * 0.98]} b={[-0.35, 1.38, s * 0.42]} r0={0.2} r1={0.16} m={blkL} />
                <Ball rad={0.17} p={[-0.32, 1.4, s * 0.4]} m={blkL} />
                <BkLimb a={[-1.3, 1.1, s * 0.58]} b={[-1.1, 1.0, s * 1.2]} r0={0.25} r1={0.2} m={blkL} />
                <BkLimb a={[-1.1, 1.0, s * 1.2]} b={[-0.6, 1.2, s * 1.55]} r0={0.2} r1={0.15} m={blkL} />
                <Ball rad={0.17} p={[-0.58, 1.22, s * 1.57]} m={blkL} />
              </group>
            ))}
            {/* conch in the near lower hand */}
            <Ball rad={0.2} sc={[1.4, 0.9, 1]} p={[-0.38, 1.66, 0.4]} m={M.plain('#f3efe6')} />
            <Ball rad={0.09} p={[-0.02, 1.66, 0.4]} m={M.plain('#f3efe6')} />
            <Ball rad={0.14} p={[-0.38, 1.62, -0.4]} m={M.plain('#c8102e', { emissive: '#601010', emissiveIntensity: 0.3 })} />
            {/* chakra: a large gold disc held on the near upper hand */}
            <group position={[-0.58, 1.55, 1.72]} rotation={[0, 0.45, 0]}>
              <mesh material={gold}><torusGeometry args={[0.42, 0.06, 8, 32]} /></mesh>
              <Cyl rt={0.38} h={0.05} r={[Math.PI / 2, 0, 0]} m={M.plain('#e8b82a', { metalness: 0.6, roughness: 0.4 })} seg={24} />
              <Ball rad={0.11} m={gold} />
              {[0, 1, 2, 3].map((k) => <Box key={k} s={[0.8, 0.045, 0.05]} r={[0, 0, k * Math.PI / 4]} m={gold} cast={false} />)}
              {Array.from({ length: 12 }, (_, k) => <Box key={`t${k}`} s={[0.09, 0.09, 0.05]} p={[Math.cos(k * Math.PI / 6) * 0.47, Math.sin(k * Math.PI / 6) * 0.47, 0]} r={[0, 0, k * Math.PI / 6]} m={gold} cast={false} />)}
            </group>
            <Cyl rt={0.14} h={0.4} p={[-0.58, 1.38, 1.62]} m={blkL} seg={8} />
            {/* club: thick tapered mace in the far upper hand */}
            <Cyl rt={0.07} rb={0.2} h={1.5} p={[0.2, 1.2, -1.6]} r={[0, 0, Math.PI / 2]} m={blkL} seg={10} />
            <Ball rad={0.3} sc={[1.1, 1, 1]} p={[1.05, 1.2, -1.6]} m={blkL} />
            <Cyl rt={0.22} rb={0.22} h={0.08} p={[0.7, 1.2, -1.6]} r={[0, 0, Math.PI / 2]} m={gold} seg={10} />
            <Cyl rt={0.1} rb={0.1} h={0.08} p={[-0.45, 1.2, -1.6]} r={[0, 0, Math.PI / 2]} m={gold} seg={10} />
            {/* orange cloth over belly and thighs */}
            <Ball rad={1} sc={[0.85, 0.3, 0.56]} p={[0.1, 1.2, 0]} m={cloth} />
            <Ball rad={1} sc={[0.85, 0.3, 0.8]} p={[1.15, 1.36, 0]} m={cloth} />
            {/* heavy marigold garlands draped across chest and belly */}
            {garlands.map((q, i) => <BkSeg key={`gl${i}`} pts={q.pts} r0={0.12} r1={0.12} m={mari[q.c]} />)}
            {Array.from({ length: 22 }, (_, i) => (
              <Ball key={`mc${i}`} rad={0.07 + rnd(i + 30) * 0.04} p={[-1.5 + rnd(i + 21) * 1.5, 1.45 + rnd(i + 25) * 0.1, (rnd(i + 27) - 0.5) * 1.0]} m={mari[(i + 1) % 3]} />
            ))}
            {/* a few strands and offerings fallen onto the coils */}
            {[0.95, -0.95].map((z) => <Ball key={z} rad={1} sc={[0.1, 0.34, 0.1]} p={[-0.9, 0.62, z * 1.12]} m={mari[2]} />)}
            {[-1.4, 0.3, 1.5].map((x, i) => <Ball key={x} rad={0.12} sc={[1, 0.8, 1]} p={[x, 0.85, 1.32]} m={mari[i % 3]} />)}
          </group>
        </group>
      </group>
    );
  }

  /* ---------- stone pillar with base ring and carved capital ---------- */
  function BkPillar({ p, h = 4.8, w = 0.5 }) {
    const M = useM();
    const g = M.plain('#a9a393', { roughness: 0.97 });
    const g2 = M.plain('#8f897a', { roughness: 0.97 });
    return (
      <group position={p}>
        <Box s={[w * 1.9, 0.4, w * 1.9]} p={[0, 0.2, 0]} m={g2} />
        <Cyl rt={w * 0.95} rb={w * 1.1} h={0.3} p={[0, 0.55, 0]} m={g} seg={12} />
        <Box s={[w, h - 1.2, w]} p={[0, 0.7 + (h - 1.2) / 2, 0]} m={g} />
        {[0.3, -0.3].map((o) => <Box key={o} s={[w * 0.5, 1.2, w * 1.04]} p={[0, h * 0.5 + o * 2, 0]} m={g2} cast={false} />)}
        <Cyl rt={w * 0.8} rb={w * 0.8} h={0.14} p={[0, h - 0.7, 0]} m={g2} seg={12} />
        <Box s={[w * 1.3, 0.2, w * 1.3]} p={[0, h - 0.55, 0]} m={g} />
        <Box s={[w * 1.6, 0.18, w * 1.6]} p={[0, h - 0.36, 0]} m={g2} />
        <Box s={[w * 1.9, 0.2, w * 1.9]} p={[0, h - 0.17, 0]} m={g} />
        <Box s={[w * 1.2, 0.1, w * 1.2]} p={[0, h - 0.02, 0]} m={g2} />
      </group>
    );
  }

  /* saffron canopy with a sag, a crimson scalloped frill, and a green-and-white striped panel */
  function BkCanopy() {
    const M = useM();
    const yel = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f0b323', roughness: 0.9, side: THREE.DoubleSide }), []);
    const red = useMemo(() => new THREE.MeshStandardMaterial({ color: '#b8142a', roughness: 0.9, side: THREE.DoubleSide }), []);
    const grn = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2f7a3c', roughness: 0.9, side: THREE.DoubleSide }), []);
    const wht = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f1ece0', roughness: 0.9, side: THREE.DoubleSide }), []);
    const x0 = -4.7; const x1 = 4.7; const w = x1 - x0; const zb = -4.5; const zf = -1.5; const yb = 4.2; const yf = 3.5;
    const edge = (u) => yf + 0.12 * u;
    const geo = useMemo(() => {
      const g = new THREE.PlaneGeometry(w, zf - zb, 30, 10);
      g.rotateX(-Math.PI / 2);
      const pa = g.attributes.position;
      for (let i = 0; i < pa.count; i += 1) {
        const u = (pa.getX(i) + w / 2) / w; const v = (pa.getZ(i) + (zf - zb) / 2) / (zf - zb);
        pa.setY(i, yb + (yf - yb) * v + 0.12 * u * v - 0.3 * Math.sin(Math.PI * u) * Math.sin(Math.PI * v) + 0.03 * Math.sin(u * 40));
      }
      g.computeVertexNormals();
      return g;
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    const nS = 22; const sw = w / nS;
    return (
      <group>
        <mesh geometry={geo} position={[0, 0, (zb + zf) / 2]} material={yel} castShadow />
        {/* frill: 0.35 m deep, band plus hanging scallops, along the front and both sides */}
        {Array.from({ length: nS }, (_, i) => {
          const u = (i + 0.5) / nS;
          return (
            <group key={i} position={[x0 + (i + 0.5) * sw, edge(u), zf]}>
              <Box s={[sw, 0.22, 0.02]} p={[0, -0.11, 0]} m={red} cast={false} />
              <mesh position={[0, -0.22, 0]} material={red}><circleGeometry args={[sw / 2, 12, Math.PI, Math.PI]} /></mesh>
            </group>
          );
        })}
        {[x0, x1].map((x, k) => <Box key={`s${k}`} s={[0.02, 0.22, zf - zb]} p={[x, 3.7 + (k ? 0.12 : 0), (zb + zf) / 2]} m={red} cast={false} />)}
        {/* green-and-white striped panel hanging lower at the right (larger) */}
        <group position={[2.7, 3.25, -2.1]} rotation={[0.14, 0, 0]}>
          {Array.from({ length: 11 }, (_, i) => <Box key={i} s={[0.34, 0.03, 1.9]} p={[-1.7 + i * 0.34, 0, 0]} m={i % 2 ? wht : grn} cast={false} />)}
          <Box s={[3.74, 0.2, 0.02]} p={[0, -0.1, 0.95]} m={red} cast={false} />
        </group>
        {/* second overlapping red-and-yellow panel at the left, hung lower */}
        <group position={[-2.5, 3.32, -2.2]} rotation={[0.12, 0, 0.03]}>
          {Array.from({ length: 12 }, (_, i) => <Box key={i} s={[0.34, 0.03, 1.8]} p={[-1.87 + i * 0.34, 0, 0]} m={i % 2 ? yel : red} cast={false} />)}
          {Array.from({ length: 12 }, (_, i) => <mesh key={`f${i}`} position={[-1.87 + i * 0.34, -0.3, 0.9]} material={i % 2 ? yel : red}><circleGeometry args={[0.17, 10, Math.PI, Math.PI]} /></mesh>)}
          <Box s={[4.08, 0.2, 0.02]} p={[0, -0.1, 0.9]} m={red} cast={false} />
        </group>
        {[x0 + 0.25, x1 - 0.25].map((x) => <Cyl key={x} rt={0.05} h={5.0} p={[x, 1.0, zf + 0.05]} m={M.dark} seg={6} />)}
        {[x0 + 0.25, x1 - 0.25].map((x) => <Cyl key={`b${x}`} rt={0.05} h={4.2} p={[x, 2.1, zb + 0.05]} m={M.dark} seg={6} />)}
      </group>
    );
  }

  /* low timber platform on the far side: short carved balustrade, devotees and priests */
  function BkDeck() {
    const M = useM();
    const wood = M.mat('wood', 2, 1, { color: '#c0683a' });
    const wood2 = M.plain('#a4502c', { roughness: 0.8 });
    const x0 = -7.0; const x1 = 7.0; const w = x1 - x0; const cx = 0; const zf = -3.15; const zb = -4.4;
    const yT = 0.92;
    const bal = Array.from({ length: Math.floor(w / 0.5) }, (_, i) => x0 + 0.25 + i * 0.5);
    const panels = Array.from({ length: 8 }, (_, i) => x0 + 0.9 + i * 1.75);
    return (
      <group>
        <Box s={[w, 0.95, zf - zb]} p={[cx, 0.45, (zf + zb) / 2]} m={wood} />
        <Box s={[w + 0.1, 0.08, zf - zb + 0.1]} p={[cx, 0.94, (zf + zb) / 2]} m={wood2} cast={false} />
        <Box s={[w, 0.12, 0.16]} p={[cx, yT + 0.94, zf]} m={wood2} />
        <Box s={[w, 0.08, 0.1]} p={[cx, yT + 0.12, zf]} m={wood2} />
        {bal.map((x) => <Box key={x} s={[0.07, 0.7, 0.07]} p={[x, yT + 0.5, zf]} m={wood} cast={false} />)}
        {panels.map((x, i) => (
          <group key={`pn${i}`} position={[x, yT + 0.52, zf + 0.02]}>
            <Box s={[1.4, 0.62, 0.08]} m={wood2} />
            <Box s={[1.2, 0.46, 0.1]} m={M.plain('#8a3f22', { roughness: 0.8 })} cast={false} />
            <Box s={[0.5, 0.3, 0.12]} m={wood} cast={false} />
            {[1, -1].map((k) => <Box key={k} s={[0.3, 0.05, 0.12]} p={[k * 0.45, 0.1, 0]} r={[0, 0, -k * 0.5]} m={M.plain('#e0a040')} cast={false} />)}
          </group>
        ))}
        {[x0 + 0.1, -3.5, 0, 3.5, x1 - 0.1].map((x) => <Box key={`p${x}`} s={[0.2, 1.2, 0.2]} p={[x, yT + 0.58, zf]} m={wood2} />)}
        {[x0 + 0.1, x1 - 0.1].map((x) => <Box key={x} s={[0.1, 0.1, zf - zb]} p={[x, yT + 0.94, (zf + zb) / 2]} m={wood2} />)}
        {[-3.6, -0.8, 2.0, 4.6].map((x, i) => (
          <group key={`pot${i}`} position={[x, yT, zf - 0.5]}>
            <Cyl rt={0.24} rb={0.16} h={0.34} p={[0, 0.17, 0]} m={M.plain('#a4502c')} seg={10} />
            <Ball rad={0.34} sc={[1, 0.85, 1]} p={[0, 0.6, 0]} m={M.plain('#3f6b34', { roughness: 1 })} />
          </group>
        ))}
        {[[-5.7, '#f4f0e6', '#e8761a'], [-4.0, '#e8761a', '#f6c20c'], [-2.6, '#f0a01c', '#f4f0e6'], [-1.9, '#b8142a', '#f4f0e6'], [0.9, '#f0a01c', '#b8142a'], [2.2, '#f4f0e6', '#f0a01c'], [3.2, '#b8142a', '#f6c20c'], [4.4, '#e8761a', '#f4f0e6'], [5.5, '#e8761a', '#f4f0e6']].map(([x, c, sh], i) => (
          <BkPerson key={i} p={[x, yT, -3.7 - (i % 2) * 0.2]} c={c} shawl={sh} r={0.2 * i - 0.3} />
        ))}
      </group>
    );
  }

  /* red plastered wall behind the platform with small gabled niches and a thin yellow railing above */
  function BkWall() {
    const M = useM();
    const red = M.mat('plaster', 8, 1, { color: '#a4382e' });
    const dark = M.plain('#1a100d');
    const yel = M.plain('#f1b60e', { roughness: 0.7 });
    const cream = M.plain('#d6b49a', { roughness: 0.9 });
    const zw = -4.55; // wall behind the raised deck
    const xs = Array.from({ length: 11 }, (_, i) => -7 + i * 1.4);
    return (
      <group>
        <Box s={[15.4, 2.6, 0.3]} p={[0, 1.3, zw]} m={red} />
        <Box s={[15.4, 0.14, 0.42]} p={[0, 2.65, zw + 0.04]} m={cream} />
        {xs.map((x, i) => (
          <group key={i} position={[x, 1.55, zw + 0.17]}>
            <Box s={[0.32, 0.46, 0.06]} m={dark} cast={false} />
            <Box s={[0.46, 0.05, 0.1]} p={[0, -0.27, 0.02]} m={cream} cast={false} />
            {[1, -1].map((s) => <Box key={s} s={[0.26, 0.04, 0.1]} p={[s * 0.1, 0.3, 0.02]} r={[0, 0, -s * 0.75]} m={cream} cast={false} />)}
          </group>
        ))}
        <Box s={[15.4, 0.07, 0.07]} p={[0, 3.5, zw + 0.1]} m={yel} cast={false} />
        <Box s={[15.4, 0.05, 0.05]} p={[0, 3.05, zw + 0.1]} m={yel} cast={false} />
        {Array.from({ length: 26 }, (_, i) => <Box key={i} s={[0.06, 0.85, 0.06]} p={[-7.2 + i * 0.58, 3.1, zw + 0.1]} m={yel} cast={false} />)}
      </group>
    );
  }

  function BkTankAndCourt() {
    const M = useM();
    const pave = M.plain('#a8a090', { roughness: 0.96 });
    const pave2 = M.plain('#9d9484', { roughness: 0.96 });
    const scoreM = M.plain('#7f776a', { roughness: 1 });
    const stoneM = M.plain('#8f897a', { roughness: 0.97 });
    const grass = M.mat('grass', 40, 40, { color: '#d2e8a0' });
    const kerb = M.mat('granite', 6, 1, { color: '#8f8a80' });
    const brick = M.mat('plaster', 6, 1, { color: '#a4382e' });
    const dark = M.plain('#1a100d');
    const cream = M.plain('#d6b49a', { roughness: 0.9 });
    return (
      <group>
        {/* the narrow stone apron and the courtyard sides */}
        <Box s={[38, 0.3, 13]} p={[0, -0.12, 9.5]} m={pave} cast={false} />
        {Array.from({ length: 8 }, (_, i) => <Box key={`zl${i}`} s={[38, 0.01, 0.05]} p={[0, 0.036, 4.2 + i * 1.6]} m={scoreM} cast={false} />)}
        {Array.from({ length: 19 }, (_, i) => <Box key={`xl${i}`} s={[0.05, 0.01, 13]} p={[-18 + i * 2, 0.037, 9.5]} m={scoreM} cast={false} />)}
        <Box s={[3.7, 0.3, 7.75]} p={[-9.15, -0.12, -0.8]} m={pave} cast={false} />
        <Box s={[3.7, 0.3, 7.75]} p={[9.15, -0.12, -0.8]} m={pave} cast={false} />
        <Box s={[22, 0.3, 8.3]} p={[0, -0.12, -8.85]} m={pave2} cast={false} />
        {/* grass and a worn margin beyond */}
        <Box s={[260, 1.3, 120]} p={[0, -0.65, 65.8]} m={grass} cast={false} />
        <Box s={[260, 1.3, 140]} p={[0, -0.65, -83.0]} m={grass} cast={false} />
        <Box s={[120, 1.3, 14]} p={[-71, -0.65, 0.0]} m={grass} cast={false} />
        <Box s={[120, 1.3, 14]} p={[71, -0.65, 0.0]} m={grass} cast={false} />
        <Box s={[16, 1.3, 14]} p={[-18, -0.65, 0]} m={grass} cast={false} />
        <Box s={[16, 1.3, 14]} p={[18, -0.65, 0]} m={grass} cast={false} />
        {/* the tank: floor, walls, dark green-black water */}
        <Box s={[14.0, 0.2, 5.5]} p={[0, -1.9, 0]} m={M.dark} cast={false} />
        <Box s={[14.6, 1.9, 0.3]} p={[0, -0.85, 2.9]} m={kerb} />
        <Box s={[14.6, 2.3, 0.3]} p={[0, -0.7, -2.9]} m={brick} />
        <Box s={[0.3, 2.0, 5.5]} p={[-7.15, -0.9, 0]} m={brick} />
        <Box s={[0.3, 2.0, 5.5]} p={[7.15, -0.9, 0]} m={brick} />
        <Box s={[14.8, 0.1, 0.5]} p={[0, 0.1, 2.9]} m={kerb} />
        <Box s={[14.8, 0.08, 0.4]} p={[0, 0.5, -2.9]} m={cream} />
        {[-7.15, 7.15].map((x) => <Box key={x} s={[0.5, 0.1, 5.9]} p={[x, 0.1, 0]} m={kerb} />)}
        {/* niches seen from the water */}
        {Array.from({ length: 10 }, (_, i) => (
          <group key={i} position={[-6.3 + i * 1.4, 0.05, -2.73]}>
            <Box s={[0.3, 0.38, 0.06]} m={dark} cast={false} />
            {[1, -1].map((s) => <Box key={s} s={[0.24, 0.04, 0.1]} p={[s * 0.09, 0.22, 0.02]} r={[0, 0, -s * 0.75]} m={cream} cast={false} />)}
            <Box s={[0.42, 0.05, 0.1]} p={[0, -0.22, 0.02]} m={cream} cast={false} />
          </group>
        ))}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]}><planeGeometry args={[14.0, 5.5]} /><meshStandardMaterial color="#23463f" metalness={0.5} roughness={0.1} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.2, -0.29, 0.1]} scale={[1, 0.5, 1]}><circleGeometry args={[4.0, 32]} /><meshBasicMaterial color="#d9822b" transparent opacity={0.2} /></mesh>
        {[[3.8, 1.9], [4.3, 2.1]].map(([rx, rz], i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0.1, -0.285, 0]} scale={[1, rz / rx, 1]}><ringGeometry args={[rx + i * 0.5, rx + i * 0.5 + 0.04, 40]} /><meshBasicMaterial color="#8fb4a8" transparent opacity={0.28} /></mesh>
        ))}
        {/* low stone-post-and-chain fence along the near apron, about 0.6 m high */}
        {Array.from({ length: 9 }, (_, i) => (
          <group key={i} position={[-7.2 + i * 1.8, 0, 3.4]}>
            <Box s={[0.18, 0.6, 0.18]} p={[0, 0.3, 0]} m={stoneM} />
            <Box s={[0.24, 0.07, 0.24]} p={[0, 0.63, 0]} m={stoneM} />
            {i < 8 && <Box s={[1.62, 0.03, 0.03]} p={[0.9, 0.42, 0]} m={M.dark} cast={false} />}
            {i < 8 && <Box s={[1.62, 0.03, 0.03]} p={[0.9, 0.52, 0]} m={M.dark} cast={false} />}
          </group>
        ))}
      </group>
    );
  }

  /* gabled lamp shrine on a post in the water, and the carved timber pillar with the gold trident */
  function BkLamp() {
    const M = useM();
    const silver = M.plain('#d4d6da', { metalness: 0.9, roughness: 0.28 });
    const timber = M.plain('#9a8660', { roughness: 0.9 });
    return (
      <group>
        <group position={[-4.8, 0, -1.9]}>
          <Cyl rt={0.14} rb={0.17} h={2.4} p={[0, -0.4, 0]} m={M.mat('granite', 1, 2, { color: '#cfcac0' })} seg={8} />
          <Box s={[0.85, 0.6, 0.62]} p={[0, 1.15, 0]} m={M.plain('#b5532c')} />
          <Box s={[0.5, 0.34, 0.02]} p={[0, 1.15, 0.32]} m={M.plain('#ffd27a', { emissive: '#ffb347', emissiveIntensity: 1.6 })} cast={false} />
          {[1, -1].map((s) => <Box key={s} s={[0.5, 0.04, 0.78]} p={[s * 0.24, 1.6, 0]} r={[0, 0, -s * 0.9]} m={silver} />)}
          <Box s={[0.9, 0.06, 0.7]} p={[0, 0.82, 0]} m={M.plain('#7a4a2a')} />
          <pointLight position={[0, 1.1, 0.5]} intensity={1.3} distance={5} color="#ffb35a" />
        </group>
        <group position={[3.4, 0, -1.2]}>
          <Box s={[0.7, 0.3, 0.7]} p={[0, -0.7, 0]} m={M.mat('granite', 1, 1, { color: '#cfcac0' })} />
          <Box s={[0.42, 3.4, 0.42]} p={[0, 1.15, 0]} m={timber} />
          {[0.4, 1.0, 1.6, 2.2].map((y) => <Box key={y} s={[0.46, 0.06, 0.46]} p={[0, y, 0]} m={M.plain('#6b5a3a')} />)}
          <Box s={[0.52, 0.14, 0.52]} p={[0, 2.9, 0]} m={M.plain('#7a4a2a')} />
          <Cyl rt={0.26} h={0.05} p={[0, 1.9, 0.22]} r={[Math.PI / 2, 0, 0]} m={M.gold} seg={16} />
          {/* trident */}
          <Box s={[0.06, 0.7, 0.06]} p={[0, 3.3, 0.04]} m={M.gold} />
          <Box s={[0.44, 0.06, 0.06]} p={[0, 3.5, 0.04]} m={M.gold} />
          {[-0.2, 0, 0.2].map((x) => <Box key={x} s={[0.06, x === 0 ? 0.55 : 0.42, 0.06]} p={[x, x === 0 ? 3.9 : 3.78, 0.04]} m={M.gold} />)}
        </group>
        {/* diyas along the near kerb */}
        {[-3.2, -1.1, 1.0, 3.1].map((x) => (
          <group key={x} position={[x, 0.18, 3.05]}>
            <Cyl rt={0.14} rb={0.08} h={0.07} p={[0, 0.04, 0]} m={M.plain('#8b4a2a')} seg={10} />
            <mesh position={[0, 0.2, 0]}><coneGeometry args={[0.07, 0.2, 8]} /><meshBasicMaterial color="#ffd27a" toneMapped={false} /></mesh>
          </group>
        ))}
      </group>
    );
  }

  /* stone Garuda-Vishnu statue on a plinth: kneeling Garuda with folded hands, Vishnu seated on his shoulders */
  function BkGaruda({ p, r = 0 }) {
    const M = useM();
    const st = M.plain('#6f6c66', { roughness: 0.95 });
    const stL = M.plain('#8a867e', { roughness: 0.95 });
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[1.7, 0.4, 1.7]} p={[0, 0.2, 0]} m={stL} />
        <Box s={[1.3, 0.5, 1.3]} p={[0, 0.65, 0]} m={st} />
        <Box s={[1.5, 0.12, 1.5]} p={[0, 0.96, 0]} m={stL} />
        <Ball rad={0.42} sc={[0.8, 1.05, 0.7]} p={[0, 1.6, 0]} m={st} />
        <Ball rad={0.2} p={[0, 2.15, 0.1]} m={st} />
        <mesh position={[0, 2.1, 0.32]} rotation={[Math.PI / 2, 0, 0]} material={M.gold}><coneGeometry args={[0.06, 0.2, 6]} /></mesh>
        {[1, -1].map((k) => <Ball key={k} rad={0.5} sc={[0.1, 0.9, 0.5]} p={[k * 0.5, 1.75, -0.25]} r={[0.3, 0, k * 0.3]} m={st} />)}
        {[1, -1].map((k) => <Ball key={`h${k}`} rad={0.1} p={[k * 0.1, 1.55, 0.38]} m={st} />)}
        <Ball rad={0.28} sc={[0.9, 1, 0.7]} p={[0, 2.55, -0.05]} m={stL} />
        <Ball rad={0.14} p={[0, 2.98, -0.02]} m={stL} />
        <Cyl rt={0.08} rb={0.16} h={0.2} p={[0, 3.14, -0.02]} m={M.gold} seg={8} />
        {[1, -1].map((k) => <Cyl key={`a${k}`} rt={0.05} h={0.5} p={[k * 0.34, 2.55, 0.08]} r={[0.3, 0, k * 0.3]} m={stL} seg={6} />)}
      </group>
    );
  }

  /* timber entrance gate with a pair of stone lions */
  function BkGate({ p, r = 0 }) {
    const M = useM();
    const wood = M.mat('wood', 1, 2, { color: '#b0623a' });
    const st = M.plain('#8f897a', { roughness: 0.95 });
    const { Lion } = K;
    return (
      <group position={p} rotation={[0, r, 0]}>
        {[-1.5, 1.5].map((x) => <Box key={x} s={[0.5, 3.4, 0.5]} p={[x, 1.7, 0]} m={wood} />)}
        <Box s={[3.9, 0.45, 0.6]} p={[0, 3.2, 0]} m={wood} />
        <Box s={[3.0, 0.2, 0.62]} p={[0, 2.7, 0]} m={M.plain('#7a4a2a')} />
        <Roof w={4.8} d={1.9} h={0.9} y={3.4} m={M.plain('#a8402f', { roughness: 0.85 })} sag={1.2} />
        <Box s={[0.14, 2.5, 0.14]} p={[-0.5, 1.25, 0]} m={M.plain('#6b3d22')} cast={false} />
        <Box s={[0.14, 2.5, 0.14]} p={[0.5, 1.25, 0]} m={M.plain('#6b3d22')} cast={false} />
        {[-2.3, 2.3].map((x) => (
          <group key={x} position={[x, 0, 0.6]}>
            <Box s={[0.9, 0.45, 0.9]} p={[0, 0.22, 0]} m={st} />
            {Lion ? <group position={[0, 0.45, 0]} scale={0.4}><Lion m={st} /></group> : <Ball rad={0.35} sc={[1, 1.1, 1]} p={[0, 0.85, 0]} m={st} />}
          </group>
        ))}
      </group>
    );
  }

  function BkMain() {
    return (
      <group>
        <BkTankAndCourt />
        <BkWall />
        <BkDeck />
        <BkCanopy />
        <BkLamp />
        {/* the two weathered square stone pillars at the ends of the pool */}
        <BkPillar p={[-6.3, -1.7, -1.9]} h={5.3} />
        <BkPillar p={[6.3, -1.7, -1.9]} h={5.3} />
        <BkVishnu />
        <BkGaruda p={[-12, 0, 4]} r={0.5} />
        <BkGate p={[15, 0, 11]} r={-0.3} />
        <Frame s={[9.5, 3.4, 6]} p={[0, 1.2, 0]} />
      </group>
    );
  }

  /* ---------- environment ---------- */
  function BkTree({ p, s = 1, h = 4, c = 0 }) {
    const M = useM();
    const sets = [
      [M.plain('#4a6b34', { roughness: 1 }), M.plain('#587a3a', { roughness: 1 }), M.plain('#3e5f2f', { roughness: 1 })],
      [M.plain('#6b8a2e', { roughness: 1 }), M.plain('#7a9a3a', { roughness: 1 }), M.plain('#557a2c', { roughness: 1 })],
      [M.plain('#33583a', { roughness: 1 }), M.plain('#3f6b44', { roughness: 1 }), M.plain('#2c4d33', { roughness: 1 })],
    ];
    const g = sets[c % 3];
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.35} rb={0.6} h={h} p={[0, h / 2, 0]} m={M.plain('#5a4030')} seg={8} />
        <Cyl rt={0.14} rb={0.25} h={2.4} p={[0.9, h - 0.3, 0.2]} r={[0, 0, -0.8]} m={M.plain('#5a4030')} seg={6} />
        {[[0, 1.9, 0, 2.4], [1.9, 1.3, 0.3, 1.9], [-1.9, 1.4, -0.3, 2.0], [0.5, 2.9, -0.6, 1.7], [-0.7, 2.7, 1.1, 1.6]].map(([x, y, z, r], i) => (
          <Ball key={i} rad={r} sc={[1, 0.8, 1]} p={[x, h + y, z]} m={g[i % 3]} />
        ))}
      </group>
    );
  }

  /* the big white Newar building behind the platform: three storeys, red trim, double red roof, gold finial */
  function BkBuilding({ p, w = 8, d = 5.4, s = 1 }) {
    const M = useM();
    const wall = M.plain('#f1ebdd', { roughness: 0.85 });
    const redW = M.plain('#b0261f', { roughness: 0.8 });
    const redR = M.mat('roof', 4, 4, { color: '#d65a4c' });
    const yel = M.plain('#f1b60e', { roughness: 0.7 });
    const dark = M.plain('#2a1a14');
    const glass = M.plain('#ffd27a', { emissive: '#ffb347', emissiveIntensity: 0.6 });
    const zf = d / 2;
    const d3 = d - 1.8;
    return (
      <group position={p} scale={s}>
        {/* storey 1 */}
        <Box s={[w, 2.4, d]} p={[0, 1.2, 0]} m={wall} />
        <Box s={[w + 0.1, 0.2, d + 0.1]} p={[0, 2.45, 0]} m={redW} />
        <Box s={[1.5, 2.0, 0.15]} p={[0, 1.0, zf + 0.02]} m={dark} />
        <mesh position={[0, 2.0, zf + 0.03]} material={M.gold}><torusGeometry args={[0.8, 0.1, 8, 20, Math.PI]} /></mesh>
        {[-0.85, 0.85].map((x) => <Box key={x} s={[0.14, 2.0, 0.2]} p={[x, 1.0, zf + 0.05]} m={M.gold} />)}
        {[-3, -1.9, 1.9, 3].map((x) => <Box key={x} s={[0.6, 0.9, 0.1]} p={[x, 1.3, zf + 0.02]} m={redW} />)}
        {/* storey 2 with a yellow balcony rail */}
        <Box s={[w - 0.3, 2.0, d - 0.3]} p={[0, 3.55, 0]} m={wall} />
        {[-3, -1.5, 0, 1.5, 3].map((x) => (
          <group key={x} position={[x, 3.7, zf - 0.12]}>
            <Box s={[0.8, 1.1, 0.1]} m={redW} />
            <Box s={[0.56, 0.84, 0.12]} m={glass} cast={false} />
          </group>
        ))}
        <Box s={[w - 0.4, 0.07, 0.07]} p={[0, 3.45, zf + 0.35]} m={yel} cast={false} />
        <Box s={[w - 0.4, 0.05, 0.05]} p={[0, 3.1, zf + 0.35]} m={yel} cast={false} />
        {Array.from({ length: 20 }, (_, i) => <Box key={i} s={[0.05, 0.4, 0.05]} p={[-w / 2 + 0.35 + i * ((w - 0.7) / 19), 3.27, zf + 0.35]} m={yel} cast={false} />)}
        <Box s={[w - 0.2, 0.1, 0.8]} p={[0, 2.9, zf + 0.2]} m={redW} />
        <Roof w={w + 1.6} d={d + 1.6} h={1.5} y={4.6} m={redR} sag={1.4} />
        {/* storey 3 */}
        <Box s={[w - 2.6, 1.9, d3]} p={[0, 5.75, 0]} m={wall} />
        {[-1.3, 0, 1.3].map((x) => (
          <group key={x} position={[x, 5.85, d3 / 2 + 0.02]}>
            <Box s={[0.7, 0.9, 0.1]} m={redW} />
            <Box s={[0.46, 0.66, 0.12]} p={[0, 0, 0.01]} m={glass} cast={false} />
          </group>
        ))}
        <Box s={[w - 2.5, 0.18, d3 + 0.1]} p={[0, 6.8, 0]} m={redW} />
        <Roof w={w - 0.6} d={d3 + 1.4} h={1.5} y={6.9} m={redR} sag={1.4} />
        <Gajur y={8.3} s={1.8} />
      </group>
    );
  }

  /* small white stupa-like spire with a gold top */
  function BkSpire({ p, s = 1 }) {
    const M = useM();
    const wh = M.plain('#f4efe6', { roughness: 0.85 });
    return (
      <group position={p} scale={s}>
        <Box s={[1.8, 0.7, 1.8]} p={[0, 0.35, 0]} m={wh} />
        <Cyl rt={0.9} rb={1.0} h={0.35} p={[0, 0.88, 0]} m={wh} seg={16} />
        <Ball rad={0.85} sc={[1, 0.85, 1]} p={[0, 1.05, 0]} m={wh} />
        <Box s={[0.5, 0.4, 0.5]} p={[0, 1.95, 0]} m={M.gold} />
        {[0, 1, 2, 3, 4].map((i) => <Cyl key={i} rt={0.34 - i * 0.05} rb={0.38 - i * 0.05} h={0.12} p={[0, 2.25 + i * 0.14, 0]} m={M.gold} seg={12} />)}
        <mesh position={[0, 3.3, 0]} material={M.gold}><coneGeometry args={[0.1, 0.55, 8]} /></mesh>
      </group>
    );
  }

  function BkHouse({ p, w = 6, d = 5, h = 6, c = '#e8dfcf', roof = '#b24a3b', r = 0, win = '#6a4a3a' }) {
    const M = useM();
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[w, h, d]} p={[0, h / 2, 0]} m={M.plain(c, { roughness: 0.9 })} />
        {[0, 1].map((k) => [-1, 0, 1].map((j) => <Box key={`${k}${j}`} s={[0.7, 0.9, 0.1]} p={[j * (w / 3.4), 1.6 + k * 2.4, d / 2 + 0.02]} m={M.plain(win)} cast={false} />))}
        <Roof w={w + 0.8} d={d + 0.8} h={1.4} y={h} m={M.plain(roof, { roughness: 0.85 })} sag={1.1} lift={0.05} fascia={false} />
      </group>
    );
  }

  /* steep, high, dark forested Shivapuri ridge rising right behind the bazaar */
  function BkHill() {
    const M = useM();
    const g1 = M.mat('grass', 12, 6, { color: '#3f6a38' });
    const g2 = M.mat('grass', 12, 6, { color: '#365e32' });
    const g3 = M.mat('grass', 12, 6, { color: '#4e7a44' });
    const trees = useMemo(() => Array.from({ length: 150 }, (_, i) => {
      const x = (rnd(i) - 0.5) * 100; const y = 1 + rnd(i + 11) * 17;
      const q = 1 - (y / 20) ** 2 - (x / 64) ** 2;
      const z = -31 + 6 * Math.sqrt(Math.max(0.02, q)) - 0.3;
      return { x, y, z, s: 1.6 + rnd(i + 7) * 1.8, c: i % 5 };
    }), []);
    const tc = [M.plain('#254a28', { roughness: 1 }), M.plain('#2f5a2c', { roughness: 1 }), M.plain('#1f3f24', { roughness: 1 }), M.plain('#3e6a30', { roughness: 1 }), M.plain('#2a5030', { roughness: 1 })];
    return (
      <group>
        <Ball rad={1} sc={[64, 20, 6]} p={[0, 0, -31]} m={g1} />
        <Ball rad={1} sc={[30, 21, 12]} p={[-58, 0, -34]} m={g3} />
        <Ball rad={1} sc={[30, 23, 12]} p={[58, 0, -34]} m={g2} />
        {trees.map((t, i) => (
          <mesh key={i} position={[t.x, t.y + t.s * 0.9, t.z]} material={tc[t.c]}><coneGeometry args={[t.s, t.s * 2.8, 6]} /></mesh>
        ))}
      </group>
    );
  }

  function BkEnv() {
    const M = useM();
    return (
      <group>
        <BkBuilding p={[1.5, 0, -9.2]} s={1.1} />
        <BkSpire p={[-6.8, 0, -7.2]} s={1.2} />
        <group position={[-9.4, 0, -6.6]}>
          <Box s={[1.1, 1.0, 1.1]} p={[0, 0.5, 0]} m={M.plain('#f4efe6', { roughness: 0.85 })} />
          <Box s={[0.5, 0.6, 0.06]} p={[0, 0.45, 0.56]} m={M.plain('#2a1a14')} cast={false} />
          <Roof w={1.7} d={1.7} h={0.7} y={1.0} m={M.plain('#b0392f', { roughness: 0.85 })} sag={1.2} />
          <Gajur y={1.75} s={0.6} />
        </group>
        {/* the bazaar behind, muted colours, taller toward the hill */}
        <BkHouse p={[-12.5, 0, -11]} w={6.5} d={5} h={5} c="#f4efe4" roof="#b0392f" win="#b0261f" />
        <BkHouse p={[14, 0, -11]} w={7} d={5} h={5.5} c="#f4efe4" roof="#b0392f" win="#b0261f" />
        <BkHouse p={[-21, 0, -15]} w={7} d={5.5} h={6.5} c="#f1ebdd" roof="#b0392f" win="#b0261f" r={0.1} />
        <BkHouse p={[-5.5, 0, -19]} w={7} d={5} h={8} c="#d6bfa8" roof="#8a4a44" />
        <BkHouse p={[6, 0, -20]} w={8} d={6} h={8.5} c="#e0d8c8" roof="#546a54" r={-0.05} />
        <BkHouse p={[20, 0, -16]} w={6.5} d={5} h={6.5} c="#bf9a80" roof="#8a4a44" r={0.12} />
        {/* big leafy trees at the sides, off the sightline */}
        <BkTree p={[-11, 0, -6.5]} s={1.7} h={5.5} c={1} />
        <BkTree p={[-16, 0, -3]} s={1.5} h={5} c={0} />
        <BkTree p={[11.5, 0, -7]} s={1.2} h={4} c={2} />
        <BkTree p={[17, 0, -4]} s={1.3} h={4.5} c={0} />
        <BkTree p={[-2, 0, -14]} s={1.3} h={4.5} c={1} />
        <BkTree p={[22, 0, 6]} s={1.3} h={4} c={2} />
        <BkTree p={[-24, 0, 7]} s={1.4} h={4.5} c={1} />
        <BkTree p={[-31, 0, -4]} s={1.2} h={4} c={0} />
        <BkTree p={[34, 0, -10]} s={1.3} h={4} c={1} />
        <BkHill />
      </group>
    );
  }

  return { budhanilkantha: { Main: BkMain, Env: BkEnv } };
}
