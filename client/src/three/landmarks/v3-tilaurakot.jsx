// Tilaurakot (Kapilvastu / Taulihawa, Lumbini Province) - a flat, open-air archaeological site, NOT a standing monument.
// Scale: 1 unit ~ 12.5 m horizontally (enclosure 500 x 400 m -> 40 deep x 32 wide, 5:4). Brick stubs and trees are
// deliberately exaggerated in height so the low ruins stay legible; only trees rise high above the brick.
// Compass in this scene: EAST = +z (the default camera looks at the east gate + causeway), north = +x (right), south = -x (left),
// west = -z (back, Banganga river beyond the moat). Long axis of the enclosure is east-west (z).
export default function make(K) {
  const { useM, Diyo, Box, Cyl, Ball, Frame, Nandi, Trident, THREE, useMemo } = K;

  const HX = 16, HZ = 20;                       // rampart centre lines: x = +-16 (north/south), z = +-20 (east/west)
  const mkRng = (seed) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  function useBrick() {
    const M = useM();
    return {
      b: M.plain('#b2562b', { roughness: 0.95 }),   // orange-red face
      d: M.plain('#8a4522', { roughness: 0.95 }),   // darker brown
      moss: M.plain('#8c7a44', { roughness: 1 }),
      g: M.plain('#7f7a3c', { roughness: 1 }),      // greenish moss course
      o: M.plain('#c4672f', { roughness: 0.95 }),   // sunlit orange
      br: M.plain('#d96a28', { roughness: 0.9 }),   // bright gate brick
      k: M.plain('#6e3a1e', { roughness: 1 }),      // dark base course
    };
  }

  /* one straight brick wall stub with receding courses (dark base, mossy middle, orange face) */
  function Wall({ a, b, h = 0.3, t = 0.35, m, step = true, y0 = 0 }) {
    const B = useBrick();
    const dx = b[0] - a[0], dz = b[1] - a[1];
    const len = Math.hypot(dx, dz);
    const ang = -Math.atan2(dz, dx);
    const sh = Math.min(0.17, h * 0.38);
    return (
      <group position={[(a[0] + b[0]) / 2, y0, (a[1] + b[1]) / 2]} rotation={[0, ang, 0]}>
        {step && <Box s={[len + 0.3, sh, t + 0.5]} p={[0, sh / 2, 0]} m={B.k} />}
        {step && <Box s={[len + 0.15, sh * 2, t + 0.25]} p={[0, sh, 0]} m={B.g} />}
        <Box s={[len, h, t]} p={[0, h / 2, 0]} m={m} />
        {h > 0.3 && <Box s={[len * 0.97, 0.05, t * 0.9]} p={[0, h + 0.02, 0]} m={B.g} />}
      </group>
    );
  }

  /* rectangular ring of boxes (outer size w x d, thickness t) */
  function Ring({ w, d, t, h, m }) {
    return (
      <group>
        <Box s={[w, h, t]} p={[0, h / 2, (d - t) / 2]} m={m} />
        <Box s={[w, h, t]} p={[0, h / 2, -(d - t) / 2]} m={m} />
        <Box s={[t, h, d - 2 * t]} p={[(w - t) / 2, h / 2, 0]} m={m} />
        <Box s={[t, h, d - 2 * t]} p={[-(w - t) / 2, h / 2, 0]} m={m} />
      </group>
    );
  }

  /* a foundation of a room: three receding brick steps + thin partition walls (local coords) */
  function Room({ p, r = 0, w, d, parts = [], h = 0.5 }) {
    const B = useBrick();
    const hw = w / 2, hd = d / 2;
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Ring w={w + 0.95} d={d + 0.95} t={0.45} h={0.17} m={B.k} />
        <Ring w={w + 0.6} d={d + 0.6} t={0.36} h={0.34} m={B.g} />
        <Ring w={w + 0.28} d={d + 0.28} t={0.32} h={h} m={B.o} />
        {parts.map((q, i) => <Wall key={i} a={[q[0], q[1]]} b={[q[2], q[3]]} h={h * 0.7} t={0.28} m={i % 2 ? B.d : B.b} step={false} />)}
        <Box s={[0.5, 0.12, 0.4]} p={[hw - 0.5, 0.06, hd - 0.5]} m={B.moss} />
      </group>
    );
  }

  /* big solid stepped platform: receding courses, mossy faces */
  function Platform({ p, r = 0, w = 6, d = 2.5, h = 0.5 }) {
    const B = useBrick();
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[w + 0.5, h * 0.34, d + 0.5]} p={[0, h * 0.17, 0]} m={B.k} />
        <Box s={[w, h * 0.68, d]} p={[0, h * 0.34, 0]} m={B.g} />
        <Box s={[w - 0.7, h, d - 0.9]} p={[0, h / 2, -0.1]} m={B.o} />
        <Box s={[w - 1.5, h + 0.06, d - 1.6]} p={[0, (h + 0.06) / 2, -0.2]} m={B.b} />
        <Ball rad={0.5} p={[w / 2 - 0.5, 0.05, d / 2]} sc={[1.5, 0.35, 0.9]} m={B.moss} />
      </group>
    );
  }

  /* a long low terrace of three receding brick steps */
  function Terrace({ p, r = 0, len, d = 1.8 }) {
    const B = useBrick();
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[len, 0.17, d]} p={[0, 0.085, 0]} m={B.k} />
        <Box s={[len * 0.97, 0.34, d * 0.72]} p={[0, 0.17, -d * 0.05]} m={B.g} />
        <Box s={[len * 0.94, 0.51, d * 0.45]} p={[0, 0.255, -d * 0.1]} m={B.o} />
      </group>
    );
  }

  /* gateway ruin: two stepped brick jambs with a gap between them (no arch, no roof). Passage runs along local z. */
  function Gateway({ p, r = 0, gap = 1.7, depth = 2.0, wj = 1.1, tall = 1, bright = false }) {
    const B = useBrick();
    const face = bright ? B.br : B.b;
    const off = gap / 2 + wj / 2;
    return (
      <group position={p} rotation={[0, r, 0]}>
        {[-1, 1].map((k) => (
          <group key={k} position={[k * off, 0, 0]}>
            <Box s={[wj + 0.5, 0.1, depth + 0.5]} p={[0, 0.05, 0]} m={B.k} />
            <Box s={[wj + 0.25, 0.3 * tall, depth + 0.25]} p={[0, 0.15 * tall, 0]} m={B.g} />
            <Box s={[wj, 0.6 * tall, depth]} p={[0, 0.3 * tall, 0]} m={face} />
            <Box s={[wj * 0.62, 0.16 * tall, depth * 0.6]} p={[k * 0.1, 0.6 * tall + 0.08 * tall, 0.1]} m={B.d} />
          </group>
        ))}
      </group>
    );
  }

  /* corner / bastion tower stub: stepped brick */
  function Tower({ p, sz = 2.2 }) {
    const B = useBrick();
    return (
      <group position={p}>
        <Box s={[sz + 0.7, 0.16, sz + 0.7]} p={[0, 0.08, 0]} m={B.k} />
        <Box s={[sz + 0.2, 0.55, sz + 0.2]} p={[0, 0.34, 0]} m={B.g} />
        <Box s={[sz * 0.78, 0.5, sz * 0.78]} p={[0, 0.85, 0]} m={B.b} />
        <Box s={[sz * 0.5, 0.18, sz * 0.5]} p={[0, 1.19, 0]} m={B.d} />
      </group>
    );
  }

  /* collapsed corner: a spilled heap of brick and earth, no tower */
  function Collapsed({ p }) {
    const B = useBrick();
    return (
      <group position={p}>
        <Ball rad={1.5} p={[0, 0, 0]} sc={[1.3, 0.3, 1.2]} m={B.moss} />
        <Ball rad={0.9} p={[0.5, 0.05, 0.4]} sc={[1.3, 0.35, 1]} m={B.d} />
        <Box s={[0.7, 0.2, 0.5]} p={[-0.6, 0.1, -0.5]} r={[0, 0.5, 0]} m={B.b} />
      </group>
    );
  }

  /* a broken stretch of brick-faced earth rampart (grassy bank, brick face on ~60% of segments) */
  function Rampart({ side }) {
    const M = useM(); const B = useBrick();
    const earth = M.plain('#7f9a46', { roughness: 1 });
    const earth2 = M.plain('#a09a54', { roughness: 1 });
    const segs = useMemo(() => {
      const r = mkRng(side.seed);
      const out = [];
      const L = side.len;
      let t = -L / 2;
      while (t < L / 2 - 0.6) {
        const gapHere = (side.gaps || []).some(([g0, g1]) => t + 1 > g0 - 0.2 && t < g1);
        if (gapHere) { const g = side.gaps.find(([g0, g1]) => t + 1 > g0 - 0.2 && t < g1); t = g[1]; continue; }
        let len = 2.5 + r() * 4.5;
        let end = Math.min(t + len, L / 2);
        (side.gaps || []).forEach(([g0]) => { if (t < g0 && end > g0) end = g0; });
        if (end - t > 0.6 && !(side.skip || []).some(([s0, s1]) => (t + end) / 2 > s0 && (t + end) / 2 < s1)) {
          out.push({ t0: t, t1: end, h: 0.2 + r() * r() * 0.7 + r() * 0.12, face: r() > 0.4 });
        }
        t = end + (r() > 0.55 ? 0.3 + r() * 1.1 : 0.05);
      }
      return out;
    }, [side]);
    const c = side.c;
    return (
      <group position={[c[0], 0, c[1]]} rotation={[0, side.r, 0]}>
        {segs.map((s, i) => {
          const len = s.t1 - s.t0; const mid = (s.t0 + s.t1) / 2;
          return (
            <group key={i} position={[mid, 0, 0]}>
              <Box s={[len, s.h * 0.6, 1.6]} p={[0, s.h * 0.3, 0]} m={i % 2 ? earth : earth2} />
              <Box s={[len * 0.98, s.h, 0.9]} p={[0, s.h / 2, 0]} m={earth} />
              {s.face && <Box s={[len * 0.97, s.h * 0.8, 0.26]} p={[0, s.h * 0.4, 0.55]} m={i % 3 === 0 ? B.d : i % 3 === 1 ? B.o : B.g} />}
            </group>
          );
        })}
      </group>
    );
  }

  /* big spreading shade tree (banyan / sal / pipal): thick grey trunk, forked limbs, wide irregular canopy.
     lite = fewer blobs, no limbs (distant trees). */
  function BigTree({ p, s = 1, lean = 0, hue = 0, seed = 1, lite = false }) {
    const M = useM();
    const bark = M.plain('#7a7166', { roughness: 1 });
    const gs = [['#2f5a2a', '#3f6c2f', '#4f7a34'], ['#2c5428', '#386530', '#47722f'], ['#34612c', '#44702f', '#52803a']][hue % 3];
    const mats = gs.map((c) => M.plain(c, { roughness: 1 }));
    const n = lite ? 5 : 13;
    const blobs = useMemo(() => {
      const r = mkRng(seed * 13 + 5);
      return Array.from({ length: n }, (_, i) => {
        const a = (i / n) * 6.283 + r() * 0.8;
        const d = i === 0 ? 0 : 0.8 + r() * 0.9;
        return [Math.cos(a) * d, 1.7 + r() * 0.55 + (i % 4 === 0 ? 0.35 : 0), Math.sin(a) * d, 0.55 + r() * 0.4, i % 3];
      });
    }, [seed, n]);
    return (
      <group position={p} scale={s} rotation={[0, seed, lean]}>
        <Cyl rt={0.15} rb={0.3} h={1.6} p={[0, 0.8, 0]} m={bark} seg={9} />
        {!lite && [0, 1.7, 3.5, 5.0].map((a, i) => <Cyl key={i} rt={0.05} rb={0.11} h={1.2} p={[Math.cos(a) * 0.35, 1.95, Math.sin(a) * 0.35]} r={[Math.sin(a) * 0.65, 0, -Math.cos(a) * 0.65]} m={bark} seg={6} />)}
        {blobs.map((b, i) => <Ball key={i} rad={b[3]} p={[b[0], b[1], b[2]]} sc={[1.35, 0.72, 1.35]} m={mats[b[4]]} />)}
      </group>
    );
  }

  function SandPatch({ p, w, d, r = 0, c = '#cdb98e' }) {
    const M = useM();
    return <mesh position={[p[0], 0.012, p[1]]} rotation={[-Math.PI / 2, 0, r]} scale={[w, d, 1]} material={M.plain(c, { roughness: 1 })} receiveShadow><circleGeometry args={[0.5, 20]} /></mesh>;
  }

  /* ================================= MAIN ================================= */
  function TilaurakotMain() {
    const M = useM(); const B = useBrick();
    const moatM = M.plain('#5d7a4a', { roughness: 0.2, metalness: 0.2 });
    const grn = M.plain('#8aa04c', { roughness: 1 });
    const dust = M.plain('#bfae80', { roughness: 1 });
    const waterM = M.plain('#4e6b4c', { roughness: 0.25, metalness: 0.1 });
    const ash = M.plain('#4a4642', { roughness: 1 });
    const sandy = '#d3bf92';

    const sides = useMemo(() => ({
      N: { c: [HX, 0], r: Math.PI / 2, len: 40, seed: 3, gaps: [[-1.5, 1.5]], skip: [[14, 20]] },      // north (+x), runs along z
      S: { c: [-HX, 0], r: -Math.PI / 2, len: 40, seed: 7, gaps: [], skip: [[-20, -16], [8, 12]] },
      S2: { c: [-HX - 1.5, 0], r: -Math.PI / 2, len: 36, seed: 11, gaps: [], skip: [[-3, 4], [12, 18]] },
      W: { c: [0, -HZ], r: Math.PI, len: 32, seed: 5, gaps: [[-2.5, 0.5]], skip: [[-16, -11]] },
      E: { c: [0, HZ], r: 0, len: 32, seed: 9, gaps: [[-1.8, 1.8]], skip: [[7, 11]] },
      E2: { c: [0, HZ + 1.5], r: 0, len: 28, seed: 13, gaps: [[-1.8, 1.8]], skip: [[-11, -6]] },
    }), []);

    /* inner ~100 m palace complex (8 x 8), walls with N and W gateways, room grid inside */
    const IW = 4;
    const innerWalls = [
      [[-IW, -IW], [-0.8, -IW]], [[1.9, -IW], [IW, -IW]],
      [[IW, -IW], [IW, -1.0]], [[IW, 1.0], [IW, 2.6]],
      [[-IW, IW], [-0.3, IW]], [[1.3, IW], [3.1, IW]],
      [[-IW, -IW], [-IW, 1.2]], [[-IW, 2.8], [-IW, IW]],
    ];
    const innerParts = [
      [[-3.8, -1.4], [-0.6, -1.4]], [[0.6, -1.4], [3.8, -1.4]],
      [[-3.8, 1.5], [1.2, 1.5]], [[2.0, 1.5], [3.8, 1.5]],
      [[-1.5, -3.8], [-1.5, -1.4]], [[1.6, -3.8], [1.6, -1.4]],
      [[-1.2, 1.5], [-1.2, 3.8]], [[2.2, 1.5], [2.2, 3.8]], [[-1.5, -1.4], [-1.5, 1.5]],
    ];

    return (
      <group>
        {/* ground: bare dusty earth inside the walls, short grass at the edges and over the moat margins */}
        <Box s={[35.4, 0.05, 43.4]} p={[-0.7, -0.025, 0.7]} m={dust} cast={false} />
        <Box s={[8, 0.05, 61]} p={[22.3, -0.03, 0.5]} m={grn} cast={false} />
        <Box s={[8, 0.05, 61]} p={[-23.7, -0.03, 0.5]} m={grn} cast={false} />
        <Box s={[38, 0.05, 8]} p={[-0.7, -0.03, -26.3]} m={grn} cast={false} />
        <Box s={[38, 0.05, 8]} p={[-0.7, -0.03, 27.7]} m={grn} cast={false} />
        {/* grass tufts at the inner edge of the walls */}
        <Box s={[2, 0.04, 36]} p={[13.6, 0.0, 0.5]} m={grn} cast={false} />
        <Box s={[2, 0.04, 36]} p={[-14.8, 0.0, 0.5]} m={grn} cast={false} />
        <Box s={[28, 0.04, 2]} p={[-0.7, 0.0, -17.8]} m={grn} cast={false} />
        <Box s={[28, 0.04, 2]} p={[-0.7, 0.0, 18.2]} m={grn} cast={false} />
        {/* moat: 2.5 wide darker green-brown silted water outside the rampart, doubled on the south and east */}
        <Box s={[2.5, 0.05, 48]} p={[18.7, 0.02, 0.7]} m={moatM} cast={false} />
        <Box s={[2.5, 0.05, 48]} p={[-20.2, 0.02, 0.7]} m={moatM} cast={false} />
        <Box s={[42, 0.05, 2.5]} p={[-0.7, 0.02, -23.0]} m={moatM} cast={false} />
        <Box s={[42, 0.05, 2.5]} p={[-0.7, 0.02, 24.0]} m={moatM} cast={false} />
        {/* rampart */}
        {Object.entries(sides).map(([k, s]) => <Rampart key={k} side={s} />)}
        {/* corner / south tower stubs; two corners have collapsed (no tower) */}
        <Tower p={[-HX - 0.5, 0, 0]} sz={2.6} />
        <Tower p={[HX, 0, HZ]} sz={2.0} />
        <Tower p={[-HX, 0, -HZ]} sz={2.4} />
        <Collapsed p={[HX, 0, -HZ]} />
        <Collapsed p={[-HX, 0, HZ]} />

        {/* east gate (+z): tall twin jambs through the inner and outer wall, a clear gap, sandy causeway over the moat */}
        <Gateway p={[0, 0, HZ]} gap={2.3} depth={1.7} tall={1.6} />
        <Gateway p={[0, 0, HZ + 1.5]} gap={2.3} depth={1.3} wj={0.9} tall={1.2} bright />
        <Box s={[2.6, 0.09, 6.2]} p={[0, 0.05, HZ + 3.2]} m={M.plain(sandy)} />
        <Box s={[3.4, 0.05, 1.0]} p={[0, 0.03, HZ + 6.5]} m={M.plain(sandy)} />
        {/* bare sandy earth: the dominant floor inside the walls */}
        <SandPatch p={[0, 16]} w={4} d={8} />
        <SandPatch p={[-0.5, 10]} w={5} d={8} r={0.1} />
        <SandPatch p={[-2, 4]} w={9} d={7} />
        <SandPatch p={[7, -9]} w={9} d={6} r={0.5} />
        <SandPatch p={[-9, -5]} w={8} d={6} r={0.3} />
        <SandPatch p={[-8.5, 10]} w={7} d={6} />
        <SandPatch p={[9, 9]} w={6} d={4} r={0.8} />
        <SandPatch p={[3, 0]} w={7} d={5} r={0.2} />
        <SandPatch p={[-3, -12]} w={9} d={5} r={-0.2} />
        <SandPatch p={[10, 0]} w={4} d={7} r={1.4} />

        {/* inner palace complex: stepped walls, N and W gateways with bastions, room grid */}
        {innerWalls.map((w, i) => <Wall key={i} a={w[0]} b={w[1]} h={0.55} t={0.4} m={i % 2 ? B.o : B.b} />)}
        <Gateway p={[IW, 0, 0]} r={Math.PI / 2} gap={1.7} depth={0.9} wj={0.9} tall={1.1} />
        <Gateway p={[0.55, 0, -IW]} gap={1.6} depth={0.9} wj={1.0} tall={1.1} />
        <Box s={[0.9, 0.7, 1.6]} p={[IW + 0.55, 0.35, 1.9]} m={B.o} />
        <Box s={[1.6, 0.4, 0.9]} p={[-3, 0.2, -IW - 0.55]} m={B.d} />
        {innerParts.map((w, i) => <Wall key={i} a={w[0]} b={w[1]} h={0.36} t={0.28} m={i % 2 ? B.d : B.b} step={false} />)}
        <Box s={[1.6, 0.28, 1.0]} p={[-2.5, 0.14, 2.7]} m={B.d} />
        <Box s={[0.9, 0.24, 0.9]} p={[2.7, 0.12, -2.7]} m={B.d} />

        {/* room foundations in the citadel (three-step rings with thin partitions) */}
        <Room p={[-1, 0, -9.5]} w={6} d={3.6} parts={[[-1, -1.8, -1, 1.8], [1.5, -1.8, 1.5, 0.2]]} />
        <Room p={[9.5, 0, 9.5]} r={0.1} w={4.2} d={3} parts={[[-0.8, -1.5, -0.8, 0.9], [-2.1, 0.2, 0.9, 0.2], [1.1, -1.5, 1.1, 0]]} />
        <Room p={[10.5, 0, -5.5]} w={3.4} d={2.6} parts={[[0.2, -1.3, 0.2, 1.3]]} />
        <Room p={[-9.5, 0, -2.5]} r={-0.15} w={4.4} d={3.2} parts={[[-0.6, -1.6, -0.6, 1.6], [-2.2, 0.3, -0.6, 0.3]]} />
        <Room p={[-11.5, 0, 3.5]} r={0.1} w={3.0} d={2.2} parts={[[0, -1.1, 0, 1.1]]} />
        <Room p={[12.5, 0, 2.5]} w={2.2} d={1.8} />
        <Room p={[4, 0, -14]} w={4.6} d={2.6} parts={[[-1.2, -1.3, -1.2, 1.3], [1.2, -1.3, 1.2, 1.3]]} />
        <Room p={[-7, 0, -13]} w={3} d={2.2} parts={[[0, -1.1, 0, 1.1]]} />
        <Terrace p={[-8.2, 0, 7.2]} r={0.04} len={8.5} />
        <Terrace p={[7.0, 0, 4.5]} r={Math.PI / 2 + 0.05} len={4.5} d={1.4} />
        {/* big multi-step platforms in the foreground centre (photos 1 and 2) */}
        <Platform p={[-4.6, 0, 14.2]} r={0.04} w={6} d={2.6} h={0.5} />
        <Platform p={[5.2, 0, 13.4]} r={-0.12} w={5.4} d={2.4} h={0.46} />
        <Platform p={[-2.0, 0, 8.8]} r={0.0} w={3.6} d={1.8} h={0.4} />
        {/* loose brick stubs / lone wall pieces */}
        <Box s={[0.4, 0.34, 0.34]} p={[3.2, 0.17, 9.6]} m={B.d} />
        <Box s={[0.5, 0.16, 0.34]} p={[-4.4, 0.08, 11.4]} m={B.b} />
        <Wall a={[2, -7]} b={[5.4, -7.4]} h={0.3} t={0.3} m={B.d} step={false} />
        <Wall a={[13, 7.2]} b={[13.4, 11]} h={0.3} t={0.3} m={B.d} step={false} />
        {/* eroded brick rubble heaps */}
        <Ball rad={1.1} p={[-6.2, 0, 10.6]} sc={[1.6, 0.36, 1.1]} m={B.moss} />
        <Ball rad={0.7} p={[-5.0, 0, 10.0]} sc={[1.3, 0.32, 0.9]} m={B.d} />
        <Ball rad={0.9} p={[13.5, 0, -11]} sc={[1.4, 0.32, 1.1]} m={B.moss} />
        <Ball rad={0.95} p={[7.4, 0, 18.0]} sc={[1.5, 0.34, 1.0]} m={B.g} />
        <Ball rad={0.8} p={[-10.5, 0, -8.5]} sc={[1.4, 0.34, 1.0]} m={B.o} />
        <Ball rad={0.9} p={[1.5, 0, -4.8]} sc={[1.5, 0.3, 1.1]} m={B.moss} />
        <Ball rad={0.6} p={[-13.2, 0, 11.5]} sc={[1.4, 0.32, 1.0]} m={B.d} />

        {/* square brick-lined tank beside the north gate of the inner complex (30 m = 2.4) */}
        <group position={[7.6, 0, 0.8]}>
          <Box s={[3.1, 0.14, 3.1]} p={[0, 0.07, 0]} m={B.k} />
          <Box s={[2.5, 0.06, 2.5]} p={[0, 0.1, 0]} m={waterM} cast={false} />
          <Wall a={[-1.3, -1.3]} b={[1.3, -1.3]} h={0.34} t={0.3} m={B.b} step={false} />
          <Wall a={[-1.3, 1.3]} b={[1.3, 1.3]} h={0.34} t={0.3} m={B.b} step={false} />
          <Wall a={[-1.3, -1.3]} b={[-1.3, 1.3]} h={0.34} t={0.3} m={B.o} step={false} />
          <Wall a={[1.3, -1.3]} b={[1.3, 1.3]} h={0.34} t={0.3} m={B.o} step={false} />
        </group>
        {/* fire pit: ring of ash */}
        <mesh position={[3.6, 0.02, 6.0]} rotation={[-Math.PI / 2, 0, 0]} material={ash}><ringGeometry args={[0.22, 0.6, 20]} /></mesh>
        <mesh position={[3.6, 0.018, 6.0]} rotation={[-Math.PI / 2, 0, 0]} material={M.plain('#8b8681', { roughness: 1 })}><circleGeometry args={[0.22, 14]} /></mesh>

        {/* Shiva linga under the banyan, front-left (south-east) of the citadel so the red stone shows */}
        <ShivaShrine p={[-9.8, 0, 17.0]} />

        {/* huge shade trees: two foreground repoussoir trees left and right, centre kept open */}
        <BigTree p={[21.5, 0, 9.5]} s={2.7} lean={0.04} seed={2} hue={0} />
        <BigTree p={[-22.5, 0, 12.5]} s={2.6} lean={-0.04} seed={4} hue={1} />
        <BigTree p={[12.5, 0, -2.5]} s={2.2} seed={6} hue={2} lean={0.03} />
        <BigTree p={[-12.5, 0, -10.5]} s={2.3} seed={8} hue={0} lean={0.05} />
        <BigTree p={[3, 0, -17.5]} s={2.2} seed={10} hue={1} lean={-0.04} />
        <BigTree p={[11.5, 0, -13]} s={2.3} seed={12} hue={2} lean={0.04} />

        {/* two long near-parallel strings of prayer flags between the two outer big trees */}
        <Flags from={[-22.5, 3.6, 12.5]} to={[21.5, 3.6, 9.5]} sag={0.5} />
        <Flags from={[-22.0, 3.0, 13.6]} to={[21.0, 3.0, 10.6]} sag={0.5} />

        <Frame s={[28, 3.4, 33]} p={[-0.5, 1.7, 2]} />
      </group>
    );
  }

  function Flags({ from, to, sag = 0.5 }) {
    const n = Math.max(10, Math.round(Math.hypot(to[0] - from[0], to[2] - from[2]) / 0.5));
    const cols = ['#2f6fd0', '#f4f4f4', '#d8312a', '#2f9a4a', '#f2c230'];
    const pts = useMemo(() => Array.from({ length: n }, (_, i) => {
      const t = (i + 0.5) / n; const sg = Math.sin(t * Math.PI) * sag;
      return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t - sg, from[2] + (to[2] - from[2]) * t];
    }), [from, to, n, sag]);
    const ang = Math.atan2(to[0] - from[0], to[2] - from[2]);
    return (
      <group>
        {pts.map((q, i) => (
          <mesh key={i} position={[q[0], q[1] - 0.13, q[2]]} rotation={[0, ang - Math.PI / 2, 0]}>
            <planeGeometry args={[0.35, 0.25]} />
            <meshStandardMaterial color={cols[i % 5]} side={THREE.DoubleSide} roughness={1} />
          </mesh>
        ))}
      </group>
    );
  }

  /* Shiva linga with a banyan whose aerial roots wrap an old brick wall (photo 4) */
  function ShivaShrine({ p }) {
    const M = useM(); const B = useBrick();
    const root = M.plain('#7b6c58', { roughness: 1 });
    const red = M.plain('#c8381f', { roughness: 0.8 });
    const cloth = M.plain('#d0202c', { roughness: 1 });
    const mari = M.plain('#f29a1c', { roughness: 1 });
    const roots = useMemo(() => {
      const r = mkRng(77);
      return Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * 6.283 + r() * 0.3, d = 0.7 + r() * 1.3;
        return [Math.cos(a) * d, Math.sin(a) * d, 0.5 + r() * 1.1, 0.025 + r() * 0.03];
      });
    }, []);
    return (
      <group position={p} scale={1.8}>
        {/* banyan set back behind the linga so its canopy does not hide the red stone */}
        <group position={[-0.2, 0, -1.7]}>
          <BigTree p={[0, 0, 0]} s={1.2} seed={21} hue={0} lean={0.02} />
          <Cyl rt={0.2} rb={0.42} h={1.0} p={[0, 0.5, -0.05]} m={M.plain('#8a847a', { roughness: 1 })} seg={9} />
          {roots.map((q, i) => <Cyl key={i} rt={q[3]} rb={q[3] * 0.6} h={q[2] + 0.9} p={[q[0] * 0.7, 1.8 - (q[2] + 0.9) / 2 + 0.55, q[1] * 0.5]} m={root} seg={5} />)}
        </group>
        {/* old brick wall with a niche (dark alcove) behind the linga */}
        <group position={[0.3, 0, -0.95]}>
          <Box s={[2.2, 0.55, 0.25]} p={[0, 0.275, 0]} m={B.b} />
          <Box s={[0.5, 0.34, 0.06]} p={[0, 0.22, 0.13]} m={M.plain('#3a2a22')} />
          <Box s={[0.6, 0.12, 0.28]} p={[0.5, 0.58, 0]} m={B.d} />
          {[0.2, 0.8, -0.5].map((x, i) => <Cyl key={i} rt={0.04} rb={0.08} h={0.6} p={[x, 0.3, 0.16]} m={root} seg={5} />)}
        </group>
        <SandPatch p={[0.5, 0.2]} w={3.6} d={3.4} />
        {/* the linga */}
        <group position={[0.6, 0, 0.5]}>
          <Cyl rt={0.1} rb={0.12} h={0.36} p={[0, 0.2, 0]} m={red} seg={14} />
          <Ball rad={0.1} p={[0, 0.38, 0]} m={red} />
          <Cyl rt={0.125} rb={0.135} h={0.14} p={[0, 0.24, 0]} m={cloth} seg={14} />
          <Cyl rt={0.14} rb={0.14} h={0.05} p={[0, 0.34, 0]} m={mari} seg={14} />
          <Ball rad={0.2} p={[0, 0.03, 0]} sc={[1.5, 0.3, 1.5]} m={mari} />
          {[[0.15, 0.05, 0.1], [-0.18, 0.04, 0.05], [0.05, 0.04, 0.22], [-0.1, 0.05, -0.15], [0.22, 0.04, -0.1]].map((q, i) => <Ball key={i} rad={0.045} p={q} m={i % 2 ? mari : M.plain('#d83a5a')} />)}
          <Trident p={[-0.3, 0, -0.05]} h={0.55} />
        </group>
        {[[0.2, 0.05, 0.9], [0.5, 0.05, 1.05], [0.85, 0.05, 0.95], [1.0, 0.05, 0.6], [0.0, 0.05, 0.7]].map((q, i) => <Diyo key={i} p={q} />)}
        <pointLight position={[0.6, 0.5, 0.8]} intensity={3} distance={5} color="#ffb35a" />
        {/* red cloth and small bull */}
        <Box s={[0.7, 0.01, 0.4]} p={[1.6, 0.02, 0.8]} r={[0, 0.4, 0]} m={cloth} cast={false} />
        <group position={[1.7, 0, 0.9]} scale={0.3}>
          <Nandi p={[0, 0, 0]} face={-0.8} />
        </group>
        <Box s={[0.34, 0.03, 0.3]} p={[1.7, 0.27, 0.9]} r={[0, -0.8, 0]} m={cloth} cast={false} />
      </group>
    );
  }

  /* ================================= ENV ================================= */
  function TilaurakotEnv() {
    const M = useM();
    const grass = M.plain('#7e9a48', { roughness: 1 });

    const fields = useMemo(() => {
      const rr = mkRng(99); const out = [];
      const cols = ['#86a04e', '#93a456', '#a6ac62', '#7c9646', '#9b8c5e', '#8aa052', '#6f8c42'];
      for (let i = 0; i < 30; i++) {
        const a = rr() * 6.283, d = 30 + rr() * 26;
        const x = Math.cos(a) * d, z = Math.sin(a) * d;
        if (z < -29 && z > -48) continue;
        if (x < -22 && x > -36 && z > 10 && z < 34) continue;
        if (x < -27 && x > -33 && z < -4 && z > -18) continue;
        if (x < -42) continue;
        if (x < -4 && x > -22 && z > 28 && z < 52) continue;
        out.push([x, z, 5 + rr() * 8, 4 + rr() * 8, rr() * 3, cols[i % cols.length]]);
      }
      return out;
    }, []);

    /* irregular clumps of trees of different heights, with trunks */
    const clumps = useMemo(() => {
      const rr = mkRng(555); const out = [];
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * 6.283 + rr() * 0.12;
        const d = 54 + rr() * 8;
        const x = Math.cos(a) * d, z = Math.sin(a) * d;
        if (z < -42 && z > -48 && Math.abs(x) < 14) continue;
        if (x > -30 && z > 24) continue;
        out.push({ x, z, h: 1.2 + rr() * rr() * 3.4, w: 1.4 + rr() * 1.8, k: Math.floor(rr() * 3), q: rr() * 6 });
      }
      return out;
    }, []);
    const scatter = useMemo(() => {
      const rr = mkRng(808); const out = [];
      const ok = (x, z) => !(z < -27 && z > -50) && !(x < -19 && x > -37 && z > 9 && z < 36) && !(x < -4 && x > -22 && z > 28 && z < 52) && x > -41 && !(x > -30 && z > 24) && !(x > 12 && z > -10);
      for (let i = 0; i < 40 && out.length < 12; i++) {
        const a = rr() * 6.283, d = 29 + rr() * 22;
        const x = Math.cos(a) * d, z = Math.sin(a) * d;
        if (ok(x, z)) out.push([x, z, 1.1 + rr() * 0.8, Math.floor(rr() * 3), rr() * 6]);
      }
      return out;
    }, []);

    const g1 = M.plain('#35602c', { roughness: 1 });
    const g2 = M.plain('#4a7432', { roughness: 1 });
    const g3 = M.plain('#5f8236', { roughness: 1 });
    const gm = [g1, g2, g3];
    const bark = M.plain('#76695a', { roughness: 1 });
    const sand = M.plain('#d8c78f', { roughness: 1 });
    const pole = M.plain('#8c8780', { roughness: 0.9 });
    const stupaM = useBrick();
    const skyMat = useMemo(() => {
      const c = document.createElement('canvas'); c.width = 4; c.height = 256;
      const x = c.getContext('2d'); const gr = x.createLinearGradient(0, 0, 0, 256);
      gr.addColorStop(0, '#9fc3e4'); gr.addColorStop(0.45, '#cfe0ee'); gr.addColorStop(0.5, '#e9eef0'); gr.addColorStop(1, '#e9eef0');
      x.fillStyle = gr; x.fillRect(0, 0, 4, 256);
      const t = new THREE.CanvasTexture(c);
      return new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: '#ffffff', emissiveIntensity: 0.6, roughness: 1, metalness: 0, side: THREE.BackSide, fog: false, depthWrite: false });
    }, []);

    return (
      <group>
        <mesh material={skyMat}><sphereGeometry args={[110, 24, 12]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} receiveShadow material={grass}><circleGeometry args={[72, 64]} /></mesh>
        {fields.map((f, i) => (
          <mesh key={i} position={[f[0], -0.045, f[1]]} rotation={[-Math.PI / 2, 0, f[4]]} scale={[f[2] / 2, f[3] / 2, 1]} material={M.plain(f[5], { roughness: 1 })} receiveShadow>
            <circleGeometry args={[1, 20]} />
          </mesh>
        ))}

        {/* Banganga river along the WEST (back) side: sandy flood-plain band, shallow braided channel, reeds */}
        <group position={[0, 0, -39]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} material={sand}><planeGeometry args={[130, 14]} /></mesh>
          {[[-30, 2, 22, 0.1], [-10, -1.2, 24, -0.08], [12, 1.2, 24, 0.1], [34, -1.5, 24, -0.06]].map((q, i) => (
            <mesh key={i} rotation={[-Math.PI / 2, 0, q[3]]} position={[q[0], -0.03, q[1]]} material={M.plain('#6f969c', { roughness: 0.2, metalness: 0.15 })}><planeGeometry args={[q[2], 2.8]} /></mesh>
          ))}
          {Array.from({ length: 20 }, (_, i) => <Cyl key={i} rt={0.02} rb={0.05} h={0.9} p={[-45 + i * 4.6, 0.4, 3.6 + ((i * 37) % 5) * 0.4]} m={M.plain('#9ca85a')} seg={4} />)}
        </group>

        {/* stupa base ~220 m SE of the east gate + two silted ponds beyond */}
        <group position={[-9, 0, 34]} scale={1.5}>
          <Cyl rt={1.5} rb={1.7} h={0.1} p={[0, 0.05, 0]} m={stupaM.k} seg={20} />
          <Cyl rt={1.1} rb={1.3} h={0.25} p={[0, 0.2, 0]} m={stupaM.g} seg={20} />
          <Cyl rt={0.85} rb={1.0} h={0.2} p={[0, 0.42, 0]} m={stupaM.b} seg={20} />
        </group>
        {[[-15, 46, 5, 3.6, 0.3], [-4, 49, 4.4, 3, -0.4]].map((q, i) => (
          <group key={i}>
            <mesh position={[q[0], 0.005, q[1]]} rotation={[-Math.PI / 2, 0, q[4]]} scale={[q[2], q[3], 1]} material={M.plain('#5f7a4e', { roughness: 0.3 })}><circleGeometry args={[1, 24]} /></mesh>
            {Array.from({ length: 6 }, (_, j) => <Cyl key={j} rt={0.02} rb={0.05} h={0.7} p={[q[0] + Math.cos(j) * q[2] * 0.9, 0.35, q[1] + Math.sin(j) * q[3] * 0.9]} m={M.plain('#8a9a4a')} seg={4} />)}
          </group>
        ))}

        {/* Lohasariya iron-slag mound just south of the citadel */}
        <Ball rad={3.4} p={[-30, -0.2, -9]} sc={[1.5, 0.35, 1.1]} m={M.plain('#6a5e52', { roughness: 1 })} />
        <Ball rad={3.0} p={[-30, 0.05, -9]} sc={[1.4, 0.3, 1.0]} m={M.plain('#7d8f4a', { roughness: 1 })} />

        {/* Samai Mai: small modern shrine on a mound south of the citadel, long scalloped orange wall, white arched gate, big tree */}
        <group position={[-26, 0, 22]}>
          <Ball rad={6.5} p={[0, -0.1, 0]} sc={[1, 0.2, 1]} m={M.plain('#7f9a48', { roughness: 1 })} />
          <SamaiMai />
          <BigTree p={[-1.8, 0.8, -3.2]} s={1.6} seed={31} hue={1} />
        </group>

        {/* scattered tall trees on the plain */}
        {scatter.map((t, i) => <BigTree key={i} p={[t[0], 0, t[1]]} s={t[2]} seed={t[4]} hue={t[3]} lean={0} lite />)}
        {/* horizon tree clumps of different heights */}
        {clumps.map((c, i) => (
          <group key={i} position={[c.x, 0, c.z]}>
            <Cyl rt={0.18} rb={0.3} h={c.h} p={[0, c.h / 2, 0]} m={bark} seg={6} />
            <Ball rad={c.w} p={[0, c.h + c.w * 0.3, 0]} sc={[1.3, 0.8, 1.3]} m={gm[c.k]} />
            <Ball rad={c.w * 0.75} p={[c.w * 1.1, c.h * 0.8 + c.w * 0.2, 0.5]} sc={[1.2, 0.8, 1.2]} m={gm[(c.k + 1) % 3]} />
            {c.q > 3 && <Ball rad={c.w * 0.7} p={[-c.w * 1.1, c.h * 0.7, -0.4]} sc={[1.2, 0.8, 1.2]} m={gm[(c.k + 2) % 3]} />}
          </group>
        ))}

        {/* far south: a modern road, power poles, a few small houses (kept minimal and distant) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-47, -0.03, 0]} material={M.plain('#5c5b59', { roughness: 0.95 })}><planeGeometry args={[3.4, 110]} /></mesh>
        {Array.from({ length: 7 }, (_, i) => (
          <group key={i} position={[-45, 0, -42 + i * 14]}>
            <Cyl rt={0.07} rb={0.1} h={3.4} p={[0, 1.7, 0]} m={pole} seg={6} />
            <Box s={[0.12, 0.1, 1.6]} p={[0, 3.2, 0]} m={pole} />
          </group>
        ))}
        {[[-52, 8, 2.8, '#e7d9c4'], [-53, 18, 2.4, '#7fb2d8'], [-51, -14, 3, '#d9c0a8'], [-54, 30, 2.6, '#cfd6b8']].map((h, i) => (
          <group key={i} position={[h[0], 0, h[1]]}>
            <Box s={[h[2], 1.6, h[2] * 1.2]} p={[0, 0.8, 0]} m={M.plain(h[3], { roughness: 0.9 })} />
            <Box s={[h[2] + 0.2, 0.12, h[2] * 1.2 + 0.2]} p={[0, 1.66, 0]} m={M.plain('#9b958c')} />
          </group>
        ))}
      </group>
    );
  }

  /* Samai Mai shrine: long low orange scalloped wall and a white arched gate (small, modern) */
  function SamaiMai() {
    const M = useM();
    const org = M.plain('#f5a623', { roughness: 0.7, emissive: '#f5a623', emissiveIntensity: 0.25 });
    const org2 = M.plain('#f08a1c', { roughness: 0.7, emissive: '#f08a1c', emissiveIntensity: 0.25 });
    const white = M.plain('#f8f4ec', { roughness: 0.7 });
    const units = [];
    for (let i = 0; i < 22; i++) units.push(i);
    const arc = useMemo(() => new THREE.TorusGeometry(0.4, 0.08, 6, 14, Math.PI), []);
    return (
      <group position={[2.0, 0.55, 2.5]} rotation={[0, 0.5, 0]}>
        {units.map((i) => (
          <group key={i} position={[-4.6 + i * 0.42 + (i > 10 ? 1.1 : 0), 0, 0]}>
            <Box s={[0.42, 0.34, 0.16]} p={[0, 0.17, 0]} m={i % 2 ? org : org2} />
            <Ball rad={0.2} p={[0, 0.34, 0]} sc={[1.1, 1, 0.45]} m={i % 2 ? org : org2} />
          </group>
        ))}
        <Box s={[0.18, 1.1, 0.26]} p={[-0.45, 0.55, 0]} m={white} />
        <Box s={[0.18, 1.1, 0.26]} p={[0.45, 0.55, 0]} m={white} />
        <mesh geometry={arc} position={[0, 1.1, 0]} material={white} />
        <Box s={[0.9, 0.18, 0.26]} p={[0, 1.58, 0]} m={white} />
        <pointLight position={[0, 0.8, 0.8]} intensity={2.2} distance={5} color="#ffc27a" />
        <Box s={[0.7, 1.0, 0.04]} p={[0, 0.5, 0]} m={M.plain('#3a3a3a', { roughness: 0.6 })} />
        <Box s={[2.4, 0.9, 1.7]} p={[-1.6, 0.45, -1.9]} m={M.plain('#e9d9c0', { roughness: 0.9 })} />
      </group>
    );
  }

  return { tilaurakot: { Main: TilaurakotMain, Env: TilaurakotEnv } };
}
