// Maju Dega, Kathmandu Durbar Square. Shiva temple of 1692: three red-tile roofs on a nine-tier red-brick stepped pyramid.
// Front (broad stair) = +z. Kamadev (white shikhara) at the right foot of the stair, a smaller Narayan pagoda behind it.
// Scale: about 0.75 units per metre (riser 0.45 = 0.6 m).
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Gajur, LatticeWindow, Frame, THREE, useMemo } = K;

  const TIERS = 9;
  const RISER = 0.45;
  const TREAD = 0.5;
  const H0 = 8.0;                 // half width of the lowest tier
  const TOP = TIERS * RISER;      // 4.05
  const HTOP = H0 - (TIERS - 1) * TREAD; // 4.0 half width of top platform
  const STEPS = 18;
  const SRISE = TOP / STEPS;
  const SRUN = (H0 - HTOP) / STEPS;
  const SW = 3.2;                 // main stair width

  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const CLOTH = ['#c8402f', '#2e5f8f', '#e0b040', '#3a7d44', '#f0efe9', '#7a3a8a', '#2a2a2e', '#e07a2a', '#b04a6a'];


  /* ---------- fired-brick texture (orange-red with mortar lines), cloned per repeat ---------- */
  let brickBase = null;
  const brickCache = new Map();
  function bricks(rx, ry, tone = '#ffffff') {
    const key = `${rx.toFixed(2)}|${ry.toFixed(2)}|${tone}`;
    if (brickCache.has(key)) return brickCache.get(key);
    if (!brickBase && typeof document !== 'undefined') {
      const c = document.createElement('canvas'); c.width = 128; c.height = 64;
      const g = c.getContext('2d');
      g.fillStyle = '#9a7c68'; g.fillRect(0, 0, 128, 64);
      const r = rng(3);
      const tones = ['#b8441f', '#c24e26', '#aa3c1a', '#c8562c', '#b24220', '#bc4a24'];
      for (let row = 0; row < 8; row += 1) {
        const off = (row % 2) * 16;
        for (let col = -1; col < 5; col += 1) {
          g.fillStyle = tones[Math.floor(r() * tones.length)];
          g.fillRect(col * 32 + off + 1, row * 8 + 1, 30, 6);
        }
      }
      brickBase = new THREE.CanvasTexture(c);
      brickBase.wrapS = brickBase.wrapT = THREE.RepeatWrapping; brickBase.colorSpace = THREE.SRGBColorSpace; brickBase.anisotropy = 8;
    }
    let map = null;
    if (brickBase) { map = brickBase.clone(); map.needsUpdate = true; map.repeat.set(rx, ry); }
    const m = new THREE.MeshStandardMaterial({ map, color: map ? tone : '#b0502f', roughness: 0.92 });
    brickCache.set(key, m);
    return m;
  }

  /* ---------- carved timber struts under an eave ---------- */
  function Struts({ bx, hx, e, drop, n, m, th = 0.15 }) {
    const out = [];
    const y1 = e - drop; const y2 = e - 0.1;
    [1, -1].forEach((s) => {
      const z1 = s * (bx + 0.02); const z2 = s * hx * 0.84;
      const len = Math.hypot(z2 - z1, y2 - y1); const ang = Math.atan2(z2 - z1, y2 - y1);
      for (let i = 0; i < n; i += 1) {
        const x = ((i + 0.5) / n - 0.5) * 2 * bx * 0.94;
        out.push(<Box key={`z${s}${i}`} s={[th, len, th * 0.9]} p={[x, (y1 + y2) / 2, (z1 + z2) / 2]} r={[ang, 0, 0]} m={m} cast={false} />);
      }
      const x1 = s * (bx + 0.02); const x2 = s * hx * 0.84;
      const lenx = Math.hypot(x2 - x1, y2 - y1); const angx = -Math.atan2(x2 - x1, y2 - y1);
      for (let i = 0; i < n; i += 1) {
        const z = ((i + 0.5) / n - 0.5) * 2 * bx * 0.94;
        out.push(<Box key={`x${s}${i}`} s={[th * 0.9, lenx, th]} p={[(x1 + x2) / 2, (y1 + y2) / 2, z]} r={[0, 0, angx]} m={m} cast={false} />);
      }
    });
    return <group>{out}</group>;
  }

  /* ---------- a Newar pagoda body: open timber ground storey, short brick storeys, tiled roofs ---------- */
  function Tower({ y0, RW, RH, HALF, WALLH, sag = 1.3, nStrut, posts = 7, gs = 1, light = false, cellaK = 0.56, gj = 1.15 }) {
    const M = useM();
    const n = RW.length;
    const E = [y0 + WALLH[0]]; const B = [y0];
    for (let k = 1; k < n; k += 1) {
      const ratio = HALF[k] / (RW[k - 1] / 2);
      B[k] = E[k - 1] + RH[k - 1] * (1 - ratio) ** sag;
      E[k] = B[k] + WALLH[k];
    }
    const apex = E[n - 1] + RH[n - 1];
    const wood = M.plain('#4a3020', { roughness: 0.8 });
    const woodD = M.plain('#2e1c10', { roughness: 0.8 });
    const tile = M.mat('roof', 4, 4, { color: '#cc6238' });
    const brick = bricks(2.4, 2, '#ffffff');
    const dim = bricks(2, 1.5, '#8a6a5c');
    const gband = M.plain('#c9a040', { emissive: '#ff9a20', emissiveIntensity: light ? 0.35 : 0.1, roughness: 0.5 });
    const glow = M.plain('#ffcf80', { emissive: '#ff9a30', emissiveIntensity: 1.4 });
    const parts = [];
    /* ground storey: cella walls inside a ring of posts */
    const R0 = HALF[0];
    const CH = R0 * cellaK;
    parts.push(<Box key="floor" s={[R0 * 2 + 0.5, 0.06, R0 * 2 + 0.5]} p={[0, y0 + 0.03, 0]} m={woodD} cast={false} />);
    parts.push(<Box key="cella" s={[CH * 2, WALLH[0], CH * 2]} p={[0, y0 + WALLH[0] / 2, 0]} m={dim} />);
    parts.push(<Box key="door" s={[CH * 0.5, WALLH[0] * 0.62, 0.06]} p={[0, y0 + WALLH[0] * 0.33, CH + 0.02]} m={M.plain('#120a05')} cast={false} />);
    parts.push(<Box key="doorf" s={[CH * 0.6, 0.1, 0.1]} p={[0, y0 + WALLH[0] * 0.66, CH + 0.04]} m={wood} cast={false} />);
    if (light) parts.push(<Ball key="lamp" rad={0.12} p={[0, y0 + 0.9, CH + 0.3]} m={glow} />);
    const px = [];
    for (let i = 0; i < posts; i += 1) px.push(-R0 + (2 * R0 * i) / (posts - 1));
    const addPost = (x, z, key) => {
      parts.push(<Cyl key={`p${key}`} rt={0.085 * gs} rb={0.1 * gs} h={WALLH[0]} p={[x, y0 + WALLH[0] / 2, z]} m={wood} seg={8} />);
    };
    px.forEach((x, i) => { addPost(x, R0, `f${i}`); addPost(x, -R0, `b${i}`); });
    px.slice(1, -1).forEach((z, i) => { addPost(R0, z, `r${i}`); addPost(-R0, z, `l${i}`); });
    parts.push(<Box key="rail-f" s={[R0 * 2, 0.07, 0.07]} p={[0, y0 + 0.42, R0]} m={wood} cast={false} />);
    parts.push(<Box key="rail-b" s={[R0 * 2, 0.07, 0.07]} p={[0, y0 + 0.42, -R0]} m={wood} cast={false} />);
    parts.push(<Box key="rail-l" s={[0.07, 0.07, R0 * 2]} p={[-R0, y0 + 0.42, 0]} m={wood} cast={false} />);
    parts.push(<Box key="rail-r" s={[0.07, 0.07, R0 * 2]} p={[R0, y0 + 0.42, 0]} m={wood} cast={false} />);
    for (let k = 0; k < n; k += 1) {
      const half = HALF[k];
      parts.push(<Box key={`beam${k}`} s={[half * 2 + 0.24, 0.17, half * 2 + 0.24]} p={[0, E[k] - 0.09, 0]} m={wood} />);
      if (k > 0) {
        const h = WALLH[k] + 0.18;
        parts.push(<Box key={`wall${k}`} s={[half * 2, h, half * 2]} p={[0, E[k] - h / 2, 0]} m={brick} />);
        const wy = B[k] + WALLH[k] * 0.48;
        [[0, [0, wy, half + 0.01]], [Math.PI, [0, wy, -half - 0.01]], [Math.PI / 2, [half + 0.01, wy, 0]], [-Math.PI / 2, [-half - 0.01, wy, 0]]].forEach(([r, pos], i) => {
          const fr = [Math.abs(Math.cos(r)) > 0.5 ? half * 0.34 + 0.2 : 0.1, WALLH[k] * 0.46 + 0.2, Math.abs(Math.cos(r)) > 0.5 ? 0.06 : half * 0.34 + 0.2];
          const fr2 = Math.abs(Math.cos(r)) > 0.5 ? [fr[0], fr[1], 0.05] : [0.05, fr[1], fr[2]];
          parts.push(<Box key={`wf${k}${i}`} s={fr2} p={[pos[0] * 0.995, pos[1], pos[2] * 0.995]} m={woodD} cast={false} />);
          parts.push(<LatticeWindow key={`w${k}${i}`} p={pos} r={r} w={half * 0.34} h={WALLH[k] * 0.46} bars={3} detail={false} />);
        });
      }
      parts.push(<Box key={`sof${k}`} s={[RW[k] - 0.12, 0.03, RW[k] - 0.12]} p={[0, E[k] - 0.07, 0]} m={woodD} cast={false} />);
      {
        const g = RW[k] / 2 - 0.05; const gy = E[k] + 0.1;
        parts.push(<Box key={`gb1${k}`} s={[RW[k] - 0.1, 0.045, 0.04]} p={[0, gy, g]} m={gband} cast={false} />);
        parts.push(<Box key={`gb2${k}`} s={[RW[k] - 0.1, 0.045, 0.04]} p={[0, gy, -g]} m={gband} cast={false} />);
        parts.push(<Box key={`gb3${k}`} s={[0.04, 0.045, RW[k] - 0.1]} p={[g, gy, 0]} m={gband} cast={false} />);
        parts.push(<Box key={`gb4${k}`} s={[0.04, 0.045, RW[k] - 0.1]} p={[-g, gy, 0]} m={gband} cast={false} />);
      }
      parts.push(<Roof key={`roof${k}`} w={RW[k]} d={RW[k]} h={RH[k]} y={E[k]} m={tile} sag={sag} lift={0.2} />);
      parts.push(<Struts key={`st${k}`} bx={half} hx={RW[k] / 2} e={E[k]} drop={k === 0 ? WALLH[0] * 0.5 : 0.55} n={nStrut[k]} m={wood} />);
    }
    parts.push(<Gajur key="gaj" y={apex} s={gj * gs} />);
    return <group position={[0, 0, 0]}>{parts}</group>;
  }

  /* ---------- Kamadev: small whitewashed shikhara ---------- */
  function Kamadev() {
    const M = useM();
    const white = M.plain('#f4f0e8', { roughness: 0.85, flatShading: true });
    const whiteS = M.plain('#ece7dc', { roughness: 0.9 });
    const geo = useMemo(() => {
      const HB = 1.85;
      const hw = (y) => 0.6 * (1 - 0.82 * (y / HB) ** 1.7);
      const pts = [new THREE.Vector2(0.001, 0)];
      for (let j = 0; j <= 9; j += 1) { const y = (j / 9) * HB; pts.push(new THREE.Vector2(hw(y) * 1.414, y)); }
      pts.push(new THREE.Vector2(0.001, HB));
      return new THREE.LatheGeometry(pts, 4);
    }, []);
    return (
      <group>
        <Box s={[1.9, 0.25, 1.9]} p={[0, 0.125, 0]} m={whiteS} />
        <Box s={[1.5, 0.25, 1.5]} p={[0, 0.375, 0]} m={whiteS} />
        <group position={[0, 0.5, 0]}>
          <mesh geometry={geo} material={white} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow />
          <Box s={[0.34, 0.55, 0.05]} p={[0, 0.4, 0.56]} m={M.plain('#2a1810')} cast={false} />
          <Box s={[0.46, 0.07, 0.08]} p={[0, 0.74, 0.58]} m={M.gold} cast={false} />
          <Cyl rt={0.26} rb={0.22} h={0.1} p={[0, 1.9, 0]} m={white} seg={12} />
          <Cyl rt={0.13} rb={0.17} h={0.12} p={[0, 2.01, 0]} m={white} seg={12} />
          <Ball rad={0.1} p={[0, 2.14, 0]} m={M.gold} />
          <mesh position={[0, 2.38, 0]} material={M.gold} castShadow><coneGeometry args={[0.045, 0.38, 8]} /></mesh>
        </group>
      </group>
    );
  }

  /* ---------- people ---------- */
  function Person({ p, r = 0, seated, c, c2, sc = 1 }) {
    const M = useM();
    const body = M.plain(c, { roughness: 0.9 });
    const lower = M.plain(c2 || '#2a2a34', { roughness: 0.9 });
    const skin = M.plain('#b98a66', { roughness: 0.9 });
    return (
      <group position={p} rotation={[0, r, 0]} scale={seated ? sc * 1.3 : sc}>
        {seated ? (
          <>
            <Box s={[0.28, 0.32, 0.18]} p={[0, 0.27, 0]} m={body} cast={false} />
            <Box s={[0.24, 0.13, 0.34]} p={[0, 0.08, 0.14]} m={lower} cast={false} />
            <Ball rad={0.09} p={[0, 0.52, 0.01]} m={skin} />
          </>
        ) : (
          <>
            <Box s={[0.18, 0.4, 0.12]} p={[0, 0.2, 0]} m={lower} cast={false} />
            <Box s={[0.26, 0.34, 0.16]} p={[0, 0.58, 0]} m={body} cast={false} />
            <Ball rad={0.095} p={[0, 0.86, 0]} m={skin} />
          </>
        )}
      </group>
    );
  }

  function Seated() {
    const out = [];
    const r = rng(11);
    let id = 0;
    const tierTop = (i) => (i + 1) * RISER;
    const centre = (i) => H0 - TREAD * i - TREAD * 0.5 - 0.02;
    // front face (+z), either side of the stair
    for (let i = 0; i < 8; i += 1) {
      const groups = 1 + Math.floor(r() * 2);
      for (let g = 0; g < groups; g += 1) {
        const side = r() < 0.5 ? -1 : 1;
        const x0 = side * (SW / 2 + 0.9 + r() * Math.max(0.1, centre(i) - SW / 2 - 3.2));
        const cnt = 2 + Math.floor(r() * 3);
        for (let j = 0; j < cnt; j += 1) {
          const x = x0 + side * j * 0.5;
          if (Math.abs(x) < SW / 2 + 0.6 || Math.abs(x) > centre(i)) continue;
          id += 1;
          out.push(<Person key={`f${id}`} seated p={[x, tierTop(i), centre(i)]} r={(r() - 0.5) * 0.3} c={CLOTH[Math.floor(r() * CLOTH.length)]} c2={r() < 0.5 ? '#2a2a34' : '#3a4a6a'} />);
        }
      }
    }
    // right flank (+x)
    for (let i = 1; i < 7; i += 1) {
      const cnt = 1 + Math.floor(r() * 2);
      for (let j = 0; j < cnt; j += 1) {
        const z = (r() - 0.5) * 2 * (centre(i) - 1.5);
        id += 1;
        out.push(<Person key={`r${id}`} seated p={[centre(i), tierTop(i), z]} r={Math.PI / 2} c={CLOTH[Math.floor(r() * CLOTH.length)]} />);
      }
    }
    // left flank (-x), away from the side stair
    for (let i = 1; i < 6; i += 1) {
      const z = -2.5 - r() * (centre(i) - 3.5);
      id += 1;
      out.push(<Person key={`l${id}`} seated p={[-centre(i), tierTop(i), z]} r={-Math.PI / 2} c={CLOTH[Math.floor(r() * CLOTH.length)]} />);
    }
    // a few on the top platform and the stair
    [[-3.3, 3.2, 0.2], [3.2, 3.4, -0.3], [-3.4, -1.0, -1.57], [3.5, 0.6, 1.57], [-1.0, 2.9, 0.0]].forEach(([x, z, rot], k) => {
      out.push(<Person key={`t${k}`} seated p={[x, TOP, z]} r={rot} c={CLOTH[(k * 3 + 1) % CLOTH.length]} />);
    });
    return <group>{out}</group>;
  }

  /* ---------- the nine-tier plinth with its broad central stair and a narrow side stair ---------- */
  function Plinth9() {
    const M = useM();
    const out = [];
    for (let i = 0; i < TIERS; i += 1) {
      const half = H0 - TREAD * i;
      out.push(<Box key={`t${i}`} s={[half * 2, RISER, half * 2]} p={[0, RISER * i + RISER / 2, 0]} m={bricks(half * 1.1, 0.9, ['#f6e8de', '#ffffff', '#f8ece2', '#ffffff', '#f6e8de', '#ffffff', '#f8ece2', '#ffffff', '#f6e8de'][i])} />);
    }
    // broad central stair, 18 slim steps
    const stair = bricks(2, 0.8, '#ffffff');
    for (let k = 0; k < STEPS; k += 1) {
      const fz = H0 + 0.02 - SRUN * k;
      out.push(<Box key={`s${k}`} s={[SW, SRISE + 0.012, SRUN]} p={[0, (k + 0.5) * SRISE + 0.006, fz - SRUN / 2]} m={stair} cast={false} />);
    }
    // cheek walls beside the stair
    const slope = Math.atan2(TOP, H0 - HTOP + 0.02);
    const L = Math.hypot(TOP, H0 - HTOP + 0.02);
    [-1, 1].forEach((s) => {
      out.push(<Box key={`ch${s}`} s={[0.7, 0.7, L]} p={[s * (SW / 2 + 0.35), TOP / 2 + 0.25, (H0 + HTOP) / 2]} r={[slope, 0, 0]} m={bricks(1, 8, '#f4e6dc')} />);
    });
    // narrow side stair on the left (-x) flank with a metal handrail
    const metal = M.plain('#6d7075', { roughness: 0.5, metalness: 0.6 });
    const side = [];
    const SWd = 1.3; const ZC = 3.2;
    for (let k = 0; k < STEPS; k += 1) {
      const fz = H0 + 0.02 - SRUN * k;
      side.push(<Box key={`ss${k}`} s={[SWd, SRISE + 0.012, SRUN]} p={[ZC, (k + 0.5) * SRISE + 0.006, fz - SRUN / 2]} m={stair} cast={false} />);
    }
    [-1, 1].forEach((s) => {
      for (let k = 0; k < STEPS; k += 3) {
        const fz = H0 + 0.02 - SRUN * k - SRUN / 2;
        side.push(<Box key={`sp${s}${k}`} s={[0.05, 0.75, 0.05]} p={[ZC + s * (SWd / 2 + 0.05), (k + 1) * SRISE + 0.37, fz]} m={metal} cast={false} />);
      }
      side.push(<Box key={`sr${s}`} s={[0.05, 0.05, L]} p={[ZC + s * (SWd / 2 + 0.05), TOP / 2 + 0.78, (H0 + HTOP) / 2]} r={[slope, 0, 0]} m={metal} cast={false} />);
    });
    const rail = M.plain('#8a4a2a', { roughness: 0.6, metalness: 0.4 });
    [[-H0 - 0.4, -2.6], [2.6, 3.6]].forEach(([xa, xb], q) => {
      const zr = H0 + 1.0; const len = xb - xa;
      out.push(<Box key={`rl${q}a`} s={[len, 0.05, 0.05]} p={[(xa + xb) / 2, 0.85, zr]} m={rail} cast={false} />);
      out.push(<Box key={`rl${q}b`} s={[len, 0.05, 0.05]} p={[(xa + xb) / 2, 0.45, zr]} m={rail} cast={false} />);
      for (let x = xa; x <= xb + 0.01; x += 0.9) out.push(<Box key={`rp${q}${x}`} s={[0.06, 0.9, 0.06]} p={[x, 0.45, zr]} m={rail} cast={false} />);
    });
    out.push(<group key="side" rotation={[0, -Math.PI / 2, 0]}>{side}</group>);
    return <group>{out}</group>;
  }

  /* ---------- Main ---------- */
  function MajuMain() {
    const M = useM();
    return (
      <group>
        <Plinth9 />
        <Tower y0={TOP} RW={[8, 5.8, 4.2]} RH={[2.6, 2.2, 1.9]} HALF={[2.6, 1.9, 1.35]} WALLH={[3.0, 1.7, 1.5]} nStrut={[10, 8, 6]} posts={7} gj={1.75} light />
        <pointLight position={[0, TOP + 1.2, 1.5]} intensity={2.2} distance={9} color="#ffb060" />
        <Seated />
        <group position={[5.2, 0, 9.9]} scale={1.8}><Kamadev /></group>
        {/* Krishna Narayan: smaller red-tile pagoda behind and to the right of Kamadev */}
        <group position={[10.2, 0, 4.5]}>
          <Box s={[3.0, 0.22, 3.0]} p={[0, 0.11, 0]} m={bricks(3, 0.4, '#f4e6dc')} />
          <Box s={[2.6, 0.22, 2.6]} p={[0, 0.33, 0]} m={bricks(3, 0.4, '#ffffff')} />
          <Tower y0={0.44} RW={[3.2, 2.35, 1.35]} RH={[0.95, 0.8, 0.5]} HALF={[1.15, 0.8, 0.45]} WALLH={[1.3, 0.8, 0.4]} nStrut={[6, 5, 3]} posts={5} sag={1.3} gs={0.6} cellaK={0.4} gj={0.9} />
          <Person p={[-1.3, 0.44, 1.5]} c="#c8402f" />
          <Person p={[1.1, 0.44, 1.6]} c="#2e5f8f" seated />
        </group>
        <Frame s={[17, 18.6, 19]} p={[0, 9.3, 1]} />
      </group>
    );
  }

  /* ---------- Env: plaza, rickshaws, tall townhouses on the far side ---------- */
  function useFacades() {
    return useMemo(() => {
      const cache = new Map();
      const make1 = (kind, floors, cols, seed = 1) => {
        const key = `${kind}|${floors}|${cols}|${seed}`;
        if (cache.has(key)) return cache.get(key);
        let tex = null;
        if (typeof document !== 'undefined') {
          const FH = 100; const CW = 72;
          const c = document.createElement('canvas');
          c.width = cols * CW; c.height = floors * FH;
          const g = c.getContext('2d');
          const r = rng(seed * 977 + floors * 31 + cols);
          const W = c.width; const H = c.height;
          const brickFill = (y0, h) => {
            g.fillStyle = '#ad4e2e'; g.fillRect(0, y0, W, h);
            g.fillStyle = 'rgba(235,205,185,0.22)';
            for (let y = y0; y < y0 + h; y += 7) g.fillRect(0, y, W, 1);
            for (let y = y0; y < y0 + h; y += 14) for (let x = (Math.floor(y / 14) % 2) * 9; x < W; x += 18) g.fillRect(x, y, 1, 7);
          };
          if (kind === 'brick') brickFill(0, H);
          else if (kind === 'plaster') { g.fillStyle = '#e8dcc2'; g.fillRect(0, 0, W, H - FH); brickFill(H - FH, FH); } else { g.fillStyle = '#cdc8bd'; g.fillRect(0, 0, W, H); }
          for (let f = 0; f < floors; f += 1) {
            const y0 = f * FH;
            const ground = f === floors - 1;
            if (kind === 'concrete') {
              g.fillStyle = '#a9a498'; g.fillRect(0, y0, W, 5);
              for (let i = 0; i < cols; i += 1) {
                const cx = i * CW + CW / 2;
                const lit = r() < 0.06;
                g.fillStyle = '#8d8a80'; g.fillRect(cx - 28, y0 + 22, 56, 56);
                g.fillStyle = lit ? '#ffd48a' : '#3f4c58'; g.fillRect(cx - 25, y0 + 25, 50, 50);
                g.fillStyle = '#8d8a80'; g.fillRect(cx - 1, y0 + 25, 2, 50);
              }
              continue;
            }
            g.fillStyle = '#5a3418'; g.fillRect(0, y0, W, 5);
            if (ground) {
              g.fillStyle = '#4a2d1a'; g.fillRect(W * 0.08, y0 + 24, W * 0.84, 60);
              g.fillStyle = '#1b0f08'; g.fillRect(W * 0.08 + 5, y0 + 30, W * 0.84 - 10, 54);
              if (r() < 0.6) { g.fillStyle = '#ffcf80'; g.fillRect(W * 0.3, y0 + 40, W * 0.18, 30); }
              continue;
            }
            for (let i = 0; i < cols; i += 1) {
              const cx = i * CW + CW / 2;
              const lit = r() < 0.05;
              g.fillStyle = '#4a2d1a'; g.fillRect(cx - 24, y0 + 20, 48, 60);
              g.fillStyle = lit ? '#ffc870' : '#150b06'; g.fillRect(cx - 19, y0 + 25, 38, 50);
              g.fillStyle = '#8f5a2c';
              for (let x = cx - 18; x < cx + 19; x += 6) g.fillRect(x, y0 + 25, 2, 50);
              g.fillStyle = '#4a2d1a'; g.fillRect(cx - 28, y0 + 80, 56, 5);
            }
          }
          tex = new THREE.CanvasTexture(c);
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = 4;
        }
        const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92, color: tex ? '#ffffff' : '#b0502f' });
        cache.set(key, m);
        return m;
      };
      return make1;
    }, []);
  }

  function pave(rep, base) {
    let tex = null;
    if (typeof document !== 'undefined') {
      const c = document.createElement('canvas'); c.width = 256; c.height = 256;
      const g = c.getContext('2d');
      g.fillStyle = base; g.fillRect(0, 0, 256, 256);
      const r = rng(7);
      for (let y = 0; y < 4; y += 1) for (let x = 0; x < 4; x += 1) { g.fillStyle = `rgba(${r() < 0.5 ? '255,250,240' : '60,50,40'},${0.04 + r() * 0.07})`; g.fillRect(x * 64, y * 64, 64, 64); }
      g.fillStyle = 'rgba(70,62,52,0.55)';
      for (let i = 0; i < 4; i += 1) { g.fillRect(i * 64, 0, 2, 256); g.fillRect(0, i * 64, 256, 2); }
      tex = new THREE.CanvasTexture(c);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(rep, rep); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    }
    return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, color: tex ? '#ffffff' : base });
  }

  function Townhouse({ p, r = 0, w = 4.4, d = 4, floors = 5, kind = 'brick', seed = 1, F, M }) {
    const fh = kind === 'concrete' ? 1.75 : 1.6;
    const h = floors * fh;
    const cols = Math.max(2, Math.round(w / 1.6));
    const front = F(kind, floors, cols, seed);
    const sideM = F(kind, floors, 2, seed + 3);
    const mats = [sideM, sideM, M.plain('#8a7a6a'), M.plain('#8a7a6a'), front, sideM];
    const tile = M.mat('roof', 3, 3, { color: '#a8482a' });
    const tin = M.plain(seed % 2 ? '#7f8a90' : '#8a5a48', { roughness: 0.7, metalness: 0.3 });
    return (
      <group position={p} rotation={[0, r, 0]}>
        <mesh position={[0, h / 2, 0]} material={mats} castShadow receiveShadow><boxGeometry args={[w, h, d]} /></mesh>
        {kind === 'concrete' ? (
          <>
            <Box s={[w + 0.2, 0.3, d + 0.2]} p={[0, h + 0.15, 0]} m={M.plain('#b3aea2')} cast={false} />
            <Cyl rt={0.5} h={0.8} p={[w * 0.25, h + 0.7, 0]} m={M.plain('#2b4a6a')} seg={10} />
          </>
        ) : (
          seed % 3 === 0 ? (
            <Roof w={w + 0.7} d={d + 0.7} h={0.8} y={h} m={tile} sag={1.1} lift={0.1} fascia={false} />
          ) : (
            <>
              <Box s={[w + 0.2, 0.25, d + 0.2]} p={[0, h + 0.12, 0]} m={M.plain('#aaa396')} cast={false} />
              {seed % 3 === 1 && <Box s={[w * 0.6, 0.55, d * 0.5]} p={[-w * 0.1, h + 0.5, 0]} m={tin} />}
              <Cyl rt={0.4} h={0.7} p={[w * 0.3, h + 0.6, d * 0.2]} m={M.plain('#3a4a5a')} seg={8} />
            </>
          )
        )}
      </group>
    );
  }

  function Rickshaw({ p, r = 0, c = '#d8a020' }) {
    const M = useM();
    const dark = M.plain('#2a2a2e', { roughness: 0.6 });
    const body = M.plain(c, { roughness: 0.7 });
    return (
      <group position={p} rotation={[0, r, 0]}>
        {[-0.5, 0.5].map((x) => <mesh key={x} position={[x, 0.33, -0.35]} rotation={[0, Math.PI / 2, 0]} material={dark}><torusGeometry args={[0.32, 0.025, 6, 16]} /></mesh>)}
        <mesh position={[0, 0.33, 1.0]} rotation={[0, Math.PI / 2, 0]} material={dark}><torusGeometry args={[0.32, 0.025, 6, 16]} /></mesh>
        <Box s={[0.8, 0.08, 1.9]} p={[0, 0.4, 0.3]} m={dark} cast={false} />
        <Box s={[0.74, 0.34, 0.55]} p={[0, 0.62, -0.15]} m={body} cast={false} />
        <Box s={[0.74, 0.5, 0.08]} p={[0, 0.92, -0.45]} m={body} cast={false} />
        <Box s={[0.9, 0.05, 0.8]} p={[0, 1.2, -0.2]} r={[-0.25, 0, 0]} m={M.plain('#2e5f8f')} cast={false} />
        <Box s={[0.05, 0.6, 0.05]} p={[0, 0.7, 1.0]} m={dark} cast={false} />
        <Box s={[0.7, 0.05, 0.05]} p={[0, 1.0, 1.0]} m={dark} cast={false} />
      </group>
    );
  }

  function Lamp({ p }) {
    const M = useM();
    return (
      <group position={p}>
        <Cyl rt={0.07} rb={0.1} h={3.6} p={[0, 1.8, 0]} m={M.plain('#3a3d42', { roughness: 0.6 })} seg={8} />
        <Box s={[0.5, 0.1, 0.1]} p={[0.2, 3.6, 0]} m={M.plain('#3a3d42')} cast={false} />
        <Ball rad={0.16} p={[0.45, 3.5, 0]} m={M.plain('#fff0c0', { emissive: '#ffb860', emissiveIntensity: 1.6 })} />
      </group>
    );
  }

  function MajuEnv() {
    const M = useM();
    const F = useFacades();
    const paveFar = useMemo(() => pave(64, '#a39b8e'), []);
    const paveNear = useMemo(() => pave(14, '#b3ab9d'), []);
    const out = [];
    const r = rng(5);
    const haze = useMemo(() => {
      let tex = null;
      if (typeof document !== 'undefined') {
        const c = document.createElement('canvas'); c.width = 4; c.height = 128;
        const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 128, 0, 0);
        gr.addColorStop(0, 'rgba(225,222,214,0.55)'); gr.addColorStop(0.45, 'rgba(210,214,216,0.3)'); gr.addColorStop(1, 'rgba(200,210,220,0)');
        g.fillStyle = gr; g.fillRect(0, 0, 4, 128);
        tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
      }
      return new THREE.MeshStandardMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.BackSide, roughness: 1, fog: false });
    }, []);
    out.push(<mesh key="haze" position={[0, 14, 0]} material={haze}><cylinderGeometry args={[95, 95, 36, 40, 1, true]} /></mesh>);
    // paved plaza: grey-beige stone slabs, a darker apron near the plinth
    out.push(<mesh key="g" rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.012, 0]} receiveShadow material={paveFar}><circleGeometry args={[64, 64]} /></mesh>);
    out.push(<mesh key="far" rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]} material={M.plain('#9d9588', { roughness: 1 })}><circleGeometry args={[140, 32]} /></mesh>);
    // backdrop: irregular Newar houses, 3 to 6 floors, mostly behind; open plaza on the +x and +z sides
    const kinds = ['brick', 'brick', 'plaster', 'brick', 'concrete', 'brick', 'plaster', 'concrete'];
    let i = 0;
    const row = (z0, xa, xb, jit) => {
      let x = xa;
      while (x < xb) {
        const w = 5.4 + r() * 3.4;
        const k = kinds[Math.floor(r() * kinds.length)];
        const fl = k === 'concrete' ? 4 + Math.floor(r() * 2) : 3 + Math.floor(r() * 3);
        out.push(<Townhouse key={`b${i}`} p={[x + w / 2, 0, z0 + (r() - 0.5) * jit]} r={(r() - 0.5) * 0.1} w={w} d={5 + r() * 1.5} floors={fl} kind={k} seed={i + 1} F={F} M={M} />);
        x += w + 0.2 + r() * 1.2; i += 1;
        if (r() < 0.18) x += 3.5;
      }
    };
    row(-38, -44, 44, 3);
    row(-46, -50, 50, 3);
    // two houses closing the far left corner only
    [[-34, -22], [-35, -14]].forEach(([x, z], q) => out.push(<Townhouse key={`l${q}`} p={[x, 0, z]} r={Math.PI / 2} w={6.4} d={5} floors={3 + q} kind={q ? 'brick' : 'plaster'} seed={40 + q} F={F} M={M} />));
    // distant red-tile pagoda silhouettes of the Durbar Square neighbours
    [[-30, -20, 0.2, 2.2], [31, -25, -0.3, 2.6]].forEach(([x, z, rot, sc], k) => {
      out.push(
        <group key={`pg${k}`} position={[x, 0, z]} rotation={[0, rot, 0]} scale={sc}>
          <Box s={[3.6, 0.3, 3.6]} p={[0, 0.15, 0]} m={bricks(3, 0.4, '#e8d0c4')} />
          <Box s={[3.0, 0.3, 3.0]} p={[0, 0.45, 0]} m={bricks(3, 0.4, '#ffffff')} />
          <Tower y0={0.6} RW={[3.6, 2.8, 2.0]} RH={[1.0, 0.9, 0.8]} HALF={[1.2, 0.9, 0.65]} WALLH={[1.2, 0.8, 0.7]} nStrut={[5, 4, 3]} posts={5} gs={0.7} cellaK={0.5} gj={1.0} />
        </group>,
      );
    });
    // overhead wires on poles
    const pole = M.plain('#4a4d52', { roughness: 0.7 });
    const poles = [[-24, 6], [-12, -8], [2, -12], [16, -10], [28, -2]];
    poles.forEach(([x, z], k) => {
      out.push(<Cyl key={`po${k}`} rt={0.1} rb={0.16} h={7.5} p={[x, 3.75, z]} m={pole} seg={6} />);
      out.push(<Box key={`pa${k}`} s={[1.8, 0.1, 0.1]} p={[x, 7.2, z]} m={pole} cast={false} />);
      if (k < poles.length - 1) {
        const [x2, z2] = poles[k + 1];
        const len = Math.hypot(x2 - x, z2 - z); const ang = Math.atan2(x2 - x, z2 - z);
        [0, 1, 2].forEach((q) => out.push(<Box key={`wi${k}${q}`} s={[0.025, 0.025, len]} p={[(x + x2) / 2, 6.9 - q * 0.05, (z + z2) / 2]} r={[0, ang, 0]} m={M.dark} cast={false} />));
      }
    });
    // rickshaws parked on the plaza
    [[-6, 13.5, 0.2, '#d8a020'], [-3.2, 15, -0.3, '#c8402f'], [1, 16.5, 0.1, '#3a7d44'], [8, 15, 1.4, '#2e5f8f'], [-10, 18, 3.0, '#e07a2a'], [5, 20, -0.2, '#d8a020'], [14, 12, 1.2, '#c8402f'], [-14, 11, 1.7, '#3a7d44']].forEach(([x, z, rot, c], k) => {
      out.push(<Rickshaw key={`rk${k}`} p={[x, 0, z]} r={rot} c={c} />);
    });
    // people on the plaza, some under umbrellas
    for (let k = 0; k < 16; k += 1) {
      const x = -16 + r() * 34; const z = 11 + r() * 14;
      out.push(<Person key={`pp${k}`} p={[x, 0, z]} r={r() * 6} c={CLOTH[k % CLOTH.length]} />);
      if (k % 3 === 0) out.push(<Person key={`pq${k}`} p={[x + 0.4, 0, z + 0.2]} r={r() * 6} c={CLOTH[(k + 4) % CLOTH.length]} />);
    }
    [[-8, 16.5, '#c8402f'], [4, 18, '#2e5f8f'], [10, 13.5, '#e0b040']].forEach(([x, z, c], k) => {
      out.push(
        <group key={`um${k}`} position={[x, 0, z]}>
          <Cyl rt={0.025} h={1.5} p={[0, 0.75, 0]} m={M.dark} seg={6} />
          <mesh position={[0, 1.55, 0]} material={M.plain(c)} castShadow><coneGeometry args={[0.75, 0.3, 10]} /></mesh>
          <Person p={[0.2, 0, 0]} c="#f0efe9" />
        </group>,
      );
    });
    [[-9, 10], [11, 22], [-18, 20], [20, 6]].forEach(([x, z], k) => out.push(<Lamp key={`lp${k}`} p={[x, 0, z]} />));
    return <group>{out}</group>;
  }

  return { 'maju-dega': { Main: MajuMain, Env: MajuEnv } };
}
