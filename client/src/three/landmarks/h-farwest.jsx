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
        <FwRubble n={18} w={9} d={7} p={[-2.6, 0, 2.4]} m={M.plain('#bda982', { roughness: 1 })} seed={4} size={0.55} />
        <FwRubble n={8} w={5} d={4} p={[4.4, 0, -2]} m={M.plain('#bda982', { roughness: 1 })} seed={9} size={0.45} />
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
        <group position={[10.4, 0, 7.4]} rotation={[0, 0.95, 0]} scale={0.85}>
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
        <group position={[4.6, 0.01, 4.2]} rotation={[0, 0.95, 0]}><mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[2.2, 10]} /><meshStandardMaterial color="#cdbb92" roughness={1} /></mesh></group>
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
    const stoneWall = M.plain('#b3a893', { roughness: 1 });
    const wash = M.plain('#d7cfc0', { roughness: 0.9 });
    const roofs = [M.plain('#8d9398', { metalness: 0.5, roughness: 0.5 }), M.plain('#3a67b0', { metalness: 0.4, roughness: 0.5 }), M.plain('#7a5a48', { roughness: 0.9 }), M.plain('#7b7772', { roughness: 1 })];
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
        <Box s={[0.7, 0.4, 0.7]} p={[0, 0.2, 0]} m={M.plain('#8d877d', { roughness: 1 })} />
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
    const slab = M.plain('#a49e92', { roughness: 1 });
    const slate = M.plain('#8a8d8a', { roughness: 1 });
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
        <Box s={[0.55, 3.2, 0.2]} p={[-4.6, 1.5, 3.0]} r={[0, 0.5, 0.22]} m={M.plain('#5f6764', { roughness: 0.9 })} />
        <Box s={[0.4, 1.4, 0.18]} p={[-5.7, 0.6, 2.2]} r={[0.2, 0.3, -0.3]} m={M.plain('#5f6764', { roughness: 0.9 })} />
        <Frame s={[14, 5.8, 8]} p={[0.6, 2.9, 0]} />
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
        {/* the dry-stone walls of the fort Yatse near Hat Sinja */}
        {[[-14, -9, 7, 1.3, 0.1], [-17.4, -7, 4.4, 0.9, 1.57], [-12.5, -7.2, 2.4, 0.6, 0.4]].map(([x, z, l, h, r], k) => <Box key={k} s={[l, h, 0.7]} p={[x, h / 2, z]} r={[0, r, 0]} m={M.plain('#b0a58e', { roughness: 1 })} />)}
        <FwRubble n={14} w={7} d={4} p={[-14, 0, -7.6]} m={M.plain('#b0a58e', { roughness: 1 })} seed={6} size={0.5} />
        <GroundDisc r={110} y={-0.06} m={M.plain('#a69a6c', { roughness: 1 })} />
        {segs.map((s, i) => <Water key={i} w={3.8} d={s.l} p={[s.x, 0.02, s.z]} r={s.r} color="#6f9a9c" />)}
        {segs.map((s, i) => <Box key={`b${i}`} s={[0.6 + rnd(i, 2), 0.2, 0.8]} p={[s.x + (rnd(i, 4) - 0.5) * 5, 0.05, s.z]} r={[0, rnd(i, 3) * 3, 0]} m={M.plain('#bdb3a0', { roughness: 1 })} />)}
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
          <mesh position={[0, 6, 0]} scale={[1, 1, 1]} material={M.plain('#c9a77f', { roughness: 1 })} castShadow><cylinderGeometry args={[7, 10, 12, 7]} /></mesh>
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
    const slate = M.plain('#7a766f', { roughness: 1 });
    const stone = M.plain('#a29b8e', { roughness: 1 });
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
          {[[0, 0.55, 0, 1.1, 0.8, 1.0], [-0.9, 0.4, 0.3, 0.8, 0.6, 0.7], [0.9, 0.45, 0.1, 0.9, 0.7, 0.8], [0.1, 1.05, -0.2, 0.8, 0.6, 0.7]].map(([x, y, z, a, b, c], i) => <Ball key={i} rad={1} p={[x, y, z]} sc={[a, b, c]} m={M.plain('#9b958a', { roughness: 1 })} />)}
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
        <Frame s={[14, 4.6, 10]} p={[0, 2.3, 0.4]} />
      </group>
    );
  }
  function ShiraEnv() {
    const M = useM();
    const wall = M.plain('#cbbfa6', { roughness: 1 });
    const slate = M.plain('#7a766f', { roughness: 1 });
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
    const grey = M.plain('#9a9e9b', { roughness: 1 });
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
        <Frame s={[8.4, 4.4, 5]} p={[-0.2, 2.2, 0.4]} />
      </group>
    );
  }
  function KirtiEnv() {
    const M = useM();
    const wall = M.plain('#cbbfa6', { roughness: 1 });
    const shingle = M.plain('#6d5440', { roughness: 1 });
    const wood = M.plain('#6b4a32', { roughness: 0.9 });
    return (
      <group>
        <GroundDisc r={20} y={-0.02} m={M.plain('#b8ae9b', { roughness: 1 })} />
        <GroundDisc r={90} y={-0.06} m={M.plain('#9a9168', { roughness: 1 })} />
        {/* Dullu bazaar: stone houses with wooden balconies and brown shingle roofs round the little square */}
        {[[-11, -2, 0.2], [-12, 5, -0.3], [11.5, -3, 3.1], [12.5, 4, 2.9], [0, -12, 1.6], [-7.5, -11, 1.3], [8, -11, 1.9]].map(([x, z, r], i) => (
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

  /* ---------- more shared helpers ---------- */
  /** Frustum (box with a different top size): the battered wall of a hill fort. */
  function FwFrustum({ w0, d0, w1, d1, h, m, p = [0, 0, 0], r = 0, off = 0 }) {
    const geo = useMemo(() => {
      const a = [[-w0 / 2, 0, -d0 / 2], [w0 / 2, 0, -d0 / 2], [w0 / 2, 0, d0 / 2], [-w0 / 2, 0, d0 / 2]];
      const b = [[-w1 / 2, h, -d1 / 2 + off], [w1 / 2, h, -d1 / 2 + off], [w1 / 2, h, d1 / 2 + off], [-w1 / 2, h, d1 / 2 + off]];
      const pos = []; const uv = []; const idx = [];
      const quad = (q0, q1, q2, q3) => { const i = pos.length / 3; [q0, q1, q2, q3].forEach((q) => pos.push(...q)); uv.push(0, 0, 1, 0, 1, 1, 0, 1); idx.push(i, i + 1, i + 2, i, i + 2, i + 3); };
      quad(a[3], a[2], b[2], b[3]); // front +z
      quad(a[1], a[0], b[0], b[1]); // back
      quad(a[2], a[1], b[1], b[2]); // +x
      quad(a[0], a[3], b[3], b[0]); // -x
      quad(b[3], b[2], b[1], b[0]); // top
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setIndex(idx); g.computeVertexNormals();
      return g;
    }, [w0, d0, w1, d1, h, off]);
    return <mesh geometry={geo} material={m} position={p} rotation={[0, r, 0]} castShadow receiveShadow />;
  }
  let bellG = null;
  const bellGeo = () => bellG || (bellG = new THREE.LatheGeometry([[0.02, 0.2], [0.07, 0.18], [0.1, 0.05], [0.13, -0.1], [0.15, -0.13]].map(([x, y]) => new THREE.Vector2(x, y)), 12));
  /** Stone frame (two posts and a lintel) hung with rows of brass bells and crowned with tridents. */
  function FwBellFrame({ p = [0, 0, 0], r = 0, w = 2.8, h = 2.5, n = 9, rows = 2, stone, tridents = 0 }) {
    const M = useM();
    const brass = M.plain('#d2a846', { metalness: 0.45, roughness: 0.4 });
    return (
      <group position={p} rotation={[0, r, 0]}>
        {[-1, 1].map((k) => <Box key={k} s={[0.26, h, 0.26]} p={[k * w / 2, h / 2, 0]} m={stone} />)}
        <Box s={[w + 0.5, 0.26, 0.34]} p={[0, h + 0.1, 0]} m={stone} />
        {Array.from({ length: rows }, (_, rw) => (
          <group key={rw}>
            <Box s={[w, 0.04, 0.04]} p={[0, h - 0.2 - rw * 0.55, 0]} m={M.dark} cast={false} />
            {Array.from({ length: n }, (_, i) => (
              <mesh key={i} geometry={bellGeo()} material={brass} position={[-w / 2 + 0.2 + (i * (w - 0.4)) / (n - 1), h - 0.42 - rw * 0.55 - (i % 2) * 0.12, (i % 2) * 0.05]} scale={0.85 + (i % 3) * 0.15} castShadow />
            ))}
          </group>
        ))}
        {Array.from({ length: tridents }, (_, i) => <Trident key={i} p={[-w / 2 + 0.3 + (i * (w - 0.6)) / Math.max(1, tridents - 1), h + 0.22, 0]} h={0.7 + (i % 3) * 0.2} />)}
      </group>
    );
  }
  /** Carved stone pillar: square plinth, shaft, carved collar blocks and a bracketed capital. */
  function FwStonePillar({ p, h = 2, m, m2 }) {
    return (
      <group position={p}>
        <Box s={[0.42, 0.28, 0.42]} p={[0, 0.14, 0]} m={m2} />
        <Box s={[0.3, h - 0.9, 0.3]} p={[0, 0.28 + (h - 0.9) / 2, 0]} m={m} />
        <Box s={[0.36, 0.3, 0.36]} p={[0, h * 0.5, 0]} m={m2} />
        <Box s={[0.4, 0.2, 0.4]} p={[0, h - 0.5, 0]} m={m2} />
        <Box s={[0.62, 0.16, 0.62]} p={[0, h - 0.32, 0]} m={m} />
        <Box s={[1.0, 0.2, 0.3]} p={[0, h - 0.14, 0]} m={m2} />
        <Box s={[0.3, 0.2, 1.0]} p={[0, h - 0.14, 0]} m={m2} />
      </group>
    );
  }
  /** Hip pavilion: four pillars, a heavy lintel slab and a stepped stone-slab pyramid roof topped with an amalaka. */
  function FwStonePavilion({ p = [0, 0, 0], r = 0, w = 3, h = 2, steps = 4, m, m2 }) {
    const pil = w / 2 - 0.3;
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[w + 0.8, 0.25, w + 0.8]} p={[0, 0.12, 0]} m={m2} />
        <Box s={[w + 0.4, 0.22, w + 0.4]} p={[0, 0.36, 0]} m={m} />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], i) => <FwStonePillar key={i} p={[a * pil, 0.4, b * pil]} h={h} m={m} m2={m2} />)}
        <Box s={[w + 0.5, 0.3, w + 0.5]} p={[0, h + 0.55, 0]} m={m} />
        {Array.from({ length: steps }, (_, i) => <Box key={i} s={[w + 0.3 - i * ((w - 0.4) / steps), 0.26, w + 0.3 - i * ((w - 0.4) / steps)]} p={[0, h + 0.83 + i * 0.26, 0]} m={i % 2 ? m2 : m} />)}
        <Cyl rt={0.3} rb={0.26} h={0.14} p={[0, h + 0.97 + steps * 0.26, 0]} m={m2} seg={8} />
        <Ball rad={0.3} sc={[1, 0.45, 1]} p={[0, h + 1.15 + steps * 0.26, 0]} m={m2} />
      </group>
    );
  }
  /** A pitched-roof lodge with a veranda on timber posts (used by the hill sanctuaries). */
  function FwTrident({ p, h = 1.4, rot = [0, 0, 0] }) {
    const M = useM();
    const iron = M.plain('#5a3326', { metalness: 0.6, roughness: 0.6 });
    return (
      <group position={p} rotation={rot}>
        <Cyl rt={0.02} h={h} p={[0, h / 2, 0]} m={iron} seg={5} />
        {[-0.14, 0, 0.14].map((x) => <mesh key={x} position={[x, h + 0.1, 0]} material={iron}><coneGeometry args={[0.025, x ? 0.3 : 0.4, 5]} /></mesh>)}
        <Box s={[0.32, 0.03, 0.03]} p={[0, h, 0]} m={iron} />
      </group>
    );
  }

  /* =====================================================================================
     Badimalika, Bajura: a bare grassy ridge at about 4200 m, a small white pyramid-roofed shrine
     inside dry-stone walls, an open white pavilion, stone frames hung with bells and tridents
     ===================================================================================== */
  function BadiMain() {
    const M = useM();
    const white = M.plain('#f1f0ea', { roughness: 0.9 });
    const dry = M.plain('#8c877d', { roughness: 1 });
    const dry2 = M.plain('#a49e90', { roughness: 1 });
    const slab = M.plain('#8d8a83', { roughness: 0.95 });
    const slateM = M.plain('#6f6c66', { roughness: 0.95 });
    return (
      <group>
        <Box s={[11.6, 0.2, 7.6]} p={[0, 0.1, 0]} m={M.plain('#9b9080', { roughness: 1 })} cast={false} />
        {/* dry-stone enclosure with an opening on the front */}
        <Box s={[11, 1.0, 0.55]} p={[0, 0.7, -3.4]} m={dry} />
        <Box s={[0.55, 1.0, 7]} p={[-5.5, 0.7, 0]} m={dry} />
        <Box s={[0.55, 1.0, 7]} p={[5.5, 0.7, 0]} m={dry} />
        <Box s={[4.2, 0.9, 0.55]} p={[-3.4, 0.65, 3.4]} m={dry} />
        <Box s={[4.2, 0.9, 0.55]} p={[3.4, 0.65, 3.4]} m={dry} />
        {Array.from({ length: 6 }, (_, i) => <Box key={i} s={[10.6, 0.05, 0.6]} p={[0, 0.3 + i * 0.16, -3.42]} m={i % 2 ? dry2 : dry} cast={false} />)}
        {/* the small white shrine under a pyramid of grey stone slabs */}
        <group position={[0.6, 0.2, -0.6]}>
          <Box s={[2.5, 1.5, 2.5]} p={[0, 0.75, 0]} m={white} />
          <Box s={[0.7, 0.9, 0.06]} p={[0, 0.5, 1.27]} m={M.dark} cast={false} />
          <FwPyr p={[0, 2.1, 0]} w={3.3} h={1.3} m={slab} />
          <Box s={[0.35, 0.22, 0.35]} p={[0, 2.8, 0]} m={white} />
          <FwTrident p={[0, 2.88, 0]} h={0.8} />
          <Box s={[0.5, 0.6, 0.9]} p={[1.9, 0.3, 0.6]} m={white} />
          <Box s={[0.7, 0.5, 0.7]} p={[-1.8, 0.25, 1.0]} m={white} />
        </group>
        {/* open white pavilion with a dark slate hip roof, left */}
        <group position={[-3.4, 0.2, 0.6]}>
          <Box s={[2.8, 0.3, 2.8]} p={[0, 0.15, 0]} m={white} />
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], i) => <Box key={i} s={[0.3, 1.8, 0.3]} p={[a * 1.1, 1.2, b * 1.1]} m={white} />)}
          <Box s={[2.9, 0.18, 2.9]} p={[0, 2.2, 0]} m={M.plain('#4a3a30')} />
          <Roof w={3.6} d={3.6} h={0.9} y={2.28} m={slateM} sag={1.2} lift={0.05} />
          <Box s={[0.18, 0.18, 0.04]} p={[0.9, 1.6, 1.28]} m={M.plain('#c4281f')} cast={false} />
        </group>
        {/* the two bell frames and the heap of tridents */}
        <FwBellFrame p={[3.6, 0.2, 1.6]} w={2.8} h={2.5} n={9} rows={2} stone={M.plain('#9a968e', { roughness: 0.95 })} />
        <FwBellFrame p={[4.4, 0.2, -0.6]} w={2.2} h={2.1} n={8} rows={3} stone={M.plain('#8a867e', { roughness: 0.95 })} tridents={4} />
        <group position={[2.0, 0.2, 2.4]}>
          <Box s={[1.4, 0.4, 0.9]} p={[0, 0.2, 0]} m={dry2} />
          {Array.from({ length: 9 }, (_, i) => <FwTrident key={i} p={[-0.5 + i * 0.13, 0.4, (i % 3) * 0.1 - 0.1]} h={1.0 + (i % 4) * 0.25} rot={[(i % 3 - 1) * 0.12, 0, (i % 5 - 2) * 0.09]} />)}
        </group>
        {/* flag pole with the red and white pennant */}
        <Cyl rt={0.03} h={3.6} p={[-1.6, 1.9, -0.4]} m={M.plain('#e8e4dc')} seg={6} />
        <mesh position={[-1.6, 3.2, -0.4]} rotation={[0, 0.2, 0]}><planeGeometry args={[0.35, 0.8]} /><meshStandardMaterial color="#c4281f" side={DS} /></mesh>
        <Frame s={[14, 5, 9]} p={[0.4, 2.5, 0]} />
      </group>
    );
  }
  function BadiEnv() {
    const M = useM();
    const grass = M.plain('#a89868', { roughness: 1 });
    const green = M.plain('#7a9a4e', { roughness: 1 });
    return (
      <group>
        <GroundDisc r={15} y={-0.02} m={grass} />
        {/* the summit mound falling away steeply on every side */}
        <mesh position={[0, -8, 0]} material={M.plain('#86995a', { roughness: 1 })} receiveShadow><cylinderGeometry args={[15, 38, 16, 36]} /></mesh>
        <GroundDisc r={120} y={-16} m={M.plain('#8f9e68', { roughness: 1 })} />
        {Array.from({ length: 9 }, (_, i) => <Ball key={i} rad={1} p={[Math.cos(i * 0.9) * 10, 0, Math.sin(i * 0.9) * 8]} sc={[1.5, 0.15, 1.2]} m={M.plain('#bca878', { roughness: 1 })} />)}
        <FwHill p={[-30, -14, -12]} sc={[22, 22, 16]} m={green} />
        <FwHill p={[32, -14, -18]} sc={[24, 26, 18]} m={M.plain('#7d9e4c', { roughness: 1 })} />
        <FwHill p={[-10, -14, -42]} sc={[30, 24, 16]} m={M.plain('#8aa05a', { roughness: 1 })} />
        <FwHill p={[26, -14, 30]} sc={[22, 18, 16]} m={green} />
        {/* a sea of cloud below the ridge and the white range beyond */}
        {Array.from({ length: 16 }, (_, i) => { const a = i * 0.4 + 0.2; const rr = 30 + (i % 4) * 9; return <Ball key={i} rad={1} p={[Math.cos(a) * rr, -9 - (i % 3) * 1.5, Math.sin(a) * rr]} sc={[10 + (i % 3) * 3, 1.6, 7]} m={M.plain('#f6f7fa', { roughness: 1 })} />; })}
        <FwPeak p={[-46, -8, -76]} r={22} h={46} rock={M.plain('#8a8b94', { roughness: 1 })} />
        <FwPeak p={[-6, -8, -92]} r={28} h={58} rock={M.plain('#85868f', { roughness: 1 })} />
        <FwPeak p={[38, -8, -80]} r={24} h={48} rock={M.plain('#8a8b94', { roughness: 1 })} />
        <FwPeak p={[70, -8, -40]} r={20} h={38} rock={M.plain('#8a8b94', { roughness: 1 })} />
      </group>
    );
  }
  OUT['badimalika-temple'] = { Main: BadiMain, Env: BadiEnv };

  /* =====================================================================================
     Ugratara, Dadeldhura: concrete pagoda-style hilltop temple painted pink and turquoise, striped
     stair with guardian figures, lions over the door, long arcaded hall, prayer flags everywhere
     ===================================================================================== */
  const PINK = '#ef9fb8';
  const TEAL = '#33b3a6';
  function UgraMain() {
    const M = useM();
    const pink = M.plain(PINK, { roughness: 0.8 });
    const teal = M.plain(TEAL, { roughness: 0.8 });
    const white = M.plain('#f3f0e8', { roughness: 0.85 });
    const goldy = M.plain('#d9a43a', { metalness: 0.6, roughness: 0.45 });
    const brick = M.plain('#a49a8c', { roughness: 0.95 });
    const dark = M.plain('#2b2220');
    const tin = M.plain('#5a4640', { metalness: 0.4, roughness: 0.6 });
    const tiers = [[9.4, 7.6, 0.8], [7.8, 6.2, 0.8], [6.2, 4.8, 0.8]];
    const stairs = Array.from({ length: 9 }, (_, k) => ({ y: (k + 1) * 0.267, z: 7.0 - (k + 0.5) * 0.5 }));
    return (
      <group>
        {/* three tiers of the platform, each in bands of teal, white and pink */}
        {tiers.map(([w, d, h], t) => (
          <group key={t}>
            <Box s={[w, h / 3, d]} p={[0, t * h + h / 6, 0]} m={teal} />
            <Box s={[w + 0.04, h / 3, d + 0.04]} p={[0, t * h + h / 2, 0]} m={white} />
            <Box s={[w, h / 3, d]} p={[0, t * h + (5 * h) / 6, 0]} m={pink} />
          </group>
        ))}
        {/* the wide striped stair and its guardians */}
        {stairs.map((s, k) => <Box key={k} s={[2.8, s.y, 0.52]} p={[0, s.y / 2, s.z]} m={k % 2 ? pink : teal} />)}
        {[-1, 1].map((k) => (
          <group key={k}>
            <Box s={[0.3, 2.4, 4.8]} p={[k * 1.55, 1.2, 4.6]} m={white} />
            <group position={[k * 2.15, 0.3, 6.5]} scale={1.7} rotation={[0, k * 0.2, 0]}><Elephant m={white} /></group>
            <group position={[k * 2.15, 1.35, 4.6]} scale={1.7}><Lion m={M.plain('#f1d6a2')} /></group>
            <group position={[k * 1.8, 2.4, 3.0]} scale={1.8}><Lion m={M.plain('#e8a3b5')} /></group>
          </group>
        ))}
        {/* the sanctum: pink walls, striped teal-and-pink pillars, ornate arch crowned by lions and the goddess */}
        <group position={[0, 2.4, 0]}>
          <Box s={[4.2, 2.4, 3.4]} p={[0, 1.2, -0.3]} m={pink} />
          <Box s={[1.3, 1.7, 0.12]} p={[0, 0.9, 1.42]} m={dark} cast={false} />
          <Box s={[1.6, 0.14, 0.2]} p={[0, 1.8, 1.45]} m={teal} />
          {[-1.6, -0.55, 0.55, 1.6].map((x) => (
            <group key={x} position={[x, 0, 1.9]}>
              <Cyl rt={0.11} h={0.9} p={[0, 0.45, 0]} m={teal} seg={10} />
              <Cyl rt={0.11} h={0.9} p={[0, 1.35, 0]} m={M.plain('#f7c6d2')} seg={10} />
              <Box s={[0.3, 0.15, 0.3]} p={[0, 1.85, 0]} m={white} />
            </group>
          ))}
          <Box s={[4.3, 0.22, 0.34]} p={[0, 2.0, 1.95]} m={teal} />
          <Box s={[4.5, 0.16, 3.7]} p={[0, 2.5, -0.3]} m={teal} />
          <Box s={[4.1, 0.3, 3.3]} p={[0, 2.7, -0.3]} m={pink} />
          {/* torana arch with lions and a seated goddess */}
          <group position={[0, 2.85, 1.2]}>
            <mesh position={[0, 0.7, 0]} material={M.plain('#2fa89c')}><torusGeometry args={[0.9, 0.12, 8, 28, Math.PI]} /></mesh>
            <mesh position={[0, 0.7, 0]} material={M.plain('#6bd06e')}><torusGeometry args={[0.66, 0.07, 8, 28, Math.PI]} /></mesh>
            <Box s={[2.2, 0.16, 0.2]} p={[0, 0.7, 0]} m={teal} />
            <group position={[0, 0.78, 0.04]} scale={1.6}><Goddess m={goldy} /></group>
            {[-1, 1].map((k) => <group key={k} position={[k * 1.1, 0.78, 0]} scale={1.3} rotation={[0, k * -0.5, 0]}><Lion m={goldy} /></group>)}
            <mesh position={[0, 1.8, 0]} material={goldy}><coneGeometry args={[0.07, 0.4, 8]} /></mesh>
          </group>
          {/* two small tiered roofs of the old tower rising behind */}
          <Box s={[2.0, 1.1, 2.0]} p={[0, 3.55, -0.9]} m={pink} />
          <Roof w={3.4} d={3.4} h={0.7} y={4.05} m={tin} />
          <Box s={[1.2, 0.8, 1.2]} p={[0, 4.9, -0.9]} m={pink} />
          <Roof w={2.2} d={2.2} h={0.55} y={5.2} m={tin} />
          <Gajur y={5.6} s={0.6} />
        </group>
        {/* the long arcaded hall with bracket pillars on the right */}
        <group position={[8.6, 0, 0.5]} rotation={[0, -Math.PI / 2, 0]}>
          <Box s={[11.6, 0.3, 4.6]} p={[0, 0.15, 0]} m={white} />
          <Box s={[11, 2.2, 0.4]} p={[0, 1.4, -1.7]} m={brick} />
          <Box s={[11.2, 0.2, 3.7]} p={[0, 2.6, 0.2]} m={pink} />
          {Array.from({ length: 8 }, (_, i) => {
            const x = -5.2 + i * 1.5;
            return (
              <group key={i} position={[x, 0.3, 1.6]}>
                <Cyl rt={0.1} h={0.9} p={[0, 0.45, 0]} m={i % 2 ? teal : pink} seg={8} />
                <Cyl rt={0.1} h={0.9} p={[0, 1.35, 0]} m={i % 2 ? pink : teal} seg={8} />
                <Box s={[0.5, 0.16, 0.2]} p={[0, 1.88, 0]} m={white} />
                <Ball rad={0.13} p={[0, 1.98, 0.14]} m={white} />
              </group>
            );
          })}
          <group position={[0, 2.7, 0.1]} rotation={[0, 0, 0]}><FwGable w={4.2} d={11.4} h={1.1} m={M.plain('#6a4a42', { roughness: 0.9 })} ov={0.45} wallM={pink} /></group>
          <Box s={[11.4, 0.14, 0.14]} p={[0, 2.5, 2.05]} m={pink} />
        </group>
        <Frame s={[22, 8.4, 15]} p={[3.2, 4.2, 0.4]} />
      </group>
    );
  }
  function UgraEnv() {
    const M = useM();
    const pink = M.plain(PINK, { roughness: 0.8 });
    const teal = M.plain(TEAL, { roughness: 0.8 });
    const FL = ['#d63a2c', '#2f6db5', '#f2efe6', '#2e8b57', '#e2b33c'];
    return (
      <group>
        <GroundDisc r={30} y={-0.02} m={M.plain('#b8b274', { roughness: 1 })} />
        <mesh position={[0, -5, 0]} material={M.plain('#8ea45a', { roughness: 1 })}><cylinderGeometry args={[30, 52, 10, 40]} /></mesh>
        <GroundDisc r={130} y={-10} m={M.plain('#8aa05e', { roughness: 1 })} />
        {/* paved walk with its yellow guide strip, up to the painted entrance arch */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 14]}><planeGeometry args={[2.6, 17]} /><meshStandardMaterial color="#b49a8c" roughness={1} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 14]}><planeGeometry args={[0.5, 17]} /><meshStandardMaterial color="#e6c447" roughness={1} /></mesh>
        <group position={[0, 0, 22.5]}>
          {[-1, 1].map((k) => <Box key={k} s={[0.8, 3.4, 0.8]} p={[k * 2.6, 1.7, 0]} m={M.plain('#d8b9a8')} />)}
          <Box s={[6.6, 0.8, 0.9]} p={[0, 3.7, 0]} m={pink} />
          <Box s={[6.6, 0.14, 0.95]} p={[0, 3.2, 0]} m={teal} />
          <mesh position={[0, 4.3, 0]} material={M.plain('#2fa89c')}><torusGeometry args={[0.85, 0.12, 8, 24, Math.PI]} /></mesh>
          <group position={[0, 4.1, 0.1]} scale={1.8}><Goddess m={M.plain('#d9a43a', { metalness: 0.5 })} /></group>
          {[-1, 1].map((k) => <group key={k} position={[k * 1.5, 4.1, 0]} scale={1.5} rotation={[0, k * -0.6, 0]}><Lion m={M.plain('#d9a43a', { metalness: 0.5 })} /></group>)}
        </group>
        {/* prayer flags on tall poles all round the platform */}
        {[[-6.5, -4, 9], [6.5, -4, 8], [-7.5, 5.5, 8.4], [7.8, 6.5, 8], [0, -6, 9.6]].map(([x, z, h], i) => <Cyl key={i} rt={0.04} h={h} p={[x, h / 2, z]} m={M.plain('#e9e3d2')} seg={6} />)}
        {Array.from({ length: 8 }, (_, i) => <PrayerFlags key={i} from={[[-6.5, 6.5, -7.5, 7.8, 0, -6.5, 6.5, 0][i], [9, 8, 8.4, 8, 9.6, 9, 8, 9.6][i], [-4, -4, 5.5, 6.5, -6, -4, -4, -6][i]]} to={[[-14, 14, -15, 15, -9, 6.5, -6.5, 8][i], 0.8, [8, 6, 14, 13, -14, 15, -15, 10][i]]} n={16} />)}
        {/* the pines close in on three sides */}
        {Array.from({ length: 40 }, (_, i) => {
          const a = (i / 40) * Math.PI * 2; if (Math.sin(a) > 0.55) return null;
          const rr = 19 + rnd(i, 4) * 8;
          return <Tree key={i} p={[Math.cos(a) * rr, 0, Math.sin(a) * rr]} s={2.2 + rnd(i, 2) * 1.3} kind="pine" />;
        })}
        {[[-14, 14], [14, 15], [-18, 8], [18, 8]].map(([x, z], i) => <FwBigTree key={i} p={[x, 0, z]} s={1.2} col="#69803f" />)}
        <FwHill p={[-50, -8, -30]} sc={[34, 26, 40]} m={M.plain('#7f9a64', { roughness: 1 })} />
        <FwHill p={[52, -8, -34]} sc={[36, 30, 40]} m={M.plain('#76935e', { roughness: 1 })} />
        <FwHill p={[0, -8, -80]} sc={[70, 34, 30]} m={M.plain('#8aa4a0', { roughness: 1 })} />
        <FwPeak p={[-30, -6, -140]} r={40} h={60} rock={M.plain('#9a9aa6', { roughness: 1 })} />
      </group>
    );
  }
  OUT['ugratara-temple-dadeldhura'] = { Main: UgraMain, Env: UgraEnv };

  /* =====================================================================================
     Ajaymerukot, Dadeldhura: Doti palace-fort ruins on a ridge, dry-stone walls, stacked-stone
     shikhara shrines, pillared stone mandapas, the Aguwa river curling round three sides
     ===================================================================================== */
  function AjayMain() {
    const M = useM();
    const g1 = M.plain('#9a9588', { roughness: 1 });
    const g2 = M.plain('#b6a98a', { roughness: 1 });
    const g3 = M.plain('#8a8880', { roughness: 1 });
    const dark = M.plain('#2a241c');
    const walls = [[-8.5, -4.2, 6.5, 2.2], [-3.2, -4.4, 4.4, 1.7], [1.6, -4.3, 5.2, 2.5], [6.6, -4.2, 3.6, 1.4], [-11.6, -1.2, 5, 1.9], [-11.5, 3.4, 4, 1.2]];
    return (
      <group>
        <Box s={[9, 0.3, 6]} p={[-3.5, 0.1, 1]} m={g3} cast={false} />
        {/* the tall stacked-stone shikhara with the stepped pavilion roof in front of it */}
        <group position={[-3.6, 0.3, -1.4]}><FwShikhara w={2.1} hBase={1.6} hSpire={4.0} tiers={9} topScale={0.38} m={g2} m2={g1} dark={dark} gold={false} /></group>
        <FwStonePavilion p={[-3.6, 0.3, 1.5]} w={2.0} h={1.5} steps={4} m={g2} m2={g1} />
        {/* second, smaller shikhara with a broken crown */}
        <group position={[0.6, 0.3, -2.6]}><FwShikhara w={1.7} hBase={1.3} hSpire={2.2} tiers={5} topScale={0.5} m={g1} m2={g3} dark={dark} gold={false} /></group>
        {/* the royal baithak: pillared stone pavilion with its heavy lintel */}
        <FwStonePavilion p={[5.6, 0.3, 1.4]} w={2.6} h={1.9} steps={3} m={g2} m2={g1} />
        {/* ruined mandapa on the left: four pillars and one cracked lintel, fallen slabs below */}
        <group position={[-9.2, 0.3, 2.8]}>
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], i) => <FwStonePillar key={i} p={[a * 1.1, 0, b * 1.1]} h={1.9 - (i === 3 ? 0.5 : 0)} m={g2} m2={g1} />)}
          <Box s={[3.0, 0.4, 0.7]} p={[0, 2.2, -1.1]} r={[0, 0, 0.04]} m={g2} />
          <Box s={[1.6, 0.4, 0.7]} p={[-0.2, 0.25, 1.6]} r={[0.1, 0.4, 0]} m={g2} />
          <Box s={[1.1, 0.3, 0.6]} p={[1.5, 0.15, 1.9]} r={[0, -0.6, 0.12]} m={g1} />
        </group>
        {/* dry-stone palace walls with window gaps and ragged tops */}
        {walls.map(([x, z, l, h], i) => (
          <group key={i} position={[x, 0, z]} rotation={[0, x < -11 ? Math.PI / 2 : 0, 0]}>
            <Box s={[l, h, 0.8]} p={[0, h / 2, 0]} m={i % 2 ? g1 : g3} />
            {Array.from({ length: 5 }, (_, k) => <Box key={k} s={[0.5 + rnd(k + i, 2) * 0.7, 0.3 + rnd(k + i, 5) * 0.4, 0.82]} p={[-l / 2 + (k + 0.5) * (l / 5), h + 0.1, 0]} m={g1} />)}
            <Box s={[0.5, 0.6, 0.86]} p={[-l * 0.2, h * 0.6, 0]} m={dark} cast={false} />
          </group>
        ))}
        {/* carved pillar fragments and blocks lying about */}
        <FwStonePillar p={[-6.4, 0.2, 3.9]} h={0.9} m={g2} m2={g1} />
        <FwRubble n={22} w={16} d={9} p={[-3, 0, 1.5]} m={g1} seed={7} size={0.55} />
        <Box s={[1.7, 0.35, 0.5]} p={[2.4, 0.2, 4.0]} r={[0, 0.4, 0]} m={g2} />
        <Frame s={[19, 6.2, 11]} p={[-3.6, 3, 0.4]} />
      </group>
    );
  }
  function AjayEnv() {
    const M = useM();
    const dry = M.plain('#a8946a', { roughness: 1 });
    return (
      <group>
        <GroundDisc r={20} y={-0.02} m={dry} />
        <mesh position={[0, -6.5, 0]} material={M.plain('#a29064', { roughness: 1 })} receiveShadow><cylinderGeometry args={[20, 36, 13, 40]} /></mesh>
        <GroundDisc r={140} y={-13} m={M.plain('#93a265', { roughness: 1 })} />
        {/* the river curling round three sides of the ridge, far below */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -12.9, 0]}><ringGeometry args={[34, 40, 56, 1, 0.5, 4.7]} /><meshStandardMaterial color="#6d9aa0" metalness={0.3} roughness={0.2} side={DS} /></mesh>
        {Array.from({ length: 7 }, (_, i) => <FwTerraces key={i} p={[Math.cos(i * 0.9 + 0.6) * 48, -12.5, Math.sin(i * 0.9 + 0.6) * 48]} r={-(i * 0.9 + 0.6) - Math.PI / 2} w={14} n={4} rise={0.6} run={3} cols={['#9bb257', '#c8c062', '#7fa447']} />)}
        {/* forested hills all round */}
        <FwHill p={[-52, -13, -10]} sc={[34, 28, 40]} m={M.plain('#6f8a52', { roughness: 1 })} />
        <FwHill p={[50, -13, -24]} sc={[34, 32, 40]} m={M.plain('#657f4c', { roughness: 1 })} />
        <FwHill p={[0, -13, -62]} sc={[70, 34, 30]} m={M.plain('#718c58', { roughness: 1 })} />
        <FwHill p={[10, -13, 60]} sc={[60, 26, 24]} m={M.plain('#7a9560', { roughness: 1 })} />
        {Array.from({ length: 34 }, (_, i) => { const a = i * 0.7; const rr = 26 + (i % 5) * 4; return <Tree key={i} p={[Math.cos(a) * rr, -6 - (rr - 20) * 0.45, Math.sin(a) * rr]} s={2.4 + rnd(i, 3) * 1.2} kind={i % 3 ? 'pine' : 'broad'} />; })}
        {Array.from({ length: 10 }, (_, i) => <Tree key={`r${i}`} p={[Math.cos(i * 2.4) * 16, 0, Math.sin(i * 2.4) * 15]} s={1.2} kind="broad" />)}
        {Array.from({ length: 18 }, (_, i) => <Ball key={`s${i}`} rad={0.4} p={[Math.cos(i * 1.7) * (9 + rnd(i, 2) * 8), 0.1, Math.sin(i * 1.7) * (8 + rnd(i, 4) * 8)]} sc={[1, 0.8, 1]} m={M.plain('#b3a86e', { roughness: 1 })} />)}
      </group>
    );
  }
  OUT.ajaymerukot = { Main: AjayMain, Env: AjayEnv };

  /* =====================================================================================
     Amargadhi Fort, Dadeldhura: tall battered brown stone walls on a cliff, steep red-and-white
     striped steps, ochre guard house on top, watch towers, statue of Amar Singh Thapa
     ===================================================================================== */
  function AmarMain() {
    const M = useM();
    const stone = M.plain('#94704a', { roughness: 1 });
    const stone2 = M.plain('#86643f', { roughness: 1 });
    const timber = M.plain('#2a1f18', { roughness: 0.9 });
    const redM = M.plain('#c8463a', { roughness: 0.85 });
    const whiteM = M.plain('#f1efe9', { roughness: 0.9 });
    const green = M.plain('#2f6f5f', { metalness: 0.4, roughness: 0.5 });
    const ochre = M.plain('#d9b87a', { roughness: 1 });
    const stairs = Array.from({ length: 16 }, (_, k) => ({ y: (k + 1) * 0.22, z: 9.2 - (k + 0.5) * 0.36 }));
    return (
      <group>
        <Box s={[17, 0.25, 13]} p={[0, 0.1, -0.5]} m={M.plain('#b09670', { roughness: 1 })} cast={false} />
        {/* front battered wall with the timber banding seen in the photographs */}
        <FwFrustum w0={16} d0={2.6} w1={15} d1={1.0} h={3.6} m={stone} p={[0, 0, 3.4]} off={-0.5} />
        {[0.9, 1.8, 2.7].map((y, i) => <Box key={i} s={[15.2 - i * 0.2, 0.08, 0.1]} p={[0, y, 3.0 + 1.3 - y * 0.34 + 0.2]} m={timber} cast={false} />)}
        {/* side walls and back wall */}
        <FwFrustum w0={2.4} d0={13} w1={1.0} d1={13} h={3.4} m={stone2} p={[-7.8, 0, -2.2]} />
        <FwFrustum w0={2.4} d0={13} w1={1.0} d1={13} h={3.0} m={stone2} p={[7.8, 0, -2.2]} />
        <FwFrustum w0={16} d0={2.2} w1={14.8} d1={1.0} h={3.2} m={stone} p={[0, 0, -8.2]} />
        {/* watch towers at the front corners */}
        {[-1, 1].map((k) => (
          <group key={k} position={[k * 7.8, 0, 3.6]}>
            <Box s={[2.2, 4.4, 2.2]} p={[0, 2.2, 0]} m={stone2} />
            <Box s={[2.4, 0.16, 2.4]} p={[0, 4.4, 0]} m={timber} />
            <Box s={[0.5, 0.5, 0.06]} p={[0, 3.6, 1.12]} m={timber} cast={false} />
            <FwPyr p={[0, 5.2, 0]} w={3.0} h={1.4} m={M.plain('#6a665e', { roughness: 1 })} />
          </group>
        ))}
        {/* the steep red-and-white striped steps up the front, with green rails */}
        {stairs.map((s, k) => <Box key={k} s={[1.9, s.y, 0.4]} p={[-1.4, s.y / 2, s.z]} m={k % 2 ? whiteM : redM} />)}
        {[-1, 1].map((k) => (
          <group key={k}>
            <Cyl rt={0.035} h={6.4} p={[-1.4 + k * 1.0, 1.9, 6.3]} r={[Math.atan2(3.5, 5.8) * 1 + Math.PI / 2 * 0 - 0, 0, 0]} m={green} seg={6} />
          </group>
        ))}
        {[-1, 1].map((k) => [0, 1, 2, 3, 4].map((j) => <Box key={`${k}${j}`} s={[0.05, 0.9, 0.05]} p={[-1.4 + k * 1.0, 0.45 + j * 0.62 + (j * 0.2), 9.0 - j * 1.45]} m={green} cast={false} />))}
        <Box s={[2.0, 0.3, 3.0]} p={[-1.4, 3.7, 3.0]} m={stone} />
        {/* the doorway at the head of the steps and the ochre guard house above the wall */}
        <Box s={[1.1, 1.7, 0.2]} p={[-1.4, 4.55, 2.3]} m={timber} cast={false} />
        <group position={[-4.8, 3.6, 1.4]}>
          <Box s={[3.6, 1.9, 2.8]} p={[0, 0.95, 0]} m={ochre} />
          <Box s={[0.7, 1.2, 0.06]} p={[0.6, 0.65, 1.43]} m={timber} cast={false} />
          <Box s={[0.6, 0.5, 0.06]} p={[-0.9, 1.1, 1.43]} m={timber} cast={false} />
          <group rotation={[0, Math.PI / 2, 0]} position={[0, 1.9, 0]}><FwGable w={3.4} d={3.8} h={0.9} m={M.mat('roof', 3, 2, { color: '#c8886a' })} wallM={ochre} ov={0.3} /></group>
        </group>
        {/* barrack rooms inside the right wall, stone with black timber crosses */}
        <group position={[5.0, 0, -3.6]}>
          <Box s={[5.2, 1.7, 2.2]} p={[0, 0.85, 0]} m={stone2} />
          {[-2, -1, 0, 1, 2].map((x) => <Box key={x} s={[0.08, 1.7, 0.06]} p={[x, 0.85, 1.12]} m={timber} cast={false} />)}
          <Box s={[5.3, 0.08, 0.06]} p={[0, 0.85, 1.12]} m={timber} cast={false} />
          <Box s={[0.7, 1.2, 0.06]} p={[0.5, 0.6, 1.13]} m={M.plain('#b05a3a')} cast={false} />
          <group rotation={[0, Math.PI / 2, 0]} position={[0, 1.7, 0]}><FwGable w={2.4} d={5.3} h={0.6} m={M.plain('#6a665e', { roughness: 1 })} wallM={stone2} ov={0.3} /></group>
        </group>
        {/* the statue of Amar Singh Thapa in his black coat, on a white pedestal inside a teal fence */}
        <group position={[5.4, 0, 8.2]}>
          <Box s={[1.1, 0.2, 1.1]} p={[0, 0.1, 0]} m={M.plain('#8c1f1a')} />
          <Box s={[0.9, 1.3, 0.9]} p={[0, 0.85, 0]} m={whiteM} />
          <Box s={[0.42, 0.7, 0.26]} p={[0, 1.8, 0]} m={M.plain('#16141a')} />
          <Ball rad={0.16} p={[0, 2.3, 0]} m={M.plain('#b08560')} />
          <mesh position={[0, 2.46, 0]} material={M.plain('#2a3a2a')}><cylinderGeometry args={[0.13, 0.17, 0.12, 10]} /></mesh>
          <Box s={[0.18, 0.04, 0.05]} p={[0, 2.26, 0.15]} m={M.dark} cast={false} />
          <Box s={[0.2, 0.25, 0.05]} p={[0, 1.95, 0.15]} m={M.plain('#e8d28a')} cast={false} />
          {[[-1.1, -1.1, 2.2, 0.05], [1.1, -1.1, 2.2, 0.05]].map(([x, z, l], i) => <Box key={i} s={[0.05, 1.0, 2.3]} p={[x, 0.5, 0]} m={green} cast={false} />)}
          <Box s={[2.3, 1.0, 0.05]} p={[0, 0.5, 1.1]} m={green} cast={false} />
          <Box s={[2.3, 1.0, 0.05]} p={[0, 0.5, -1.1]} m={green} cast={false} />
        </group>
        <Frame s={[19, 8, 14]} p={[0, 4, 0.6]} />
      </group>
    );
  }
  function AmarEnv() {
    const M = useM();
    return (
      <group>
        <GroundDisc r={18} y={-0.04} m={M.plain('#b8a77a', { roughness: 1 })} />
        {/* the cliff the fort stands on, dropping to Khalanga bazaar far below */}
        <mesh position={[0, -14, 0]} material={M.plain('#8c7a5c', { roughness: 1 })} receiveShadow><cylinderGeometry args={[18, 40, 28, 40]} /></mesh>
        <GroundDisc r={140} y={-28} m={M.plain('#a3a876', { roughness: 1 })} />
        {Array.from({ length: 30 }, (_, i) => { const a = rnd(i, 1) * 6.28; const rr = 36 + rnd(i, 2) * 34; const c = ['#e6e0d0', '#9ec2d8', '#e1a48b', '#d9b36a'][i % 4]; return <Box key={i} s={[2.4, 1.6, 2.2]} p={[Math.cos(a) * rr, -27, Math.sin(a) * rr]} m={M.plain(c)} />; })}
        {Array.from({ length: 36 }, (_, i) => { const a = (i / 36) * Math.PI * 2; const rr = 14 + rnd(i, 3) * 4; if (Math.sin(a) > 0.4) return null; return <Tree key={i} p={[Math.cos(a) * rr, 0, Math.sin(a) * rr]} s={2.4 + rnd(i, 2)} kind="pine" />; })}
        {[[-14, 12], [20, 4], [-16, 6]].map(([x, z], i) => <FwBigTree key={i} p={[x, 0, z]} s={1.2} col="#58713a" />)}
        <FwHill p={[-60, -28, -30]} sc={[40, 44, 50]} m={M.plain('#718a58', { roughness: 1 })} />
        <FwHill p={[64, -28, -40]} sc={[40, 50, 50]} m={M.plain('#698254', { roughness: 1 })} />
        <FwHill p={[0, -28, -90]} sc={[90, 56, 30]} m={M.plain('#8aa09a', { roughness: 1 })} />
      </group>
    );
  }
  OUT['amargadhi-fort'] = { Main: AmarMain, Env: AmarEnv };

  /* ---------- helpers for the next sites ---------- */
  /** Flat wall panel with pointed, cusped arch openings (white arches of Tripurasundari). Faces +z. */
  function FwArchWall({ w = 5.2, h = 1.6, xs = [-1.6, 0, 1.6], hw = 0.7, p = [0, 0, 0], r = 0, m, th = 0.16, sill = 0.35 }) {
    const geo = useMemo(() => {
      const s = new THREE.Shape();
      s.moveTo(-w / 2, -sill); s.lineTo(w / 2, -sill); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.closePath();
      xs.forEach((cx) => {
        const ph = new THREE.Path();
        ph.moveTo(cx - hw, 0); ph.lineTo(cx - hw, h * 0.45);
        ph.quadraticCurveTo(cx - hw, h * 0.78, cx, h * 0.9);
        ph.quadraticCurveTo(cx + hw, h * 0.78, cx + hw, h * 0.45);
        ph.lineTo(cx + hw, 0); ph.closePath();
        s.holes.push(ph);
      });
      const g = new THREE.ExtrudeGeometry(s, { depth: th, bevelEnabled: false });
      g.translate(0, 0, -th / 2);
      return g;
    }, [w, h, xs, hw, th, sill]);
    return <mesh geometry={geo} material={m} position={p} rotation={[0, r, 0]} castShadow receiveShadow />;
  }
  function FwPalm({ p, s = 1 }) {
    const M = useM();
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.11} rb={0.2} h={4.2} p={[0, 2.1, 0]} m={M.plain('#6a5642')} seg={7} />
        {Array.from({ length: 8 }, (_, i) => <Box key={i} s={[0.28, 0.05, 2.0]} p={[Math.sin(i * 0.785) * 0.9, 4.3, Math.cos(i * 0.785) * 0.9]} r={[0.5 * Math.cos(i * 0.785) * -1 + 0.0, i * 0.785, 0]} m={M.plain('#4a7a3a', { roughness: 1 })} />)}
      </group>
    );
  }
  function FwClothLine({ from, to, n = 20, h = 0.8, seed = 1 }) {
    return (
      <group>
        {Array.from({ length: n }, (_, i) => {
          const t = (i + 0.5) / n; const len = h * (0.55 + rnd(i, seed) * 0.45);
          return (
            <mesh key={i} position={[from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t - len / 2, from[2] + (to[2] - from[2]) * t]} rotation={[0, rnd(i, seed + 3) * 1.4, 0]}>
              <planeGeometry args={[0.1, len]} />
              <meshStandardMaterial color={i % 2 ? '#f2eee4' : '#c4281f'} side={DS} roughness={1} />
            </mesh>
          );
        })}
      </group>
    );
  }
  function FwGoldTrident({ p, h = 3.4 }) {
    const M = useM();
    return (
      <group position={p}>
        <Cyl rt={0.05} h={h} p={[0, h / 2, 0]} m={M.gold} seg={8} />
        {[-0.28, 0.28].map((x) => <mesh key={x} position={[x, h + 0.2, 0]} material={M.gold}><coneGeometry args={[0.06, 0.55, 6]} /></mesh>)}
        <mesh position={[0, h + 0.32, 0]} material={M.gold}><coneGeometry args={[0.07, 0.8, 6]} /></mesh>
        <Box s={[0.7, 0.08, 0.08]} p={[0, h, 0]} m={M.gold} />
        <Box s={[0.08, 0.3, 0.08]} p={[-0.28, h + 0.05, 0]} m={M.gold} />
        <Box s={[0.08, 0.3, 0.08]} p={[0.28, h + 0.05, 0]} m={M.gold} />
        <Ball rad={0.1} p={[0, h * 0.8, 0]} m={M.gold} />
      </group>
    );
  }
  function FwBellShrine({ p, r = 0, w = 1.1, h = 1.7, red, roof }) {
    const M = useM();
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[w + 0.4, 0.22, w + 0.4]} p={[0, 0.11, 0]} m={M.plain('#b5ad9e')} />
        <Box s={[w, h, 0.18]} p={[0, 0.22 + h / 2, -w / 2 + 0.09]} m={red} />
        {[-1, 1].map((k) => <Box key={k} s={[0.18, h, w]} p={[k * (w / 2 - 0.09), 0.22 + h / 2, 0]} m={red} />)}
        <Box s={[w + 0.1, 0.18, w + 0.1]} p={[0, h + 0.3, 0]} m={red} />
        <FwPyr p={[0, h + 0.8, 0]} w={w + 0.9} h={0.9} m={roof} />
        <mesh geometry={bellGeo()} position={[0, h * 0.8, 0.1]} material={M.plain('#c9a24a', { metalness: 0.5, roughness: 0.4 })} />
        <mesh position={[0, h + 1.4, 0]} material={M.gold}><coneGeometry args={[0.05, 0.3, 6]} /></mesh>
      </group>
    );
  }

  /* =====================================================================================
     Tripurasundari, Baitadi (Devikot): wide red-pillared porch with white cusped arches under a
     carved gable, two diminishing tiled roofs and a gilded finial, grassy flag-pole courtyard
     ===================================================================================== */
  function TripuraMain() {
    const M = useM();
    const red = M.plain('#a8332b', { roughness: 0.85 });
    const redL = M.plain('#c4472f', { roughness: 0.85 });
    const white = M.plain('#f6f2e8', { roughness: 0.85 });
    const stone = M.plain('#bbb4a6', { roughness: 1 });
    const tile = M.mat('roof', 4, 3, { color: '#f2a566' });
    const cream = M.plain('#e8cfa0', { roughness: 0.8 });
    const dark = M.plain('#1d1512');
    const wgt = 7.8; const gh = 1.55; const y0 = 0.75;
    const diam = [];
    for (let row = 0; row < 3; row += 1) {
      const hy = 0.3 + row * 0.38; const half = (wgt / 2 - 0.4) * (1 - hy / gh) - 0.2;
      for (let x = -half; x <= half + 0.01; x += 0.55) diam.push([x, hy, row]);
    }
    return (
      <group>
        <Box s={[11.2, 0.5, 9.2]} p={[0, 0.25, 0]} m={stone} />
        {[0, 1].map((k) => <Box key={k} s={[3.2, 0.2, 0.5]} p={[0, 0.1 + k * 0.2, 4.9 - k * 0.45]} m={stone} />)}
        {/* hall body, red painted */}
        <Box s={[7.0, 2.3, 5.4]} p={[0, y0 + 1.15, -0.9]} m={red} />
        <Box s={[7.1, 0.16, 5.5]} p={[0, y0 + 0.08, -0.9]} m={white} />
        <Box s={[1.0, 1.6, 0.1]} p={[0, y0 + 0.8, 1.82]} m={dark} cast={false} />
        <Box s={[1.3, 0.14, 0.14]} p={[0, y0 + 1.65, 1.84]} m={cream} />
        {/* porch: floor, four red pillars, white cusped arches */}
        <Box s={[6.2, 0.1, 1.9]} p={[0, y0 + 0.05, 2.75]} m={stone} />
        {[-2.4, -0.8, 0.8, 2.4].map((x) => (
          <group key={x} position={[x, y0, 3.55]}>
            <Cyl rt={0.15} h={2.4} p={[0, 1.2, 0]} m={red} seg={12} />
            <Cyl rt={0.19} h={0.1} p={[0, 0.6, 0]} m={white} seg={12} />
            <Cyl rt={0.19} h={0.1} p={[0, 1.5, 0]} m={white} seg={12} />
            <Box s={[0.4, 0.14, 0.4]} p={[0, 2.35, 0]} m={white} />
          </group>
        ))}
        <FwArchWall p={[0, y0 + 0.85 + 0.35, 3.5]} w={5.4} h={1.55} xs={[-1.6, 0, 1.6]} hw={0.68} m={white} />
        <Box s={[0.5, 2.0, 0.5]} p={[-3.45, y0 + 1.0, 2.2]} m={red} />
        <Box s={[0.5, 2.0, 0.5]} p={[3.45, y0 + 1.0, 2.2]} m={red} />
        {/* the carved front gable and its colourful gable face */}
        <group position={[0, y0 + 2.4, 0.2]}>
          <FwGable w={wgt} d={7.4} h={gh} y={0} m={tile} wallM={redL} ov={0.4} />
          {diam.map(([x, y, row], i) => <Box key={i} s={[0.3, 0.24, 0.05]} p={[x, y, 3.72]} m={M.plain(['#2f6db5', '#e2b33c', '#f4f0e6'][(i + row) % 3])} cast={false} />)}
          <Box s={[wgt + 0.5, 0.12, 0.12]} p={[0, -0.12, 3.95]} m={cream} />
          <Box s={[wgt + 0.5, 0.22, 0.06]} p={[0, -0.28, 3.95]} m={M.plain('#d9783a')} cast={false} />
          {[-1, 1].map((k) => <Box key={k} s={[0.1, 0.1, 0.1]} p={[k * (wgt / 2 + 0.38), -0.22, 3.9]} m={M.gold} />)}
        </group>
        {/* the two diminishing tiered roofs rising behind the gable */}
        <group position={[0, y0 + 2.7, -1.0]}>
          <Box s={[3.2, 1.5, 3.2]} p={[0, 0.75, 0]} m={red} />
          {[[0, 1.6], [1, 1.6]].map(([k]) => null)}
          <Box s={[0.5, 0.6, 0.05]} p={[0, 0.85, 1.62]} m={dark} cast={false} />
          <Roof w={5.2} d={5.2} h={0.95} y={1.45} m={tile} />
          <Box s={[2.2, 1.2, 2.2]} p={[0, 2.15, 0]} m={red} />
          <Box s={[0.4, 0.55, 0.05]} p={[0, 2.2, 1.12]} m={dark} cast={false} />
          <Roof w={3.8} d={3.8} h={0.8} y={2.65} m={tile} />
          <Gajur y={3.38} s={0.85} />
        </group>
        <Frame s={[13, 8.2, 11]} p={[0, 4.1, 0.2]} />
      </group>
    );
  }
  function TripuraEnv() {
    const M = useM();
    const red = M.plain('#a8332b', { roughness: 0.85 });
    const white = M.plain('#f6f2e8', { roughness: 0.85 });
    const orange = M.plain('#d9783a', { roughness: 0.8 });
    const tile = M.mat('roof', 3, 3, { color: '#e39257' });
    return (
      <group>
        <GroundDisc r={22} y={-0.03} m={M.plain('#a7bf6a', { roughness: 1 })} />
        {/* the hill falls away to terraces and the Devikot valley, Himalaya on the horizon */}
        <mesh position={[0, -9, 0]} material={M.plain('#86a752', { roughness: 1 })} receiveShadow><cylinderGeometry args={[22, 40, 18, 40]} /></mesh>
        <GroundDisc r={140} y={-18} m={M.plain('#8fb05a', { roughness: 1 })} />
        {Array.from({ length: 6 }, (_, i) => <FwTerraces key={i} p={[Math.cos(i * 1.1 + 0.3) * 46, -17.5, Math.sin(i * 1.1 + 0.3) * 46]} r={-(i * 1.1 + 0.3) - Math.PI / 2} w={16} n={4} rise={0.8} run={3} cols={['#7fb04c', '#a6c25a', '#6aa042']} />)}
        {[[-30, -34], [26, -30], [-8, -44], [40, -12]].map(([x, z], i) => <FwHill key={i} p={[x, -18, z]} sc={[30, 26 + i * 3, 26]} m={M.plain(i % 2 ? '#6f9a58' : '#7aa561', { roughness: 1 })} />)}
        <FwPeak p={[-40, -10, -130]} r={34} h={60} rock={M.plain('#9a9ba8', { roughness: 1 })} />
        <FwPeak p={[10, -10, -140]} r={42} h={74} rock={M.plain('#9395a3', { roughness: 1 })} />
        <FwPeak p={[60, -10, -120]} r={30} h={52} rock={M.plain('#9a9ba8', { roughness: 1 })} />
        {/* tall red flag poles, small bell shrines and the tree hung with bells */}
        {[-3.6, -2.6].map((x, i) => <group key={x}><Cyl rt={0.07} rb={0.1} h={9 - i} p={[x, (9 - i) / 2, 6.6]} m={red} seg={8} /><Box s={[0.7, 0.4, 0.02]} p={[x + 0.4, 8.6 - i, 6.6]} m={M.plain('#e8791f')} /></group>)}
        <FwBellShrine p={[-7.2, 0, 4.4]} r={0.5} red={red} roof={M.plain('#c46a38', { roughness: 0.8 })} />
        <FwBellShrine p={[7.6, 0, 3.6]} r={-0.5} red={red} roof={M.plain('#c46a38', { roughness: 0.8 })} />
        <FwBigTree p={[-11, 0, -2]} s={1.7} col="#668540" />
        {Array.from({ length: 10 }, (_, i) => <mesh key={i} geometry={bellGeo()} position={[-11 + Math.cos(i * 0.9) * 0.55, 1.6 + (i % 4) * 0.3, -2 + Math.sin(i * 0.9) * 0.55]} material={M.plain('#6f5a34', { metalness: 0.5, roughness: 0.5 })} scale={1.1} />)}
        {/* boundary wall in red with a tile band, and the arched entrance gate with three small roofs */}
        <Box s={[26, 1.3, 0.4]} p={[0, 0.65, -9.5]} m={red} />
        <Box s={[26, 0.28, 0.44]} p={[0, 1.05, -9.5]} m={M.plain('#e6c9a0')} />
        <Box s={[0.4, 1.3, 16]} p={[-13, 0.65, -1.5]} m={red} />
        <Box s={[0.4, 1.3, 16]} p={[13, 0.65, -1.5]} m={red} />
        <group position={[0, 0, 17.5]}>
          {[-3, 0, 3].map((x) => (
            <group key={x}>
              <Box s={[1.2, 3.8, 1.2]} p={[x, 1.9, 0]} m={red} />
              <Box s={[0.5, 0.5, 0.05]} p={[x, 2.2, 0.62]} m={M.plain('#e2b33c')} cast={false} />
              <Roof w={2.2} d={2.2} h={0.8} y={3.8} m={tile} />
              <Gajur y={4.5} s={0.35} />
            </group>
          ))}
          <Box s={[8.4, 0.5, 1.0]} p={[0, 3.1, 0]} m={red} />
          <Box s={[8.4, 0.12, 1.05]} p={[0, 3.4, 0]} m={M.plain('#e2b33c')} />
        </group>
        <FwArchWall p={[-9, 1.0, 10.5]} r={0.3} w={5.2} h={1.9} xs={[-1.7, 0, 1.7]} hw={0.72} m={white} sill={1.0} />
        {Array.from({ length: 5 }, (_, i) => <FwPalm key={i} p={[-16 + i * 1.1, 0, 5 + (i % 2) * 2]} s={1.2} />)}
        {Array.from({ length: 3 }, (_, i) => <FwPalm key={`b${i}`} p={[15 + i, 0, 2 + i * 2]} s={1.1} />)}
        <FwBigTree p={[10, 0, -6]} s={1.6} col="#5f7e3e" />
      </group>
    );
  }
  OUT['tripurasundari-temple-baitadi'] = { Main: TripuraMain, Env: TripuraEnv };

  /* =====================================================================================
     Shaileshwori, Silgadhi (Doti): stone-paved courtyard under great old trees, pink-and-red painted
     gabled shrine hall with star windows and a small tiered tower, painted gate with lions and a trident
     ===================================================================================== */
  function ShaileMain() {
    const M = useM();
    const pinkBrick = M.mat('brick', 3, 1.6, { color: '#ffd9dc' });
    const red = M.plain('#c4301f', { roughness: 0.8 });
    const white = M.plain('#f6f3ec', { roughness: 0.85 });
    const yellow = M.plain('#e8b82c', { roughness: 0.7 });
    const blue = M.plain('#3a8fc2', { roughness: 0.8 });
    const dark = M.plain('#251a15');
    const roofM = M.plain('#625048', { metalness: 0.4, roughness: 0.7 });
    const stone = M.plain('#bbb3a2', { roughness: 1 });
    const gw = 6.4; const gh = 1.5; const ey = 2.65;
    const a = Math.atan2(gh, gw / 2); const L = Math.hypot(gw / 2, gh) + 0.4;
    return (
      <group>
        <Box s={[17, 0.14, 14]} p={[0, 0.0, 0.8]} m={stone} cast={false} />
        {/* the shrine hall, pink brick pattern with a red-trimmed front gable */}
        <group position={[0, 0.07, -2.6]}>
          <Box s={[6.8, 0.4, 4.2]} p={[0, 0.2, 0]} m={M.plain('#e8e1d4')} />
          <Box s={[6.0, 2.3, 3.6]} p={[0, 1.55, 0]} m={pinkBrick} />
          <Box s={[1.1, 1.6, 0.1]} p={[0, 1.2, 1.82]} m={dark} cast={false} />
          <Box s={[1.4, 0.16, 0.16]} p={[0, 2.05, 1.85]} m={M.gold} />
          {[-1.0, 1.0].map((x) => <Box key={x} s={[0.14, 1.6, 0.14]} p={[x * 0.62, 1.2, 1.86]} m={M.gold} />)}
          {[-2.1, 2.1].map((x) => <Box key={x} s={[1.2, 1.5, 0.08]} p={[x, 1.25, 1.82]} m={blue} cast={false} />)}
          <Box s={[6.3, 0.14, 0.14]} p={[0, 2.5, 1.9]} m={yellow} />
          <group position={[0, ey, 0]}>
            <FwGable w={gw} d={3.8} h={gh} y={0} m={roofM} wallM={pinkBrick} ov={0.4} />
            {[-1, 1].map((k) => <Box key={k} s={[L, 0.13, 0.13]} p={[k * (gw / 4 + (0.4 * Math.cos(a)) / 2), (gh - 0.4 * Math.sin(a)) / 2 - 0.02, 2.2]} r={[0, 0, -k * a]} m={red} />)}
            {[-0.9, 0, 0.9].map((x, i) => <Cyl key={x} rt={0.24} h={0.06} p={[x, 0.55 + (i === 1 ? 0.32 : 0), 1.9]} r={[Math.PI / 2, 0, 0]} m={yellow} seg={8} />)}
            <Box s={[0.9, 0.5, 0.05]} p={[0, 0.5, 1.9]} m={dark} cast={false} />
          </group>
          {/* the small tiered tower behind the gable */}
          <Box s={[2.0, 1.4, 2.0]} p={[0, 3.35, -0.9]} m={M.mat('brick', 2, 1, { color: '#ffcfc0' })} />
          <Roof w={3.2} d={3.2} h={0.6} y={4.0} m={roofM} />
          <Box s={[1.1, 0.9, 1.1]} p={[0, 4.75, -0.9]} m={M.mat('brick', 1, 1, { color: '#ffcfc0' })} />
          <FwPyr p={[0, 5.55, -0.9]} w={1.9} h={0.9} m={roofM} />
          <mesh position={[0, 6.2, -0.9]} material={M.gold}><coneGeometry args={[0.05, 0.4, 8]} /></mesh>
        </group>
        {/* the painted gate: red piers with lamp-tops, white arch with a bell, mural panels, railings */}
        <group position={[0, 0.07, 3.8]}>
          {[-3.3, -1.1, 1.1, 3.3].map((x, i) => (
            <group key={x}>
              <Box s={[0.6, i % 3 === 0 ? 2.0 : 1.6, 0.6]} p={[x, i % 3 === 0 ? 1.0 : 0.8, 0]} m={red} />
              <Box s={[0.34, 0.5, 0.05]} p={[x, 0.9, 0.31]} m={M.plain('#3f9a4a')} cast={false} />
              <Box s={[0.5, 0.4, 0.5]} p={[x, (i % 3 === 0 ? 2.0 : 1.6) + 0.2, 0]} m={yellow} />
              <FwPyr p={[x, (i % 3 === 0 ? 2.0 : 1.6) + 0.58, 0]} w={0.7} h={0.36} m={roofM} />
            </group>
          ))}
          {[-2.2, 2.2].map((x) => (
            <group key={x}>
              <Box s={[1.6, 1.5, 0.1]} p={[x, 0.85, 0.05]} m={blue} />
              <Box s={[0.4, 0.6, 0.05]} p={[x, 0.95, 0.12]} m={M.plain('#c4301f')} cast={false} />
              <Ball rad={0.13} p={[x, 1.4, 0.12]} m={M.plain('#e3b58f')} />
            </group>
          ))}
          <Box s={[2.5, 0.2, 0.3]} p={[0, 2.1, 0]} m={white} />
          {[-1.1, 1.1].map((x) => <Box key={x} s={[0.2, 1.6, 0.3]} p={[x, 1.3, 0]} m={white} />)}
          <mesh geometry={bellGeo()} position={[0, 1.8, 0]} material={M.plain('#c9a24a', { metalness: 0.5, roughness: 0.4 })} scale={1.5} />
        </group>
        {[-1, 1].map((k) => <group key={k} position={[k * 3.5, 0.2, 5.0]} scale={2.1} rotation={[0, k * -0.3, 0]}><Lion m={yellow} /></group>)}
        <FwGoldTrident p={[1.9, 0.1, 2.8]} h={3.6} />
        <group position={[-3.0, 0.1, 1.2]}>
          <Box s={[0.9, 0.5, 0.9]} p={[0, 0.25, 0]} m={M.plain('#8c4a3a')} />
          <Box s={[0.35, 0.9, 0.25]} p={[0, 0.95, 0]} m={blue} />
          <Ball rad={0.13} p={[0, 1.5, 0]} m={M.plain('#6fb0d8')} />
        </group>
        {/* red pavilion on the right of the courtyard */}
        <group position={[7.0, 0.07, 0.8]}>
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a2, b], i) => <Box key={i} s={[0.2, 1.8, 0.2]} p={[a2 * 1.0, 0.9, b * 1.0]} m={red} />)}
          <FwPyr p={[0, 2.5, 0]} w={3.2} h={1.1} m={M.plain('#c4472f', { roughness: 0.8 })} />
        </group>
        <Frame s={[16, 6.8, 11]} p={[0, 3.4, 0.8]} />
      </group>
    );
  }
  function ShaileEnv() {
    const M = useM();
    const wallC = ['#e8b0b8', '#f0e0a0', '#a8c8e0', '#e8b0b8'];
    return (
      <group>
        <GroundDisc r={17} y={-0.03} m={M.plain('#b3ab9a', { roughness: 1 })} />
        <GroundDisc r={110} y={-0.06} m={M.plain('#93a866', { roughness: 1 })} />
        {/* old trees shading the whole courtyard */}
        {[[-11, -6], [-13, 3], [11, -9], [-5, -13], [6, -14], [15, -3]].map(([x, z], i) => <FwBigTree key={i} p={[x, 0, z]} s={1.2 + (i % 3) * 0.2} col={i % 2 ? '#5c7a3c' : '#6b8a45'} />)}
        {/* painted market houses and the boundary wall of the compound */}
        {Array.from({ length: 6 }, (_, i) => <FwHouse key={i} p={[-20, 0, -12 + i * 4.4]} r={Math.PI / 2} w={3} d={3.4} h={1.8} storeys={2} rh={0.9} wall={M.plain(wallC[i % 4], { roughness: 1 })} roof={M.plain(i % 2 ? '#7a766f' : '#3a67b0', { metalness: 0.3, roughness: 0.6 })} bal={i % 2 === 0} />)}
        {Array.from({ length: 4 }, (_, i) => <FwHouse key={`b${i}`} p={[-9 + i * 5, 0, -19]} r={0} w={3} d={3.4} h={1.8} storeys={2} rh={0.9} wall={M.plain(wallC[(i + 1) % 4], { roughness: 1 })} roof={M.plain('#7a766f', { roughness: 1 })} />)}
        <Box s={[0.4, 1.0, 14]} p={[-14, 0.5, 0.5]} m={M.plain('#c8b9a6')} />
        <Box s={[0.4, 1.0, 14]} p={[14, 0.5, 0.5]} m={M.plain('#c8b9a6')} />
        <FwHill p={[-44, -3, -30]} sc={[34, 26, 40]} m={M.plain('#7b9a58', { roughness: 1 })} />
        <FwHill p={[46, -3, -34]} sc={[36, 30, 40]} m={M.plain('#6f8f52', { roughness: 1 })} />
        <FwHill p={[0, -3, -70]} sc={[70, 34, 30]} m={M.plain('#82a07a', { roughness: 1 })} />
        <FwPeak p={[-6, -2, -140]} r={44} h={66} rock={M.plain('#9a9ba8', { roughness: 1 })} />
      </group>
    );
  }
  OUT['shaileshwori-temple-doti'] = { Main: ShaileMain, Env: ShaileEnv };

  /* =====================================================================================
     Ghodaghodi temple and lake, Kailali: small yellow flat-roofed shrine at the top of a broad
     flight of steps, fences hung with red and white cloth, lotus-covered Ramsar lake and sal forest
     ===================================================================================== */
  function GhodaMain() {
    const M = useM();
    const conc = M.plain('#b9b6ae', { roughness: 1 });
    const concD = M.plain('#a6a39b', { roughness: 1 });
    const yellow = M.plain('#e9cd5c', { roughness: 0.85 });
    const maroon = M.plain('#7a2424', { roughness: 0.85 });
    const white = M.plain('#f2efe6', { roughness: 0.9 });
    const dark = M.plain('#2a1c16');
    const NS = 8; const rise = 0.3; const run = 0.68;
    return (
      <group>
        {/* the broad flight of steps with its side walls */}
        {Array.from({ length: NS }, (_, k) => <Box key={k} s={[5.4, (k + 1) * rise, run]} p={[0, ((k + 1) * rise) / 2, 9.2 - (k + 0.5) * run]} m={k % 2 ? concD : conc} />)}
        {[-1, 1].map((s) => Array.from({ length: NS }, (_, k) => <Box key={`${s}${k}`} s={[0.4, (k + 1) * rise + 0.55, run]} p={[s * 2.9, ((k + 1) * rise + 0.55) / 2, 9.2 - (k + 0.5) * run]} m={conc} />))}
        {/* upper platform */}
        <Box s={[9, 0.2, 6.4]} p={[0, NS * rise - 0.1, 0.6]} m={conc} />
        <Box s={[9, 0.5, 0.3]} p={[0, NS * rise + 0.15, 3.6]} m={concD} />
        {/* the shrine */}
        <group position={[0, NS * rise, -0.6]}>
          <Box s={[4.9, 2.1, 3.2]} p={[0, 1.05, 0]} m={yellow} />
          <Box s={[5.0, 0.35, 3.3]} p={[0, 2.2, 0]} m={maroon} />
          <Box s={[5.3, 0.2, 3.6]} p={[0, 2.5, 0]} m={white} />
          <Box s={[0.5, 0.6, 0.5]} p={[0, 2.9, 0]} m={white} />
          <mesh position={[0, 3.35, 0]} material={M.gold}><coneGeometry args={[0.08, 0.35, 6]} /></mesh>
          <Box s={[1.1, 1.6, 0.1]} p={[0, 0.85, 1.62]} m={dark} cast={false} />
          {[-1.7, 1.7].map((x) => <Box key={x} s={[0.7, 0.8, 0.06]} p={[x, 1.2, 1.62]} m={M.plain('#c0392b')} cast={false} />)}
          {[-2.1, 2.1].map((x) => <Cyl key={x} rt={0.1} h={2.1} p={[x, 1.05, 1.95]} m={white} seg={8} />)}
          <Box s={[4.9, 0.22, 0.3]} p={[0, 2.12, 1.95]} m={maroon} />
          <FwClothLine from={[-2.2, 2.0, 1.97]} to={[2.2, 2.0, 1.97]} n={22} h={0.75} seed={4} />
          {/* the altar seen through the door: tiled block with clay horses, elephants and bells */}
          <group position={[0, 0.0, 1.0]}>
            <Box s={[1.1, 0.45, 0.8]} p={[0, 0.25, 0]} m={M.plain('#d9856a')} />
            {Array.from({ length: 5 }, (_, i) => <group key={i} position={[-0.4 + i * 0.2, 0.5, 0]}><Box s={[0.1, 0.1, 0.17]} p={[0, 0.06, 0]} m={M.plain('#b5532f')} /><Box s={[0.05, 0.12, 0.05]} p={[0, 0.15, 0.08]} m={M.plain('#b5532f')} /></group>)}
          </group>
        </group>
        {/* mesh fence along the right edge, hung with cloth offerings */}
        {Array.from({ length: 12 }, (_, i) => <Box key={i} s={[0.05, 1.3, 0.05]} p={[4.4, NS * rise + 0.65, 3.4 - i * 0.55]} m={M.dark} cast={false} />)}
        <Box s={[0.05, 0.05, 6.2]} p={[4.4, NS * rise + 1.3, 0.3]} m={M.dark} cast={false} />
        <FwClothLine from={[4.4, NS * rise + 1.3, 3.3]} to={[4.4, NS * rise + 1.3, -2.8]} n={34} h={0.9} seed={7} />
        <FwClothLine from={[-4.4, NS * rise + 1.3, 3.3]} to={[-4.4, NS * rise + 1.3, -2.8]} n={20} h={0.8} seed={11} />
        {Array.from({ length: 9 }, (_, i) => <Box key={`l${i}`} s={[0.05, 1.3, 0.05]} p={[-4.4, NS * rise + 0.65, 3.4 - i * 0.7]} m={M.dark} cast={false} />)}
        {/* red and white cloth tied to the rails at the foot of the steps */}
        <FwClothLine from={[-3.1, 1.6, 8.4]} to={[-3.1, 2.4, 5.0]} n={10} h={0.7} seed={2} />
        <FwClothLine from={[3.1, 1.6, 8.4]} to={[3.1, 2.4, 5.0]} n={10} h={0.7} seed={9} />
        <Frame s={[12, 6.4, 13]} p={[0, 3.2, 1.8]} />
      </group>
    );
  }
  function GhodaEnv() {
    const M = useM();
    const pads = useMemo(() => Array.from({ length: 70 }, (_, i) => ({ x: -34 + rnd(i, 1) * 90, z: -8 - rnd(i, 2) * 50, s: 0.5 + rnd(i, 3) * 0.7, f: rnd(i, 4) > 0.75 })), []);
    return (
      <group>
        {/* the lake is the base of the world; the temple knoll rises from it */}
        <GroundDisc r={150} y={-0.55} m={M.plain('#4f7b7a', { roughness: 0.2, metalness: 0.3 })} />
        <GroundDisc r={15} y={-0.03} m={M.plain('#b3a37a', { roughness: 1 })} />
        <mesh position={[0, -0.28, 3]} material={M.plain('#8c9a5e', { roughness: 1 })}><cylinderGeometry args={[15, 17, 0.5, 36]} /></mesh>
        <GroundDisc r={26} y={-0.5} m={M.plain('#86995a', { roughness: 1 })} />
        {pads.map((p, i) => (
          <group key={i} position={[p.x, -0.52, p.z]}>
            <Cyl rt={p.s} h={0.03} m={M.plain(i % 3 ? '#4f8a3c' : '#6aa34a', { roughness: 1 })} seg={12} />
            {p.f && <Ball rad={0.17} p={[0.1, 0.1, 0]} m={M.plain('#f1a8c0')} />}
          </group>
        ))}
        {/* sal forest on the shore and on islands */}
        {Array.from({ length: 30 }, (_, i) => { const a = (i / 30) * Math.PI * 2; if (Math.abs(Math.atan2(Math.sin(a - 0.93), Math.cos(a - 0.93))) < 0.9) return null; const rr = 16 + rnd(i, 2) * 6; return <FwBigTree key={i} p={[Math.cos(a) * rr, -0.3, Math.sin(a) * rr + 3]} s={0.9 + rnd(i, 4) * 0.5} col={i % 2 ? '#52703a' : '#628244'} />; })}
        {[[-26, -30], [14, -42], [34, -22], [-4, -52]].map(([x, z], i) => (
          <group key={i} position={[x, -0.5, z]}>
            <Ball rad={1} sc={[5 + i, 0.6, 4]} m={M.plain('#6f8a4e', { roughness: 1 })} />
            {Array.from({ length: 5 }, (_, k) => <FwBigTree key={k} p={[(k - 2) * 1.8, 0.3, (k % 2) * 1.2 - 0.6]} s={0.8 + (k % 3) * 0.15} col="#52703a" />)}
          </group>
        ))}
        {Array.from({ length: 14 }, (_, i) => <FwBigTree key={`f${i}`} p={[-52 + i * 8.5, -0.4, -78 - (i % 2) * 4]} s={2.2} col="#6f8a5a" />)}
        <FwHill p={[0, -0.5, -120]} sc={[100, 12, 30]} m={M.plain('#8fa498', { roughness: 1 })} />
        <FwBigTree p={[-9, 0, -1]} s={1.2} col="#4f6f38" />
        <FwClothLine from={[-9, 2.4, -1]} to={[-9.4, 2.4, -1.8]} n={8} h={0.8} seed={5} />
      </group>
    );
  }
  OUT['ghodaghodi-temple'] = { Main: GhodaMain, Env: GhodaEnv };

  /* =====================================================================================
     Khaptad Baba Ashram: long low whitewashed stone house, red timber veranda on stilts, stone-slate
     roof, ring of white stones in front, alone on a golden meadow ringed by fir forest
     ===================================================================================== */
  function KhapMain() {
    const M = useM();
    const wash = M.plain('#f1f0ea', { roughness: 0.95 });
    const redW = M.plain('#8e3b2e', { roughness: 0.85 });
    const slate = M.plain('#7b776f', { roughness: 1 });
    const tin = M.plain('#a63a2c', { metalness: 0.4, roughness: 0.6 });
    const stone = M.plain('#d9d6cc', { roughness: 1 });
    return (
      <group>
        <Box s={[13.4, 0.5, 5.2]} p={[0, 0.25, -1]} m={M.plain('#c9c6bb', { roughness: 1 })} />
        <Box s={[12.6, 2.3, 3.0]} p={[0, 1.65, -1.6]} m={wash} />
        {[-4.8, -1.6, 1.6, 4.8].map((x) => <Box key={x} s={[0.9, 0.7, 0.05]} p={[x, 2.0, -0.07]} m={M.plain('#2a1c14')} cast={false} />)}
        <Box s={[0.9, 1.5, 0.05]} p={[0, 1.4, -0.07]} m={M.plain('#2a1c14')} cast={false} />
        <group position={[0, 2.8, -1.6]} rotation={[0, Math.PI / 2, 0]}><FwGable w={3.6} d={12.8} h={0.9} m={slate} wallM={wash} ov={0.4} /></group>
        {/* the red veranda: stilts, posts, railing and a lean-to tin roof */}
        <Box s={[12.4, 0.12, 1.5]} p={[0, 0.6, 0.45]} m={redW} />
        {Array.from({ length: 8 }, (_, i) => <Box key={i} s={[0.16, 1.9, 0.16]} p={[-5.6 + i * 1.6, 1.55, 1.1]} m={redW} />)}
        <Box s={[12.4, 0.08, 0.1]} p={[0, 1.25, 1.1]} m={redW} />
        {Array.from({ length: 40 }, (_, i) => <Box key={i} s={[0.05, 0.55, 0.05]} p={[-6 + i * 0.31, 0.95, 1.1]} m={redW} cast={false} />)}
        <mesh position={[0, 2.75, 0.55]} rotation={[0.25, 0, 0]} material={tin} castShadow><boxGeometry args={[12.8, 0.07, 1.9]} /></mesh>
        {/* small outbuilding with a blue-grey tin roof, and the whitewashed wall posts */}
        <Box s={[0.7, 1.9, 0.7]} p={[7.4, 0.95, 1.4]} m={wash} />
        <mesh position={[6.4, 2.2, 1.4]} rotation={[0, 0, -0.12]} material={M.plain('#6f86a0', { metalness: 0.5, roughness: 0.5 })}><boxGeometry args={[2.4, 0.07, 1.4]} /></mesh>
        <Box s={[3.2, 0.9, 0.5]} p={[-7.6, 0.45, 1.6]} m={wash} />
        <Box s={[0.7, 1.6, 0.35]} p={[8.0, 0.8, 0.2]} m={stone} />
        {/* the circle of white stones in the earth */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 6.2]}><circleGeometry args={[2.6, 32]} /><meshStandardMaterial color="#9b8460" roughness={1} /></mesh>
        {Array.from({ length: 28 }, (_, i) => <Ball key={i} rad={0.16} p={[Math.cos(i * 0.2244) * 2.6, 0.08, 6.2 + Math.sin(i * 0.2244) * 2.6]} sc={[1, 0.6, 1]} m={M.plain('#f4f2ea')} />)}
        {Array.from({ length: 5 }, (_, i) => <Ball key={`c${i}`} rad={0.22} p={[-0.8 + i * 0.4, 0.1, 6.2 + (i % 2) * 0.3]} sc={[1, 0.6, 1]} m={M.plain('#f4f2ea')} />)}
        {Array.from({ length: 6 }, (_, i) => <Ball key={`p${i}`} rad={0.1} p={[-1 + i * 0.4, 0.06, 3.0 + i * 0.1]} sc={[1, 0.7, 1]} m={M.plain('#f4f2ea')} />)}
        <Frame s={[16, 5, 12]} p={[0, 2.5, 2]} />
      </group>
    );
  }
  function KhapEnv() {
    const M = useM();
    return (
      <group>
        <GroundDisc r={20} y={-0.03} m={M.plain('#b99a5c', { roughness: 1 })} />
        <GroundDisc r={120} y={-0.06} m={M.plain('#a9904f', { roughness: 1 })} />
        {Array.from({ length: 6 }, (_, i) => <Ball key={i} rad={1} p={[-18 + i * 7, -0.2, 12 + (i % 2) * 6]} sc={[5, 1.4, 4]} m={M.plain(i % 2 ? '#bd9f5e' : '#a88d4e', { roughness: 1 })} />)}
        <FwHill p={[-30, -2, -14]} sc={[26, 8, 20]} m={M.plain('#b09254', { roughness: 1 })} />
        <FwHill p={[32, -2, -22]} sc={[30, 10, 24]} m={M.plain('#a98d50', { roughness: 1 })} />
        {/* dark fir and rhododendron ring */}
        {Array.from({ length: 56 }, (_, i) => { const a = (i / 56) * Math.PI * 2; if (Math.abs(Math.atan2(Math.sin(a - 0.93), Math.cos(a - 0.93))) < 0.7) return null; const rr = 15 + rnd(i, 3) * 9; return <FwFir key={i} p={[Math.cos(a) * rr, 0, Math.sin(a) * rr]} s={1.8 + rnd(i, 5) * 1.6} col={i % 3 ? '#27432e' : '#33503a'} />; })}
        {[[10, 14], [-11, 15], [16, 8]].map(([x, z], i) => <FwFir key={`n${i}`} p={[x, 0, z]} s={1.6} />)}
        <Box s={[3.2, 1.6, 2.4]} p={[-11, 0.8, 4]} m={M.plain('#6b4a32')} />
        <group position={[-11, 1.6, 4]} rotation={[0, 0, 0]}><FwGable w={3.4} d={2.8} h={0.7} m={M.plain('#8d8a84', { metalness: 0.4 })} ov={0.2} /></group>
        <FwPeak p={[-10, -2, -110]} r={40} h={58} rock={M.plain('#8f90a0', { roughness: 1 })} />
        <FwPeak p={[40, -2, -100]} r={34} h={46} rock={M.plain('#8f90a0', { roughness: 1 })} />
      </group>
    );
  }
  OUT['khaptad-baba-ashram'] = { Main: KhapMain, Env: KhapEnv };

  /* =====================================================================================
     Baidyanath Dham, Achham: compact two-roofed stone shrine with dark metal roofs and a gilded
     finial, white Nandi facing the door, gilded trident, red-robed Vedic students, lawn, river
     ===================================================================================== */
  function BaidyaMain() {
    const M = useM();
    const wash = M.plain('#d7d5cc', { roughness: 0.95 });
    const tin = M.plain('#3d3b38', { metalness: 0.5, roughness: 0.55 });
    const timber = M.plain('#5a3a28', { roughness: 0.85 });
    const white = M.plain('#f7f5ee', { roughness: 0.6 });
    const robe = M.plain('#b3241c', { roughness: 0.9 });
    const dhoti = M.plain('#e3b13c', { roughness: 0.9 });
    return (
      <group>
        <Box s={[9, 0.2, 9]} p={[0, 0.1, 0.8]} m={M.plain('#aaa69c', { roughness: 1 })} cast={false} />
        <Box s={[4.2, 0.35, 4.2]} p={[0, 0.3, 0]} m={wash} />
        <Box s={[3.5, 2.3, 3.5]} p={[0, 1.65, 0]} m={wash} />
        <Box s={[0.9, 1.5, 0.08]} p={[0, 1.2, 1.76]} m={M.plain('#2a1c14')} cast={false} />
        <Box s={[1.15, 0.12, 0.14]} p={[0, 2.0, 1.78]} m={timber} />
        <Box s={[3.6, 0.14, 3.6]} p={[0, 2.85, 0]} m={timber} />
        <Roof w={5.8} d={5.8} h={0.75} y={2.85} m={tin} sag={1.2} lift={0.08} />
        <Box s={[1.7, 0.9, 1.7]} p={[0, 3.9, 0]} m={wash} />
        <Box s={[0.5, 0.5, 0.05]} p={[0, 3.9, 0.87]} m={M.dark} cast={false} />
        <Box s={[1.9, 0.1, 1.9]} p={[0, 4.4, 0]} m={timber} />
        <Roof w={3.4} d={3.4} h={0.6} y={4.4} m={tin} sag={1.2} lift={0.08} />
        <Gajur y={4.95} s={0.7} />
        {/* the white Nandi on its stepped plinth facing the door */}
        <group position={[0.2, 0.2, 4.4]}>
          <Box s={[1.5, 0.4, 1.5]} p={[0, 0.2, 0]} m={M.plain('#d5d2c8')} />
          <Box s={[1.15, 0.5, 1.15]} p={[0, 0.65, 0]} m={white} />
          <Ball rad={0.42} sc={[0.8, 0.7, 1.2]} p={[0, 1.15, 0]} m={white} />
          <Ball rad={0.2} p={[0, 1.4, -0.35]} m={white} />
        </group>
        <FwGoldTrident p={[-2.8, 0.2, 3.2]} h={2.4} />
        {/* iron chain-and-post fence and a lamp post flag */}
        {Array.from({ length: 9 }, (_, i) => <Box key={i} s={[0.05, 0.8, 0.05]} p={[-3 + i * 0.75, 0.6, 2.4]} m={M.dark} cast={false} />)}
        <Cyl rt={0.03} h={4.2} p={[3.4, 2.2, 2.2]} m={M.plain('#e8e4dc')} seg={6} />
        <mesh position={[3.9, 3.9, 2.2]}><planeGeometry args={[1.0, 0.45]} /><meshStandardMaterial color="#e8b82c" side={DS} /></mesh>
        {/* Vedic school students in red robes and saffron dhotis, lined up before the shrine */}
        {Array.from({ length: 14 }, (_, i) => {
          const x = 2.2 + (i % 7) * 0.42; const z = 3.8 + Math.floor(i / 7) * 0.5;
          return (
            <group key={i} position={[x, 0.2, z]}>
              <Cyl rt={0.1} rb={0.13} h={0.45} p={[0, 0.22, 0]} m={dhoti} seg={8} />
              <Cyl rt={0.13} rb={0.1} h={0.45} p={[0, 0.65, 0]} m={robe} seg={8} />
              <Ball rad={0.1} p={[0, 0.97, 0]} m={M.plain('#b58760')} />
            </group>
          );
        })}
        {/* small open pavilions with red roofs, left and right of the compound */}
        {[[-7.0, -3.0], [8.4, -2.4]].map(([x, z], i) => (
          <group key={i} position={[x, 0, z]}>
            <Box s={[2.4, 0.3, 2.4]} p={[0, 0.15, 0]} m={white} />
            {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], k) => <Box key={k} s={[0.16, 1.5, 0.16]} p={[a * 0.95, 1.05, b * 0.95]} m={white} />)}
            <FwPyr p={[0, 2.4, 0]} w={3.2} h={0.9} m={M.plain('#b5452c', { roughness: 0.8 })} />
          </group>
        ))}
        <Frame s={[18, 5.8, 10]} p={[0.6, 2.9, 1.6]} />
      </group>
    );
  }
  function BaidyaEnv() {
    const M = useM();
    return (
      <group>
        <GroundDisc r={20} y={-0.03} m={M.plain('#8fb05e', { roughness: 1 })} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 7.8]}><planeGeometry args={[9, 7]} /><meshStandardMaterial color="#aaa69c" roughness={1} /></mesh>
        <GroundDisc r={120} y={-0.06} m={M.plain('#8aa660', { roughness: 1 })} />
        {/* the Budhi Ganga meeting the Saraswati in the valley beside the compound */}
        <Water w={5} d={90} p={[-20, -0.4, -10]} r={0.15} color="#6f9a9c" />
        <Water w={4} d={70} p={[28, -0.4, -20]} r={-0.5} color="#6f9a9c" />
        <FwHill p={[-44, -1, -26]} sc={[34, 26, 40]} m={M.plain('#5f8148', { roughness: 1 })} />
        <FwHill p={[46, -1, -30]} sc={[36, 30, 40]} m={M.plain('#5a7c46', { roughness: 1 })} />
        <FwHill p={[0, -1, -66]} sc={[70, 36, 30]} m={M.plain('#6b8a5c', { roughness: 1 })} />
        {Array.from({ length: 30 }, (_, i) => { const a = i * 0.5; const rr = 18 + (i % 4) * 5; if (Math.sin(a) > 0.5) return null; return <Tree key={i} p={[Math.cos(a) * rr, 0, Math.sin(a) * rr]} s={1.8 + rnd(i, 2) * 0.8} kind={i % 3 ? 'pine' : 'broad'} />; })}
        <Box s={[0.3, 1.0, 18]} p={[-10, 0.5, 4]} m={M.plain('#cfc9ba')} />
        <Box s={[22, 0.9, 6]} p={[-4, 0.45, -14]} m={M.plain('#d9d3c4')} />
        <group position={[-4, 0.9, -14]} rotation={[0, 0, 0]}><FwGable w={6.6} d={22.6} h={1.0} m={M.plain('#8d8a84', { metalness: 0.4 })} ov={0.3} wallM={M.plain('#d9d3c4')} /></group>
      </group>
    );
  }
  OUT['baidyanath-dham-achham'] = { Main: BaidyaMain, Env: BaidyaEnv };

  /* =====================================================================================
     Parshuram Dham, Mahakali bank: towering painted statue of the bearded sage with axe and bow on a
     stepped plinth, painted gateway with Hanuman and Bhairav shrines, brick Ganesh temple, river
     ===================================================================================== */
  function ParshuMain() {
    const M = useM();
    const skin = M.plain('#d99a7a', { roughness: 0.8 });
    const saffron = M.plain('#ef8f66', { roughness: 0.8 });
    const dhoti = M.plain('#ec9c74', { roughness: 0.8 });
    const green = M.plain('#2f9a63', { roughness: 0.8 });
    const black = M.plain('#17130f', { roughness: 0.9 });
    const yellow = M.plain('#e8b82c', { roughness: 0.7 });
    const stone = M.plain('#cfc6b6', { roughness: 1 });
    const pink = M.plain('#f0a28a', { roughness: 0.85 });
    const blue = M.plain('#2f78c2', { roughness: 0.8 });
    const cream = M.plain('#f6e3cc', { roughness: 0.85 });
    return (
      <group>
        {/* five-step plinth */}
        {[0, 1, 2, 3, 4].map((k) => <Box key={k} s={[6.4 - k * 0.8, 0.4, 5.2 - k * 0.7]} p={[0, 0.2 + k * 0.4, -2]} m={k % 2 ? stone : M.plain('#e8ddc9', { roughness: 1 })} />)}
        <group position={[0, 2.0, -2]}>
          {/* legs and the wrapped saffron dhoti with a green sash */}
          {[-0.45, 0.45].map((x) => <Cyl key={x} rt={0.32} rb={0.4} h={3.2} p={[x, 1.7, 0]} m={dhoti} seg={12} />)}
          <Cyl rt={1.2} rb={1.3} h={2.8} p={[0, 2.9, 0]} m={dhoti} seg={16} />
          <Cyl rt={1.2} rb={1.2} h={0.35} p={[0, 4.1, 0.05]} r={[0.1, 0, 0.25]} m={green} seg={16} />
          {/* torso, arms, necklace */}
          <Cyl rt={1.05} rb={1.2} h={2.2} p={[0, 5.3, 0]} m={skin} seg={14} />
          <Cyl rt={1.12} rb={1.12} h={0.5} p={[0, 6.1, 0.02]} m={saffron} seg={14} />
          <mesh position={[0, 6.35, 0.2]} rotation={[1.2, 0, 0]} material={M.plain('#2a1a12')}><torusGeometry args={[0.7, 0.06, 6, 24]} /></mesh>
          <mesh position={[0, 6.0, 0.35]} rotation={[1.3, 0, 0]} material={M.plain('#2a1a12')}><torusGeometry args={[0.8, 0.05, 6, 24]} /></mesh>
          <Cyl rt={0.3} rb={0.34} h={2.2} p={[1.45, 5.3, 0.2]} r={[0.2, 0, -0.18]} m={skin} seg={10} />
          <Cyl rt={0.3} rb={0.34} h={2.0} p={[-1.45, 5.3, 0.45]} r={[0.5, 0, 0.18]} m={skin} seg={10} />
          {/* head: face, black beard and hair bun */}
          <Cyl rt={0.3} h={0.3} p={[0, 6.6, 0]} m={skin} seg={10} />
          <Ball rad={0.62} sc={[1, 1.1, 0.95]} p={[0, 7.25, 0]} m={skin} />
          <Ball rad={0.6} sc={[1.0, 1.35, 0.8]} p={[0, 6.7, 0.28]} m={black} />
          <Ball rad={0.2} p={[0, 7.3, 0.55]} sc={[1, 0.6, 0.6]} m={skin} />
          <Ball rad={0.66} sc={[1.0, 0.7, 1.0]} p={[0, 7.65, -0.05]} m={black} />
          <Ball rad={0.35} p={[0, 8.15, -0.1]} m={black} />
          {/* the tall yellow bow in the left hand and the axe in the right, quiver on the back */}
          <Cyl rt={0.07} h={8.4} p={[-2.0, 4.6, 0.7]} r={[0, 0, 0.05]} m={yellow} seg={8} />
          <Cyl rt={0.06} h={4.2} p={[1.9, 5.5, 0.5]} r={[0.1, 0, 0.0]} m={M.plain('#7a4a2a')} seg={6} />
          <Box s={[0.9, 0.7, 0.08]} p={[2.25, 7.4, 0.5]} m={M.plain('#a8a8ac', { metalness: 0.7, roughness: 0.3 })} />
          <Cyl rt={0.2} h={1.6} p={[-0.5, 6.4, -0.8]} r={[0, 0, 0.35]} m={M.plain('#c4802a')} seg={8} />
          {[0, 1, 2].map((i) => <Cyl key={i} rt={0.03} h={0.9} p={[-0.9 + i * 0.12, 7.4 + i * 0.05, -0.8]} r={[0, 0, 0.35]} m={M.plain('#e8e4dc')} seg={5} />)}
        </group>
        {/* painted gateway flanked by the Hanuman and Bhairav shrines */}
        <group position={[-6.2, 0, 4.2]}>
          <Box s={[7.4, 0.5, 1.8]} p={[0, 0.25, 0]} m={M.plain('#c8bca8')} />
          {[-1, 1].map((k) => <Box key={k} s={[0.55, 2.8, 0.7]} p={[k * 0.9, 1.9, 0]} m={blue} />)}
          <mesh position={[0, 3.3, 0]} material={pink}><torusGeometry args={[0.9, 0.2, 8, 24, Math.PI]} /></mesh>
          <Box s={[2.6, 0.5, 0.9]} p={[0, 3.45, 0]} m={pink} />
          <FwPyr p={[0, 4.0, 0]} w={2.2} h={0.6} m={pink} />
          {[-1, 1].map((k) => (
            <group key={k} position={[k * 2.6, 0.5, 0]}>
              <Box s={[1.9, 1.6, 1.6]} p={[0, 0.8, 0]} m={cream} />
              <mesh position={[0, 0.9, 0.82]} rotation={[Math.PI / 2, 0, 0]} material={M.plain('#3a2a22')}><cylinderGeometry args={[0.38, 0.38, 0.05, 16]} /></mesh>
              <group position={[0, 1.6, 0]}><FwGable w={2.2} d={1.9} h={0.55} m={M.plain(k < 0 ? '#2f78c2' : '#d96a5a', { roughness: 0.8 })} wallM={cream} ov={0.2} /></group>
            </group>
          ))}
        </group>
        {/* brick Ganesh temple with yellow bands */}
        <group position={[7.2, 0, 3.4]}>
          <Box s={[2.4, 2.2, 2.2]} p={[0, 1.1, 0]} m={M.mat('brick', 2, 2, { color: '#ffd5d0' })} />
          {[0.5, 1.5].map((y) => <Box key={y} s={[2.5, 0.16, 2.3]} p={[0, y, 0]} m={yellow} />)}
          <Box s={[0.8, 1.2, 0.06]} p={[0, 0.7, 1.12]} m={M.plain('#4a2a1a')} cast={false} />
          <Box s={[2.9, 0.18, 2.7]} p={[0, 2.35, 0]} m={M.plain('#6a4a3a')} />
        </group>
        <Frame s={[20, 12.6, 12]} p={[-0.6, 6.3, -0.4]} />
      </group>
    );
  }
  function ParshuEnv() {
    const M = useM();
    return (
      <group>
        <GroundDisc r={22} y={-0.03} m={M.plain('#b9ad94', { roughness: 1 })} />
        <GroundDisc r={140} y={-0.06} m={M.plain('#a09a84', { roughness: 1 })} />
        {/* paved path of brick, shrines among the trees */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 12]}><planeGeometry args={[2.4, 16]} /><meshStandardMaterial color="#b49a8c" roughness={1} /></mesh>
        {[[-10, 12, '#e8704a'], [10, 10, '#e88f6a'], [14, 4, '#e8a03a']].map(([x, z, c], i) => <FwBellShrine key={i} p={[x, 0, z]} r={i} w={1.4} h={1.6} red={M.plain('#f0a88a')} roof={M.plain(c, { roughness: 0.8 })} />)}
        {/* the Mahakali: wide stony bank, braided river, the Indian bank beyond */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, -36]}><planeGeometry args={[240, 40]} /><meshStandardMaterial color="#b9b0a0" roughness={1} /></mesh>
        <Water w={240} d={22} p={[0, -0.02, -56]} color="#7fa8a8" />
        {Array.from({ length: 40 }, (_, i) => <Ball key={i} rad={0.7} p={[-60 + rnd(i, 1) * 120, 0, -24 - rnd(i, 2) * 22]} sc={[1.4, 0.5, 1]} m={M.plain(i % 2 ? '#8e8a82' : '#a39d92', { roughness: 1 })} />)}
        <group position={[-14, 0, -30]}>
          <Ball rad={3} sc={[1.6, 0.6, 1]} m={M.plain('#8e8a82', { roughness: 1 })} />
          <Box s={[0.8, 0.9, 0.8]} p={[0.8, 1.2, 0]} m={M.plain('#f6f2e8')} />
          <FwPyr p={[0.8, 1.9, 0]} w={1.0} h={0.5} m={M.plain('#e8704a')} />
        </group>
        <FwHill p={[-50, -1, -90]} sc={[50, 24, 20]} m={M.plain('#6f8a62', { roughness: 1 })} />
        <FwHill p={[40, -1, -96]} sc={[60, 30, 20]} m={M.plain('#657f5a', { roughness: 1 })} />
        <FwPeak p={[0, -1, -150]} r={46} h={50} rock={M.plain('#8f90a0', { roughness: 1 })} snow={false} />
        {Array.from({ length: 30 }, (_, i) => { const a = i * 0.45; const rr = 17 + (i % 3) * 4; if (Math.sin(a) < -0.5 || Math.abs(Math.atan2(Math.sin(a - 0.93), Math.cos(a - 0.93))) < 0.8) return null; return <FwBigTree key={i} p={[Math.cos(a) * rr, 0, Math.sin(a) * rr]} s={0.9 + rnd(i, 3) * 0.3} col="#5c7a3c" />; })}
      </group>
    );
  }
  OUT['parshuram-dham-dadeldhura'] = { Main: ParshuMain, Env: ParshuEnv };

  return OUT;
}
