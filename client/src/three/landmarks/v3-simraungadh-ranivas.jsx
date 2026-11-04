/* Simraungadh Ranivas, Bara, Madhesh: the ruined medieval brick fort-city and palace quarter of the Karnata dynasty (from 1097).
   Main = a weathered brick palace enclosure (broken walls with stepped crumbled tops, courtyard with room plinths, surviving arched
   doorways, a collapsed gateway arch on +z, rubble heaps, dry grass). Env = low earthen rampart and moat ring, sal and peepal trees,
   flat Terai fields, an excavation trench with a small tin shed. Muted dusty-ochre palette. 1 unit = 1 m. Front = +z. */
export default function make(K) {
  const { useM, Box, Cyl, Ball, Frame, THREE, useMemo } = K;

  const rn = (i) => { const v = Math.sin(i * 12.9898 + 7.3) * 43758.5453; return v - Math.floor(v); };
  const TINTS = ['#ffd8b8', '#e8a888', '#cfc0ac', '#f0d49a', '#f2b890', '#b9a08c'];
  const MOSS = '#7d8a4c';

  function useBrick() {
    const M = useM();
    return useMemo(() => ({
      t: TINTS.map((c, i) => M.mat('brick', 1.2 + (i % 3) * 0.4, 1, { color: c, emissive: '#a07e6a', emissiveIntensity: 0.3 })),
      moss: M.plain(MOSS, { roughness: 1 }),
      dust: M.plain('#c9b48a', { roughness: 1 }),
      dark: M.plain('#5d4a3e', { roughness: 1 }),
    }), [M]);
  }

  /* one wall run along x (rotate with r), broken to differing heights with crumbled stepped tops */
  function WallRun({ p, r = 0, len, h0, seed, B, thick = 1.1, gap = 0 }) {
    const n = Math.max(2, Math.round(len / 1.3));
    const sw = len / n;
    const segs = [];
    for (let i = 0; i < n; i += 1) {
      const q = rn(seed * 31 + i);
      if (gap && Math.abs(i - n / 2 + 0.5) < gap) continue;
      const h = Math.max(0.5, h0 * (0.35 + 0.75 * q) * (rn(seed + i * 7) > 0.8 ? 0.45 : 1));
      const x = -len / 2 + sw * (i + 0.5);
      const ti = Math.floor(rn(seed * 5 + i) * 6);
      segs.push(
        <group key={i} position={[x, 0, 0]}>
          <Box s={[sw * 0.98, h, thick]} p={[0, h / 2, 0]} m={B.t[ti]} />
          <Box s={[sw * 0.6, h * 0.22, thick * 0.8]} p={[-sw * 0.12, h + h * 0.11, 0]} m={B.t[(ti + 2) % 6]} />
          {q > 0.45 && <Box s={[sw * 0.3, h * 0.2, thick * 0.6]} p={[sw * 0.1, h + h * 0.32, 0.05]} m={B.t[(ti + 1) % 6]} />}
          {q < 0.3 && <Box s={[sw * 0.8, 0.12, thick * 0.9]} p={[0, h + 0.05, 0]} m={B.moss} cast={false} />}
          <Box s={[sw * 1.0, 0.5, thick * 1.25]} p={[0, 0.25, 0]} m={B.t[5]} />
        </group>
      );
    }
    return <group position={p} rotation={[0, r, 0]}>{segs}</group>;
  }

  /* arch of voussoir bricks; frac < 1 = collapsed */
  function Arch({ p, r = 0, span, thick = 1.1, frac = 1, flip = false, m, n = 9 }) {
    const R = span / 2;
    const items = [];
    for (let i = 0; i < n; i += 1) {
      const a0 = Math.PI * (i + 0.5) / n;
      if (i / n > frac) break;
      const a = flip ? Math.PI - a0 : a0;
      items.push(
        <Box key={i} s={[0.55, 0.7, thick]} p={[Math.cos(a) * R, Math.sin(a) * R, 0]} r={[0, 0, a - Math.PI / 2]} m={m} />
      );
    }
    return <group position={p} rotation={[0, r, 0]}>{items}</group>;
  }

  /* wall block with an arched opening, optionally broken */
  function ArchDoor({ p, r = 0, w = 4.2, h = 4.6, span = 2, B, ti = 0, frac = 1, flip = false, thick = 1.1 }) {
    const side = (w - span) / 2;
    const sp = h - span / 2;
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[side, sp, thick]} p={[-(span / 2 + side / 2), sp / 2, 0]} m={B.t[ti]} />
        <Box s={[side, sp * (flip ? 0.7 : 1), thick]} p={[span / 2 + side / 2, sp * (flip ? 0.35 : 0.5), 0]} m={B.t[(ti + 1) % 6]} />
        <Arch p={[0, sp, 0]} span={span} thick={thick} frac={frac} flip={flip} m={B.t[(ti + 3) % 6]} />
        {frac > 0.8 && <Box s={[w, h - sp - span / 2 + 0.2, thick]} p={[0, sp + span / 2 + 0.55, 0]} m={B.t[(ti + 2) % 6]} />}
        <Box s={[w + 0.4, 0.4, thick * 1.2]} p={[0, 0.2, 0]} m={B.t[5]} />
      </group>
    );
  }

  function RubbleHeap({ p, s = 1, seed, B }) {
    const bits = [];
    for (let i = 0; i < 9; i += 1) {
      const a = rn(seed + i) * 6.28, d = rn(seed + i * 3) * s * 0.9;
      const k = (1 - d / (s * 1.1)) * s * 0.7;
      bits.push(<Box key={i} s={[0.45, 0.3, 0.3]} p={[Math.cos(a) * d, Math.max(0.12, k * 0.6), Math.sin(a) * d]} r={[rn(i + seed) * 2, rn(i * 2 + seed) * 3, rn(i * 5 + seed) * 2]} m={B.t[Math.floor(rn(seed * 2 + i) * 6)]} />);
    }
    return (
      <group position={p}>
        <Ball rad={s} p={[0, 0, 0]} sc={[1.2, 0.42, 1]} m={B.dust} />
        {bits}
      </group>
    );
  }

  function Tuft({ p, s = 1 }) {
    const M = useM();
    const g = M.plain('#a99a55', { roughness: 1 });
    return (
      <group position={p} scale={s}>
        <Cyl rt={0} rb={0.07} h={0.55} p={[0, 0.27, 0]} r={[0.2, 0, 0.15]} m={g} seg={4} />
        <Cyl rt={0} rb={0.07} h={0.45} p={[0.07, 0.22, 0.05]} r={[-0.15, 0, -0.25]} m={g} seg={4} />
        <Cyl rt={0} rb={0.07} h={0.5} p={[-0.06, 0.25, -0.04]} r={[0.1, 0, 0.3]} m={g} seg={4} />
      </group>
    );
  }

  /* ---------------------------------------------------------------------------------------- */
  function SimMain() {
    const M = useM();
    const B = useBrick();
    const W = 12, D = 9; /* enclosure half sizes */
    const rooms = [
      [-7.5, -5.5, 5.5, 4, 0.7], [-1.5, -6, 5, 3.4, 0.45], [4.5, -5.5, 5.5, 4.5, 0.8],
      [-7, 0.8, 4.2, 3.6, 0.35], [5, 1.2, 5, 3.8, 0.55],
    ];
    const loose = useMemo(() => Array.from({ length: 70 }, (_, i) => ({
      x: (rn(i * 3) - 0.5) * 2 * (W - 1), z: (rn(i * 5 + 1) - 0.5) * 2 * (D - 1), a: rn(i * 7) * 3, t: Math.floor(rn(i) * 6), s: 0.25 + rn(i * 2) * 0.35,
    })), []);
    const tufts = useMemo(() => Array.from({ length: 46 }, (_, i) => ({
      x: (rn(i * 11 + 2) - 0.5) * 2 * (W + 1.5), z: (rn(i * 13 + 4) - 0.5) * 2 * (D + 2.5), s: 0.8 + rn(i) * 1.1,
    })), []);

    return (
      <group>
        <Frame s={[27, 8, 21]} p={[0, 3.5, 0]} />
        {/* paving: ochre earth + brick-rubble patch */}
        <Box s={[2 * W + 2, 0.08, 2 * D + 2]} p={[0, 0.04, 0]} m={B.dust} cast={false} />
        <Box s={[15, 0.1, 9]} p={[-1, 0.09, 4]} m={M.mat('brick', 6, 4, { color: '#c9a58a' })} cast={false} />
        <Box s={[6, 0.1, 5]} p={[7, 0.1, 6]} m={M.mat('brick', 3, 2, { color: '#a8907c' })} cast={false} />

        {/* perimeter walls, broken */}
        <WallRun p={[0, 0, -D]} len={2 * W} h0={5.6} seed={1} B={B} thick={1.3} />
        <WallRun p={[-W, 0, 0]} r={Math.PI / 2} len={2 * D} h0={4.6} seed={2} B={B} thick={1.2} />
        <WallRun p={[W, 0, 0]} r={Math.PI / 2} len={2 * D} h0={4.0} seed={3} B={B} thick={1.2} gap={1.5} />
        {/* front wall in two halves, leaving the gateway */}
        <WallRun p={[-7.4, 0, D]} len={9.2} h0={3.6} seed={4} B={B} />
        <WallRun p={[7.4, 0, D]} len={9.2} h0={3.2} seed={5} B={B} />

        {/* gateway ruin, +z: two piers, one springer and half a collapsed arch */}
        <Box s={[2.2, 7.2, 1.8]} p={[-3, 3.6, D]} m={B.t[1]} />
        <Box s={[1.6, 2.2, 1.6]} p={[-3.1, 8.2, D]} m={B.t[0]} />
        <Box s={[2.2, 4.1, 1.8]} p={[3, 2.05, D]} m={B.t[0]} />
        <Box s={[1.4, 0.8, 1.6]} p={[3.2, 4.5, D]} m={B.t[2]} />
        <Arch p={[0, 5.4, D]} span={6} thick={1.6} frac={0.55} m={B.t[3]} n={11} />
        <Box s={[0.5, 0.6, 1.4]} p={[1.4, 3.4, D + 1.2]} r={[0.3, 0.5, 0.9]} m={B.t[4]} />
        <Box s={[0.7, 0.5, 1.2]} p={[0.2, 0.25, D + 1.8]} r={[0, 0.7, 0.1]} m={B.t[2]} />
        <RubbleHeap p={[1.6, 0, D + 0.4]} s={1.5} seed={41} B={B} />
        <Box s={[7.4, 0.3, 4]} p={[0, 0.15, D + 2.4]} m={M.mat('brick', 4, 2, { color: '#b9987e' })} cast={false} />

        {/* surviving arched doorways and vault stubs */}
        <ArchDoor p={[-4, 0, -D + 1.3]} w={4.6} h={5} span={2.2} B={B} ti={0} />
        <ArchDoor p={[5.5, 0, -D + 1.3]} w={4.4} h={4.4} span={2} B={B} ti={2} frac={0.6} />
        <ArchDoor p={[-W + 1.2, 0, 3]} r={Math.PI / 2} w={4.2} h={4.2} span={2} B={B} ti={1} frac={0.75} flip />
        <ArchDoor p={[0.6, 0, -1.5]} w={4} h={3.6} span={1.8} B={B} ti={4} />
        <ArchDoor p={[-1, 0, 6.2]} r={0.2} w={3.6} h={3} span={1.6} B={B} ti={3} frac={0.4} thick={0.9} />
        {/* vault stubs: half-barrel pieces */}
        <group position={[8.5, 0, -2.5]}>
          <Box s={[1.1, 3.0, 4]} p={[-1.5, 1.5, 0]} m={B.t[5]} />
          <Box s={[1.1, 3.0, 4]} p={[1.5, 1.5, 0]} m={B.t[0]} />
          <Arch p={[0, 3, 0]} span={3.4} thick={4} frac={0.4} m={B.t[1]} n={8} />
        </group>

        {/* courtyard room plinths and foundation outlines */}
        {rooms.map(([x, z, w, d, h], i) => (
          <group key={i} position={[x, 0, z]}>
            <Box s={[w, h, 0.55]} p={[0, h / 2, -d / 2]} m={B.t[i % 6]} />
            <Box s={[w * 0.6, h * 0.8, 0.55]} p={[w * 0.2, h * 0.4, d / 2]} m={B.t[(i + 2) % 6]} />
            <Box s={[0.55, h * 0.9, d]} p={[-w / 2, h * 0.45, 0]} m={B.t[(i + 4) % 6]} />
            <Box s={[0.55, h * 0.5, d * 0.7]} p={[w / 2, h * 0.25, -d * 0.1]} m={B.t[(i + 1) % 6]} />
            <Box s={[w - 0.8, 0.12, d - 0.8]} p={[0, 0.07, 0]} m={M.mat('brick', 2, 2, { color: '#b99a82' })} cast={false} />
          </group>
        ))}
        {/* raised central dais */}
        <Box s={[4, 0.5, 4]} p={[-1, 0.25, 3.5]} m={B.t[3]} />
        <Box s={[2.6, 0.3, 2.6]} p={[-1, 0.65, 3.5]} m={B.t[5]} />

        {/* rubble and loose bricks */}
        <RubbleHeap p={[-9, 0, 5]} s={1.8} seed={7} B={B} />
        <RubbleHeap p={[2, 0, -3]} s={1.4} seed={13} B={B} />
        <RubbleHeap p={[10, 0, 5.5]} s={1.7} seed={19} B={B} />
        <RubbleHeap p={[-3, 0, -8]} s={1.5} seed={23} B={B} />
        <RubbleHeap p={[0, 0, 8.4]} s={1.1} seed={29} B={B} />
        {loose.map((b, i) => (
          <Box key={i} s={[b.s * 1.4, b.s * 0.55, b.s * 0.7]} p={[b.x, b.s * 0.25, b.z]} r={[0, b.a, 0]} m={B.t[b.t]} cast={false} />
        ))}
        {tufts.map((t, i) => <Tuft key={i} p={[t.x, 0, t.z]} s={t.s} />)}
      </group>
    );
  }

  /* ---------------------------------------------------------------------------------------- */
  function SimEnv() {
    const M = useM();
    const B = useBrick();
    const earth = M.plain('#b9a578', { roughness: 1 });
    const bank = M.plain('#a69470', { roughness: 1 });
    const water = M.plain('#6f7a58', { roughness: 0.35, metalness: 0.1 });
    const fields = useMemo(() => {
      const cols = ['#a8a456', '#c2b36a', '#8f9a4c', '#cdbb7c', '#b0a05a'];
      const out = [];
      for (let i = 0; i < 26; i += 1) {
        const a = rn(i * 3) * 6.28, d = 36 + rn(i * 5) * 28;
        out.push({ x: Math.cos(a) * d, z: Math.sin(a) * d, w: 10 + rn(i) * 14, h: 8 + rn(i * 2) * 12, c: cols[i % 5], r: rn(i * 7) * 3 });
      }
      return out;
    }, []);
    const trees = useMemo(() => Array.from({ length: 16 }, (_, i) => {
      const a = 6.28 * (0.3 + 0.9 * rn(i * 9)) + 0.9 * 0, d = 36 + rn(i * 4) * 30;
      return { x: Math.cos(a) * d, z: Math.sin(a) * d, s: 1.6 + rn(i) * 1.0, kind: i % 3 === 0 ? 'pine' : 'broad' };
    }), []);
    const RX = 31, RZ = 27; /* rampart centre half sizes */
    return (
      <group>
        <Cyl rt={90} rb={90} h={0.2} p={[0, -0.12, 0]} m={earth} seg={48} cast={false} />
        {/* flat farmland patches */}
        {fields.map((f, i) => (
          <Box key={i} s={[f.w, 0.05, f.h]} p={[f.x, 0.04, f.z]} r={[0, f.r, 0]} m={M.plain(f.c, { roughness: 1 })} cast={false} />
        ))}
        {/* moat: water strip with mud banks, rectangular ring around the site */}
        {[-1, 1].map((s2, i) => (
          <group key={i} position={[0, 0, s2 * 22]}>
            <Box s={[52, 0.06, 4]} p={[0, 0.05, 0]} m={water} cast={false} />
            <Box s={[56, 0.4, 1.6]} p={[0, 0.2, -2.8]} m={bank} cast={false} />
            <Box s={[56, 0.4, 1.6]} p={[0, 0.2, 2.8]} m={bank} cast={false} />
          </group>
        ))}
        {[-1, 1].map((s2, i) => (
          <group key={i} position={[s2 * 26, 0, 0]}>
            <Box s={[4, 0.06, 44]} p={[0, 0.05, 0]} m={water} cast={false} />
            <Box s={[1.6, 0.4, 44]} p={[-2.8, 0.2, 0]} m={bank} cast={false} />
            <Box s={[1.6, 0.4, 44]} p={[2.8, 0.2, 0]} m={bank} cast={false} />
          </group>
        ))}
        {/* low earthen rampart mound, outer ring */}
        {[[0, -RZ, 2 * RX + 4, 5, 0], [0, RZ, 2 * RX + 4, 5, 0], [-RX, 0, 2 * RZ, 5, Math.PI / 2], [RX, 0, 2 * RZ, 5, Math.PI / 2]].map(([x, z, l, d, r], i) => (
          <group key={i} position={[x, 0, z]} rotation={[0, r, 0]}>
            <Ball rad={1} p={[0, 0, 0]} sc={[l / 2, 1.6, d]} m={M.plain('#9c9c66', { roughness: 1 })} />
          </group>
        ))}
        {/* rampart tufts */}
        {Array.from({ length: 24 }, (_, i) => {
          const a = rn(i * 5) * 6.28;
          return <Tuft key={i} p={[Math.cos(a) * 28, 1, Math.sin(a) * 25]} s={1.4} />;
        })}

        {/* sal and peepal trees growing from the ruins and around */}
        <K.Tree p={[-13.5, 0, -10]} s={2.6} kind="broad" />
        <K.Tree p={[13.5, 0, -9]} s={2.3} kind="broad" />
        <K.Tree p={[-13, 0, 8]} s={3} kind="pine" />
        <K.Tree p={[15.5, 0, -12]} s={2.2} kind="broad" />
        <K.Tree p={[-4.5, 0, -11]} s={2.6} kind="pine" />
        {trees.map((t, i) => <K.Tree key={i} p={[t.x, 0, t.z]} s={t.s} kind={t.kind} />)}

        {/* excavation-trench corner with a protective tin shed (front-right outside the walls) */}
        <group position={[17, 0, 12]}>
          <Box s={[8, 0.08, 6]} p={[0, 0.05, 0]} m={B.dark} cast={false} />
          <Box s={[7, 0.06, 4.6]} p={[0, 0.12, 0]} m={M.plain('#6c5a49', { roughness: 1 })} cast={false} />
          <Box s={[7.4, 0.5, 0.6]} p={[0, 0.25, -2.8]} m={bank} />
          <Box s={[7.4, 0.5, 0.6]} p={[0, 0.25, 2.8]} m={bank} />
          <Box s={[0.6, 0.5, 5.6]} p={[-3.9, 0.25, 0]} m={bank} />
          <Box s={[0.6, 0.5, 5.6]} p={[3.9, 0.25, 0]} m={bank} />
          {/* brick foundation traces in the trench */}
          <Box s={[3, 0.18, 0.4]} p={[-1, 0.2, -0.8]} m={B.t[1]} cast={false} />
          <Box s={[0.4, 0.18, 2]} p={[0.5, 0.2, 0.2]} m={B.t[0]} cast={false} />
          {/* shed */}
          <group position={[-9.5, 0, 1.5]}>
            {[[-1.4, -1], [1.4, -1], [-1.4, 1], [1.4, 1]].map(([x, z], i) => (
              <Cyl key={i} rt={0.07} rb={0.07} h={2.2} p={[x, 1.1, z]} m={B.dark} seg={5} />
            ))}
            <Box s={[3.4, 0.08, 2.8]} p={[0, 2.3, 0]} r={[0, 0, -0.12]} m={M.plain('#8d9296', { roughness: 0.55, metalness: 0.55 })} />
            <Box s={[0.08, 1.9, 2.4]} p={[1.5, 1.1, 0]} m={M.plain('#7c8084', { roughness: 0.6, metalness: 0.5 })} />
          </group>
        </group>
        {/* horizon tree line */}
        {Array.from({ length: 30 }, (_, i) => {
          const a = (i / 30) * 6.28;
          return <K.Tree key={i} p={[Math.cos(a) * 80, 0, Math.sin(a) * 80]} s={3 + rn(i) * 1.5} kind="broad" />;
        })}
      </group>
    );
  }

  return { 'simraungadh-ranivas': { Main: SimMain, Env: SimEnv } };
}
