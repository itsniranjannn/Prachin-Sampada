// Hand-built landmarks: Lumbini, Kapilavastu (Tilaurakot, Kudan, Gotihawa, Ramagrama), Palpa and the western hills.
import { useMemo } from 'react';

export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Gajur, Tree, PrayerFlags, Frame, Water, GroundDisc, ringOf, whiteMat, Chaitya, Trident, Lingam, Lion, Elephant, Spire, House, NewarHouse, LatticeWindow, THREE } = K;

  /* ---------- shared helpers ---------- */
  const rnd = (i) => { const r = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return r - Math.floor(r); };
  const brickM = (M, rx = 2, ry = 1, c = '#e6ad92') => M.mat('brick', rx, ry, { color: c });
  const grassM = (M, c = '#8db35a') => M.plain(c, { roughness: 1 });

  function segs(len, gaps = []) {
    const g = [...gaps].sort((a, b) => a[0] - b[0]);
    const out = [];
    let cur = -len / 2;
    g.forEach(([c, w]) => { const a = c - w / 2; if (a > cur + 0.01) out.push([cur, a]); cur = c + w / 2; });
    if (cur < len / 2 - 0.01) out.push([cur, len / 2]);
    return out;
  }
  /** Excavated brick wall outline: four wall runs with gateway gaps, ragged tops and a stepped footing. */
  function BRect({ p = [0, 0, 0], r = 0, w, d, h = 0.5, t = 0.4, gaps = {}, seed = 1, c, sides = 'nsew' }) {
    const M = useM();
    const out = [];
    [['n', -d / 2, 0, w], ['s', d / 2, 0, w], ['e', w / 2, 1, d], ['w', -w / 2, 1, d]].forEach(([k, off, vert, len], si) => {
      if (!sides.includes(k)) return;
      segs(len, gaps[k]).forEach(([a, b], i) => {
        const hh = h * (0.62 + 0.38 * rnd(seed + si * 7 + i * 3));
        const l = b - a;
        const mid = (a + b) / 2;
        const m = brickM(M, Math.max(1, l / 1.3), Math.max(0.5, hh / 0.5), c);
        out.push(vert
          ? <Box key={`${k}${i}`} s={[t, hh, l]} p={[off, hh / 2, mid]} m={m} />
          : <Box key={`${k}${i}`} s={[l, hh, t]} p={[mid, hh / 2, off]} m={m} />);
        out.push(vert
          ? <Box key={`f${k}${i}`} s={[t + 0.22, hh * 0.38, l + 0.12]} p={[off, hh * 0.19, mid]} m={m} cast={false} />
          : <Box key={`f${k}${i}`} s={[l + 0.12, hh * 0.38, t + 0.22]} p={[mid, hh * 0.19, off]} m={m} cast={false} />);
      });
    });
    return <group position={p} rotation={[0, r, 0]}>{out}</group>;
  }
  /** Brick steps rising toward -z (the lowest step is at z = 0). */
  function Steps({ p = [0, 0, 0], r = 0, w = 1, n = 4, rise = 0.15, run = 0.3, m }) {
    return (
      <group position={p} rotation={[0, r, 0]}>
        {Array.from({ length: n }, (_, k) => <Box key={k} s={[w, (k + 1) * rise, run + 0.02]} p={[0, ((k + 1) * rise) / 2, -k * run]} m={m} />)}
      </group>
    );
  }
  /** Broad shade tree (sal, mango, banyan, bodhi): forked trunk and a few flattened foliage blobs. */
  function Canopy({ p = [0, 0, 0], s = 1, c = '#4d7a35', c2 = '#628f40', trunk = '#5a4636', lo = 1.6, n = 5, r = 0 }) {
    const M = useM();
    const m1 = M.plain(c, { roughness: 1 });
    const m2 = M.plain(c2, { roughness: 1 });
    const blobs = [[0, 3.6, 0, 1.6], [1.5, 3.2, 0.5, 1.2], [-1.5, 3.3, -0.3, 1.25], [0.3, 4.3, -0.9, 1.05], [0.6, 3.1, -1.6, 1.05], [-0.5, 3.0, 1.5, 1.15]].slice(0, n);
    return (
      <group position={p} scale={s} rotation={[0, r, 0]}>
        <Cyl rt={0.22} rb={0.4} h={lo + 1.2} p={[0, (lo + 1.2) / 2, 0]} m={M.plain(trunk)} seg={8} />
        <Cyl rt={0.1} rb={0.18} h={1.9} p={[0.5, lo + 1.5, 0]} r={[0, 0, -0.5]} m={M.plain(trunk)} seg={6} />
        <Cyl rt={0.1} rb={0.18} h={1.9} p={[-0.5, lo + 1.5, 0.1]} r={[0, 0, 0.5]} m={M.plain(trunk)} seg={6} />
        {blobs.map(([x, y, z, rad], i) => (
          <mesh key={i} position={[x, y, z]} scale={[1.2, 0.78, 1.2]} material={i % 2 ? m2 : m1} castShadow>
            <icosahedronGeometry args={[rad, 1]} />
          </mesh>
        ))}
      </group>
    );
  }
  const Pole = ({ p, h = 2.4, flag = '#c0392b', fl = 0.5 }) => {
    const M = useM();
    return (
      <group position={p}>
        <Cyl rt={0.025} h={h} p={[0, h / 2, 0]} m={M.plain('#8a8580', { metalness: 0.7 })} seg={6} />
        <Box s={[fl, fl * 0.62, 0.015]} p={[fl / 2, h - fl * 0.34, 0]} m={M.plain(flag, { roughness: 0.9 })} />
      </group>
    );
  };

  /* ---------- Lumbini: the white shelter, pond, pillar ---------- */
  function WinGroup({ p, r = 0, n = 4, w = 0.34, h = 0.3, simple = false }) {
    const M = useM();
    const wm = whiteMat(M);
    const glass = M.plain('#53606f', { roughness: 0.25, metalness: 0.3 });
    const gw = n * w + 0.12;
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[gw, h + 0.1, 0.05]} m={wm} cast={false} />
        {simple
          ? <Box s={[gw - 0.1, h, 0.06]} p={[0, 0, 0.012]} m={glass} cast={false} />
          : Array.from({ length: n }, (_, k) => <Box key={k} s={[w - 0.06, h, 0.06]} p={[-gw / 2 + 0.06 + (k + 0.5) * w, 0, 0.012]} m={glass} cast={false} />)}
      </group>
    );
  }
  function Parapet({ w, d, y, post = 1.25, ph = 0.8, wall = 0.35 }) {
    const M = useM();
    const wm = whiteMat(M);
    const red = M.plain('#b3402f', { roughness: 0.85 });
    const rail = M.plain('#a9adb2', { metalness: 0.6, roughness: 0.4 });
    const out = [];
    const nx = Math.max(2, Math.round(w / post));
    const nz = Math.max(2, Math.round(d / post));
    const posts = [];
    for (let i = 0; i <= nx; i += 1) { const x = -w / 2 + (i * w) / nx; posts.push([x, d / 2], [x, -d / 2]); }
    for (let j = 1; j < nz; j += 1) { const z = -d / 2 + (j * d) / nz; posts.push([w / 2, z], [-w / 2, z]); }
    posts.forEach(([x, z], i) => {
      out.push(<Box key={`p${i}`} s={[0.26, ph, 0.26]} p={[x, y + ph / 2, z]} m={wm} />);
      out.push(<Box key={`c${i}`} s={[0.32, 0.08, 0.32]} p={[x, y + ph + 0.04, z]} m={red} cast={false} />);
    });
    out.push(<Box key="a" s={[w, wall, 0.14]} p={[0, y + wall / 2, d / 2]} m={wm} />);
    out.push(<Box key="b" s={[w, wall, 0.14]} p={[0, y + wall / 2, -d / 2]} m={wm} />);
    out.push(<Box key="c" s={[0.14, wall, d]} p={[w / 2, y + wall / 2, 0]} m={wm} />);
    out.push(<Box key="d" s={[0.14, wall, d]} p={[-w / 2, y + wall / 2, 0]} m={wm} />);
    [ph * 0.78, ph * 0.52].forEach((hy, k) => {
      out.push(<Box key={`ra${k}`} s={[w, 0.03, 0.03]} p={[0, y + hy, d / 2]} m={rail} cast={false} />);
      out.push(<Box key={`rb${k}`} s={[w, 0.03, 0.03]} p={[0, y + hy, -d / 2]} m={rail} cast={false} />);
      out.push(<Box key={`rc${k}`} s={[0.03, 0.03, d]} p={[w / 2, y + hy, 0]} m={rail} cast={false} />);
      out.push(<Box key={`rd${k}`} s={[0.03, 0.03, d]} p={[-w / 2, y + hy, 0]} m={rail} cast={false} />);
    });
    return <group>{out}</group>;
  }
  /** The Maya Devi shelter: a long, plain white block with a window band and railed parapet, a small raised central block and a gilded finial. */
  function MayaShelter({ W = 11.5, D = 7, H = 2.35 }) {
    const M = useM();
    const wm = whiteMat(M);
    const base = 0.4;
    const top = base + H;
    const dark = M.plain('#2a2420');
    const uy = top + 0.12;
    return (
      <group>
        <Box s={[W + 0.9, base, D + 0.9]} p={[0, base / 2, 0]} m={brickM(M, 10, 0.4, '#e19c82')} />
        <Box s={[W, H, D]} p={[0, base + H / 2, 0]} m={wm} />
        <Box s={[W + 0.18, 0.12, D + 0.18]} p={[0, top + 0.02, 0]} m={wm} />
        <Parapet w={W + 0.1} d={D + 0.1} y={top + 0.08} />
        {/* window bands, front and back long sides */}
        {[-4.3, -2.1, 2.1, 4.3].map((x) => <WinGroup key={`f${x}`} p={[x, base + H * 0.62, D / 2 + 0.03]} />)}
        {[-4.3, -2.1, 0, 2.1, 4.3].map((x) => <WinGroup key={`b${x}`} p={[x, base + H * 0.62, -D / 2 - 0.03]} r={Math.PI} simple />)}
        {[-1.8, 1.8].map((z) => [1, -1].map((k) => <WinGroup key={`s${z}${k}`} p={[k * (W / 2 + 0.03), base + H * 0.62, z]} r={(k * Math.PI) / 2} simple n={3} />))}
        {/* entrance */}
        <Box s={[1.2, 1.75, 0.08]} p={[0, base + 0.875, D / 2 + 0.03]} m={wm} />
        <Box s={[0.9, 1.55, 0.1]} p={[0, base + 0.78, D / 2 + 0.06]} m={dark} />
        <Steps p={[0, 0, D / 2 + 0.45 + 0.7]} w={2.2} n={3} rise={0.13} run={0.3} m={brickM(M, 2, 0.4, '#e9b9a2')} />
        {/* raised central block */}
        <Box s={[4.6, 1.25, 3.7]} p={[0, uy + 0.62, -0.2]} m={wm} />
        <Box s={[4.76, 0.1, 3.86]} p={[0, uy + 1.27, -0.2]} m={wm} />
        <Parapet w={4.7} d={3.8} y={uy + 1.32} post={1.18} ph={0.6} wall={0.28} />
        {[-1.2, 0, 1.2].map((x) => <WinGroup key={`u${x}`} p={[x, uy + 0.7, 1.68]} n={2} />)}
        <Box s={[1.0, 0.5, 1.0]} p={[0, uy + 1.55, -0.2]} m={wm} />
        <Box s={[0.7, 0.12, 0.7]} p={[0, uy + 1.85, -0.2]} m={M.gold} />
        <Gajur y={uy + 1.9} s={1.0} />
        {/* flagpoles with the red flags at both ends of the roof */}
        <Pole p={[-W / 2 + 0.3, top + 0.1, D / 2 - 0.3]} h={2.0} fl={0.55} />
        <Pole p={[W / 2 - 0.3, top + 0.1, D / 2 - 0.3]} h={2.0} fl={0.55} />
      </group>
    );
  }
  /** The Ashoka pillar: a smooth sandstone shaft with no capital, in a gold railing wrapped in yellow cloth. */
  function LumbiniPillar({ h = 4, fence = 1.4 }) {
    const M = useM();
    const sand = M.mat('granite', 1, 3, { color: '#cdb08a', roughness: 0.55 });
    const band = M.plain('#a8895f', { roughness: 0.7 });
    const gold = M.plain('#d9a52a', { metalness: 0.85, roughness: 0.3 });
    const cloth = M.plain('#f0a810', { roughness: 0.95 });
    const f2 = fence / 2;
    const picks = [];
    for (let k = 0; k <= 6; k += 1) {
      const q = -f2 + (k * fence) / 6;
      picks.push([q, f2], [q, -f2]);
      if (k > 0 && k < 6) picks.push([f2, q], [-f2, q]);
    }
    return (
      <group>
        <Box s={[fence + 0.5, 0.22, fence + 0.5]} p={[0, 0.11, 0]} m={brickM(M, 2, 0.3, '#e3b09a')} />
        <Cyl rt={0.17} rb={0.2} h={h} p={[0, 0.2 + h / 2, 0]} m={sand} seg={28} />
        <Cyl rt={0.186} rb={0.192} h={0.7} p={[0, 0.2 + h * 0.3, 0]} m={band} seg={28} />
        <Cyl rt={0.172} rb={0.176} h={0.5} p={[0, 0.2 + h * 0.62, 0]} m={band} seg={28} />
        {picks.map(([x, z], i) => <Cyl key={i} rt={0.018} h={0.95} p={[x, 0.22 + 0.47, z]} m={gold} seg={5} />)}
        {[0.95, 0.5].map((y) => (
          <group key={y}>
            <Box s={[fence, 0.035, 0.035]} p={[0, 0.22 + y, f2]} m={gold} cast={false} />
            <Box s={[fence, 0.035, 0.035]} p={[0, 0.22 + y, -f2]} m={gold} cast={false} />
            <Box s={[0.035, 0.035, fence]} p={[f2, 0.22 + y, 0]} m={gold} cast={false} />
            <Box s={[0.035, 0.035, fence]} p={[-f2, 0.22 + y, 0]} m={gold} cast={false} />
          </group>
        ))}
        <Box s={[fence + 0.04, 0.4, 0.04]} p={[0, 0.45, f2 + 0.02]} m={cloth} cast={false} />
        <Box s={[fence + 0.04, 0.4, 0.04]} p={[0, 0.45, -f2 - 0.02]} m={cloth} cast={false} />
        <Box s={[0.04, 0.4, fence]} p={[f2 + 0.02, 0.45, 0]} m={cloth} cast={false} />
        <Box s={[0.04, 0.4, fence]} p={[-f2 - 0.02, 0.45, 0]} m={cloth} cast={false} />
      </group>
    );
  }
  /** Stepped red-brick pond (Puskarini): a kerb, two inner terraces and dark water. */
  function PuskariniPond({ p = [0, 0, 0], w = 10, d = 5 }) {
    const M = useM();
    const red = brickM(M, 6, 0.4, '#e2998a');
    const pale = M.plain('#d98f7e', { roughness: 0.9 });
    const ring = (ww, dd, hh, t, key) => (
      <group key={key}>
        <Box s={[ww, hh, t]} p={[0, hh / 2, dd / 2 - t / 2]} m={red} />
        <Box s={[ww, hh, t]} p={[0, hh / 2, -dd / 2 + t / 2]} m={red} />
        <Box s={[t, hh, dd]} p={[ww / 2 - t / 2, hh / 2, 0]} m={red} />
        <Box s={[t, hh, dd]} p={[-ww / 2 + t / 2, hh / 2, 0]} m={red} />
      </group>
    );
    return (
      <group position={p}>
        {ring(w, d, 0.36, 0.45, 'k')}
        {ring(w - 0.9, d - 0.9, 0.24, 0.45, 'm')}
        {ring(w - 1.8, d - 1.8, 0.12, 0.45, 'i')}
        <Box s={[w - 2.6, 0.03, d - 2.6]} p={[0, 0.015, 0]} m={pale} cast={false} />
        <Water w={w - 2.7} d={d - 2.7} p={[0, 0.06, 0]} color="#2f5560" />
      </group>
    );
  }
  /** Small brick votive stupa of the Sacred Garden. */
  function VotiveStupa({ p, s = 1 }) {
    const M = useM();
    const b = brickM(M, 1, 1, '#d99a7e');
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.5} rb={0.58} h={0.3} p={[0, 0.15, 0]} m={b} seg={14} />
        <mesh position={[0, 0.3, 0]} material={b} castShadow><sphereGeometry args={[0.42, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
        <mesh position={[0, 0.82, 0]} material={b} castShadow><coneGeometry args={[0.16, 0.5, 10]} /></mesh>
      </group>
    );
  }
  /** Excavated monastery cells: a grid of low brick rooms. */
  function Vihara({ p = [0, 0, 0], r = 0, nx = 3, nz = 3, cell = 2.2, h = 0.5, seed = 3 }) {
    const out = [];
    for (let i = 0; i < nx; i += 1) for (let j = 0; j < nz; j += 1) {
      out.push(<BRect key={`${i}${j}`} p={[(i - (nx - 1) / 2) * cell, 0, (j - (nz - 1) / 2) * cell]} w={cell} d={cell} h={h} t={0.32} seed={seed + i * 5 + j} gaps={{ s: j === nz - 1 ? [[0, 0.7]] : [], n: [[0, 0.7]] }} />);
    }
    return <group position={p} rotation={[0, r, 0]}>{out}</group>;
  }

  function MayaMain() {
    const M = useM();
    return (
      <group>
        <MayaShelter />
        <group position={[-3.4, 0, 5.4]}><LumbiniPillar h={4.0} fence={1.3} /></group>
        <PuskariniPond p={[0, 0, 10.4]} w={10.4} d={4.8} />
        {/* excavated brick foundations of the earlier shrines, beside and in front of the temple */}
        <BRect p={[-8.6, 0, 1.2]} w={4.6} d={4} h={0.8} t={0.55} seed={4} gaps={{ s: [[0.6, 1.2]] }} />
        <BRect p={[-8.6, 0, 1.2]} w={2.8} d={2} h={0.55} t={0.4} seed={9} />
        <BRect p={[-7.4, 0, 6.8]} w={2.8} d={2.4} h={0.5} t={0.45} seed={12} gaps={{ n: [[0, 0.8]] }} />
        <BRect p={[8, 0, 2.6]} w={4.2} d={3.6} h={0.7} t={0.5} seed={17} gaps={{ w: [[0, 1]] }} />
        <BRect p={[8, 0, -3]} w={3.2} d={3.2} h={0.55} t={0.4} seed={21} />
        {[[5.6, 7.2, 1], [7.1, 8.2, 0.8], [8.6, 6.8, 0.9], [5.4, 9, 0.7]].map(([x, z, s], k) => <VotiveStupa key={k} p={[x, 0, z]} s={s} />)}
        {/* the bodhi tree hung with prayer flags */}
        <Canopy p={[-9.4, 0, -2.6]} s={1.4} c="#5a8a3a" c2="#74a048" n={6} />
        <PrayerFlags from={[-9, 4.4, -2.6]} to={[-7.6, 0.6, 3.6]} n={18} />
        <PrayerFlags from={[-9, 4.2, -2.6]} to={[-3.4, 3.2, 5.4]} n={22} />
        <PrayerFlags from={[-9, 4.0, -2.6]} to={[-11.2, 0.6, 3.4]} n={14} />
        <Frame s={[15, 5.5, 13]} p={[0, 2.8, 4.5]} />
      </group>
    );
  }
  function MayaEnv() {
    const M = useM();
    const hedge = M.plain('#3f6b30', { roughness: 1 });
    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 3]} receiveShadow material={M.mat('herring', 9, 5, { color: '#ffdccb' })}><planeGeometry args={[34, 21]} /></mesh>
        <GroundDisc r={90} y={-0.04} m={grassM(M, '#86ad54')} />
        <GroundDisc r={30} y={-0.02} m={grassM(M, '#93b95e')} />
        {/* clipped hedges and the garden beyond the pond */}
        {[[-8.5, 16.2, 6], [8.5, 16.2, 6]].map(([x, z, w], i) => <Box key={i} s={[w, 0.6, 0.7]} p={[x, 0.3, z]} m={hedge} />)}
        <Box s={[0.7, 0.6, 12]} p={[-17.5, 0.3, 4]} m={hedge} />
        <Box s={[0.7, 0.6, 12]} p={[17.5, 0.3, 4]} m={hedge} />
        {/* monastic ruins of the Sacred Garden behind the temple */}
        <Vihara p={[-15, 0, -9]} nx={4} nz={3} cell={2.4} seed={2} />
        <Vihara p={[6, 0, -11]} nx={5} nz={3} cell={2.3} seed={7} />
        <Vihara p={[21, 0, -3]} nx={2} nz={4} cell={2.2} seed={11} />
        <BRect p={[-20, 0, 6]} w={5} d={5} h={0.6} t={0.5} seed={30} gaps={{ e: [[0, 1]] }} />
        {[[-22, -3], [24, 6], [-19, -17], [16, -18]].map(([x, z], k) => <VotiveStupa key={k} p={[x, 0, z]} s={1.2} />)}
        {/* sal and neem trees of the sacred garden, kept off the temple side */}
        {ringOf(30, 29, (p, r, i) => <Canopy key={i} p={[p[0] * (1 + (i % 3) * 0.06), 0, p[2] * (1 + (i % 3) * 0.06)]} s={1.1 + (i % 4) * 0.18} r={i} n={4} c={i % 2 ? '#4a7a36' : '#58853b'} />, (a) => a > 0.15 && a < Math.PI - 0.15)}
        {[[-14, -2], [14, -4], [-24, 10], [-30, 2]].map(([x, z], i) => <Canopy key={`t${i}`} p={[x, 0, z]} s={1.2} n={4} r={i} />)}
      </group>
    );
  }

  /* Ashoka pillar, Lumbini: the shaft and its railing with the white shelter right behind */
  function AshokaMain() {
    const M = useM();
    return (
      <group>
        <group position={[0, 0, 0.6]}><LumbiniPillar h={5.2} fence={1.5} /></group>
        <group position={[0, 0, -5.6]}><MayaShelter /></group>
        <Frame s={[9, 6.6, 7]} p={[0, 3.3, 0]} />
      </group>
    );
  }
  function AshokaEnv() {
    const M = useM();
    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 4]} receiveShadow material={M.mat('herring', 8, 5, { color: '#ffdccb' })}><planeGeometry args={[30, 22]} /></mesh>
        <GroundDisc r={90} y={-0.04} m={grassM(M, '#86ad54')} />
        <GroundDisc r={26} y={-0.02} m={grassM(M, '#93b95e')} />
        <BRect p={[-7.5, 0, -2]} w={4.4} d={3.6} h={0.7} t={0.5} seed={4} />
        <BRect p={[8.2, 0, -1]} w={4.2} d={3.4} h={0.6} t={0.45} seed={8} gaps={{ s: [[0, 1]] }} />
        {[[-5, 4.5, 1], [5.6, 5, 1.1], [7, 3, 0.8]].map(([x, z, s], k) => <VotiveStupa key={k} p={[x, 0, z]} s={s} />)}
        <Box s={[0.7, 0.6, 10]} p={[-12, 0.3, 6]} m={M.plain('#3f6b30', { roughness: 1 })} />
        <Box s={[0.7, 0.6, 10]} p={[12, 0.3, 6]} m={M.plain('#3f6b30', { roughness: 1 })} />
        {ringOf(26, 24, (p, r, i) => <Canopy key={i} p={[p[0], 0, p[2]]} s={1.1 + (i % 4) * 0.18} r={i} n={4} c={i % 2 ? '#4a7a36' : '#58853b'} />, (a) => a > 0.15 && a < Math.PI - 0.15)}
        <Vihara p={[-14, 0, 12]} nx={3} nz={2} cell={2.4} seed={5} />
      </group>
    );
  }

  /* ---------- shared bits for the Kapilavastu sites ---------- */
  function Cow({ p, r = 0, c = '#e9e1d0' }) {
    const M = useM();
    const m = M.plain(c, { roughness: 1 });
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[0.34, 0.3, 0.8]} p={[0, 0.5, 0]} m={m} />
        <Box s={[0.2, 0.22, 0.26]} p={[0, 0.62, 0.5]} m={m} />
        <Box s={[0.12, 0.08, 0.1]} p={[0, 0.54, 0.66]} m={M.plain('#a98d7c')} />
        <Ball rad={0.1} sc={[1, 0.8, 1]} p={[0, 0.64, 0.26]} m={m} />
        {[[-0.1, 0.3], [0.1, 0.3], [-0.1, -0.3], [0.1, -0.3]].map(([x, z], i) => <Cyl key={i} rt={0.04} h={0.4} p={[x, 0.2, z]} m={m} seg={5} />)}
      </group>
    );
  }
  function Palm({ p, s = 1, r = 0 }) {
    const M = useM();
    const trunk = M.plain('#7a6048');
    const leaf = M.plain('#3f7a3a', { roughness: 0.9 });
    return (
      <group position={p} scale={s} rotation={[0, r, 0]}>
        <Cyl rt={0.1} rb={0.16} h={4.4} p={[0, 2.2, 0]} m={trunk} seg={7} />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return <Box key={i} s={[0.16, 0.03, 1.9]} p={[Math.cos(a) * 0.75, 4.35, Math.sin(a) * 0.75]} r={[0.5, -a + Math.PI / 2, 0]} m={leaf} cast={false} />;
        })}
        <Ball rad={0.18} p={[0, 4.4, 0]} m={leaf} />
      </group>
    );
  }
  const Plain = ({ r = 30, y = -0.03, c = '#8db35a' }) => {
    const M = useM();
    return <GroundDisc r={r} y={y} m={M.plain(c, { roughness: 1 })} />;
  };
  const Patch = ({ p, w, d, c }) => {
    const M = useM();
    return <mesh rotation={[-Math.PI / 2, 0, 0]} position={[p[0], p[1] ?? 0.006, p[2]]} receiveShadow material={M.plain(c, { roughness: 1 })}><planeGeometry args={[w, d]} /></mesh>;
  };
  /** Golden iron railing around a square, with a top and a middle rail. */
  function GoldFence({ p = [0, 0, 0], w = 2, d = 2, h = 0.9, n = 7 }) {
    const M = useM();
    const gold = M.plain('#d9a52a', { metalness: 0.85, roughness: 0.3 });
    const out = [];
    for (let k = 0; k <= n; k += 1) {
      const x = -w / 2 + (k * w) / n;
      const z = -d / 2 + (k * d) / n;
      out.push([x, d / 2], [x, -d / 2]);
      if (k > 0 && k < n) out.push([w / 2, z], [-w / 2, z]);
    }
    return (
      <group position={p}>
        {out.map(([x, z], i) => <Cyl key={i} rt={0.018} h={h} p={[x, h / 2, z]} m={gold} seg={5} />)}
        {[h, h * 0.55].map((y) => (
          <group key={y}>
            <Box s={[w, 0.035, 0.035]} p={[0, y, d / 2]} m={gold} cast={false} />
            <Box s={[w, 0.035, 0.035]} p={[0, y, -d / 2]} m={gold} cast={false} />
            <Box s={[0.035, 0.035, d]} p={[w / 2, y, 0]} m={gold} cast={false} />
            <Box s={[0.035, 0.035, d]} p={[-w / 2, y, 0]} m={gold} cast={false} />
          </group>
        ))}
      </group>
    );
  }
  /** Ruined round brick stupa base: two ragged drums with radial cells. */
  function StupaBase({ p = [0, 0, 0], r = 2.8, seed = 3 }) {
    const M = useM();
    const b = brickM(M, 6, 1, '#e0a285');
    const b2 = brickM(M, 5, 1, '#d99478');
    return (
      <group position={p}>
        <Cyl rt={r * 0.97} rb={r} h={0.55} p={[0, 0.275, 0]} m={b} seg={36} />
        <Cyl rt={r * 0.8} rb={r * 0.84} h={0.5} p={[0, 0.8, 0]} m={b2} seg={36} />
        <Cyl rt={r * 0.62} rb={r * 0.66} h={0.4} p={[0, 1.25, 0]} m={b} seg={28} />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          const hh = 0.22 + 0.3 * rnd(seed + i);
          return <Box key={i} s={[0.28, hh, 0.28]} p={[Math.cos(a) * r * 0.47, 1.45 + hh / 2, Math.sin(a) * r * 0.47]} r={[0, -a, 0]} m={b2} />;
        })}
      </group>
    );
  }

  /* Tilaurakot: the excavated walled city of Kapilavastu, its moat, gate, citadel and sal trees */
  function TilGate({ p = [0, 0, 0], r = 0 }) {
    const M = useM();
    const b = brickM(M, 2, 1, '#e0a285');
    return (
      <group position={p} rotation={[0, r, 0]}>
        {[-1.55, 1.55].map((x) => (
          <group key={x} position={[x, 0, 0]}>
            <Box s={[1.5, 1.15, 1.5]} p={[0, 0.575, 0]} m={b} />
            <Box s={[1.2, 0.35, 1.2]} p={[0, 1.32, 0]} m={b} />
            <Box s={[0.5, 0.6, 1.7]} p={[x > 0 ? 0.85 : -0.85, 0.3, 0.3]} m={b} />
          </group>
        ))}
        <Steps p={[0, 0, 1.9]} w={2.0} n={3} rise={0.1} run={0.3} m={b} />
        <Box s={[2.3, 0.05, 1.6]} p={[0, 0.03, 0]} m={M.plain('#c8a080')} cast={false} />
      </group>
    );
  }
  function TilaurakotMain() {
    const M = useM();
    const W = 22;
    const D = 17;
    const mo = 1.5;
    return (
      <group>
        <Patch p={[0, 0.004, 0]} w={W + 3} d={D + 3} c="#b4a27a" />
        <BRect w={W} d={D} h={0.6} t={0.7} seed={5} gaps={{ s: [[0, 2.6]], w: [[1.5, 2.2]] }} />
        {/* corner bastions and the tower on the south wall */}
        {[[-W / 2, -D / 2], [W / 2, -D / 2], [-W / 2, D / 2], [W / 2, D / 2]].map(([x, z], i) => <Box key={i} s={[1.7, 0.7 + 0.2 * (i % 2), 1.7]} p={[x, 0.4, z]} m={brickM(M, 1, 1, '#d99478')} />)}
        <Box s={[2.4, 1.2, 2.4]} p={[-6.5, 0.6, D / 2 + 0.4]} m={brickM(M, 2, 1, '#dc9a7c')} />
        <Box s={[1.8, 0.4, 1.8]} p={[-6.5, 1.4, D / 2 + 0.4]} m={brickM(M, 2, 1, '#dc9a7c')} />
        <TilGate p={[0, 0, D / 2]} />
        {/* the moat */}
        <Water w={W + 2 * mo + 2} d={mo} p={[0, 0.02, -D / 2 - mo / 2 - 0.5]} color="#4e7a6a" />
        <Water w={(W + 2 * mo + 2 - 3.4) / 2} d={mo} p={[-(W / 2 + mo + 1 + 3.4 / 2) / 2 - 1.1, 0.02, D / 2 + mo / 2 + 0.5]} color="#4e7a6a" />
        <Water w={(W + 2 * mo + 2 - 3.4) / 2} d={mo} p={[(W / 2 + mo + 1 + 3.4 / 2) / 2 + 1.1, 0.02, D / 2 + mo / 2 + 0.5]} color="#4e7a6a" />
        <Water w={mo} d={D + 1} p={[-W / 2 - mo / 2 - 0.5, 0.02, 0]} color="#4e7a6a" />
        <Water w={mo} d={D + 1} p={[W / 2 + mo / 2 + 0.5, 0.02, 0]} color="#4e7a6a" />
        {/* the inner citadel with gateways on the north and west */}
        <BRect p={[-3, 0, -3.2]} w={8.4} d={8.4} h={0.65} t={0.6} seed={11} gaps={{ n: [[0.5, 2]], w: [[0, 2]] }} />
        <TilGate p={[-3.5, 0, -7.4]} r={Math.PI} />
        {/* street-grid foundations of houses and halls inside the city */}
        {[[5.5, 2.2, 4, 2.6], [7.4, -3.6, 3, 3.4], [-7.6, 4.8, 3.6, 2.8], [3.5, -5.6, 3.2, 2.2], [-9, -0.2, 2, 3.2], [8.6, 5, 2.4, 2.4], [-2.4, 3.6, 2.6, 2.2]].map(([x, z, w, d], i) => (
          <BRect key={i} p={[x, 0, z]} w={w} d={d} h={0.35} t={0.4} seed={20 + i * 3} gaps={{ s: i % 2 ? [[0, 0.8]] : [], e: i % 3 === 0 ? [[0.2, 0.7]] : [] }} />
        ))}
        <BRect p={[0.6, 0, 0.5]} w={1.6} d={1.6} h={0.28} t={0.35} seed={40} />
        {/* the mound of the Samai Mai shrine with its orange compound wall */}
        <group position={[6.6, 0, 6.3]}>
          <mesh position={[0, 0, 0]} material={M.plain('#8f9a52', { roughness: 1 })} castShadow><sphereGeometry args={[1.8, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
          <Box s={[1.1, 0.5, 1.0]} p={[0, 1.5, 0]} m={M.plain('#e69a2e', { roughness: 0.9 })} />
          <Box s={[0.7, 0.2, 0.6]} p={[0, 1.85, 0]} m={M.plain('#b3402f')} />
        </group>
        <Box s={[2.6, 0.45, 0.2]} p={[3.8, 0.22, 8.1]} m={M.plain('#e69a2e', { roughness: 0.9 })} />
        <Box s={[2.6, 0.45, 0.2]} p={[9.2, 0.22, 8.1]} m={M.plain('#e69a2e', { roughness: 0.9 })} />
        {/* Shiva linga under the banyan-like tree, with a trident */}
        <Canopy p={[-8.4, 0, -5.4]} s={1.5} n={6} c="#54803a" c2="#6a9442" />
        <group position={[-6.6, 0, -3.4]} scale={0.55}><Lingam p={[0, 0, 0]} /></group>
        <Trident p={[-6.2, 0, -3.8]} h={1.3} />
        <Canopy p={[8.6, 0, -6]} s={1.35} n={5} c="#4d7a35" c2="#628f40" r={2} />
        <PrayerFlags from={[-8.4, 4.8, -5.4]} to={[8.6, 4.2, -6]} n={34} />
        <PrayerFlags from={[-8.4, 4.4, -5.4]} to={[-3, 0.8, 2]} n={18} />
        <Frame s={[26, 5.5, 22]} p={[0, 2.7, 0]} />
      </group>
    );
  }
  function TilaurakotEnv() {
    const M = useM();
    return (
      <group>
        <Plain r={90} y={-0.05} c="#a9b46a" />
        <Plain r={34} y={-0.03} c="#9fb862" />
        <Patch p={[-26, 0.003, 10]} w={16} d={12} c="#c2b660" />
        <Patch p={[24, 0.003, 22]} w={16} d={10} c="#7da84a" />
        <Patch p={[-8, 0.003, 26]} w={20} d={9} c="#b9b25e" />
        {/* the Banganga river with its sandy bank */}
        <Patch p={[27, 0.01, -4]} w={7} d={90} c="#d5c79a" />
        <Water w={5} d={90} p={[28.5, 0.04, -4]} color="#4f7f86" />
        {/* ponds of the ancient city */}
        <Water w={8} d={5.5} p={[-23, 0.03, -4]} color="#4e7a6a" />
        <Water w={6} d={4} p={[-15, 0.03, 20]} color="#4e7a6a" />
        {/* sal forest around the site */}
        {ringOf(34, 30, (p, r, i) => <Canopy key={i} p={[p[0] * (1 + (i % 3) * 0.07), 0, p[2] * (1 + (i % 3) * 0.07)]} s={1.3 + (i % 4) * 0.22} r={i} n={5} c={i % 2 ? '#4a7a36' : '#58853b'} />, (a) => a > 0.2 && a < Math.PI - 0.2)}
        {[[-17, -3], [-16, -12], [17, -14], [-18, 6]].map(([x, z], i) => <Canopy key={`s${i}`} p={[x, 0, z]} s={1.5} n={6} r={i} />)}
        {[[-24, 24], [-30, 8], [22, 40]].map(([x, z], i) => <House key={`h${i}`} M={M} p={[x, 0, z]} r={i} h={2.2} plaster />)}
      </group>
    );
  }

  /* Kudan (Nigrodharama): the stepped brick stupa mound with its stair, flags and Shiva shrine, in open grassland */
  function KudanMain() {
    const M = useM();
    const b1 = brickM(M, 8, 1, '#e0a285');
    const b2 = brickM(M, 6, 1, '#d99478');
    const b3 = brickM(M, 4, 1, '#e4ab8e');
    const tiers = [{ w: 12, d: 8.6, h: 0.85, m: b1 }, { w: 9.8, d: 6.6, h: 0.95, m: b2 }, { w: 7.2, d: 4.8, h: 0.9, m: b3 }];
    let y = 0;
    const cz = -1;
    const parts = [];
    tiers.forEach((T, i) => {
      parts.push(<Box key={`t${i}`} s={[T.w, T.h, T.d]} p={[0, y + T.h / 2, cz]} m={T.m} />);
      parts.push(<Box key={`c${i}`} s={[T.w + 0.18, 0.1, T.d + 0.18]} p={[0, y + T.h + 0.0, cz]} m={b1} cast={false} />);
      for (let k = -2; k <= 2; k += 1) {
        parts.push(<Box key={`rf${i}${k}`} s={[0.5, T.h * 0.9, 0.22]} p={[k * (T.w / 5.4), y + T.h * 0.45, cz + T.d / 2 + 0.1]} m={b2} cast={false} />);
        parts.push(<Box key={`rb${i}${k}`} s={[0.5, T.h * 0.9, 0.22]} p={[k * (T.w / 5.4), y + T.h * 0.45, cz - T.d / 2 - 0.1]} m={b2} cast={false} />);
      }
      y += T.h;
    });
    const topY = y;
    return (
      <group>
        <Patch p={[0, 0.004, 1]} w={26} d={22} c="#a9b36a" />
        {parts}
        {/* ragged brick parapet and the grassy hump on top, with the small Shiva shrine */}
        <mesh position={[0, topY + 0.05, cz]} scale={[3.3, 0.8, 2.2]} material={M.plain('#8c9f4e', { roughness: 1 })} castShadow><sphereGeometry args={[1, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
        <group position={[0, topY + 0.6, cz]}>
          <Box s={[0.9, 1.05, 0.9]} p={[0, 0.5, 0]} m={brickM(M, 1, 1, '#e08e68')} />
          <Box s={[0.34, 0.62, 0.06]} p={[0, 0.42, 0.46]} m={M.dark} />
          <Box s={[1.05, 0.12, 1.05]} p={[0, 1.08, 0]} m={brickM(M, 1, 1, '#d98462')} />
          <Spire r0={0.62} h={1.15} y={1.12} m={brickM(M, 1, 2, '#df8a62')} />
        </group>
        {/* the stair up the front, hung with prayer flags */}
        <Steps p={[0, 0, 4.7]} w={1.5} n={9} rise={0.29} run={0.42} m={b3} />
        {[-1, 1].map((k) => <Box key={k} s={[0.22, 1.1, 4.0]} p={[k * 0.95, 0.55, 3.0]} r={[-0.0, 0, 0]} m={b2} />)}
        <PrayerFlags from={[-0.7, topY + 1.5, cz + 0.2]} to={[-1.4, 0.7, 6.4]} n={20} />
        <PrayerFlags from={[0.7, topY + 1.5, cz + 0.2]} to={[1.4, 0.7, 6.4]} n={20} />
        <PrayerFlags from={[0, topY + 1.8, cz]} to={[-5.5, 0.9, 5.5]} n={22} />
        <PrayerFlags from={[0, topY + 1.8, cz]} to={[5.5, 0.9, 5.5]} n={22} />
        {/* Nigrodharama monastery foundations: a platform block and cells at both sides */}
        <Box s={[5.2, 1.0, 3.6]} p={[-10.6, 0.5, 0.2]} m={b1} />
        <Box s={[4.6, 0.3, 3]} p={[-10.6, 1.15, 0.2]} m={b2} />
        <BRect p={[-10.4, 0, 5.6]} w={4.6} d={3.4} h={0.55} t={0.45} seed={51} gaps={{ n: [[0, 0.9]] }} />
        <BRect p={[-10.4, 0, 5.6]} w={2} d={1.8} h={0.4} t={0.35} seed={55} />
        <BRect p={[10.4, 0, 2.2]} w={4.8} d={4} h={0.6} t={0.5} seed={61} gaps={{ s: [[-1, 1]], w: [[0, 0.9]] }} />
        <BRect p={[10.4, 0, 2.2]} w={2.2} d={2} h={0.42} t={0.38} seed={65} />
        {/* the old well and the cattle that graze there */}
        <Cyl rt={0.5} rb={0.55} h={0.5} p={[7.4, 0.25, 7.2]} m={b2} seg={14} />
        <Cow p={[3.2, 0, 8]} r={0.5} />
        <Cow p={[4.2, 0, 8.9]} r={-0.7} c="#a98a6a" />
        <Canopy p={[-13, 0, -6]} s={1.3} n={5} c="#5f8a3c" c2="#76a043" r={1} />
        <Frame s={[28, 6, 18]} p={[0, 3, 2]} />
      </group>
    );
  }
  function KudanEnv() {
    const M = useM();
    return (
      <group>
        <Plain r={90} y={-0.05} c="#a9b46a" />
        <Plain r={36} y={-0.03} c="#a4b468" />
        <Patch p={[0, 0.003, 22]} w={30} d={10} c="#9fb55e" />
        {/* the remains of the great pond */}
        <Water w={16} d={7} p={[16, 0.03, 16]} color="#5b7a66" />
        <Patch p={[16, 0.012, 16]} w={19} d={10} c="#8d8f58" />
        {/* groves of mahua and mango behind the mounds */}
        {ringOf(34, 26, (p, r, i) => <Canopy key={i} p={[p[0] * (1 + (i % 3) * 0.08), 0, p[2] * (1 + (i % 3) * 0.08)]} s={1.3 + (i % 4) * 0.2} r={i} n={5} c={i % 2 ? '#547f3a' : '#628b3c'} />, (a) => a > 0.2 && a < Math.PI - 0.2)}
        {[[-20, 4], [-22, 14], [21, -3], [24, 8]].map(([x, z], i) => <Canopy key={`g${i}`} p={[x, 0, z]} s={1.45} n={5} r={i} />)}
        {[[-26, -14, 1.2], [20, -22, 1.2], [-4, -30, 1.4]].map(([x, z, s], i) => <Canopy key={`f${i}`} p={[x, 0, z]} s={s} n={5} r={i} />)}
      </group>
    );
  }

  /* Gotihawa: the broken Ashokan pillar stump in its golden railing, beside the brick stupa base, in flat farmland */
  function GotihawaMain() {
    const M = useM();
    const stone = M.mat('granite', 1, 1, { color: '#a56a52', roughness: 0.6 });
    const cloth = M.plain('#f4f1ea', { roughness: 0.95 });
    const brick = brickM(M, 4, 1, '#e0a285');
    const flagTo = [[-1.9, 1.0, -1.9], [1.9, 1.0, -1.9], [1.9, 1.0, 1.9], [-1.9, 1.0, 1.9]];
    return (
      <group>
        <Patch p={[0, 0.004, 1]} w={22} d={18} c="#b9b068" />
        {/* the pillar enclosure */}
        <group position={[2.6, 0, 1.4]}>
          <Box s={[4.2, 0.12, 4.2]} p={[0, 0.06, 0]} m={M.plain('#c9c2b0')} />
          <BRect w={4} d={4} h={0.55} t={0.4} seed={70} c="#d58c70" gaps={{ s: [[1.3, 0.9]] }} />
          <Steps p={[1.3, 0.0, 2.5]} w={0.9} n={3} rise={0.18} run={0.26} m={brick} />
          <GoldFence w={3.7} d={3.7} h={0.85} p={[0, 0.55, 0]} />
          <Cyl rt={0.34} rb={0.44} h={1.25} p={[0, 0.7, 0]} m={stone} seg={16} />
          <mesh position={[0, 1.34, 0]} scale={[0.36, 0.3, 0.34]} material={stone} castShadow><sphereGeometry args={[1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
          <Box s={[0.34, 0.2, 0.3]} p={[0.08, 1.58, 0]} r={[0, 0.5, 0.45]} m={stone} />
          <mesh position={[0, 1.18, 0]} rotation={[Math.PI / 2, 0, 0.3]} material={cloth}><torusGeometry args={[0.37, 0.07, 6, 18]} /></mesh>
          {flagTo.map(([x, y, z], i) => <PrayerFlags key={i} from={[0, 1.7, 0]} to={[x, y + 0.5, z]} n={9} />)}
          <PrayerFlags from={[-1.9, 1.4, -1.9]} to={[1.9, 1.4, -1.9]} n={10} />
          <PrayerFlags from={[-1.9, 1.4, 1.9]} to={[1.9, 1.4, 1.9]} n={10} />
        </group>
        {/* the base of Krakuchhanda's stupa */}
        <StupaBase p={[-4.6, 0, -0.4]} r={3.1} seed={7} />
        <Steps p={[-4.6, 0, 3.9]} w={1.1} n={2} rise={0.22} run={0.38} m={brick} r={0} />
        {/* explanatory board on its post */}
        <group position={[-0.4, 0, 4.6]} rotation={[0, 0.3, 0]}>
          <Cyl rt={0.04} h={1.3} p={[0, 0.65, 0]} m={M.plain('#2f6a44')} seg={6} />
          <Box s={[0.9, 0.6, 0.05]} p={[0, 1.25, 0]} m={M.plain('#8a2f26')} />
        </group>
        <Frame s={[16, 3.4, 12]} p={[-0.5, 1.6, 1.5]} />
      </group>
    );
  }
  function GotihawaEnv() {
    const M = useM();
    return (
      <group>
        <Plain r={95} y={-0.05} c="#bdb36a" />
        <Plain r={34} y={-0.03} c="#c2b46a" />
        {[[-18, -12, 14, 10, '#7fae4e'], [16, -14, 16, 9, '#c8b768'], [-20, 12, 12, 10, '#9fb85a'], [24, 10, 12, 12, '#7da84a'], [0, -22, 22, 8, '#a8b45c']].map(([x, z, w, d, c], i) => <Patch key={i} p={[x, 0.003, z]} w={w} d={d} c={c} />)}
        {/* a wide pond of the district, with lotus */}
        <Water w={20} d={9} p={[-6, 0.03, -16]} color="#4c6a78" />
        {Array.from({ length: 12 }, (_, i) => <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-14 + (i % 6) * 3.1 + rnd(i) * 1.2, 0.06, -18 + Math.floor(i / 6) * 3.6 + rnd(i + 4)]}><circleGeometry args={[0.36, 8]} /><meshStandardMaterial color="#5f8a46" side={2} /></mesh>)}
        {/* a few trees and the village around */}
        {[[-14, 4], [-18, -4], [16, -6], [22, 4], [12, 18], [-12, 20], [30, -12], [-30, 8]].map(([x, z], i) => <Canopy key={i} p={[x, 0, z]} s={1.2 + (i % 3) * 0.2} n={4} r={i} c="#5a8238" c2="#6f9441" />)}
        {ringOf(14, 36, (p, r, i) => <House key={i} M={M} p={[p[0], 0, p[2]]} r={r} h={2 + (i % 3) * 0.5} plaster />, (a) => a > 0.3 && a < Math.PI - 0.3)}
        {/* electricity pole beside the field path */}
        <Cyl rt={0.09} rb={0.12} h={5.5} p={[9, 2.75, 7]} m={M.plain('#7a7468')} seg={6} />
        <Box s={[1.6, 0.08, 0.08]} p={[9, 5.2, 7]} m={M.dark} />
      </group>
    );
  }

  /* Ramagrama: the unexcavated stupa, a smooth green mound, with the great bodhi tree and its prayer flags at its foot */
  function RamagramaMain() {
    const M = useM();
    const g1 = M.plain('#58a23a', { roughness: 1 });
    const g2 = M.plain('#6fb645', { roughness: 1 });
    const g3 = M.plain('#4a8f32', { roughness: 1 });
    return (
      <group>
        <Patch p={[0, 0.004, 0]} w={24} d={20} c="#7cb84e" />
        {/* the mound: ~23.5 m across and 10 m high, a smooth dome with a gentle shoulder */}
        <mesh position={[0.4, 0, -0.4]} scale={[6.2, 3.1, 5.8]} material={g1} castShadow receiveShadow><sphereGeometry args={[1, 40, 18, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
        <mesh position={[-2.6, -0.02, 0.8]} scale={[3.4, 1.7, 3.2]} material={g2} castShadow receiveShadow><sphereGeometry args={[1, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
        <mesh position={[3.2, -0.02, 1.6]} scale={[3.0, 1.2, 3.0]} material={g3} receiveShadow><sphereGeometry args={[1, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
        {/* the bodhi tree at the foot of the mound, ringed by a low railing */}
        <Canopy p={[-6.6, 0, 3.0]} s={1.9} n={6} c="#6c8f3a" c2="#9a7c3c" lo={1.1} />
        {Array.from({ length: 14 }, (_, i) => {
          const a = (i / 14) * Math.PI * 2;
          return <Cyl key={i} rt={0.03} h={0.7} p={[-6.6 + Math.cos(a) * 1.5, 0.35, 3.0 + Math.sin(a) * 1.5]} m={M.plain('#6a5a4a')} seg={5} />;
        })}
        <PrayerFlags from={[-6.2, 5.6, 3.0]} to={[0.4, 2.9, -0.4]} n={26} />
        <PrayerFlags from={[-6.2, 5.0, 3.0]} to={[1.8, 1.3, 6.2]} n={26} />
        <PrayerFlags from={[-6.2, 4.4, 3.0]} to={[-3.6, 0.5, 8.4]} n={16} />
        <PrayerFlags from={[-6.2, 5.2, 3.0]} to={[-7.6, 0.6, -3.4]} n={14} />
        {[[1.8, 6.2], [-3.6, 8.4]].map(([x, z], i) => <Pole key={i} p={[x, 0, z]} h={1.4} fl={0} />)}
        <Frame s={[18, 6.6, 15]} p={[-1.5, 3.2, 2]} />
      </group>
    );
  }
  function RamagramaEnv() {
    const M = useM();
    const white = M.plain('#f6f1e6');
    const orange = M.plain('#e08a1e');
    return (
      <group>
        <Plain r={95} y={-0.05} c="#8cc25a" />
        <Plain r={34} y={-0.03} c="#79b24a" />
        {[[-22, -8, 14, 10, '#d3c15a'], [20, -12, 16, 10, '#9fc65a'], [-20, 14, 12, 10, '#6fae45'], [24, 12, 12, 10, '#b8c760']].map(([x, z, w, d, c], i) => <Patch key={i} p={[x, 0.003, z]} w={w} d={d} c={c} />)}
        {/* the earth road and the gate arch of the memorial compound */}
        <Patch p={[2.4, 0.01, 17]} w={3.2} d={26} c="#cdbb96" />
        <group position={[2.4, 0, 21]}>
          {[-2.6, 2.6].map((x) => (
            <group key={x} position={[x, 0, 0]}>
              <Box s={[0.9, 3.8, 0.9]} p={[0, 1.9, 0]} m={white} />
              {[0.6, 2.1, 3.3].map((y) => <Box key={y} s={[0.96, 0.18, 0.96]} p={[0, y, 0]} m={orange} />)}
              <Box s={[0.3, 0.9, 0.04]} p={[0, 1.4, 0.46]} m={M.dark} />
              <mesh position={[0, 4.1, 0]} material={M.gold}><coneGeometry args={[0.3, 0.7, 8]} /></mesh>
            </group>
          ))}
          <Box s={[6.2, 0.7, 0.6]} p={[0, 3.6, 0]} m={white} />
          <Box s={[6.4, 0.14, 0.7]} p={[0, 3.98, 0]} m={orange} />
          <mesh position={[0, 3.98, 0]} material={white}><cylinderGeometry args={[1.0, 1.2, 0.45, 3, 1, false, Math.PI / 2]} /></mesh>
        </group>
        {/* groves of big trees around the mound */}
        {ringOf(34, 27, (p, r, i) => <Canopy key={i} p={[p[0] * (1 + (i % 3) * 0.07), 0, p[2] * (1 + (i % 3) * 0.07)]} s={1.4 + (i % 4) * 0.22} r={i} n={5} c={i % 2 ? '#3f7a34' : '#4d8a38'} />, (a) => a > 0.25 && a < Math.PI - 0.25)}
        {[[-17, 2], [-15, -9], [16, 2], [14, 12], [-14, 18]].map(([x, z], i) => <Canopy key={`g${i}`} p={[x, 0, z]} s={1.5} n={5} r={i} c="#3f7a34" c2="#52913b" />)}
        {[[-20, 20], [-12, 26], [20, 20], [10, 28]].map(([x, z], i) => <Palm key={i} p={[x, 0, z]} s={1.1} r={i} />)}
      </group>
    );
  }

  // @@COMPONENTS

  return {
    'maya-devi-temple-lumbini': { Main: MayaMain, Env: MayaEnv },
    'ashoka-pillar-lumbini': { Main: AshokaMain, Env: AshokaEnv },
    tilaurakot: { Main: TilaurakotMain, Env: TilaurakotEnv },
    'kudan-nigrodharama': { Main: KudanMain, Env: KudanEnv },
    gotihawa: { Main: GotihawaMain, Env: GotihawaEnv },
    'ramagrama-stupa': { Main: RamagramaMain, Env: RamagramaEnv },
    // @@ENTRIES
  };
}
