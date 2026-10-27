// Hand-built landmarks for Karnali and Sudurpashchim (the far west). See the brief: export a function taking the kit K
// and returning { slug: { Main, Env } }.
import { useMemo } from 'react';

export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Gajur, Tree, Trident, Frame, GroundDisc, Water, Lion, Elephant, Nandi, Chaitya, PrayerFlags, Goddess, wallMat, lighten, THREE } = K;
  const OUT = {};
  const DS = THREE.DoubleSide;
  const rnd = (i, s = 1) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };

  /* ---------- shared helpers ---------- */
  const triGeo = (w, h, d) => {
    const s = new THREE.Shape();
    s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false });
    g.translate(0, 0, -d / 2);
    return g;
  };
  /** Triangular gable-end wall: width w, height h, thickness d (ridge runs along z). */
  function FwPrism({ w, d, h, m, p = [0, 0, 0], r = [0, 0, 0] }) {
    const g = useMemo(() => triGeo(w, h, d), [w, h, d]);
    return <mesh geometry={g} material={m} position={p} rotation={r} castShadow receiveShadow />;
  }
  /** Pitched roof of two slabs with eave overhang. Ridge along z. Eave at y. */
  function FwGable({ w, d, h, y = 0, m, wallM, ov = 0.25, th = 0.07 }) {
    const M = useM();
    const a = Math.atan2(h, w / 2);
    const L = Math.hypot(w / 2, h) + ov;
    const dd = d + ov * 1.6;
    return (
      <group position={[0, y, 0]}>
        {[-1, 1].map((k) => (
          <Box key={k} s={[L, th, dd]} p={[k * (w / 4 + (ov * Math.cos(a)) / 2) + Math.sin(a) * th * 0.5 * k, (h - ov * Math.sin(a)) / 2 + Math.cos(a) * th * 0.5, 0]} r={[0, 0, -k * a]} m={m} />
        ))}
        <Box s={[0.14, 0.09, dd + 0.04]} p={[0, h + 0.03, 0]} m={M.dark} cast={false} />
        {wallM && <FwPrism w={w - 0.06} h={h - 0.05} d={d - 0.02} m={wallM} />}
      </group>
    );
  }
  /** Square pyramid roof (4-sided cone). */
  function FwPyr({ p = [0, 0, 0], w = 2, h = 1, m, r = 0 }) {
    return (
      <mesh position={p} rotation={[0, Math.PI / 4 + r, 0]} material={m} castShadow receiveShadow>
        <coneGeometry args={[w / Math.SQRT2, h, 4]} />
      </mesh>
    );
  }
  /** Hill-village house: walls, pitched roof, door and window. */
  function FwHouse({ p = [0, 0, 0], r = 0, w = 2, d = 3, h = 1.8, wall, roof, rh = 0.8, ov = 0.25, bal = false, storeys = 1 }) {
    const M = useM();
    const hh = h * storeys;
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[w, hh, d]} p={[0, hh / 2, 0]} m={wall} />
        <FwGable w={w} d={d} h={rh} y={hh} m={roof} wallM={wall} ov={ov} />
        <Box s={[0.05, h * 0.55, 0.5]} p={[w / 2 + 0.01, h * 0.28, d * 0.25]} m={M.dark} cast={false} />
        {Array.from({ length: storeys }, (_, s) => <Box key={s} s={[0.05, 0.4, 0.42]} p={[w / 2 + 0.01, s * h + h * 0.62, -d * 0.2]} m={M.plain('#2b2018')} cast={false} />)}
        {bal && <Box s={[0.5, 0.06, d * 0.9]} p={[w / 2 + 0.25, h * 0.98, 0]} m={M.plain('#2f5f9a')} />}
        {bal && <Box s={[0.04, 0.4, d * 0.9]} p={[w / 2 + 0.48, h * 1.2, 0]} m={M.plain('#2f5f9a')} />}
      </group>
    );
  }
  function FwHill({ p, sc = [10, 4, 10], m, seg = 16 }) {
    return (
      <mesh position={p} scale={sc} material={m} receiveShadow castShadow>
        <sphereGeometry args={[1, seg, Math.round(seg * 0.6), 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
    );
  }
  function FwPeak({ p, r = 10, h = 14, rock, snow = true, cap = 0.42 }) {
    const M = useM();
    return (
      <group position={p}>
        <mesh material={rock} position={[0, h / 2, 0]}><coneGeometry args={[r, h, 7]} /></mesh>
        {snow && <mesh position={[0, h * (1 - cap / 2), 0]} material={M.plain('#f6f7fb', { roughness: 0.6 })}><coneGeometry args={[r * cap * 0.98, h * cap, 7]} /></mesh>}
      </group>
    );
  }
  /** Ring of rounded hills around the scene, leaving a gap if wanted. */
  function FwHillRing({ n = 14, r = 40, hMin = 5, hMax = 12, y = -1, m, seed = 1, wide = 1 }) {
    return (
      <group>
        {Array.from({ length: n }, (_, i) => {
          const a = (i / n) * Math.PI * 2 + rnd(i, seed) * 0.3;
          const rr = r * (0.9 + rnd(i, seed + 3) * 0.25);
          const hh = hMin + rnd(i, seed + 7) * (hMax - hMin);
          const ww = (r * 0.2 + rnd(i, seed + 5) * 8) * wide;
          return <FwHill key={i} p={[Math.cos(a) * rr, y, Math.sin(a) * rr]} sc={[ww, hh, ww * 0.9]} m={m} seg={10} />;
        })}
      </group>
    );
  }
  function FwFir({ p, s = 1, col = '#2b4a33' }) {
    const M = useM();
    const leaf = M.plain(col, { roughness: 1 });
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.08} rb={0.13} h={1.0} p={[0, 0.5, 0]} m={M.plain('#4a3626')} seg={6} />
        {[0, 1, 2, 3].map((i) => <mesh key={i} position={[0, 0.9 + i * 0.85, 0]} material={leaf} castShadow><coneGeometry args={[1.0 - i * 0.2, 1.5, 8]} /></mesh>)}
      </group>
    );
  }
  function FwBigTree({ p, s = 1, col = '#4d6b38' }) {
    const M = useM();
    const leaf = M.plain(col, { roughness: 1 });
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.22} rb={0.4} h={2.6} p={[0, 1.3, 0]} m={M.plain('#5a4634')} seg={8} />
        {[[0, 3.6, 0, 1.7], [1.3, 3.2, 0.4, 1.3], [-1.3, 3.3, -0.3, 1.4], [0.2, 4.4, -0.2, 1.2], [0.2, 3.3, -1.3, 1.2], [-0.4, 3.2, 1.2, 1.2]].map(([x, y, z, rr], i) => <Ball key={i} rad={rr} p={[x, y, z]} m={leaf} />)}
      </group>
    );
  }
  function FwRubble({ n = 12, w = 6, d = 6, p = [0, 0, 0], m, seed = 1, size = 0.5 }) {
    return (
      <group position={p}>
        {Array.from({ length: n }, (_, i) => {
          const sz = size * (0.5 + rnd(i, seed) * 1.0);
          return <Box key={i} s={[sz * 1.4, sz * (0.6 + rnd(i, seed + 2) * 0.5), sz]} p={[(rnd(i, seed + 1) - 0.5) * w, sz * 0.25, (rnd(i, seed + 4) - 0.5) * d]} r={[rnd(i, seed + 6) * 0.3, rnd(i, seed + 3) * 3, rnd(i, seed + 8) * 0.3]} m={m} />;
        })}
      </group>
    );
  }
  /** Terraced fields stepping up the slope behind (toward -z). */
  function FwTerraces({ p = [0, 0, 0], r = 0, w = 16, n = 6, rise = 0.8, run = 2.4, cols = ['#8fa352', '#b9b65e', '#a09a58'] }) {
    const M = useM();
    return (
      <group position={p} rotation={[0, r, 0]}>
        {Array.from({ length: n }, (_, k) => (
          <Box key={k} s={[w - k * 0.5, rise * (k + 1), run]} p={[0, (rise * (k + 1)) / 2, -k * run]} m={M.plain(cols[k % cols.length], { roughness: 1 })} cast={false} />
        ))}
      </group>
    );
  }
  /** Big triangular saffron flag with its base on a pole (Jumla lingo style). */
  function FwFlag({ p, len = 2.2, h = 1.5, color = '#e8791f', rot = 0 }) {
    const g = useMemo(() => {
      const s = new THREE.Shape();
      s.moveTo(0, 0); s.lineTo(0, -h); s.lineTo(len, -h * 0.35); s.closePath();
      return new THREE.ShapeGeometry(s);
    }, [len, h]);
    return <mesh geometry={g} position={p} rotation={[0, rot, 0]} castShadow><meshStandardMaterial color={color} side={DS} roughness={0.9} /></mesh>;
  }
  const FwSky = ({ M, r = 80, c = '#b8c890', y = -0.04 }) => <GroundDisc r={r} y={y} m={M.plain(c, { roughness: 1 })} />;

  /* =====================================================================================
     Kakrebihar: tan sandstone shikhara, reassembled, on a forested hillock above Surkhet
     ===================================================================================== */
  /** Nagara temple: cross-section jangha with porch, ribbed curvilinear tower, amalaka, kalasha. */
  function FwShikhara({ w = 2.4, hBase = 1.7, hSpire = 4.4, tiers = 9, m, m2, dark, y0 = 0, door = true, topScale = 0.28, gold = true }) {
    const M = useM();
    const out = [];
    out.push(<Box key="j" s={[w, hBase, w]} p={[0, y0 + hBase / 2, 0]} m={m} />);
    out.push(<Box key="jb" s={[w * 0.4, hBase, w * 1.08]} p={[0, y0 + hBase / 2, 0]} m={m2} />);
    out.push(<Box key="jc" s={[w * 1.08, hBase, w * 0.4]} p={[0, y0 + hBase / 2, 0]} m={m2} />);
    [0.07, hBase * 0.5, hBase - 0.07].forEach((yy, k) => out.push(<Box key={`mo${k}`} s={[w * 1.14, 0.12, w * 1.14]} p={[0, y0 + yy, 0]} m={m2} />));
    if (door) {
      const dh = hBase * 0.55;
      out.push(<Box key="df" s={[w * 0.44, dh + 0.18, 0.1]} p={[0, y0 + dh / 2 + 0.2, w * 0.54 + 0.01]} m={m2} />);
      out.push(<Box key="dd" s={[w * 0.28, dh, 0.1]} p={[0, y0 + dh / 2 + 0.16, w * 0.54 + 0.05]} m={dark} cast={false} />);
      [-1, 1].forEach((k) => out.push(<Box key={`dp${k}`} s={[0.15, dh + 0.1, 0.15]} p={[k * w * 0.27, y0 + dh / 2 + 0.2, w * 0.54 + 0.12]} m={m} />));
      out.push(<Box key="dl" s={[w * 0.62, 0.14, 0.32]} p={[0, y0 + dh + 0.32, w * 0.54 + 0.12]} m={m2} />);
    }
    let y = y0 + hBase;
    const th = hSpire / tiers;
    for (let i = 0; i < tiers; i += 1) {
      const t = i / tiers;
      const ww = w * (1.02 - (1 - topScale) * Math.pow(t, 1.35));
      out.push(<Box key={`s${i}`} s={[ww, th * 0.92, ww]} p={[0, y + th * 0.46, 0]} m={m} />);
      out.push(<Box key={`sa${i}`} s={[ww * 0.44, th * 0.92, ww * 1.1]} p={[0, y + th * 0.46, 0]} m={m2} />);
      out.push(<Box key={`sb${i}`} s={[ww * 1.1, th * 0.92, ww * 0.44]} p={[0, y + th * 0.46, 0]} m={m2} />);
      out.push(<Box key={`sl${i}`} s={[ww * 1.08, th * 0.09, ww * 1.08]} p={[0, y + th * 0.95, 0]} m={m2} />);
      if (door && i % 2 === 1) out.push(<Box key={`n${i}`} s={[ww * 0.2, th * 0.5, 0.05]} p={[0, y + th * 0.5, ww * 0.55 + 0.02]} m={dark} cast={false} />);
      y += th;
    }
    const wt = w * topScale;
    out.push(<Cyl key="am" rt={wt * 1.15} rb={wt * 0.95} h={0.16} p={[0, y + 0.08, 0]} m={m2} seg={8} />);
    out.push(<Ball key="am2" rad={wt * 1.1} sc={[1, 0.42, 1]} p={[0, y + 0.26, 0]} m={m2} />);
    out.push(<Cyl key="k1" rt={0.05} rb={0.13} h={0.3} p={[0, y + 0.55, 0]} m={gold ? M.gold : m2} seg={8} />);
    out.push(<Ball key="k2" rad={0.12} p={[0, y + 0.78, 0]} m={gold ? M.gold : m2} />);
    out.push(<mesh key="k3" position={[0, y + 1.05, 0]} material={gold ? M.gold : m2}><coneGeometry args={[0.04, 0.4, 8]} /></mesh>);
    return <group>{out}</group>;
  }
  function KakreMain() {
    const M = useM();
    const sand = M.plain('#cdb07e', { roughness: 0.95 });
    const sand2 = M.plain('#dcc395', { roughness: 0.95 });
    const dark = M.plain('#33261b');
    const grey = M.mat('rock', 2, 1, { color: '#a89a82' });
    return (
      <group>
        <Box s={[5.6, 0.3, 5.6]} p={[0, 0.15, 0]} m={grey} />
        <Box s={[4.6, 0.3, 4.6]} p={[0, 0.45, 0]} m={sand} />
        {[0, 1, 2].map((k) => <Box key={k} s={[1.7, 0.2, 0.4]} p={[0, 0.1 + k * 0.2, 2.9 + (2 - k) * 0.4 - 0.4]} m={grey} />)}
        <group position={[0, 0.6, 0]}><FwShikhara w={2.5} hBase={1.9} hSpire={4.2} tiers={9} topScale={0.42} m={sand} m2={sand2} dark={dark} /></group>
        {/* the scattered carved blocks the temple was rebuilt from */}
        <FwRubble n={18} w={9} d={7} p={[-2.6, 0, 2.4]} m={M.mat('rock', 1, 1, { color: '#b9a889' })} seed={4} size={0.55} />
        <FwRubble n={8} w={5} d={4} p={[4.4, 0, -2]} m={M.mat('rock', 1, 1, { color: '#b9a889' })} seed={9} size={0.45} />
        {/* a small stone Buddha niche on the platform edge */}
        <group position={[2.9, 0.6, 1.6]}>
          <Box s={[0.5, 0.5, 0.4]} p={[0, 0.25, 0]} m={sand} />
          <Ball rad={0.13} p={[0, 0.62, 0]} m={sand2} />
          <Box s={[0.3, 0.22, 0.2]} p={[0, 0.42, 0.05]} m={M.plain('#f1ead8')} />
        </group>
        <Frame s={[13, 8.5, 11]} p={[0, 4.2, 0.4]} />
      </group>
    );
  }
  function KakreEnv() {
    const M = useM();
    const earth = M.plain('#b9a574', { roughness: 1 });
    const piers = M.mat('brick', 1, 2, { color: '#e8a58a' });
    return (
      <group>
        <GroundDisc r={13} y={-0.01} m={earth} />
        <mesh position={[0, -4.65, 0]} material={M.plain('#8e9c5e', { roughness: 1 })} receiveShadow><cylinderGeometry args={[13, 30, 9.2, 40]} /></mesh>
        <GroundDisc r={95} y={-9.2} m={M.plain('#a7b36a', { roughness: 1 })} />
        {/* Surkhet valley below: patchwork fields and coloured houses */}
        {Array.from({ length: 36 }, (_, i) => {
          const a = rnd(i, 2) * Math.PI * 2; const rr = 34 + rnd(i, 5) * 30;
          const cols = ['#e6e0d0', '#d9b36a', '#9ec2d8', '#e1a48b', '#c9d3a0'];
          return <Box key={i} s={[1.3 + rnd(i, 7), 1 + rnd(i, 3) * 0.7, 1.3]} p={[Math.cos(a) * rr, -8.5, Math.sin(a) * rr]} m={M.plain(cols[i % 5])} />;
        })}
        {Array.from({ length: 9 }, (_, i) => <mesh key={`f${i}`} rotation={[-Math.PI / 2, 0, rnd(i, 4)]} position={[Math.cos(i * 2.1) * 40, -9.15, Math.sin(i * 2.1) * 40]}><planeGeometry args={[14, 9]} /><meshStandardMaterial color={i % 2 ? '#c9c060' : '#86a64a'} roughness={1} /></mesh>)}
        <FwHillRing n={16} r={85} hMin={9} hMax={20} y={-9} m={M.plain('#7f9478', { roughness: 1 })} seed={3} wide={1} />
        {/* pine and sal forest on the hillock */}
        {Array.from({ length: 40 }, (_, i) => {
          const a = (i / 40) * Math.PI * 2; if (Math.abs(Math.atan2(Math.sin(a - 0.93), Math.cos(a - 0.93))) < 0.75) return null;
          const rr = 9.5 + rnd(i, 1) * 3.5;
          return i % 3 ? <Tree key={i} p={[Math.cos(a) * rr, 0, Math.sin(a) * rr]} s={1.4 + rnd(i, 2) * 0.8} kind="pine" /> : <FwBigTree key={i} p={[Math.cos(a) * rr, 0, Math.sin(a) * rr]} s={0.7 + rnd(i, 3) * 0.3} col="#58713a" />;
        })}
        {/* the red brick entrance gate to the Kakre Binar forest */}
        <group position={[7.2, 0, 10.4]} rotation={[0, 0.62, 0]}>
          {[-1.7, 1.7].map((x) => <Box key={x} s={[0.8, 2.4, 0.8]} p={[x, 1.2, 0]} m={piers} />)}
          <Box s={[4.6, 0.3, 1]} p={[0, 2.55, 0]} m={piers} />
          <Box s={[2.6, 1.7, 0.2]} p={[0, 0.95, 0.15]} m={M.plain('#18181a')} />
          {[-0.65, 0.65].map((x) => <Box key={x} s={[0.5, 0.7, 0.04]} p={[x, 1.0, 0.27]} m={M.gold} />)}
          <Box s={[1.8, 0.3, 0.1]} p={[0, 2.95, 0.45]} m={M.plain('#c9a24a')} />
          <Roof w={3.6} d={1.8} h={0.7} y={3.0} m={M.mat('roof', 3, 3, { color: '#c4623c' })} />
          <Roof w={1.5} d={1.3} h={0.45} y={2.7} m={M.mat('roof', 2, 2, { color: '#c4623c' })} />
          <PrayerFlags from={[-2, 2.7, 0.4]} to={[-6.6, 1.2, -1.5]} n={12} />
          <PrayerFlags from={[2, 2.7, 0.4]} to={[6.4, 1.4, -1.8]} n={12} />
        </group>
        <group position={[3.6, 0.01, 6.3]} rotation={[0, 0.62, 0]}><mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[2.2, 10]} /><meshStandardMaterial color="#cdbb92" roughness={1} /></mesh></group>
      </group>
    );
  }
  OUT.kakrebihar = { Main: KakreMain, Env: KakreEnv };

  /* =====================================================================================
     Chandannath, Khalanga bazaar of Jumla: whitewashed cube shrine, yellow cornice, onion
     dome of beaten metal, tall red timber lingo poles with saffron flags
     ===================================================================================== */
  function ChandanMain() {
    const M = useM();
    const white = M.plain('#f6f3ec', { roughness: 0.85 });
    const yellow = M.plain('#e9b91f', { roughness: 0.7 });
    const metal = M.plain('#a38c5c', { metalness: 0.75, roughness: 0.4 });
    const red = M.plain('#b3432a', { roughness: 0.8 });
    const poles = [[-1.9, -1.2, 10.2, 0.12], [-0.9, -2.2, 9.2, 0.11], [2.6, -2.4, 8.4, 0.1]];
    return (
      <group>
        <Box s={[3.1, 0.22, 3.1]} p={[0, 0.11, 0]} m={M.stone} />
        <Box s={[2.3, 1.7, 2.3]} p={[0, 1.07, 0]} m={white} />
        <Box s={[2.34, 0.14, 2.34]} p={[0, 0.3, 0]} m={yellow} />
        {/* wooden door and a small window */}
        <Box s={[0.7, 1.1, 0.06]} p={[0, 0.78, 1.17]} m={red} cast={false} />
        <Box s={[0.82, 0.08, 0.1]} p={[0, 1.36, 1.17]} m={M.dark} cast={false} />
        {[-0.8, 0.8].map((x) => <Box key={x} s={[0.34, 0.4, 0.04]} p={[x, 1.4, 1.17]} m={M.plain('#3a2a20')} cast={false} />)}
        {/* the broad yellow cornice slab, then the metal-clad dome */}
        <Box s={[2.9, 0.2, 2.9]} p={[0, 2.02, 0]} m={yellow} />
        <Box s={[2.7, 0.12, 2.7]} p={[0, 2.18, 0]} m={white} />
        <Cyl rt={1.1} rb={1.15} h={0.34} p={[0, 2.4, 0]} m={metal} seg={32} />
        <mesh position={[0, 2.56, 0]} scale={[1, 0.95, 1]} material={metal} castShadow><sphereGeometry args={[1.12, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
        <Cyl rt={0.28} rb={0.34} h={0.12} p={[0, 3.62, 0]} m={metal} seg={16} />
        <Ball rad={0.12} p={[0, 3.78, 0]} m={metal} />
        <mesh position={[0, 4.02, 0]} material={metal}><coneGeometry args={[0.05, 0.5, 8]} /></mesh>
        {/* Bhairabnath: small shrine beside it under a red pyramid roof */}
        <group position={[4.1, 0, -0.6]}>
          <Box s={[2.3, 0.2, 2.3]} p={[0, 0.1, 0]} m={M.stone} />
          <Box s={[1.7, 1.25, 1.7]} p={[0, 0.82, 0]} m={white} />
          <Box s={[0.5, 0.8, 0.05]} p={[0, 0.6, 0.86]} m={M.dark} cast={false} />
          <FwPyr p={[0, 2.0, 0]} w={2.4} h={1.0} m={M.plain('#a63f2a', { roughness: 0.8 })} />
          <mesh position={[0, 2.7, 0]} material={M.gold}><coneGeometry args={[0.07, 0.4, 8]} /></mesh>
        </group>
        {/* red lingo poles with saffron flags */}
        {poles.map(([x, z, h, r], k) => (
          <group key={k} position={[x, 0, z]}>
            <Box s={[0.7, 0.3, 0.7]} p={[0, 0.15, 0]} m={M.stone} />
            <Cyl rt={r * 0.65} rb={r} h={h} p={[0, h / 2 + 0.3, 0]} m={red} seg={8} />
            <Box s={[0.5, 0.05, 0.05]} p={[0, h * 0.7, 0]} m={red} />
            <FwFlag p={[0.08, h + 0.2, 0]} len={2.3 - k * 0.25} h={1.6 - k * 0.15} rot={-0.35 + k * 0.1} />
            <mesh position={[0, h + 0.52, 0]} material={M.plain('#8a8580', { metalness: 0.8, roughness: 0.3 })}><coneGeometry args={[0.07, 0.4, 6]} /></mesh>
          </group>
        ))}
        {/* Hanuman's yellow-walled niche with the red image */}
        <group position={[-3.4, 0, 2.6]}>
          <Box s={[1.6, 0.2, 1.4]} p={[0, 0.1, 0]} m={M.stone} />
          <Box s={[1.6, 1.4, 0.1]} p={[0, 0.9, -0.6]} m={yellow} />
          {[-1, 1].map((k) => <Box key={k} s={[0.1, 1.4, 1.3]} p={[k * 0.75, 0.9, 0]} m={yellow} />)}
          <Box s={[1.7, 0.1, 1.5]} p={[0, 1.64, 0]} m={yellow} />
          <Box s={[0.8, 0.5, 0.5]} p={[0, 0.5, -0.1]} m={M.plain('#5d5a58')} />
          <Box s={[0.4, 0.5, 0.3]} p={[0, 0.98, -0.1]} m={M.plain('#c4402b')} />
          <Ball rad={0.17} p={[0, 1.38, -0.1]} m={M.plain('#c4402b')} />
        </group>
        <Frame s={[13, 11, 9]} p={[0.8, 5.4, -0.6]} />
      </group>
    );
  }
  function ChandanEnv() {
    const M = useM();
    const stoneWall = M.mat('rock', 2, 1, { color: '#a69c8c' });
    const wash = M.plain('#d7cfc0', { roughness: 0.9 });
    const roofs = [M.plain('#8d9398', { metalness: 0.5, roughness: 0.5 }), M.plain('#3a67b0', { metalness: 0.4, roughness: 0.5 }), M.plain('#7a5a48', { roughness: 0.9 }), M.mat('rock', 2, 2, { color: '#6f6a66' })];
    const dry = M.plain('#968b60', { roughness: 1 });
    return (
      <group>
        <GroundDisc r={16} y={-0.01} m={M.plain('#bdb29c', { roughness: 1 })} />
        <GroundDisc r={90} y={-0.05} m={M.plain('#9b9068', { roughness: 1 })} />
        {/* the bazaar: two lines of stone-and-timber houses with blue balconies */}
        {Array.from({ length: 6 }, (_, k) => <FwHouse key={`r${k}`} p={[11.5, 0, -9 + k * 3.7]} r={0} w={3} d={3.4} h={1.7} storeys={2} rh={0.9} wall={k % 2 ? stoneWall : wash} roof={roofs[k % 4]} bal={k % 2 === 0} />)}
        {Array.from({ length: 6 }, (_, k) => <FwHouse key={`l${k}`} p={[-11.5, 0, -9 + k * 3.7]} r={Math.PI} w={3} d={3.4} h={1.7} storeys={k % 3 === 0 ? 1 : 2} rh={0.9} wall={k % 2 ? wash : stoneWall} roof={roofs[(k + 1) % 4]} bal={k % 2 === 1} />)}
        {Array.from({ length: 5 }, (_, k) => <FwHouse key={`b${k}`} p={[-8 + k * 4, 0, -13.2 - (k % 2) * 1.5]} r={-Math.PI / 2} w={3} d={3.4} h={1.7} storeys={2} rh={0.9} wall={k % 2 ? stoneWall : wash} roof={roofs[(k + 2) % 4]} />)}
        <PrayerFlags from={[-11, 3.6, -4]} to={[11, 3.6, -4]} n={30} />
        {/* the hill slopes of the Tila valley with terraces and bare slopes */}
        <FwHill p={[-26, -2, -26]} sc={[28, 18, 22]} m={M.plain('#8b7f5c', { roughness: 1 })} />
        <FwHill p={[24, -2, -34]} sc={[30, 22, 24]} m={M.plain('#7e8458', { roughness: 1 })} />
        <FwHill p={[0, -2, -52]} sc={[40, 26, 22]} m={dry} />
        <FwTerraces p={[-22, 0, -20]} r={0.6} w={14} n={6} rise={1.2} run={3} />
        <FwTerraces p={[26, 0, -22]} r={-0.5} w={12} n={5} rise={1.1} run={3} cols={['#a39a5c', '#c0b565', '#8fa352']} />
        <FwPeak p={[-30, -2, -66]} r={20} h={34} rock={M.mat('rock', 4, 4, { color: '#8c8a8e' })} />
        <FwPeak p={[8, -2, -78]} r={26} h={42} rock={M.mat('rock', 4, 4, { color: '#85838a' })} />
        <FwPeak p={[44, -2, -62]} r={18} h={30} rock={M.mat('rock', 4, 4, { color: '#8c8a8e' })} />
        {[[-16, 14], [15, 13], [-19, -4], [19, 5]].map(([x, z], i) => <Tree key={i} p={[x, 0, z]} s={1.6} kind="pine" />)}
        <FwBigTree p={[-14, 0, 8]} s={0.9} col="#6f8a4a" />
      </group>
    );
  }
  OUT['chandannath-temple'] = { Main: ChandanMain, Env: ChandanEnv };

  /* =====================================================================================
     Sinja valley: Hima River, stone footbridge with carved wooden memorial pillars topped by
     human figures, a leaning inscribed stele, medieval fort ruin, cliffs with cave chaityas
     ===================================================================================== */
  /** Carved memorial pillar: stone foot, rounded carved shaft with collars and a seated/standing human figure on top. */
  function FwMemorial({ p, h = 4, tall = true, wood }) {
    const M = useM();
    const skin = M.plain('#8b6a4a', { roughness: 0.9 });
    return (
      <group position={p}>
        <Box s={[0.7, 0.4, 0.7]} p={[0, 0.2, 0]} m={M.mat('rock', 1, 1, { color: '#8d877d' })} />
        <Cyl rt={0.2} rb={0.24} h={h} p={[0, 0.4 + h / 2, 0]} m={wood} seg={10} />
        {[0.25, 0.5, 0.75].map((t) => <Cyl key={t} rt={0.27} h={0.1} p={[0, 0.4 + h * t, 0]} m={M.dark} seg={10} />)}
        {[0.35, 0.62].map((t) => <Box key={t} s={[0.34, 0.22, 0.34]} p={[0, 0.4 + h * t, 0]} m={M.plain('#5d4a38')} />)}
        <Cyl rt={0.3} rb={0.24} h={0.12} p={[0, 0.46 + h, 0]} m={wood} seg={10} />
        {tall && (
          <group position={[0, 0.52 + h, 0]}>
            <Box s={[0.3, 0.55, 0.2]} p={[0, 0.3, 0]} m={wood} />
            <Ball rad={0.13} p={[0, 0.72, 0]} m={skin} />
            <mesh position={[0, 0.9, 0]} material={M.plain('#6b2a22')}><coneGeometry args={[0.15, 0.22, 8]} /></mesh>
            {[-1, 1].map((k) => <Cyl key={k} rt={0.04} h={0.4} p={[k * 0.22, 0.3, 0.05]} r={[0.3, 0, k * 0.4]} m={wood} seg={6} />)}
          </group>
        )}
      </group>
    );
  }
  function SinjaMain() {
    const M = useM();
    const wood = M.plain('#7b6a58', { roughness: 0.95 });
    const slab = M.mat('rock', 2, 1, { color: '#9b958a' });
    const slate = M.mat('rock', 1, 2, { color: '#6a6e6c' });
    return (
      <group>
        {/* stone footbridge over the Hima: two abutments, long slabs, low rails */}
        {[-1, 1].map((k) => <Box key={k} s={[2.2, 0.7, 2]} p={[k * 4.4, 0.35, 0]} m={slab} />)}
        <Box s={[7.2, 0.28, 1.25]} p={[0, 0.78, 0]} m={slate} />
        {[-0.5, 0.5].map((z) => <Box key={z} s={[7, 0.1, 0.12]} p={[0, 1.32, z * 1.1]} m={wood} />)}
        {[-3, -1.5, 0, 1.5, 3].map((x) => [-0.55, 0.55].map((z) => <Box key={`${x}${z}`} s={[0.09, 0.55, 0.09]} p={[x, 1.1, z]} m={wood} />))}
        {/* the carved pillars at the east end, joined by a cross-beam */}
        <FwMemorial p={[5.3, 0, -1.3]} h={4.3} wood={wood} />
        <FwMemorial p={[5.3, 0, 1.3]} h={4.1} wood={wood} />
        <Box s={[0.18, 0.18, 3.2]} p={[5.3, 3.3, 0]} m={wood} />
        <FwMemorial p={[3.6, 0, -2.4]} h={2.4} tall={false} wood={wood} />
        <FwMemorial p={[3.6, 0, 2.4]} h={2.2} tall={false} wood={wood} />
        {/* leaning inscribed stele and scattered carved stones */}
        <Box s={[0.55, 3.2, 0.2]} p={[-6.2, 1.5, 3.4]} r={[0, 0.5, 0.22]} m={M.plain('#5f6764', { roughness: 0.9 })} />
        <Box s={[0.4, 1.4, 0.18]} p={[-7.3, 0.6, 2.4]} r={[0.2, 0.3, -0.3]} m={M.plain('#5f6764', { roughness: 0.9 })} />
        {/* dry-stone walls of the fort Yatse */}
        {[[-8, -4.5, 7, 1.3, 0.1], [-11.4, -2.4, 4.4, 0.9, 1.57], [-6.5, -2.6, 2.4, 0.6, 0.4]].map(([x, z, l, h, r], k) => <Box key={k} s={[l, h, 0.7]} p={[x, h / 2, z]} r={[0, r, 0]} m={M.mat('rock', 2, 1, { color: '#a89b82' })} />)}
        <FwRubble n={14} w={7} d={4} p={[-8, 0, -3]} m={M.mat('rock', 1, 1, { color: '#a89b82' })} seed={6} size={0.5} />
        <Frame s={[22, 6.2, 11]} p={[-1.4, 3.1, 0]} />
      </group>
    );
  }
  const sinjaX = (z) => 4 * (1 - Math.cos(0.1 * z)) + 3 * Math.sin(0.07 * z);
  function SinjaEnv() {
    const M = useM();
    const segs = useMemo(() => {
      const out = [];
      for (let z = -64; z < 64; z += 4) {
        const x0 = sinjaX(z); const x1 = sinjaX(z + 4);
        const dx = x1 - x0; const dz = 4;
        out.push({ x: (x0 + x1) / 2, z: z + 2, l: Math.hypot(dx, dz) + 0.5, r: Math.atan2(-dx, -dz) });
      }
      return out;
    }, []);
    const brown = M.plain('#a38660', { roughness: 1 });
    const dry = M.plain('#8f7a52', { roughness: 1 });
    return (
      <group>
        <GroundDisc r={36} y={-0.02} m={M.plain('#b9ad7c', { roughness: 1 })} />
        <GroundDisc r={110} y={-0.06} m={M.plain('#a69a6c', { roughness: 1 })} />
        {segs.map((s, i) => <Water key={i} w={3.8} d={s.l} p={[s.x, 0.02, s.z]} r={s.r} color="#6f9a9c" />)}
        {segs.map((s, i) => <Box key={`b${i}`} s={[0.6 + rnd(i, 2), 0.2, 0.8]} p={[s.x + (rnd(i, 4) - 0.5) * 5, 0.05, s.z]} r={[0, rnd(i, 3) * 3, 0]} m={M.mat('rock', 1, 1, { color: '#bdb3a0' })} />)}
        {/* green terraced rice-and-wheat fields along both banks, climbing the hillsides */}
        <FwTerraces p={[-12, 0, 6]} r={Math.PI / 2} w={26} n={6} rise={0.5} run={3.2} cols={['#7fb04c', '#a6c25a', '#6aa042']} />
        <FwTerraces p={[13, 0, -8]} r={-Math.PI / 2} w={34} n={6} rise={0.5} run={3.2} cols={['#8bb54f', '#c4c15e', '#74a844']} />
        <FwTerraces p={[-12, 0, -30]} r={Math.PI / 2} w={20} n={5} rise={0.6} run={3.4} cols={['#c9b86a', '#9fb457', '#b8ab5e']} />
        {/* dry brown hills closing the valley, pines on the upper slopes */}
        <FwHill p={[-52, -2, -6]} sc={[30, 30, 60]} m={brown} />
        <FwHill p={[54, -2, -14]} sc={[30, 34, 60]} m={dry} />
        <FwHill p={[-34, -2, -60]} sc={[28, 22, 22]} m={dry} />
        <FwHill p={[30, -2, -62]} sc={[30, 28, 24]} m={brown} />
        {Array.from({ length: 28 }, (_, i) => { const side = i % 2 ? 1 : -1; return <Tree key={i} p={[side * (30 + rnd(i, 2) * 14), 2 + rnd(i, 3) * 12, -50 + rnd(i, 4) * 90]} s={2.6 + rnd(i, 5) * 1.5} kind="pine" />; })}
        {Array.from({ length: 16 }, (_, i) => <Tree key={`w${i}`} p={[sinjaX(-40 + i * 5) + (i % 2 ? 4 : -4), 0, -40 + i * 5]} s={1.2 + rnd(i, 8) * 0.6} kind="broad" />)}
        <FwPeak p={[-18, -2, -100]} r={26} h={44} rock={M.mat('rock', 4, 4, { color: '#8b8a90' })} />
        <FwPeak p={[22, -2, -105]} r={30} h={52} rock={M.mat('rock', 4, 4, { color: '#85848c' })} />
        <FwPeak p={[60, -2, -90]} r={22} h={34} rock={M.mat('rock', 4, 4, { color: '#8b8a90' })} />
        {/* the cliff across the river with its cave chaityas */}
        <group position={[27, 0, -2]}>
          <mesh position={[0, 6, 0]} scale={[1, 1, 1]} material={M.mat('rock', 3, 3, { color: '#c0a07c' })} castShadow><cylinderGeometry args={[7, 10, 12, 7]} /></mesh>
          {[[-2.8, 2.2, 2], [0.6, 3.6, 2.8], [3, 2.6, 2]].map(([x, y, z], i) => (
            <group key={i} position={[x - 2.6, y, z + 3.2]} rotation={[0, -0.6, 0]}>
              <Box s={[0.9, 1.2, 0.3]} p={[0, 0, 0]} m={M.plain('#1c1612')} cast={false} />
              <Chaitya p={[0, -0.6, 0.1]} s={0.5} />
            </group>
          ))}
        </group>
        {/* Hat Sinja: stone houses with blue and grey tin roofs, and a few brown ones */}
        {[[16, 6, 0.3, '#3a67b0'], [19, 3, -0.2, '#8d9398'], [20.5, 9, 0.5, '#3a67b0'], [-15, -6, 1.2, '#8d9398'], [-18, -9, 1.8, '#7a5a48'], [-14, 12, 0.8, '#3a67b0']].map(([x, z, r, c], i) => (
          <FwHouse key={i} p={[x, 0, z]} r={r} w={2.2} d={3.2} h={1.6} rh={0.7} wall={M.mat('rock', 2, 1, { color: '#b2a58d' })} roof={M.plain(c, { metalness: 0.4, roughness: 0.5 })} />
        ))}
      </group>
    );
  }
  OUT['sinja-valley'] = { Main: SinjaMain, Env: SinjaEnv };

  /* =====================================================================================
     Shirasthan (Jwala Mandir), Dullu: red-earth courtyard, whitewashed shrine house with a
     low slate roof, the sacrificial post, carved stone slabs and the natural flames in rock
     ===================================================================================== */
  function FwFlame({ p, s = 1, light = false }) {
    return (
      <group position={p} scale={s}>
        <mesh position={[0, 0.1, 0]}><coneGeometry args={[0.07, 0.24, 8]} /><meshBasicMaterial color="#ff9a2a" toneMapped={false} /></mesh>
        <mesh position={[0, 0.07, 0]}><coneGeometry args={[0.04, 0.14, 8]} /><meshBasicMaterial color="#fff2a8" toneMapped={false} /></mesh>
        {light && <pointLight position={[0, 0.3, 0.2]} intensity={1.8} distance={4} color="#ff9a3a" />}
      </group>
    );
  }
  function FwCloths({ p, n = 10, h = 0.7, spread = 0.5, seed = 1 }) {
    return (
      <group position={p}>
        {Array.from({ length: n }, (_, i) => (
          <mesh key={i} position={[(rnd(i, seed) - 0.5) * spread, -h / 2, (rnd(i, seed + 2) - 0.5) * spread]} rotation={[0, rnd(i, seed + 4) * 3, 0]}>
            <planeGeometry args={[0.07, h * (0.6 + rnd(i, seed + 5) * 0.4)]} />
            <meshStandardMaterial color={i % 3 === 0 ? '#f2eee4' : '#c4281f'} side={DS} roughness={1} />
          </mesh>
        ))}
      </group>
    );
  }
  function ShiraMain() {
    const M = useM();
    const earth = M.plain('#b4623f', { roughness: 1 });
    const earth2 = M.plain('#a8573a', { roughness: 1 });
    const wash = M.plain('#f1eee6', { roughness: 0.95 });
    const slate = M.mat('rock', 3, 2, { color: '#6c6862' });
    const stone = M.mat('rock', 1, 1, { color: '#a49a8a' });
    const timber = M.plain('#2f5d8a', { roughness: 0.8 });
    return (
      <group>
        <Box s={[14, 0.12, 11]} p={[0, 0.02, 0.5]} m={earth} cast={false} />
        {/* the whitewashed shrine house with a low slate roof and a cloth-canopied veranda */}
        <group position={[0, 0.08, -3.4]}>
          <Box s={[9, 0.3, 3.6]} p={[0, 0.15, 0]} m={M.mat('rock', 3, 1, { color: '#b79a84' })} />
          <Box s={[8.6, 2.0, 2.8]} p={[0, 1.3, -0.1]} m={wash} />
          <Box s={[8.62, 0.5, 2.82]} p={[0, 0.55, -0.1]} m={M.plain('#d9c4ad')} />
          <group rotation={[0, Math.PI / 2, 0]} position={[0, 2.3, -0.1]}><FwGable w={3.4} d={8.6} h={0.75} y={0} m={slate} ov={0.35} /></group>
          {[-3.6, -1.8, 0, 1.8, 3.6].map((x) => <Box key={x} s={[0.14, 1.9, 0.14]} p={[x, 1.2, 1.6]} m={timber} />)}
          <Box s={[9, 0.12, 0.2]} p={[0, 2.18, 1.6]} m={timber} />
          <mesh position={[0, 2.32, 1.25]} rotation={[0.38, 0, 0]} material={M.plain('#f2e3bf', { roughness: 1 })}><boxGeometry args={[9, 0.04, 1.1]} /></mesh>
          <Box s={[9, 0.2, 0.04]} p={[0, 2.0, 1.78]} m={M.plain('#e9d6a4')} cast={false} />
          {[-2.4, 0.4, 3.0].map((x) => <Box key={x} s={[0.7, 1.2, 0.06]} p={[x, 0.95, 1.31]} m={M.plain('#2a1c14')} cast={false} />)}
          <Box s={[1.6, 0.35, 0.6]} p={[-1.6, 0.35, 1.9]} m={earth2} />
        </group>
        {/* sacrificial post on its earth platform, braced by two poles, yellow cloth on top */}
        <group position={[1.0, 0, 1.6]}>
          <Cyl rt={0.95} rb={1.25} h={0.75} p={[0, 0.4, 0]} m={earth2} seg={14} />
          <Cyl rt={0.55} rb={0.65} h={0.28} p={[0, 0.88, 0]} m={M.mat('rock', 1, 1, { color: '#8f8578' })} seg={10} />
          <Cyl rt={0.09} h={3.1} p={[0, 2.35, 0]} m={M.plain('#6b4a30')} seg={8} />
          {[-1, 1].map((k) => <Cyl key={k} rt={0.05} h={2.6} p={[k * 0.75, 1.9, k * 0.1]} r={[0, 0, k * -0.5]} m={M.plain('#6b4a30')} seg={6} />)}
          <Box s={[0.5, 0.35, 0.03]} p={[0.15, 3.65, 0]} m={M.plain('#f2c230')} />
          <FwCloths p={[0, 1.6, 0.15]} n={6} h={0.7} spread={0.3} seed={3} />
        </group>
        {/* the three carved stone images on a mud plinth, with older stones piled beside */}
        <group position={[-3.8, 0, 1.4]}>
          <Box s={[2.6, 0.55, 1.2]} p={[0, 0.3, 0]} m={earth2} />
          <Box s={[2.6, 1.2, 0.2]} p={[0, 1.2, -0.5]} m={earth} />
          {[-0.8, 0, 0.8].map((x) => (
            <group key={x} position={[x, 0.58, 0.1]}>
              <Box s={[0.55, 0.85, 0.12]} p={[0, 0.42, 0]} m={M.plain('#c07d5b')} />
              <Ball rad={0.12} p={[0, 0.72, 0.07]} m={M.plain('#a96a4b')} />
              <Box s={[0.26, 0.3, 0.05]} p={[0, 0.38, 0.07]} m={M.plain('#a96a4b')} />
            </group>
          ))}
          <FwRubble n={8} w={2.4} d={1.4} p={[-2.3, 0, 0.6]} m={stone} seed={5} size={0.4} />
        </group>
        {/* the rock face with the gas flames burning from dark niches, rice and flowers heaped below */}
        <group position={[4.6, 0, 1.8]}>
          {[[0, 0.55, 0, 1.1, 0.8, 1.0], [-0.9, 0.4, 0.3, 0.8, 0.6, 0.7], [0.9, 0.45, 0.1, 0.9, 0.7, 0.8], [0.1, 1.05, -0.2, 0.8, 0.6, 0.7]].map(([x, y, z, a, b, c], i) => <Ball key={i} rad={1} p={[x, y, z]} sc={[a, b, c]} m={M.mat('rock', 1, 1, { color: '#8a8478' })} />)}
          <Box s={[0.55, 0.4, 0.4]} p={[0, 0.52, 0.55]} m={M.plain('#120c08')} cast={false} />
          <FwFlame p={[0, 0.4, 0.65]} s={1.2} light />
          <Box s={[0.35, 0.3, 0.3]} p={[-0.95, 0.4, 0.8]} m={M.plain('#120c08')} cast={false} />
          <FwFlame p={[-0.95, 0.3, 0.9]} s={0.9} />
          {Array.from({ length: 14 }, (_, i) => <Box key={i} s={[0.07, 0.04, 0.05]} p={[(rnd(i, 3) - 0.5) * 1.9, 0.02 + (i % 3) * 0.02, 0.8 + rnd(i, 5) * 0.7]} m={M.plain(['#f4f1e4', '#d63a2c', '#f0c23a'][i % 3])} cast={false} />)}
        </group>
        <Trident p={[-1.6, 0.1, 3.6]} h={1.7} />
        {/* sapling hung with red and white prayer cloth, banana and canna plants by the wall */}
        <group position={[-5.9, 0, 3.2]}>
          <Cyl rt={0.04} rb={0.06} h={1.6} p={[0, 0.8, 0]} m={M.plain('#6b4a30')} seg={6} />
          <FwCloths p={[0, 1.5, 0]} n={14} h={0.8} spread={0.6} seed={8} />
        </group>
        {[[-6.2, -1.4], [6.4, -2.4], [6.6, 0.2]].map(([x, z], i) => (
          <group key={i} position={[x, 0, z]}>
            {[0, 1, 2, 3].map((k) => <mesh key={k} position={[Math.cos(k * 1.6) * 0.25, 0.9, Math.sin(k * 1.6) * 0.25]} rotation={[0.4 * Math.cos(k * 1.6), 0, 0.4 * Math.sin(k * 1.6)]} material={M.plain('#4f8a3a', { roughness: 0.9 })}><boxGeometry args={[0.18, 1.4, 0.03]} /></mesh>)}
          </group>
        ))}
        {/* dry-stone courtyard wall */}
        <Box s={[0.5, 0.8, 8]} p={[-7.2, 0.4, 0.2]} m={stone} />
        <Box s={[0.5, 0.6, 5]} p={[7.2, 0.3, -1.8]} m={stone} />
        <Frame s={[16, 5, 12]} p={[0, 2.5, 0.4]} />
      </group>
    );
  }
  function ShiraEnv() {
    const M = useM();
    const wall = M.mat('rock', 2, 1, { color: '#b5a791' });
    const slate = M.mat('rock', 2, 2, { color: '#6a6660' });
    return (
      <group>
        <GroundDisc r={24} y={-0.03} m={M.plain('#a85c3d', { roughness: 1 })} />
        <GroundDisc r={90} y={-0.06} m={M.plain('#9db06a', { roughness: 1 })} />
        {/* hillside village of Rawatkot: stone houses climbing green terraces */}
        <FwTerraces p={[-4, 0, -10]} r={0} w={40} n={8} rise={0.9} run={3.2} cols={['#7ea74b', '#b8b75c', '#6f9a40', '#a8a85a']} />
        {[[-16, -12], [-9, -17], [-1, -15], [7, -19], [14, -14], [20, -21], [-20, -22], [-12, -26], [3, -30], [12, -32]].map(([x, z], i) => (
          <FwHouse key={i} p={[x, Math.max(0, -z - 10) * 0.35 + 0.1, z]} r={rnd(i, 3) * 0.6 - 0.3} w={2.4} d={3.4} h={1.6} rh={0.8} wall={i % 3 ? wall : M.plain('#ece6d8')} roof={slate} />
        ))}
        <FwHill p={[-40, -3, -20]} sc={[30, 20, 40]} m={M.plain('#86a35a', { roughness: 1 })} />
        <FwHill p={[40, -3, -26]} sc={[30, 24, 40]} m={M.plain('#7a9a52', { roughness: 1 })} />
        <FwHill p={[0, -3, -62]} sc={[50, 30, 24]} m={M.plain('#7d8f6a', { roughness: 1 })} />
        <FwPeak p={[10, -2, -110]} r={34} h={48} rock={M.mat('rock', 4, 4, { color: '#8b8a90' })} />
        <FwBigTree p={[10, 0, -6]} s={1.3} col="#5f7e3e" />
        <FwBigTree p={[-14, 0, -4]} s={1.1} col="#6b8a45" />
        {[[-11, 8], [12, 9], [16, 1], [-15, 10]].map(([x, z], i) => <FwBigTree key={i} p={[x, 0, z]} s={0.9} col="#628142" />)}
        {Array.from({ length: 10 }, (_, i) => <Tree key={i} p={[-22 + i * 5, 0, 17 + (i % 2) * 2]} s={1.2} kind="pine" />)}
      </group>
    );
  }
  OUT['shirasthan-dullu'] = { Main: ShiraMain, Env: ShiraEnv };

  /* =====================================================================================
     Prithvi Malla's Kirtistambha, Dullu: grey rounded-top stone stele with a carved chaitya,
     large letters and rows of inscription, in a silver metal cage in Dullu bazaar
     ===================================================================================== */
  function FwStele({ w = 0.95, h = 3.4, d = 0.3, m }) {
    const geo = useMemo(() => {
      const s = new THREE.Shape();
      s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h - w / 2);
      s.absarc(0, h - w / 2, w / 2, 0, Math.PI, false); s.lineTo(-w / 2, 0);
      const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 20 });
      g.translate(0, 0, -d / 2);
      return g;
    }, [w, h, d]);
    return <mesh geometry={geo} material={m} castShadow receiveShadow />;
  }
  function useInscription() {
    return useMemo(() => {
      const c = document.createElement('canvas');
      c.width = 256; c.height = 768;
      const g = c.getContext('2d');
      g.fillStyle = '#7c817f'; g.fillRect(0, 0, 256, 768);
      g.fillStyle = 'rgba(0,0,0,0.05)';
      for (let i = 0; i < 200; i += 1) g.fillRect(rnd(i, 1) * 256, rnd(i, 2) * 768, 8 + rnd(i, 3) * 30, 2);
      g.strokeStyle = '#4a4f4e'; g.lineWidth = 6; g.lineJoin = 'round';
      // stepped chaitya near the top
      const cx = 128;
      [[70, 40], [96, 54], [122, 68], [148, 84]].forEach(([y, hw]) => { g.strokeRect(cx - hw, y, hw * 2, 18); });
      g.beginPath(); g.moveTo(cx, 30); g.lineTo(cx, 66); g.stroke();
      g.beginPath(); g.arc(cx, 26, 8, 0, Math.PI * 2); g.stroke();
      // one band of large letters
      g.lineWidth = 7;
      for (let i = 0; i < 6; i += 1) { const x = 36 + i * 36; g.beginPath(); g.moveTo(x - 12, 218); g.lineTo(x + 12, 218); g.moveTo(x, 218); g.quadraticCurveTo(x - 16, 250, x + 4, 270); g.stroke(); }
      // rows of small inscription
      g.lineWidth = 3;
      for (let r = 0; r < 22; r += 1) {
        const y = 310 + r * 20;
        g.beginPath(); g.moveTo(24, y - 8); g.lineTo(232, y - 8); g.stroke();
        for (let i = 0; i < 18; i += 1) { const x = 28 + i * 11.5; g.beginPath(); g.moveTo(x, y - 8); g.lineTo(x + 2, y + 4 + rnd(r * 18 + i, 6) * 4); g.stroke(); }
      }
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
      return t;
    }, []);
  }
  function KirtiMain() {
    const M = useM();
    const tex = useInscription();
    const grey = M.mat('rock', 1, 2, { color: '#8d918f' });
    const white = M.plain('#e8e6df', { roughness: 0.95 });
    const silver = M.plain('#c3c6ca', { metalness: 0.75, roughness: 0.35 });
    const rust = M.plain('#6b4a3a', { metalness: 0.5, roughness: 0.6 });
    const bars = (len, y, ax) => Array.from({ length: Math.round(len / 0.2) }, (_, i) => {
      const t = -len / 2 + 0.1 + i * 0.2;
      return ax === 'x' ? <Box key={`${ax}${i}`} s={[0.035, 1.5, 0.035]} p={[t, y, 0]} m={silver} cast={false} /> : <Box key={`${ax}${i}`} s={[0.035, 1.5, 0.035]} p={[0, y, t]} m={silver} cast={false} />;
    });
    return (
      <group>
        {/* whitewashed concrete plinth */}
        <Box s={[3.4, 0.35, 2.8]} p={[0, 0.17, 0]} m={white} />
        <Box s={[2.5, 0.3, 1.9]} p={[0, 0.5, 0]} m={white} />
        <group position={[0, 0.65, 0]}>
          <FwStele m={grey} />
          <mesh position={[0, 1.66, 0.155]} material={new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 })}>
            <planeGeometry args={[0.8, 2.4]} />
          </mesh>
          {/* the silver railing around it */}
          <group position={[0, 0, 0]}>
            <group position={[0, 0.75, 0.85]}>{bars(2.0, 0, 'x')}</group>
            <group position={[0, 0.75, -0.85]}>{bars(2.0, 0, 'x')}</group>
            <group position={[1.0, 0.75, 0]}>{bars(1.7, 0, 'z')}</group>
            <group position={[-1.0, 0.75, 0]}>{bars(1.7, 0, 'z')}</group>
            {[[0, 1.4, 0.85, 2.05, 0.05, 0.05], [0, 0.4, 0.85, 2.05, 0.05, 0.05], [0, 1.4, -0.85, 2.05, 0.05, 0.05], [0, 0.4, -0.85, 2.05, 0.05, 0.05], [1.0, 1.4, 0, 0.05, 0.05, 1.75], [1.0, 0.4, 0, 0.05, 0.05, 1.75], [-1.0, 1.4, 0, 0.05, 0.05, 1.75], [-1.0, 0.4, 0, 0.05, 0.05, 1.75]].map(([x, y, z, a, b, c], i) => <Box key={i} s={[a, b, c]} p={[x, y, z]} m={silver} cast={false} />)}
            {[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([a, b], i) => <Box key={i} s={[0.08, 1.6, 0.08]} p={[a, 0.8, b * 0.85]} m={silver} cast={false} />)}
          </group>
        </group>
        {/* small carved stone pillars and a chaitya nearby, as photographed */}
        {[[-3.2, 1.8, 1.1], [-2.5, 2.4, 0.8], [-3.7, 2.8, 0.7]].map(([x, z, h], i) => (
          <group key={i} position={[x, 0, z]}>
            <Box s={[0.3, h, 0.3]} p={[0, h / 2, 0]} m={grey} />
            <Cyl rt={0.2} rb={0.22} h={0.14} p={[0, h + 0.05, 0]} m={grey} seg={8} />
            <Ball rad={0.17} sc={[1, 1.4, 1]} p={[0, h + 0.28, 0]} m={grey} />
          </group>
        ))}
        <group position={[3.4, 0, 1.6]}>
          {[[0, 0, 0.4], [0.05, 0, 0.32]].map(([x, z, s], i) => <Box key={i} s={[0.55 - i * 0.12, 0.35, 0.55 - i * 0.12]} p={[x, 0.18 + i * 0.35, z - 0.4]} m={grey} />)}
          <Ball rad={0.2} p={[0, 0.84, -0.4]} sc={[1, 1.3, 1]} m={grey} />
          {/* stacked fragment caged behind rusty bars */}
          {Array.from({ length: 6 }, (_, i) => <Box key={i} s={[0.04, 0.9, 0.04]} p={[1.0 + i * 0.16, 0.45, 0.2]} m={rust} cast={false} />)}
          <Box s={[0.7, 0.9, 0.5]} p={[1.4, 0.45, 0]} m={grey} />
        </group>
        <Frame s={[10, 4.6, 6]} p={[-0.2, 2.3, 0.6]} />
      </group>
    );
  }
  function KirtiEnv() {
    const M = useM();
    const wall = M.mat('rock', 2, 1, { color: '#a99b84' });
    const shingle = M.plain('#6d5440', { roughness: 1 });
    const wood = M.plain('#6b4a32', { roughness: 0.9 });
    return (
      <group>
        <GroundDisc r={20} y={-0.02} m={M.mat('stone', 7, 7, { color: '#c9bfae' })} />
        <GroundDisc r={90} y={-0.06} m={M.plain('#9a9168', { roughness: 1 })} />
        {/* Dullu bazaar: stone houses with wooden balconies and brown shingle roofs round the little square */}
        {[[-8, -2, 0.2], [-9.2, 4, -0.3], [8.5, -3, 3.1], [9.5, 3, 2.9], [0, -9.5, 1.6], [-5.5, -8.5, 1.3], [6, -8.5, 1.9]].map(([x, z, r], i) => (
          <group key={i}>
            <FwHouse p={[x, 0, z]} r={r + (x > 0 ? Math.PI / 2 : -Math.PI / 2) - (x > 0 ? 0 : 0) + (Math.abs(z) > 8 ? Math.PI / 2 * 0 : 0)} w={3.4} d={3.8} h={1.7} storeys={i % 2 ? 2 : 1} rh={1.0} wall={i % 3 === 0 ? M.plain('#e3dccd') : wall} roof={i % 2 ? shingle : M.plain('#8a8f94', { metalness: 0.5, roughness: 0.5 })} bal={i % 2 === 1} />
          </group>
        ))}
        <Box s={[0.14, 5, 0.14]} p={[5.4, 2.5, 4.6]} m={wood} />
        <Box s={[1.2, 0.08, 0.08]} p={[5.4, 4.7, 4.6]} m={wood} />
        <FwHill p={[-34, -3, -26]} sc={[34, 22, 40]} m={M.plain('#8f8458', { roughness: 1 })} />
        <FwHill p={[36, -3, -30]} sc={[34, 26, 40]} m={M.plain('#827a52', { roughness: 1 })} />
        <FwHill p={[0, -3, -60]} sc={[60, 30, 26]} m={M.plain('#8aa070', { roughness: 1 })} />
        <FwPeak p={[-20, -2, -110]} r={34} h={52} rock={M.mat('rock', 4, 4, { color: '#8b8a90' })} />
        <FwPeak p={[26, -2, -116]} r={38} h={60} rock={M.mat('rock', 4, 4, { color: '#85848c' })} />
        {[[-12, 8], [12, 9], [-14, -12], [15, -12]].map(([x, z], i) => <FwBigTree key={i} p={[x, 0, z]} s={0.9} col="#62803f" />)}
        {Array.from({ length: 12 }, (_, i) => <Tree key={i} p={[-26 + i * 5, 0, -17 - (i % 2) * 3]} s={1.5} kind="pine" />)}
      </group>
    );
  }
  OUT['dullu-kirtistambha'] = { Main: KirtiMain, Env: KirtiEnv };

  // @@NEXT
  return OUT;
}
