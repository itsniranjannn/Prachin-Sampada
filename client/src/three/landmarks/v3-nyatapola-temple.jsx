// Nyatapola Temple, Taumadhi Square, Bhaktapur. Five-roof Newar pagoda on a five-level brick pyramid plinth.
// Axes: front = +z (south, into Taumadhi Square). West = -x (brick houses), north = -z (houses behind), east = +x (Bhairabnath).
// Scale: whole temple 16 units = 33 m (about 0.48 units per metre).
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Gajur, Tree, Frame, THREE, useMemo } = K;

  /* ---------- dimensions ---------- */
  const LH = 1.04;                       // height of each plinth level
  const PW = [7.6, 6.1, 4.85, 3.9, 3.2]; // half-width of plinth levels 1..5 (square plan), wider paved rims
  const TOP = LH * 5;                    // 5.2: top platform
  const SW = 2.0;                        // stair width
  const FOOT = 8.9;                      // z of the stair foot
  const STEPS = [7, 7, 7, 6, 6];         // 33 steps in all
  const SAG = 1.45;
  const RW = [9.6, 7.4, 5.7, 4.4, 3.3];  // roof widths, tier 1 (lowest) to 5: fast taper
  const RH = [1.9, 1.6, 1.35, 1.1, 0.95];
  const WALLH = [0, 1.6, 1.4, 1.25, 1.1];
  const HALF = [2.8, RW[1] * 0.29, RW[2] * 0.29, RW[3] * 0.29, RW[4] * 0.29]; // wall half-widths per storey
  const E = [7.25];                      // eave heights
  const BASE = [TOP];
  for (let k = 1; k < 5; k += 1) {
    const ratio = HALF[k] / (RW[k - 1] / 2);
    BASE[k] = E[k - 1] + RH[k - 1] * (1 - ratio) ** SAG;
    E[k] = BASE[k] + WALLH[k];
  }
  const APEX = E[4] + RH[4];
  const FH = APEX + 3.6;                 // frame height incl. 1.3x taller finial

  const TIMBER_D = '#241408';
  const STRUTC = '#4a2a18';
  const TIMBER = '#3d2414';
  const BRICK = '#b0634a';
  const PLBRICK = '#c8704f';
  const TILE = '#a65e3c';

  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  /* ---------- carved timber struts (tunala) under an eave: slanting brackets on all four sides ---------- */
  function Struts({ bx, bz, hx, hz, e, drop, nx, nz, m, th = 0.1 }) {
    const out = [];
    [1, -1].forEach((sz) => {
      const z1 = sz * (bz + 0.02); const z2 = sz * hz * 0.84; const y1 = e - drop; const y2 = e - 0.1;
      const len = Math.hypot(z2 - z1, y2 - y1); const ang = Math.atan2(z2 - z1, y2 - y1);
      for (let i = 0; i < nx; i += 1) {
        const x = ((i + 0.5) / nx - 0.5) * 2 * bx * 0.94;
        out.push(<Box key={`z${sz}${i}`} s={[th, len, th * 0.9]} p={[x, (y1 + y2) / 2, (z1 + z2) / 2]} r={[ang, 0, 0]} m={m} cast={false} />);
      }
    });
    [1, -1].forEach((sx) => {
      const x1 = sx * (bx + 0.02); const x2 = sx * hx * 0.84; const y1 = e - drop; const y2 = e - 0.1;
      const len = Math.hypot(x2 - x1, y2 - y1); const ang = -Math.atan2(x2 - x1, y2 - y1);
      for (let i = 0; i < nz; i += 1) {
        const z = ((i + 0.5) / nz - 0.5) * 2 * bz * 0.94;
        out.push(<Box key={`x${sx}${i}`} s={[th * 0.9, len, th]} p={[(x1 + x2) / 2, (y1 + y2) / 2, z]} r={[0, 0, ang]} m={m} cast={false} />);
      }
    });
    return <group>{out}</group>;
  }

  /* ---------- stone guardians (face +z, about 0.6 tall before scaling) ---------- */
  function GWrestler({ m, tm, dk }) {
    return (
      <group>
        {/* seated on haunches: wide base, knees up, forearms resting on the knees */}
        <Box s={[0.5, 0.14, 0.4]} p={[0, 0.07, -0.02]} m={m} />
        <Box s={[0.4, 0.3, 0.26]} p={[0, 0.29, -0.03]} m={m} />
        <Box s={[0.62, 0.14, 0.24]} p={[0, 0.46, -0.03]} m={m} />
        {[-1, 1].map((k) => <Ball key={`sh${k}`} rad={0.085} p={[k * 0.29, 0.45, -0.02]} m={m} />)}
        {[-1, 1].map((k) => <Ball key={`kn${k}`} rad={0.1} p={[k * 0.22, 0.2, 0.2]} m={m} />)}
        {[-1, 1].map((k) => <Cyl key={`fa${k}`} rt={0.05} h={0.3} p={[k * 0.28, 0.32, 0.1]} r={[0.8, 0, k * 0.12]} m={m} seg={6} />)}
        {[-1, 1].map((k) => <Cyl key={`sl${k}`} rt={0.07} h={0.26} p={[k * 0.2, 0.1, 0.23]} r={[1.45, 0, 0]} m={dk} seg={6} />)}
        <Ball rad={0.09} p={[0, 0.6, 0.02]} m={m} />
        {[-1, 1].map((k) => <Ball key={`ey${k}`} rad={0.014} p={[k * 0.035, 0.62, 0.1]} m={dk} />)}
        <Box s={[0.2, 0.02, 0.02]} p={[0, 0.56, 0.1]} m={dk} cast={false} />
        {/* turban: crown, brim and top knot */}
        <Cyl rt={0.125} rb={0.135} h={0.05} p={[0, 0.685, 0.01]} m={dk} seg={14} />
        <Ball rad={0.13} sc={[1.05, 0.85, 1.05]} p={[0, 0.74, 0.01]} m={tm} />
        <Ball rad={0.04} p={[0, 0.84, 0.01]} m={tm} />
      </group>
    );
  }
  function GElephant({ m, dk }) {
    return (
      <group>
        {/* tall rectangular body about 0.5 long, taller than it is long with head raised */}
        <Box s={[0.3, 0.4, 0.5]} p={[0, 0.3, -0.04]} m={m} />
        <Box s={[0.24, 0.14, 0.34]} p={[0, 0.52, -0.07]} m={dk} />
        <Box s={[0.24, 0.26, 0.22]} p={[0, 0.62, 0.2]} m={m} />
        <Ball rad={0.1} sc={[1.1, 0.8, 0.9]} p={[0, 0.75, 0.2]} m={m} />
        {[-1, 1].map((k) => <Box key={`ear${k}`} s={[0.03, 0.2, 0.17]} p={[k * 0.15, 0.6, 0.15]} r={[0, k * 0.3, 0]} m={m} />)}
        {/* trunk hanging down the front with a curled tip */}
        <Cyl rt={0.045} rb={0.06} h={0.34} p={[0, 0.42, 0.34]} r={[0.08, 0, 0]} m={m} seg={8} />
        <Ball rad={0.052} p={[0, 0.23, 0.355]} m={m} />
        {[-1, 1].map((k) => <mesh key={`t${k}`} position={[k * 0.09, 0.5, 0.33]} rotation={[1.3, 0, 0]} material={dk}><coneGeometry args={[0.018, 0.16, 6]} /></mesh>)}
        {[-1, 1].map((k) => <Ball key={`ey${k}`} rad={0.014} p={[k * 0.1, 0.66, 0.3]} m={dk} />)}
        {[-0.1, 0.1].map((x) => [0.14, -0.2].map((z) => <Cyl key={`${x}${z}`} rt={0.06} h={0.2} p={[x, 0.1, z]} m={m} seg={8} />))}
      </group>
    );
  }
  function GLion({ m, mane }) {
    return (
      <group>
        {/* crouched haunches, upright forelegs, round mane disc and a large squared head */}
        <Box s={[0.3, 0.26, 0.34]} p={[0, 0.17, -0.12]} m={m} />
        <Ball rad={0.13} sc={[1, 1, 1.1]} p={[-0.13, 0.17, -0.2]} m={m} />
        <Ball rad={0.13} sc={[1, 1, 1.1]} p={[0.13, 0.17, -0.2]} m={m} />
        <Box s={[0.26, 0.3, 0.16]} p={[0, 0.3, 0.02]} m={m} />
        {[-1, 1].map((k) => <Box key={k} s={[0.07, 0.3, 0.08]} p={[k * 0.09, 0.15, 0.16]} m={m} />)}
        <Cyl rt={0.27} rb={0.27} h={0.14} p={[0, 0.5, 0.0]} r={[Math.PI / 2, 0, 0]} m={mane} seg={16} />
        <Box s={[0.3, 0.2, 0.2]} p={[0, 0.48, 0.12]} m={m} />
        <Box s={[0.22, 0.1, 0.12]} p={[0, 0.42, 0.24]} m={m} />
        <Box s={[0.2, 0.025, 0.04]} p={[0, 0.37, 0.3]} m={mane} cast={false} />
        {[-1, 1].map((k) => <Ball key={`e${k}`} rad={0.03} p={[k * 0.14, 0.62, 0.08]} m={mane} />)}
        {[-1, 1].map((k) => <Ball key={`y${k}`} rad={0.022} p={[k * 0.07, 0.53, 0.225]} m={mane} />)}
      </group>
    );
  }
  function GGriffin({ m, mane }) {
    return (
      <group>
        <GLion m={m} mane={mane} />
        {[-1, 1].map((k) => <Box key={k} s={[0.03, 0.3, 0.3]} p={[k * 0.2, 0.48, -0.14]} r={[0.25, 0, k * 0.5]} m={m} />)}
        <mesh position={[0, 0.46, 0.3]} rotation={[Math.PI / 2, 0, 0]} material={m}><coneGeometry args={[0.045, 0.14, 8]} /></mesh>
      </group>
    );
  }
  function GGoddess({ m, tm }) {
    return (
      <group>
        <Box s={[0.34, 0.1, 0.26]} p={[0, 0.05, 0]} m={m} />
        <Box s={[0.22, 0.32, 0.12]} p={[0, 0.26, 0]} m={m} />
        <Ball rad={0.075} p={[0, 0.48, 0.02]} m={m} />
        <Ball rad={0.04} p={[0, 0.47, 0.1]} m={m} />
        <mesh position={[0, 0.6, 0.02]} material={tm}><coneGeometry args={[0.075, 0.15, 8]} /></mesh>
        {[-1, 1].map((k) => <Cyl key={k} rt={0.022} h={0.26} p={[k * 0.15, 0.36, 0.03]} r={[0, 0, k * 0.7]} m={m} seg={6} />)}
        {[-1, 1].map((k) => <Cyl key={`l${k}`} rt={0.022} h={0.2} p={[k * 0.13, 0.22, 0.1]} r={[0.9, 0, k * 0.2]} m={m} seg={6} />)}
      </group>
    );
  }

  function Guardians() {
    const M = useM();
    const stone = M.plain('#7a6a58', { roughness: 0.95 });
    const stoneB = M.plain('#74634f', { roughness: 0.95 });
    const brown = M.plain('#8a5a3a', { roughness: 0.95 });
    const stoneD = M.plain('#4a3c30', { roughness: 0.95 });
    const maneL = M.plain('#8a7258', { roughness: 0.95 });
    const ped = M.plain('#8a7a66', { roughness: 0.95 });
    const pedD = M.plain('#74664f', { roughness: 0.95 });
    const turban = M.plain('#e0d2a8', { roughness: 0.9 });
    const sc = [3.0, 2.5, 2.6, 2.7, 2.7];
    const rows = [0, 1, 2, 3, 4].map((L) => {
      const y = L * LH;
      const rim = L === 0 ? 1.1 : PW[L - 1] - PW[L];
      const dep = Math.min(0.95, rim - 0.12);
      const z = L === 0 ? FOOT - 0.25 : PW[L - 1] - rim / 2;
      return { L, y, dep, z };
    });
    return (
      <group>
        {rows.map(({ L, y, dep, z }) => [-1, 1].map((k) => (
          <group key={`${L}${k}`} position={[k * 2.3, y, z]}>
            {/* two-step stone pedestal, 0.3 each */}
            <Box s={[1.5, 0.3, dep]} p={[0, 0.15, 0]} m={ped} />
            <Box s={[1.2, 0.3, dep * 0.82]} p={[0, 0.45, 0]} m={pedD} />
            <group position={[0, 0.6, 0]} scale={sc[L] * (dep < 0.8 ? 0.9 : 1)}>
              {L === 0 && <group scale={0.95}><GWrestler m={brown} tm={turban} dk={stoneD} /></group>}
              {L === 1 && <GElephant m={stone} dk={stoneD} />}
              {L === 2 && <GLion m={stone} mane={maneL} />}
              {L === 3 && <GGriffin m={stoneB} mane={maneL} />}
              {L === 4 && <GGoddess m={stone} tm={stoneD} />}
            </group>
          </group>
        )))}
      </group>
    );
  }

  /* ---------- plinth + stair ---------- */
  function PlinthStack() {
    const M = useM();
    const brick = (w, ry) => M.mat('brick', w / 0.42, ry * 3.2, { color: PLBRICK });
    const lipM = M.mat('herring', 9, 9, { color: '#d09478' });
    const stairM = M.plain('#6e5f52', { roughness: 0.95, emissive: '#2a1f18', emissiveIntensity: 0.08 });
    const stairGeo = useMemo(() => {
      const pts = [[FOOT, 0]];
      let z = FOOT; let y = 0;
      for (let L = 0; L < 5; L += 1) {
        const run = L === 0 ? FOOT - PW[0] : PW[L - 1] - PW[L];
        const n = STEPS[L]; const t = run / n; const h = LH / n;
        for (let j = 0; j < n; j += 1) { y += h; pts.push([z, y]); z -= t; pts.push([z, y]); }
      }
      pts.push([PW[4] - 0.4, y], [PW[4] - 0.4, 0]);
      const sh = new THREE.Shape(pts.map(([a, b]) => new THREE.Vector2(a, b)));
      const g = new THREE.ExtrudeGeometry(sh, { depth: SW, bevelEnabled: false });
      g.translate(0, 0, -SW / 2); g.rotateY(-Math.PI / 2);
      return g;
    }, []);
    return (
      <group>
        <Box s={[PW[0] * 2 + 0.7, 0.14, PW[0] * 2 + 0.7]} p={[0, 0.07, 0]} m={M.mat('granite', 8, 8, { color: '#b5a595' })} cast={false} />
        {PW.map((hw, L) => (
          <group key={L}>
            <Box s={[hw * 2, LH, hw * 2]} p={[0, L * LH + LH / 2, 0]} m={brick(hw * 2, 1.15)} />
            <Box s={[hw * 2 + 0.16, 0.1, hw * 2 + 0.16]} p={[0, (L + 1) * LH - 0.05, 0]} m={lipM} />
            <Box s={[hw * 2 + 0.08, 0.08, hw * 2 + 0.08]} p={[0, L * LH + 0.2, 0]} m={lipM} cast={false} />
          </group>
        ))}
        <mesh geometry={stairGeo} material={stairM} castShadow receiveShadow />
        {[0, 1, 2, 3, 4].map((L) => [-1, 1].map((k) => {
          const z0 = PW[L]; const z1 = L === 0 ? FOOT : PW[L - 1]; const hh = (L + 1) * LH + 0.12;
          return <Box key={`ch${L}${k}`} s={[0.34, hh, z1 - z0]} p={[k * (SW / 2 + 0.17), hh / 2, (z0 + z1) / 2]} m={brick(1.2, 1.0)} />;
        }))}
        {/* worn stair cheeks */}
        {[-1, 1].map((k) => <Box key={k} s={[0.08, 0.3, FOOT - PW[4]]} p={[k * (SW / 2 + 0.04), 0.3, (FOOT + PW[4]) / 2]} m={M.mat('granite', 1, 1, { color: '#a99a8a' })} cast={false} />)}
      </group>
    );
  }

  /* ---------- Ganesh corner shrines ---------- */
  function Shrine({ p, r }) {
    const M = useM();
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[0.62, 0.7, 0.62]} p={[0, 0.35, 0]} m={M.mat('brick', 1.5, 1.5, { color: BRICK, emissive: '#2a140c', emissiveIntensity: 0.03 })} />
        <Box s={[0.26, 0.4, 0.04]} p={[0, 0.26, 0.32]} m={M.plain(TIMBER_D)} cast={false} />
        <Roof w={0.95} d={0.95} h={0.4} y={0.7} m={M.mat('roof', 0.8, 0.8, { color: TILE })} sag={1.3} lift={0.12} fascia={false} />
        <Cyl rt={0.02} rb={0.04} h={0.2} p={[0, 1.12, 0]} m={M.gold} seg={8} />
      </group>
    );
  }

  /* ---------- the five-roof tower ---------- */
  const LIFT = 0.3;
  function Tower() {
    const M = useM();
    const dk = M.plain(TIMBER_D, { roughness: 0.8 });
    const wood = M.plain(TIMBER, { roughness: 0.8 });
    const brick = (w, h) => M.mat('brick', w / 0.9, h / 0.8, { color: '#a85840' });
    const sm = M.plain(STRUTC, { roughness: 0.8 });
    const gold = M.gold;
    const glow = M.plain('#2a1608', { roughness: 0.8, emissive: '#ff9a30', emissiveIntensity: 0.3 });
    const grass = [M.plain('#6b6a35', { roughness: 1 }), M.plain('#7a7a40', { roughness: 1 }), M.plain('#6b7a3a', { roughness: 1 })];
    const roofM = [0, 1, 2, 3, 4].map((k) => M.mat('roof', 2.6, 2.6, { color: ['#b0734f', '#b47753', '#b87b56', '#bc7f58', '#c0835a'][k], emissive: '#2a140c', emissiveIntensity: 0.04 }));
    const DROP = [1.3, 1.3, 1.1, 0.95, 0.85];
    const els = [];

    /* storey 1: red brick cella inside an open timber veranda */
    els.push(<Box key="cella" s={[3.5, 1.95, 3.5]} p={[0, TOP + 0.97, 0]} m={brick(3.5, 1.95)} />);
    els.push(<Box key="cellaband" s={[3.6, 0.14, 3.6]} p={[0, TOP + 1.95, 0]} m={wood} cast={false} />);
    els.push(<Box key="door" s={[0.95, 1.35, 0.08]} p={[0, TOP + 0.72, 1.76]} m={dk} cast={false} />);
    els.push(<Box key="doorf" s={[1.2, 1.5, 0.06]} p={[0, TOP + 0.77, 1.74]} m={wood} cast={false} />);
    els.push(<mesh key="torana" position={[0, TOP + 1.5, 1.8]} material={gold}><torusGeometry args={[0.55, 0.045, 8, 20, Math.PI]} /></mesh>);
    [[-1, 0], [1, 0], [0, -1]].forEach(([sx, sz], i) => {
      const x = sx * 1.77; const z = sz * 1.77;
      els.push(<Box key={`cw${i}`} s={sx ? [0.06, 0.8, 0.55] : [0.55, 0.8, 0.06]} p={[x, TOP + 1.0, z]} m={dk} cast={false} />);
    });
    const colPos = [-2.75, -1.65, -0.55, 0.55, 1.65, 2.75];
    colPos.forEach((c, i) => {
      [[c, 2.75], [c, -2.75]].forEach(([x, z], j) => els.push(<Cyl key={`cc${i}${j}`} rt={0.075} rb={0.09} h={1.85} p={[x, TOP + 1.0, z]} m={wood} seg={8} />));
      if (i > 0 && i < 5) [[2.75, c], [-2.75, c]].forEach(([x, z], j) => els.push(<Cyl key={`cd${i}${j}`} rt={0.075} rb={0.09} h={1.85} p={[x, TOP + 1.0, z]} m={wood} seg={8} />));
    });
    colPos.forEach((c, i) => [[c, 2.75, 0], [c, -2.75, Math.PI]].forEach(([x, z, r], j) => els.push(<Box key={`br${i}${j}`} s={[0.1, 0.4, 0.5]} p={[x, TOP + 1.7, z + (j ? -0.2 : 0.2)]} r={[j ? -0.7 : 0.7, 0, 0]} m={sm} cast={false} />)));
    els.push(<Box key="vb1" s={[5.9, 0.2, 0.2]} p={[0, TOP + 1.97, 2.75]} m={dk} />);
    els.push(<Box key="vb2" s={[5.9, 0.2, 0.2]} p={[0, TOP + 1.97, -2.75]} m={dk} />);
    els.push(<Box key="vb3" s={[0.2, 0.2, 5.9]} p={[2.75, TOP + 1.97, 0]} m={dk} />);
    els.push(<Box key="vb4" s={[0.2, 0.2, 5.9]} p={[-2.75, TOP + 1.97, 0]} m={dk} />);
    [-1, 1].forEach((t) => els.push(<Box key={`cwin${t}`} s={[0.5, 0.6, 0.05]} p={[t * 1.1, TOP + 1.2, 1.78]} m={M.plain('#ffcf8a', { emissive: '#ff9a30', emissiveIntensity: 0.9 })} cast={false} />));
    els.push(<Box key="vr" s={[5.9, 0.08, 0.08]} p={[0, TOP + 0.55, 2.75]} m={wood} cast={false} />);

    /* storeys 2..5: brick wall with a dark timber upper band and a lit carved window on each face */
    for (let k = 1; k < 5; k += 1) {
      const w = HALF[k] * 2; const h = WALLH[k] + 0.08;
      const yc = BASE[k] - 0.08 + h / 2;
      els.push(<Box key={`w${k}`} s={[w, h, w]} p={[0, yc, 0]} m={brick(w, h)} />);
      els.push(<Box key={`wb${k}`} s={[w + 0.08, h * 0.25, w + 0.08]} p={[0, E[k] - h * 0.125 + 0.04, 0]} m={wood} cast={false} />);
      [[0, 1, 0], [0, -1, Math.PI], [1, 0, Math.PI / 2], [-1, 0, -Math.PI / 2]].forEach(([sx, sz, r], i) => (
        els.push(<Box key={`win${k}${i}`} s={[w * 0.44, h * 0.4, 0.05]} p={[sx * (HALF[k] + 0.02), BASE[k] + h * 0.32, sz * (HALF[k] + 0.02)]} r={[0, r, 0]} m={i === 0 ? glow : dk} cast={false} />)
      ));
    }

    /* roofs, under-slabs, double fascia, struts, bells, grass */
    for (let k = 0; k < 5; k += 1) {
      const w = RW[k]; const hw = w / 2; const e = E[k];
      els.push(<Roof key={`r${k}`} w={w} d={w} h={RH[k]} y={e} m={roofM[k]} sag={SAG} lift={LIFT} fascia={false} />);
      els.push(<Box key={`us${k}`} s={[w - 0.06, 0.12, w - 0.06]} p={[0, e - 0.07, 0]} m={dk} cast={false} />);
      [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([sx, sz], i) => {
        els.push(<Box key={`fa${k}${i}`} s={sx ? [0.14, 0.28, w + 0.06] : [w + 0.06, 0.28, 0.14]} p={[sx * hw, e - 0.04, sz * hw]} m={sm} cast={false} />);
        els.push(<Box key={`fb${k}${i}`} s={sx ? [0.12, 0.18, w * 0.9] : [w * 0.9, 0.18, 0.12]} p={[sx * hw * 0.92, e - 0.3, sz * hw * 0.92]} m={sm} cast={false} />);
      });
      const n = [14, 12, 11, 10, 9][k];
      els.push(<Struts key={`st${k}`} bx={HALF[k]} bz={HALF[k]} hx={hw} hz={hw} e={e} drop={DROP[k]} nx={n} nz={n} m={sm} th={k < 2 ? 0.22 : 0.15} />);
      // corner bells (gilded)
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz], i) => {
        els.push(<Ball key={`bc${k}${i}`} rad={0.07} p={[sx * (hw - 0.02), e + LIFT - 0.16, sz * (hw - 0.02)]} sc={[1, 1.2, 1]} m={gold} />);
      });
      // a thin straggly fringe of grass along the eave edge of the lower roofs
      if (k < 3) {
        const r = rng(11 + k); const cnt = [24, 22, 8][k];
        for (let i = 0; i < cnt; i += 1) {
          const side = i % 4; const u = (r() - 0.5) * 1.6 * hw; const inset = hw * (0.92 + r() * 0.08);
          const x = side === 0 ? u : side === 1 ? -u : side === 2 ? inset : -inset;
          const z = side === 0 ? inset : side === 1 ? -inset : side === 2 ? u : -u;
          els.push(<Ball key={`g${k}${i}`} rad={k < 2 ? 0.1 : 0.07} sc={[1.7, 0.6, 1.3]} p={[x, e + LIFT + 0.03 + r() * 0.03, z]} m={grass[i % 3]} />);
        }
      }
    }

    /* gilded pinnacle (gajura): bell base, stacked discs, vase and spire, stretched 1.3x */
    const pin = [];
    pin.push(<Cyl key="pb" rt={0.2} rb={0.42} h={0.3} p={[0, 0.15, 0]} m={gold} seg={16} />);
    pin.push(<Ball key="pbb" rad={0.3} sc={[1, 0.8, 1]} p={[0, 0.4, 0]} m={gold} />);
    [0.52, 0.45, 0.38, 0.31, 0.24].forEach((r, i) => pin.push(<Cyl key={`pd${i}`} rt={r * 0.85} rb={r} h={0.06} p={[0, 0.62 + i * 0.17, 0]} m={gold} seg={20} />));
    pin.push(<Ball key="pv" rad={0.14} sc={[1, 1.3, 1]} p={[0, 1.62, 0]} m={gold} />);
    pin.push(<mesh key="psp" position={[0, 2.0, 0]} material={gold} castShadow><coneGeometry args={[0.07, 0.7, 10]} /></mesh>);
    pin.push(<Ball key="pt" rad={0.045} p={[0, 2.4, 0]} m={gold} />);
    els.push(<group key="pinn" position={[0, APEX - 0.05, 0]} scale={[1, 1.3, 1]}>{pin}</group>);
    return <group>{els}</group>;
  }

  /* ---------- MAIN ---------- */
  function NyatapolaMain() {
    const M = useM();
    const corners = [[-1, -1, Math.PI], [1, -1, Math.PI], [-1, 1, 0], [1, 1, 0]];
    const lampM = M.plain('#ffd27a', { emissive: '#ff9a30', emissiveIntensity: 1.1 });
    const stand = M.plain('#2a1a10', { roughness: 0.8 });
    return (
      <group>
        <PlinthStack />
        <Guardians />
        <Tower />
        {corners.map(([sx, sz, r], i) => <group key={i} position={[sx * 2.88, TOP, sz * 2.88]} scale={0.82}><Shrine p={[0, 0, 0]} r={r} /></group>)}
        {/* oil lamps on the front corners of every terrace */}
        {[0, 1, 2, 3, 4].map((L) => [-1, 1].map((k) => (
          <group key={`lp${L}${k}`} position={[k * (PW[L] - 0.25), (L + 1) * LH, PW[L] - 0.25]}>
            <Cyl rt={0.05} rb={0.07} h={0.3} p={[0, 0.15, 0]} m={stand} seg={6} />
            <Ball rad={0.1} sc={[1, 1.2, 1]} p={[0, 0.38, 0]} m={lampM} />
          </group>
        )))}
        <pointLight position={[0, TOP + 1.2, 2.3]} intensity={1.5} distance={9} color="#ffb870" />
        <pointLight position={[0, 1.6, FOOT + 1]} intensity={1.5} distance={11} color="#ffb870" />
        <pointLight position={[0, 3.2, FOOT - 3]} intensity={1.2} distance={9} color="#ffc47a" />
        <Frame s={[18, FH + 1, 20]} p={[0, FH / 2, 2.5]} />
      </group>
    );
  }

  /* ================= ENVIRONMENT: TAUMADHI SQUARE ================= */
  const matCache = new Map();
  /* facade texture: open timber shopfront arcade below, then upper floors with one of four window styles */
  function facadeMat(w, H, st, seed, tint) {
    const key = `${w}|${H}|${st}|${seed}|${tint}`;
    if (matCache.has(key)) return matCache.get(key);
    const W = Math.max(128, Math.round(w * 70)); const Hh = Math.round(H * 70);
    const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = Hh; return c; };
    const c1 = mk(); const c2 = mk(); const g = c1.getContext('2d'); const e = c2.getContext('2d');
    const r = rng(seed * 7 + 3);
    const style = seed % 4;
    g.fillStyle = tint; g.fillRect(0, 0, W, Hh);
    g.fillStyle = 'rgba(40,14,8,0.34)';
    for (let y = 0, row = 0; y < Hh; y += 7, row += 1) { g.fillRect(0, y, W, 1); for (let x = (row % 2) * 9; x < W; x += 18) g.fillRect(x, y, 1, 7); }
    e.fillStyle = '#000'; e.fillRect(0, 0, W, Hh);
    const fh = Hh / st;
    const gy = Hh - fh;
    // ground floor: open shopfront arcade, 3 to 5 bays, some bays shuttered
    const bays = 3 + (seed % 3);
    g.fillStyle = '#1e1109'; g.fillRect(W * 0.04, gy + fh * 0.3, W * 0.92, fh * 0.7);
    for (let p = 0; p < bays; p += 1) {
      const bx = W * 0.04 + (W * 0.92 * p) / bays; const bw = (W * 0.92) / bays;
      if ((p + seed) % 3 === 0) { g.fillStyle = '#5a3a22'; g.fillRect(bx + 4, gy + fh * 0.34, bw - 8, fh * 0.62); g.fillStyle = '#2c1a0e'; for (let s = 0; s < 6; s += 1) g.fillRect(bx + 4, gy + fh * (0.4 + s * 0.1), bw - 8, 2); } else { e.fillStyle = '#c98a3a'; if (r() < 0.5) e.fillRect(bx + bw * 0.3, gy + fh * 0.55, bw * 0.4, fh * 0.28); }
    }
    g.fillStyle = '#4a2d1a';
    for (let p = 0; p <= bays; p += 1) g.fillRect(W * 0.04 + (W * 0.92 * p) / bays - 4, gy + fh * 0.3, 8, fh * 0.7);
    g.fillStyle = '#2e1d14'; g.fillRect(0, gy + fh * 0.22, W, fh * 0.1);
    // upper floors
    for (let f = 0; f < st - 1; f += 1) {
      const y0 = f * fh;
      g.fillStyle = '#2e1d14'; g.fillRect(0, y0 + fh - 6, W, 6);
      
      if (style === 1) {
        // three narrow lattice windows
        for (let i = 0; i < 3; i += 1) {
          const ww = W * 0.2; const x0 = W * (0.1 + i * 0.3); const wy = y0 + fh * 0.2; const wh = fh * 0.6;
          g.fillStyle = '#2e1d14'; g.fillRect(x0 - 5, wy - 5, ww + 10, wh + 10);
          g.fillStyle = '#150b06'; g.fillRect(x0, wy, ww, wh);
          g.strokeStyle = '#7a5230'; g.lineWidth = 2;
          for (let b = 1; b < 4; b += 1) { g.beginPath(); g.moveTo(x0 + (ww * b) / 4, wy); g.lineTo(x0 + (ww * b) / 4, wy + wh); g.stroke(); }
          if (r() < 0.2) { e.fillStyle = '#ffb35a'; e.fillRect(x0, wy, ww, wh); }
        }
      } else if (style === 2) {
        // one broad projecting balcony window with a carved sill
        const ww = W * 0.72; const x0 = W * 0.14; const wy = y0 + fh * 0.18; const wh = fh * 0.55;
        g.fillStyle = '#3a2415'; g.fillRect(x0 - 8, wy - 8, ww + 16, wh + 22);
        g.fillStyle = '#150b06'; g.fillRect(x0, wy, ww, wh);
        g.strokeStyle = '#8a5a30'; g.lineWidth = 3;
        for (let b = 1; b < 9; b += 1) { g.beginPath(); g.moveTo(x0 + (ww * b) / 9, wy); g.lineTo(x0 + (ww * b) / 9, wy + wh); g.stroke(); }
        g.fillStyle = '#6a4426'; g.fillRect(x0 - 8, wy + wh + 4, ww + 16, 8);
        if (r() < 0.3) { e.fillStyle = '#ffb35a'; e.fillRect(x0, wy, ww, wh); }
      } else {
        const cols = w > 4.1 ? 2 : 1;
        for (let i = 0; i < cols; i += 1) {
          const cw = W / cols; const ww = cw * (style === 3 ? 0.3 : 0.5); const x0 = i * cw + (cw - ww) / 2; const wy = y0 + fh * 0.14; const wh = fh * (style === 3 ? 0.5 : 0.58);
          g.fillStyle = '#2e1d14'; g.fillRect(x0 - 7, wy - 7, ww + 14, wh + 14);
          g.fillStyle = '#150b06'; g.fillRect(x0, wy, ww, wh);
          g.strokeStyle = '#6a4426'; g.lineWidth = 3;
          for (let b = 1; b < 7; b += 1) { g.beginPath(); g.moveTo(x0 + (ww * b) / 7, wy); g.lineTo(x0 + (ww * b) / 7, wy + wh); g.stroke(); }
          for (let b = 1; b < 3; b += 1) { g.beginPath(); g.moveTo(x0, wy + (wh * b) / 3); g.lineTo(x0 + ww, wy + (wh * b) / 3); g.stroke(); }
          if (r() < 0.2) { e.fillStyle = '#ffb35a'; e.fillRect(x0, wy, ww, wh); }
        }
      }
    }
    g.fillStyle = '#3b2415'; g.fillRect(0, 0, W, 5);
    const t = new THREE.CanvasTexture(c1); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    const te = new THREE.CanvasTexture(c2); te.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.MeshStandardMaterial({ map: t, emissiveMap: te, emissive: '#ffffff', emissiveIntensity: 0.2, roughness: 0.9 });
    matCache.set(key, m); return m;
  }

  const TINTS = ['#8b4a38', '#94503c', '#864636', '#9a5640', '#8f4c3a', '#a0583f'];
  /* gable roof: triangular prism, ridge along local z so the gable end faces the street */
  function GableRoof({ w, d, h, y, m }) {
    const geo = useMemo(() => {
      const sh = new THREE.Shape([new THREE.Vector2(-w / 2, 0), new THREE.Vector2(w / 2, 0), new THREE.Vector2(0.05, h), new THREE.Vector2(-0.05, h)]);
      const g = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false });
      g.translate(0, 0, -d / 2);
      return g;
    }, [w, d, h]);
    return <mesh geometry={geo} material={m} position={[0, y, 0]} castShadow />;
  }
  function RHouse({ p, r = 0, w = 3.6, d = 3.8, st = 3, seed = 1, lite = false }) {
    const M = useM();
    const sh = 1.25 + (seed % 5) * 0.06; const H = st * sh;
    const tint = TINTS[seed % TINTS.length];
    const front = useMemo(() => (lite ? null : facadeMat(Math.round(w * 4) / 4, H, st, seed % 12, tint)), [w, H, st, seed, tint, lite]);
    const side = M.mat('brick', w / 1.4, st * 1.1, { color: '#8a4a38' });
    const roofT = M.mat('roof', 1.4, 1.4, { color: ['#9c5638', '#a45d3e', '#945032'][seed % 3] });
    const mats = lite ? side : [side, side, side, side, front, side];
    const kind = seed % 4; // 0 gable end to street, 1 hip, 2 flat parapet, 3 steep hip
    const dk = M.plain('#2a180c', { roughness: 0.9 });
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[w, H, d]} p={[0, H / 2, 0]} m={mats} cast={false} />
        {kind === 0 && <GableRoof w={w + 0.5} d={d + 0.8} h={1.0 + (seed % 3) * 0.15} y={H} m={roofT} />}
        {kind === 1 && <Roof w={w + 0.7} d={d + 0.7} h={0.8 + (seed % 4) * 0.12} y={H} m={roofT} sag={1.15} lift={0.08} fascia={false} />}
        {kind === 3 && <Roof w={w + 0.7} d={d + 0.7} h={1.25} y={H} m={roofT} sag={1.15} lift={0.08} fascia={false} />}
        {kind === 2 && (
          <group>
            <Box s={[w + 0.14, 0.3, d + 0.14]} p={[0, H + 0.15, 0]} m={dk} cast={false} />
            <Box s={[w * 0.6, 0.3, d * 0.5]} p={[-w * 0.1, H + 0.45, -d * 0.1]} m={side} cast={false} />
          </group>
        )}
        {!lite && st > 2 && seed % 3 === 0 && <Box s={[w * 0.55, 0.9, 0.36]} p={[(seed % 4 - 1.5) * 0.25, sh * 1.5, d / 2 + 0.17]} m={M.plain('#3a2415', { roughness: 0.85 })} cast={false} />}
      </group>
    );
  }

  function rowItems({ axis, from, to, fixed, rot, seed, minS = 2, maxS = 4, skip, jitter = 0 }) {
    const r = rng(seed); const items = [];
    let u = from; let i = 0;
    while (u < to) {
      const w = 3.0 + r() * 2.2;
      const c = u + w / 2;
      if (!skip || !skip(c)) {
        const st = minS + Math.floor(r() * (maxS - minS + 1));
        const off = (r() - 0.5) * 1.4;
        items.push({ p: axis === 'z' ? [fixed + off, 0, c] : [c, 0, fixed + off], r: rot + (r() - 0.5) * jitter * 2, w, st, seed: seed + i * 3 });
      }
      u += w; i += 1;
    }
    return items;
  }

  function HouseRows() {
    const items = useMemo(() => [
      // west row (left of the temple, slightly skewed), alley at z 3..6.5, ends before the open south side
      ...rowItems({ axis: 'z', from: -17.5, to: 20, fixed: -21, rot: Math.PI / 2, seed: 2, jitter: 0.07, skip: (c) => (c > 3 && c < 6.5) }),
      // north row behind the temple, with an alley at x -9..-5.5 and a north-east gap at x 24..28
      ...rowItems({ axis: 'x', from: -22, to: 44, fixed: -20.5, rot: 0, seed: 40, skip: (c) => (c > -9 && c < -5.5) || (c > 34 && c < 38) }),
      // east row, behind Bhairabnath, with an alley at z -14..-10; open towards the south
      ...rowItems({ axis: 'z', from: -17.5, to: 32, fixed: 40, rot: -Math.PI / 2, seed: 80, jitter: 0.04, skip: (c) => (c > -14 && c < -10) }),
    ], []);
    const back = useMemo(() => [
      ...rowItems({ axis: 'z', from: -17.5, to: 20, fixed: -27, rot: Math.PI / 2, seed: 5, minS: 3, maxS: 4 }),
      ...rowItems({ axis: 'x', from: -22, to: 50, fixed: -26.5, rot: 0, seed: 45, minS: 3, maxS: 4 }),
      ...rowItems({ axis: 'z', from: -17.5, to: 32, fixed: 46, rot: -Math.PI / 2, seed: 85, minS: 3, maxS: 4 }),
    ], []);
    return (
      <group>
        {items.map((it, i) => <RHouse key={`h${i}`} p={it.p} r={it.r} w={it.w} st={it.st} seed={it.seed} />)}
        {back.map((it, i) => <RHouse key={`b${i}`} p={it.p} r={it.r} w={it.w} st={it.st} seed={it.seed} lite />)}
      </group>
    );
  }

  /* Bhairabnath: three-storey rectangular temple on the east side of the square, facing west into it.
     Brick ground storey, cream-plastered upper facade, big carved timber window. */
  function Bhairabnath() {
    const M = useM();
    const dk = M.plain(TIMBER_D, { roughness: 0.8 });
    const wood = M.plain('#5a3418', { roughness: 0.8 });
    const gold = M.gold;
    const brick = (w, h) => M.mat('brick', w / 1.2, h / 1.0, { color: '#a85a42' });
    const tile = M.mat('roof', 1.4, 1.4, { color: '#9c5237' });
    const cream = M.mat('plaster', 2, 1, { color: '#ecdcb6' });
    const lamp = M.plain('#ffd27a', { emissive: '#ff9a30', emissiveIntensity: 1.2 });
    const lv = [
      { w: 9.0, d: 6.0, y0: 0.3, y1: 2.2, rw: 11.6, rd: 8.0, rh: 1.1 },
      { w: 7.4, d: 4.8, y0: 2.45, y1: 3.95, rw: 9.6, rd: 6.3, rh: 1.0 },
      { w: 5.0, d: 3.2, y0: 4.28, y1: 5.4, rw: 6.7, rd: 4.3, rh: 0.9 },
    ];
    const els = [];
    els.push(<Box key="pl" s={[9.8, 0.3, 6.8]} p={[0, 0.15, 0]} m={M.mat('granite', 4, 3, { color: '#d2c4b6' })} cast={false} />);
    lv.forEach((l, k) => {
      const h = l.y1 - l.y0;
      els.push(<Box key={`w${k}`} s={[l.w, h, l.d]} p={[0, l.y0 + h / 2, 0]} m={k === 0 ? brick(l.w, h) : cream} />);
      els.push(<Roof key={`r${k}`} w={l.rw} d={l.rd} h={l.rh} y={l.y1} m={tile} sag={1.2} lift={0.18} fascia={false} />);
      els.push(<Box key={`us${k}`} s={[l.rw - 0.06, 0.1, l.rd - 0.06]} p={[0, l.y1 - 0.07, 0]} m={dk} cast={false} />);
      els.push(<Box key={`fa1${k}`} s={[l.rw + 0.06, 0.16, 0.1]} p={[0, l.y1 - 0.02, l.rd / 2]} m={dk} cast={false} />);
      els.push(<Box key={`fa2${k}`} s={[l.rw + 0.06, 0.16, 0.1]} p={[0, l.y1 - 0.02, -l.rd / 2]} m={dk} cast={false} />);
      els.push(<Box key={`fa3${k}`} s={[0.1, 0.16, l.rd + 0.06]} p={[l.rw / 2, l.y1 - 0.02, 0]} m={dk} cast={false} />);
      els.push(<Box key={`fa4${k}`} s={[0.1, 0.16, l.rd + 0.06]} p={[-l.rw / 2, l.y1 - 0.02, 0]} m={dk} cast={false} />);
      els.push(<Struts key={`s${k}`} bx={l.w / 2} bz={l.d / 2} hx={l.rw / 2} hz={l.rd / 2} e={l.y1} drop={0.75} nx={[7, 6, 4][k]} nz={[5, 4, 3][k]} m={wood} th={0.1} />);
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz], i) => els.push(<Ball key={`b${k}${i}`} rad={0.075} p={[sx * (l.rw / 2 - 0.02), l.y1 + 0.2 * l.rh - 0.14, sz * (l.rd / 2 - 0.02)]} sc={[1, 1.2, 1]} m={gold} />));
    });
    // ground floor: big central door and lattice windows
    els.push(<Box key="door" s={[1.5, 1.55, 0.1]} p={[0, 1.08, 3.02]} m={dk} cast={false} />);
    els.push(<Box key="doorf" s={[1.8, 1.7, 0.08]} p={[0, 1.15, 3.0]} m={wood} cast={false} />);
    [-3.1, -1.9, 1.9, 3.1].forEach((x, i) => els.push(<Box key={`gw${i}`} s={[0.7, 0.8, 0.06]} p={[x, 1.35, 3.03]} m={dk} cast={false} />));
    // storey 2: wide carved timber window (dark frame, lattice, gilded top cornice only)
    els.push(<Box key="w2f" s={[5.0, 1.38, 0.14]} p={[0, 3.2, 2.45]} m={wood} cast={false} />);
    els.push(<Box key="w2d" s={[4.6, 1.08, 0.16]} p={[0, 3.2, 2.46]} m={dk} cast={false} />);
    [-1.8, -1.2, -0.6, 0, 0.6, 1.2, 1.8].forEach((x, i) => els.push(<Box key={`m${i}`} s={[0.07, 1.08, 0.18]} p={[x, 3.2, 2.47]} m={wood} cast={false} />));
    els.push(<Box key="w2c" s={[5.2, 0.12, 0.2]} p={[0, 3.95, 2.46]} m={gold} cast={false} />);
    [-3.1, 3.1].forEach((x, i) => els.push(<Box key={`s2${i}`} s={[0.8, 0.8, 0.06]} p={[x, 3.2, 2.42]} m={wood} cast={false} />));
    els.push(<Box key="w3f" s={[2.2, 0.9, 0.12]} p={[0, 4.85, 1.65]} m={wood} cast={false} />);
    els.push(<Box key="w3d" s={[1.8, 0.62, 0.14]} p={[0, 4.85, 1.66]} m={dk} cast={false} />);
    els.push(<Box key="bal" s={[3.9, 0.1, 0.5]} p={[0, 2.65, 2.7]} m={dk} cast={false} />);
    els.push(<Gajur key="gj" y={6.3} s={1.3} />);
    els.push(<Ball key="l1" rad={0.08} sc={[1, 0.6, 1]} p={[-1.0, 0.4, 3.9]} m={lamp} />);
    els.push(<Ball key="l2" rad={0.08} sc={[1, 0.6, 1]} p={[1.0, 0.4, 3.9]} m={lamp} />);
    return <group position={[19.5, 0, 9]} rotation={[0, -Math.PI / 2, 0]} scale={1.1}>{els}<pointLight position={[0, 1.5, 4.5]} intensity={1.2} distance={9} color="#ffb870" /></group>;
  }

  function Person({ p, c, s = 1 }) {
    const M = useM();
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.09} rb={0.12} h={0.5} p={[0, 0.3, 0]} m={M.plain(c, { roughness: 0.9 })} seg={8} />
        <Ball rad={0.085} p={[0, 0.66, 0]} m={M.plain('#c8956d')} />
      </group>
    );
  }

  function DancePlatform({ p }) {
    const M = useM();
    return (
      <group position={p}>
        <Box s={[7.2, 0.9, 3.4]} p={[0, 0.45, 0]} m={M.mat('brick', 5, 0.8, { color: '#a8503a' })} />
        <Box s={[7.4, 0.1, 3.6]} p={[0, 0.9, 0]} m={M.mat('herring', 4, 2, { color: '#c08468' })} />
        {[0.2, 0.45].map((h, i) => <Box key={i} s={[2.2, 0.22, 0.4]} p={[0, h - 0.1, 1.9 + (1 - i) * 0.35 - 0.2]} m={M.mat('granite', 1, 1, { color: '#b3a393' })} />)}
      </group>
    );
  }

  /* distant Himalaya: a low, wide, jagged range; dark slate base with snow over the upper 40 percent */
  function Himal() {
    const M = useM();
    const rock = M.plain('#5a6c90', { roughness: 1 });
    const rockB = M.plain('#66789c', { roughness: 1 });
    const snow = M.plain('#f4f6fa', { roughness: 0.8 });
    const haze = M.plain('#9fae9a', { roughness: 1 });
    const peaks = useMemo(() => {
      const r = rng(77); const out = [];
      for (let x = -260; x <= 260; x += 11) {
        const env = 1 - Math.abs(x) / 330;
        const h = (7 + r() * 9) * (0.7 + env * 0.5) + (Math.abs(x - 20) < 60 ? 6 : 0);
        out.push([x + (r() - 0.5) * 8, -96 - r() * 14, h * 1.4, h, r() * 6]);
      }
      return out;
    }, []);
    return (
      <group>
        {peaks.map(([x, z, r, h, rot], i) => (
          <group key={i} position={[x, -1, z]} rotation={[0, rot, 0]} scale={[1.7, 1, 0.9]}>
            <mesh position={[0, h / 2, 0]} material={i % 2 ? rock : rockB}><coneGeometry args={[r, h, 5]} /></mesh>
            <mesh position={[0, h * 0.8, 0]} material={snow}><coneGeometry args={[r * 0.415, h * 0.4, 5]} /></mesh>
          </group>
        ))}
        {[[-120, -86, 18], [-40, -88, 16], [40, -86, 18], [120, -88, 16]].map(([x, z, r], i) => (
          <mesh key={`h${i}`} position={[x, -2.4, z]} scale={[3, 0.08, 1]} material={haze}><sphereGeometry args={[r, 16, 8]} /></mesh>
        ))}
      </group>
    );
  }

  function NyatapolaEnv() {
    const M = useM();
    const extra = [[-3.4,0,11.5,'#d9a23a'],[3.8,0,12,'#2f6db5'],[-5,0,13.5,'#b8312f'],[5.2,0,14,'#e2b33c'],[0.8,0,15,'#2e8b57'],[-1.8,0,16,'#7a5a8a'],[7,0,11,'#c0392b'],[-7.5,0,11.5,'#2f6db5'],[2.6,0,18,'#b8312f'],[-4.2,0,17.5,'#2e8b57'],[6.2,0,17,'#d9a23a'],[-0.5,0,20,'#c0392b'],[9,0,19,'#2f6db5']];
    const people = [...extra, [-9, 0, 13, '#c0392b'], [-11, 0, 17, '#2f6db5'], [-6.5, 0, 19, '#e2b33c'], [10, 0, 15, '#2e8b57'], [8, 0, 21, '#7a5a8a'], [13, 0, 11, '#b8312f'], [-14, 0, 9, '#d9a23a'], [4.5, 0, 24, '#2f6db5'], [-3.4, 0, 26, '#c0392b']];
    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} receiveShadow material={M.plain('#9a6a50', { roughness: 1 })}><circleGeometry args={[300, 48]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[12, -0.01, 8]} receiveShadow material={M.mat('herring', 30, 27, { color: '#c08468', emissive: '#4a2a1c', emissiveIntensity: 0.04 })}><planeGeometry args={[88, 80]} /></mesh>
        <HouseRows />
        <Bhairabnath />
        <DancePlatform p={[-7, 0, 22]} />
        {people.map(([x, y, z, c], i) => <Person key={i} p={[x, y, z]} c={c} s={1.1} />)}
        {[[-17, 24], [-24, 17], [27, 24], [-26, 6], [-20, 29], [-26, 25], [-32, 14], [-33, 0], [-33, -12], [-31, -22], [-12, -33], [20, -33], [36, -30], [40, 28], [22, 30], [-30, 32]].map(([x, z], i) => <Tree key={`t${i}`} p={[x, 0, z]} s={1.0 + (i % 4) * 0.1} />)}
        {[[-24, 4.6], [-9.5, -23], [-4, -23.5], [38, -12]].map(([x, z], i) => <Shrine key={`sh${i}`} p={[x, 0, z]} r={i * 0.4} />)}
        {[[-14, 6], [15, 22], [-12, 24], [18, 6], [-18, -10], [4, -17], [22, -12]].map(([x, z], i) => (
          <group key={`lm${i}`} position={[x, 0, z]}><Cyl rt={0.05} rb={0.08} h={2.6} p={[0, 1.3, 0]} m={M.plain('#2a1a10')} seg={6} /><Ball rad={0.16} p={[0, 2.7, 0]} m={M.plain('#ffd27a', { emissive: '#ff9a30', emissiveIntensity: 1.0 })} /></group>
        ))}
        {/* square lamps for dusk */}
        <pointLight position={[-9, 3, 12]} intensity={1.3} distance={15} color="#ffb870" />
        <pointLight position={[11, 3, 14]} intensity={1.3} distance={15} color="#ffb870" />
        <Himal />
      </group>
    );
  }

  return { 'nyatapola-temple': { Main: NyatapolaMain, Env: NyatapolaEnv } };
}
