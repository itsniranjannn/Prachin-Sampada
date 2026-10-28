// Hand-built landmarks: Lumbini, Kapilavastu (Tilaurakot, Kudan, Gotihawa, Ramagrama), Palpa and the western hills.
import { useMemo } from 'react';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Gajur, Tree, PrayerFlags, Frame, Water, GroundDisc, ringOf, whiteMat, Chaitya, Trident, Lingam, Lion, Elephant, Spire, House, NewarHouse, LatticeWindow, PagodaBody, THREE } = K;

  /* ---------- shared helpers ---------- */
  const backOnly = (a) => a < Math.PI - 0.15 || a > Math.PI * 2 - 0.7;
  const rnd = (i) => { const r = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return r - Math.floor(r); };
  const brickM = (M, rx = 2, ry = 1, c = '#e6ad92') => M.mat('brick', rx, ry, c === '#f0c4a4' ? { color: '#ffffff', emissive: '#b06a44', emissiveIntensity: 0.5 } : { color: c });
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
        const m = brickM(M, Math.max(1, l / 0.6), Math.max(1, hh / 0.2), c);
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
    const sand = M.plain('#c9aa80', { roughness: 0.6 });
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
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 3]} receiveShadow material={M.plain('#c98a6c', { roughness: 0.95 })}><planeGeometry args={[34, 21]} /></mesh>
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
        {ringOf(30, 29, (p, r, i) => <Canopy key={i} p={[p[0] * (1 + (i % 3) * 0.06), 0, p[2] * (1 + (i % 3) * 0.06)]} s={1.1 + (i % 4) * 0.18} r={i} n={4} c={i % 2 ? '#4a7a36' : '#58853b'} />, backOnly)}
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
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 4]} receiveShadow material={M.plain('#c98a6c', { roughness: 0.95 })}><planeGeometry args={[30, 22]} /></mesh>
        <GroundDisc r={90} y={-0.04} m={grassM(M, '#86ad54')} />
        <GroundDisc r={26} y={-0.02} m={grassM(M, '#93b95e')} />
        <BRect p={[-7.5, 0, -2]} w={4.4} d={3.6} h={0.7} t={0.5} seed={4} />
        <BRect p={[8.2, 0, -1]} w={4.2} d={3.4} h={0.6} t={0.45} seed={8} gaps={{ s: [[0, 1]] }} />
        {[[-5, 4.5, 1], [5.6, 5, 1.1], [7, 3, 0.8]].map(([x, z, s], k) => <VotiveStupa key={k} p={[x, 0, z]} s={s} />)}
        <Box s={[0.7, 0.6, 10]} p={[-12, 0.3, 6]} m={M.plain('#3f6b30', { roughness: 1 })} />
        <Box s={[0.7, 0.6, 10]} p={[12, 0.3, 6]} m={M.plain('#3f6b30', { roughness: 1 })} />
        {ringOf(26, 24, (p, r, i) => <Canopy key={i} p={[p[0], 0, p[2]]} s={1.1 + (i % 4) * 0.18} r={i} n={4} c={i % 2 ? '#4a7a36' : '#58853b'} />, backOnly)}
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
    const b = brickM(M, 2, 1, '#f0c4a4');
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
    const bc = '#f0c4a4';
    const orange = M.plain('#e8962a', { roughness: 0.9 });
    const orangeD = M.plain('#c97a1c', { roughness: 0.9 });
    const mound = M.plain('#7f9a4c', { roughness: 1 });
    const sand = '#d9c79a';
    return (
      <group>
        {/* grass inside the walls with the bare sandy tracks and worn patches seen on site */}
        <Patch p={[0, 0.004, 0]} w={W + 3.4} d={D + 3.4} c="#93ad5c" />
        <Patch p={[1, 0.007, -1.5]} w={9} d={6.5} c={sand} />
        <Patch p={[-6.5, 0.007, 1.8]} w={5.5} d={4} c={sand} />
        <Patch p={[5, 0.007, 3]} w={6} d={3.2} c="#cdbb8c" />
        <Patch p={[0, 0.007, 7.2]} w={3.2} d={6} c={sand} />
        <BRect w={W} d={D} h={0.8} t={0.75} seed={5} c={bc} gaps={{ s: [[0, 2.6]], w: [[1.5, 2.2]] }} />
        {/* corner bastions and the stepped tower on the south wall */}
        {[[-W / 2, -D / 2], [W / 2, -D / 2], [-W / 2, D / 2], [W / 2, D / 2]].map(([x, z], i) => (
          <group key={i} position={[x, 0, z]}>
            <Box s={[1.9, 0.5, 1.9]} p={[0, 0.25, 0]} m={brickM(M, 2, 1, bc)} />
            <Box s={[1.5, 0.35 + 0.15 * (i % 2), 1.5]} p={[0, 0.67 + 0.07 * (i % 2), 0]} m={brickM(M, 2, 1, bc)} />
          </group>
        ))}
        <Box s={[2.8, 0.5, 2.8]} p={[-6.5, 0.25, D / 2 + 0.4]} m={brickM(M, 2, 1, bc)} />
        <Box s={[2.3, 0.6, 2.3]} p={[-6.5, 0.8, D / 2 + 0.4]} m={brickM(M, 2, 1, bc)} />
        <Box s={[1.7, 0.4, 1.7]} p={[-6.5, 1.3, D / 2 + 0.4]} m={brickM(M, 2, 1, bc)} />
        <TilGate p={[0, 0, D / 2]} />
        {/* the moat */}
        <Water w={W + 2 * mo + 2} d={mo} p={[0, 0.02, -D / 2 - mo / 2 - 0.5]} color="#4e7a6a" />
        <Water w={(W + 2 * mo + 2 - 3.4) / 2} d={mo} p={[-(W / 2 + mo + 1 + 3.4 / 2) / 2 - 1.1, 0.02, D / 2 + mo / 2 + 0.5]} color="#4e7a6a" />
        <Water w={(W + 2 * mo + 2 - 3.4) / 2} d={mo} p={[(W / 2 + mo + 1 + 3.4 / 2) / 2 + 1.1, 0.02, D / 2 + mo / 2 + 0.5]} color="#4e7a6a" />
        <Water w={mo} d={D + 1} p={[-W / 2 - mo / 2 - 0.5, 0.02, 0]} color="#4e7a6a" />
        <Water w={mo} d={D + 1} p={[W / 2 + mo / 2 + 0.5, 0.02, 0]} color="#4e7a6a" />
        {/* the inner citadel with gateways on the north and west */}
        <BRect p={[-3, 0, -3.2]} w={8.4} d={8.4} h={0.85} t={0.65} seed={11} c={bc} gaps={{ n: [[0.5, 2]], w: [[0, 2]] }} />
        <TilGate p={[-3.5, 0, -7.4]} r={Math.PI} />
        {/* street-grid foundations of houses and halls inside the city */}
        {[[5.5, 2.2, 4, 2.6], [7.4, -3.6, 3, 3.4], [-7.6, 4.8, 3.6, 2.8], [3.5, -5.6, 3.2, 2.2], [-9, -0.2, 2, 3.2], [8.6, 5, 2.4, 2.4], [-2.4, 3.6, 2.6, 2.2]].map(([x, z, w, d], i) => (
          <BRect key={i} p={[x, 0, z]} w={w} d={d} h={0.5} t={0.5} seed={20 + i * 3} c={bc} gaps={{ s: i % 2 ? [[0, 0.8]] : [], e: i % 3 === 0 ? [[0.2, 0.7]] : [] }} />
        ))}
        <BRect p={[0.6, 0, 0.5]} w={1.6} d={1.6} h={0.4} t={0.4} seed={40} c={bc} />
        {/* the mound of the Samai Mai shrine: orange compound wall with a saw-tooth top, gate and a small shrine */}
        <group position={[6.6, 0, 8.2]}>
          <mesh material={mound} castShadow scale={[1, 0.7, 1]}><sphereGeometry args={[3, 22, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
          <Box s={[1.5, 0.9, 1.3]} p={[0, 1.85, -0.2]} m={M.plain('#f3e6c8', { roughness: 0.9 })} />
          <Box s={[1.8, 0.14, 1.6]} p={[0, 2.38, -0.2]} m={M.plain('#b3402f')} />
          <Box s={[1.1, 0.14, 1.0]} p={[0, 2.52, -0.2]} m={M.plain('#b3402f')} />
          <Box s={[0.4, 0.6, 0.06]} p={[0, 1.7, 0.47]} m={M.plain('#6b2a1c')} cast={false} />
        </group>
        {Array.from({ length: 22 }, (_, k) => {
          const x = 0.6 + k * 0.46;
          return (
            <group key={k} position={[x, 0, 10.3]}>
              <Box s={[0.46, 0.42, 0.16]} p={[0, 0.21, 0]} m={k % 2 ? orange : orangeD} cast={false} />
              <mesh position={[0, 0.56, 0]} material={k % 2 ? orange : orangeD} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[0.2, 0.28, 4]} /></mesh>
            </group>
          );
        })}
        <Box s={[0.4, 1.1, 0.4]} p={[3.25, 0.55, 10.3]} m={orange} />
        <Box s={[0.4, 1.1, 0.4]} p={[4.55, 0.55, 10.3]} m={orange} />
        <Box s={[1.7, 0.2, 0.4]} p={[3.9, 1.2, 10.3]} m={orangeD} />
        {/* Shiva linga venerated on a sandy plot, red cloth, trident and the old brick niche behind */}
        <Patch p={[-6.6, 0.012, -3.4]} w={3.6} d={3.2} c="#e6d3a4" />
        <Box s={[2.2, 1.5, 0.5]} p={[-6.6, 0.75, -5.3]} m={brickM(M, 2, 2, '#d99f80')} />
        <Box s={[0.9, 0.9, 0.55]} p={[-6.6, 0.45, -5.28]} m={M.plain('#3a2a20')} cast={false} />
        <group position={[-6.6, 0, -3.4]} scale={1.15}>
          <Lingam p={[0, 0, 0]} />
          <Cyl rt={0.34} rb={0.4} h={0.12} p={[0, 0.06, 0]} m={M.plain('#c0392b')} seg={14} />
        </group>
        <Trident p={[-5.6, 0, -3.5]} h={1.6} />
        <Canopy p={[-10.2, 0, -8]} s={1.2} n={6} c="#54803a" c2="#6a9442" />
        <Canopy p={[12.5, 0, -11]} s={1.05} n={5} c="#4d7a35" c2="#628f40" r={2} />
        <PrayerFlags from={[-10.2, 3.4, -8]} to={[-8.2, 1.4, 6]} n={26} />
        <PrayerFlags from={[-6.8, 1.6, 8]} to={[8.4, 1.8, 3.5]} n={30} />
        <Frame s={[26, 4, 22]} p={[0, 1.4, 0]} />
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
        {/* sal and banyan forest around the back of the site, kept low and away from the viewing angles */}
        {ringOf(30, 38, (p, r, i) => <Canopy key={i} p={[p[0] * (1 + (i % 3) * 0.06), 0, p[2] * (1 + (i % 3) * 0.06)]} s={1.1 + (i % 4) * 0.18} r={i} n={5} c={i % 2 ? '#4a7a36' : '#58853b'} />, backOnly)}
        {[[-22, -10], [-24, 4], [21, -16]].map(([x, z], i) => <Canopy key={`s${i}`} p={[x, 0, z]} s={1.3} n={6} r={i} />)}
        {[[-24, 24], [-30, 8], [22, 40]].map(([x, z], i) => <House key={`h${i}`} M={M} p={[x, 0, z]} r={i} h={2.2} plaster />)}
      </group>
    );
  }

  /* Kudan (Nigrodharama): the stepped brick stupa mound with its stair, flags and Shiva shrine, in open grassland */
  function KudanMain() {
    const M = useM();
    const b1 = brickM(M, 18, 2, '#e0a285');
    const b2 = brickM(M, 14, 2, '#d99478');
    const b3 = brickM(M, 10, 2, '#e4ab8e');
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
        <Box s={[4.6, 1.0, 3.4]} p={[-9.2, 0.5, 0.2]} m={b1} />
        <Box s={[4, 0.3, 2.8]} p={[-9.2, 1.15, 0.2]} m={b2} />
        <BRect p={[-9, 0, 5.2]} w={4.2} d={3.2} h={0.55} t={0.45} seed={51} gaps={{ n: [[0, 0.9]] }} />
        <BRect p={[-9, 0, 5.2]} w={1.8} d={1.6} h={0.4} t={0.35} seed={55} />
        <BRect p={[9.2, 0, 2.2]} w={4.4} d={3.8} h={0.6} t={0.5} seed={61} gaps={{ s: [[-1, 1]], w: [[0, 0.9]] }} />
        <BRect p={[9.2, 0, 2.2]} w={2} d={1.8} h={0.42} t={0.38} seed={65} />
        {/* the old well and the cattle that graze there */}
        <Cyl rt={0.5} rb={0.55} h={0.5} p={[7.4, 0.25, 7.2]} m={b2} seg={14} />
        <Cow p={[3.2, 0, 8]} r={0.5} />
        <Cow p={[4.2, 0, 8.9]} r={-0.7} c="#a98a6a" />
        <Frame s={[22, 6, 16]} p={[0, 3, 2]} />
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
        <Water w={13} d={6} p={[-17, 0.03, 12]} color="#5b7a66" />
        <Patch p={[-17, 0.012, 12]} w={15.5} d={8.4} c="#8d8f58" />
        <Canopy p={[-14, 0, -5]} s={1.3} n={5} c="#5f8a3c" c2="#76a043" r={1} />
        {/* groves of mahua and mango behind the mounds */}
        {ringOf(34, 26, (p, r, i) => <Canopy key={i} p={[p[0] * (1 + (i % 3) * 0.08), 0, p[2] * (1 + (i % 3) * 0.08)]} s={1.3 + (i % 4) * 0.2} r={i} n={5} c={i % 2 ? '#547f3a' : '#628b3c'} />, backOnly)}
        {[[-20, 2], [-22, -8], [-27, 12]].map(([x, z], i) => <Canopy key={`g${i}`} p={[x, 0, z]} s={1.45} n={5} r={i} />)}
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
        {[[-14, -2], [-18, -9], [16, -8], [-30, 8], [30, -14], [-12, 8]].map(([x, z], i) => <Canopy key={i} p={[x, 0, z]} s={1.2 + (i % 3) * 0.2} n={4} r={i} c="#5a8238" c2="#6f9441" />)}
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
        <mesh position={[0.4, 0, -0.4]} scale={[6.4, 4.3, 6]} material={g1} castShadow receiveShadow><sphereGeometry args={[1, 40, 18, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
        <mesh position={[-2.6, -0.02, 0.8]} scale={[3.4, 2.2, 3.2]} material={g2} castShadow receiveShadow><sphereGeometry args={[1, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
        <mesh position={[3.2, -0.02, 1.6]} scale={[3.0, 1.2, 3.0]} material={g3} receiveShadow><sphereGeometry args={[1, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
        {/* the bodhi tree at the foot of the mound, ringed by a low railing */}
        <Canopy p={[-7.2, 0, 3.2]} s={1.55} n={6} c="#6c8f3a" c2="#9a7c3c" lo={1.1} />
        {Array.from({ length: 14 }, (_, i) => {
          const a = (i / 14) * Math.PI * 2;
          return <Cyl key={i} rt={0.03} h={0.7} p={[-6.6 + Math.cos(a) * 1.5, 0.35, 3.0 + Math.sin(a) * 1.5]} m={M.plain('#6a5a4a')} seg={5} />;
        })}
        <PrayerFlags from={[-6.2, 5.6, 3.0]} to={[0.4, 2.9, -0.4]} n={26} />
        <PrayerFlags from={[-6.2, 5.0, 3.0]} to={[1.8, 1.3, 6.2]} n={26} />
        <PrayerFlags from={[-6.2, 4.4, 3.0]} to={[-3.6, 0.5, 8.4]} n={16} />
        <PrayerFlags from={[-6.2, 5.2, 3.0]} to={[-7.6, 0.6, -3.4]} n={14} />
        {[[1.8, 6.2], [-3.6, 8.4]].map(([x, z], i) => <Pole key={i} p={[x, 0, z]} h={1.4} fl={0} />)}
        <Frame s={[17, 7, 13]} p={[-1.5, 3, 1.5]} />
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
        <Patch p={[-3, 0.01, 15]} w={3.2} d={24} c="#cdbb96" />
        <group position={[-3, 0, 26]}>
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
        {ringOf(34, 27, (p, r, i) => <Canopy key={i} p={[p[0] * (1 + (i % 3) * 0.07), 0, p[2] * (1 + (i % 3) * 0.07)]} s={1.4 + (i % 4) * 0.22} r={i} n={5} c={i % 2 ? '#3f7a34' : '#4d8a38'} />, backOnly)}
        {[[-17, 2], [-15, -9], [-17, -16]].map(([x, z], i) => <Canopy key={`g${i}`} p={[x, 0, z]} s={1.5} n={5} r={i} c="#3f7a34" c2="#52913b" />)}
        {[[-20, 20], [-26, 12]].map(([x, z], i) => <Palm key={i} p={[x, 0, z]} s={1.1} r={i} />)}
      </group>
    );
  }

  /* ---------- shared bits for the western hills ---------- */
  /** Many axis-aligned boxes merged into one mesh (rows of windows, pilasters, pickets). boxes: [sx,sy,sz,px,py,pz]. */
  function BoxBatch({ boxes, m, cast = false }) {
    const key = JSON.stringify(boxes);
    const geo = useMemo(() => {
      const gs = boxes.map(([sx, sy, sz, px, py, pz]) => { const g = new THREE.BoxGeometry(sx, sy, sz); g.translate(px, py, pz); return g; });
      const g = mergeGeometries(gs);
      gs.forEach((x) => x.dispose());
      return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);
    return <mesh geometry={geo} material={m} castShadow={cast} receiveShadow />;
  }
  /** Window/pilaster positions along a wall running in x or z. nrm = outward direction (+1/-1). */
  function wallBoxes({ cx, cz, along, nrm, n, gap, floors, y0 = 0.55, fh = 1.0, sx, sy, sd, off = 0, skip = () => false }) {
    const out = [];
    for (let k = 0; k < n; k += 1) {
      const t = (k - (n - 1) / 2) * gap;
      for (let f = 0; f < floors; f += 1) {
        if (skip(k, f)) continue;
        const y = y0 + f * fh;
        out.push(along === 'x' ? [sx, sy, sd, cx + t, y, cz + nrm * off] : [sd, sy, sx, cx + nrm * off, y, cz + t]);
      }
    }
    return out;
  }
  function HillMound({ p, sc, c = '#5f8f3f', tex = false }) {
    const M = useM();
    return (
      <mesh position={p} scale={sc} material={tex ? M.mat('rock', 3, 2, { color: c }) : M.plain(c, { roughness: 1 })} receiveShadow>
        <sphereGeometry args={[1, 26, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
    );
  }
  function Pediment({ p, w = 2, h = 0.7, d = 0.25, m }) {
    const geo = useMemo(() => {
      const s = new THREE.Shape();
      s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath();
      const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false });
      g.translate(0, 0, -d / 2);
      return g;
    }, [w, h, d]);
    return <mesh position={p} geometry={geo} material={m} castShadow />;
  }

  /* Rishikesh Temple, Ridi: tiled brick sanctum and ochre domed shrines in a paved courtyard above the Kali Gandaki ghats */
  function BellFrame({ p, r = 0, w = 2.2, h = 1.9, n = 4 }) {
    const M = useM();
    const cream = M.plain('#efe3c0', { roughness: 0.8 });
    const carve = M.plain('#d9c58e', { roughness: 0.8 });
    const bell = M.plain('#b9923a', { metalness: 0.8, roughness: 0.4 });
    return (
      <group position={p} rotation={[0, r, 0]}>
        {[-1, 1].map((k) => <Box key={k} s={[0.2, h, 0.2]} p={[k * w / 2, h / 2, 0]} m={cream} />)}
        <Box s={[w + 0.5, 0.2, 0.26]} p={[0, h + 0.05, 0]} m={cream} />
        <Box s={[w + 0.3, 0.1, 0.3]} p={[0, h + 0.2, 0]} m={carve} />
        {Array.from({ length: n }, (_, i) => {
          const x = -w / 2 + 0.35 + (i * (w - 0.7)) / Math.max(1, n - 1);
          return (
            <group key={i} position={[x, h - 0.06, 0]}>
              <Cyl rt={0.012} h={0.25} p={[0, -0.12, 0]} m={bell} seg={4} />
              <mesh position={[0, -0.4, 0]} material={bell} castShadow><cylinderGeometry args={[0.04, 0.15, 0.3, 10]} /></mesh>
            </group>
          );
        })}
      </group>
    );
  }
  function OchreShrine({ p, s = 1, r = 0 }) {
    const M = useM();
    const red = M.plain('#b83a2a', { roughness: 0.85 });
    const yel = M.plain('#e6b02a', { roughness: 0.8 });
    return (
      <group position={p} scale={s} rotation={[0, r, 0]}>
        <Box s={[2.0, 0.7, 2.0]} p={[0, 0.35, 0]} m={red} />
        <Box s={[1.7, 1.2, 1.7]} p={[0, 1.3, 0]} m={yel} />
        <Box s={[0.5, 0.8, 0.06]} p={[0, 1.1, 0.88]} m={M.dark} />
        <Box s={[1.9, 0.12, 1.9]} p={[0, 1.96, 0]} m={red} />
        <mesh position={[0, 1.98, 0]} scale={[1, 0.85, 1]} material={yel} castShadow><sphereGeometry args={[0.82, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
        <Box s={[0.4, 0.4, 0.4]} p={[0, 2.85, 0]} m={yel} />
        <Box s={[0.5, 0.08, 0.5]} p={[0, 3.1, 0]} m={red} />
        <mesh position={[0, 3.3, 0]} material={M.gold}><coneGeometry args={[0.1, 0.4, 8]} /></mesh>
      </group>
    );
  }
  function RedPavilion({ p, r = 0, w = 2.6 }) {
    const M = useM();
    const red = M.plain('#a83228', { roughness: 0.85 });
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[w + 0.4, 0.3, w + 0.4]} p={[0, 0.15, 0]} m={brickM(M, 3, 0.4, '#e2a088')} />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], i) => <Cyl key={i} rt={0.08} rb={0.1} h={1.7} p={[a * w / 2, 1.15, b * w / 2]} m={red} seg={8} />)}
        <Box s={[w + 0.2, 0.14, w + 0.2]} p={[0, 2.05, 0]} m={red} />
        <Roof w={w + 1.0} d={w + 1.0} h={0.8} y={2.1} m={M.mat('roof', 3, 3, { color: '#b5483a' })} sag={1.1} lift={0.05} />
        <Gajur y={2.85} s={0.45} />
      </group>
    );
  }
  const F_STRUTS = new Set(['carved-struts', 'carved-windows']);
  function RidiMain() {
    const M = useM();
    const H = 1.1;
    const stone = M.mat('granite', 4, 1, { color: '#d8cfbd' });
    return (
      <group>
        <Box s={[19, H, 14.6]} p={[0, H / 2, 0]} m={stone} />
        <Box s={[19.3, 0.12, 14.9]} p={[0, H, 0]} m={M.stone} cast={false} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, H + 0.08, 0]} receiveShadow material={M.plain('#d8d0c0', { roughness: 1 })}><planeGeometry args={[18.6, 14.2]} /></mesh>
        <group position={[0, H + 0.08, 0]}>
          {/* the tiled sanctum of Rishikesh (Vishnu) */}
          <Box s={[4.6, 0.4, 4.6]} p={[0, 0.2, -2]} m={brickM(M, 3, 0.4, '#e2a088')} />
          <group position={[0, 0.4, -2]}><PagodaBody tiers={2} w={2.8} d={2.8} walls="red-brick" roof="clay-tile" f={F_STRUTS} /></group>
          {/* ochre domed shrines with red plinths */}
          <OchreShrine p={[-5.6, 0, -0.4]} s={1.15} r={0.15} />
          <OchreShrine p={[-5.2, 0, 3.4]} s={0.75} r={0.3} />
          <OchreShrine p={[5.8, 0, 3.8]} s={0.7} r={-0.3} />
          <RedPavilion p={[5.4, 0, -0.6]} w={2.4} />
          {/* the frames of hanging temple bells */}
          <BellFrame p={[-1.8, 0, 3.8]} w={2.3} n={4} />
          <BellFrame p={[1.8, 0, 3.0]} w={2.0} n={3} r={0.1} />
          <BellFrame p={[-1.8, 0, 1.4]} w={1.7} n={3} />
          {/* brick and timber houses of Ridi round the courtyard */}
          <NewarHouse p={[-6.4, 0, -4.4]} w={4.6} d={2.4} storeys={2} />
          <NewarHouse p={[6.4, 0, -4.4]} w={4.6} d={2.4} storeys={2} detail />
          <NewarHouse p={[0.2, 0, -6.1]} w={5} d={1.8} storeys={2} shop={false} />
          <group position={[-8.2, 0, 3.6]} rotation={[0, Math.PI / 2, 0]}>
            <Box s={[4.4, 2.0, 2.2]} p={[0, 1.0, 0]} m={M.plain('#f4efe2', { roughness: 0.85 })} />
            <Box s={[4.42, 0.65, 2.22]} p={[0, 0.33, 0]} m={M.plain('#b3402f', { roughness: 0.85 })} />
            <Roof w={5.2} d={3} h={0.8} y={2.0} m={M.mat('roof', 3, 3, { color: '#a8584a' })} sag={1.1} lift={0.05} />
          </group>
        </group>
        {/* wide stairway down to the ghats with red balustrades */}
        <Steps p={[0, 0, 10.2]} w={4.8} n={6} rise={H / 6} run={0.55} m={M.stone} />
        {[-1, 1].map((k) => <Box key={k} s={[0.3, 0.6, 3.6]} p={[k * 2.55, H * 0.55 + 0.1, 8.9]} r={[0.28, 0, 0]} m={M.plain('#b83a2a', { roughness: 0.85 })} />)}
        <Frame s={[21, 6, 22]} p={[0, 3, 2]} />
      </group>
    );
  }
  function RidiEnv() {
    const M = useM();
    return (
      <group>
        <Plain r={95} y={-0.06} c="#7a9a52" />
        <Plain r={30} y={-0.03} c="#8aa75a" />
        {/* the sand bank and the two rivers meeting below the temple */}
        <Patch p={[0, 0.004, 17]} w={70} d={9} c="#d6cba8" />
        <Water w={90} d={22} p={[0, 0.03, 32]} color="#58868a" />
        <Water w={8} d={30} p={[16, 0.035, 8]} color="#6a9a9c" r={0.0} />
        {[0, 1, 2].map((k) => <Box key={k} s={[3.4 - k * 0.4, 0.14, 0.5]} p={[0, 0.07, 12.8 + k * 0.5]} m={M.stone} />)}
        {/* steep forested hills of Palpa, Gulmi and Syangja */}
        <HillMound p={[-36, -0.2, -26]} sc={[26, 15, 20]} c="#4d7f3e" />
        <HillMound p={[10, -0.2, -42]} sc={[34, 20, 22]} c="#46763a" />
        <HillMound p={[52, -0.2, -8]} sc={[24, 17, 26]} c="#4f823f" />
        <HillMound p={[-56, -0.2, 8]} sc={[24, 14, 28]} c="#4a7b3d" />
        <HillMound p={[0, -0.2, -60]} sc={[70, 38, 28]} c="#6a8f78" />
        {ringOf(30, 26, (p, r, i) => <Canopy key={i} p={[p[0] * (1 + (i % 3) * 0.06), 0, p[2] * (1 + (i % 3) * 0.06)]} s={1.2 + (i % 4) * 0.2} r={i} n={4} c={i % 2 ? '#4a7a36' : '#58853b'} />, (a) => a < Math.PI + 0.1 || a > Math.PI * 2 - 0.6)}
        {[[-19, 6], [-23, 12], [-26, -2]].map(([x, z], i) => <House key={i} M={M} p={[x, 0, z]} r={0.5 + i} h={2.3} plaster />)}
      </group>
    );
  }

  /* Rani Mahal: the blue colonnaded Rana palace on its rocky bank above the Kali Gandaki, over white crenellated terraces */
  function RaniMain() {
    const M = useM();
    const rock = M.plain('#b9704a', { roughness: 1 });
    const wm = whiteMat(M);
    const blue = M.plain('#4f95d6', { roughness: 0.75 });
    const blueD = M.plain('#2d74b8', { roughness: 0.75 });
    const pink = M.plain('#d96a62', { roughness: 0.7 });
    const dark = M.plain('#33404c');
    const archRow = (n, w, y, z, rot = 0) => Array.from({ length: n }, (_, k) => {
      const x = -w / 2 + (k + 0.5) * (w / n);
      return <Box key={`${y}${k}`} s={[0.34, 0.62, 0.05]} p={[x, y, z]} r={[0, rot, 0]} m={dark} cast={false} />;
    });
    const crenel = (w, y, z, n = 14) => Array.from({ length: n }, (_, k) => <Box key={`c${y}${k}`} s={[0.24, 0.3, 0.3]} p={[-w / 2 + 0.12 + (k * (w - 0.24)) / (n - 1), y, z]} m={wm} cast={false} />);
    const cliffTop = 2.5;
    return (
      <group>
        {/* the eroded red cliff the palace grows out of */}
        <Box s={[16, cliffTop, 9]} p={[0, cliffTop / 2, -0.5]} m={rock} />
        <Box s={[12, 1.2, 3]} p={[0, 0.6, 5.2]} m={rock} />
        <Box s={[7, 0.7, 2.4]} p={[-5.4, 0.35, 6.4]} m={rock} />
        {/* the white terraces: two storeys of arches with a crenellated parapet */}
        <group position={[-3.4, cliffTop, 1.8]}>
          <Box s={[8, 2.3, 3]} p={[0, 1.15, 0]} m={wm} />
          {archRow(7, 7.4, 0.7, 1.52)}
          {archRow(7, 7.4, 1.7, 1.52)}
          <Box s={[8.2, 0.1, 3.2]} p={[0, 2.35, 0]} m={wm} />
          {crenel(8.1, 2.55, 1.55)}
          {crenel(8.1, 2.55, -1.55)}
        </group>
        <group position={[3.8, cliffTop, 2.2]}>
          <Box s={[6, 1.3, 2.6]} p={[0, 0.65, 0]} m={wm} />
          {archRow(5, 5.4, 0.62, 1.32)}
          <Box s={[6.2, 0.1, 2.8]} p={[0, 1.35, 0]} m={wm} />
          {Array.from({ length: 16 }, (_, k) => <Box key={k} s={[0.06, 0.4, 0.06]} p={[-2.9 + k * 0.386, 1.6, 1.35]} m={wm} cast={false} />)}
          <Box s={[6, 0.06, 0.06]} p={[0, 1.82, 1.35]} m={wm} cast={false} />
        </group>
        {/* the podium and the blue main block with its colonnade, pediment and pink hipped roof */}
        <group position={[1.6, cliffTop + 1.5, -1.6]}>
          <Box s={[9.2, 0.6, 4.6]} p={[0, -0.3, 0]} m={wm} />
          <Box s={[7.4, 2.5, 3.6]} p={[0, 1.25, 0]} m={blue} />
          <Box s={[7.6, 0.12, 3.8]} p={[0, 1.2, 0]} m={wm} />
          {Array.from({ length: 9 }, (_, k) => <Box key={`wl${k}`} s={[0.42, 0.62, 0.05]} p={[-3.2 + k * 0.8, 0.62, 1.82]} m={wm} cast={false} />)}
          {Array.from({ length: 9 }, (_, k) => <Box key={`wu${k}`} s={[0.42, 0.7, 0.05]} p={[-3.2 + k * 0.8, 1.85, 1.82]} m={wm} cast={false} />)}
          {Array.from({ length: 7 }, (_, k) => <Cyl key={`col${k}`} rt={0.1} rb={0.11} h={1.25} p={[-3.0 + k, 1.85, 2.2]} m={wm} seg={10} />)}
          <Box s={[7.0, 0.1, 0.5]} p={[0, 1.25, 2.1]} m={wm} />
          <Box s={[7.0, 0.1, 0.5]} p={[0, 2.5, 2.1]} m={wm} />
          <Box s={[7.0, 0.3, 0.06]} p={[0, 1.45, 2.38]} m={wm} cast={false} />
          <Pediment p={[0, 2.55, 2.05]} w={4.2} h={0.8} d={0.4} m={blueD} />
          <Ball rad={0.17} p={[0, 2.78, 2.28]} sc={[1, 1, 0.3]} m={wm} />
          <Roof w={8.2} d={4.6} h={1.15} y={2.5} m={pink} sag={1.05} lift={0} fascia={false} />
          <Box s={[1.4, 0.45, 0.9]} p={[2.7, 3.45, -0.4]} m={blue} />
          <Roof w={1.8} d={1.3} h={0.45} y={3.65} m={pink} sag={1.05} lift={0} fascia={false} />
        </group>
        {/* the long stairway down the bank to the river */}
        <Steps p={[-8.6, 0, 3.4]} r={-Math.PI / 2} w={1.2} n={9} rise={0.28} run={0.5} m={wm} />
        {/* a shade tree growing out of the cliff */}
        <Canopy p={[-8.6, 0.8, -1.6]} s={1.05} n={5} c="#4f7f3c" c2="#62923f" />
        <Canopy p={[8.8, 0.6, 1.2]} s={0.85} n={4} c="#547f3a" c2="#68923f" r={2} />
        <Frame s={[19, 8.4, 12]} p={[0, 4.2, 1]} />
      </group>
    );
  }
  function RaniEnv() {
    const M = useM();
    return (
      <group>
        <Plain r={95} y={-0.06} c="#6e8f52" />
        <Patch p={[0, 0.004, 14]} w={90} d={16} c="#dcd3b8" />
        <Patch p={[-14, 0.005, 20]} w={36} d={9} c="#c9c0a4" />
        <Water w={100} d={24} p={[0, 0.03, 34]} color="#4f8f98" />
        <Patch p={[22, 0.006, 22]} w={22} d={7} c="#e2dbc4" />
        {/* the steep forested gorge behind and beside the palace */}
        <HillMound p={[-3, -0.3, -38]} sc={[48, 34, 26]} c="#477a3a" />
        <HillMound p={[-44, -0.3, -6]} sc={[24, 26, 34]} c="#3f7234" />
        <HillMound p={[44, -0.3, -14]} sc={[26, 22, 26]} c="#4b7d3d" />
        <HillMound p={[-8, -0.3, -58]} sc={[80, 46, 30]} c="#5f8870" />
        <HillMound p={[30, -0.3, -64]} sc={[60, 40, 26]} c="#6d907e" />
        {[[-12, -6], [-14, 3], [12, -9], [14, 2], [-19, -10], [20, -12], [-3, -12], [6, -12], [-24, 6], [24, 8]].map(([x, z], i) => <Canopy key={i} p={[x, 0, z]} s={1.5 + (i % 3) * 0.3} n={5} r={i} c="#3f7a36" c2="#4f8a3b" />)}
        {Array.from({ length: 14 }, (_, i) => <Canopy key={`u${i}`} p={[-30 + i * 4.6, 4 + (i % 3), -14 - (i % 4) * 2]} s={1.7} n={4} r={i} c="#3b7032" c2="#4b8038" />)}
      </group>
    );
  }

  /* Tansen Durbar: the long red three-storey Rana facade with white pilasters, green shutters and a pillared porch, around a courtyard */
  function TansenMain() {
    const M = useM();
    const red = M.mat('plaster', 6, 3, { color: '#b94a40' });
    const redD = M.plain('#8f2f2a', { roughness: 0.9 });
    const wm = M.plain('#f4efe6', { roughness: 0.85 });
    const green = M.plain('#2e7a52', { roughness: 0.7 });
    const roofM = M.plain('#c4574b', { roughness: 0.55, metalness: 0.15 });
    const arch = M.plain('#2b1f1c');
    const W = 16.4;
    const D = 12.6;
    const wd = 2.6;
    const FH = 1.05;
    const Hh = FH * 3;
    const gap = 1.75;
    const hz = D / 2;
    const hx = W / 2;
    const gW = [];
    const hoodW = [];
    const pil = [];
    const inW = [];
    const inR = [];
    const walls = [
      { cx: 0, cz: hz, along: 'x', nrm: 1, n: 9 },
      { cx: 0, cz: -hz, along: 'x', nrm: -1, n: 9 },
      { cx: hx, cz: 0, along: 'z', nrm: 1, n: 7 },
      { cx: -hx, cz: 0, along: 'z', nrm: -1, n: 7 },
    ];
    walls.forEach((w, wi) => {
      const g = wi < 2 ? gap : 1.72;
      gW.push(...wallBoxes({ ...w, gap: g, floors: 3, y0: FH * 0.55, fh: FH, sx: 0.5, sy: 0.66, sd: 0.05, off: 0.02, skip: (k, f) => wi === 0 && k === 4 && f < 2 }));
      hoodW.push(...wallBoxes({ ...w, gap: g, floors: 3, y0: FH * 0.55 + 0.42, fh: FH, sx: 0.7, sy: 0.1, sd: 0.1, off: 0.03, skip: (k, f) => wi === 0 && k === 4 && f < 2 }));
      pil.push(...wallBoxes({ ...w, n: w.n + 1, gap: g, floors: 1, y0: Hh / 2, fh: 1, sx: 0.26, sy: Hh, sd: 0.14, off: 0.07 }));
    });
    // courtyard faces (white walls with red-framed arched openings)
    [{ cx: 0, cz: hz - wd, along: 'x', nrm: -1, n: 8, g: 1.5 }, { cx: 0, cz: -hz + wd, along: 'x', nrm: 1, n: 8, g: 1.5 }, { cx: hx - wd, cz: 0, along: 'z', nrm: -1, n: 4, g: 1.5 }, { cx: -hx + wd, cz: 0, along: 'z', nrm: 1, n: 4, g: 1.5 }].forEach((w) => {
      inR.push(...wallBoxes({ ...w, gap: w.g, floors: 3, y0: FH * 0.55, fh: FH, sx: 0.62, sy: 0.8, sd: 0.05, off: 0.02 }));
      inW.push(...wallBoxes({ ...w, gap: w.g, floors: 3, y0: FH * 0.52, fh: FH, sx: 0.44, sy: 0.64, sd: 0.06, off: 0.035 }));
    });
    return (
      <group>
        <Box s={[W + 1.2, 0.18, D + 1.2]} p={[0, 0.09, 0]} m={M.stone} />
        <group position={[0, 0.18, 0]}>
          {/* the four ranges (red outside, white on the courtyard side) */}
          <Box s={[W, Hh, wd]} p={[0, Hh / 2, hz - wd / 2]} m={red} />
          <Box s={[W, Hh, wd]} p={[0, Hh / 2, -hz + wd / 2]} m={red} />
          <Box s={[wd, Hh, D - 2 * wd + 0.02]} p={[hx - wd / 2, Hh / 2, 0]} m={red} />
          <Box s={[wd, Hh, D - 2 * wd + 0.02]} p={[-hx + wd / 2, Hh / 2, 0]} m={red} />
          <Box s={[W - 2 * wd, 0.01, 0.03]} p={[0, 0, 0]} m={wm} cast={false} />
          {[[0, hz - wd - 0.01, W - 0.4, 0.02], [0, -hz + wd + 0.01, W - 0.4, 0.02]].map(([x, z, w, d], i) => <Box key={i} s={[w, Hh - 0.1, d]} p={[x, Hh / 2 + 0.02, z]} m={wm} cast={false} />)}
          {[[hx - wd - 0.01], [-hx + wd + 0.01]].map(([x], i) => <Box key={`i${i}`} s={[0.02, Hh - 0.1, D - 2 * wd]} p={[x, Hh / 2 + 0.02, 0]} m={wm} cast={false} />)}
          <Box s={[W - 2 * wd + 0.2, 0.2, D - 2 * wd + 0.2]} p={[0, 0.1, 0]} m={M.mat('herring', 5, 4, { color: '#f0c0a6' })} />
          {/* red plinth and white cornice bands */}
          {[[W + 0.08, 0.14, 0, hz], [W + 0.08, 0.14, 0, -hz]].map(([w, d, x, z], i) => <Box key={`pl${i}`} s={[w, 0.4, d]} p={[x, 0.2, z]} m={redD} cast={false} />)}
          {[hx, -hx].map((x, i) => <Box key={`ps${i}`} s={[0.14, 0.4, D + 0.08]} p={[x, 0.2, 0]} m={redD} cast={false} />)}
          {[FH, FH * 2, Hh].map((y) => (
            <group key={y}>
              {[hz, -hz].map((z) => <Box key={z} s={[W + 0.2, 0.1, 0.2]} p={[0, y, z]} m={wm} cast={false} />)}
              {[hx, -hx].map((x) => <Box key={x} s={[0.2, 0.1, D + 0.2]} p={[x, y, 0]} m={wm} cast={false} />)}
            </group>
          ))}
          <BoxBatch boxes={gW} m={green} />
          <BoxBatch boxes={hoodW} m={wm} />
          <BoxBatch boxes={pil} m={wm} />
          <BoxBatch boxes={inR} m={redD} />
          <BoxBatch boxes={inW} m={arch} />
          {/* corner blocks, one storey taller, with hipped roofs */}
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], i) => (
            <group key={i} position={[a * (hx - 1.1), 0, b * (hz - 1.1)]}>
              <Box s={[2.5, Hh + 1.0, 2.5]} p={[0, (Hh + 1.0) / 2, 0]} m={red} />
              <Box s={[2.64, 0.12, 2.64]} p={[0, Hh + 0.55, 0]} m={wm} />
              <Roof w={3.1} d={3.1} h={0.95} y={Hh + 0.95} m={roofM} sag={1.05} lift={0} fascia={false} />
              <Box s={[0.5, 0.6, 0.06]} p={[0, Hh + 0.2, b * 1.27]} m={green} cast={false} />
              <Box s={[0.06, 0.6, 0.5]} p={[a * 1.27, Hh + 0.2, 0]} m={green} cast={false} />
            </group>
          ))}
          <Roof w={W - 1.8} d={wd + 0.7} h={0.85} y={Hh} m={roofM} sag={1.05} lift={0} fascia={false} />
          {/* the central porch: red columns, balcony and name board over the entrance */}
          <group position={[0, 0, hz + 0.95]}>
            <Steps p={[0, 0, 1.2]} w={2.2} n={3} rise={0.1} run={0.34} m={M.stone} />
            {[-1, 1].map((k) => <Box key={k} s={[0.38, 2.0, 0.38]} p={[k * 0.95, 1.0, 0.1]} m={redD} />)}
            <Box s={[2.9, 0.22, 1.9]} p={[0, 2.1, -0.05]} m={wm} />
            <Box s={[2.9, 0.3, 0.08]} p={[0, 2.45, 0.9]} m={wm} />
            {Array.from({ length: 9 }, (_, k) => <Box key={k} s={[0.05, 0.4, 0.05]} p={[-1.3 + k * 0.325, 2.4, 0.9]} m={wm} cast={false} />)}
            <Box s={[1.5, 0.4, 0.05]} p={[0, 2.62, 0.78]} m={wm} />
            <Box s={[1.3, 0.12, 1.5]} p={[0, 2.98, -0.1]} m={green} />
            <Box s={[0.9, 1.5, 0.08]} p={[0, 0.8, -0.85]} m={green} />
          </group>
        </group>
        <Frame s={[19, 6.2, 16]} p={[0, 3, 0]} />
      </group>
    );
  }
  function TansenEnv() {
    const M = useM();
    return (
      <group>
        <Plain r={95} y={-0.06} c="#789a58" />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 4]} receiveShadow material={M.plain('#d9cfbd', { roughness: 1 })}><planeGeometry args={[40, 30]} /></mesh>
        <Patch p={[0, 0.006, 22]} w={6} d={30} c="#9c9588" />
        {/* the bazaar street with its houses in the hill town of Tansen */}
        {Array.from({ length: 6 }, (_, i) => <NewarHouse key={`r${i}`} p={[-22 + i * 3.2, 0, 21 + (i % 2) * 0.3]} w={2.6} d={2.2} storeys={2 + (i % 2)} plaster tint={['#efe0c6', '#e9d3c8', '#dfe6e2', '#f1e6d0'][i % 4]} detail={false} />)}
        {Array.from({ length: 6 }, (_, i) => <NewarHouse key={`q${i}`} p={[9 + i * 3.2, 0, 21 + (i % 2) * 0.3]} w={2.6} d={2.2} storeys={2 + ((i + 1) % 2)} plaster tint={['#efe0c6', '#e9d3c8', '#dfe6e2', '#f1e6d0'][(i + 2) % 4]} detail={false} />)}
        {Array.from({ length: 8 }, (_, i) => <NewarHouse key={`l${i}`} p={[-24, 0, -14 + i * 4]} r={Math.PI / 2} w={2.8} d={2.2} storeys={2 + (i % 2)} plaster tint={['#efe0c6', '#e9d3c8', '#dfe6e2'][i % 3]} detail={false} />)}
        {Array.from({ length: 7 }, (_, i) => <NewarHouse key={`m${i}`} p={[24, 0, -12 + i * 4.2]} r={-Math.PI / 2} w={2.8} d={2.2} storeys={2 + (i % 2)} plaster tint={['#e9d3c8', '#efe0c6', '#dfe6e2'][i % 3]} detail={false} />)}
        {/* wooded hills of Palpa */}
        <HillMound p={[0, -0.3, -34]} sc={[60, 20, 24]} c="#4f7f3f" />
        <HillMound p={[-42, -0.3, -10]} sc={[26, 16, 30]} c="#58863f" />
        <HillMound p={[44, -0.3, -14]} sc={[26, 18, 30]} c="#4b7b3b" />
        {ringOf(24, 30, (p, r, i) => <Canopy key={i} p={[p[0] * 1.0, 0, p[2] * 1.0]} s={1.3 + (i % 3) * 0.25} r={i} n={4} c={i % 2 ? '#4a7a36' : '#58853b'} />, (a) => a < Math.PI + 0.1 || a > Math.PI * 2 - 0.5)}
      </group>
    );
  }

  /* Swargadwari: the hilltop ashram of white and pink shrines with slate roofs behind dry-stone walls, palms and pines */
  function SwargMain() {
    const M = useM();
    const wm = whiteMat(M);
    const pink = M.plain('#e8a5b2', { roughness: 0.85 });
    const slate = M.mat('rock', 2, 2, { color: '#6f6a66' });
    const wall = M.mat('rock', 6, 1, { color: '#f0e6d0' });
    const iron = M.plain('#e9e6dc', { roughness: 0.6 });
    const dark = M.plain('#33302c');
    const pickets = Array.from({ length: 36 }, (_, k) => [0.05, 0.75, 0.05, -8.4 + k * 0.47, 0.375, 0]);
    return (
      <group>
        <Box s={[22, 0.25, 16]} p={[0, 0.125, 0]} m={M.plain('#cfc6b3', { roughness: 1 })} />
        <group position={[0, 0.25, 0]}>
          {/* the white main temple: two storeys, grey slate roofs and a gilded pinnacle */}
          <group position={[0, 0, -2.2]}>
            <Box s={[4.4, 0.45, 3.6]} p={[0, 0.22, 0]} m={M.stone} />
            <Box s={[3.8, 1.9, 3.0]} p={[0, 1.4, 0]} m={wm} />
            {[-1.2, 0, 1.2].map((x) => <Box key={x} s={[0.5, 0.7, 0.05]} p={[x, 1.55, 1.52]} m={dark} cast={false} />)}
            <Box s={[1.0, 1.2, 0.05]} p={[0, 0.95, 1.52]} m={M.plain('#6b3b24')} cast={false} />
            <Roof w={5.2} d={4.4} h={1.0} y={2.3} m={slate} sag={1.1} lift={0.05} />
            <Box s={[2.4, 1.1, 2.0]} p={[0, 3.1, 0]} m={wm} />
            {[-0.6, 0.6].map((x) => <Box key={x} s={[0.42, 0.5, 0.05]} p={[x, 3.15, 1.02]} m={dark} cast={false} />)}
            <Roof w={3.4} d={3.0} h={0.85} y={3.6} m={slate} sag={1.1} lift={0.05} />
            <Gajur y={4.4} s={0.9} />
          </group>
          {/* pink side shrines */}
          {[[-6.2, -1.2, 1], [-6.0, 2.4, 0.8], [6.4, -0.6, 0.9]].map(([x, z, s], i) => (
            <group key={i} position={[x, 0, z]} scale={s} rotation={[0, i === 2 ? -0.3 : 0.25, 0]}>
              <Box s={[2.2, 1.5, 2.2]} p={[0, 0.75, 0]} m={pink} />
              <Box s={[0.6, 0.9, 0.05]} p={[0, 0.5, 1.12]} m={dark} cast={false} />
              <Roof w={3.0} d={3.0} h={0.85} y={1.5} m={slate} sag={1.1} lift={0.05} />
              <Gajur y={2.3} s={0.5} />
            </group>
          ))}
          {/* the house with the red timber balcony */}
          <group position={[6.8, 0, 3.6]} rotation={[0, -0.5, 0]}>
            <Box s={[3.6, 2.2, 2.4]} p={[0, 1.1, 0]} m={wm} />
            <Box s={[3.0, 0.1, 0.9]} p={[0, 1.15, 1.6]} m={M.plain('#a8452d')} />
            <Box s={[3.0, 0.4, 0.05]} p={[0, 1.4, 2.03]} m={M.plain('#a8452d')} />
            {[-1.3, 1.3].map((x) => <Box key={x} s={[0.4, 0.6, 0.05]} p={[x, 1.6, 1.22]} m={M.plain('#a8452d')} cast={false} />)}
            <Roof w={4.4} d={3.4} h={0.9} y={2.2} m={M.mat('roof', 3, 3, { color: '#9a5a48' })} sag={1.1} lift={0.05} />
          </group>
          {/* white railing round the inner compound, red flags and the trident */}
          <BoxBatch boxes={pickets} m={iron} />
          <Box s={[17.2, 0.05, 0.05]} p={[0, 0.72, 0]} m={iron} cast={false} />
          <Box s={[17.2, 0.05, 0.05]} p={[0, 0.3, 0]} m={iron} cast={false} />
        </group>
        {/* dry-stone boundary walls with the gateway */}
        <Box s={[8.6, 0.95, 0.65]} p={[-6.8, 0.48, 7.2]} m={wall} />
        <Box s={[8.6, 0.95, 0.65]} p={[6.8, 0.48, 7.2]} m={wall} />
        <Box s={[0.65, 0.95, 14]} p={[-11, 0.48, 0.3]} m={wall} />
        <Box s={[0.65, 0.95, 14]} p={[11, 0.48, 0.3]} m={wall} />
        <Trident p={[2.4, 0.25, 1.6]} h={2.4} />
        <Pole p={[-2.6, 0.25, 1.8]} h={4.4} fl={0.9} />
        <Pole p={[3.9, 0.25, 0.4]} h={4.0} fl={0.8} />
        <Cow p={[-1.2, 0.25, 4.2]} r={0.7} />
        <Cow p={[0.6, 0.25, 5.2]} r={-0.4} c="#8a6a4a" />
        {[[-9.6, 4.6], [-9.2, -4.6], [9.2, -4.2]].map(([x, z], i) => <Palm key={i} p={[x, 0.25, z]} s={1.25 + i * 0.1} r={i} />)}
        <Frame s={[22, 6, 16]} p={[0, 3, 0]} />
      </group>
    );
  }
  function SwargEnv() {
    const M = useM();
    const cloud = <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -16, 0]}><circleGeometry args={[120, 48]} /><meshStandardMaterial color="#f1f2f6" transparent opacity={0.82} roughness={1} /></mesh>;
    return (
      <group>
        {/* the hill itself, terraced, with the valley and cloud far below */}
        <mesh position={[0, -8.1, 0]} material={M.plain('#8aa85a', { roughness: 1 })} receiveShadow><cylinderGeometry args={[18, 40, 16, 56]} /></mesh>
        <mesh position={[0, -3, 0]} material={M.plain('#9eb868', { roughness: 1 })}><cylinderGeometry args={[19.5, 24, 5, 48]} /></mesh>
        <mesh position={[0, -9, 0]} material={M.plain('#6f9a4c', { roughness: 1 })}><cylinderGeometry args={[27, 34, 4, 48]} /></mesh>
        <GroundDisc r={150} y={-17} m={M.plain('#6c8a56', { roughness: 1 })} />
        {cloud}
        {/* pines on the slopes */}
        {ringOf(28, 17, (p, r, i) => <Tree key={i} p={[p[0] * (1 + (i % 3) * 0.1), -((i % 3) * 0.9 + 0.3), p[2] * (1 + (i % 3) * 0.1)]} s={1.6 + (i % 4) * 0.35} kind={i % 4 ? 'pine' : 'broad'} />, (a) => Math.abs(a - Math.PI / 2) < 0.5)}
        {[[-15, 6, 2], [-16, 12, 1.4], [15, 10, 1.6]].map(([x, z, s], i) => <Palm key={`p${i}`} p={[x, -0.9, z]} s={s} r={i} />)}
        {/* the farther ridges and the snow range of the Himalaya on the horizon */}
        <HillMound p={[-40, -16, -46]} sc={[50, 26, 24]} c="#6a8a96" />
        <HillMound p={[26, -16, -58]} sc={[64, 32, 24]} c="#7b97a2" />
        <HillMound p={[-6, -16, -80]} sc={[90, 44, 24]} c="#9aaebc" />
        {[[-34, -100, 20, 34], [-8, -108, 26, 44], [22, -102, 22, 36], [46, -96, 18, 28]].map(([x, z, r, h], k) => (
          <group key={k} position={[x, -8, z]}>
            <mesh material={M.mat('rock', 4, 4, { color: '#8c8a92' })}><coneGeometry args={[r, h, 7]} /></mesh>
            <mesh position={[0, h * 0.3, 0]} material={M.plain('#f6f7fb', { roughness: 0.6 })}><coneGeometry args={[r * 0.45, h * 0.42, 7]} /></mesh>
          </group>
        ))}
      </group>
    );
  }

  /* Bageshwori Temple, Nepalgunj: a three-tier pagoda of pale metal roofs trimmed red over an orange-red pillared floor hung with bells; the Siddha Pokhari pond with its Mahadev shrine beside it */
  function BageshMain() {
    const M = useM();
    const silver = M.plain('#d4d8dd', { metalness: 0.55, roughness: 0.4 });
    const redT = M.plain('#c8102e', { roughness: 0.7 });
    const orange = M.plain('#d9531e', { roughness: 0.75 });
    const orange2 = M.plain('#e8721c', { roughness: 0.75 });
    const wm = M.plain('#f1ece0', { roughness: 0.85 });
    const bell = M.plain('#c9a23c', { metalness: 0.8, roughness: 0.35 });
    const trim = (w, d, y, k) => (
      <group key={k} position={[0, y, 0]}>
        <Box s={[w, 0.1, 0.08]} p={[0, 0, d / 2]} m={redT} cast={false} />
        <Box s={[w, 0.1, 0.08]} p={[0, 0, -d / 2]} m={redT} cast={false} />
        <Box s={[0.08, 0.1, d]} p={[w / 2, 0, 0]} m={redT} cast={false} />
        <Box s={[0.08, 0.1, d]} p={[-w / 2, 0, 0]} m={redT} cast={false} />
      </group>
    );
    const posts = [];
    for (let i = 0; i < 5; i += 1) {
      const t = -2.0 + i;
      posts.push([t, 2.1], [t, -2.1]);
      if (i > 0 && i < 4) posts.push([2.1, t], [-2.1, t]);
    }
    const bells = [];
    for (let i = 0; i < 6; i += 1) { const t = -1.8 + i * 0.72; bells.push([t, 2.1], [-t, -2.1], [2.1, t], [-2.1, -t]); }
    return (
      <group>
        <Box s={[7.2, 0.3, 7.2]} p={[0, 0.15, 0]} m={M.stone} />
        <Box s={[6.4, 0.3, 6.4]} p={[0, 0.45, 0]} m={M.stone} />
        <Steps p={[0, 0, 4.5]} w={2.6} n={2} rise={0.2} run={0.32} m={M.stone} />
        <group position={[0, 0.6, 0]}>
          {/* ground floor: an orange-red ring of pillars round the sanctum */}
          {posts.map(([x, z], i) => <Cyl key={i} rt={0.12} rb={0.14} h={1.7} p={[x, 0.85, z]} m={i % 2 ? orange : orange2} seg={10} />)}
          <Box s={[4.6, 0.2, 4.6]} p={[0, 1.8, 0]} m={redT} />
          <Box s={[3.2, 1.7, 3.2]} p={[0, 0.85, 0]} m={orange} />
          <Box s={[0.9, 1.3, 0.06]} p={[0, 0.65, 1.62]} m={M.plain('#4a2a16')} />
          {bells.map(([x, z], i) => (
            <group key={i} position={[x, 1.72, z]}>
              <mesh position={[0, -0.14, 0]} material={bell} castShadow><cylinderGeometry args={[0.03, 0.1, 0.2, 8]} /></mesh>
            </group>
          ))}
          {/* three silver roofs edged in red, with white walls between */}
          <Roof w={7.4} d={7.4} h={1.0} y={1.9} m={silver} sag={1.25} lift={0.12} fascia={false} />
          {trim(7.4, 7.4, 1.88, 't1')}
          <Box s={[3.5, 1.15, 3.5]} p={[0, 2.62, 0]} m={wm} />
          <Box s={[3.6, 0.14, 3.6]} p={[0, 2.5, 0]} m={redT} cast={false} />
          {[[0, 1.76, 0], [0, -1.76, Math.PI], [1.76, 0, Math.PI / 2], [-1.76, 0, -Math.PI / 2]].map(([x, z, r], i) => (
            <group key={i} position={[x, 2.65, z]} rotation={[0, r, 0]}>
              <Box s={[0.5, 0.5, 0.05]} m={orange2} cast={false} />
              <Box s={[0.9, 0.3, 0.05]} p={[1.05, 0, 0]} m={M.plain('#e9c46a')} cast={false} />
            </group>
          ))}
          <Roof w={5.6} d={5.6} h={0.85} y={3.15} m={silver} sag={1.25} lift={0.12} fascia={false} />
          {trim(5.6, 5.6, 3.13, 't2')}
          <Box s={[2.4, 1.0, 2.4]} p={[0, 3.7, 0]} m={wm} />
          <Box s={[2.5, 0.12, 2.5]} p={[0, 3.6, 0]} m={redT} cast={false} />
          <Roof w={3.8} d={3.8} h={0.75} y={4.15} m={silver} sag={1.25} lift={0.12} fascia={false} />
          {trim(3.8, 3.8, 4.13, 't3')}
          <Gajur y={4.78} s={0.9} />
          <Pole p={[0.3, 4.8, 0.2]} h={1.6} fl={0.7} />
          {/* the lion guardians at the steps, a trident and red flags */}
          {[-1, 1].map((k) => <group key={k} position={[k * 1.7, 0, 4.4]} scale={1.4}><Lion m={M.stone} /></group>)}
          <Trident p={[-3.9, 0, 3.6]} h={2.2} />
          <Pole p={[3.9, 0, 3.6]} h={2.6} fl={0.7} />
          <Pole p={[-3.9, 0, -3.6]} h={2.6} fl={0.7} />
        </group>
        {/* Siddha Pokhari with the causeway to the Mahadev shrine */}
        <group position={[11, 0, 0.6]}>
          <Box s={[12.8, 0.3, 0.45]} p={[0, 0.15, 4.5]} m={M.stone} />
          <Box s={[12.8, 0.3, 0.45]} p={[0, 0.15, -4.5]} m={M.stone} />
          <Box s={[0.45, 0.3, 9.4]} p={[6.2, 0.15, 0]} m={M.stone} />
          <Box s={[0.45, 0.3, 9.4]} p={[-6.2, 0.15, 0]} m={M.stone} />
          <Water w={12} d={8.6} p={[0, 0.07, 0]} color="#3f7a62" />
          <Box s={[5.6, 0.2, 1.5]} p={[-3.2, 0.2, 0]} m={M.plain('#d8cdb8', { roughness: 0.9 })} />
          {[-1, 1].map((k) => <Box key={k} s={[5.6, 0.5, 0.22]} p={[-3.2, 0.55, k * 0.8]} m={M.plain('#e9b92e', { roughness: 0.8 })} />)}
          {Array.from({ length: 6 }, (_, i) => [-1, 1].map((k) => <Box key={`${i}${k}`} s={[0.22, 0.7, 0.3]} p={[-5.8 + i * 1.05, 0.6, k * 0.8]} m={M.plain('#d9702a')} />))}
          <Box s={[2.6, 0.3, 2.6]} p={[0, 0.3, 0]} m={M.stone} />
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], i) => <Cyl key={i} rt={0.09} h={1.5} p={[a * 0.95, 1.05, b * 0.95]} m={M.plain('#e2808c')} seg={8} />)}
          <Box s={[2.3, 0.14, 2.3]} p={[0, 1.8, 0]} m={M.plain('#c8344a')} />
          <Roof w={3.1} d={3.1} h={0.6} y={1.86} m={M.mat('roof', 3, 3, { color: '#c4584a' })} sag={1.2} lift={0.1} />
          <Roof w={2.0} d={2.0} h={0.5} y={2.3} m={M.mat('roof', 3, 3, { color: '#c4584a' })} sag={1.2} lift={0.1} />
          <Gajur y={2.7} s={0.4} />
          <Lingam p={[0, 0.45, 0]} />
        </group>
        <Frame s={[26, 7, 16]} p={[5.5, 3.2, 0.5]} />
      </group>
    );
  }
  function BageshEnv() {
    const M = useM();
    return (
      <group>
        <Plain r={95} y={-0.06} c="#8fae62" />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2, 0.004, 3]} receiveShadow material={M.plain('#d6ccb8', { roughness: 1 })}><planeGeometry args={[46, 30]} /></mesh>
        {/* royal palms and trees round the pond and courtyard */}
        {[[5.5, 6.5], [9, 6.8], [13, 6.8], [17, 6.4], [18.4, 1], [18.4, -3], [17, -6], [13, -6.6], [9, -6.6], [5.2, -6.2]].map(([x, z], i) => <Palm key={i} p={[x, 0, z]} s={1.2 + (i % 3) * 0.12} r={i} />)}
        {[[-9, 5], [-9.5, -5], [-6, -9]].map(([x, z], i) => <Canopy key={`c${i}`} p={[x, 0, z]} s={1.4} n={5} r={i} />)}
        {/* the busy market of Nepalgunj around the compound */}
        {Array.from({ length: 12 }, (_, i) => <NewarHouse key={`b${i}`} p={[-24 + i * 4.6, 0, -16 + (i % 2) * 0.4]} w={3.2} d={2.4} storeys={2 + (i % 3 === 0 ? 1 : 0)} plaster tint={['#f0e1c9', '#e9d0c6', '#dde6e0', '#efdcb6'][i % 4]} detail={false} shop />)}
        {Array.from({ length: 7 }, (_, i) => <NewarHouse key={`s${i}`} p={[-24, 0, -10 + i * 5]} r={Math.PI / 2} w={3.2} d={2.4} storeys={2 + (i % 2)} plaster tint={['#e9d0c6', '#f0e1c9', '#dde6e0'][i % 3]} detail={false} />)}
        {Array.from({ length: 9 }, (_, i) => <NewarHouse key={`f${i}`} p={[-18 + i * 5, 0, 20]} r={Math.PI} w={3.2} d={2.4} storeys={2 + (i % 2)} plaster tint={['#efdcb6', '#e9d0c6', '#dde6e0'][i % 3]} detail={false} />)}
        {Array.from({ length: 6 }, (_, i) => <NewarHouse key={`e${i}`} p={[27, 0, -12 + i * 6]} r={-Math.PI / 2} w={3.2} d={2.4} storeys={2 + (i % 2)} plaster tint={['#f0e1c9', '#dde6e0'][i % 2]} detail={false} />)}
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
    'rishikesh-temple-ridi': { Main: RidiMain, Env: RidiEnv },
    'rani-mahal-palpa': { Main: RaniMain, Env: RaniEnv },
    'tansen-durbar': { Main: TansenMain, Env: TansenEnv },
    swargadwari: { Main: SwargMain, Env: SwargEnv },
    'bageshwori-temple-nepalgunj': { Main: BageshMain, Env: BageshEnv },
    // @@ENTRIES
  };
}
