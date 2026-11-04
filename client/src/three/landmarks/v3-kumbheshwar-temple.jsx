// Kumbheshwar Temple (Kumbheshwor Mahadev), Patan. Slender free-standing five-roof Newar pagoda in red brick,
// low one-step plinth, walled sacred pond with a linga pavilion beside it, kneeling Nandi, a courtyard ringed by
// 3-4 storey red-brick Newar houses. Front = +z. Pond lies on the -x side [estimate]. No hill, no river.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Gajur, Tree, Nandi, Frame, THREE, useMemo } = K;

  /* ---------- dimensions ---------- */
  const SAG = 1.6;
  const PLH = 0.4;                          // single low plinth step
  const PHW = 2.9;                          // plinth half-width
  const RW = [6.4, 5.4, 4.55, 3.8, 3.1];    // roof widths, lowest first (each ~85% of the one below)
  const RH = [1.9, 1.65, 1.45, 1.25, 1.1];
  const WALLH = [2.1, 1.85, 1.75, 1.65, 1.55];
  const LIFT = 0.6;
  const HALF = [1.75, 1.4, 1.2, 1.02, 0.85]; // wall half-widths
  const E = [PLH + WALLH[0]];
  const BASE = [PLH];
  for (let k = 1; k < 5; k += 1) {
    const ratio = HALF[k] / (RW[k - 1] / 2);
    BASE[k] = E[k - 1] + RH[k - 1] * (1 - ratio) ** SAG;
    E[k] = BASE[k] + WALLH[k];
  }
  const APEX = E[4] + RH[4];

  const TIMBER_D = '#2e1b0d';
  const TIMBER = '#6a4025';
  const BRICK = '#cf7a60';
  const BRICK_U = '#d4694c';
  const OCHRE = '#b8622a';
  const ROOFC = '#8a837c';

  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const brickM = (M, w, h, c = BRICK) => M.mat('brick', w / 1.4, h / 1.2, { color: c, emissive: '#7a3a28', emissiveIntensity: 0.35 });

  /* ---------- carved raking timber struts under an eave ---------- */
  function Struts({ bx, bz, hx, hz, e, drop, nx, nz, m, th = 0.1 }) {
    const out = [];
    [1, -1].forEach((sz) => {
      const z1 = sz * (bz + 0.02); const z2 = sz * hz * 0.86; const y1 = e - drop; const y2 = e - 0.1;
      const len = Math.hypot(z2 - z1, y2 - y1); const ang = Math.atan2(z2 - z1, y2 - y1);
      for (let i = 0; i < nx; i += 1) {
        const x = ((i + 0.5) / nx - 0.5) * 2 * bx * 0.95;
        out.push(<Box key={`z${sz}${i}`} s={[th, len, th * 0.9]} p={[x, (y1 + y2) / 2, (z1 + z2) / 2]} r={[ang, 0, 0]} m={m} cast={false} />);
      }
    });
    [1, -1].forEach((sx) => {
      const x1 = sx * (bx + 0.02); const x2 = sx * hx * 0.86; const y1 = e - drop; const y2 = e - 0.1;
      const len = Math.hypot(x2 - x1, y2 - y1); const ang = -Math.atan2(x2 - x1, y2 - y1);
      for (let i = 0; i < nz; i += 1) {
        const z = ((i + 0.5) / nz - 0.5) * 2 * bz * 0.95;
        out.push(<Box key={`x${sx}${i}`} s={[th * 0.9, len, th]} p={[(x1 + x2) / 2, (y1 + y2) / 2, z]} r={[0, 0, ang]} m={m} cast={false} />);
      }
    });
    return <group>{out}</group>;
  }

  /* ---------- the five-roof tower ---------- */
  function Tower() {
    const M = useM();
    const dk = M.plain(TIMBER_D, { roughness: 0.8 });
    const wood = M.plain(TIMBER, { roughness: 0.8 });
    const roofM = M.plain('#615c57', { roughness: 0.55, metalness: 0.3 });
    const roofTop = M.plain('#706b65', { roughness: 0.55, metalness: 0.3 });
    const gold = M.gold;
    const els = [];

    /* plinth: one low square step */
    els.push(<Box key="pl" s={[PHW * 2, PLH, PHW * 2]} p={[0, PLH / 2, 0]} m={M.plain('#9a8a78', { roughness: 0.95 })} />);
    els.push(<Box key="pl2" s={[PHW * 2 + 0.3, 0.08, PHW * 2 + 0.3]} p={[0, 0.04, 0]} m={M.plain('#85766a', { roughness: 0.95 })} cast={false} />);

    /* ground storey: tall closed brick cella with a single central door */
    els.push(<Box key="w0" s={[HALF[0] * 2, WALLH[0], HALF[0] * 2]} p={[0, PLH + WALLH[0] / 2, 0]} m={brickM(M, HALF[0] * 2, WALLH[0])} />);
    els.push(<Box key="w0band" s={[HALF[0] * 2 + 0.1, 0.16, HALF[0] * 2 + 0.1]} p={[0, E[0] - 0.08, 0]} m={wood} cast={false} />);
    els.push(<Box key="w0base" s={[HALF[0] * 2 + 0.1, 0.18, HALF[0] * 2 + 0.1]} p={[0, PLH + 0.09, 0]} m={M.mat('granite', 3, 1, { color: '#a89888' })} cast={false} />);
    els.push(<Box key="door" s={[0.95, 1.5, 0.08]} p={[0, PLH + 0.75, HALF[0] + 0.02]} m={dk} cast={false} />);
    els.push(<Box key="doorf" s={[1.2, 1.65, 0.06]} p={[0, PLH + 0.83, HALF[0] + 0.0]} m={wood} cast={false} />);
    els.push(<Box key="doorl" s={[1.35, 0.14, 0.12]} p={[0, PLH + 1.7, HALF[0] + 0.04]} m={wood} cast={false} />);
    els.push(<mesh key="torana" position={[0, PLH + 1.55, HALF[0] + 0.07]} material={gold}><torusGeometry args={[0.5, 0.035, 8, 20, Math.PI]} /></mesh>);
    [[0, -1, Math.PI], [1, 0, Math.PI / 2], [-1, 0, -Math.PI / 2]].forEach(([sx, sz, r], i) => {
      els.push(<Box key={`w0w${i}`} s={[0.5, 0.65, 0.05]} p={[sx * (HALF[0] + 0.02), PLH + 1.3, sz * (HALF[0] + 0.02)]} r={[0, r, 0]} m={dk} cast={false} />);
    });

    /* storeys 2..5: narrow recessed brick wall bands with a dark timber course and a small latticed window per face */
    for (let k = 1; k < 5; k += 1) {
      const w = HALF[k] * 2; const h = WALLH[k] + 0.1;
      const yc = BASE[k] - 0.1 + h / 2;
      els.push(<Box key={`w${k}`} s={[w, h, w]} p={[0, yc, 0]} m={brickM(M, w, h, BRICK_U)} />);
      els.push(<Box key={`wb${k}`} s={[w + 0.03, h * 0.1, w + 0.03]} p={[0, E[k] - h * 0.05, 0]} m={wood} cast={false} />);
      els.push(<Box key={`wc${k}`} s={[w + 0.06, h * 0.06, w + 0.06]} p={[0, BASE[k] + h * 0.03, 0]} m={wood} cast={false} />);
      [[0, 1, 0], [0, -1, Math.PI], [1, 0, Math.PI / 2], [-1, 0, -Math.PI / 2]].forEach(([sx, sz, r], i) => {
        const o = HALF[k] + 0.02;
        const wy = BASE[k] + h * 0.5;
        const g = new Array(1).fill(0);
        els.push(<group key={`win${k}${i}`} position={[sx * o, wy, sz * o]} rotation={[0, r, 0]}>
          <Box s={[w * 0.25 + 0.14, h * 0.46 + 0.14, 0.04]} p={[0, 0, -0.01]} m={wood} cast={false} />
          <Box s={[w * 0.25, h * 0.46, 0.07]} p={[0, 0, 0.0]} m={dk} cast={false} />
          <Box s={[0.04, h * 0.46, 0.09]} p={[-w * 0.06, 0, 0]} m={wood} cast={false} />
          <Box s={[0.04, h * 0.46, 0.09]} p={[w * 0.06, 0, 0]} m={wood} cast={false} />
        </group>);
        if (g.length > 5) els.push(null);
      });
    }

    /* roofs, under-slab, fascia, struts, small bells */
    for (let k = 0; k < 5; k += 1) {
      const w = RW[k]; const hw = w / 2; const e = E[k];
      els.push(<Roof key={`r${k}`} w={w} d={w} h={RH[k]} y={e} m={k === 4 ? roofTop : roofM} sag={SAG} lift={LIFT} fascia={false} />);
      els.push(<Box key={`us${k}`} s={[w - 0.08, 0.16, w - 0.08]} p={[0, e - 0.1, 0]} m={dk} cast={false} />);
      [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([sx, sz], i) => {
        els.push(<Box key={`fa${k}${i}`} s={sx ? [0.12, 0.3, w + 0.06] : [w + 0.06, 0.3, 0.12]} p={[sx * hw, e + 0.02, sz * hw]} m={dk} cast={false} />);
      });
      const n = [20, 16, 14, 12, 10][k];
      els.push(<Struts key={`st${k}`} bx={HALF[k]} bz={HALF[k]} hx={hw} hz={hw} e={e} drop={k === 0 ? 0.85 : 0.6} nx={n} nz={n} m={wood} th={k === 0 ? 0.18 : 0.16} />);
      const ochM = M.plain(OCHRE, { roughness: 0.7 });
      [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([sx, sz], i) => {
        els.push(<Box key={`oc${k}${i}`} s={sx ? [0.1, 0.12, w * 0.78] : [w * 0.78, 0.12, 0.1]} p={[sx * hw * 0.86, e - 0.14, sz * hw * 0.86]} m={ochM} cast={false} />);
      });
      const lift = LIFT * RH[k];
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz], i) => {
        els.push(<Ball key={`bc${k}${i}`} rad={0.08} p={[sx * (hw - 0.02), e + lift - 0.13, sz * (hw - 0.02)]} sc={[1, 1.2, 1]} m={gold} />);
      });
    }

    /* marigold garlands hung either side of the door */
    [[-0.78, '#f08a1c'], [-0.62, '#f2b01e'], [0.62, '#f2b01e'], [0.78, '#f08a1c']].forEach(([x, c], i) => {
      els.push(<Cyl key={`mg${i}`} rt={0.07} rb={0.05} h={1.1} p={[x, PLH + 1.15, HALF[0] + 0.09]} m={M.plain(c, { roughness: 0.9 })} seg={7} />);
    });
    /* gilded finial */
    els.push(<Gajur key="gj" y={APEX - 0.05} s={1.8} />);
    return <group>{els}</group>;
  }

  /* ---------- small white stupa-like shrine near the temple ---------- */
  function WhiteStupa({ p, s = 1 }) {
    const M = useM();
    const white = M.plain('#ecebe6', { roughness: 0.85 });
    return (
      <group position={p} scale={s}>
        <Box s={[1.2, 0.35, 1.2]} p={[0, 0.17, 0]} m={white} />
        <Box s={[0.95, 0.25, 0.95]} p={[0, 0.47, 0]} m={white} />
        <mesh position={[0, 0.6, 0]} material={white} castShadow><sphereGeometry args={[0.46, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
        <Cyl rt={0.2} rb={0.26} h={0.2} p={[0, 1.08, 0]} m={white} seg={12} />
        <mesh position={[0, 1.55, 0]} material={white} castShadow><coneGeometry args={[0.2, 0.75, 14]} /></mesh>
        <Ball rad={0.05} p={[0, 1.96, 0]} m={M.gold} />
      </group>
    );
  }

  /* ---------- little brick shrine with a tiled roof ---------- */
  function SmallShrine({ p, r = 0, w = 1.7, h = 1.5, roof = '#6b665f' }) {
    const M = useM();
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[w + 0.3, 0.2, w + 0.3]} p={[0, 0.1, 0]} m={M.mat('granite', 2, 2, { color: '#b5a595' })} cast={false} />
        <Box s={[w, h, w]} p={[0, 0.2 + h / 2, 0]} m={brickM(M, w, h)} />
        <Box s={[0.6, 0.95, 0.05]} p={[0, 0.2 + 0.48, w / 2 + 0.01]} m={M.plain(TIMBER_D)} cast={false} />
        <Roof w={w + 0.9} d={w + 0.9} h={0.6} y={0.2 + h} m={M.mat('roof', 0.8, 0.8, { color: roof })} sag={1.25} lift={0.12} fascia={false} />
        <Box s={[w + 0.8, 0.1, w + 0.8]} p={[0, 0.2 + h - 0.06, 0]} m={M.plain(TIMBER_D)} cast={false} />
        <Cyl rt={0.03} rb={0.06} h={0.3} p={[0, 0.2 + h + 0.65, 0]} m={M.gold} seg={8} />
      </group>
    );
  }

  /* ---------- sacred pond: brick parapet, whitewashed coping, white-post railing, linga pavilion ---------- */
  const POND = { cx: -9, cz: -2, w: 9, d: 12 };
  function Pond() {
    const M = useM();
    const white = M.plain('#f1eee6', { roughness: 0.8 });
    const post = M.plain('#f4f2ec', { roughness: 0.7 });
    const rail = M.plain('#b4b8bc', { metalness: 0.7, roughness: 0.35 });
    const diyaM = M.plain('#ffd27a', { emissive: '#ff8f1f', emissiveIntensity: 1.8 });
    const water = M.plain('#6b6a4c', { roughness: 0.3, metalness: 0.1 });
    const stoneS = M.plain('#b9b2a6', { roughness: 0.85 });
    const hole = M.plain('#1c1410');
    const { cx, cz, w, d } = POND;
    const T = 0.55; const H = 0.75;
    const els = [];
    // water surface
    els.push(<mesh key="water" rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.06, cz]} material={water} receiveShadow><planeGeometry args={[w, d]} /></mesh>);
    els.push(<mesh key="wp1" rotation={[-Math.PI / 2, 0, 0]} position={[cx + 1.2, 0.065, cz + 2]} material={M.plain('#6b6048', { roughness: 0.25, metalness: 0.2 })}><circleGeometry args={[1.8, 20]} /></mesh>);
    els.push(<mesh key="wp2" rotation={[-Math.PI / 2, 0, 0]} position={[cx - 1.5, 0.065, cz - 3]} material={M.plain('#4e4536', { roughness: 0.8 })}><circleGeometry args={[1.5, 20]} /></mesh>);
    els.push(<mesh key="wp3" rotation={[-Math.PI / 2, 0, 0]} position={[cx + 2.2, 0.065, cz - 2.5]} material={M.plain('#6a5a46', { roughness: 0.6 })}><circleGeometry args={[1.1, 16]} /></mesh>);
    // four brick parapet walls (with white coping) around the water
    const walls = [
      { x: cx, z: cz + d / 2 + T / 2, sx: w + T * 2, sz: T },
      { x: cx, z: cz - d / 2 - T / 2, sx: w + T * 2, sz: T },
      { x: cx + w / 2 + T / 2, z: cz, sx: T, sz: d },
      { x: cx - w / 2 - T / 2, z: cz, sx: T, sz: d },
    ];
    walls.forEach((wl, i) => {
      els.push(<Box key={`pw${i}`} s={[wl.sx, H, wl.sz]} p={[wl.x, H / 2, wl.z]} m={brickM(M, Math.max(wl.sx, wl.sz), H)} />);
      els.push(<Box key={`pc${i}`} s={[wl.sx + 0.1, 0.12, wl.sz + 0.1]} p={[wl.x, H + 0.05, wl.z]} m={white} cast={false} />);
    });
    // white-post railing along the inner edge of the near (east, +z) sides
    const posts = [];
    for (let i = 0; i <= 10; i += 1) { const x = cx - w / 2 + (i / 10) * w; posts.push([x, cz + d / 2 - 0.1]); }
    for (let i = 1; i <= 13; i += 1) { const z = cz + d / 2 - (i / 14) * d; posts.push([cx + w / 2 - 0.1, z]); }
    posts.forEach(([x, z], i) => els.push(<Box key={`po${i}`} s={[0.14, 0.4, 0.14]} p={[x, H + 0.31, z]} m={post} cast={false} />));
    [0.4, 0.2].forEach((hh, i) => {
      els.push(<Box key={`rl1${i}`} s={[w, 0.05, 0.05]} p={[cx, H + hh + 0.12, cz + d / 2 - 0.1]} m={rail} cast={false} />);
      els.push(<Box key={`rl2${i}`} s={[0.05, 0.05, d]} p={[cx + w / 2 - 0.1, H + hh + 0.12, cz]} m={rail} cast={false} />);
    });
    // inner stone ledge for lamps (west side)
    els.push(<Box key="ledge" s={[0.5, 0.3, d - 1]} p={[cx - w / 2 + 0.3, 0.18, cz]} m={M.mat('granite', 1, 4, { color: '#8e8478' })} cast={false} />);
    // lamp ledge diyas (west side, as in the photographs)
    for (let i = 0; i < 18; i += 1) {
      els.push(<Ball key={`dy${i}`} rad={0.05} sc={[1, 0.55, 1]} p={[cx - w / 2 + 0.15 + (i % 2) * 0.22, 0.36, cz - d / 2 + 1 + (i * (d - 2)) / 17]} m={diyaM} />);
    }
    // white lion/bull statue at the near corner of the parapet
    els.push(<group key="lion" position={[cx + w / 2 + T / 2, H + 0.12, cz + d / 2 + T / 2]} rotation={[0, -0.6, 0]}>
      <Box s={[0.5, 0.2, 0.7]} p={[0, 0.1, 0]} m={white} />
      <Ball rad={0.25} sc={[0.9, 0.9, 1.4]} p={[0, 0.42, 0]} m={white} />
      <Ball rad={0.17} p={[0, 0.7, 0.25]} m={white} />
      <Ball rad={0.2} sc={[1.2, 1.1, 0.8]} p={[0, 0.66, 0.12]} m={M.plain('#e8e2d6')} />
      <Box s={[0.08, 0.3, 0.08]} p={[0.15, 0.4, 0.4]} m={white} />
      <Box s={[0.08, 0.3, 0.08]} p={[-0.15, 0.4, 0.4]} m={white} />
    </group>);
    // stone water-spout niches on the brick parapet (south and east faces)
    [-2.8, 0, 2.8].forEach((dx, i) => {
      els.push(<group key={`sp${i}`} position={[cx + dx, 0.36, cz + d / 2 + T + 0.02]}>
        <Box s={[0.6, 0.56, 0.08]} p={[0, 0, 0]} m={stoneS} cast={false} />
        <Box s={[0.4, 0.36, 0.1]} p={[0, 0, 0.02]} m={hole} cast={false} />
        <Ball rad={0.11} p={[0, -0.02, 0.1]} sc={[1, 1, 0.8]} m={stoneS} />
        <Box s={[0.07, 0.07, 0.3]} p={[0, -0.14, 0.2]} m={stoneS} cast={false} />
      </group>);
    });
    els.push(<group key="sp3" position={[cx + w / 2 + T + 0.02, 0.36, cz - 1.5]} rotation={[0, Math.PI / 2, 0]}>
      <Box s={[0.6, 0.56, 0.08]} m={stoneS} cast={false} />
      <Box s={[0.4, 0.36, 0.1]} p={[0, 0, 0.02]} m={hole} cast={false} />
      <Ball rad={0.11} p={[0, -0.02, 0.1]} sc={[1, 1, 0.8]} m={stoneS} />
      <Box s={[0.07, 0.07, 0.3]} p={[0, -0.14, 0.2]} m={stoneS} cast={false} />
    </group>);
    // stone steps descending into the pond on the east side
    [0, 1, 2].forEach((n) => {
      els.push(<Box key={`stp${n}`} s={[0.5, 0.18 * (3 - n) + 0.05, 2.2]} p={[cx + w / 2 - 0.25 - n * 0.5, (0.18 * (3 - n) + 0.05) / 2, cz - 3.8]} m={stoneS} cast={false} />);
    });
    // linga pavilion in the middle of the pond
    els.push(
      <group key="pav" position={[cx, 0, cz]}>
        <Box s={[3.0, 0.45, 3.0]} p={[0, 0.2, 0]} m={M.mat('granite', 2, 2, { color: '#a89c8e' })} />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => <Cyl key={`pp${i}`} rt={0.09} rb={0.1} h={1.5} p={[sx * 1.2, 0.45 + 0.75, sz * 1.2]} m={M.plain(TIMBER)} seg={8} />)}
        <Roof w={3.4} d={3.4} h={0.8} y={2.0} m={M.mat('roof', 1, 1, { color: '#6d6962' })} sag={1.3} lift={0.15} fascia={false} />
        <Box s={[2.8, 0.1, 2.8]} p={[0, 1.95, 0]} m={M.plain(TIMBER_D)} cast={false} />
        <Cyl rt={0.4} rb={0.5} h={0.22} p={[0, 0.56, 0]} m={M.stone} seg={14} />
        <mesh position={[0, 1.0, 0]} material={M.plain('#c9ccd0', { metalness: 0.8, roughness: 0.3 })} castShadow><capsuleGeometry args={[0.2, 0.42, 6, 14]} /></mesh>
        <Cyl rt={0.03} rb={0.03} h={0.7} p={[0, 2.95, 0]} m={M.gold} seg={6} />
      </group>,
    );
    return <group>{els}</group>;
  }

  /* ---------- hand-built kneeling Nandi bull on a square pedestal, facing -z ---------- */
  function KneelingNandi({ p }) {
    const M = useM();
    const st = M.plain('#d9d5cc', { roughness: 0.75 });
    const stD = M.plain('#b8b2a6', { roughness: 0.8 });
    const horn = M.plain('#efe9da', { roughness: 0.6 });
    const eye = M.plain('#1b1410');
    const mari = M.plain('#f08a1c', { roughness: 0.9 });
    const mari2 = M.plain('#f2b01e', { roughness: 0.9 });
    return (
      <group position={p}>
        <Box s={[1.5, 0.35, 2.1]} p={[0, 0.175, 0]} m={M.mat('granite', 2, 2, { color: '#a89c8e' })} />
        <Box s={[1.3, 0.08, 1.9]} p={[0, 0.39, 0]} m={stD} cast={false} />
        <group position={[0, 0.43, 0.05]}>
          <Ball rad={0.5} sc={[0.95, 0.85, 1.6]} p={[0, 0.5, 0.1]} m={st} />
          <Ball rad={0.34} sc={[0.9, 0.9, 1.1]} p={[0, 0.88, -0.28]} m={st} />
          <Ball rad={0.42} sc={[1, 0.85, 1.1]} p={[0, 0.42, 0.5]} m={st} />
          {[-1, 1].map((sx) => (
            <group key={sx}>
              <Box s={[0.2, 0.2, 0.75]} p={[sx * 0.4, 0.14, -0.55]} m={stD} />
              <Ball rad={0.13} p={[sx * 0.4, 0.14, -0.95]} m={stD} />
              <Box s={[0.22, 0.22, 0.8]} p={[sx * 0.52, 0.16, 0.45]} m={stD} />
            </group>
          ))}
          <Ball rad={0.3} sc={[0.85, 1.25, 1]} p={[0, 0.95, -0.6]} r={[0.5, 0, 0]} m={st} />
          <Ball rad={0.26} sc={[0.9, 1, 1.3]} p={[0, 1.1, -0.9]} m={st} />
          <Ball rad={0.17} sc={[1.1, 0.9, 1.1]} p={[0, 0.98, -1.18]} m={st} />
          {[-1, 1].map((sx) => (
            <group key={`h${sx}`}>
              <Cyl rt={0.015} rb={0.045} h={0.36} p={[sx * 0.28, 1.34, -0.85]} r={[0, 0, -sx * 0.9]} m={horn} seg={8} />
              <Ball rad={0.09} sc={[1.3, 0.5, 0.8]} p={[sx * 0.3, 1.16, -0.78]} m={stD} />
              <Ball rad={0.03} p={[sx * 0.2, 1.14, -1.08]} m={eye} />
              <Ball rad={0.025} p={[sx * 0.07, 0.99, -1.33]} m={eye} />
            </group>
          ))}
          <Cyl rt={0.03} rb={0.05} h={0.5} p={[0, 0.45, 0.98]} r={[-0.5, 0, 0]} m={stD} seg={6} />
          <mesh position={[0, 0.98, -0.7]} rotation={[0.5, 0, 0]} material={mari}><torusGeometry args={[0.3, 0.06, 8, 16]} /></mesh>
          <mesh position={[0, 0.88, -0.58]} rotation={[0.5, 0, 0]} material={mari2}><torusGeometry args={[0.32, 0.045, 8, 16]} /></mesh>
        </group>
      </group>
    );
  }

  /* ---------- MAIN ---------- */
  function KumbheshwarMain() {
    const M = useM();
    const diya = M.plain('#ffd27a', { emissive: '#ff8f1f', emissiveIntensity: 1.8 });
    const NZ = HALF[0] + 2.5;
    return (
      <group>
        <Tower />
        <KneelingNandi p={[0, 0, NZ]} />
        <WhiteStupa p={[4.7, 0, 3.7]} s={0.9} />
        {[-0.6, -0.3, 0, 0.3, 0.6].map((x, i) => <Ball key={`d${i}`} rad={0.05} sc={[1, 0.6, 1]} p={[x, 0.04, NZ + 1.3]} m={diya} />)}
        {[-1.1, 1.1].map((x, i) => <Ball key={`dd${i}`} rad={0.05} sc={[1, 0.6, 1]} p={[x, 0.1, NZ + 0.55]} m={diya} />)}
        {[-1.0, 1.0].map((x, i) => <Ball key={`mg${i}`} rad={0.15} sc={[1.3, 0.6, 1]} p={[x, 0.08, NZ + 1.0]} m={M.plain(i ? '#f2b01e' : '#f08a1c', { roughness: 0.9 })} />)}
        <pointLight position={[0, 1.6, NZ + 0.5]} intensity={0.9} distance={8} color="#ffb870" />
        <pointLight position={[0, E[2], 3]} intensity={0.5} distance={7} color="#ffb870" />
        <Frame s={[12, APEX + 2.2, 11]} p={[1.2, (APEX + 2.2) / 2, 1.4]} />
      </group>
    );
  }

  /* ================= ENVIRONMENT: the walled courtyard in old Patan ================= */
  const matCache = new Map();
  function facadeMat(w, H, st, seed, tint, plaster) {
    const key = `${w}|${H}|${st}|${seed}|${tint}|${plaster}`;
    if (matCache.has(key)) return matCache.get(key);
    const W = Math.max(128, Math.round(w * 64)); const Hh = Math.round(H * 64);
    const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = Hh; return c; };
    const c1 = mk(); const c2 = mk(); const g = c1.getContext('2d'); const e = c2.getContext('2d');
    const r = rng(seed);
    g.fillStyle = tint; g.fillRect(0, 0, W, Hh);
    if (!plaster) {
      g.fillStyle = 'rgba(60,20,10,0.2)';
      for (let y = 0, row = 0; y < Hh; y += 7, row += 1) { g.fillRect(0, y, W, 1); for (let x = (row % 2) * 9; x < W; x += 18) g.fillRect(x, y, 1, 7); }
    } else {
      g.fillStyle = 'rgba(80,40,30,0.06)';
      for (let i = 0; i < 60; i += 1) g.fillRect(r() * W, r() * Hh, 12 + r() * 20, 2);
    }
    e.fillStyle = '#000'; e.fillRect(0, 0, W, Hh);
    const fh = Hh / st; const gy = Hh - fh;
    const shops = ['#3a2a20', '#4a3224', '#2f2a26', '#5a4030', '#3b3128'];
    g.fillStyle = '#20120a'; g.fillRect(W * 0.1, gy + fh * 0.34, W * 0.8, fh * 0.66);
    g.fillStyle = shops[Math.floor(r() * 5)]; g.fillRect(W * 0.1, gy + fh * 0.42, W * 0.34, fh * 0.58);
    e.fillStyle = '#c98a3a'; e.fillRect(W * 0.46, gy + fh * 0.45, W * 0.4, fh * 0.55);
    g.fillStyle = '#3b2415'; g.fillRect(W * 0.07, gy + fh * 0.26, W * 0.86, fh * 0.1);
    const cols = w > 3.7 ? 3 : 2;
    for (let f = 0; f < st - 1; f += 1) {
      const y0 = f * fh;
      g.fillStyle = '#3b2415'; g.fillRect(0, y0 + fh - 5, W, 5);
      for (let i = 0; i < cols; i += 1) {
        const cw = W / cols; const ww = cw * 0.6; const x0 = i * cw + (cw - ww) / 2; const wy = y0 + fh * 0.2; const wh = fh * 0.58;
        g.fillStyle = '#4a2c18'; g.fillRect(x0 - 4, wy - 4, ww + 8, wh + 8);
        g.fillStyle = '#1d120a'; g.fillRect(x0, wy, ww, wh);
        g.strokeStyle = '#6a4426'; g.lineWidth = 2;
        for (let b = 1; b < 5; b += 1) { g.beginPath(); g.moveTo(x0 + (ww * b) / 5, wy); g.lineTo(x0 + (ww * b) / 5, wy + wh); g.stroke(); }
        if (r() < 0.4) { e.fillStyle = '#ffb35a'; e.fillRect(x0, wy, ww, wh); }
      }
    }
    g.fillStyle = '#3b2415'; g.fillRect(0, 0, W, 5);
    const t = new THREE.CanvasTexture(c1); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    const te = new THREE.CanvasTexture(c2); te.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.MeshStandardMaterial({ map: t, emissiveMap: te, emissive: '#ffffff', emissiveIntensity: 0.12, roughness: 0.9 });
    matCache.set(key, m); return m;
  }

  // brick reds mostly, with a few pink / orange / cream plastered houses
  const HTINTS = [
    ['#a8503a', 0], ['#b05a42', 0], ['#9c4a36', 0], ['#c9806e', 1], ['#b8644a', 0], ['#d9a07a', 1], ['#a4563e', 0], ['#d9a3a8', 1], ['#c07858', 0], ['#e0cdb0', 1],
  ];
  function RHouse({ p, r = 0, w = 3.6, d = 3.8, st = 3, seed = 1, lite = false }) {
    const M = useM();
    const sh = 1.25 + (((seed * 7) % 10) / 10) * 0.3; const H = st * sh;
    const [tint, plaster] = HTINTS[seed % HTINTS.length];
    const front = useMemo(() => (lite ? null : facadeMat(Math.round(w * 4) / 4, H, st, seed % 7, tint, plaster)), [w, H, st, seed, tint, plaster, lite]);
    const side = plaster ? M.plain(tint, { roughness: 0.9 }) : M.mat('brick', w / 1.4, st * 1.1, { color: '#c98a72', emissive: '#3a1a10', emissiveIntensity: 0.12 });
    const mats = lite ? side : [side, side, side, side, front, side];
    const wood = M.plain('#3b2415', { roughness: 0.85 });
    const roofCols = ['#8a5a46', '#3e3834', '#7a6a60', '#9a6a52', '#4a423c'];
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[w, H, d]} p={[0, H / 2, 0]} m={mats} cast={false} />
        <Roof w={w + 0.6} d={d + 0.6} h={0.7 + (seed % 3) * 0.1} y={H} m={M.mat('roof', 1.4, 1.4, { color: roofCols[seed % 5] })} sag={1.15} lift={0.08} fascia={false} />
        {!lite && st >= 3 && seed % 3 === 0 && (
          <group position={[0, sh * 1.0, d / 2]}>
            <Box s={[w * 0.7, 0.1, 0.6]} p={[0, 0, 0.3]} m={wood} cast={false} />
            <Box s={[w * 0.7, 0.4, 0.05]} p={[0, 0.25, 0.6]} m={wood} cast={false} />
          </group>
        )}
        {!lite && st >= 3 && seed % 3 === 2 && (
          <group position={[0, sh * 2.0, d / 2]}>
            <Box s={[w * 0.6, 0.9, 0.35]} p={[0, 0.1, 0.18]} m={wood} cast={false} />
            {[-0.3, -0.15, 0, 0.15, 0.3].map((q, j) => <Box key={j} s={[0.03, 0.7, 0.04]} p={[q * w, 0.1, 0.37]} m={M.plain('#8a5a30')} cast={false} />)}
          </group>
        )}
        {!lite && st >= 3 && seed % 3 === 1 && (
          <group position={[w * 0.15, sh * 1.55, d / 2]}>
            <Box s={[1.0, 0.85, 0.4]} p={[0, 0, 0.2]} m={wood} cast={false} />
            <Box s={[1.1, 0.08, 0.5]} p={[0, 0.46, 0.2]} m={wood} cast={false} />
          </group>
        )}
      </group>
    );
  }

  function rowItems({ axis, from, to, fixed, rot, seed, minS = 3, maxS = 4, skip }) {
    const r = rng(seed); const items = [];
    let u = from; let i = 0;
    while (u < to) {
      const w = 3.4 + r() * 1.2;
      const c = u + w / 2;
      if (!skip || !skip(c)) {
        const st = minS + Math.floor(r() * (maxS - minS + 1)) + (i % 6 === 3 ? 1 : 0);
        const dd = 0;
        items.push({ p: axis === 'z' ? [fixed, 0, c] : [c, 0, fixed], r: rot, w, st, seed: seed + i * 3 });
      }
      u += w; i += 1;
      if (r() < 0.14) u += 1.8 + r() * 1.2;
    }
    return items;
  }

  function HouseRows() {
    const items = useMemo(() => [
      ...rowItems({ axis: 'z', from: -19, to: 21.5, fixed: 21.6, rot: -Math.PI / 2, seed: 2 }),
      ...rowItems({ axis: 'z', from: -19, to: 21.5, fixed: -26.6, rot: Math.PI / 2, seed: 30 }),
      ...rowItems({ axis: 'x', from: -28.5, to: 23.5, fixed: -21.6, rot: 0, seed: 60 }),
      ...rowItems({ axis: 'x', from: -28.5, to: 23.5, fixed: 24.0, rot: Math.PI, seed: 90, skip: (c) => c > -4 && c < 4.5 }),
    ], []);
    const back = useMemo(() => [
      ...rowItems({ axis: 'z', from: -26, to: 28, fixed: 26.6, rot: -Math.PI / 2, seed: 5, minS: 4, maxS: 5 }),
      ...rowItems({ axis: 'z', from: -26, to: 28, fixed: -31.6, rot: Math.PI / 2, seed: 35, minS: 4, maxS: 5 }),
      ...rowItems({ axis: 'x', from: -34, to: 30, fixed: -26.6, rot: 0, seed: 65, minS: 4, maxS: 5 }),
      ...rowItems({ axis: 'x', from: -34, to: 30, fixed: 29.0, rot: Math.PI, seed: 95, minS: 4, maxS: 5 }),
    ], []);
    return (
      <group>
        {items.map((it, i) => <RHouse key={`h${i}`} p={it.p} r={it.r} w={it.w} st={it.st} seed={it.seed} />)}
        {back.map((it, i) => <RHouse key={`b${i}`} p={it.p} r={it.r} w={it.w} st={it.st} seed={it.seed} lite />)}
      </group>
    );
  }

  /* simple low sattal that serves as the entrance to the complex (south edge, facing -z into the courtyard) */
  function Sattal() {
    const M = useM();
    const dk = M.plain(TIMBER_D);
    return (
      <group position={[0.2, 0, 22.4]} rotation={[0, Math.PI, 0]}>
        <Box s={[8.5, 0.3, 4.2]} p={[0, 0.15, 0]} m={M.mat('granite', 4, 2, { color: '#b5a595' })} cast={false} />
        <Box s={[8, 2.5, 3.6]} p={[0, 1.55, 0]} m={brickM(M, 8, 2.5)} />
        <Box s={[2.2, 1.9, 0.1]} p={[0, 1.25, 1.82]} m={dk} cast={false} />
        {[-3, 3].map((x, i) => <Box key={i} s={[1.1, 0.9, 0.08]} p={[x, 1.7, 1.82]} m={dk} cast={false} />)}
        <Roof w={9.4} d={5} h={1.1} y={2.8} m={M.mat('roof', 2, 1, { color: '#a8785c' })} sag={1.2} lift={0.1} fascia={false} />
      </group>
    );
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

  /* faint Valley-rim hills only as haze */
  function Haze() {
    const M = useM();
    const hill = M.plain('#8fa08e', { roughness: 1, emissive: '#6a7a6e', emissiveIntensity: 0.35 });
    return (
      <group>
        {[[-90, -95, 40], [-30, -105, 46], [40, -100, 42], [100, -90, 38], [-110, 20, 36], [110, 30, 40]].map(([x, z, r], i) => (
          <mesh key={i} position={[x, -2, z]} scale={[2.2, 0.35, 1]} material={hill}><sphereGeometry args={[r, 18, 10]} /></mesh>
        ))}
      </group>
    );
  }

  function KumbheshwarEnv() {
    const M = useM();
    const people = [[-3, 0, 9, '#c0392b'], [4, 0, 10, '#2f6db5'], [-6.5, 0, 6, '#e2b33c'], [9, 0, 2, '#2e8b57'], [-4, 0, 14, '#7a5a8a'], [-8, 0, 12, '#b8312f'], [-16, 0, 9.4, '#d9a23a'], [-11, 0, 4.8, '#c0392b'], [-8.5, 0, 4.8, '#2f6db5'], [-13.5, 0, 4.8, '#e2b33c']];
    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow material={M.plain('#a8957a', { roughness: 1 })}><circleGeometry args={[170, 48]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2, -0.01, 0]} receiveShadow material={M.mat('herring', 17, 15, { color: '#cf9a82', emissive: '#7a4a38', emissiveIntensity: 0.4 })}><planeGeometry args={[46, 44]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0.5]} receiveShadow material={M.mat('brick', 5, 5, { color: '#c98568' })}><planeGeometry args={[9.5, 9.5]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 14]} receiveShadow material={M.mat('brick', 2, 8, { color: '#c98568' })}><planeGeometry args={[2.4, 17]} /></mesh>
        <Pond />
        <HouseRows />
        <Sattal />
        <SmallShrine p={[7.5, 0, -8.5]} r={0.3} roof="#5f5a55" />
        <SmallShrine p={[-3.5, 0, -11]} r={-0.1} w={1.5} h={1.3} roof="#4f4b48" />
        <SmallShrine p={[9.5, 0, 9]} r={-0.6} w={1.3} h={1.2} roof="#6b665f" />
        {people.map(([x, y, z, c], i) => <Person key={i} p={[x, y, z]} c={c} s={1.1} />)}
        <Tree p={[19, 0, -14]} s={2.2} />
        <Tree p={[-24, 0, 14]} s={1.6} />
        <Haze />
      </group>
    );
  }

  return { 'kumbheshwar-temple': { Main: KumbheshwarMain, Env: KumbheshwarEnv } };
}
