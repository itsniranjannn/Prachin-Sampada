// Hand-built landmarks for the Bagmati / valley-rim and hill sites. See the brief: export a function taking the kit K and returning { slug: { Main, Env } }.
export default function make(K) {
  const {
    useM, Box, Cyl, Ball, Roof, Gajur, Lion, Elephant, Spire, Tree, Chaitya, Nandi, Lingam, Trident, PrayerFlags, LatticeWindow,
    EaveStruts, Doorway, NewarHouse, Frame, Water, GroundDisc, ringOf, roofMat, THREE, TIMBER,
  } = K;

  /* ---------- shared helpers ---------- */
  const rnd = (i, k = 0) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
  const pagTop = (tiers, y0 = 0) => tiers.reduce((y, t) => y + t.h + (t.rh || 0.6) * 0.6, y0) + 0.4 * (tiers[tiers.length - 1].rh || 0.6) - 0.05;

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
    tiers, y0 = 0, roof, wall, fringe = null, open = false, door = true, goldDoor = false, win = true, strutN, bells = true,
    finial = 1, rail = false, peacock = false, timber, cellaM,
  }) {
    const M = useM();
    const wood = timber || M.plain(TIMBER, { roughness: 0.8 });
    const dk = M.plain('#2a1810');
    const out = [];
    let y = y0;
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
    if (finial) out.push(<Gajur key="gj" y={pagTop(tiers, y0) - 0.02} s={finial} />);
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
    const rk = M.mat('rock', 4, 4, { color: rock });
    return (
      <group>
        {Array.from({ length: n }, (_, i) => {
          const th = Math.PI * (a0 + ((a1 - a0) * i) / (n - 1));
          const h = hMin + rnd(i, seed) * (hMax - hMin);
          return <Mountain key={i} p={[Math.cos(th) * R * (1 + rnd(i, seed + 3) * 0.12), y, -Math.sin(th) * R * (1 + rnd(i, seed + 3) * 0.12)]} r={h * (0.4 + rnd(i, seed + 5) * 0.25)} h={h} rock={rk} sn={snow} cap={cap} />;
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
    <mesh position={[0, -(drop * span) / 2 - 0.02, 0]} material={M.mat('grass', 10, 5, { color: col })} receiveShadow>
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
      <mesh position={p} scale={[r * sx, h, r * sz]} material={M.mat('grass', 6, 3, { color: col })} receiveShadow castShadow>
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
    const roofM = M.mat('roof', 3, 3, { color: '#6a5046' });
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
        <GroundDisc r={90} y={-13.6} m={M.mat('grass', 30, 30, { color: '#b0c188' })} />
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
     Balkumari, Thimi: three dark roofs, long silver-gilt banner, peacocks at the corners and on the pillar
     ==================================================================== */
  function BalkumariMain() {
    const M = useM();
    const wall = M.mat('brick', 2, 1, { color: '#8a5a48' });
    const roofM = M.mat('roof', 3, 3, { color: '#6a4a3c' });
    const brick = M.mat('brick', 3, 0.5, { color: '#f0b69a' });
    const tiers = [{ w: 3.0, d: 3.0, h: 1.2, o: 0.85, rh: 0.62 }, { w: 2.3, d: 2.3, h: 0.85, o: 0.75, rh: 0.55 }, { w: 1.6, d: 1.6, h: 0.7, o: 0.62, rh: 0.5 }];
    const top = pagTop(tiers, 0.55);
    const silver = M.plain('#cfd2d6', { metalness: 0.9, roughness: 0.3 });
    const brass = M.plain('#9a7a3a', { metalness: 0.8, roughness: 0.35 });
    return (
      <group>
        <Box s={[5.6, 0.3, 5.6]} p={[0, 0.15, 0]} m={brick} />
        <Box s={[4.6, 0.25, 4.6]} p={[0, 0.42, 0]} m={brick} />
        <Stairs p={[0, 0, 3.4]} w={1.5} n={4} rise={0.1375} run={0.18} m={M.stone} />
        <Pag tiers={tiers} y0={0.55} roof={roofM} wall={wall} fringe="#7a1f1f" goldDoor peacock strutN={4} finial={0.9} />
        {/* the great pataka banner hanging from the pinnacle to the plinth */}
        <group position={[0, top - 0.2, 0.6]} rotation={[0.2, 0, 0]}>
          {[-0.1, 0, 0.1].map((x, k) => <Box key={x} s={[0.07, top - 0.3, 0.02]} p={[x, -(top - 0.3) / 2, 0]} m={k === 1 ? brass : silver} cast={false} />)}
        </group>
        {/* the peacock on its stone pillar */}
        <group position={[2.2, 0, 4.6]}>
          <Box s={[0.5, 0.3, 0.5]} p={[0, 0.15, 0]} m={M.stone} />
          <Cyl rt={0.14} rb={0.18} h={2.8} p={[0, 1.7, 0]} m={M.mat('granite', 1, 3, { color: '#8a8478' })} seg={10} />
          <Box s={[0.4, 0.14, 0.4]} p={[0, 3.12, 0]} m={M.stone} />
          <Peacock p={[0, 3.2, 0]} s={2.2} m={M.gold} />
        </group>
        {/* Bhairav's small shrine in the compound */}
        <group position={[-4.6, 0, 1.4]} scale={0.6}>
          <Box s={[3.2, 0.3, 3.2]} p={[0, 0.15, 0]} m={brick} />
          <Pag tiers={[{ w: 2.0, d: 2.0, h: 1.0, o: 0.6, rh: 0.5 }]} y0={0.3} roof={roofM} wall={wall} fringe="#7a1f1f" door finial={0.9} />
        </group>
        {[[3.6, 3.4], [-3.6, 4.2]].map(([x, z], k) => <Chaitya key={k} p={[x, 0, z]} s={0.8} />)}
        <Frame s={[12, 7.4, 12]} p={[0, 3.7, 1.2]} />
      </group>
    );
  }
  function BalkumariEnv() {
    const M = useM();
    const tints = ['#d4725a', '#e8946a', '#c85a46', '#d98a62', '#c9664e'];
    return (
      <group>
        <GroundDisc r={25} m={M.mat('herring', 14, 14, { color: '#efbca4' })} />
        <GroundDisc r={90} y={-0.04} m={M.mat('grass', 30, 30, { color: '#b8c890' })} />
        {ringOf(26, 21, (p, r, i) => <NewarHouse key={i} p={p} r={r} w={2.4 + (i % 3) * 0.3} d={2} storeys={3 + (i % 2)} tint={tints[i % tints.length]} detail={i % 2 === 0} shop={false} />, (a) => Math.abs(a - Math.PI / 2) < 0.28)}
        {ringOf(14, 27, (p, r, i) => <NewarHouse key={`o${i}`} p={p} r={r} w={2.6} d={2.2} storeys={4} tint={tints[(i + 2) % tints.length]} detail={false} shop={false} />)}
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
    const lower = M.mat('roof', 4, 4, { color: '#8f6a4c' });
    const upper = M.plain('#b89048', { metalness: 0.7, roughness: 0.4 });
    const brick = M.mat('brick', 3, 0.5, { color: '#e8a58a' });
    return (
      <group>
        <Box s={[7, 0.3, 7]} p={[0, 0.15, 0]} m={brick} />
        <Pag tiers={[{ w: 3.0, d: 3.0, h: 1.1, o: 1.35, rh: 0.8 }]} y0={0.3} roof={lower} wall={wall} fringe="#b32a22" strutN={5} finial={0} bells />
        <Pag tiers={[{ w: 1.9, d: 1.9, h: 0.95, o: 0.85, rh: 0.6 }]} y0={0.3 + 1.1 + 0.48} roof={upper} wall={wall} fringe="#b32a22" strutN={3} finial={0.8} door={false} bells={false} />
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
        <GroundDisc r={90} y={-9} m={M.mat('grass', 30, 30, { color: '#a8b880' })} />
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
        <Town n={36} r0={13} r1={30} drop={0.34} skip={(a) => Math.abs(a - Math.PI / 2) < 0.35} colors={['#c9a890', '#e0c8a8', '#a8603f', '#d8d0c0']} />
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
        <mesh position={[0, -7.02, 0]} material={M.mat('grass', 10, 5, { color: '#6f8f55' })} receiveShadow><cylinderGeometry args={[9, 30, 14, 56]} /></mesh>
        <GroundDisc r={95} y={-14} m={M.mat('grass', 30, 30, { color: '#7f9a5a' })} />
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
    const dark = M.mat('wood', 3, 1, { color: '#5a4034' });
    const brass = M.plain('#b08d57', { metalness: 0.7, roughness: 0.35 });
    const roofM = M.mat('roof', 4, 4, { color: '#7a5848' });
    const brick = M.mat('brick', 3, 1.5, { color: '#d9937a' });
    const goldM = M.gold;
    const W = 8.4;
    const D = 5.4;
    return (
      <group>
        {/* ground floor: shops behind a brass-fronted bay */}
        <Box s={[W, 1.15, D]} p={[0, 0.575, 0]} m={brick} />
        {[-3, -1.9, 1.9, 3].map((x) => <Box key={x} s={[0.9, 0.85, 0.06]} p={[x, 0.55, D / 2 + 0.02]} m={M.dark} />)}
        <Box s={[2.4, 1.0, 0.1]} p={[0, 0.55, D / 2 + 0.05]} m={brass} />
        <mesh position={[0, 1.15, D / 2 + 0.08]} material={goldM}><torusGeometry args={[0.95, 0.07, 8, 24, Math.PI]} /></mesh>
        <Box s={[W + 0.3, 0.1, 0.5]} p={[0, 1.18, D / 2 + 0.1]} m={dark} />
        {/* first storey: carved dark timber, windows in a row, a balcony ledge with little gilded animals */}
        <Box s={[W - 0.3, 1.15, D - 0.3]} p={[0, 1.73, 0]} m={dark} />
        {Array.from({ length: 6 }, (_, k) => <LatticeWindow key={k} p={[-3.3 + k * 1.32, 1.82, (D - 0.3) / 2 + 0.01]} w={0.75} h={0.6} bars={5} />)}
        <Box s={[W, 0.08, 0.5]} p={[0, 1.2, D / 2 + 0.2]} m={dark} />
        {Array.from({ length: 7 }, (_, k) => <Ball key={k} rad={0.09} sc={[0.8, 1.2, 1.3]} p={[-3.6 + k * 1.2, 1.38, D / 2 + 0.26]} m={goldM} />)}
        <Box s={[W + 0.2, 0.18, D + 0.2]} p={[0, 2.35, 0]} m={M.dark} />
        {/* second storey and the great hipped roof */}
        <Box s={[W - 0.8, 0.9, D - 0.9]} p={[0, 2.88, 0]} m={dark} />
        {Array.from({ length: 5 }, (_, k) => <LatticeWindow key={k} p={[-2.9 + k * 1.45, 2.9, (D - 0.9) / 2 + 0.01]} w={0.7} h={0.5} bars={5} />)}
        <EaveStruts w={W - 0.8} d={D - 0.9} y={3.3} n={7} h={0.55} />
        <Roof w={W + 1.8} d={D + 1.6} h={1.1} y={3.28} m={roofM} sag={1.25} lift={0.1} />
        <Fringe w={W + 1.8} d={D + 1.6} y={3.2} color="#a8262a" h={0.2} />
        <Box s={[3.6, 0.5, 2.4]} p={[0, 4.55, 0]} m={dark} />
        <Roof w={5.2} d={3.8} h={0.7} y={4.76} m={roofM} sag={1.25} lift={0.1} />
        <Gajur y={5.4} s={0.7} />
        {/* torana over the shrine and the long gilded banner */}
        <group position={[0, 2.6, D / 2 + 0.3]}>
          <mesh material={goldM}><torusGeometry args={[0.5, 0.07, 8, 24, Math.PI]} /></mesh>
          <Box s={[0.12, 0.5, 0.1]} p={[-0.5, -0.25, 0]} m={goldM} />
          <Box s={[0.12, 0.5, 0.1]} p={[0.5, -0.25, 0]} m={goldM} />
        </group>
        <group position={[0, 5.3, 0.4]} rotation={[0.55, 0, 0]}><Box s={[0.14, 3.2, 0.03]} p={[0, -1.6, 0]} m={goldM} cast={false} /></group>
        {/* the brass lions at the door */}
        {[-1.5, 1.5].map((x) => <group key={x} position={[x, 0, D / 2 + 0.7]} scale={1.6}><Lion m={goldM} /></group>)}
        {/* shop awning */}
        <mesh position={[0, 1.55, D / 2 + 1.1]} rotation={[0.35, 0, 0]} material={M.plain('#6a8a5a', { roughness: 0.9 })}><boxGeometry args={[W, 0.04, 1.5]} /></mesh>
        <Frame s={[13, 6.2, 9.6]} p={[0, 3.1, 1]} />
      </group>
    );
  }
  function AkashEnv() {
    const M = useM();
    const cols = ['#d9a08a', '#c9d6dc', '#e8d8c0', '#b8c4d8', '#e6c4cc', '#d8cfa0'];
    return (
      <group>
        <GroundDisc r={30} m={M.mat('stone', 10, 10, { color: '#cfc7bb' })} />
        <GroundDisc r={90} y={-0.04} m={M.mat('stone', 30, 30, { color: '#b0aaa0' })} />
        {/* busy modern blocks, signboards, and the crossing street to the front */}
        {ringOf(26, 20, (p, r, i) => {
          const h = 4 + (i % 4) * 1.4;
          return (
            <group key={i} position={p} rotation={[0, r, 0]}>
              <Box s={[3.4, h, 3]} p={[0, h / 2, 0]} m={M.plain(cols[i % cols.length], { roughness: 0.9 })} />
              {Array.from({ length: Math.floor(h / 1.3) }, (_, s) => [-1, 0, 1].map((x) => <Box key={`${s}${x}`} s={[0.6, 0.6, 0.05]} p={[x * 1, 1.2 + s * 1.2, -1.52]} m={M.plain('#6a7a8a')} />))}
              <Box s={[3.2, 0.5, 0.12]} p={[0, 1.1, -1.55]} m={M.plain(['#c0392b', '#2b4c8c', '#f2f2f2', '#d9a824'][i % 4])} />
            </group>
          );
        }, (a) => Math.abs(a - Math.PI / 2) < 0.26 || Math.abs(a) < 0.15)}
        {ringOf(12, 27, (p, r, i) => <Box key={`b${i}`} s={[4, 8 + (i % 3) * 2, 3.4]} p={[p[0], 4 + (i % 3), p[2]]} r={[0, r, 0]} m={M.plain(cols[(i + 2) % cols.length], { roughness: 0.9 })} />)}
        {[[6.6, 7.4], [-6.8, 7], [10, 3]].map(([x, z], k) => <Pole key={k} p={[x, 0, z]} h={5.2} />)}
        {[[6.6, 7.4, -6.8, 7], [-6.8, 7, 10, 3]].map(([a, b, c, d], k) => <Box key={k} s={[Math.hypot(c - a, d - b), 0.02, 0.02]} p={[(a + c) / 2, 5, (b + d) / 2]} r={[0, -Math.atan2(d - b, c - a), 0]} m={M.dark} cast={false} />)}
        <Range n={7} R={60} y={-1} hMin={10} hMax={18} rock="#7a8088" snow={false} />
      </group>
    );
  }

  /* ====================================================================
     Indreshwar Mahadev, Panauti: the great three-roofed brick pagoda, with the smaller Unamaheshwar beside it
     ==================================================================== */
  function IndraMain() {
    const M = useM();
    const wall = M.mat('brick', 2, 1, { color: '#b87a5e' });
    const cella = M.mat('brick', 2, 1, { color: '#a9694f' });
    const roofM = M.mat('roof', 4, 4, { color: '#a87850' });
    const brick = M.mat('brick', 4, 0.5, { color: '#e0a284' });
    const stone = M.stone;
    const grey = M.mat('granite', 1, 1, { color: '#bdb3a2' });
    const tiers = [{ w: 3.9, d: 3.9, h: 1.55, o: 1.4, rh: 0.85 }, { w: 2.9, d: 2.9, h: 1.05, o: 1.1, rh: 0.68 }, { w: 2.0, d: 2.0, h: 0.9, o: 0.85, rh: 0.55 }];
    return (
      <group>
        <Box s={[8.4, 0.3, 8.4]} p={[0, 0.15, 0]} m={brick} />
        <Box s={[7.4, 0.3, 7.4]} p={[0, 0.45, 0]} m={brick} />
        <Box s={[8.46, 0.05, 8.46]} p={[0, 0.3, 0]} m={stone} cast={false} />
        <Box s={[7.46, 0.05, 7.46]} p={[0, 0.6, 0]} m={stone} cast={false} />
        <Stairs p={[0, 0, 5.1]} w={2.0} n={6} rise={0.1} run={0.22} m={stone} />
        <Pag tiers={tiers} y0={0.6} roof={roofM} wall={wall} cellaM={cella} fringe="#b52a2a" strutN={6} finial={0.9} goldDoor />
        {[-1, 1].map((k) => <group key={k} position={[k * 1.35, 0.6, 2.7]} scale={1.7}><Lion m={grey} /></group>)}
        {/* Unamaheshwar, the smaller twin at its side */}
        <group position={[-7.4, 0, -0.6]} scale={0.78}>
          <Box s={[6, 0.3, 6]} p={[0, 0.15, 0]} m={brick} />
          <Pag tiers={[{ w: 3.0, d: 3.0, h: 1.3, o: 1.1, rh: 0.7 }, { w: 2.1, d: 2.1, h: 0.9, o: 0.85, rh: 0.58 }]} y0={0.3} roof={roofM} wall={wall} fringe="#b52a2a" strutN={5} finial={0.8} />
        </group>
        {/* the stone bull faces the temple, with the old bell frame beside it */}
        <Nandi p={[0, 0, 7.4]} face={Math.PI} />
        <BellFrame p={[-3.8, 0, 6.2]} s={0.9} />
        <Chaitya p={[4.2, 0, 6.4]} s={0.9} />
        <Frame s={[19, 8, 15]} p={[-1.4, 4, 1.2]} />
      </group>
    );
  }
  function IndraEnv() {
    const M = useM();
    const tints = ['#c4725a', '#d9946a', '#b86a50', '#c98a62'];
    return (
      <group>
        <GroundDisc r={26} m={M.mat('stone', 10, 10, { color: '#e6d9c4' })} />
        <GroundDisc r={95} y={-0.04} m={M.mat('grass', 30, 30, { color: '#b8c890' })} />
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
            <Roof w={2.8} d={8.8} h={0.5} y={1.7} m={roofMat(M, 'clay-tile')} sag={1.1} lift={0.05} />
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
        <GroundDisc r={22} m={M.mat('stone', 10, 10, { color: '#e2d6c2' })} />
        <GroundDisc r={95} y={-0.04} m={M.mat('grass', 30, 30, { color: '#8fae6a' })} />
        {/* the dense forested hill the temple stands against */}
        <GreenHill p={[0, -0.5, -24]} r={34} h={21} col="#4f7a45" sz={0.9} />
        <GreenHill p={[-30, -0.5, -10]} r={20} h={15} col="#5a8248" />
        <GreenHill p={[30, -0.5, -12]} r={22} h={16} col="#56803f" />
        {Array.from({ length: 80 }, (_, i) => {
          const a = Math.PI * (1.05 + rnd(i, 1) * 0.9);
          const r = 16 + rnd(i, 2) * 24;
          const x = Math.cos(a) * r;
          const z = Math.sin(a) * r - 6;
          const hillH = Math.max(0, 1 - Math.hypot(x / 34, (z + 24) / 31)) * 21;
          return <Fir key={i} p={[x, hillH * 0.82, z]} s={1.5 + rnd(i, 3) * 1.1} c={rnd(i, 4) > 0.4 ? '#2f5a3a' : '#4a7a3e'} />;
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
    const H = 4.9;
    const Dp = 1.9;
    const cl = [
      { p: [0, 0, -(H - Dp / 2)], r: 0, len: H * 2 }, { p: [-(H - Dp / 2), 0, 0], r: Math.PI / 2, len: H * 2 }, { p: [H - Dp / 2, 0, 0], r: -Math.PI / 2, len: H * 2 },
      { p: [-(H / 2 + 0.9), 0, H - Dp / 2], r: Math.PI, len: H - 1.8 }, { p: [H / 2 + 0.9, 0, H - Dp / 2], r: Math.PI, len: H - 1.8 },
    ];
    return (
      <group>
        <Box s={[H * 2 + 0.6, 0.18, H * 2 + 0.6]} p={[0, 0.09, 0]} m={brickLow} />
        {cl.map((c, i) => (
          <group key={i} position={c.p} rotation={[0, c.r, 0]}>
            <Box s={[c.len, 1.6, Dp]} p={[0, 0.98, 0]} m={brick} />
            {Array.from({ length: Math.max(2, Math.floor(c.len / 1.6)) }, (_, k, a) => null).map((_, k) => { const n = Math.max(2, Math.floor(c.len / 1.6)); return <Box key={k} s={[0.36, 0.4, 0.05]} p={[-c.len / 2 + (k + 0.5) * (c.len / n), 1.15, -Dp / 2 - 0.02]} m={M.dark} />; })}
            <Shed p={[0, 0, 0]} len={c.len + 0.4} dep={Dp + 0.8} y={1.95} m={redSheet} />
          </group>
        ))}
        {/* the shrine: two grey roofs trimmed with red frills, a tall slender pinnacle */}
        <Box s={[4.2, 0.3, 4.2]} p={[0, 0.27, 0]} m={M.stone} />
        <Pag tiers={[{ w: 2.4, d: 2.4, h: 1.15, o: 1.05, rh: 0.7 }]} y0={0.42} roof={grey} wall={wall} fringe="#c0392b" strutN={4} finial={0} goldDoor />
        <Pag tiers={[{ w: 1.7, d: 1.7, h: 0.85, o: 0.85, rh: 0.55 }]} y0={0.42 + 1.15 + 0.42} roof={grey} wall={wall} fringe="#c0392b" strutN={3} finial={1.55} door={false} bells={false} />
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
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow material={M.mat('stone', 10, 10, { color: '#e6dccb' })}><circleGeometry args={[9, 40]} /></mesh>
        <mesh position={[0, -8.05, 0]} material={M.mat('grass', 10, 5, { color: '#86a65e' })} receiveShadow><cylinderGeometry args={[8.5, 26, 16, 52]} /></mesh>
        <GroundDisc r={95} y={-16} m={M.mat('grass', 30, 30, { color: '#a8bc82' })} />
        {Array.from({ length: 36 }, (_, i) => {
          const a = rnd(i, 1) * Math.PI * 2;
          const r = 9 + rnd(i, 2) * 14;
          if (r < 15 && a > 0.1 && a < 1.5) return null;
          return <Tree key={i} p={[Math.cos(a) * r, -((r - 8.5) / 17.5) * 16, Math.sin(a) * r]} s={1.2 + rnd(i, 3) * 0.7} kind={i % 3 ? 'broad' : 'pine'} />;
        })}
        <Town n={30} r0={22} r1={44} drop={0.6} skip={(a) => a > 0.05 && a < 1.5} hs={0.8} />
        <Range n={9} R={62} y={-14} hMin={22} hMax={36} rock="#8088a0" cap={0.5} />
      </group>
    );
  }

  /* ====================================================================
     Sheshnarayan: a small gilded-roof Vishnu temple under a grey cliff, red shrines, two square ponds, steps to the cave
     ==================================================================== */
  function SheshMain() {
    const M = useM();
    const wall = M.mat('brick', 2, 1, { color: '#b8654e' });
    const redPaint = M.plain('#c4584a', { roughness: 0.9 });
    const roofM = M.mat('roof', 3, 3, { color: '#8a5e4c' });
    const brick = M.mat('brick', 4, 0.5, { color: '#d9937a' });
    const rock = M.mat('rock', 3, 3, { color: '#8e8a84' });
    const white = M.plain('#f1ede4', { roughness: 0.85 });
    const dk = M.plain('#1a110c');
    return (
      <group>
        {/* the cliff face behind everything, with the dark cave mouth */}
        <group position={[0, 0, -4.4]}>
          <mesh position={[-1, 3.2, -1.2]} scale={[6.5, 3.8, 2.4]} material={rock} castShadow receiveShadow><icosahedronGeometry args={[1, 2]} /></mesh>
          <mesh position={[4.6, 2.6, -1.4]} scale={[4.2, 3.2, 2.2]} material={rock} castShadow receiveShadow><icosahedronGeometry args={[1, 2]} /></mesh>
          <mesh position={[-6.4, 2.4, -0.6]} scale={[3.2, 2.8, 2.0]} material={rock} castShadow receiveShadow><icosahedronGeometry args={[1, 2]} /></mesh>
          <mesh position={[4.2, 1.0, 0.7]} rotation={[0, 0, 0]} scale={[1.2, 1.1, 0.5]}><sphereGeometry args={[1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshBasicMaterial color="#0d0907" /></mesh>
        </group>
        {/* the temple: brick storey with lattice windows, a tiled lower roof and a gilded upper roof */}
        <group position={[-1.2, 0, -0.4]}>
          <Box s={[5.0, 0.3, 3.8]} p={[0, 0.15, 0]} m={brick} />
          <Pag tiers={[{ w: 3.2, d: 2.4, h: 1.05, o: 0.8, rh: 0.6 }]} y0={0.3} roof={roofM} wall={wall} strutN={4} finial={0} goldDoor />
          <Pag tiers={[{ w: 2.3, d: 1.7, h: 0.8, o: 0.65, rh: 0.5 }]} y0={0.3 + 1.05 + 0.36} roof={M.gold} wall={wall} strutN={3} finial={0.7} door={false} bells={false} />
        </group>
        {/* red-washed shrine with arched openings at the left, white domed shrine and red pavilion by the ponds */}
        <group position={[-5.4, 0, 0.8]}>
          <Box s={[2.6, 1.6, 1.8]} p={[0, 0.8, 0]} m={redPaint} />
          {[-0.6, 0.6].map((x) => <group key={x}><Box s={[0.5, 0.7, 0.06]} p={[x, 0.55, 0.92]} m={dk} /><mesh position={[x, 0.9, 0.92]} material={dk}><circleGeometry args={[0.25, 14, 0, Math.PI]} /></mesh></group>)}
          <Box s={[2.8, 0.14, 2.0]} p={[0, 1.67, 0]} m={redPaint} />
        </group>
        <group position={[3.4, 0, 3.4]}>
          <Cyl rt={0.8} rb={0.85} h={1.0} p={[0, 0.5, 0]} m={white} seg={14} />
          {[0, 2.1, 4.2].map((a) => <mesh key={a} position={[Math.sin(a) * 0.82, 0.5, Math.cos(a) * 0.82]} rotation={[0, a, 0]} material={dk}><circleGeometry args={[0.22, 10, 0, Math.PI]} /></mesh>)}
          <Ball rad={0.82} sc={[1, 0.8, 1]} p={[0, 1.0, 0]} m={white} />
          <Cyl rt={0.15} rb={0.3} h={0.5} p={[0, 1.65, 0]} m={white} seg={10} />
          <Gajur y={1.9} s={0.35} />
        </group>
        <group position={[6.6, 0, 6.2]}>
          <Box s={[1.3, 1.3, 1.3]} p={[0, 0.65, 0]} m={redPaint} />
          <mesh position={[0, 1.65, 0]} material={redPaint} castShadow><coneGeometry args={[1.0, 0.7, 4]} /></mesh>
        </group>
        {/* the two square holy ponds, stone-rimmed, in front of the temple */}
        <Pool p={[-1.5, 0, 4.4]} w={5.4} d={3.4} />
        <Pool p={[1.6, 0, 8.6]} w={5.0} d={3.0} />
        {/* the steps climbing to the cave, and a few old stone stelae at the foot */}
        <Stairs p={[5.2, 0, 1.8]} w={1.3} n={8} rise={0.18} run={0.3} m={M.stone} />
        {[[-3.6, 2.2], [-2.9, 2.6], [-3.2, 3.2]].map(([x, z], k) => <Box key={k} s={[0.34, 0.8 + k * 0.1, 0.12]} p={[x, 0.4, z]} m={M.mat('granite', 1, 1, { color: '#6f6a62' })} />)}
        <PrayerFlags from={[-6.4, 4.4, -2]} to={[2.2, 2.6, 2.6]} n={20} />
        <Frame s={[16, 6.4, 18]} p={[0, 3.2, 2.2]} />
      </group>
    );
  }
  function SheshEnv() {
    const M = useM();
    const rock = M.mat('rock', 4, 4, { color: '#8a8680' });
    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow material={M.mat('stone', 8, 8, { color: '#cfc6b8' })}><planeGeometry args={[24, 30]} /></mesh>
        <GroundDisc r={95} y={-0.04} m={M.mat('grass', 30, 30, { color: '#7fa05a' })} />
        {/* a tall grey cliff running round the back, crowned with forest */}
        {[[-14, -8, 8, 9, 2.0], [-6, -12, 10, 13, 2.2], [6, -13, 11, 14, 2.4], [16, -9, 9, 11, 1.9], [-20, -1, 7, 8, 1.6], [22, -1, 7, 8, 1.6]].map(([x, z, w, h, d], k) => (
          <mesh key={k} position={[x, h / 2 - 0.5, z]} scale={[w, h, d * 3]} material={rock} castShadow receiveShadow><icosahedronGeometry args={[1, 1]} /></mesh>
        ))}
        {Array.from({ length: 56 }, (_, i) => {
          const a = Math.PI * (1.0 + rnd(i, 1) * 1.0);
          const r = 10 + rnd(i, 2) * 12;
          const x = Math.cos(a) * r * 1.2;
          const z = Math.sin(a) * r;
          if (z > -2 && x * x + z * z < 200 && Math.abs(x) < 8) return null;
          return <Tree key={i} p={[x, 0, z]} s={1.6 + rnd(i, 3) * 1.2} kind="broad" />;
        })}
        {/* the white guesthouse seen across the pond */}
        <group position={[12, 0, 2]}>
          <Box s={[4.4, 3.4, 3]} p={[0, 1.7, 0]} m={M.plain('#f2eee6', { roughness: 0.9 })} />
          {[0, 1].map((s) => [-1.4, -0.45, 0.45, 1.4].map((x) => <Box key={`${s}${x}`} s={[0.5, 0.6, 0.05]} p={[x, 0.9 + s * 1.2, 1.52]} m={M.plain('#6a7a8a')} />))}
          <Roof w={5} d={3.6} h={0.7} y={3.4} m={M.plain('#b4443a', { roughness: 0.6 })} sag={1.1} lift={0.03} />
        </group>
      </group>
    );
  }

  /* ====================================================================
     Doleshwor Mahadev, Sipadol: modest brick pagoda, a great stone bull, a coiled copper cobra and open sheds in a hillside village
     ==================================================================== */
  function DolesMain() {
    const M = useM();
    const wall = M.mat('brick', 2, 1, { color: '#a85a46' });
    const roofM = M.mat('roof', 3, 3, { color: '#9a5a44' });
    const brick = M.mat('brick', 4, 0.5, { color: '#e0a284' });
    const redSheet = M.plain('#b4443a', { roughness: 0.6, metalness: 0.3 });
    const post = M.plain('#8a8a88', { metalness: 0.6, roughness: 0.4 });
    const copper = M.plain('#b8693a', { metalness: 0.8, roughness: 0.35 });
    const tika = M.plain('#b8453a', { roughness: 0.9 });
    return (
      <group>
        <Box s={[5.2, 0.34, 5.2]} p={[0, 0.17, 0]} m={brick} />
        <Stairs p={[0, 0, 3.7]} w={1.6} n={3} rise={0.113} run={0.3} m={M.stone} />
        <Pag tiers={[{ w: 2.8, d: 2.8, h: 1.2, o: 0.9, rh: 0.62 }, { w: 2.0, d: 2.0, h: 0.85, o: 0.75, rh: 0.52 }]} y0={0.34} roof={roofM} wall={wall} strutN={4} finial={0.9} goldDoor />
        {/* the great grey Nandi on a red-smeared pedestal */}
        <group position={[0, 0, 6.2]}>
          <Box s={[1.5, 0.35, 2.0]} p={[0, 0.17, 0]} m={tika} />
          <Box s={[1.3, 0.3, 1.8]} p={[0, 0.5, 0]} m={tika} />
          <group position={[0, 0.35, 0]} scale={2.2}><Nandi p={[0, -0.12, 0]} face={Math.PI} /></group>
        </group>
        {/* coiled copper cobra with raised hood */}
        <group position={[-3.6, 0, 3.8]}>
          {[0, 1, 2].map((k) => <mesh key={k} position={[0, 0.16 + k * 0.28, 0]} rotation={[Math.PI / 2, 0, 0]} material={copper} castShadow><torusGeometry args={[0.62 - k * 0.12, 0.17, 10, 24]} /></mesh>)}
          <Cyl rt={0.14} rb={0.2} h={0.9} p={[0, 1.0, 0]} m={copper} seg={10} />
          <Ball rad={0.36} sc={[0.55, 1.1, 0.3]} p={[0, 1.7, 0]} m={copper} />
          <Ball rad={0.13} p={[0, 1.95, 0.12]} m={copper} />
        </group>
        <group position={[2.8, 0, 3.6]}><Lingam p={[0, 0, 0]} /></group>
        <Trident p={[3.8, 0, 4.6]} h={2.6} />
        <BellFrame p={[-2.0, 0, 6.6]} s={0.8} col="#7a4a3a" />
        {/* open sheds with red sheet roofs on each side */}
        {[-1, 1].map((k) => (
          <group key={k} position={[k * 7, 0, 1.4]}>
            {Array.from({ length: 5 }, (_, j) => <Cyl key={j} rt={0.06} h={1.9} p={[0, 0.95, -3.6 + j * 1.8]} m={post} seg={8} />)}
            <Box s={[0.5, 0.24, 7.6]} p={[k * 0.25, 0.12, 0]} m={M.stone} />
            <Shed p={[0, 0, 0]} r={k > 0 ? Math.PI / 2 : -Math.PI / 2} len={8} dep={2.4} y={2.0} m={redSheet} />
          </group>
        ))}
        {/* the cluster of small shrines behind */}
        {[-4.6, -2.3, 2.3, 4.6].map((x, k) => (
          <group key={x} position={[x, 0, -3.8]}>
            <Box s={[1.1, 1.0, 1.1]} p={[0, 0.5, 0]} m={k % 2 ? M.plain('#d9b878', { roughness: 0.9 }) : wall} />
            <mesh position={[0, 1.4, 0]} rotation={[0, Math.PI / 4, 0]} material={copper} castShadow><coneGeometry args={[0.95, 0.8, 4]} /></mesh>
            <mesh position={[0, 1.9, 0]} material={M.gold}><coneGeometry args={[0.07, 0.3, 8]} /></mesh>
          </group>
        ))}
        <Frame s={[17, 6, 14]} p={[0, 3, 1.4]} />
      </group>
    );
  }
  function DolesEnv() {
    const M = useM();
    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow material={M.mat('stone', 8, 8, { color: '#e2d8c6' })}><planeGeometry args={[22, 20]} /></mesh>
        <mesh position={[0, -5.02, 0]} material={M.mat('grass', 10, 5, { color: '#8aa95e' })} receiveShadow><cylinderGeometry args={[13, 24, 10, 52]} /></mesh>
        <GroundDisc r={95} y={-10} m={M.mat('grass', 30, 30, { color: '#a4bb7c' })} />
        {/* terraced paddy fields stepping down the slope */}
        {[0, 1, 2, 3].map((k) => <mesh key={k} position={[0, -1.1 - k * 1.2, 0]} material={M.mat('grass', 20, 2, { color: k % 2 ? '#b0be66' : '#8aa84e' })} receiveShadow><cylinderGeometry args={[14 + k * 3.2, 14 + k * 3.2, 0.5, 52, 1, true]} /></mesh>)}
        {/* the forested ridge rising behind the shrines */}
        <GreenHill p={[0, -0.4, -26]} r={36} h={20} col="#4f7c44" sz={0.8} />
        <GreenHill p={[-30, -0.4, -4]} r={20} h={14} col="#5a8648" />
        <GreenHill p={[32, -0.4, -8]} r={22} h={16} col="#527f40" />
        {Array.from({ length: 60 }, (_, i) => {
          const a = Math.PI * (1.0 + rnd(i, 1) * 1.0);
          const r = 18 + rnd(i, 2) * 20;
          const x = Math.cos(a) * r;
          const z = Math.sin(a) * r * 0.8 - 6;
          const hh = Math.max(0, 1 - Math.hypot(x / 36, (z + 26) / 29)) * 20;
          return <Fir key={i} p={[x, hh * 0.8, z]} s={1.6 + rnd(i, 3)} c={rnd(i, 4) > 0.5 ? '#2f5a3a' : '#4a7a3e'} />;
        })}
        <Town n={26} r0={15} r1={34} drop={0.3} skip={(a) => (a > 0.05 && a < 1.5) || (a > 3.4 && a < 6.0)} colors={['#d9c9a8', '#c9a890', '#e6dcc4', '#b89878']} hs={0.9} />
      </group>
    );
  }

  return {
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
