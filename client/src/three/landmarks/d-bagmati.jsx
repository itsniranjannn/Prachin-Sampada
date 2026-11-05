// Hand-built landmarks for the Bagmati / valley-rim and hill sites. See the brief: export a function taking the kit K and returning { slug: { Main, Env } }.
import { useMemo } from 'react';

export default function make(K) {
  const {
    useM, Box, Cyl, Ball, Roof, Gajur, Lion, Elephant, Spire, Tree, Chaitya, Nandi, Lingam, Trident, PrayerFlags, LatticeWindow,
    EaveStruts, Doorway, NewarHouse, Diyo, Frame, Water, GroundDisc, ringOf, roofMat, THREE, TIMBER,
  } = K;

  /* ---------- shared helpers ---------- */
  const rnd = (i, k = 0) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
  // real Newar roofs are steep (about 25 degrees) over tall carved storeys: Pag lifts walls and roofs by these factors
  const HW = 1.28;
  const HR = 1.45;
  const pagTop = (tiers, y0 = 0) => tiers.reduce((y, t) => y + t.h * HW + (t.rh || 0.6) * HR * 0.6, y0) + 0.4 * (tiers[tiers.length - 1].rh || 0.6) * HR - 0.05;

  /** Flight of stone steps rising toward -z. p is the front edge of the lowest step. */
  function Stairs({ p = [0, 0, 0], w = 1.6, n = 6, rise = 0.17, run = 0.34, m }) {
    return (
      <group position={p}>
        {Array.from({ length: n }, (_, j) => (
          <Box key={j} s={[w, (j + 1) * rise, run]} p={[0, ((j + 1) * rise) / 2, -(j + 0.5) * run]} m={m} />
        ))}
      </group>
    );
  }

  /** Red cloth fringe hanging along the four edges of a pagoda roof. */
  function Fringe({ w, d, y, color = '#b3202a', h = 0.16 }) {
    const M = useM();
    const m = M.plain(color, { roughness: 1 });
    return (
      <group>
        <Box s={[w, h, 0.035]} p={[0, y, d / 2 + 0.02]} m={m} cast={false} />
        <Box s={[w, h, 0.035]} p={[0, y, -d / 2 - 0.02]} m={m} cast={false} />
        <Box s={[0.035, h, d]} p={[w / 2 + 0.02, y, 0]} m={m} cast={false} />
        <Box s={[0.035, h, d]} p={[-w / 2 - 0.02, y, 0]} m={m} cast={false} />
      </group>
    );
  }

  function Peacock({ p, s = 1, r = 0, m }) {
    return (
      <group position={p} scale={s} rotation={[0, r, 0]}>
        <Ball rad={0.09} sc={[1, 0.9, 1.5]} p={[0, 0.12, 0]} m={m} />
        <Cyl rt={0.02} h={0.18} p={[0, 0.24, 0.1]} r={[0.3, 0, 0]} m={m} seg={6} />
        <Ball rad={0.045} p={[0, 0.34, 0.14]} m={m} />
        <mesh position={[0, 0.2, -0.16]} rotation={[-1.2, 0, 0]} material={m}><coneGeometry args={[0.16, 0.34, 8]} /></mesh>
      </group>
    );
  }

  /**
   * A Newar pagoda built tier by tier. tiers = [{ w, d, h, o (eave overhang), rh (roof rise) }].
   * wall: material of the storeys, roof: roof material, open: pillared open ground floor with a central cella.
   */
  function Pag({
    tiers: tiers0, y0 = 0, roof, wall, fringe = null, open = false, door = true, goldDoor = false, win = true, strutN, bells = true,
    finial = 1, rail = false, peacock = false, timber, cellaM,
  }) {
    const M = useM();
    const wood = timber || M.plain(TIMBER, { roughness: 0.8 });
    const dk = M.plain('#2a1810');
    const out = [];
    let y = y0;
    const tiers = tiers0.map((t) => ({ ...t, h: t.h * HW, rh: (t.rh || 0.6) * HR }));
    tiers.forEach((t, i) => {
      const { w, d, h, o = 0.7, rh = 0.6 } = t;
      const rw = w + 2 * o;
      const rd = d + 2 * o;
      if (open && i === 0) {
        out.push(<Box key="cella" s={[w * 0.6, h, d * 0.6]} p={[0, y + h / 2, 0]} m={cellaM || wall} />);
        const n = Math.max(3, Math.round(w / 0.72));
        for (let k = 0; k <= n; k += 1) {
          const x = -w / 2 + 0.1 + (k * (w - 0.2)) / n;
          [1, -1].forEach((sz) => out.push(<Cyl key={`pf${k}${sz}`} rt={0.06} rb={0.075} h={h} p={[x, y + h / 2, sz * (d / 2 - 0.1)]} m={wood} seg={8} />));
          if (k > 0 && k < n) [1, -1].forEach((sx) => out.push(<Cyl key={`ps${k}${sx}`} rt={0.06} rb={0.075} h={h} p={[sx * (w / 2 - 0.1), y + h / 2, x]} m={wood} seg={8} />));
        }
        out.push(<Box key="beam" s={[w + 0.1, 0.12, d + 0.1]} p={[0, y + h - 0.05, 0]} m={wood} />);
        out.push(<Box key="plat" s={[w + 0.2, 0.08, d + 0.2]} p={[0, y + 0.04, 0]} m={M.stone} />);
      } else {
        out.push(<Box key={`w${i}`} s={[w, h, d]} p={[0, y + h / 2, 0]} m={wall} />);
        out.push(<Box key={`b${i}`} s={[w + 0.06, 0.08, d + 0.06]} p={[0, y + h - 0.04, 0]} m={dk} />);
      }
      if (i === 0 && door) out.push(<Doorway key="door" p={[0, y, (open ? d * 0.3 : d / 2) + 0.01]} w={Math.min(0.66, w * 0.24)} h={Math.min(1.0, h * 0.8)} gold={goldDoor} arch={goldDoor} />);
      if (i === 0 && win && !open) [-1, 1].forEach((k) => out.push(<LatticeWindow key={`cw${k}`} p={[k * w * 0.32, y + h * 0.55, d / 2 + 0.01]} w={0.38} h={0.42} />));
      if (i > 0 && win) {
        [[0, d / 2 + 0.01, 0], [w / 2 + 0.01, 0, Math.PI / 2], [0, -d / 2 - 0.01, Math.PI], [-w / 2 - 0.01, 0, -Math.PI / 2]].forEach(([x, z, ry], k) => out.push(
          <LatticeWindow key={`win${i}${k}`} p={[x, y + h * 0.5, z]} r={ry} w={Math.min(0.5, w * 0.3)} h={h * 0.6} bars={3} />,
        ));
      }
      if (rail && i > 0) {
        out.push(<Box key={`rl${i}`} s={[w + 0.3, 0.04, d + 0.3]} p={[0, y + 0.3, 0]} m={wood} cast={false} />);
        out.push(<Box key={`rt${i}`} s={[w + 0.3, 0.05, 0.04]} p={[0, y + 0.4, (d + 0.3) / 2]} m={wood} cast={false} />);
      }
      out.push(<EaveStruts key={`st${i}`} w={w} d={d} y={y + h + 0.02} n={strutN || Math.max(2, Math.round(w * 1.1))} h={Math.min(0.9, o * 0.85 + 0.1)} />);
      out.push(<Roof key={`r${i}`} w={rw} d={rd} h={rh} y={y + h - 0.05} m={roof} />);
      if (fringe) out.push(<Fringe key={`fr${i}`} w={rw} d={rd} y={y + h - 0.13} color={fringe} />);
      if (bells) {
        [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz], k) => out.push(
          <mesh key={`bell${i}${k}`} position={[(sx * rw) / 2 * 0.96, y + h - 0.16, (sz * rd) / 2 * 0.96]} material={M.gold}><coneGeometry args={[0.05, 0.14, 8]} /></mesh>,
        ));
      }
      if (peacock && i < 2) {
        [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz], k) => out.push(
          <Peacock key={`pk${i}${k}`} p={[(sx * rw) / 2 * 0.82, y + h + 0.02 + rh * 0.18, (sz * rd) / 2 * 0.82]} r={Math.atan2(sx, sz)} s={1.15 - i * 0.2} m={M.gold} />,
        ));
      }
      y += h + rh * 0.6;
    });
    if (finial) out.push(<Gajur key="gj" y={pagTop(tiers0, y0) - 0.02} s={finial} />);
    return <group>{out}</group>;
  }

  const Mountain = ({ p, r, h, rock, snow = '#f4f6fa', cap = 0.45, sn = true }) => {
    const M = useM();
    return (
      <group position={p}>
        <mesh position={[0, h / 2, 0]} material={rock} castShadow><coneGeometry args={[r, h, 7]} /></mesh>
        {sn && <mesh position={[0, h * (1 - cap / 2) + 0.02, 0]} material={M.plain(snow, { roughness: 0.6 })}><coneGeometry args={[r * cap * 1.02, h * cap, 7]} /></mesh>}
      </group>
    );
  };
  /** An arc of distant peaks behind the site (-z side). */
  function Range({ n = 9, R = 52, y = -1, hMin = 12, hMax = 24, rock = '#6f6e72', snow = true, a0 = 0.06, a1 = 0.94, cap = 0.45, seed = 1 }) {
    const M = useM();
    const rk = M.plain(rock, { roughness: 1, flatShading: true });
    return (
      <group>
        {Array.from({ length: n }, (_, i) => {
          const th = Math.PI * (a0 + ((a1 - a0) * i) / (n - 1));
          const h = hMin + rnd(i, seed) * (hMax - hMin);
          return <Mountain key={i} p={[Math.cos(th) * R * (1 + rnd(i, seed + 3) * 0.12), y, -Math.sin(th) * R * (1 + rnd(i, seed + 3) * 0.12)]} r={h * (snow ? 0.42 + rnd(i, seed + 5) * 0.25 : 1.1 + rnd(i, seed + 5) * 0.6)} h={snow ? h : h * 0.7} rock={rk} sn={snow} cap={cap} />;
        })}
      </group>
    );
  }
  /** Cheap forest tree: two stacked cones, no trunk. */
  const Fir = ({ p, s = 1, c = '#3d5a3a' }) => {
    const M = useM();
    const m = M.plain(c, { roughness: 1 });
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.08} rb={0.12} h={0.7} p={[0, 0.35, 0]} m={M.plain('#5a4030')} seg={6} />
        <mesh position={[0, 1.2, 0]} material={m} castShadow><coneGeometry args={[0.75, 1.6, 8]} /></mesh>
        <mesh position={[0, 2.0, 0]} material={m} castShadow><coneGeometry args={[0.55, 1.3, 8]} /></mesh>
      </group>
    );
  };
  /** Scatter n trees in an annulus, skipping a wedge in front of the site. */
  function Woods({ n = 40, r0 = 10, r1 = 24, c = '#3d5a3a', skip = null, y = () => 0, s0 = 1.1, broad = 0 }) {
    return (
      <group>
        {Array.from({ length: n }, (_, i) => {
          const a = rnd(i, 1) * Math.PI * 2;
          if (skip && skip(a)) return null;
          const r = r0 + rnd(i, 2) * (r1 - r0);
          const x = Math.cos(a) * r;
          const z = Math.sin(a) * r;
          const sc = s0 * (0.8 + rnd(i, 3) * 0.7);
          return i % 100 < broad ? <Tree key={i} p={[x, y(r), z]} s={sc * 0.9} kind="broad" /> : <Fir key={i} p={[x, y(r), z]} s={sc} c={rnd(i, 4) > 0.5 ? c : '#47683f'} />;
        })}
      </group>
    );
  }
  /** Boxy concrete / brick town houses scattered on a slope, stepping down with distance. */
  function Town({ n = 40, r0 = 12, r1 = 30, drop = 0.3, skip = null, colors = ['#e8d8c0', '#d9a08a', '#c9d6dc', '#e6c4cc', '#f0e6d0', '#c8b890'], hs = 1 }) {
    const M = useM();
    return (
      <group>
        {Array.from({ length: n }, (_, i) => {
          const a = rnd(i, 7) * Math.PI * 2;
          if (skip && skip(a)) return null;
          const r = r0 + rnd(i, 8) * (r1 - r0);
          const w = (1.5 + rnd(i, 9) * 1.2) * hs;
          const hh = (1.4 + Math.floor(rnd(i, 10) * 3) * 0.9) * hs;
          const y = -(r - r0) * drop;
          return (
            <group key={i} position={[Math.cos(a) * r, y, Math.sin(a) * r]} rotation={[0, -a + rnd(i, 11) * 0.4, 0]}>
              <Box s={[w, hh, w * 0.85]} p={[0, hh / 2, 0]} m={M.plain(colors[i % colors.length], { roughness: 0.9 })} />
              <Box s={[w + 0.12, 0.1, w * 0.85 + 0.12]} p={[0, hh + 0.05, 0]} m={M.plain(rnd(i, 12) > 0.5 ? '#9a8a80' : '#7a4a3a')} />
            </group>
          );
        })}
      </group>
    );
  }
  const slopeMound = (M, r0, drop = 0.3, span = 30, col = '#7f9a58') => (
    <mesh position={[0, -(drop * span) / 2 - 0.02, 0]} material={M.plain(col, { roughness: 1 })} receiveShadow>
      <cylinderGeometry args={[r0, r0 + span, drop * span, 56]} />
    </mesh>
  );
  const Pole = ({ p, h = 4 }) => {
    const M = useM();
    return (
      <group position={p}>
        <Cyl rt={0.07} rb={0.1} h={h} p={[0, h / 2, 0]} m={M.plain('#8a8780')} seg={8} />
        <Box s={[1, 0.06, 0.06]} p={[0, h - 0.2, 0]} m={M.dark} />
      </group>
    );
  };

  /** Two posts, a beam and a temple bell. */
  function BellFrame({ p, r = 0, s = 1, col = '#5a5a5a' }) {
    const M = useM();
    const m = M.plain(col, { roughness: 0.7 });
    return (
      <group position={p} rotation={[0, r, 0]} scale={s}>
        {[-0.6, 0.6].map((x) => <Box key={x} s={[0.18, 1.9, 0.18]} p={[x, 0.95, 0]} m={m} />)}
        <Box s={[1.5, 0.16, 0.22]} p={[0, 1.95, 0]} m={m} />
        <mesh position={[0, 1.4, 0]} material={M.plain('#7a6a3a', { metalness: 0.7, roughness: 0.4 })} castShadow><cylinderGeometry args={[0.1, 0.3, 0.6, 12]} /></mesh>
      </group>
    );
  }
  /** Square stone-rimmed pool with water. */
  function Pool({ p, w, d, color = '#4d6b4a', rim = 0.28 }) {
    const M = useM();
    return (
      <group position={p}>
        <Water w={w} d={d} p={[0, 0.02, 0]} color={color} />
        <Box s={[w + rim, 0.3, rim]} p={[0, 0.15, d / 2 + rim / 2]} m={M.stone} />
        <Box s={[w + rim, 0.3, rim]} p={[0, 0.15, -d / 2 - rim / 2]} m={M.stone} />
        <Box s={[rim, 0.3, d]} p={[w / 2 + rim / 2, 0.15, 0]} m={M.stone} />
        <Box s={[rim, 0.3, d]} p={[-w / 2 - rim / 2, 0.15, 0]} m={M.stone} />
      </group>
    );
  }
  /** Rounded green hill used as a backdrop. */
  const GreenHill = ({ p, r, h, col = '#5f8a4a', sx = 1, sz = 1 }) => {
    const M = useM();
    return (
      <mesh position={p} scale={[r * sx, h, r * sz]} material={M.plain(col, { roughness: 1 })} receiveShadow castShadow>
        <sphereGeometry args={[1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
    );
  };
  /** Sloping metal-sheet shed roof over a range of length len; local +z is the courtyard side. */
  function Shed({ p, r = 0, len, dep = 2, y = 1.8, m, tilt = 0.28 }) {
    return (
      <group position={p} rotation={[0, r, 0]}>
        <mesh position={[0, y, 0]} rotation={[-tilt, 0, 0]} material={m} castShadow><boxGeometry args={[len, 0.07, dep / Math.cos(tilt)]} /></mesh>
      </group>
    );
  }

  /* ====================================================================
     Uma Maheshwar, Kirtipur: three dark-roofed storeys on a four-stage brick plinth, open pillared ground floor
     ==================================================================== */
  function UmaMain() {
    const M = useM();
    const brick = M.mat('brick', 4, 0.5, { color: '#e8a98a' });
    const cella = M.mat('brick', 2, 1, { color: '#f2b497' });
    const wallDk = M.mat('brick', 2, 1, { color: '#c98a70' });
    const roofM = M.mat('roof', 3, 3, { color: '#8a6a58' });
    const lv = [8.6, 7.6, 6.6, 5.6];
    const tiers = [{ w: 3.6, d: 3.6, h: 1.4, o: 1.15, rh: 0.75 }, { w: 2.6, d: 2.6, h: 0.9, o: 0.95, rh: 0.62 }, { w: 1.8, d: 1.8, h: 0.75, o: 0.75, rh: 0.55 }];
    const ph = 0.32 * lv.length;
    const stone = M.stone;
    return (
      <group>
        {lv.map((w, k) => (
          <group key={k}>
            <Box s={[w, 0.32, w]} p={[0, 0.16 + k * 0.32, 0]} m={brick} />
            <Box s={[w + 0.06, 0.05, w + 0.06]} p={[0, (k + 1) * 0.32 - 0.02, 0]} m={stone} cast={false} />
          </group>
        ))}
        <Stairs p={[0, 0, 4.7]} w={1.9} n={8} rise={ph / 8} run={(4.7 - 2.8 - 0.1) / 8} m={stone} />
        <Pag tiers={tiers} y0={ph} roof={roofM} wall={wallDk} cellaM={cella} fringe="#8c2a2a" open rail strutN={5} door bells={false} finial={0.7} />
        {[-1, 1].map((k) => <group key={k} position={[k * 1.55, 0, 5.4]} rotation={[0, 0, 0]} scale={1.8}><Elephant m={stone} /></group>)}
        {/* Kwacho Dega: ornate stone lotus pillar at the top of Kirtipur */}
        <group position={[-5.6, 0, 3.2]}>
          <Box s={[0.9, 0.4, 0.9]} p={[0, 0.2, 0]} m={M.mat('granite', 1, 1, { color: '#7a4a3a' })} />
          <Cyl rt={0.28} rb={0.42} h={0.5} p={[0, 0.65, 0]} m={M.mat('granite', 1, 1, { color: '#8a5240' })} seg={14} />
          <Ball rad={0.42} sc={[1, 0.8, 1]} p={[0, 1.1, 0]} m={M.mat('granite', 1, 1, { color: '#8a5240' })} />
          <Cyl rt={0.18} rb={0.3} h={0.5} p={[0, 1.5, 0]} m={M.mat('granite', 1, 1, { color: '#8a5240' })} seg={12} />
        </group>
        <Frame s={[14, 7.2, 14]} p={[0, 3.6, 1.2]} />
      </group>
    );
  }
  function UmaEnv() {
    const M = useM();
    const sx = 18;
    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow material={M.mat('herring', 9, 9, { color: '#f0c0a6' })}><planeGeometry args={[sx, sx]} /></mesh>
        {slopeMound(M, 13, 0.45, 30, '#8aa466')}
        <GroundDisc r={90} y={-13.6} m={M.plain('#b0c188', { roughness: 1 })} />
        {/* parapet with brick posts and railing on the viewing edge */}
        {Array.from({ length: 10 }, (_, k) => <Box key={k} s={[0.4, 1, 0.4]} p={[-8.2 + k * 1.82, 0.5, 8.7]} m={M.mat('brick', 1, 1, { color: '#e09a80' })} />)}
        <Box s={[18, 0.06, 0.06]} p={[0, 0.9, 8.7]} m={M.plain('#4a4a4a')} />
        <Box s={[18, 0.06, 0.06]} p={[0, 0.5, 8.7]} m={M.plain('#4a4a4a')} />
        <Box s={[0.4, 1, 18]} p={[-9, 0.5, 0]} m={M.mat('brick', 4, 1, { color: '#e09a80' })} />
        <Box s={[0.4, 1, 18]} p={[9, 0.5, 0]} m={M.mat('brick', 4, 1, { color: '#e09a80' })} />
        <Box s={[18, 1, 0.4]} p={[0, 0.5, -9]} m={M.mat('brick', 4, 1, { color: '#e09a80' })} />
        {[[-7.6, -7.6], [7.4, -7.2]].map(([x, z], k) => <NewarHouse key={k} p={[x, 0, z]} r={k ? -0.4 : 0.4} w={2.2} d={1.8} storeys={2} detail={false} />)}
        <Town n={60} r0={15} r1={40} drop={0.45} skip={(a) => a > 0.05 && a < 1.6} />
        <Woods n={14} r0={15} r1={26} y={(r) => -(r - 13) * 0.45} s0={1.2} broad={100} />
        <Pole p={[-6.5, 0, 6.4]} h={4.2} />
        <Pole p={[7.8, 0, 3]} h={4.2} />
        <Range n={9} R={58} y={-5} hMin={11} hMax={22} rock="#7c7f90" />
      </group>
    );
  }

  /* ====================================================================
     Balkumari, Thimi: three roofs with the long silver-gilt pataka down the front, peacocks at the corners and on the pillar, a khat in the square
     ==================================================================== */
  /**
   * The pataka: a long strip of silver and gilded metal that hangs from the pinnacle, over every roof edge, down the front of a Newar pagoda.
   * It follows the same tier maths as Pag, so it lies on the roof surfaces.
   */
  /** A strip of silver edges and a gilded centre laid along a polyline of [z, y] points on the front centre line. */
  function BannerStrip({ pts, width = 0.66 }) {
    const M = useM();
    const silver = M.plain('#d4d7db', { metalness: 0.9, roughness: 0.3 });
    const brass = M.plain('#c49a3a', { metalness: 0.85, roughness: 0.32 });
    return (
      <group>
        {pts.slice(1).map((q, k) => {
          const p0 = pts[k];
          const dz = q[0] - p0[0];
          const dy = q[1] - p0[1];
          const len = Math.hypot(dz, dy);
          if (len < 0.01) return null;
          const a = -Math.atan2(dy, dz);
          const taper = k === pts.length - 2 ? 0.5 : 1;
          return (
            <group key={k} position={[0, (p0[1] + q[1]) / 2, (p0[0] + q[0]) / 2]} rotation={[a, 0, 0]}>
              <Box s={[width * 0.34, 0.03, len]} p={[0, 0, 0]} m={brass} cast={false} />
              {[-1, 1].map((sx) => <Box key={sx} s={[width * 0.3 * taper, 0.03, len]} p={[sx * width * 0.33, 0.002, 0]} m={silver} cast={false} />)}
            </group>
          );
        })}
      </group>
    );
  }
  function Pataka({ tiers: tiers0, y0 = 0, width = 0.66 }) {
    const pts = useMemo(() => {
      const tiers = tiers0.map((t) => ({ ...t, h: t.h * HW, rh: (t.rh || 0.6) * HR }));
      let y = y0;
      const rf = tiers.map((t) => {
        const o = { ...t, ye: y + t.h - 0.05, zf: t.d / 2 + (t.o ?? 0.7) };
        o.yAt = (z) => o.ye + t.rh * Math.max(0, 1 - z / o.zf) ** 1.5;
        y += t.h + t.rh * 0.6;
        return o;
      });
      const out = [];
      for (let i = rf.length - 1; i >= 0; i -= 1) {
        const t = rf[i];
        const z0 = i === rf.length - 1 ? 0 : rf[i + 1].zf;
        const n = 4;
        for (let k = 0; k <= n; k += 1) { const z = z0 + ((t.zf - z0) * k) / n; out.push([z + 0.05, t.yAt(z) + 0.05]); }
        if (i > 0) out.push([t.zf + 0.05, rf[i - 1].yAt(t.zf) + 0.06]);
      }
      const last = out[out.length - 1];
      out.push([last[0] + 0.02, last[1] - 0.9]);
      return out;
    }, [tiers0, y0]);
    return <BannerStrip pts={pts} width={width} />;
  }
  /** A khat: the carved wooden palanquin carried round the square at Sindoor Jatra, on two long poles. */
  function Khat({ p, r = 0, s = 1 }) {
    const M = useM();
    const wood = M.plain('#6a3a1c', { roughness: 0.85 });
    const red = M.plain('#a8262a', { roughness: 0.9 });
    return (
      <group position={p} rotation={[0, r, 0]} scale={s}>
        {[-0.35, 0.35].map((x) => <Cyl key={x} rt={0.04} h={2.6} p={[x, 0.55, 0]} r={[Math.PI / 2, 0, 0]} m={M.plain('#b09a68')} seg={6} />)}
        <Box s={[0.8, 0.55, 0.8]} p={[0, 0.85, 0]} m={wood} />
        <Box s={[0.9, 0.1, 0.9]} p={[0, 1.18, 0]} m={M.gold} />
        <mesh position={[0, 1.5, 0]} rotation={[0, Math.PI / 4, 0]} material={red} castShadow><coneGeometry args={[0.75, 0.55, 4]} /></mesh>
        <mesh position={[0, 1.88, 0]} material={M.gold}><coneGeometry args={[0.06, 0.3, 8]} /></mesh>
      </group>
    );
  }
  function BalkumariMain() {
    const M = useM();
    const wall = M.mat('brick', 2, 1, { color: '#8a5a48' });
    const roofM = M.mat('ochre', 6, 6, { color: '#9a8260', roughness: 1 });
    const brick = M.mat('brick', 3, 0.5, { color: '#d9a88e' });
    const tiers = [{ w: 3.2, d: 3.2, h: 1.3, o: 1.0, rh: 0.72 }, { w: 2.4, d: 2.4, h: 1.05, o: 0.82, rh: 0.6 }, { w: 1.7, d: 1.7, h: 0.9, o: 0.66, rh: 0.52 }];
    return (
      <group>
        <Box s={[5.8, 0.3, 5.8]} p={[0, 0.15, 0]} m={brick} />
        <Box s={[4.8, 0.25, 4.8]} p={[0, 0.42, 0]} m={brick} />
        <Stairs p={[0, 0, 3.5]} w={1.5} n={4} rise={0.1375} run={0.18} m={M.stone} />
        <Pag tiers={tiers} y0={0.55} roof={roofM} wall={wall} fringe="#6a2a24" goldDoor peacock strutN={5} finial={0.9} />
        {/* the great pataka from the pinnacle down over the roofs */}
        <Pataka tiers={tiers} y0={0.55} width={0.7} />
        {/* the carved gilded toranas over the door, and the oil lamps lit on the steps */}
        {Array.from({ length: 9 }, (_, k) => <Diyo key={k} p={[-0.7 + k * 0.175, 0.3, 2.4]} />)}
        {/* the peacock on its stone pillar */}
        <group position={[2.4, 0, 4.7]}>
          <Box s={[0.5, 0.3, 0.5]} p={[0, 0.15, 0]} m={M.stone} />
          <Cyl rt={0.14} rb={0.18} h={2.8} p={[0, 1.7, 0]} m={M.mat('granite', 1, 3, { color: '#8a8478' })} seg={10} />
          <Box s={[0.4, 0.14, 0.4]} p={[0, 3.12, 0]} m={M.stone} />
          <Peacock p={[0, 3.2, 0]} s={2.2} m={M.gold} />
        </group>
        {/* Bhairav's small shrine in the compound */}
        <group position={[-4.8, 0, 1.4]} scale={0.6}>
          <Box s={[3.2, 0.3, 3.2]} p={[0, 0.15, 0]} m={brick} />
          <Pag tiers={[{ w: 2.0, d: 2.0, h: 1.0, o: 0.7, rh: 0.5 }]} y0={0.3} roof={roofM} wall={wall} fringe="#6a2a24" door finial={0.9} />
        </group>
        {[[3.8, 3.4], [-3.8, 4.2]].map(([x, z], k) => <Chaitya key={k} p={[x, 0, z]} s={0.8} />)}
        <Khat p={[-2.6, 0, 6.8]} r={0.5} />
        <Frame s={[12, 7.6, 12]} p={[0, 3.8, 1.2]} />
      </group>
    );
  }
  function BalkumariEnv() {
    const M = useM();
    const tints = ['#c9795f', '#d9946a', '#bf6a52', '#d9a07a', '#c4846a', '#b8765c'];
    const plaster = ['#e8dcc8', '#d8c6a8', '#e2cdb8'];
    return (
      <group>
        <GroundDisc r={25} m={M.plain('#cdb59c', { roughness: 0.95 })} />
        <GroundDisc r={90} y={-0.04} m={M.plain('#b8c890', { roughness: 1 })} />
        {ringOf(26, 21, (p, r, i) => <NewarHouse key={i} p={p} r={r} w={2.2 + (i % 4) * 0.35} d={1.9 + (i % 3) * 0.2} storeys={3 + (i % 3)} tint={i % 5 === 3 ? plaster[i % 3] : tints[i % tints.length]} plaster={i % 5 === 3} detail={i % 2 === 0} shop={i % 3 === 0} />, (a) => Math.abs(a - Math.PI / 2) < 0.28)}
        {ringOf(14, 27, (p, r, i) => <NewarHouse key={`o${i}`} p={p} r={r} w={2.6} d={2.2} storeys={4 + (i % 2)} tint={tints[(i + 2) % tints.length]} detail={false} shop={false} />)}
        {[[7, 6.4], [-8.4, 7.2]].map(([x, z], k) => <group key={k} position={[x, 0, z]}><Cyl rt={0.07} rb={0.1} h={4} p={[0, 2, 0]} m={M.plain('#8a8780')} seg={8} /></group>)}
      </group>
    );
  }

  /* ====================================================================
     Bhairabi, Nuwakot: squat two-roofed pagoda, broad dark eaves fringed in red, lions at the low wall
     ==================================================================== */
  function BhairabiMain() {
    const M = useM();
    const wall = M.mat('brick', 2, 1, { color: '#9a5a44' });
    const lower = M.mat('roof', 4, 4, { color: '#b48a60' });
    const upper = M.plain('#b89048', { metalness: 0.7, roughness: 0.4 });
    const brick = M.mat('brick', 3, 0.5, { color: '#e8a58a' });
    return (
      <group>
        <Box s={[7, 0.3, 7]} p={[0, 0.15, 0]} m={brick} />
        <Pag tiers={[{ w: 3.0, d: 3.0, h: 1.1, o: 1.35, rh: 0.8 }]} y0={0.3} roof={lower} wall={wall} fringe="#b32a22" strutN={5} finial={0} bells />
        <Pag tiers={[{ w: 1.9, d: 1.9, h: 0.95, o: 0.85, rh: 0.6 }]} y0={0.3 + 1.1 * HW + 0.48 * HR} roof={upper} wall={wall} fringe="#b32a22" strutN={3} finial={0.8} door={false} bells={false} />
        {/* low enclosing wall and the lions flanking the gate */}
        <Box s={[10.4, 0.8, 0.4]} p={[0, 0.4, 5.2]} m={brick} />
        <Box s={[10.4, 0.8, 0.4]} p={[0, 0.4, -5.2]} m={brick} />
        <Box s={[0.4, 0.8, 10.4]} p={[5.2, 0.4, 0]} m={brick} />
        <Box s={[0.4, 0.8, 10.4]} p={[-5.2, 0.4, 0]} m={brick} />
        {[-1, 1].map((k) => <group key={k} position={[k * 1.3, 0, 5.6]} scale={2.2}><Lion m={M.plain('#c9a227', { metalness: 0.8, roughness: 0.35 })} /></group>)}
        <Box s={[1.8, 0.3, 0.6]} p={[0, 0.15, 5.9]} m={M.stone} />
        <Chaitya p={[-2.6, 0.3, 2.9]} s={0.9} />
        {[[-1, 1], [1, 1]].map(([sx, sz], k) => <PrayerFlags key={k} from={[sx * 2.6, 2.7, sz * 2.6]} to={[sx * 5.2, 0.9, sz * 5.2]} n={14} />)}
        <Frame s={[12, 5.6, 12]} p={[0, 2.8, 1]} />
      </group>
    );
  }
  function BhairabiEnv() {
    const M = useM();
    const cream = M.plain('#f1e4c8', { roughness: 0.85 });
    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow material={M.mat('herring', 9, 9, { color: '#e9b49c' })}><planeGeometry args={[22, 22]} /></mesh>
        {slopeMound(M, 12.5, 0.34, 26, '#86a05e')}
        <GroundDisc r={90} y={-9} m={M.plain('#a8b880', { roughness: 1 })} />
        {/* the cream neoclassical Ranga Mahal beside the temple */}
        <group position={[9.4, 0, -1.5]} rotation={[0, -Math.PI / 2, 0]}>
          <Box s={[6, 2.8, 3]} p={[0, 1.4, 0]} m={cream} />
          <Box s={[2.6, 0.9, 0.3]} p={[0, 3.2, 1.45]} m={cream} />
          <mesh position={[0, 3.9, 1.45]} rotation={[0, 0, Math.PI / 4]} material={cream}><boxGeometry args={[0.7, 0.7, 0.3]} /></mesh>
          {[-2, -0.7, 0.7, 2].map((x) => <Box key={x} s={[0.45, 0.9, 0.05]} p={[x, 1.6, 1.52]} m={M.plain('#6a5a48')} />)}
          <Roof w={6.6} d={3.6} h={0.8} y={2.8} m={roofMat(M, 'clay-tile')} sag={1.15} />
        </group>
        {/* brick mahal wings */}
        <group position={[-9.4, 0, -2]} rotation={[0, Math.PI / 2, 0]}>
          <Box s={[6, 2.6, 2.4]} p={[0, 1.3, 0]} m={M.mat('brick', 4, 2, { color: '#e09a80' })} />
          <Roof w={6.6} d={3} h={0.8} y={2.6} m={roofMat(M, 'clay-tile')} sag={1.15} />
        </group>
        <Town n={36} r0={13} r1={30} drop={0.34} skip={(a) => a > 0.05 && a < 1.6} colors={['#c9a890', '#e0c8a8', '#a8603f', '#d8d0c0']} />
        <Woods n={14} r0={13} r1={22} y={(r) => -(r - 12.5) * 0.34} s0={1.2} broad={50} />
        <Range n={9} R={56} y={-6} hMin={10} hMax={20} rock="#6e7a88" />
        <Range n={6} R={72} y={-6} hMin={22} hMax={30} rock="#7a7e88" a0={0.2} a1={0.8} seed={9} />
      </group>
    );
  }

  /* ====================================================================
     Bajrayogini, Sankhu: three gilded roofs in a pine-clad hillside courtyard above a long stone stairway
     ==================================================================== */
  function BajraMain() {
    const M = useM();
    const wall = M.mat('brick', 2, 1, { color: '#a85a42' });
    const gold = M.gold;
    const brick = M.mat('brick', 3, 0.5, { color: '#e8a58a' });
    const tiers = [{ w: 3.0, d: 3.0, h: 1.15, o: 0.8, rh: 0.62 }, { w: 2.3, d: 2.3, h: 0.85, o: 0.72, rh: 0.55 }, { w: 1.6, d: 1.6, h: 0.7, o: 0.6, rh: 0.5 }];
    const white = M.plain('#f4eee2', { roughness: 0.7 });
    const redM = M.plain('#b3342a', { roughness: 0.8 });
    return (
      <group>
        <Box s={[6.2, 0.3, 6.2]} p={[0, 0.15, 0]} m={brick} />
        <Stairs p={[0, 0, 4.4]} w={1.8} n={3} rise={0.1} run={0.4} m={M.stone} />
        <Pag tiers={tiers} y0={0.3} roof={gold} wall={wall} goldDoor strutN={4} finial={1} />
        {/* gilded torana above the door */}
        <mesh position={[0, 1.65, 1.62]} material={gold}><torusGeometry args={[0.62, 0.06, 8, 24, Math.PI]} /></mesh>
        {/* painted stone lions, white with red manes */}
        {[-1, 1].map((k) => (
          <group key={k} position={[k * 1.35, 0.3, 4.9]} scale={2.1}>
            <Lion m={white} />
            <Ball rad={0.1} p={[0, 0.4, 0.16]} m={redM} sc={[1.2, 0.8, 0.8]} />
          </group>
        ))}
        {/* stone bell frame */}
        <group position={[-3.4, 0, 3.6]}>
          {[-0.6, 0.6].map((x) => <Box key={x} s={[0.2, 1.9, 0.2]} p={[x, 0.95, 0]} m={M.plain('#5a5a5a')} />)}
          <Box s={[1.5, 0.18, 0.24]} p={[0, 1.95, 0]} m={M.plain('#5a5a5a')} />
          <mesh position={[0, 1.4, 0]} material={M.plain('#6b5a3a', { metalness: 0.7, roughness: 0.4 })} castShadow><cylinderGeometry args={[0.1, 0.3, 0.6, 12]} /></mesh>
        </group>
        <group position={[-3.4, 0, -1.2]} scale={0.7}>
          <Box s={[2.6, 0.2, 2.6]} p={[0, 0.1, 0]} m={brick} />
          <Pag tiers={[{ w: 1.8, d: 1.8, h: 0.9, o: 0.6, rh: 0.5 }, { w: 1.3, d: 1.3, h: 0.7, o: 0.5, rh: 0.45 }]} y0={0.2} roof={M.mat('roof', 3, 3, { color: '#8a5e4c' })} wall={wall} finial={0.8} />
        </group>
        {/* water spout (hiti) at the foot of the wall */}
        <group position={[3.6, 0, 2.4]}>
          <Box s={[1.4, 0.4, 0.6]} p={[0, 0.2, 0]} m={M.stone} />
          <Box s={[0.14, 0.14, 0.24]} p={[0, 0.5, 0.2]} m={M.gold} />
          <Water w={1.1} d={0.5} p={[0, 0.41, 0.0]} color="#5b7f80" />
        </group>
        {[[4.2, 0.3, 4], [-4.2, 0.3, 4.6]].map((q, k) => <Chaitya key={k} p={q} s={0.7} />)}
        <PrayerFlags from={[-4.8, 4.6, -3]} to={[4.8, 4.2, 2]} n={26} />
        <PrayerFlags from={[-4, 4.4, 4]} to={[4.4, 3.6, -3.2]} n={26} />
        <Frame s={[12, 6.2, 12]} p={[0, 3.1, 1]} />
      </group>
    );
  }
  function BajraEnv() {
    const M = useM();
    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow material={M.mat('herring', 8, 8, { color: '#efc0a8' })}><planeGeometry args={[13, 13]} /></mesh>
        {/* the pine-clad hilltop, falling away down the long stairway to the front */}
        <mesh position={[0, -7.02, 0]} material={M.plain('#6f8f55', { roughness: 1 })} receiveShadow><cylinderGeometry args={[9, 30, 14, 56]} /></mesh>
        <GroundDisc r={95} y={-14} m={M.plain('#7f9a5a', { roughness: 1 })} />
        {Array.from({ length: 50 }, (_, k) => <Box key={k} s={[2.2, 0.3, 0.45]} p={[0, -k * 0.2 + 0.1, 6.8 + k * 0.4]} m={M.stone} />)}
        {Array.from({ length: 70 }, (_, i) => {
          const a = rnd(i, 1) * Math.PI * 2;
          if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a)) - Math.PI / 2) < 0.22) return null;
          const r = 8 + rnd(i, 2) * 18;
          if (r < 17 && a > 0.1 && a < 1.5) return null;
          const y = r < 9 ? 0 : -((r - 9) / 21) * 14;
          return <Fir key={i} p={[Math.cos(a) * r, y, Math.sin(a) * r]} s={1.4 + rnd(i, 3) * 0.9} c={rnd(i, 4) > 0.5 ? '#2f5a3a' : '#3f6a3c'} />;
        })}
        {/* brick lodgings round the courtyard */}
        {[[-6.4, -2, Math.PI / 2], [6.4, -3, -Math.PI / 2], [0, -6.4, 0]].map(([x, z, r], k) => (
          <group key={k} position={[x, 0, z]} rotation={[0, r, 0]}>
            <Box s={[k === 2 ? 8 : 5.4, 2.0, 1.4]} p={[0, 1, 0]} m={M.mat('brick', 4, 2, { color: '#e09a80' })} />
            <Roof w={k === 2 ? 8.6 : 6} d={2.2} h={0.7} y={2} m={roofMat(M, 'clay-tile')} sag={1.15} />
          </group>
        ))}
        <Range n={8} R={52} y={-8} hMin={20} hMax={34} rock="#5a7a52" snow={false} />
      </group>
    );
  }

  /* ====================================================================
     Akash Bhairab, Indra Chowk: a broad dark-timber building with a big tiled roof, brass-fronted shop floor and gilded lions
     ==================================================================== */
  function AkashMain() {
    const M = useM();
    const dark = M.mat('wood', 3, 1, { color: '#4a362c' });
    const wood = M.plain('#3a281e', { roughness: 0.85 });
    const brass = M.plain('#b08d57', { metalness: 0.7, roughness: 0.35 });
    const silver = M.plain('#cfd3d8', { metalness: 0.85, roughness: 0.3 });
    const roofM = M.mat('ochre', 7, 7, { color: '#8a6a50', roughness: 1 });
    const brick = M.mat('brick', 4, 1.5, { color: '#c98068' });
    const tin = M.plain('#8a97a3', { metalness: 0.4, roughness: 0.55 });
    const goldM = M.gold;
    const W = 9;
    const D = 5.6;
    const zf = (D - 0.5) / 2;
    // waypoints of the long gilded banner: down the upper roof, over its eave, down the great roof, and off its eave
    const banner = useMemo(() => {
      const low = { y: 3.35, h: 1.15, hd: (D + 2.0) / 2 };
      const up = { y: 4.82, h: 0.75, hd: 2.0 };
      const yAt = (r, z) => r.y + r.h * Math.max(0, 1 - z / r.hd) ** 1.25;
      const pts = [];
      for (let k = 0; k <= 4; k += 1) { const z = (up.hd * k) / 4; pts.push([z + 0.05, yAt(up, z) + 0.05]); }
      pts.push([up.hd + 0.05, yAt(low, up.hd) + 0.06]);
      for (let k = 1; k <= 5; k += 1) { const z = up.hd + ((low.hd - up.hd) * k) / 5; pts.push([z + 0.05, yAt(low, z) + 0.05]); }
      pts.push([low.hd + 0.07, 2.55]);
      return pts;
    }, []);
    return (
      <group>
        {/* ground floor: shops under a tin lean-to awning, brass doorway in the centre, two gilded lions on the step */}
        <Box s={[W, 1.2, D]} p={[0, 0.6, 0]} m={brick} />
        {[-3.6, -2.4, -1.2, 1.2, 2.4, 3.6].map((x) => <Box key={x} s={[0.95, 0.9, 0.06]} p={[x, 0.55, D / 2 + 0.02]} m={M.dark} />)}
        {[-4.2, -3.0, -1.8, -0.6, 0.6, 1.8, 3.0, 4.2].map((x) => <Box key={`s${x}`} s={[0.1, 1.1, 0.1]} p={[x, 0.55, D / 2 + 0.04]} m={wood} cast={false} />)}
        <Doorway p={[0, 0, D / 2 + 0.04]} w={1.05} h={1.0} gold arch />
        <Shed p={[0, 0, D / 2 + 0.05]} r={0} len={W + 0.5} dep={1.3} y={1.3} m={tin} tilt={-0.3} />
        {[-1.4, 1.4].map((x) => <group key={x} position={[x, 0.15, D / 2 + 0.9]} scale={1.3}><Lion m={goldM} /></group>)}
        {/* first floor: the long carved dark-timber front with a deep balcony, a wooden balustrade and gilded animals */}
        <Box s={[W - 0.3, 1.25, D - 0.5]} p={[0, 1.825, 0]} m={dark} />
        <Box s={[W + 0.1, 0.12, 1.0]} p={[0, 1.22, zf + 0.4]} m={wood} />
        <Box s={[W + 0.1, 0.07, 0.07]} p={[0, 1.78, zf + 0.85]} m={wood} cast={false} />
        {Array.from({ length: 28 }, (_, k) => <Cyl key={k} rt={0.025} h={0.5} p={[-4.3 + k * 0.3185, 1.53, zf + 0.85]} m={wood} seg={5} />)}
        {[-4.0, -2.7, -1.4, 1.4, 2.7, 4.0].map((x) => <LatticeWindow key={x} p={[x, 1.95, zf + 0.01]} w={0.85} h={0.75} bars={5} />)}
        {[-4.0, -2.7, -1.4, 1.4, 2.7, 4.0].map((x) => <Box key={`b${x}`} s={[1.0, 0.07, 0.1]} p={[x, 2.4, zf + 0.04]} m={goldM} cast={false} />)}
        {/* the silver-fronted shrine with its gilded torana at the centre */}
        <Box s={[1.5, 1.0, 0.12]} p={[0, 1.95, zf + 0.04]} m={silver} />
        <mesh position={[0, 2.35, zf + 0.12]} material={goldM}><torusGeometry args={[0.72, 0.08, 8, 24, Math.PI]} /></mesh>
        <Box s={[0.14, 0.45, 0.1]} p={[-0.72, 2.12, zf + 0.12]} m={goldM} />
        <Box s={[0.14, 0.45, 0.1]} p={[0.72, 2.12, zf + 0.12]} m={goldM} />
        {[-3.9, -2.65, -1.55, 1.55, 2.65, 3.9].map((x, k) => <group key={x} position={[x, 1.28, zf + 0.5]} scale={0.8} rotation={[0, (k % 2) * 0.12 - 0.06, 0]}><Lion m={goldM} /></group>)}
        <Box s={[W + 0.2, 0.18, D]} p={[0, 2.5, 0]} m={M.dark} />
        {/* second storey, with the red-fringed great hipped roof of weathered tile */}
        <Box s={[W - 1.0, 0.85, D - 1.2]} p={[0, 3.0, 0]} m={dark} />
        {Array.from({ length: 5 }, (_, k) => <LatticeWindow key={k} p={[-3.0 + k * 1.5, 3.02, (D - 1.2) / 2 + 0.01]} w={0.75} h={0.55} bars={5} />)}
        <EaveStruts w={W - 1.0} d={D - 1.2} y={3.42} n={11} h={0.62} />
        <Roof w={W + 2.2} d={D + 2.0} h={1.15} y={3.35} m={roofM} sag={1.25} lift={0.1} />
        <Fringe w={W + 2.2} d={D + 2.0} y={3.22} color="#b02a2e" h={0.24} />
        <Fringe w={W + 2.2} d={D + 2.0} y={3.4} color="#d9a82e" h={0.05} />
        <Box s={[3.6, 0.55, 2.4]} p={[0, 4.6, 0]} m={dark} />
        <Roof w={5.4} d={4.0} h={0.75} y={4.82} m={roofM} sag={1.25} lift={0.1} />
        <Fringe w={5.4} d={4.0} y={4.72} color="#b02a2e" h={0.18} />
        <Gajur y={5.5} s={0.7} />
        <BannerStrip pts={banner} width={0.5} />
        <Frame s={[14, 6.2, 10.4]} p={[0, 3.1, 1.2]} />
      </group>
    );
  }
  function AkashEnv() {
    const M = useM();
    const cols = ['#d9a08a', '#c9d6dc', '#e8d8c0', '#b8c4d8', '#e6c4cc', '#d8cfa0'];
    return (
      <group>
        <GroundDisc r={30} m={M.plain('#d9d0c0', { roughness: 0.95 })} />
        <GroundDisc r={90} y={-0.04} m={M.plain('#b0aaa0', { roughness: 0.95 })} />
        {/* the asphalt of Indra Chowk, crossing in front of the temple, with a white lane line */}
        <Box s={[60, 0.04, 5.2]} p={[0, 0.01, 11]} m={M.plain('#4a4a4e', { roughness: 0.95 })} cast={false} />
        <Box s={[60, 0.045, 0.1]} p={[0, 0.02, 11]} m={M.plain('#e8e4d8')} cast={false} />
        <Box s={[5.2, 0.04, 30]} p={[11, 0.01, 12]} m={M.plain('#4a4a4e', { roughness: 0.95 })} cast={false} />
        {/* the shops that ring the chowk: tall pastel concrete fronts with balconies, shop signs, rooftop tanks, and a few old brick houses */}
        {ringOf(26, 20, (p, r, i) => {
          const h = 4 + (i % 4) * 1.4;
          if (i % 5 === 2 && i > 14) return <NewarHouse key={i} p={p} r={r + Math.PI} w={3.2} d={2.6} storeys={4 + (i % 2)} tint="#c9795f" detail shop />;
          return (
            <group key={i} position={p} rotation={[0, r, 0]}>
              <Box s={[3.4, h, 3]} p={[0, h / 2, 0]} m={M.plain(cols[i % cols.length], { roughness: 0.9 })} />
              {Array.from({ length: Math.floor(h / 1.3) }, (_, s) => (
                <group key={s}>
                  {[-1, 0, 1].map((x) => <Box key={x} s={[0.6, 0.6, 0.05]} p={[x * 1, 1.2 + s * 1.2, -1.52]} m={M.plain('#6a7a8a')} />)}
                  <Box s={[3.4, 0.06, 0.4]} p={[0, 0.9 + s * 1.2, -1.7]} m={M.plain('#8a8580')} cast={false} />
                </group>
              ))}
              <Box s={[3.2, 0.5, 0.12]} p={[0, 1.1, -1.55]} m={M.plain(['#c0392b', '#2b4c8c', '#f2f2f2', '#d9a824'][i % 4])} />
              <Cyl rt={0.4} h={0.8} p={[0.8, h + 0.4, 0]} m={M.plain('#2a4a6a')} seg={10} />
            </group>
          );
        }, (a) => (a > 0.3 && a < 1.6) || Math.abs(a) < 0.15)}
        {ringOf(12, 27, (p, r, i) => <Box key={`b${i}`} s={[4, 8 + (i % 3) * 2, 3.4]} p={[p[0], 4 + (i % 3), p[2]]} r={[0, r, 0]} m={M.plain(cols[(i + 2) % cols.length], { roughness: 0.9 })} />, (a) => a > 0.2 && a < 1.7)}
        {[[6.6, 7.4], [-6.8, 7], [10, 3]].map(([x, z], k) => <Pole key={k} p={[x, 0, z]} h={5.2} />)}
        {[[6.6, 7.4, -6.8, 7], [-6.8, 7, 10, 3]].map(([a, b, c, d], k) => <Box key={k} s={[Math.hypot(c - a, d - b), 0.02, 0.02]} p={[(a + c) / 2, 5, (b + d) / 2]} r={[0, -Math.atan2(d - b, c - a), 0]} m={M.dark} cast={false} />)}
        <Range n={7} R={60} y={-1} hMin={10} hMax={18} rock="#7a8088" snow={false} />
      </group>
    );
  }

  /* ====================================================================
     Indreshwar Mahadev, Panauti: the great three-roofed brick pagoda, with the smaller Unamaheshwar beside it
     ==================================================================== */
  /** Two stone pillars carrying a beam, with a dark bronze temple bell on a chain, as beside Indreshwar. */
  function StoneBell({ p, r = 0, s = 1 }) {
    const M = useM();
    const st = M.mat('granite', 1, 2, { color: '#9c978c' });
    const bronze = M.plain('#3e3a34', { metalness: 0.6, roughness: 0.5 });
    return (
      <group position={p} rotation={[0, r, 0]} scale={s}>
        <Box s={[1.5, 0.22, 0.9]} p={[0, 0.11, 0]} m={M.stone} />
        {[-0.62, 0.62].map((x) => <Box key={x} s={[0.2, 1.9, 0.2]} p={[x, 1.15, 0]} m={st} />)}
        <Box s={[1.6, 0.16, 0.24]} p={[0, 2.15, 0]} m={st} />
        <mesh position={[0, 1.5, 0]} material={bronze} castShadow><cylinderGeometry args={[0.12, 0.34, 0.62, 14]} /></mesh>
        <mesh position={[0, 1.84, 0]} material={bronze}><sphereGeometry args={[0.13, 10, 8]} /></mesh>
        <Cyl rt={0.012} h={0.3} p={[0, 2.0, 0]} m={bronze} seg={4} />
      </group>
    );
  }
  function IndraMain() {
    const M = useM();
    const wall = M.mat('brick', 2, 1, { color: '#a8684e' });
    const cella = M.mat('brick', 2, 1, { color: '#9a5e46' });
    const roofM = M.mat('ochre', 6, 6, { color: '#a58a60', roughness: 1 });
    const brick = M.mat('brick', 4, 0.5, { color: '#d79b80' });
    const stone = M.stone;
    const grey = M.mat('granite', 1, 1, { color: '#cfc7b8' });
    const wood = M.plain('#4a2c1a', { roughness: 0.85 });
    const tiers = [{ w: 3.9, d: 3.9, h: 1.6, o: 1.55, rh: 0.78 }, { w: 3.0, d: 3.0, h: 1.4, o: 1.15, rh: 0.62 }, { w: 2.1, d: 2.1, h: 1.3, o: 0.9, rh: 0.52 }];
    const fw = tiers[0].w;
    const fh = tiers[0].h * HW;
    return (
      <group>
        <Box s={[8.4, 0.3, 8.4]} p={[0, 0.15, 0]} m={brick} />
        <Box s={[7.4, 0.3, 7.4]} p={[0, 0.45, 0]} m={brick} />
        <Box s={[8.46, 0.05, 8.46]} p={[0, 0.3, 0]} m={stone} cast={false} />
        <Box s={[7.46, 0.05, 7.46]} p={[0, 0.6, 0]} m={stone} cast={false} />
        <Stairs p={[0, 0, 5.1]} w={2.0} n={6} rise={0.1} run={0.22} m={stone} />
        <Pag tiers={tiers} y0={0.6} roof={roofM} wall={wall} cellaM={cella} fringe="#7a3a2c" strutN={11} finial={0.9} goldDoor />
        {/* the carved ground floor: a carved lintel band, arched side doors and dark window grilles either side of the main door */}
        <Box s={[fw + 0.04, 0.16, 0.05]} p={[0, 0.6 + fh - 0.2, fw / 2 + 0.03]} m={wood} cast={false} />
        <Box s={[fw + 0.04, 0.1, 0.05]} p={[0, 0.6 + 0.25, fw / 2 + 0.03]} m={wood} cast={false} />
        {[-1, 1].map((k) => <Doorway key={k} p={[k * 0.85, 0.6, fw / 2 + 0.01]} w={0.5} h={1.3} arch />)}
        {[-1, 1].map((k) => <Box key={`pil${k}`} s={[0.1, fh - 0.3, 0.07]} p={[k * 0.48, 0.6 + fh / 2 - 0.05, fw / 2 + 0.04]} m={wood} cast={false} />)}
        {[-1, 1].map((k) => <group key={k} position={[k * 1.45, 0.6, 3.0]} scale={1.7}><Lion m={grey} /></group>)}
        {/* Unamaheshwar, the smaller twin at its side */}
        <group position={[-7.4, 0, -0.6]} scale={0.8}>
          <Box s={[6, 0.3, 6]} p={[0, 0.15, 0]} m={brick} />
          <Pag tiers={[{ w: 3.0, d: 3.0, h: 1.4, o: 1.2, rh: 0.7 }, { w: 2.2, d: 2.2, h: 1.1, o: 0.9, rh: 0.58 }]} y0={0.3} roof={roofM} wall={wall} fringe="#7a3a2c" strutN={8} finial={0.8} />
        </group>
        {/* the stone bull faces the temple, with the old stone bell frame beside it */}
        <Nandi p={[0, 0, 7.4]} face={Math.PI} />
        <StoneBell p={[-3.8, 0, 6.2]} s={0.95} />
        <Chaitya p={[4.2, 0, 6.4]} s={0.9} />
        <Frame s={[19, 8.6, 15]} p={[-1.4, 4.3, 1.2]} />
      </group>
    );
  }
  function IndraEnv() {
    const M = useM();
    const tints = ['#c4725a', '#d9946a', '#b86a50', '#c98a62'];
    return (
      <group>
        <GroundDisc r={26} m={M.plain('#e6d9c4', { roughness: 0.95 })} />
        <GroundDisc r={95} y={-0.04} m={M.plain('#b8c890', { roughness: 1 })} />
        {/* the Roshi / Punyamati river on the far side, with its stone bank */}
        <Water w={5} d={70} p={[-23, -0.2, 0]} color="#6a8a86" />
        <Box s={[1, 0.5, 70]} p={[-20, 0.1, 0]} m={M.stone} />
        {ringOf(22, 22, (p, r, i) => <NewarHouse key={i} p={p} r={r} w={2.6 + (i % 3) * 0.3} d={2.1} storeys={3 + (i % 2)} tint={tints[i % tints.length]} detail={i % 2 === 0} shop={false} />, (a) => (a > 0.1 && a < 1.5) || (a > 3.4 && a < 4.2))}
        {ringOf(14, 29, (p, r, i) => <NewarHouse key={`o${i}`} p={p} r={r} w={2.8} d={2.2} storeys={3} tint={tints[(i + 1) % tints.length]} detail={false} shop={false} />, (a) => a > 3.3 && a < 4.3)}
        <Range n={7} R={62} y={-1} hMin={10} hMax={18} rock="#6a8a60" snow={false} />
        <Woods n={10} r0={24} r1={34} s0={1.3} broad={100} skip={(a) => a > 0.1 && a < 1.5} />
      </group>
    );
  }

  /* ====================================================================
     Chandeshwori, Banepa: three gilded roofs over dark brick, stone lamp pillars, red shikhara shrines, forested hill behind
     ==================================================================== */
  function ChandeshMain() {
    const M = useM();
    const wall = M.mat('brick', 2, 1, { color: '#9a5a44' });
    const gold = M.plain('#e4b840', { metalness: 0.8, roughness: 0.3 });
    const brick = M.mat('brick', 4, 0.5, { color: '#e0a284' });
    const grey = M.mat('granite', 1, 2, { color: '#8a857c' });
    const tiers = [{ w: 3.2, d: 3.2, h: 1.35, o: 1.0, rh: 0.65 }, { w: 2.4, d: 2.4, h: 0.95, o: 0.85, rh: 0.55 }, { w: 1.7, d: 1.7, h: 0.8, o: 0.7, rh: 0.5 }];
    const top = pagTop(tiers, 0.34);
    return (
      <group>
        <Box s={[6.2, 0.34, 6.2]} p={[0, 0.17, 0]} m={brick} />
        <Stairs p={[0, 0, 4.0]} w={1.8} n={3} rise={0.113} run={0.3} m={M.stone} />
        <Pag tiers={tiers} y0={0.34} roof={gold} wall={wall} goldDoor strutN={5} finial={1} />
        <group position={[0, top - 0.2, 0.5]} rotation={[0.18, 0, 0]}><Box s={[0.14, top - 0.2, 0.02]} p={[0, -(top - 0.2) / 2, 0]} m={M.plain('#e8c04a', { metalness: 0.6, roughness: 0.4 })} cast={false} /></group>
        {/* the row of stone lamp pillars standing under the front eave */}
        {[-1.6, 0, 1.6].map((x, k) => (
          <group key={x} position={[x, 0.34, 2.6]}>
            <Box s={[0.4, 0.2, 0.4]} p={[0, 0.1, 0]} m={grey} />
            <Cyl rt={0.14} rb={0.17} h={1.6} p={[0, 1.0, 0]} m={grey} seg={10} />
            <Cyl rt={0.24} rb={0.14} h={0.18} p={[0, 1.89, 0]} m={grey} seg={12} />
            <Ball rad={0.17} p={[0, 2.08, 0]} m={grey} />
            {k === 1 && <group position={[0, 2.2, 0]} scale={1.3}><Lion m={M.plain('#6a5a3a', { metalness: 0.6, roughness: 0.4 })} /></group>}
          </group>
        ))}
        {/* two red-based shikhara shrines in front, one white */}
        <group position={[-4.8, 0, 2.6]}>
          <Box s={[1.1, 1.0, 1.1]} p={[0, 0.5, 0]} m={M.plain('#b8452e', { roughness: 0.85 })} />
          <Spire r0={0.62} h={1.8} y={1.0} m={M.plain('#f4eee2', { roughness: 0.7 })} />
        </group>
        <group position={[4.6, 0, 3.4]}>
          <Box s={[1.0, 0.9, 1.0]} p={[0, 0.45, 0]} m={M.plain('#f4eee2', { roughness: 0.7 })} />
          <Spire r0={0.56} h={1.6} y={0.9} m={M.plain('#b8452e', { roughness: 0.85 })} />
        </group>
        <group position={[3.6, 0, 5.4]}><Lingam p={[0, 0, 0]} /></group>
        {[-1, 1].map((k) => <group key={k} position={[k * 1.3, 0.34, 4.6]} scale={1.7}><Lion m={M.plain('#8a5a3a', { metalness: 0.5, roughness: 0.5 })} /></group>)}
        <BellFrame p={[-3.2, 0, 5.4]} s={0.85} col="#6a6a68" />
        {/* brick cloister range with red fringe */}
        {[-1, 1].map((k) => (
          <group key={k} position={[k * 7.2, 0, -0.5]}>
            <Box s={[1.8, 1.7, 8]} p={[0, 0.85, 0]} m={M.mat('brick', 4, 1, { color: '#d9937a' })} />
            {[-3, -1.5, 0, 1.5, 3].map((z) => <LatticeWindow key={z} p={[-k * 0.91, 0.95, z]} r={-k * Math.PI / 2} w={0.55} h={0.6} bars={4} />)}
            <Roof w={2.8} d={8.8} h={0.9} y={1.7} m={roofMat(M, 'clay-tile')} sag={1.1} lift={0.05} />
            <Fringe w={2.8} d={8.8} y={1.62} color="#b3202a" h={0.14} />
          </group>
        ))}
        <Frame s={[16, 7, 12.6]} p={[0, 3.5, 0.9]} />
      </group>
    );
  }
  function ChandeshEnv() {
    const M = useM();
    return (
      <group>
        <GroundDisc r={22} m={M.plain('#e2d6c2', { roughness: 0.95 })} />
        <GroundDisc r={95} y={-0.04} m={M.plain('#6f9158', { roughness: 1 })} />
        {/* the dense forested hill the temple stands against */}
        <GreenHill p={[0, -0.5, -40]} r={30} h={22} col="#3c6a3a" sz={0.7} />
        <GreenHill p={[-36, -0.5, -22]} r={14} h={13} col="#487a40" />
        <GreenHill p={[36, -0.5, -24]} r={15} h={14} col="#41723d" />
        {Array.from({ length: 80 }, (_, i) => {
          const x = (rnd(i, 1) - 0.5) * 52;
          const z = -22 - rnd(i, 2) * 34;
          const rho = Math.hypot(x / 30, (z + 40) / 21);
          if (rho > 0.95) return null;
          return <Fir key={i} p={[x, Math.sqrt(1 - rho * rho) * 22 * 0.86, z]} s={1.5 + rnd(i, 3) * 1.1} c={rnd(i, 4) > 0.4 ? '#2f5a3a' : '#4a7a3e'} />;
        })}
        {/* the Punyamata river in front of the forest edge */}
        <Water w={60} d={3.4} p={[0, -0.12, -14]} color="#6a8a82" />
        {Array.from({ length: 10 }, (_, i) => <Tree key={i} p={[-12 + i * 2.7, 0, 13 + (i % 2) * 2]} s={1 + (i % 3) * 0.25} kind="broad" />).filter((_, i) => i < 3 || i > 6)}
      </group>
    );
  }

  /* ====================================================================
     Palanchok Bhagawati: two grey-roofed storeys with red cloth frills inside a ring of brick ranges roofed in red sheet metal, on a hilltop
     ==================================================================== */
  function PalanMain() {
    const M = useM();
    const wall = M.mat('brick', 2, 1, { color: '#b86e54' });
    const grey = M.plain('#7c7c78', { roughness: 0.55, metalness: 0.35 });
    const redSheet = M.plain('#b4443a', { roughness: 0.6, metalness: 0.3 });
    const brick = M.mat('brick', 4, 1, { color: '#dc9078' });
    const brickLow = M.mat('brick', 4, 0.5, { color: '#e0a284' });
    const H = 4.6;
    const Dp = 1.7;
    const cl = [
      { p: [0, 0, -(H - Dp / 2)], r: 0, len: H * 2 }, { p: [-(H - Dp / 2), 0, 0], r: Math.PI / 2, len: H * 2 }, { p: [H - Dp / 2, 0, 0], r: -Math.PI / 2, len: H * 2 },
      { p: [-(H / 2 + 0.9), 0, H - Dp / 2], r: Math.PI, len: H - 1.8 }, { p: [H / 2 + 0.9, 0, H - Dp / 2], r: Math.PI, len: H - 1.8 },
    ];
    return (
      <group>
        <Box s={[H * 2 + 0.6, 0.18, H * 2 + 0.6]} p={[0, 0.09, 0]} m={brickLow} />
        {cl.map((c, i) => (
          <group key={i} position={c.p} rotation={[0, c.r, 0]}>
            <Box s={[c.len, 1.3, Dp]} p={[0, 0.83, 0]} m={brick} />
            {Array.from({ length: Math.max(2, Math.floor(c.len / 1.6)) }, (_, k, a) => null).map((_, k) => { const n = Math.max(2, Math.floor(c.len / 1.6)); return <Box key={k} s={[0.36, 0.4, 0.05]} p={[-c.len / 2 + (k + 0.5) * (c.len / n), 0.95, -Dp / 2 - 0.02]} m={M.dark} />; })}
            <Shed p={[0, 0, 0]} len={c.len + 0.4} dep={Dp + 0.8} y={1.6} m={redSheet} tilt={0.2} />
          </group>
        ))}
        {/* the shrine: two grey roofs trimmed with red frills, a tall slender pinnacle */}
        <Box s={[4.2, 0.3, 4.2]} p={[0, 0.27, 0]} m={M.stone} />
        <Pag tiers={[{ w: 2.6, d: 2.6, h: 1.4, o: 1.2, rh: 0.75 }]} y0={0.42} roof={grey} wall={wall} fringe="#c0392b" strutN={4} finial={0} goldDoor />
        <Pag tiers={[{ w: 1.8, d: 1.8, h: 1.0, o: 0.95, rh: 0.6 }]} y0={0.42 + 1.4 * HW + 0.45 * HR} roof={grey} wall={wall} fringe="#c0392b" strutN={3} finial={1.8} door={false} bells={false} />
        <Trident p={[3.4, 0.18, 2.9]} h={3.4} />
        <BellFrame p={[-2.6, 0.18, 3.0]} s={0.7} col="#4a4a4a" />
        {/* the long banner and prayer flags strung over the roofs */}
        <PrayerFlags from={[-4.8, 3.6, 4.6]} to={[0, 3.9, 0]} n={14} />
        <PrayerFlags from={[4.8, 3.6, 4.6]} to={[0, 3.9, 0]} n={14} />
        <Frame s={[11.4, 5.6, 11.4]} p={[0, 2.8, 0]} />
      </group>
    );
  }
  function PalanEnv() {
    const M = useM();
    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow material={M.plain('#e6dccb', { roughness: 0.95 })}><circleGeometry args={[9, 40]} /></mesh>
        <mesh position={[0, -8.05, 0]} material={M.plain('#86a65e', { roughness: 1 })} receiveShadow><cylinderGeometry args={[8.5, 26, 16, 52]} /></mesh>
        <GroundDisc r={95} y={-16} m={M.plain('#a8bc82', { roughness: 1 })} />
        {Array.from({ length: 36 }, (_, i) => {
          const a = rnd(i, 1) * Math.PI * 2;
          const r = 9 + rnd(i, 2) * 14;
          if (r < 15 && a > 0.1 && a < 1.5) return null;
          return <Tree key={i} p={[Math.cos(a) * r, -((r - 8.5) / 17.5) * 16, Math.sin(a) * r]} s={1.2 + rnd(i, 3) * 0.7} kind={i % 3 ? 'broad' : 'pine'} />;
        })}
        <Town n={30} r0={22} r1={44} drop={0.6} skip={(a) => a > 0.05 && a < 1.5} hs={0.8} />
        <Range n={9} R={80} y={-14} hMin={16} hMax={28} rock="#8a97b0" cap={0.6} />
      </group>
    );
  }

  /* ====================================================================
     Sheshnarayan: a low lattice-fronted Vishnu temple with a gilded-copper roof under a grey cliff, red and white shrines, two dark green ponds, steps to the cave
     ==================================================================== */
  /** A run of white posts joined by a rope, as along the Sheshnarayan ponds. */
  function RopeRail({ from, to, h = 0.8, n = 8 }) {
    const M = useM();
    const dx = to[0] - from[0];
    const dz = to[1] - from[1];
    const len = Math.hypot(dx, dz);
    const ang = -Math.atan2(dz, dx);
    return (
      <group>
        {Array.from({ length: n + 1 }, (_, k) => <Cyl key={k} rt={0.03} h={h} p={[from[0] + (dx * k) / n, h / 2, from[1] + (dz * k) / n]} m={M.plain('#e9e5da')} seg={6} />)}
        <Box s={[len, 0.025, 0.025]} p={[from[0] + dx / 2, h - 0.08, from[1] + dz / 2]} r={[0, ang, 0]} m={M.plain('#d9d2c0')} cast={false} />
        <Box s={[len, 0.025, 0.025]} p={[from[0] + dx / 2, h - 0.4, from[1] + dz / 2]} r={[0, ang, 0]} m={M.plain('#d9d2c0')} cast={false} />
      </group>
    );
  }
  function SheshMain() {
    const M = useM();
    const timber = M.plain('#8c3426', { roughness: 0.85 });
    const redPaint = M.plain('#b95a4c', { roughness: 0.95 });
    const goldRoof = M.plain('#c8a040', { metalness: 0.7, roughness: 0.4 });
    const white = M.plain('#f1ede4', { roughness: 0.85 });
    const dk = M.plain('#1a110c');
    const grey = M.mat('granite', 3, 2, { color: '#b5afa4' });
    const orange = M.plain('#d4642a', { roughness: 0.9 });
    return (
      <group>
        {/* the temple: a stone plinth, a red-painted timber front of big lattice windows, one broad gilded-copper roof */}
        <group position={[-1.0, 0, -0.9]}>
          <Box s={[6.6, 0.35, 4.8]} p={[0, 0.175, 0]} m={grey} />
          <Stairs p={[0, 0, 2.4]} w={1.8} n={2} rise={0.175} run={0.3} m={M.stone} />
          <Box s={[5.0, 1.55, 3.0]} p={[0, 1.125, -0.2]} m={timber} />
          {[-2.4, -1.5, -0.45, 0.45, 1.5, 2.4].map((x) => <Box key={x} s={[0.14, 1.55, 0.14]} p={[x, 1.125, 1.34]} m={M.dark} />)}
          {[-1.95, -1.0, 1.0, 1.95].map((x) => <LatticeWindow key={x} p={[x, 1.15, 1.32]} w={0.78} h={1.05} bars={7} />)}
          <Doorway p={[0, 0.35, 1.31]} w={0.7} h={1.3} gold arch />
          <Box s={[5.1, 0.12, 3.1]} p={[0, 1.95, -0.2]} m={M.dark} />
          <EaveStruts w={5.0} d={3.0} y={1.9} n={9} h={0.6} />
          <Roof w={6.4} d={4.5} h={1.0} y={1.9} m={goldRoof} sag={1.25} lift={0.08} />
          <Box s={[6.4, 0.07, 0.06]} p={[0, 1.88, 2.25]} m={M.gold} cast={false} />
          <Gajur y={2.88} s={0.45} />
          {/* a hanging bell and a few red banners under the eave */}
          {[-1.2, 0, 1.2].map((x) => <mesh key={x} position={[x, 1.72, 1.7]} material={M.gold}><coneGeometry args={[0.07, 0.16, 8]} /></mesh>)}
        </group>
        {/* red-washed shrine with arched openings at the left, with orange-smeared images in front */}
        <group position={[-6.6, 0, 0.3]}>
          <Box s={[2.8, 1.7, 2.0]} p={[0, 0.85, 0]} m={redPaint} />
          {[-0.7, 0.7].map((x) => <group key={x}><Box s={[0.55, 0.8, 0.06]} p={[x, 0.6, 1.02]} m={dk} /><mesh position={[x, 1.0, 1.02]} material={dk}><circleGeometry args={[0.275, 14, 0, Math.PI]} /></mesh></group>)}
          <Box s={[3.0, 0.16, 2.2]} p={[0, 1.78, 0]} m={redPaint} />
          <group position={[1.9, 0, 1.6]}>
            <Box s={[0.5, 0.4, 0.5]} p={[0, 0.2, 0]} m={M.stone} />
            <Cyl rt={0.14} rb={0.2} h={0.6} p={[0, 0.7, 0]} m={orange} seg={8} />
            <Ball rad={0.15} p={[0, 1.1, 0]} m={orange} />
          </group>
          <group position={[2.8, 0, 1.9]}>
            <Box s={[0.5, 0.4, 0.5]} p={[0, 0.2, 0]} m={M.stone} />
            <Cyl rt={0.12} rb={0.18} h={0.6} p={[0, 0.7, 0]} m={M.mat('granite', 1, 1, { color: '#7a766e' })} seg={8} />
            <Ball rad={0.13} p={[0, 1.08, 0]} m={M.mat('granite', 1, 1, { color: '#7a766e' })} />
          </group>
        </group>
        {/* the white domed shrine with arched niches, set by the near pond */}
        <group position={[3.6, 0, 1.4]}>
          <Box s={[1.9, 0.3, 1.9]} p={[0, 0.15, 0]} m={white} />
          <Cyl rt={0.8} rb={0.85} h={1.0} p={[0, 0.8, 0]} m={white} seg={14} />
          {[0, 2.1, 4.2].map((a) => <mesh key={a} position={[Math.sin(a) * 0.82, 0.75, Math.cos(a) * 0.82]} rotation={[0, a, 0]} material={dk}><circleGeometry args={[0.22, 10, 0, Math.PI]} /></mesh>)}
          <Ball rad={0.82} sc={[1, 0.8, 1]} p={[0, 1.3, 0]} m={white} />
          <Cyl rt={0.15} rb={0.3} h={0.5} p={[0, 1.95, 0]} m={white} seg={10} />
          <Gajur y={2.2} s={0.35} />
        </group>
        {/* the small red domed shrine on the pond walk, with two arched openings */}
        <group position={[6.0, 0, 4.6]}>
          <Box s={[1.5, 1.3, 1.5]} p={[0, 0.65, 0]} m={redPaint} />
          {[-0.34, 0.34].map((x) => <group key={x}><Box s={[0.4, 0.5, 0.06]} p={[x, 0.45, 0.77]} m={dk} /><mesh position={[x, 0.7, 0.77]} material={dk}><circleGeometry args={[0.2, 12, 0, Math.PI]} /></mesh></group>)}
          <Box s={[1.7, 0.1, 1.7]} p={[0, 1.3, 0]} m={redPaint} />
          <mesh position={[0, 1.35, 0]} material={redPaint} castShadow><sphereGeometry args={[0.62, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
          <mesh position={[0, 2.0, 0]} material={M.gold}><coneGeometry args={[0.05, 0.28, 8]} /></mesh>
        </group>
        {/* the two dark green holy ponds, stone-rimmed and railed, with a paved walk between */}
        <Pool p={[-1.8, 0, 4.4]} w={5.6} d={3.4} color="#2b4636" />
        <Pool p={[2.6, 0, 9.0]} w={5.2} d={3.0} color="#2b4636" />
        <RopeRail from={[-4.8, 6.4]} to={[1.2, 6.4]} n={8} />
        <RopeRail from={[-4.9, 2.4]} to={[-4.9, 6.4]} n={5} />
        <RopeRail from={[0.1, 10.9]} to={[5.5, 10.9]} n={7} />
        <Box s={[2.4, 0.08, 5.0]} p={[2.7, 0.04, 5.4]} m={M.stone} />
        {/* the steps climbing to the cave, and a few old stone stelae at the foot */}
        <Stairs p={[7.4, 0, 1.4]} w={1.3} n={8} rise={0.18} run={0.3} m={M.stone} />
        {[[-4.0, 2.2], [-3.4, 2.6], [-3.7, 3.2]].map(([x, z], k) => <Box key={k} s={[0.34, 0.8 + k * 0.1, 0.12]} p={[x, 0.4, z]} m={M.mat('granite', 1, 1, { color: '#6f6a62' })} />)}
        <PrayerFlags from={[-7.4, 4.4, -2]} to={[2.2, 2.8, 2.6]} n={20} />
        <Frame s={[17, 5.6, 17]} p={[0.5, 2.8, 2.6]} />
      </group>
    );
  }
  function SheshEnv() {
    const M = useM();
    const rock = M.plain('#8e8b85', { roughness: 1, flatShading: true });
    const moss = M.plain('#6f7f58', { roughness: 1, flatShading: true });
    const lump = useMemo(() => lumpGeo(31, 2, 0.22), []);
    const cliffs = [
      // x, z, width, height, depth: a crescent of grey cliff behind the temple, with a notch of forest at the left rear
      [-17, -9, 6.5, 8.5, 3], [-19, -2, 4.5, 6.2, 2.6], [2.4, -6.6, 6.2, 9.0, 3.2], [9, -7.4, 5.4, 8.0, 3.2], [15.5, -4.5, 4.4, 6.6, 2.6], [3, -20, 6, 9, 3], [11, -20, 5, 8, 3], [-4, -23, 5, 8, 3],
    ];
    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 2]} receiveShadow material={M.plain('#bdb6a8', { roughness: 0.95 })}><planeGeometry args={[26, 30]} /></mesh>
        <GroundDisc r={95} y={-0.04} m={M.plain('#6f9250', { roughness: 1 })} />
        {/* the grey cliff face, in several craggy masses, with a green-mossed upper lip */}
        {cliffs.map(([x, z, w, h, d], k) => (
          <group key={k} position={[x, 0, z]}>
            <mesh geometry={lump} position={[0, h * 0.42, 0]} scale={[w, h * 0.5, d]} rotation={[0, k * 0.7, 0]} material={rock} castShadow receiveShadow />
            <mesh geometry={lump} position={[w * 0.15, h * 0.78, d * 0.1]} scale={[w * 0.8, h * 0.32, d * 0.9]} rotation={[0, k * 1.1, 0]} material={rock} castShadow receiveShadow />
            <mesh geometry={lump} position={[-w * 0.2, h * 0.95, 0]} scale={[w * 0.7, h * 0.12, d * 0.9]} rotation={[0, k, 0]} material={moss} />
          </group>
        ))}
        {/* the dark cave mouth in the red-washed rock face, a small lamp shrine inside */}
        <group position={[3.0, 0, -3.3]}>
          <Box s={[3.0, 2.3, 0.2]} p={[0, 1.15, 0]} m={M.plain('#a8473a', { roughness: 1 })} />
          <mesh position={[0, 0.9, 0.12]} material={M.plain('#0d0907')}><circleGeometry args={[0.8, 20, 0, Math.PI]} /></mesh>
          <Box s={[1.6, 0.9, 0.05]} p={[0, 0.45, 0.12]} m={M.plain('#0d0907')} cast={false} />
          {[-1.0, 1.0].map((x) => <mesh key={x} position={[x, 1.7, 0.12]} material={M.plain('#0d0907')}><circleGeometry args={[0.13, 10]} /></mesh>)}
        </group>
        {/* dense forest on and around the cliff, hanging green over the rock */}
        {Array.from({ length: 70 }, (_, i) => {
          const a = Math.PI * (0.98 + rnd(i, 1) * 1.04);
          const r = 8 + rnd(i, 2) * 20;
          const x = Math.cos(a) * r * 1.3;
          const z = Math.sin(a) * r;
          if (z > -3 && Math.abs(x) < 9) return null;
          if (x > -15 && x < 1 && z < -2.5 && z > -13) return null;
          if (z < -4 && z > -8.5 && x > -2 && x < 12) return null;
          const onCliff = z < -9 && z > -16 ? 4 : 0;
          return <Tree key={i} p={[x, onCliff, z]} s={1.2 + rnd(i, 3) * 1.1} kind="broad" />;
        })}
        {[[-13, 2], [-14, 12], [-10, 22], [16, 20]].map(([x, z], k) => <Tree key={`s${k}`} p={[x, 0, z]} s={1.8 + (k % 2) * 0.5} kind="broad" />)}
        {/* the red-brown house at the left and the white guesthouse across the pond */}
        <group position={[-11, 0, 6]}>
          <Box s={[3.6, 3.2, 2.8]} p={[0, 1.6, 0]} m={M.mat('brick', 2, 2, { color: '#d9937a' })} />
          <Roof w={4.4} d={3.6} h={0.9} y={3.2} m={M.mat('roof', 3, 3, { color: '#8a5e4c' })} sag={1.1} lift={0.04} />
        </group>
        <group position={[13, 0, 7]}>
          <Box s={[4.4, 3.6, 3]} p={[0, 1.8, 0]} m={M.plain('#f2eee6', { roughness: 0.9 })} />
          {[0, 1, 2].map((s) => [-1.4, -0.45, 0.45, 1.4].map((x) => <Box key={`${s}${x}`} s={[0.5, 0.6, 0.05]} p={[x, 0.8 + s * 1.1, 1.52]} m={M.plain('#6a7a8a')} />))}
          <Roof w={5} d={3.6} h={0.7} y={3.6} m={M.plain('#b4443a', { roughness: 0.6 })} sag={1.1} lift={0.03} />
        </group>
      </group>
    );
  }

  /* ====================================================================
     Doleshwor Mahadev, Sipadol: an open courtyard with the great stone Nandi on a red pedestal, a golden Nandi, the copper cobra, the Shiva head stone in a small shrine and tin-roofed sheds
     ==================================================================== */
  /** A recumbent stone bull (Nandi), facing +z, with folded forelegs, a high hump, curved horns and a garland. */
  function Bull({ m, garland = '#b3202a', s = 1 }) {
    const M = useM();
    const g = M.plain(garland, { roughness: 0.9 });
    return (
      <group scale={s}>
        <Ball rad={0.5} sc={[0.82, 0.68, 1.4]} p={[0, 0.5, -0.05]} m={m} />
        <Ball rad={0.36} sc={[1.05, 0.9, 1]} p={[0, 0.42, -0.5]} m={m} />
        <Ball rad={0.27} sc={[0.8, 0.85, 1.15]} p={[0, 0.88, 0.22]} m={m} />
        <Ball rad={0.3} sc={[0.78, 1.05, 0.9]} p={[0, 0.78, 0.5]} m={m} />
        <mesh position={[0, 0.7, 0.5]} rotation={[0.4, 0, 0]} material={g}><torusGeometry args={[0.24, 0.035, 6, 16]} /></mesh>
        <Ball rad={0.21} sc={[0.8, 0.85, 1.25]} p={[0, 0.93, 0.76]} m={m} />
        <Ball rad={0.12} sc={[1.05, 0.8, 1]} p={[0, 0.83, 0.98]} m={m} />
        {[-1, 1].map((k) => (
          <group key={k}>
            <mesh position={[k * 0.17, 1.12, 0.7]} rotation={[0.2, 0, k * -0.9]} material={m}><coneGeometry args={[0.04, 0.3, 6]} /></mesh>
            <Ball rad={0.06} sc={[1, 0.5, 1]} p={[k * 0.2, 1.0, 0.64]} m={m} />
            <Cyl rt={0.075} rb={0.09} h={0.62} p={[k * 0.2, 0.13, 0.6]} r={[Math.PI / 2, 0, 0]} m={m} seg={8} />
          </group>
        ))}
        <Cyl rt={0.03} rb={0.06} h={0.7} p={[0, 0.4, -0.88]} r={[0.7, 0, 0]} m={m} seg={6} />
      </group>
    );
  }
  /** The Sipadol cobra: copper coils on a stone base, a long neck and a spread hood. */
  function Cobra({ s = 1 }) {
    const M = useM();
    const cu = M.plain('#b9653a', { metalness: 0.55, roughness: 0.45 });
    return (
      <group scale={s}>
        <Box s={[1.7, 0.4, 1.7]} p={[0, 0.2, 0]} m={M.stone} />
        {[0, 1, 2].map((k) => <mesh key={k} position={[0, 0.5 + k * 0.26, 0]} rotation={[Math.PI / 2, 0, k]} material={cu} castShadow><torusGeometry args={[0.62 - k * 0.1, 0.19, 10, 28]} /></mesh>)}
        <mesh position={[0.25, 0.9, 0.05]} rotation={[Math.PI / 2, 0, 0.5]} material={cu} castShadow><torusGeometry args={[0.38, 0.16, 8, 20]} /></mesh>
        <Cyl rt={0.17} rb={0.24} h={1.2} p={[0, 1.3, 0]} m={cu} seg={12} />
        <Ball rad={0.58} sc={[0.62, 1.0, 0.22]} p={[0, 2.1, 0]} m={cu} />
        <Ball rad={0.32} sc={[0.8, 0.9, 0.5]} p={[0, 2.62, 0.05]} m={cu} />
        <Ball rad={0.17} sc={[0.9, 0.8, 1.3]} p={[0, 2.7, 0.22]} m={cu} />
      </group>
    );
  }
  function DolesMain() {
    const M = useM();
    const conc = M.plain('#d9cfba', { roughness: 0.95 });
    const dgrey = M.plain('#8c8784', { roughness: 0.85 });
    const tika = M.plain('#b9503f', { roughness: 0.9 });
    const redSheet = M.plain('#b24a3a', { roughness: 0.55, metalness: 0.35 });
    const green = M.plain('#2f6a4c', { metalness: 0.4, roughness: 0.5 });
    const steel = M.plain('#8f9394', { metalness: 0.7, roughness: 0.4 });
    const white = M.plain('#eeeae0', { roughness: 0.6 });
    const brick = M.mat('brick', 3, 1, { color: '#c98a6e' });
    const marigold = M.plain('#f08a1c', { roughness: 0.9 });
    const gold = M.plain('#d9a02e', { metalness: 0.6, roughness: 0.35 });
    const dark = M.plain('#14100e');
    return (
      <group>
        {/* the open concrete courtyard on its hill shoulder, with the wide steps down to the village */}
        <Box s={[15.4, 0.2, 13.4]} p={[0, 0.1, 0.4]} m={conc} />
        <Stairs p={[0, 0, 7.6]} w={5.2} n={3} rise={0.067} run={0.26} m={M.stone} />
        {/* the great grey Nandi on a stepped, red-smeared pedestal, facing the shrine */}
        <group position={[0.2, 0.2, 2.6]}>
          <Box s={[2.5, 0.3, 3.0]} p={[0, 0.15, 0]} m={tika} />
          <Box s={[2.1, 0.3, 2.6]} p={[0, 0.45, 0]} m={M.plain('#a8604e', { roughness: 0.9 })} />
          <Box s={[1.8, 0.26, 2.3]} p={[0, 0.73, 0]} m={tika} />
          <group position={[0, 0.86, 0.1]} rotation={[0, Math.PI, 0]}><Bull m={dgrey} s={2.1} /></group>
        </group>
        {/* the golden Nandi and the small orange bulls at its foot */}
        <group position={[2.9, 0.2, 3.6]}>
          <Box s={[1.1, 0.34, 1.5]} p={[0, 0.17, 0]} m={tika} />
          <group position={[0, 0.34, 0]} rotation={[0, Math.PI * 0.9, 0]}><Bull m={gold} garland="#c43a2a" s={1.05} /></group>
        </group>
        {[[-1.7, 4.6], [-2.4, 3.9]].map(([x, z], k) => <group key={k} position={[x, 0.2, z]} rotation={[0, Math.PI + k * 0.4, 0]}><Bull m={M.plain('#c8763a', { roughness: 0.8 })} garland="#e8c030" s={0.5} /></group>)}
        {/* the orange umbrella over the offering post */}
        <group position={[-1.4, 0.2, 1.4]}>
          <Cyl rt={0.03} h={3.4} p={[0, 1.7, 0]} m={steel} seg={6} />
          <mesh position={[0, 3.5, 0]} material={M.plain('#e0802a', { roughness: 0.8 })}><coneGeometry args={[0.8, 0.45, 12]} /></mesh>
        </group>
        {/* the big copper cobra with its glass offering box */}
        <group position={[-4.4, 0.2, 2.2]}><Cobra s={1.15} /></group>
        <group position={[-4.4, 0.2, 4.0]}>
          <Box s={[0.9, 0.7, 0.7]} p={[0, 0.35, 0]} m={M.stone} />
          <Box s={[0.78, 0.4, 0.58]} p={[0, 0.9, 0]} m={M.plain('#bfd8dc', { roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.5 })} />
        </group>
        {/* the small white-tiled shrine of the Shiva head, open in front, tin-roofed */}
        <group position={[0, 0.2, -4.0]}>
          <Box s={[4.0, 0.25, 3.4]} p={[0, 0.12, 0]} m={M.stone} />
          <Box s={[3.6, 2.2, 0.2]} p={[0, 1.35, -1.4]} m={white} />
          {[-1, 1].map((k) => <Box key={k} s={[0.2, 2.2, 2.8]} p={[k * 1.7, 1.35, -0.1]} m={white} />)}
          <Box s={[3.8, 0.3, 3.2]} p={[0, 2.6, 0]} m={white} />
          <mesh position={[0, 2.95, 0]} material={redSheet} castShadow><boxGeometry args={[4.2, 0.1, 3.6]} /></mesh>
          {[-1, 1].map((k) => <Box key={k} s={[0.06, 0.65, 0.5]} p={[k * 1.81, 1.6, 0.4]} m={M.plain('#8f5a2c')} />)}
          {/* the black stone head with its three white lines, garlanded in marigold, a silver trident beside */}
          <Box s={[1.5, 0.4, 1.2]} p={[0, 0.45, -0.3]} m={white} />
          <Ball rad={0.6} sc={[0.95, 1.1, 0.9]} p={[0, 1.15, -0.3]} m={M.mat('rock', 1, 1, { color: '#3a3430' })} />
          {[0, 1, 2].map((k) => <mesh key={k} position={[0, 1.34 + k * 0.1, 0.2 - k * 0.01]} material={M.plain('#e4e4e4', { metalness: 0.6, roughness: 0.3 })}><torusGeometry args={[0.28 - k * 0.02, 0.02, 6, 16, Math.PI]} /></mesh>)}
          <mesh position={[0, 1.5, -0.3]} rotation={[Math.PI / 2.3, 0, 0]} material={marigold}><torusGeometry args={[0.52, 0.09, 8, 24]} /></mesh>
          <Trident p={[-0.95, 0.2, 0.2]} h={1.9} />
          <Trident p={[0.95, 0.2, 0.2]} h={1.6} />
        </group>
        {/* long open sheds on steel posts with red tin roofs, the left a brick-backed range */}
        {[1, -1].map((k) => (
          <group key={k} position={[k * 6.5, 0.2, k > 0 ? 1.8 : -1.2]}>
            {Array.from({ length: 6 }, (_, j) => (
              <group key={j}>
                <Cyl rt={0.06} h={2.1} p={[-k * 1.0, 1.05, -3.5 + j * 1.4]} m={green} seg={8} />
                <Cyl rt={0.06} h={2.7} p={[k * 1.0, 1.35, -3.5 + j * 1.4]} m={green} seg={8} />
                <Box s={[2.1, 0.05, 0.05]} p={[0, 2.4, -3.5 + j * 1.4]} r={[0, 0, k * 0.28]} m={steel} cast={false} />
              </group>
            ))}
            <Shed p={[0, 0, 0]} r={k * Math.PI / 2} len={7.4} dep={2.3} y={2.45} m={redSheet} tilt={0.27} />
            <Box s={[0.14, 0.1, 7.4]} p={[-k * 1.0, 2.15, 0]} m={steel} cast={false} />
            {k < 0 && <Box s={[0.25, 2.5, 7.2]} p={[1.15, 1.25, 0]} m={brick} />}
            {k < 0 && [-2.4, 0, 2.4].map((z) => <Box key={z} s={[0.05, 0.55, 0.6]} p={[1.0, 1.5, z]} m={dark} />)}
          </group>
        ))}
        {/* yellow-canopied stalls at the courtyard edge */}
        {[[-5.8, 5.8], [5.4, 6.0]].map(([x, z], k) => (
          <group key={k} position={[x, 0.2, z]}>
            <Box s={[1.4, 0.8, 1.0]} p={[0, 0.4, 0]} m={M.plain(k ? '#9aa6b0' : '#c8b890', { roughness: 0.8 })} />
            <mesh position={[0, 1.2, 0]} rotation={[0, Math.PI / 4, 0]} material={M.plain('#e8c63a', { roughness: 0.8 })}><coneGeometry args={[1.1, 0.5, 4]} /></mesh>
          </group>
        ))}
        <BellFrame p={[-2.6, 0.2, 6.2]} s={0.8} col="#7a4a3a" />
        <Frame s={[16, 5.2, 14]} p={[0, 2.6, 0.6]} />
      </group>
    );
  }
  function DolesEnv() {
    const M = useM();
    return (
      <group>
        <mesh position={[0, -5.02, 0]} material={M.plain('#8aa95e', { roughness: 1 })} receiveShadow><cylinderGeometry args={[11, 24, 10, 52]} /></mesh>
        <GroundDisc r={95} y={-10} m={M.plain('#a4bb7c', { roughness: 1 })} />
        {/* terraced paddy fields stepping down the slope */}
        {[0, 1, 2, 3].map((k) => <mesh key={k} position={[0, -1.1 - k * 1.2, 0]} material={M.plain(k % 2 ? '#b0be66' : '#8aa84e', { roughness: 1 })} receiveShadow><cylinderGeometry args={[14 + k * 3.2, 14 + k * 3.2, 0.5, 52, 1, true]} /></mesh>)}
        {/* the forested ridge rising behind the shrine */}
        <GreenHill p={[0, -0.4, -34]} r={28} h={15} col="#3c6a3a" sz={0.6} />
        <GreenHill p={[-32, -0.4, -14]} r={12} h={11} col="#487a40" />
        <GreenHill p={[34, -0.4, -16]} r={13} h={12} col="#41723d" />
        {Array.from({ length: 60 }, (_, i) => {
          const x = (rnd(i, 1) - 0.5) * 50;
          const z = -18 - rnd(i, 2) * 30;
          const rho = Math.hypot(x / 28, (z + 34) / 16.8);
          if (rho > 0.95) return null;
          return <Fir key={i} p={[x, Math.sqrt(1 - rho * rho) * 15 * 0.86, z]} s={1.6 + rnd(i, 3)} c={rnd(i, 4) > 0.5 ? '#2f5a3a' : '#4a7a3e'} />;
        })}
        {/* big shade tree at the courtyard corner */}
        <Tree p={[-8.6, 0.2, -4.4]} s={1.9} kind="broad" />
        <Town n={26} r0={14} r1={34} drop={0.3} skip={(a) => (a > 0.05 && a < 1.5) || (a > 3.4 && a < 6.0)} colors={['#d9c9a8', '#c9a890', '#e6dcc4', '#b89878']} hs={0.9} />
      </group>
    );
  }

  /* ====================================================================
     Nuwakot Durbar (Saat Tale): the tall seven-storey brick tower with dark carved windows, a timber lookout room and tiled roofs
     ==================================================================== */
  function NuwaMain() {
    const M = useM();
    const brick = M.mat('brick', 3, 4, { color: '#f0b088' });
    const brickLo = M.mat('brick', 4, 1, { color: '#f0b088' });
    const timber = M.mat('wood', 2, 1, { color: '#6a4a38' });
    const dk = M.plain('#2a1810');
    const roofM = M.mat('roof', 3, 3, { color: '#8a5e4c' });
    const W = 4.4;
    const D = 3.8;
    const sh = 0.95;
    const parts = [];
    let y = 0.3;
    for (let i = 0; i < 4; i += 1) {
      const w = W - i * 0.07;
      const d = D - i * 0.06;
      parts.push(<Box key={`s${i}`} s={[w, sh, d]} p={[0, y + sh / 2, 0]} m={brick} />);
      parts.push(<Box key={`c${i}`} s={[w + 0.08, 0.06, d + 0.08]} p={[0, y + sh, 0]} m={M.plain('#6a4a38')} cast={false} />);
      const n = i === 0 ? 2 : 3;
      for (let k = 0; k < n; k += 1) {
        const x = (k - (n - 1) / 2) * 1.25;
        parts.push(i === 0
          ? <Box key={`w${i}${k}`} s={[0.34, 0.4, 0.05]} p={[x, y + 0.6, d / 2 + 0.01]} m={dk} />
          : <LatticeWindow key={`w${i}${k}`} p={[x, y + 0.52, d / 2 + 0.01]} w={0.62} h={0.62} bars={6} />);
      }
      [-1, 1].forEach((sx) => [-0.8, 0.8].forEach((z) => parts.push(i === 0
        ? <Box key={`sw${i}${sx}${z}`} s={[0.05, 0.4, 0.34]} p={[sx * (w / 2 + 0.01), y + 0.6, z]} m={dk} />
        : <LatticeWindow key={`sw${i}${sx}${z}`} p={[sx * (w / 2 + 0.01), y + 0.52, z]} r={sx * Math.PI / 2} w={0.5} h={0.55} bars={5} />)));
      y += sh;
    }
    parts.push(<Doorway key="door" p={[0, 0.3, D / 2 + 0.02]} w={0.7} h={0.8} />);
    // timber balcony course with a small tiled pent roof
    parts.push(<Box key="bal" s={[W + 0.7, 0.16, D + 0.7]} p={[0, y + 0.08, 0]} m={timber} />);
    parts.push(<EaveStruts key="bst" w={W} d={D} y={y} n={6} h={0.5} />);
    parts.push(<Roof key="pent" w={W + 1.5} d={D + 1.5} h={0.4} y={y + 0.3} m={roofM} sag={1.1} lift={0.05} />);
    y += 0.5;
    for (let i = 0; i < 2; i += 1) {
      const w = W - 0.7 - i * 0.05;
      const d = D - 0.7 - i * 0.05;
      parts.push(<Box key={`u${i}`} s={[w, sh, d]} p={[0, y + sh / 2, 0]} m={brick} />);
      for (let k = 0; k < 4; k += 1) parts.push(<Box key={`uw${i}${k}`} s={[0.3, 0.36, 0.05]} p={[(k - 1.5) * 0.85, y + 0.55, d / 2 + 0.01]} m={dk} />);
      [-1, 1].forEach((sx) => [-0.6, 0.6].forEach((z) => parts.push(<Box key={`usw${i}${sx}${z}`} s={[0.05, 0.36, 0.3]} p={[sx * (w / 2 + 0.01), y + 0.55, z]} m={dk} />)));
      parts.push(<Box key={`uc${i}`} s={[w + 0.08, 0.06, d + 0.08]} p={[0, y + sh, 0]} m={M.plain('#6a4a38')} cast={false} />);
      y += sh;
    }
    // the timber lookout storey and its two roofs
    const lw = W - 1.5;
    const ld = D - 1.5;
    parts.push(<Box key="look" s={[lw, 0.85, ld]} p={[0, y + 0.425, 0]} m={timber} />);
    [[0, ld / 2 + 0.01, 0], [lw / 2 + 0.01, 0, Math.PI / 2], [0, -ld / 2 - 0.01, Math.PI], [-lw / 2 - 0.01, 0, -Math.PI / 2]].forEach(([x, z, r], k) => parts.push(<LatticeWindow key={`lk${k}`} p={[x, y + 0.45, z]} r={r} w={0.8} h={0.5} bars={6} />));
    parts.push(<EaveStruts key="lst" w={lw} d={ld} y={y + 0.85} n={3} h={0.45} />);
    parts.push(<Roof key="lr" w={lw + 1.5} d={ld + 1.5} h={0.55} y={y + 0.8} m={roofM} />);
    parts.push(<Box key="top" s={[lw * 0.6, 0.5, ld * 0.6]} p={[0, y + 1.3, 0]} m={timber} />);
    parts.push(<Roof key="tr" w={lw * 0.6 + 0.9} d={ld * 0.6 + 0.9} h={0.45} y={y + 1.5} m={roofM} />);
    parts.push(<Gajur key="gj" y={y + 1.88} s={0.6} />);
    return (
      <group>
        <Box s={[W + 0.9, 0.3, D + 0.9]} p={[0, 0.15, 0]} m={M.mat('granite', 3, 1, { color: '#b9ad98' })} />
        {parts}
        {/* the small white-based pagoda temple at the tower's side */}
        <group position={[6.4, 0, 2.2]}>
          <Box s={[2.6, 1.2, 2.6]} p={[0, 0.6, 0]} m={M.plain('#f4f0e6', { roughness: 0.85 })} />
          <Pag tiers={[{ w: 1.9, d: 1.9, h: 0.8, o: 0.7, rh: 0.5 }, { w: 1.4, d: 1.4, h: 0.65, o: 0.55, rh: 0.45 }]} y0={1.2} roof={M.mat('roof', 3, 3, { color: '#7a5848' })} wall={timber} strutN={3} finial={0.7} door={false} />
        </group>
        {/* Ranga Mahal and Garad Ghar, long brick ranges across the courtyard */}
        {[[-1.5, 0, -8.4, 0, 12], [-9.6, 0, 0.5, Math.PI / 2, 10]].map(([x, , z, r, len], k) => (
          <group key={k} position={[x, 0, z]} rotation={[0, r, 0]}>
            <Box s={[len, 2.9, 2.4]} p={[0, 1.45, 0]} m={brickLo} />
            {[0, 1].map((s) => Array.from({ length: Math.floor(len / 1.4) }, (_, j) => <LatticeWindow key={`${s}${j}`} p={[-len / 2 + 0.9 + j * 1.4, 0.9 + s * 1.2, 1.21]} w={0.5} h={0.55} bars={4} />))}
            <Roof w={len + 0.8} d={3.4} h={0.9} y={2.9} m={roofM} sag={1.15} lift={0.05} />
          </group>
        ))}
        <Frame s={[22, 9.8, 17]} p={[-1.5, 4.9, -1]} />
      </group>
    );
  }
  function NuwaEnv() {
    const M = useM();
    return (
      <group>
        <GroundDisc r={14} y={-0.012} m={M.plain('#a8bd72', { roughness: 1 })} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1, 0.004, 1]} receiveShadow material={M.mat('herring', 8, 8, { color: '#e9b49c' })}><planeGeometry args={[14, 10]} /></mesh>
        {slopeMound(M, 13.5, 0.55, 30, '#8aa862')}
        <GroundDisc r={95} y={-16.6} m={M.plain('#a8bc82', { roughness: 1 })} />
        <Tree p={[-4.4, 0, 5.2]} s={2.6} kind="broad" />
        <Town n={46} r0={15} r1={42} drop={0.55} skip={(a) => a > 0.05 && a < 1.5} colors={['#c98a68', '#d9a888', '#b87858', '#e0c4a0']} />
        <Woods n={16} r0={14} r1={26} y={(r) => -(r - 13.5) * 0.55} s0={1.2} broad={60} skip={(a) => a > 0.05 && a < 1.5} />
        {/* the snow range and the blue foothills behind the palace */}
        <Range n={8} R={46} y={-14} hMin={14} hMax={22} rock="#7088a0" snow={false} seed={4} />
        <Range n={9} R={74} y={-14} hMin={36} hMax={54} rock="#8890a8" cap={0.58} seed={8} />
      </group>
    );
  }

  /* ====================================================================
     Gosaikunda: dark glacial lake at 4,380 m in a bowl of grey rock and snow peaks, with cairns on islets and the Shiva shrine on the shore
     ==================================================================== */
  /** Irregular boulder geometry: an icosphere whose radius is jittered by position, so shared vertices stay joined. */
  const lumpGeo = (seed, detail = 2, amp = 0.28) => {
    const g = new THREE.IcosahedronGeometry(1, detail);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i); const y = pos.getY(i); const z = pos.getZ(i);
      const k = 1 + (rnd(x * 12.9 + y * 7.3 + z * 3.1, seed) - 0.5) * 2 * amp;
      pos.setXYZ(i, x * k, y * k, z * k);
    }
    g.computeVertexNormals();
    return g;
  };
  /** Jagged mountain: a jittered cone coloured per vertex, bare dark rock below and snow plastered high up. */
  const cragGeo = (r, h, seed, snowLine = 0.45, tone = 'dark') => {
    // own cone grid (every quad has two triangles; the stock cone drops half of them on tall tessellations)
    const RS = 26; const HS = 16;
    const pv = []; const iv = [];
    for (let j = 0; j <= HS; j += 1) for (let i = 0; i < RS; i += 1) { const a = (i / RS) * Math.PI * 2; const k = 1 - j / HS; pv.push(Math.cos(a) * r * k, -h / 2 + (h * j) / HS, Math.sin(a) * r * k); }
    for (let j = 0; j < HS; j += 1) for (let i = 0; i < RS; i += 1) { const a = j * RS + i; const b = j * RS + ((i + 1) % RS); const c = (j + 1) * RS + i; const d = (j + 1) * RS + ((i + 1) % RS); iv.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pv, 3));
    g.setIndex(iv);
    const pos = g.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const pal = { dark: ['#4f4c50', '#7b756f', '#f3f6fa'], blue: ['#5a6586', '#7f89a8', '#eef2f8'], dry: ['#8c7a58', '#b39d72', '#f3f6fa'] }[tone];
    const rockA = new THREE.Color(pal[0]); const rockB = new THREE.Color(pal[1]); const snow = new THREE.Color(pal[2]);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i += 1) {
      let x = pos.getX(i); let y = pos.getY(i); let z = pos.getZ(i);
      const t = (y + h / 2) / h;
      const hx = x * 11.7 + y * 5.3 + z * 9.1;
      if (t < 0.985) {
        const f = Math.max(r * (1 - t), r * 0.05) * 0.1;
        const th = Math.atan2(z, x);
        const mod = 1 + 0.22 * Math.sin(3 * th + seed * 2) + 0.14 * Math.sin(5 * th + seed);
        x *= mod;
        z *= mod;
        y += f * 0.3 * Math.sin(th * 4 + seed + t * 9);
        pos.setXYZ(i, x, y, z);
      }
      const s = t + 0.16 * Math.sin(Math.atan2(z, x) * 4 + seed);
      const k = Math.min(1, Math.max(0, (s - snowLine) / 0.16));
      c.copy(rockA).lerp(rockB, 0.5 + 0.5 * Math.sin(Math.atan2(z, x) * 5 + seed) * (1 - t)).lerp(snow, k * k * (3 - 2 * k));
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  };
  /** A snow-dusted crag; the geometry is cached by its parameters. */
  function Crag({ p, r, h, seed = 1, rot = 0, sz = 1, snowLine = 0.45, tone = 'dark' }) {
    const geo = useMemo(() => cragGeo(r, h, seed, snowLine, tone), [r, h, seed, snowLine, tone]);
    const m = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }), []);
    return <mesh geometry={geo} material={m} position={[p[0], p[1] + h / 2, p[2]]} rotation={[0, rot, 0]} scale={[1, 1, sz]} castShadow />;
  }
  /** A stone cairn: stacked flat grey stones tapering upward, as the pilgrims build in the shallows. */
  function Cairn({ p, s = 1, seed = 0 }) {
    const geos = useMemo(() => [0, 1, 2].map((k) => lumpGeo(seed * 3 + k + 40, 1, 0.22)), [seed]);
    const mats = useMemo(() => ['#8d8a86', '#6f6c69', '#a29f9a'].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 1, flatShading: true })), []);
    const n = 4 + Math.floor(rnd(seed, 1) * 5);
    let y = 0;
    const out = [];
    for (let i = 0; i < n; i += 1) {
      const w = (0.34 - i * (0.22 / n)) * (0.85 + rnd(seed + i, 2) * 0.3);
      const hh = 0.05 + rnd(seed + i, 5) * 0.05;
      out.push(<mesh key={i} geometry={geos[i % 3]} material={mats[(i + seed) % 3]} position={[(rnd(seed + i, 3) - 0.5) * 0.05, y + hh, (rnd(seed + i, 4) - 0.5) * 0.05]} rotation={[0, i * 1.7, 0]} scale={[w, hh, w * 0.85]} castShadow />);
      y += hh * 1.6;
    }
    return <group position={p} scale={s}>{out}</group>;
  }
  function GosaiMain() {
    const M = useM();
    const slabGeo = useMemo(() => lumpGeo(7, 2, 0.2), []);
    const bldGeo = useMemo(() => lumpGeo(11, 2, 0.3), []);
    const rock = M.plain('#7b7873', { roughness: 1, flatShading: true });
    const dkRock = M.plain('#58565a', { roughness: 1, flatShading: true });
    const snow = M.plain('#f1f4f8', { roughness: 0.8, flatShading: true });
    const white = M.plain('#ece8de', { roughness: 0.9 });
    const roofRed = M.plain('#8a3a2a', { roughness: 0.6, metalness: 0.3 });
    const isl = [[-5, -2, 2.0], [-1.5, -3.2, 1.5], [3, -1.6, 2.2], [6.5, -3, 1.4], [-7, -5, 1.6], [0.8, -6, 1.8], [5, -5.4, 1.2], [-3, 0.6, 1.3], [-2, -0.6, 0.9]];
    const cairns = [[-5, -2], [-4.4, -1.5], [-5.7, -2.4], [-1.5, -3.2], [-1.0, -3.4], [3, -1.6], [3.6, -1.9], [2.4, -1.3], [6.5, -3], [-7, -5], [-6.4, -4.6], [0.8, -6], [1.4, -5.8], [5, -5.4], [-3, 0.6], [-2, -0.6], [3.2, -2.2]];
    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -3]} scale={[1.25, 0.9, 1]} receiveShadow><circleGeometry args={[10, 48]} /><meshStandardMaterial color="#1c4a72" roughness={0.18} metalness={0.15} /></mesh>
        {/* flat stones and low islets rising from the water, each carrying cairns */}
        {isl.map(([x, z, s], k) => <mesh key={k} geometry={slabGeo} position={[x, -0.02, z]} scale={[s, 0.3, s * 0.8]} rotation={[0, k * 1.3, 0]} material={k % 2 ? rock : dkRock} castShadow receiveShadow />)}
        {cairns.map(([x, z], k) => <Cairn key={k} p={[x, 0.2, z]} s={1.5 + rnd(k, 3) * 0.9} seed={k + 1} />)}
        {/* the rocky near shore, dusted with snow */}
        {[[-8, 5.4, 4.6, 1.4, 3.2], [-1, 6.6, 5.4, 1.5, 3.4], [6.4, 5.8, 4.4, 1.2, 3.0], [-11.6, 1, 3.4, 1.6, 4], [10.6, 1.4, 3.4, 1.3, 3.6], [-13, -6, 3.2, 1.4, 3.4], [12.4, -6, 3.6, 1.4, 3.4]].map(([x, z, w, h, d], k) => (
          <group key={k}>
            <mesh geometry={bldGeo} position={[x, h * 0.2, z]} scale={[w, h, d]} rotation={[0, k * 0.9, 0]} material={k % 2 ? dkRock : rock} castShadow receiveShadow />
            <mesh geometry={bldGeo} position={[x, h * 0.78, z]} scale={[w * 0.62, h * 0.3, d * 0.6]} rotation={[0, k * 0.9, 0]} material={snow} />
          </group>
        ))}
        {/* the Shiva shrine on the shore: whitewashed cella, tiered tin roof, tridents and flags */}
        <group position={[-5.6, 0.7, 4.4]} scale={1.35}>
          <Box s={[2.0, 0.3, 2.0]} p={[0, 0.15, 0]} m={M.mat('granite', 1, 1, { color: '#b9b4aa' })} />
          <Box s={[1.3, 0.95, 1.3]} p={[0, 0.78, 0]} m={white} />
          <Box s={[0.46, 0.6, 0.06]} p={[0, 0.6, 0.66]} m={M.plain('#1a110c')} />
          <Box s={[1.6, 0.08, 1.6]} p={[0, 1.28, 0]} m={M.dark} />
          <mesh position={[0, 1.55, 0]} rotation={[0, Math.PI / 4, 0]} material={roofRed} castShadow><coneGeometry args={[1.25, 0.55, 4]} /></mesh>
          <Box s={[0.9, 0.5, 0.9]} p={[0, 1.7, 0]} m={white} />
          <mesh position={[0, 2.12, 0]} rotation={[0, Math.PI / 4, 0]} material={roofRed} castShadow><coneGeometry args={[0.8, 0.45, 4]} /></mesh>
          <mesh position={[0, 2.5, 0]} material={M.gold}><coneGeometry args={[0.05, 0.4, 8]} /></mesh>
          {[[-1.3, 0.4], [1.3, 0.6], [1.15, -0.6], [-1.2, -0.5]].map(([x, z], k) => <Trident key={k} p={[x, 0.3, z]} h={1.5 + (k % 2) * 0.5} />)}
          <PrayerFlags from={[1.3, 2.0, 0.6]} to={[-2.8, 0.9, -1.8]} n={12} />
          <PrayerFlags from={[-1.3, 1.9, 0.4]} to={[3.4, 0.7, -2.2]} n={12} />
        </group>
        <Frame s={[24, 3.4, 18]} p={[-1, 1.7, 0]} />
      </group>
    );
  }
  function GosaiEnv() {
    const M = useM();
    const rock = M.plain('#5b5855', { roughness: 1, flatShading: true });
    const snow2 = M.plain('#f1f4f8', { roughness: 0.8, flatShading: true });
    const scree = M.plain('#7f7b76', { roughness: 1 });
    const lump = useMemo(() => lumpGeo(23, 1, 0.3), []);
    const lodge = M.plain('#e8e4da', { roughness: 0.9 });
    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, -3]} material={M.plain('#1c4a72', { roughness: 0.18, metalness: 0.15 })} receiveShadow><circleGeometry args={[17, 48]} /></mesh>
        <GroundDisc r={44} y={-0.5} m={scree} />
        <GroundDisc r={140} y={-0.6} m={M.plain('#c9ccd2', { roughness: 1 })} />
        {/* snow patches and dark boulders strewn over the scree around the lake */}
        {Array.from({ length: 30 }, (_, i) => {
          const a = rnd(i, 1) * Math.PI * 2;
          const r = 17 + rnd(i, 2) * 18;
          const sc = 0.9 + rnd(i, 3) * 2.2;
          return <mesh key={`p${i}`} geometry={lump} position={[Math.cos(a) * r, -0.45, Math.sin(a) * r - 3]} scale={[sc * 1.5, 0.12, sc]} rotation={[0, i, 0]} material={snow2} />;
        })}
        {Array.from({ length: 34 }, (_, i) => {
          const a = rnd(i, 8) * Math.PI * 2;
          const r = 17.5 + rnd(i, 9) * 15;
          const sc = 0.6 + rnd(i, 10) * 1.5;
          return (
            <group key={`b${i}`} position={[Math.cos(a) * r, -0.3, Math.sin(a) * r - 3]}>
              <mesh geometry={lump} scale={[sc, sc * 0.6, sc * 0.8]} rotation={[0, i, 0]} material={rock} castShadow />
              {i % 3 === 0 && <mesh geometry={lump} position={[0, sc * 0.32, 0]} scale={[sc * 0.6, sc * 0.2, sc * 0.5]} rotation={[0, i, 0]} material={snow2} />}
            </group>
          );
        })}
        {/* a few lodges at the far end of the lake, as seen from the shrine */}
        {[[-8, -19], [-5.4, -19.8], [-2.6, -20], [0.4, -19.6]].map(([x, z], k) => (
          <group key={k} position={[x, -0.4, z]}>
            <Box s={[2.2, 1.0, 1.3]} p={[0, 0.5, 0]} m={lodge} />
            <Box s={[2.4, 0.12, 1.5]} p={[0, 1.05, 0]} m={M.plain(['#b4443a', '#2f6db5', '#b4443a', '#2e8b57'][k], { roughness: 0.6 })} />
          </group>
        ))}
        {/* the encircling ridges: tall at the back, shouldering lower toward the camera side so no view is walled in */}
        {Array.from({ length: 22 }, (_, i) => {
          const a = (i / 22) * Math.PI * 2 + (rnd(i, 1) - 0.5) * 0.15;
          const back = Math.max(0, -Math.sin(a));
          const R = 42 + rnd(i, 2) * 8;
          const h = 12 + back * 14 + rnd(i, 3) * 6;
          const px = Math.cos(a) * R * 1.25; const pz = Math.sin(a) * R - 3;
          return (
            <group key={i}>
              <Crag p={[px, -0.6, pz]} r={h * (0.42 + rnd(i, 4) * 0.12)} h={h} seed={i + 3} rot={rnd(i, 5) * 6} sz={0.85} snowLine={0.38} />
              <Crag p={[px + 0.45 * h * Math.cos(a + 1.6), -0.6, pz + 0.45 * h * Math.sin(a + 1.6)]} r={h * 0.3} h={h * 0.62} seed={i + 61} rot={rnd(i, 6) * 6} snowLine={0.5} />
            </group>
          );
        })}
        {Array.from({ length: 16 }, (_, i) => {
          const a = (i / 16) * Math.PI * 2 + 0.2 + (rnd(i, 7) - 0.5) * 0.2;
          const h = 26 + rnd(i, 8) * 16;
          const R = 84 + rnd(i, 9) * 10;
          return <Crag key={`f${i}`} p={[Math.cos(a) * R, -2, Math.sin(a) * R - 3]} r={h * 0.55} h={h} seed={i + 30} rot={rnd(i, 6) * 6} snowLine={0.3} />;
        })}
      </group>
    );
  }

  /* ====================================================================
     Dolakha Bhimsen: a roofless brick enclosure on its terrace, grille gate with stone guardians, the tall pillar behind
     ==================================================================== */
  function BhimMain() {
    const M = useM();
    const brick = M.mat('brick', 3, 1, { color: '#e8a58a' });
    const terr = M.mat('rock', 4, 1, { color: '#c9b898' });
    const orange = M.plain('#c8642a', { roughness: 0.6, metalness: 0.4 });
    const sandy = M.mat('granite', 1, 1, { color: '#c8a068' });
    const W = 8.6;
    const D = 6.4;
    const T = 1.7;
    const WH = 1.7;
    return (
      <group>
        {/* the terrace and the stairway climbing from the bazaar lane */}
        <Box s={[W + 1.4, T, D + 1.4]} p={[0, T / 2, 0]} m={terr} />
        <Stairs p={[0, 0, D / 2 + 0.7 + 3.4]} w={3.0} n={10} rise={T / 10} run={0.34} m={M.stone} />
        {/* enclosure walls (open to the sky) with a railing along the top */}
        <Box s={[W, WH, 0.45]} p={[0, T + WH / 2, -D / 2]} m={brick} />
        <Box s={[0.45, WH, D]} p={[-W / 2, T + WH / 2, 0]} m={brick} />
        <Box s={[0.45, WH, D]} p={[W / 2, T + WH / 2, 0]} m={brick} />
        {[-1, 1].map((k) => <Box key={k} s={[W / 2 - 1.55, WH, 0.45]} p={[k * (1.55 + (W / 2 - 1.55) / 2), T + WH / 2, D / 2]} m={brick} />)}
        {[-1, 1].map((k) => <group key={`gp${k}`} position={[k * 1.5, T, D / 2]}><Box s={[0.75, 2.6, 0.75]} p={[0, 1.3, 0]} m={brick} /><Box s={[0.9, 0.16, 0.9]} p={[0, 2.66, 0]} m={M.stone} /><Box s={[0.16, 0.24, 0.16]} p={[0, 2.86, 0]} m={M.gold} /></group>)}
        <Box s={[W + 0.2, 0.05, 0.05]} p={[0, T + WH + 0.5, D / 2]} m={orange} />
        {Array.from({ length: 15 }, (_, k) => <Box key={k} s={[0.04, 0.5, 0.04]} p={[-W / 2 + 0.2 + k * ((W - 0.4) / 14), T + WH + 0.25, D / 2]} m={orange} />)}
        <Box s={[W + 0.2, 0.05, 0.05]} p={[0, T + WH + 0.5, -D / 2]} m={orange} />
        {/* the orange grille gate, red drape with gold fringe above, hanging bells */}
        <Box s={[2.5, 1.8, 0.05]} p={[0, T + 0.9, D / 2]} m={orange} />
        {Array.from({ length: 9 }, (_, k) => <Box key={k} s={[0.03, 1.8, 0.07]} p={[-1.1 + k * 0.275, T + 0.9, D / 2 + 0.04]} m={M.plain('#8a3f1a')} cast={false} />)}
        <Box s={[2.6, 0.4, 0.1]} p={[0, T + 2.1, D / 2 + 0.1]} m={M.plain('#b3202a', { roughness: 1 })} />
        <Box s={[2.6, 0.05, 0.12]} p={[0, T + 1.9, D / 2 + 0.12]} m={M.gold} />
        {Array.from({ length: 7 }, (_, k) => <mesh key={k} position={[-1.05 + k * 0.35, T + 1.7, D / 2 + 0.2]} material={M.gold}><coneGeometry args={[0.07, 0.16, 8]} /></mesh>)}
        {[-1, 1].map((k) => <group key={k} position={[k * 2.15, T, D / 2 + 0.6]} scale={2.2}><Lion m={sandy} /></group>)}
        {/* the black triangular idol of Bhimsen, open to the sky, with red powder around */}
        <group position={[0, T, -1.0]}>
          <Cyl rt={0.9} rb={1.0} h={0.14} p={[0, 0.07, 0]} m={M.plain('#b8453a', { roughness: 1 })} seg={20} />
          <mesh position={[0, 0.7, 0]} rotation={[0, 0.5, 0]} material={M.plain('#1c1a1a', { roughness: 0.6 })} castShadow><coneGeometry args={[0.6, 1.2, 3]} /></mesh>
        </group>
        {/* the tall grey pillar with a gold band and the statue on top */}
        <group position={[0, T, 1.3]}>
          <Box s={[0.7, 0.3, 0.7]} p={[0, 0.15, 0]} m={M.stone} />
          <Cyl rt={0.22} rb={0.3} h={4.6} p={[0, 2.6, 0]} m={M.mat('granite', 1, 3, { color: '#7a7670' })} seg={14} />
          <Cyl rt={0.31} rb={0.31} h={0.35} p={[0, 3.3, 0]} m={M.plain('#d9a824', { roughness: 0.6 })} seg={14} />
          <Cyl rt={0.36} rb={0.22} h={0.3} p={[0, 5.05, 0]} m={M.mat('granite', 1, 1, { color: '#7a7670' })} seg={14} />
          <Ball rad={0.22} p={[0, 5.3, 0]} m={M.mat('granite', 1, 1, { color: '#7a7670' })} />
          <group position={[0, 5.4, 0]} scale={1.4}><Lion m={M.plain('#3a3a3a', { roughness: 0.6 })} /></group>
        </group>
        <PrayerFlags from={[0, 6.5, 1.3]} to={[-W / 2, T + WH + 0.5, D / 2]} n={16} />
        <PrayerFlags from={[0, 6.5, 1.3]} to={[W / 2, T + WH + 0.5, D / 2]} n={16} />
        <PrayerFlags from={[0, 6.5, 1.3]} to={[W / 2, T + WH + 0.5, -D / 2]} n={16} />
        <Frame s={[12, 7.4, 13]} p={[0, 3.7, 2.6]} />
      </group>
    );
  }
  function BhimEnv() {
    const M = useM();
    const wallC = ['#e0d6c4', '#cfc2a8', '#e8dcc2', '#c4b79c'];
    const tin = M.plain('#8a98a6', { roughness: 0.5, metalness: 0.4 });
    const Hs = ({ p, r = 0, w = 3, d = 2.4, h = 3, k = 0 }) => (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[w, h, d]} p={[0, h / 2, 0]} m={M.mat('plaster', 2, 1, { color: wallC[k % 4] })} />
        <Box s={[0.5, 0.5, 0.05]} p={[-w * 0.25, h * 0.55, d / 2 + 0.01]} m={M.dark} />
        <Box s={[0.5, 0.5, 0.05]} p={[w * 0.25, h * 0.55, d / 2 + 0.01]} m={M.dark} />
        <Roof w={w + 0.7} d={d + 0.7} h={0.7} y={h} m={k % 2 ? tin : M.mat('roof', 3, 3, { color: '#8a5e4c' })} sag={1.1} lift={0.04} />
      </group>
    );
    return (
      <group>
        <GroundDisc r={22} m={M.plain('#d9cfbe', { roughness: 0.95 })} />
        <GroundDisc r={95} y={-0.04} m={M.plain('#9fb872', { roughness: 1 })} />
        {/* old Dolakha bazaar: stone and brick houses with tin and tile roofs crowding the lane */}
        {ringOf(20, 17, (p, r, i) => <Hs key={i} p={p} r={r} w={3 + (i % 3) * 0.6} h={2.6 + (i % 3) * 1.1} k={i} />, (a) => (a > 0.15 && a < 1.45) || Math.abs(a - Math.PI / 2) < 0.4)}
        {ringOf(14, 24, (p, r, i) => <Hs key={`o${i}`} p={p} r={r} w={3.4} h={3.4 + (i % 2)} k={i + 1} />)}
        {[[-5.4, 12], [5.6, 12.8]].map(([x, z], k) => <Hs key={`l${k}`} p={[x, 0, z]} r={Math.PI} w={3} h={3} k={k} />)}
        {[[-7.6, 8.4], [8.4, 7.6], [-11, -2]].map(([x, z], k) => (
          <group key={k} position={[x, 0, z]}>
            <Cyl rt={0.16} rb={0.2} h={4.4} p={[0, 2.2, 0]} m={M.plain('#6a5040')} seg={8} />
            {[0, 1, 2, 3, 4].map((j) => <mesh key={j} position={[Math.cos(j * 1.26) * 0.7, 4.6, Math.sin(j * 1.26) * 0.7]} rotation={[0, 0, Math.cos(j * 1.26) * 0.5]} material={M.plain('#4d7a38', { roughness: 1 })}><boxGeometry args={[1.4, 0.06, 0.3]} /></mesh>)}
          </group>
        ))}
        <Range n={8} R={56} y={-1} hMin={14} hMax={26} rock="#5f8a52" snow={false} />
      </group>
    );
  }

  /* ====================================================================
     Kalinchowk Bhagawati: the small stone summit shrine at 3,842 m buried in flags and bells, a forest of iron tridents, the Himalayan range behind
     ==================================================================== */
  function Tri({ p, h = 2.6, tilt = 0, s = 1 }) {
    const M = useM();
    const m = M.plain('#1d1d1f', { roughness: 0.5, metalness: 0.6 });
    return (
      <group position={p} rotation={[0, 0, tilt]} scale={s}>
        <Cyl rt={0.025} h={h} p={[0, h / 2, 0]} m={m} seg={6} />
        <Box s={[0.34, 0.035, 0.035]} p={[0, h, 0]} m={m} />
        {[-0.17, 0.17].map((x) => <mesh key={x} position={[x, h + 0.15, 0]} rotation={[0, 0, -x * 1.2]} material={m}><coneGeometry args={[0.03, 0.34, 5]} /></mesh>)}
        <mesh position={[0, h + 0.22, 0]} material={m}><coneGeometry args={[0.035, 0.46, 5]} /></mesh>
      </group>
    );
  }
  function KalinMain() {
    const M = useM();
    const ground = M.plain('#bda676', { roughness: 1 });
    const rock = M.mat('rock', 2, 2, { color: '#8e8272', flatShading: true });
    const stone = M.mat('granite', 2, 1, { color: '#a89c8a' });
    const slate = M.mat('rock', 2, 1, { color: '#5e5a56' });
    const red = M.plain('#b3261e', { roughness: 1 });
    const iron = M.plain('#2c2b2d', { metalness: 0.7, roughness: 0.5 });
    const bellM = M.plain('#a8782e', { metalness: 0.75, roughness: 0.4 });
    const flagCols = ['#2f6db5', '#f2efe6', '#c0392b', '#2e8b57', '#e2b33c'];
    const flagMats = flagCols.map((c) => M.plain(c, { roughness: 1 }));
    return (
      <group>
        {/* the bare brown summit with scattered rocks */}
        <mesh position={[0, -0.6, 0]} scale={[6.4, 1.7, 5.8]} material={ground} receiveShadow castShadow><sphereGeometry args={[1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
        {[[-4.8, 1.6, 0.9], [5.0, -1.2, 1.0], [-3.4, -4.0, 0.8], [3.2, 4.6, 0.7], [-5.6, -1.6, 0.6], [4.4, -3.6, 0.7]].map(([x, z, s], k) => <mesh key={k} position={[x, 0.2, z]} scale={[s, s * 0.7, s * 0.9]} rotation={[0, k, 0]} material={rock} castShadow><icosahedronGeometry args={[1, 1]} /></mesh>)}
        {/* the tiny stone shrine: rough stone walls, a low slab roof, red-smeared, a dark doorway between stone lions */}
        <group position={[0, 0.2, 0]} scale={1.25}>
          <Box s={[2.4, 0.3, 2.2]} p={[0, 0.15, 0]} m={stone} />
          <Box s={[1.8, 1.15, 1.6]} p={[0, 0.87, 0]} m={stone} />
          <Box s={[0.9, 0.8, 0.06]} p={[0, 0.7, 0.82]} m={red} />
          <Box s={[0.5, 0.65, 0.07]} p={[0, 0.6, 0.84]} m={M.plain('#0f0a08')} />
          <mesh position={[0, 1.7, 0]} rotation={[0, Math.PI / 4, 0]} material={slate} castShadow><coneGeometry args={[1.5, 0.55, 4]} /></mesh>
          <Box s={[0.14, 0.3, 0.14]} p={[0, 2.08, 0]} m={bellM} />
          {[-0.85, 0.85].map((x) => <group key={x} position={[x, 0.3, 1.05]} scale={0.8}><Lion m={red} /></group>)}
          {/* red-smeared patches on the stone */}
          <Box s={[0.5, 0.45, 0.04]} p={[-0.55, 1.0, 0.82]} m={red} cast={false} />
          <Box s={[0.4, 0.5, 0.04]} p={[0.58, 1.1, 0.82]} m={red} cast={false} />
          <Box s={[0.04, 0.5, 0.6]} p={[0.91, 1.0, 0.1]} m={red} cast={false} />
          {/* flags piled and knotted over the roof and walls */}
          {Array.from({ length: 26 }, (_, k) => {
            const a = rnd(k, 1) * Math.PI * 2;
            const rr = 0.5 + rnd(k, 2) * 0.9;
            return <mesh key={k} position={[Math.cos(a) * rr, 1.5 + rnd(k, 3) * 0.7, Math.sin(a) * rr * 0.9]} rotation={[rnd(k, 4) * 0.8, rnd(k, 5) * 3, rnd(k, 6) * 0.8]} material={flagMats[k % 5]}><planeGeometry args={[0.5, 0.36]} /></mesh>;
          })}
        </group>
        {/* the cage of iron rods and hanging bells that wraps the shrine */}
        {Array.from({ length: 12 }, (_, k) => {
          const a = (k / 12) * Math.PI * 2 + 0.26;
          return a % (Math.PI * 2) > 1.2 && a % (Math.PI * 2) < 1.95 ? null : <Cyl key={k} rt={0.035} h={2.3} p={[Math.cos(a) * 1.75, 1.15, Math.sin(a) * 1.55]} m={iron} seg={6} />;
        })}
        {[0, 1].map((lv) => <mesh key={lv} position={[0, 2.1 - lv * 0.5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1.75, 1.55, 1]} material={iron}><torusGeometry args={[1, 0.02, 6, 36]} /></mesh>)}
        {Array.from({ length: 80 }, (_, k) => {
          const a = (k / 80) * Math.PI * 2 + 0.05;
          const lv = k % 2;
          const y = 2.05 - lv * 0.5 - 0.1 - (k % 3) * 0.12;
          return (
            <group key={k} position={[Math.cos(a) * 1.75, y, Math.sin(a) * 1.55]}>
              <mesh material={bellM} castShadow><coneGeometry args={[0.07, 0.13, 8]} /></mesh>
              <Cyl rt={0.006} h={0.14} p={[0, 0.12, 0]} m={iron} seg={4} />
            </group>
          );
        })}
        {/* the forest of black iron tridents, thickest at the shrine */}
        {Array.from({ length: 34 }, (_, i) => {
          const a = rnd(i, 1) * Math.PI * 2;
          const r = 1.9 + rnd(i, 2) * 2.4;
          return <Tri key={i} p={[Math.cos(a) * r * 1.1, 0.3, Math.sin(a) * r]} h={1.6 + rnd(i, 3) * 1.8} tilt={(rnd(i, 4) - 0.5) * 0.35} />;
        })}
        {/* dense strings of prayer flags knotted from the shrine and tridents to the rim */}
        {Array.from({ length: 10 }, (_, k) => {
          const a = (k / 10) * Math.PI * 2 + 0.4;
          return <PrayerFlags key={k} from={[Math.cos(a) * 0.5, 2.5, Math.sin(a) * 0.5]} to={[Math.cos(a) * 4.8, 1.0, Math.sin(a) * 4.3]} n={16} />;
        })}
        {/* black bell frame and the pipe railing at the edge of the summit */}
        <BellFrame p={[3.6, 0.5, 2.6]} r={0.5} s={1.2} col="#161618" />
        {Array.from({ length: 14 }, (_, k) => {
          const a = Math.PI * (0.02 + (k / 13) * 0.95);
          return <Cyl key={k} rt={0.035} h={1.0} p={[Math.cos(a) * 5.3, 0.2 + 0.5, Math.sin(a) * 4.8]} m={iron} seg={6} />;
        })}
        <mesh position={[0, 0.9, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[5.3, 4.8, 1]} material={iron}><torusGeometry args={[1, 0.02, 6, 40, Math.PI * 0.95]} /></mesh>
        {/* the stone steps climbing from Kuri */}
        <Stairs p={[0.4, -0.5, 7.4]} w={1.5} n={5} rise={0.12} run={0.5} m={stone} />
        <Frame s={[12, 5, 12]} p={[0, 2.5, 0.5]} />
      </group>
    );
  }
  function KalinEnv() {
    const M = useM();
    return (
      <group>
        <mesh position={[0, -9.2, 0]} material={M.plain('#bda676', { roughness: 1 })} receiveShadow><cylinderGeometry args={[6, 44, 18.4, 56]} /></mesh>
        <GroundDisc r={140} y={-18.6} m={M.plain('#8a8a62', { roughness: 1 })} />
        {/* dry brown grass and dark scrub; pines on the far slope */}
        {Array.from({ length: 30 }, (_, i) => {
          const a = rnd(i, 1) * Math.PI * 2;
          const r = 20 + rnd(i, 2) * 17;
          return <Fir key={i} p={[Math.cos(a) * r, -((r - 6) / 30) * 18.4 + 0.2, Math.sin(a) * r]} s={1.4 + rnd(i, 3) * 0.8} c="#2c4a34" />;
        })}
        {/* the brown ridges either side, then the hazy snow range across the valley */}
        <Crag p={[-62, -18, -52]} r={30} h={24} seed={71} snowLine={1.2} tone="dry" />
        <Crag p={[58, -18, -60]} r={32} h={22} seed={73} snowLine={1.2} tone="dry" />
        {Array.from({ length: 13 }, (_, i) => {
          const a = Math.PI * (0.1 + (i / 12) * 0.8);
          const h = 38 + rnd(i, 3) * 26;
          return <Crag key={`h${i}`} p={[Math.cos(a) * 135, -18, -Math.sin(a) * 125]} r={h * 0.5} h={h} seed={i + 80} rot={rnd(i, 4) * 6} snowLine={0.6} tone="blue" />;
        })}
        {Array.from({ length: 8 }, (_, i) => {
          const a = Math.PI * (0.08 + (i / 7) * 0.84);
          const h = 12 + rnd(i, 5) * 9;
          return <Crag key={`m${i}`} p={[Math.cos(a) * 88, -18, -Math.sin(a) * 82]} r={h * 1.2} h={h} seed={i + 90} rot={rnd(i, 4) * 6} snowLine={1.2} tone="dry" />;
        })}
      </group>
    );
  }

  /* ====================================================================
     Namo Buddha: the white stupa on its stepped square base, golden railing, bottle-shaped chaityas, radial prayer flags
     ==================================================================== */
  function NamoMain() {
    const M = useM();
    const white = M.plain('#f6f2ea', { roughness: 0.85 });
    const wall = M.plain('#f1ece0', { roughness: 0.9 });
    const gold = M.gold;
    const eyes = useMemo(() => K.eyesTexture(), []);
    const harm = useMemo(() => new THREE.MeshStandardMaterial({ map: eyes, roughness: 0.8 }), [eyes]);
    const rail = M.plain('#c99a2a', { metalness: 0.6, roughness: 0.4 });
    const Chorten = ({ p, s = 1, tall = 1 }) => (
      <group position={p} scale={s}>
        <Box s={[0.9, 0.35, 0.9]} p={[0, 0.17, 0]} m={white} />
        <Box s={[0.7, 0.25, 0.7]} p={[0, 0.47, 0]} m={white} />
        <Ball rad={0.42} sc={[1, 1.05, 1]} p={[0, 0.9, 0]} m={white} />
        <Cyl rt={0.22} rb={0.3} h={0.3} p={[0, 1.38, 0]} m={white} seg={12} />
        <mesh position={[0, 1.62 + 0.45 * tall, 0]} material={white} castShadow><coneGeometry args={[0.2, 0.9 * tall, 12]} /></mesh>
        <mesh position={[0, 2.2 + 0.45 * tall, 0]} material={gold}><coneGeometry args={[0.07, 0.26, 8]} /></mesh>
      </group>
    );
    const posts = [];
    const R = 4.4;
    for (let k = 0; k <= 20; k += 1) { const t = (k / 20) * 8 - 4; [[t, R], [t, -R], [R, t], [-R, t]].forEach(([x, z], j) => { if (k % 4 === 0) posts.push(<Cyl key={`${k}${j}`} rt={0.04} h={1.0} p={[x, 0.95, z]} m={rail} seg={6} />); }); }
    return (
      <group>
        <Box s={[12, 0.3, 12]} p={[0, 0.15, 0]} m={M.plain('#d9d0c0', { roughness: 0.95 })} />
        {/* the whitewashed base wall, three stepped square tiers */}
        <Box s={[9.2, 0.9, 9.2]} p={[0, 0.75, 0]} m={wall} />
        <Box s={[5.4, 0.4, 5.4]} p={[0, 1.4, 0]} m={white} />
        <Box s={[4.6, 0.4, 4.6]} p={[0, 1.8, 0]} m={white} />
        <Box s={[3.8, 0.4, 3.8]} p={[0, 2.2, 0]} m={white} />
        <mesh position={[0, 2.4, 0]} scale={[1, 0.95, 1]} material={white} castShadow receiveShadow><sphereGeometry args={[1.55, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
        <Box s={[1.05, 0.18, 1.05]} p={[0, 3.95, 0]} m={white} />
        <mesh position={[0, 4.42, 0]} castShadow material={[white, white, white, white, harm, harm]}><boxGeometry args={[0.9, 0.78, 0.9]} /></mesh>
        <mesh position={[0, 4.42, 0]} rotation={[0, Math.PI / 2, 0]} material={[white, white, white, white, harm, harm]}><boxGeometry args={[0.901, 0.78, 0.901]} /></mesh>
        {Array.from({ length: 13 }, (_, i) => <Cyl key={i} rt={0.4 - i * 0.022} rb={0.43 - i * 0.022} h={0.12} p={[0, 4.92 + i * 0.125, 0]} m={i < 9 ? white : gold} seg={20} />)}
        <mesh position={[0, 6.7, 0]} material={gold}><coneGeometry args={[0.36, 0.2, 20]} /></mesh>
        <Gajur y={6.75} s={0.7} />
        {/* golden-yellow railing round the base, with prayer wheels behind */}
        {posts}
        {[0.62, 1.4].map((y) => <Box key={y} s={[R * 2, 0.04, 0.04]} p={[0, y + 0.3, R]} m={rail} cast={false} />)}
        {[0.62, 1.4].map((y) => <Box key={`b${y}`} s={[R * 2, 0.04, 0.04]} p={[0, y + 0.3, -R]} m={rail} cast={false} />)}
        {[0.62, 1.4].map((y) => <Box key={`l${y}`} s={[0.04, 0.04, R * 2]} p={[-R, y + 0.3, 0]} m={rail} cast={false} />)}
        {[0.62, 1.4].map((y) => <Box key={`r${y}`} s={[0.04, 0.04, R * 2]} p={[R, y + 0.3, 0]} m={rail} cast={false} />)}
        {/* the little bottle-shaped chaityas on the base, and a pair on the ground */}
        {[[-3.6, -3.6], [-1.8, -3.9], [3.6, -3.6], [3.9, -1.2], [-3.8, 1.6], [3.8, 2.2]].map(([x, z], k) => <Chorten key={k} p={[x, 1.2, z]} s={0.9} tall={1 + (k % 2) * 0.3} />)}
        {[[-5.4, 5.4], [5.4, 5.2]].map(([x, z], k) => <Chorten key={`g${k}`} p={[x, 0.3, z]} s={1.0} />)}
        {/* flags radiating from the top */}
        {Array.from({ length: 12 }, (_, k) => {
          const a = (k / 12) * Math.PI * 2 + 0.2;
          return <PrayerFlags key={k} from={[0, 6.8, 0]} to={[Math.cos(a) * 8.2, 0.6, Math.sin(a) * 8.2]} n={22} />;
        })}
        <Stairs p={[0, 0, 7.2]} w={2.4} n={3} rise={0.1} run={0.3} m={M.stone} />
        <Frame s={[17, 8, 17]} p={[0, 4, 0]} />
      </group>
    );
  }
  function NamoEnv() {
    const M = useM();
    const gm = M.plain('#b8861f', { metalness: 0.7, roughness: 0.35 });
    return (
      <group>
        <mesh position={[0, -4.02, 0]} material={M.plain('#7fa05a', { roughness: 1 })} receiveShadow><cylinderGeometry args={[11, 26, 8, 52]} /></mesh>
        <GroundDisc r={95} y={-8} m={M.plain('#a8bc82', { roughness: 1 })} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow material={M.plain('#d9d0c0', { roughness: 0.95 })}><circleGeometry args={[11, 40]} /></mesh>
        {/* the golden-roofed Thrangu Tashi Yangtse monastery on the hill behind */}
        <group position={[-9, 0, -11]} rotation={[0, 0.5, 0]}>
          <Box s={[6, 2.6, 4.4]} p={[0, 1.3, 0]} m={M.plain('#f1e8d6', { roughness: 0.85 })} />
          <Box s={[6.1, 0.5, 4.5]} p={[0, 2.35, 0]} m={M.plain('#a03a2a', { roughness: 0.85 })} />
          {[-1.6, 0, 1.6].map((x) => <Box key={x} s={[0.8, 1.1, 0.06]} p={[x, 1.0, 2.23]} m={M.plain('#7a2a1a')} />)}
          <Roof w={6.8} d={5.2} h={0.9} y={2.6} m={gm} sag={1.25} />
          <Box s={[3, 0.8, 2.4]} p={[0, 3.2, 0]} m={M.plain('#a03a2a', { roughness: 0.85 })} />
          <Roof w={3.8} d={3.2} h={0.7} y={3.55} m={gm} sag={1.25} />
          <Gajur y={4.1} s={0.6} />
        </group>
        {/* monks' houses, trees on the ridge and a stairway climbing the hillside */}
        {ringOf(9, 17, (p, r, i) => <group key={i} position={[p[0], -((17 - 11) / 15) * 8 + 0.3, p[2]]} rotation={[0, r, 0]}>
          <Box s={[2.4, 2.4 + (i % 2), 2]} p={[0, 1.4, 0]} m={M.plain(i % 2 ? '#8a2a22' : '#f1e8d6', { roughness: 0.85 })} />
          <Roof w={3} d={2.6} h={0.6} y={2.6 + (i % 2)} m={M.plain('#8a98a6', { metalness: 0.4, roughness: 0.5 })} sag={1.1} lift={0.03} />
        </group>, (a) => (a > 0.05 && a < 1.6) || (a > 3.5 && a < 4.5))}
        {Array.from({ length: 56 }, (_, i) => {
          const a = rnd(i, 1) * Math.PI * 2;
          const r = 12 + rnd(i, 2) * 16;
          if (r < 17 && a > 0.1 && a < 1.5) return null;
          return <Fir key={i} p={[Math.cos(a) * r, -((r - 11) / 15) * 8, Math.sin(a) * r]} s={1.3 + rnd(i, 3) * 0.9} c={rnd(i, 4) > 0.5 ? '#2f5a3a' : '#3f6a3c'} />;
        })}
        <Range n={9} R={68} y={-7} hMin={20} hMax={34} rock="#7088a0" snow cap={0.4} />
      </group>
    );
  }

  return {
    'nuwakot-durbar': { Main: NuwaMain, Env: NuwaEnv },
    'gosaikunda': { Main: GosaiMain, Env: GosaiEnv },
    'dolakha-bhimsen-temple': { Main: BhimMain, Env: BhimEnv },
    'kalinchowk-bhagawati': { Main: KalinMain, Env: KalinEnv },
    'namobuddha': { Main: NamoMain, Env: NamoEnv },
    'indreshwar-mahadev-panauti': { Main: IndraMain, Env: IndraEnv },
    'chandeshwori-temple-banepa': { Main: ChandeshMain, Env: ChandeshEnv },
    'palanchok-bhagawati': { Main: PalanMain, Env: PalanEnv },
    'sheshnarayan-temple': { Main: SheshMain, Env: SheshEnv },
    'doleshwor-mahadev': { Main: DolesMain, Env: DolesEnv },
    'uma-maheshwar-kirtipur': { Main: UmaMain, Env: UmaEnv },
    'balkumari-temple-thimi': { Main: BalkumariMain, Env: BalkumariEnv },
    'bhairabi-temple-nuwakot': { Main: BhairabiMain, Env: BhairabiEnv },
    'bajrayogini-temple-sankhu': { Main: BajraMain, Env: BajraEnv },
    'akash-bhairab-temple': { Main: AkashMain, Env: AkashEnv },
  };
}
