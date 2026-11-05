// Taleju Temple (1564), Hanuman Dhoka palace, Kathmandu Durbar Square.
// Three-roof Newar pagoda (~35 m) on a 12-stage red-brick plinth; the 8th stage is a wall with 12 small tile-roofed shrines in front.
// Axes: front = +z (red enclosure gateway with stone lions). Whole temple 14.5 units = 35 m (~0.41 units per metre).
// Setting: walled Mul Chowk court with tile-roofed palace wings, white balconied house, peepal tree, stalls, dense brick city behind.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Lion, Tree, Diyo, Frame, GroundDisc, THREE, useMemo } = K;

  const SAG = 1.0;
  const LIFT = 0.22;
  // 12 plinth stages [half-width, height]; stage 8 (index 7) is the taller wall that carries the shrine terrace in front of it
  const ST = [[5.7, 0.7], [5.5, 0.35], [5.3, 0.6], [5.1, 0.4], [4.95, 0.5], [4.8, 0.35], [4.7, 0.55], [3.9, 1.3], [3.8, 0.4], [3.7, 0.4], [3.6, 0.4], [3.5, 0.4]];
  const Y0 = [];
  let acc = 0;
  ST.forEach(([, h], i) => { Y0[i] = acc; acc += h; });
  const TOP = acc; // 5.9
  const RF = [
    { w: 9.4, h: 2.4, hw: 3.0, wallH: 2.4, tone: '#4c5236', ridge: '#8a8a60' },
    { w: 7.0, h: 2.0, hw: 2.3, wallH: 2.3, tone: '#515a3c', ridge: '#85875f' },
    { w: 4.4, h: 1.8, hw: 1.6, wallH: 2.0, tone: '#485234', ridge: '#7c8058' },
  ];
  const roofY = (R, hw) => { const r = hw / (R.w / 2); return R.h * (1 - r) ** SAG + LIFT * R.h * (r * r) ** 2.4; };
  const TI = [];
  {
    let base = TOP;
    RF.forEach((R, i) => {
      const eave = base + R.wallH;
      const top = eave + roofY(R, R.hw);
      TI.push({ ...R, base, eave, top });
      if (i < RF.length - 1) base = eave + roofY(R, RF[i + 1].hw) - 0.04;
    });
  }
  const PB = TI[2].eave + RF[2].h; // pinnacle base

  const BRICK = '#b8704f';
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  /* ---------- small parts ---------- */
  function Win({ p, w = 0.5, h = 0.85 }) {
    const M = useM();
    const gold = M.plain('#d9a82a', { metalness: 0.3, roughness: 0.5, emissive: '#7a4f08', emissiveIntensity: 0.55 });
    const ow = w + 0.2; const oh = h + 0.2;
    return (
      <group position={p}>
        <Box s={[ow, oh, 0.1]} p={[0, 0, 0]} m={M.dark} cast={false} />
        <Box s={[ow + 0.1, 0.1, 0.14]} p={[0, oh / 2 + 0.04, 0.01]} m={M.dark} cast={false} />
        <Box s={[w, h - w * 0.5, 0.06]} p={[0, -w * 0.25, 0.05]} m={gold} cast={false} />
        <Cyl rt={w / 2} h={0.06} p={[0, h / 2 - w * 0.5, 0.05]} r={[Math.PI / 2, 0, 0]} m={gold} seg={14} />
        <Box s={[0.03, h - 0.1, 0.03]} p={[0, -0.02, 0.1]} m={M.dark} cast={false} />
        <Box s={[w * 0.9, 0.03, 0.03]} p={[0, -0.1, 0.1]} m={M.dark} cast={false} />
      </group>
    );
  }

  // carved diagonal struts (tunala) under one eave: n per face plus one at each corner
  function Struts({ hw, rw, e, drop = 1.1 }) {
    const M = useM();
    const out = [];
    const mk = (key, z1, z2, x, rotY, wd) => {
      const y1 = e - drop; const y2 = e - 0.3;
      const len = Math.hypot(z2 - z1, y2 - y1); const ang = Math.atan2(z2 - z1, y2 - y1);
      out.push(
        <group key={key} rotation={[0, rotY, 0]}>
          <Box s={[wd, len, 0.2]} p={[x, (y1 + y2) / 2, (z1 + z2) / 2]} r={[ang, 0, 0]} m={M.dark} cast={false} />
          <Box s={[wd * 0.8, 0.3, 0.2]} p={[x, y1 - 0.12, z1 + 0.02]} m={M.plain('#6a4630')} cast={false} />
          <Box s={[wd * 0.5, 0.12, 0.3]} p={[x, y1 - 0.3, z1 + 0.04]} m={M.dark} cast={false} />
        </group>,
      );
    };
    for (let i = 0; i < 4; i += 1) {
      const rot = (i * Math.PI) / 2;
      [-0.66, 0, 0.66].forEach((f, j) => mk(`f${i}${j}`, hw + 0.02, rw * 0.9, f * hw, rot, 0.28));
      mk(`c${i}`, (hw + 0.02) * 1.414, rw * 0.9 * 1.414, 0, rot + Math.PI / 4, 0.34);
    }
    return <group>{out}</group>;
  }

  function PagodaRoof({ R, e }) {
    const M = useM();
    const patina = M.plain(R.tone, { roughness: 0.6, metalness: 0.3 });
    const w = R.w;
    const hips = [];
    for (let k = 0; k < 4; k += 1) {
      const sx = k % 2 ? 1 : -1; const sz = k < 2 ? 1 : -1;
      const N = 6;
      for (let n = 0; n < N; n += 1) {
        const r0 = 1 - (n / N) * 0.97; const r1 = 1 - ((n + 1) / N) * 0.97;
        const x0 = sx * r0 * w / 2; const z0 = sz * r0 * w / 2; const x1 = sx * r1 * w / 2; const z1 = sz * r1 * w / 2;
        const y0 = e + roofY(R, r0 * w / 2) + 0.03; const y1 = e + roofY(R, r1 * w / 2) + 0.03;
        const len = Math.hypot(x1 - x0, z1 - z0, y1 - y0);
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(x1 - x0, y1 - y0, z1 - z0).normalize());
        hips.push(<mesh key={`${k}${n}`} position={[(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2]} quaternion={q} material={M.gold}><boxGeometry args={[0.04, 0.04, len]} /></mesh>);
      }
    }
    return (
      <group>
        <Roof w={w} d={w} h={R.h} y={e} m={patina} sag={SAG} lift={LIFT} fascia={false} />
        {/* dark carved eave fascia and thin gilded drip edge */}
        <Box s={[w * 0.99, 0.45, w * 0.99]} p={[0, e - 0.2, 0]} m={M.plain('#3a2416', { roughness: 0.9 })} cast={false} />
        <Box s={[w * 0.995, 0.1, w * 0.995]} p={[0, e + 0.05, 0]} m={M.gold} cast={false} />
        {[[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b], i) => (
          <Box key={i} s={a ? [0.04, 0.04, w] : [w, 0.04, 0.04]} p={[a * w / 2, e + 0.1, b * w / 2]} m={M.gold} cast={false} />
        ))}
        {[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([a, b]) => (
          <Box key={`b${a}${b}`} s={[0.12, 0.2, 0.12]} p={[a * w / 2, e - 0.3, b * w / 2]} m={M.gold} cast={false} />
        ))}
        {hips}
      </group>
    );
  }

  function TierWall({ i }) {
    const M = useM();
    const t = TI[i];
    const hgt = t.top - t.base;
    const mat = M.plain(i === 0 ? BRICK : '#a8603f', { roughness: 1 });
    const vis = t.eave - t.base;
    const wy = t.base + (vis - 0.35) / 2 + 0.08;
    const rows = [-0.55 * t.hw, 0.55 * t.hw];
    const ww = 0.5;
    const wh = [0.95, 0.8, 0.7][i];
    return (
      <group>
        <Box s={[t.hw * 2, hgt, t.hw * 2]} p={[0, t.base + hgt / 2, 0]} m={mat} />
        {[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([a, b]) => <Box key={`${a}${b}`} s={[0.24, vis, 0.24]} p={[a * t.hw, t.base + vis / 2, b * t.hw]} m={M.dark} cast={false} />)}
        {/* carved timber frieze under the eave */}
        <Box s={[t.hw * 2 + 0.14, 0.45, t.hw * 2 + 0.14]} p={[0, t.eave - 0.25, 0]} m={M.dark} cast={false} />
        {/* sill band */}
        <Box s={[t.hw * 2 + 0.08, 0.14, t.hw * 2 + 0.08]} p={[0, t.base + 0.1, 0]} m={M.dark} cast={false} />
        {[0, 1, 2, 3].map((f) => (
          <group key={f} rotation={[0, (f * Math.PI) / 2, 0]}>
            {rows.map((x) => <Win key={x} p={[x, wy, t.hw + 0.02]} w={ww} h={wh} />)}
            {[-1, 1].map((k) => <Win key={`s${k}`} p={[k * t.hw * 0.86, wy + 0.1, t.hw + 0.02]} w={0.28} h={wh * 0.7} />)}
            {(i > 0 || f > 0) && <Win p={[0, wy, t.hw + 0.02]} w={[0.9, 0.9, 0.8][i]} h={[1.15, 1.05, 0.95][i]} />}
            {i === 0 && f === 0 && <Door y={t.base} z={t.hw} />}
          </group>
        ))}
      </group>
    );
  }

  function Door({ y, z }) {
    const M = useM();
    return (
      <group position={[0, y, z + 0.02]}>
        <Box s={[0.82, 1.05, 0.1]} p={[0, 0.58, 0]} m={M.dark} cast={false} />
        <Box s={[0.6, 0.9, 0.04]} p={[0, 0.55, 0.06]} m={M.plain('#2a180e')} cast={false} />
        {/* gilded torana arch */}
        <mesh position={[0, 1.08, 0.05]} material={M.gold}><torusGeometry args={[0.5, 0.05, 6, 16, Math.PI]} /></mesh>
        <Box s={[1.1, 0.07, 0.07]} p={[0, 1.08, 0.05]} m={M.gold} cast={false} />
        <Box s={[0.1, 0.1, 0.06]} p={[0, 1.62, 0.05]} m={M.gold} cast={false} />
        {[-1, 1].map((k) => <Box key={k} s={[0.14, 0.42, 0.1]} p={[k * 0.62, 0.36, 0.05]} m={M.gold} cast={false} />)}
      </group>
    );
  }

  function Pinnacle() {
    const M = useM();
    const y = PB;
    return (
      <group position={[0, y, 0]} scale={1.2}>
        <Box s={[0.9, 0.18, 0.9]} p={[0, 0.06, 0]} m={M.gold} />
        <Cyl rt={0.3} rb={0.42} h={0.4} p={[0, 0.35, 0]} m={M.gold} seg={16} />
        <Ball rad={0.42} p={[0, 0.82, 0]} sc={[1, 0.9, 1]} m={M.gold} />
        <Cyl rt={0.12} rb={0.2} h={0.42} p={[0, 1.28, 0]} m={M.gold} seg={12} />
        {[0, 1, 2, 3, 4].map((k) => <Cyl key={k} rt={0.36 - k * 0.055} rb={0.4 - k * 0.055} h={0.1} p={[0, 1.6 + k * 0.2, 0]} m={M.gold} seg={16} />)}
        <Cyl rt={0.05} rb={0.09} h={1.1} p={[0, 2.35, 0]} m={M.gold} seg={8} />
        <Ball rad={0.13} p={[0, 2.82, 0]} m={M.gold} />
        <mesh position={[0, 3.1, 0]} material={M.gold}><coneGeometry args={[0.07, 0.5, 8]} /></mesh>
      </group>
    );
  }

  // small tile-roofed shrine (1 or 2 roofs), ground at y=0
  function Shrine({ p, s = 1.4, sy = 1.3, two = true, r = 0 }) {
    const M = useM();
    const tile = M.mat('roof', 1.2, 1.2, { color: '#e89a5c' });
    const red = M.plain('#b83a26', { roughness: 0.9 });
    const gold = M.gold;
    return (
      <group position={p} rotation={[0, r, 0]} scale={[s, s * sy, s]}>
        <Box s={[0.72, 0.3, 0.72]} p={[0, 0.15, 0]} m={M.plain(BRICK, { roughness: 1 })} />
        <Box s={[0.44, 0.9, 0.44]} p={[0, 0.75, 0]} m={M.plain('#6a4630', { roughness: 0.9 })} />
        <Box s={[0.54, 0.05, 0.54]} p={[0, 0.32, 0]} m={M.plain('#efe6d6')} cast={false} />
        <Roof w={1.2} d={1.2} h={0.34} y={1.2} m={tile} sag={1.3} lift={0.2} fascia={false} />
        <Box s={[1.2, 0.03, 1.2]} p={[0, 1.19, 0]} m={red} cast={false} />
        {two ? (
          <>
            <Box s={[0.3, 0.3, 0.3]} p={[0, 1.5, 0]} m={M.plain('#6a4630', { roughness: 0.9 })} />
            <Roof w={0.8} d={0.8} h={0.26} y={1.62} m={tile} sag={1.3} lift={0.2} fascia={false} />
            <Box s={[0.8, 0.03, 0.8]} p={[0, 1.6, 0]} m={red} cast={false} />
            <Cyl rt={0.04} rb={0.07} h={0.2} p={[0, 2.0, 0]} m={gold} seg={8} />
            <mesh position={[0, 2.26, 0]} material={gold}><coneGeometry args={[0.06, 0.35, 6]} /></mesh>
          </>
        ) : (
          <>
            <Cyl rt={0.04} rb={0.07} h={0.2} p={[0, 1.72, 0]} m={gold} seg={8} />
            <mesh position={[0, 1.92, 0]} material={gold}><coneGeometry args={[0.05, 0.22, 6]} /></mesh>
          </>
        )}
      </group>
    );
  }

  function Plinth() {
    const M = useM();
    const white = M.plain('#efe6d6', { roughness: 0.85 });
    const tones = ['#b8704f', '#ae6646', '#bf7852', '#b36a4a', '#bb7350', '#ae6646', '#bd7551'];
    const bands = new Set([0, 3, 7, 11]);
    const hz = ST[7][0];
    const out = [];
    const sp = 4.3;
    const pts = [[-sp, sp, 0.1], [-1.5, sp, 0], [1.5, sp, 0.05], [sp, sp, 0], [-sp, -sp, 0], [-1.5, -sp, 0.1], [1.5, -sp, 0], [sp, -sp, 0.05], [-sp, -1.6, 0.1], [-sp, 1.7, 0], [sp, -1.6, 0], [sp, 1.7, 0.1]];
    const sc = [1.1, 1.0, 1.15, 1.05, 1.0, 1.1, 1.05, 1.1, 1.0, 1.15, 1.1, 1.0];
    pts.forEach(([x, z, r], i) => out.push(<Shrine key={i} p={[x, Y0[7] + 0.02, z]} s={sc[i]} sy={1.25 + (i % 3) * 0.08} two={i % 4 !== 2} r={r} />));
    return (
      <group>
        {ST.map(([hw, h], i) => (
          <group key={i}>
            <Box s={[hw * 2, h, hw * 2]} p={[0, Y0[i] + h / 2, 0]} r={i < 4 ? [0.012 * (i % 2 ? -1 : 1), 0, 0.012] : [0, 0, 0]} m={M.plain(i === 7 ? '#c27a56' : i < 7 ? tones[i] : BRICK, { roughness: 1 })} />
            {bands.has(i) && <Box s={[hw * 2 + 0.08, 0.04, hw * 2 + 0.08]} p={[0, Y0[i] + h - 0.02, 0]} m={white} cast={false} />}
          </group>
        ))}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => {
          const top = Y0[i] + ST[i][1];
          return <Box key={`st${i}`} s={[2.2, top, 0.55]} p={[0, top / 2, ST[i][0] + 0.2]} m={M.plain('#d4825e', { roughness: 1 })} />;
        })}
        <Box s={[9.2, 0.03, 9.2]} p={[0, Y0[7] + 0.015, 0]} m={M.plain('#a8886a', { roughness: 1 })} cast={false} />
        {[0, 1, 2, 3].map((f) => (
          <group key={f} rotation={[0, (f * Math.PI) / 2, 0]}>
            {[-2.5, -1.25, 0, 1.25, 2.5].map((x) => <Box key={x} s={[0.5, 0.7, 0.06]} p={[x, Y0[7] + 0.7, hz + 0.02]} m={M.dark} cast={false} />)}
            {[-1.9, -0.6, 0.6, 1.9].map((x) => <Box key={`g${x}`} s={[0.22, 0.4, 0.04]} p={[x, Y0[7] + 0.7, hz + 0.05]} m={M.plain('#d9a82a', { emissive: '#7a4f08', emissiveIntensity: 0.4 })} cast={false} />)}
          </group>
        ))}
        {out}
      </group>
    );
  }

  function Gateway() {
    const M = useM();
    const red = M.plain('#a9442f', { roughness: 0.95 });
    const white = M.plain('#efe6d6', { roughness: 0.85 });
    const stone = M.plain('#d8d0c0', { roughness: 0.9 });
    const z = 7.2;
    return (
      <group position={[0, 0, z]} scale={[1.2, 1.15, 1.2]}>
        {[-1, 1].map((k) => (
          <group key={k}>
            <Box s={[8.7, 1.4, 0.9]} p={[k * 6.6, 0.7, 0]} m={red} />
            <Box s={[8.8, 0.16, 1.05]} p={[k * 6.6, 1.46, 0]} m={white} cast={false} />
            {/* pier */}
            <Box s={[1.3, 3.0, 1.3]} p={[k * 1.6, 1.5, 0]} m={red} />
            <Box s={[1.6, 0.14, 1.6]} p={[k * 1.6, 3.07, 0]} m={white} cast={false} />
            {[2.6, 2.0, 1.4, 0.8].map((yy) => <Cyl key={yy} rt={0.17} h={0.05} p={[k * 1.6, yy, 0.68]} r={[Math.PI / 2, 0, 0]} m={M.gold} seg={14} />)}
            
            {/* stone lion on pedestal in front */}
            <Box s={[1.2, 0.8, 1.2]} p={[k * 1.6, 0.4, 1.5]} m={white} />
            <group position={[k * 1.6, 0.8, 1.5]} scale={3.6}><Lion m={M.plain('#e6dfd0')} /></group>
            <Diyo p={[k * 1.6, 0.82, 2.15]} light />
          </group>
        ))}
        {/* arch over door */}
        <Box s={[1.9, 1.0, 1.2]} p={[0, 2.5, 0]} m={red} />
        <Box s={[4.5, 0.18, 1.6]} p={[0, 3.07, 0]} m={white} />
        <Box s={[2.2, 0.4, 1.0]} p={[0, 3.36, -0.1]} m={red} />
        <Box s={[2.4, 0.08, 1.1]} p={[0, 3.6, -0.1]} m={white} cast={false} />
        <Box s={[0.26, 0.26, 0.26]} p={[0, 3.8, -0.1]} m={M.gold} cast={false} />
        {/* cream carved arch ring and stone arch around the door */}
        <mesh position={[0, 1.95, 0.6]} material={M.plain('#f0e6d0')}><torusGeometry args={[1.2, 0.16, 6, 24, Math.PI]} /></mesh>
        <mesh position={[0, 1.95, 0.62]} material={M.plain('#6a4630')}><torusGeometry args={[1.02, 0.14, 6, 24, Math.PI]} /></mesh>
        {[0.2, 0.5, 0.8, 1.1].map((a) => <Cyl key={a} rt={0.07} h={0.05} p={[Math.cos(a * 2.6) * 1.02, 1.95 + Math.sin(a * 2.6) * 1.02, 0.7]} r={[Math.PI / 2, 0, 0]} m={M.gold} seg={8} />)}
        <mesh position={[0, 1.95, 0.58]} material={stone}><torusGeometry args={[0.95, 0.1, 6, 20, Math.PI]} /></mesh>
        {[-1, 1].map((k) => <Box key={k} s={[0.22, 1.9, 0.2]} p={[k * 1.12, 0.95, 0.58]} m={M.plain('#f0e6d0')} cast={false} />)}
        <Box s={[1.9, 1.9, 0.6]} p={[0, 0.95, -0.1]} m={M.plain('#2a1a10')} />
        <mesh position={[0, 1.9, -0.1]} rotation={[Math.PI / 2, 0, 0]} material={M.plain('#2a1a10')}><cylinderGeometry args={[0.95, 0.95, 0.6, 20, 1, false, 0, Math.PI]} /></mesh>
        <Box s={[0.08, 2.5, 0.08]} p={[0, 1.0, 0.25]} m={M.dark} cast={false} />
        {[-1, 1].map((k) => [0.6, 1.2, 1.8].map((y) => <Cyl key={`${k}${y}`} rt={0.07} h={0.05} p={[k * 0.45, y, 0.23]} r={[Math.PI / 2, 0, 0]} m={M.gold} seg={8} />))}
      </group>
    );
  }

  function TalejuMain() {
    const M = useM();
    return (
      <group>
        <Plinth />
        {TI.map((t, i) => (
          <group key={i}>
            <TierWall i={i} />
            <Struts hw={t.hw} rw={t.w / 2} e={t.eave} />
            <PagodaRoof R={t} e={t.eave} />
          </group>
        ))}
        <Pinnacle />
        <Gateway />
        <pointLight position={[0, 8, 6]} intensity={1.2} distance={9} color="#ffb35a" />
        <Frame s={[16, 21, 17]} p={[0, 10, 3]} />
      </group>
    );
  }

  /* ---------- environment ---------- */
  function GableRoof({ len, d, h, m, red }) {
    const M = useM();
    const geo = useMemo(() => {
      const hd = d / 2 + 0.4;
      const sh = new THREE.Shape();
      sh.moveTo(-hd, 0); sh.lineTo(hd, 0); sh.lineTo(0, h); sh.lineTo(-hd, 0);
      const g = new THREE.ExtrudeGeometry(sh, { depth: len + 0.7, bevelEnabled: false });
      g.translate(0, 0, -(len + 0.7) / 2);
      g.rotateY(Math.PI / 2);
      return g;
    }, [len, d, h]);
    return (
      <group>
        <mesh geometry={geo} material={m} castShadow receiveShadow />
        {red && [-1, 1].map((k) => <Box key={k} s={[len + 0.7, 0.14, 0.06]} p={[0, 0.02, k * (d / 2 + 0.4)]} m={M.plain('#b22a1f')} cast={false} />)}
      </group>
    );
  }

  // palace wing: length along local x, windows on +z face
  function Wing({ p, r = 0, len, d = 2.2, storeys = 2, tint = BRICK }) {
    const M = useM();
    const H = storeys * 1.3;
    const tile = M.mat('roof', 0.9, 0.9, { color: '#cf9070' });
    const n = Math.max(2, Math.floor(len / 1.35));
    const gold = M.plain('#d9a82a', { emissive: '#7a4f08', emissiveIntensity: 0.4, roughness: 0.5 });
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[len, H, d]} p={[0, H / 2, 0]} m={M.plain(tint, { roughness: 1 })} />
        {Array.from({ length: storeys }).map((_, s) => (
          <group key={s}>
            <Box s={[len * 0.96, 0.08, 0.14]} p={[0, s * 1.3 + 1.2, d / 2 + 0.03]} m={M.dark} cast={false} />
            {Array.from({ length: n }).map((__, k) => (
              <group key={k} position={[((k + 0.5) / n - 0.5) * len * 0.92, s * 1.3 + 0.7, d / 2 + 0.03]}>
                <Box s={[0.58, 0.6, 0.08]} m={M.dark} cast={false} />
                <Box s={[0.42, 0.44, 0.05]} p={[0, 0, 0.04]} m={s === 0 ? M.plain('#2b211b') : gold} cast={false} />
              </group>
            ))}
          </group>
        ))}
        <group position={[0, H, 0]}><GableRoof len={len} d={d} h={0.95} m={tile} red /></group>
      </group>
    );
  }

  function WhiteHouse({ p, r = 0 }) {
    const M = useM();
    const white = M.plain('#f3eee4', { roughness: 0.85 });
    const tile = M.mat('roof', 0.9, 0.9, { color: '#cf9070' });
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[3.6, 4.2, 3.2]} p={[0, 2.1, 0]} m={white} />
        {[0, 1, 2].map((s) => (
          <group key={s}>
            <Box s={[3.62, 0.1, 3.22]} p={[0, s * 1.4 + 1.38, 0]} m={M.dark} cast={false} />
            {[-1, 0, 1].map((x) => <Box key={x} s={[0.5, 0.7, 0.08]} p={[x * 1.05, s * 1.4 + 0.75, 1.62]} m={M.dark} cast={false} />)}
          </group>
        ))}
        {/* carved timber balcony on the 2nd storey */}
        <Box s={[2.8, 0.1, 0.7]} p={[0, 2.9, 1.95]} m={M.dark} />
        <Box s={[2.8, 0.55, 0.06]} p={[0, 3.2, 2.28]} m={M.dark} cast={false} />
        {[-1.2, 0, 1.2].map((x) => <Box key={x} s={[0.1, 0.5, 0.1]} p={[x, 2.65, 2.2]} m={M.dark} cast={false} />)}
        <group position={[0, 4.2, 0]}><GableRoof len={3.6} d={3.2} h={1.1} m={tile} red /></group>
      </group>
    );
  }

  function Stalls() {
    const M = useM();
    const cols = ['#2f6db5', '#c0392b', '#e08a2c', '#d4538a', '#2e8b57', '#f2efe6', '#7a4fa8'];
    return (
      <group>
        {cols.map((c, i) => (
          <group key={i} position={[-21 + i * 2.5, 0, 13.5]}>
            <Box s={[2.1, 0.9, 1.1]} p={[0, 0.45, 0]} m={M.mat('wood', 1, 1, { color: '#a07a5a' })} />
            <Box s={[2.3, 0.07, 1.5]} p={[0, 1.95, 0.1]} r={[0.25, 0, 0]} m={M.plain(c)} cast={false} />
            <Box s={[0.07, 1.9, 0.07]} p={[-1.05, 0.95, 0.65]} m={M.dark} cast={false} />
            <Box s={[0.07, 1.9, 0.07]} p={[1.05, 0.95, 0.65]} m={M.dark} cast={false} />
            <Box s={[1.6, 0.6, 0.3]} p={[0, 1.2, -0.1]} m={M.plain(cols[(i + 3) % 7])} cast={false} />
          </group>
        ))}
      </group>
    );
  }

  function City() {
    const M = useM();
    const D = useMemo(() => {
      const rnd = rng(11);
      const pal = ['#e0a58c', '#d09a7c', '#e6c8b0', '#f0e4d2', '#c9806a', '#dbb0a4', '#c8b49a', '#e0b898', '#b4b2ac', '#a8a6a0', '#e0b6bd', '#d4a0a8', '#c48d7a'].map((c) => new THREE.Color(c));
      const houses = [];
      for (let ring = 0; ring < 6; ring += 1) {
        const r = 24 + ring * 6;
        const jit = 1 + (ring % 3) * 0.6;
        const n = Math.floor((2 * Math.PI * r) / 4.7);
        for (let i = 0; i < n; i += 1) {
          if (rnd() < 0.3) continue;
          const a = ((i + rnd() * 0.9) / n) * 2 * Math.PI;
          const rr = r + (rnd() - 0.5) * 3.6 * jit;
          if (a > 4.9 || a < 1.8) { if (rr < 66) continue; } // keep the camera side and the market front open
          const storeys = 3 + Math.floor(rnd() * 2);
          const white = ring < 3 && rnd() < 0.3;
          houses.push({ x: Math.sin(a) * rr, z: Math.cos(a) * rr, rot: a + Math.PI + (rnd() - 0.5) * 0.3, w: 2.8 + rnd() * 1.3, d: 2.6 + rnd() * 1.2, st: storeys, col: white ? new THREE.Color('#fbf3e6') : pal[Math.floor(rnd() * pal.length)], white, lit: rnd() });
        }
      }
      return houses;
    }, []);
    const cnt = D.length;
    const wins = D.reduce((s, h) => s + h.st, 0);
    const fill = (mesh, getter) => {
      if (!mesh) return;
      const o = new THREE.Object3D();
      let idx = 0;
      D.forEach((h) => getter(h, (lx, ly, lz, sx, sy, sz, color) => {
        const hm = new THREE.Matrix4().compose(new THREE.Vector3(h.x, 0, h.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, h.rot, 0)), new THREE.Vector3(1, 1, 1));
        o.position.set(lx, ly, lz); o.scale.set(sx, sy, sz); o.rotation.set(0, 0, 0); o.updateMatrix();
        mesh.setMatrixAt(idx, hm.clone().multiply(o.matrix));
        if (color) mesh.setColorAt(idx, color);
        idx += 1;
      }));
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    };
    const dk = new THREE.Color('#33231a'); const gl = new THREE.Color('#5a3d2c'); const lt = new THREE.Color('#ffcf7a');
    const gable = useMemo(() => {
      const sh = new THREE.Shape();
      sh.moveTo(-0.5, 0); sh.lineTo(0.5, 0); sh.lineTo(0, 1); sh.lineTo(-0.5, 0);
      const g = new THREE.ExtrudeGeometry(sh, { depth: 1, bevelEnabled: false });
      g.translate(0, 0, -0.5); g.rotateY(Math.PI / 2);
      return g;
    }, []);
    return (
      <group>
        <instancedMesh args={[null, null, cnt]} frustumCulled={false} castShadow ref={(m) => fill(m, (h, put) => put(0, (h.st * 1.25) / 2, 0, h.w, h.st * 1.25, h.d, h.col))}>
          <boxGeometry args={[1, 1, 1]} />
          <primitive object={M.plain('#ffffff', { roughness: 1 })} attach="material" />
        </instancedMesh>
        <instancedMesh args={[gable, null, cnt]} frustumCulled={false} ref={(m) => fill(m, (h, put) => put(0, h.st * 1.25, 0, h.w + 0.4, (h.lit < 0.55 ? 0.9 + h.lit * 0.3 : 0.25), h.d + 0.5, new THREE.Color(h.lit < 0.3 ? '#a8573a' : h.lit < 0.55 ? '#c0704c' : h.lit < 0.8 ? '#8a8a86' : '#7a5a4c')))}>
          <primitive object={M.plain('#ffffff', { roughness: 1 })} attach="material" />
        </instancedMesh>
        <instancedMesh args={[null, null, cnt]} frustumCulled={false} ref={(m) => fill(m, (h, put) => put(0, 2.3, h.d / 2 + 0.3, h.w * 0.7, 0.22, 0.6, new THREE.Color('#3a2418')))}>
          <boxGeometry args={[1, 1, 1]} />
          <primitive object={M.plain('#ffffff', { roughness: 0.7 })} attach="material" />
        </instancedMesh>
        <instancedMesh args={[null, null, wins]} frustumCulled={false} ref={(m) => {
          if (!m) return;
          const o = new THREE.Object3D(); let idx = 0;
          D.forEach((h) => {
            const hm = new THREE.Matrix4().compose(new THREE.Vector3(h.x, 0, h.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, h.rot, 0)), new THREE.Vector3(1, 1, 1));
            for (let s = 0; s < h.st; s += 1) {
              o.position.set(0, s * 1.25 + 0.75, h.d / 2 + 0.02); o.scale.set(h.w * 0.7, 0.42, 0.05); o.rotation.set(0, 0, 0); o.updateMatrix();
              m.setMatrixAt(idx, hm.clone().multiply(o.matrix));
              m.setColorAt(idx, ((h.lit * 7 + s) % 1) < 0.12 ? lt : ((h.lit * 13 + s) % 1) < 0.5 ? gl : dk);
              idx += 1;
            }
          });
          m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
        }}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="#ffffff" />
        </instancedMesh>
      </group>
    );
  }

  function Hills() {
    const M = useM();
    const spec = [[-60, -20, 24, 22, '#8fa59c'], [-40, -56, 30, 24, '#98aca4'], [0, -72, 36, 23, '#a2b5ae'], [42, -58, 30, 21, '#98aca4'], [66, -22, 26, 20, '#8fa59c'], [-72, 18, 24, 20, '#a2b5ae'], [72, 26, 22, 20, '#98aca4']];
    return (
      <group>
        {spec.map(([x, z, r, h, c], i) => <Ball key={i} rad={r} p={[x, -h * 0.28, z]} sc={[1.3, h / r, 1]} m={M.plain(c, { roughness: 1 })} />)}
      </group>
    );
  }

  function Sky() {
    const geo = useMemo(() => {
      const g = new THREE.SphereGeometry(140, 24, 14);
      const pos = g.attributes.position; const cols = [];
      const top = new THREE.Color('#7f9bb8'); const hor = new THREE.Color('#bccbcb');
      for (let i = 0; i < pos.count; i += 1) {
        const t = Math.min(1, Math.max(0, pos.getY(i) / 100));
        const c = hor.clone().lerp(top, Math.pow(t, 0.7));
        cols.push(c.r, c.g, c.b);
      }
      g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
      return g;
    }, []);
    return <mesh geometry={geo}><meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} /></mesh>;
  }

  function Peepal({ p, s = 1 }) {
    const M = useM();
    const g = ['#4f7a3e', '#5e8a47', '#456f37', '#6a9450', '#3f6633'].map((c) => M.plain(c, { roughness: 1 }));
    const bark = M.mat('wood', 1, 1, { color: '#7a5a42' });
    const L = [[0, 4.0, 0, 1.7, 0], [1.9, 3.5, 0.6, 1.2, 1], [-1.8, 3.9, -0.4, 1.3, 2], [0.4, 5.0, 0.3, 1.1, 3], [-0.6, 3.4, 1.8, 0.9, 4], [1.2, 4.4, -1.4, 0.9, 1], [-2.4, 3.2, 0.8, 0.8, 0], [2.6, 3.9, -0.4, 0.7, 3], [0.2, 3.0, -1.7, 0.8, 2], [-1.0, 4.8, -0.8, 0.7, 1], [1.0, 5.2, 1.0, 0.6, 4], [-1.6, 4.6, 1.2, 0.6, 3]];
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.34} rb={0.55} h={3.0} p={[0, 1.5, 0]} m={bark} seg={8} />
        <Cyl rt={0.12} rb={0.2} h={2.0} p={[1.0, 3.0, 0.2]} r={[0, 0, -0.7]} m={bark} seg={6} />
        <Cyl rt={0.12} rb={0.2} h={2.0} p={[-1.0, 3.0, -0.2]} r={[0, 0, 0.7]} m={bark} seg={6} />
        {L.map(([x, y, z, r, c], i) => <Ball key={i} rad={r} p={[x, y, z]} sc={[1.15, 0.7, 1.1]} m={g[c]} />)}
      </group>
    );
  }

  function DistantPagoda({ p, s = 1 }) {
    const M = useM();
    const rf = M.plain('#6b6a4a', { roughness: 0.7 });
    return (
      <group position={p} scale={s}>
        <Box s={[7, 2.4, 7]} p={[0, 1.2, 0]} m={M.plain('#e0a088', { roughness: 1 })} />
        {[0, 1, 2].map((i) => (
          <group key={i}>
            <Box s={[3.6 - i * 0.8, 1.6, 3.6 - i * 0.8]} p={[0, 3.2 + i * 2.6, 0]} m={M.plain('#d8907a', { roughness: 1 })} />
            <Roof w={7.2 - i * 1.6} d={7.2 - i * 1.6} h={1.5} y={4.0 + i * 2.6} m={rf} sag={1.1} lift={0.2} fascia={false} />
          </group>
        ))}
        <Cyl rt={0.1} rb={0.3} h={2.2} p={[0, 11.2, 0]} m={M.gold} seg={8} />
      </group>
    );
  }

  function TalejuEnv() {
    const M = useM();
    const red = M.plain('#a9442f', { roughness: 0.95 });
    const white = M.plain('#efe6d6', { roughness: 0.85 });
    return (
      <group>
        <Sky />
        <GroundDisc r={95} y={-0.05} m={M.plain('#8f8470', { roughness: 1 })} />
        <GroundDisc r={22} y={-0.02} m={M.plain('#9c8a72', { roughness: 1 })} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.5]} receiveShadow material={M.plain('#a8886a', { roughness: 1 })}><planeGeometry args={[22, 22]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 15]} receiveShadow material={M.plain('#a8886a', { roughness: 1 })}><planeGeometry args={[40, 12]} /></mesh>
        {/* enclosure walls (Mul Chowk) */}
        <Box s={[0.9, 2.0, 21.1]} p={[-11, 1.0, -0.95]} m={red} />
        <Box s={[1.05, 0.16, 21.2]} p={[-11, 2.06, -0.95]} m={white} cast={false} />
        <Box s={[22.9, 2.0, 0.9]} p={[0, 1.0, -11.5]} m={red} />
        <Box s={[23, 0.16, 1.05]} p={[0, 2.06, -11.5]} m={white} cast={false} />
        {/* palace wings around the court: red-fringed tile roofs */}
        <Wing p={[-7.4, 0, 4.5]} r={Math.PI / 2} len={6} d={2.2} storeys={2} />
        <Wing p={[-7.4, 0, -2.5]} r={Math.PI / 2} len={8} d={2.2} storeys={3} tint="#e8a888" />
        <Wing p={[8.2, 0, -6.5]} r={-Math.PI / 2} len={7} d={2.2} storeys={1} tint="#e0a088" />
        <Wing p={[0, 0, -9.4]} r={0} len={17.5} d={2.4} storeys={3} />
        <Wing p={[-9.3, 0, -8.2]} r={Math.PI / 2} len={4} d={2.2} storeys={3} tint="#d58f76" />
        {/* white balconied house, right */}
        <WhiteHouse p={[11, 0, 1.5]} r={-Math.PI / 2} />
        {/* red-fringed tile pavilions front-left (as in the 2013 photo) */}
        <Shrine p={[-9, 0, 10.5]} s={1.7} sy={1} two />
        <Shrine p={[-5.2, 0, 11.4]} s={1.3} sy={1} two={false} />
        <Shrine p={[-13, 0, 9.4]} s={1.5} sy={1} two />
        <Shrine p={[-15.5, 0, 6]} s={1.7} sy={1} two={false} />
        
        {/* the big peepal and other trees */}
        <Peepal p={[-19, 0, -3]} s={1.1} />
        <Peepal p={[16, 0, -12]} s={0.8} />
        <City />
        <Hills />
        <Wing p={[-38, 0, -24]} r={Math.PI / 2} len={14} d={3} storeys={3} tint="#c98d6e" />
        <Wing p={[26, 0, -40]} r={0.3} len={18} d={3} storeys={4} tint="#d9a28a" />
      </group>
    );
  }

  return { 'taleju-temple': { Main: TalejuMain, Env: TalejuEnv } };
}
