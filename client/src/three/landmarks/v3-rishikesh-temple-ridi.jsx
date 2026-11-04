/* Rishikesh Temple, Ridi (Ruru Kshetra), Lumbini Province.
   A low rural COURTYARD complex (not a pagoda): a flagstone court (~30 x 25 m) on a terrace above the Kali Gandaki ghats, entered up
   stone steps through a whitewashed gate-passage; a two-storey red-brick range with open timber arcade and long frames of hanging brass
   bells on the west side; ochre domed shrines on red bases; a white stone bell gateway; a red-roofed open pavilion; a small tiled
   sanctum at the rear (-z) and a yellow two-storey building. Below: stony Kali Gandaki, Ridi Khola joining from the left, steep green
   hills and brick-and-timber village houses. Structure is read from five photographs (no survey): sizes are estimates.
   Unit: 1 u is about 2.5 m. Front / entrance = +z. */
export default function make(K) {
  const { useM, Box, Cyl, Ball, Frame, Tree, Diyo, THREE, useMemo, useEffect } = K;

  const rn = (i) => { const v = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return v - Math.floor(v); };
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const mix = (a, b, t) => a + (b - a) * t;
  const vn = (u, v) => {
    const iu = Math.floor(u), iv = Math.floor(v), fu = u - iu, fv = v - iv;
    const a = rn(iu * 57 + iv * 131), b = rn((iu + 1) * 57 + iv * 131), c = rn(iu * 57 + (iv + 1) * 131), d = rn((iu + 1) * 57 + (iv + 1) * 131);
    const su = fu * fu * (3 - 2 * fu), sv = fv * fv * (3 - 2 * fv);
    return mix(mix(a, b, su), mix(c, d, su), sv);
  };

  /* ---------- palette ---------- */
  const PALS = new WeakMap();
  const pal = (M) => {
    if (!PALS.has(M)) {
      PALS.set(M, {
        brk: (w, h) => M.mat('brick', Math.max(1, Math.round(w * 1.2)), Math.max(1, Math.round(h * 1.2)), { color: '#ffd6bf' }),
        brkPl: M.mat('brick', 6, 1, { color: '#ffc8ad' }),
        timber: M.plain('#3f2819', { roughness: 0.85 }),
        timberLt: M.plain('#6b4128', { roughness: 0.85 }),
        red: M.plain('#a5322a', { roughness: 0.85 }),
        redDeep: M.plain('#8a2a24', { roughness: 0.85 }),
        ochre: M.plain('#d9a020', { roughness: 0.8 }),
        ochreLt: M.plain('#e4b438', { roughness: 0.8 }),
        yellowBldg: M.plain('#e5b94a', { roughness: 0.9 }),
        poleY: M.plain('#f0dc8a', { roughness: 0.85 }),
        cream: M.plain('#f4efe3', { roughness: 0.85 }),
        pave: M.plain('#9a9184', { roughness: 0.95 }),
        stoneWall: M.plain('#a69d8e', { roughness: 0.95 }),
        tile: M.mat('roof', 5, 2, { color: '#ecc0a6' }),
        tin: M.plain('#8f989a', { roughness: 0.5, metalness: 0.35 }),
        pavRoof: M.plain('#7a3a30', { roughness: 0.9 }),
        brass: M.plain('#cb9a2e', { roughness: 0.35, metalness: 0.7 }),
        earth: M.plain('#8e7a5c', { roughness: 1 }),
        black: M.plain('#1c1a19', { roughness: 0.9 }),
        gravel: M.plain('#d3cec1', { roughness: 1 }),
        slab: M.plain('#3a3633', { roughness: 0.9 }),
        grey: M.plain('#8d887f', { roughness: 0.9 }),
        water: M.plain('#5d9a93', { roughness: 0.25, metalness: 0.1 }),
      });
    }
    return PALS.get(M);
  };

  /* ---------- dusk glow (windows, lamps) ---------- */
  const GLOW = [];
  const GLOW_CACHE = {};
  const LIGHTS = new Set();
  let DUSK = false;
  const glowMat = (key, color, emissive, day, dusk) => {
    if (!GLOW_CACHE[key]) {
      const mat = new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: DUSK ? dusk : day, roughness: 0.5 });
      GLOW_CACHE[key] = mat;
      GLOW.push({ mat, day, dusk });
    }
    return GLOW_CACHE[key];
  };
  function GlowDriver() {
    useEffect(() => {
      let last = null;
      const tick = () => {
        let d = false;
        try { d = Array.from(document.querySelectorAll('.model-tools .chip.on')).some((e) => /dusk/i.test(e.textContent)); } catch (e) { d = false; }
        if (d !== last) {
          last = d; DUSK = d;
          GLOW.forEach((g) => { g.mat.emissiveIntensity = d ? g.dusk : g.day; });
          LIGHTS.forEach((l) => { if (!l.parent) LIGHTS.delete(l); else l.intensity = d ? l.userData.on : 0; });
        }
      };
      tick();
      const id = setInterval(tick, 300);
      return () => clearInterval(id);
    }, []);
    return null;
  }
  function DuskLight({ p, i = 2, d = 7, c = '#ffb255' }) {
    return <pointLight ref={(l) => { if (l) { l.userData.on = i; l.intensity = DUSK ? i : 0; LIGHTS.add(l); } }} position={p} intensity={0} distance={d} color={c} />;
  }

  /* ---------- terrain (shared by Env) ---------- */
  const streamX = (z) => -27 + 2.2 * Math.sin(z * 0.17);
  const yS = (z) => -2.7 + Math.max(0, 14 - z) * 0.22;
  const tribX = (z) => -14 + 0.8 * Math.sin(z * 0.6);
  const tribY = (z) => -0.9 - 1.4 * sm(1, 12, z);
  function T0(x, z) {
    const dxs = Math.max(Math.abs(x) - 9, 0), back = Math.max(-8 - z, 0), front = Math.max(z - 5.5, 0);
    const sideF = 1 - sm(4, 24, z);
    let rise = 0.28 * Math.pow(dxs, 1.2) * sideF + 0.4 * Math.pow(back, 1.12);
    rise = 22 * Math.tanh(rise / 22);
    let h = -0.35 + rise - Math.min(2.4, front * 1.2);
    h += ((vn(x * 0.09 + 3, z * 0.09) - 0.5) * 4 + (vn(x * 0.3, z * 0.3) - 0.5) * 1.2) * Math.min(1, rise / 4);
    h += 0.9 * Math.pow(Math.max(0, z - 38), 1.12);
    if (z > 7.5) {
      const bed = -3.25 + 0.75 * Math.pow(vn(x * 0.1 + 9, z * 0.17), 1.4);
      h = mix(h, bed, sm(-1.9, -2.5, h));
    }
    if (z < 16 && z > -40) {
      const dist = Math.abs(x - streamX(z));
      const c = 1 - sm(1.2, 5, dist);
      const target = yS(z) + dist * dist * 0.18;
      h = h * (1 - c) + Math.min(h, target) * c;
    }
    if (z > 0 && z < 14) {
      const dt = Math.abs(x - tribX(z));
      const c2 = 1 - sm(1, 4, dt);
      h = h * (1 - c2) + Math.min(h, tribY(z) - 0.1 + dt * dt * 0.25) * c2;
    }
    return h;
  }

  /* ---------- village houses ---------- */
  const HOUSE_SRC = [
    /* back terraced row */
    [-8, -12.2, 2.6, 2.1, 2.3, 1, 0, 0], [-5.3, -12.2, 2.6, 2.1, 2.3, 2, 0, 1], [-2.6, -12.2, 2.6, 2.1, 2.3, 1, 0, 0], [0.1, -12.2, 2.6, 2.1, 2.3, 0, 0, 1], [2.8, -12.2, 2.6, 2.1, 2.3, 1, 0, 0], [5.5, -12.2, 2.6, 2.1, 2.3, 2, 0, 0],
    [-10, -17, 2.6, 2.1, 2.3, 1, 0, 1], [-7.3, -17, 2.6, 2.1, 1.5, 0, 0, 0], [-4.6, -17, 2.6, 2.1, 2.3, 2, 0, 0], [4, -17.5, 2.6, 2.1, 2.3, 1, 0, 0], [6.7, -17.5, 2.6, 2.1, 1.5, 3, 0, 0], [9.4, -17.5, 2.6, 2.1, 2.3, 1, 0, 0],
    [-2, -22.5, 2.6, 2.1, 1.5, 0, 0, 0], [2.5, -22.5, 2.6, 2.1, 2.3, 1, 0, 0],
    /* left terraced cluster */
    [-17.5, -9, 2.5, 2.1, 2.3, 1, 0.15, 0], [-17.5, -6, 2.5, 2.1, 2.3, 2, 0.15, 1], [-17.5, -3, 2.5, 2.1, 2.3, 1, 0.15, 0],
    [-21.5, -8, 2.5, 2.1, 1.5, 0, 0.15, 0], [-21.5, -5, 2.5, 2.1, 2.3, 1, 0.15, 0], [-21.5, -2, 2.5, 2.1, 1.5, 2, 0.15, 0], [-21.5, 1, 2.5, 2.1, 2.3, 1, 0.15, 0],
    /* right terraced cluster */
    [12.2, -9, 2.5, 2.1, 2.3, 1, -0.15, 0], [12.2, -6, 2.5, 2.1, 2.3, 2, -0.15, 0], [12.2, -3, 2.5, 2.1, 2.3, 1, -0.15, 1], [12.2, 0, 2.5, 2.1, 1.5, 0, -0.15, 0], [12.2, 3, 2.5, 2.1, 2.3, 1, -0.15, 0],
    [16.2, -10, 2.5, 2.1, 2.3, 1, -0.15, 0], [16.2, -7, 2.5, 2.1, 1.5, 3, -0.15, 0], [16.2, -4, 2.5, 2.1, 2.3, 2, -0.15, 0], [16.2, -1, 2.5, 2.1, 2.3, 1, -0.15, 0],
    /* far bank */
    [-8, 46, 2.4, 2, 1.5, 0, 0, 0], [4, 48, 2.6, 2.2, 1.5, 2, 0, 0], [14, 45.5, 2.4, 2, 2.3, 1, 0, 0], [26, 47, 2.6, 2, 1.5, 3, 0, 0],
  ];


  const HOUSES = HOUSE_SRC.map(([x0, z0, w0, d0, ht0, k, r0, a], i) => {
    const far = z0 > 30;
    const x = x0 + (far ? 0 : (rn(i * 4.7 + 2) - 0.5) * 2.2), z = z0 + (far ? 0 : (rn(i * 6.3 + 5) - 0.5) * 2.2);
    const w = w0 * (0.78 + rn(i * 2.9 + 1) * 0.6), d = d0 * (0.85 + rn(i * 3.7 + 3) * 0.4);
    const ht = ht0 * (0.88 + rn(i * 5.1 + 7) * 0.42), r = r0 + (rn(i * 8.3) - 0.5) * 0.14;
    return { x, z, w, d, ht, k, r, a, rh: 0.32 + rn(i * 1.3 + 9) * 0.6, i, yTop: T0(x, z) + 0.05, yLo: T0(x, z) - 0.6 };
  });
  function T(x, z) {
    let h = T0(x, z);
    if (z < -9 || z > 40 || Math.abs(x) > 8) {
      for (let i = 0; i < HOUSES.length; i += 1) {
        const q = HOUSES[i];
        const e = Math.max(Math.abs(x - q.x) / (q.w / 2 + 0.7), Math.abs(z - q.z) / (q.d / 2 + 0.7));
        if (e < 2.2) h = mix(h, q.yTop - 0.04, 1 - sm(1, 2.2, e));
      }
    }
    return h;
  }

  /* ---------- parts ---------- */
  function HipRoof({ w, d, h, y = 0, m, p = [0, 0, 0] }) {
    const rot = d > w;
    const W = rot ? d : w, D = rot ? w : d;
    const geo = useMemo(() => {
      const r = Math.max(0, W - D), hw = W / 2, hd = D / 2;
      const A = [-hw, 0, -hd], B = [hw, 0, -hd], C = [hw, 0, hd], Dd = [-hw, 0, hd], R1 = [-r / 2, h, 0], R2 = [r / 2, h, 0];
      const tris = [[Dd, C, R2], [Dd, R2, R1], [B, A, R1], [B, R1, R2], [A, Dd, R1], [C, B, R2], [A, B, C], [A, C, Dd]];
      const pos = [], uv = [];
      tris.forEach((t) => t.forEach((v) => { pos.push(v[0], v[1], v[2]); uv.push(v[0] * 0.7 + v[2] * 0.2, (v[2] * 0.6 + v[1] * 1.8) * 0.7); }));
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.computeVertexNormals();
      return g;
    }, [W, D, h]);
    return <mesh geometry={geo} material={m} position={[p[0], p[1] + y, p[2]]} rotation={[0, rot ? Math.PI / 2 : 0, 0]} castShadow receiveShadow />;
  }

  function Win({ p, w = 0.6, h = 0.5 }) {
    const M = useM(); const P = pal(M);
    const glow = glowMat('win', '#241810', '#ff9a3c', 0, 1.7);
    return (
      <group position={p}>
        <Box s={[w + 0.14, h + 0.14, 0.05]} m={P.timberLt} cast={false} />
        <Box s={[w, h, 0.07]} p={[0, 0, 0.005]} m={glow} cast={false} />
        {[-w / 4, w / 4].map((x, i) => <Box key={i} s={[0.04, h, 0.09]} p={[x, 0, 0]} m={P.timber} cast={false} />)}
        <Box s={[w, 0.04, 0.09]} p={[0, 0, 0]} m={P.timber} cast={false} />
      </group>
    );
  }

  /* two-storey red-brick range, open timber arcade below, lattice windows above, low hip tile roof; front = +z */
  function BrickRange({ W = 8.8, D = 2, n = 8 }) {
    const M = useM(); const P = pal(M);
    const bay = W / n, y0 = 0.3, h1 = 1.15, h2 = 1.0;
    const xs = Array.from({ length: n + 1 }, (_, i) => -W / 2 + i * bay);
    const yT = y0 + h1 + 0.1;
    return (
      <group>
        <Box s={[W + 0.3, 0.15, D + 1.5]} p={[0, 0.075, 0.55]} m={P.brkPl} />
        <Box s={[W + 0.2, 0.3, D + 0.7]} p={[0, 0.15, 0.15]} m={P.brkPl} />
        <Box s={[W, h1, 0.2]} p={[0, y0 + h1 / 2, -D / 2 + 0.1]} m={P.brk(W, h1)} />
        <Box s={[0.2, h1, D]} p={[-W / 2 + 0.1, y0 + h1 / 2, 0]} m={P.brk(D, h1)} />
        <Box s={[0.2, h1, D]} p={[W / 2 - 0.1, y0 + h1 / 2, 0]} m={P.brk(D, h1)} />
        {xs.map((x, i) => <Box key={'p' + i} s={[0.14, h1, 0.14]} p={[x, y0 + h1 / 2, D / 2 - 0.12]} m={P.timberLt} />)}
        <Box s={[W, 0.14, 0.2]} p={[0, y0 + h1 - 0.07, D / 2 - 0.12]} m={P.timber} />
        {Array.from({ length: n }, (_, i) => i).filter((i) => i % 2 === 0).map((i) => <Box key={'d' + i} s={[0.55, 0.85, 0.05]} p={[xs[i] + bay / 2, y0 + 0.45, -D / 2 + 0.22]} m={P.timber} cast={false} />)}
        <Box s={[W, 0.1, D]} p={[0, y0 + h1 + 0.05, 0]} m={P.timber} />
        <Box s={[W, h2, D]} p={[0, yT + h2 / 2, 0]} m={P.brk(W, h2)} />
        <Box s={[W + 0.12, 0.08, D + 0.12]} p={[0, yT, 0]} m={P.timber} />
        {Array.from({ length: n }, (_, i) => <Win key={'w' + i} p={[xs[i] + bay / 2, yT + h2 * 0.52, D / 2 + 0.03]} w={0.62} h={0.5} />)}
        {Array.from({ length: n }, (_, i) => <Box key={'s' + i} s={[0.8, 0.05, 0.12]} p={[xs[i] + bay / 2, yT + h2 * 0.52 - 0.34, D / 2 + 0.06]} m={P.timber} cast={false} />)}
        <HipRoof w={W + 0.6} d={D + 0.6} h={0.5} y={yT + h2} m={P.tile} />
        {[-1, 1].map((sg) => [-0.45, 0.45].map((z) => <group key={sg + '_' + z} position={[sg * (W / 2 + 0.03), yT + h2 * 0.52, z]} rotation={[0, sg * Math.PI / 2, 0]}><Win p={[0, 0, 0]} w={0.5} h={0.46} /></group>))}
        {Array.from({ length: n }, (_, i) => i).filter((i) => i % 2 === 1).map((i) => <mesh key={'ab' + i} geometry={bellGeo} material={P.brass} position={[xs[i] + bay / 2, y0 + h1 - 0.14 - 0.2, D / 2 - 0.12]} scale={0.8} castShadow />)}
        <Box s={[W + 0.6, 0.1, 0.06]} p={[0, yT + h2 - 0.02, D / 2 + 0.3]} m={P.timber} cast={false} />
        {[1, 3, 4, 6].map((i) => <group key={'rw' + i} position={[xs[i] + bay / 2, yT + h2 * 0.52, -D / 2 - 0.03]} rotation={[0, Math.PI, 0]}><Win p={[0, 0, 0]} w={0.6} h={0.5} /></group>)}
        {[1, 3, 6].map((i) => <group key={'rl' + i} position={[xs[i] + bay / 2, y0 + 0.65, -D / 2 - 0.03]} rotation={[0, Math.PI, 0]}><Win p={[0, 0, 0]} w={0.5} h={0.55} /></group>)}
        {[-1, 1].map((sg) => <group key={'sl' + sg} position={[sg * (W / 2 + 0.03), y0 + 0.65, 0]} rotation={[0, sg * Math.PI / 2, 0]}><Win p={[0, 0, 0]} w={0.5} h={0.55} /></group>)}
      </group>
    );
  }

  /* yellow-painted two-storey building with a low tin roof and small finials */
  function YellowBldg({ W = 4.2, D = 1.8 }) {
    const M = useM(); const P = pal(M);
    const h1 = 1.1, h2 = 0.95;
    const nb = 4, bay = W / nb;
    return (
      <group>
        <Box s={[W + 0.2, 0.25, D + 0.4]} p={[0, 0.125, 0.1]} m={P.stoneWall} />
        <Box s={[W, h1 + h2, D]} p={[0, 0.25 + (h1 + h2) / 2, 0]} m={P.yellowBldg} />
        <Box s={[W + 0.04, 0.35, D + 0.04]} p={[0, 0.425, 0]} m={P.red} />
        <Box s={[W + 0.1, 0.07, D + 0.1]} p={[0, 0.25 + h1, 0]} m={P.cream} />
        {Array.from({ length: nb }, (_, i) => (
          <group key={i}>
            <Win p={[-W / 2 + bay * (i + 0.5), 0.25 + h1 + h2 * 0.5, D / 2 + 0.03]} w={0.5} h={0.5} />
            <Win p={[-W / 2 + bay * (i + 0.5), 0.25 + h1 * 0.62, D / 2 + 0.03]} w={0.45} h={0.55} />
          </group>
        ))}
        <HipRoof w={W + 0.7} d={D + 0.7} h={0.5} y={0.25 + h1 + h2} m={P.tin} />
        {[-1, 1].map((s) => <Box key={s} s={[0.14, 0.2, 0.14]} p={[s * (W / 2 + 0.1), 0.25 + h1 + h2 + 0.1, D / 2 + 0.1]} m={P.ochre} />)}
        {[-1, 1].map((s) => <Ball key={'b' + s} rad={0.07} p={[s * (W / 2 + 0.1), 0.25 + h1 + h2 + 0.27, D / 2 + 0.1]} m={P.ochre} />)}
      </group>
    );
  }

  /* ochre dome on a low square red base, two short rings and a tiny finial */
  function DomeShrine({ p, s = 1, rot = 0 }) {
    const M = useM(); const P = pal(M);
    return (
      <group position={p} scale={s} rotation={[0, rot, 0]}>
        <Box s={[1.8, 0.16, 1.8]} p={[0, 0.08, 0]} m={P.stoneWall} />
        <Box s={[1.5, 0.6, 1.5]} p={[0, 0.46, 0]} m={P.red} />
        <Box s={[1.38, 0.36, 0.06]} p={[0, 0.4, 0.76]} m={P.redDeep} cast={false} />
        <Box s={[0.5, 0.45, 0.08]} p={[0, 0.4, 0.78]} m={P.black} cast={false} />
        <Box s={[1.62, 0.08, 1.62]} p={[0, 0.79, 0]} m={P.redDeep} />
        <Cyl rt={0.72} rb={0.72} h={0.1} p={[0, 0.88, 0]} m={P.ochre} seg={28} />
        <mesh position={[0, 0.93, 0]} scale={[1, 0.68, 1]} material={P.ochre} castShadow><sphereGeometry args={[0.72, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
        <Box s={[0.34, 0.14, 0.34]} p={[0, 1.47, 0]} m={P.ochreLt} />
        <Box s={[0.26, 0.1, 0.26]} p={[0, 1.59, 0]} m={P.ochre} />
        <Ball rad={0.04} p={[0, 1.68, 0]} m={P.brass} />
      </group>
    );
  }

  const bellGeo = (() => {
    const pts = [[0.0, 0.26], [0.03, 0.25], [0.05, 0.22], [0.07, 0.15], [0.09, 0.06], [0.115, 0.0], [0.11, -0.01], [0.0, -0.01]].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(pts, 14);
  })();
  function BellFrame({ L = 3.4, n = 5, n2 = 4 }) {
    const M = useM(); const P = pal(M);
    const H = 1.3;
    return (
      <group>
        {[-1, 1].map((s) => (
          <group key={s}>
            <Box s={[0.22, H, 0.22]} p={[s * L / 2, H / 2, 0]} m={P.poleY} />
            <Box s={[0.34, 0.14, 0.34]} p={[s * L / 2, 0.07, 0]} m={P.red} />
            <Box s={[0.14, 0.1, 0.5]} p={[s * L / 2, H - 0.08, -0.25]} m={P.poleY} />
          </group>
        ))}
        <Box s={[L + 0.4, 0.26, 0.26]} p={[0, H + 0.13, 0]} m={P.poleY} />
        <Box s={[L, 0.1, 0.1]} p={[0, H - 0.08, -0.5]} m={P.poleY} />
        {Array.from({ length: n }, (_, i) => {
          const x = -L / 2 + ((i + 1) * L) / (n + 1);
          return (
            <group key={i}>
              <Cyl rt={0.012} h={0.14} p={[x, H - 0.07, 0]} m={P.brass} seg={5} />
              <mesh geometry={bellGeo} material={P.brass} position={[x, H - 0.58, 0]} scale={1.8} castShadow />
              <Cyl rt={0.055} rb={0.055} h={0.3} p={[x, 0.29, -0.62]} m={P.brass} seg={8} />
              <Ball rad={0.065} p={[x, 0.5, -0.62]} m={P.brass} />
            </group>
          );
        })}
        {Array.from({ length: n2 }, (_, i) => {
          const x = -L / 2 + ((i + 1) * L) / (n2 + 1);
          return (
            <group key={'r' + i}>
              <Cyl rt={0.012} h={0.1} p={[x, H - 0.13, -0.5]} m={P.brass} seg={5} />
              <mesh geometry={bellGeo} material={P.brass} position={[x, H - 0.55, -0.5]} scale={1.6} castShadow />
            </group>
          );
        })}
        {[-L / 2 + 0.45, 0, L / 2 - 0.45].map((x, i) => (
          <group key={'f' + i}>
            <Cyl rt={0.055} rb={0.055} h={0.3} p={[x, 0.29, 0.6]} m={P.brass} seg={8} />
            <Ball rad={0.065} p={[x, 0.5, 0.6]} m={P.brass} />
          </group>
        ))}
      </group>
    );
  }

  /* white stone bell gateway: two posts, carved lozenge lintel, one bell */
  function BellGate({ p }) {
    const M = useM(); const P = pal(M);
    return (
      <group position={p}>
        {[-0.72, 0.72].map((x) => (
          <group key={x}>
            <Box s={[0.17, 1.15, 0.17]} p={[x, 0.58, 0]} m={P.cream} />
            <Box s={[0.26, 0.22, 0.26]} p={[x, 0.11, 0]} m={P.red} />
          </group>
        ))}
        <Box s={[1.78, 0.24, 0.2]} p={[0, 1.27, 0]} m={P.cream} />
        {Array.from({ length: 7 }, (_, i) => <Box key={i} s={[0.1, 0.1, 0.02]} p={[-0.6 + i * 0.2, 1.27, 0.105]} r={[0, 0, Math.PI / 4]} m={P.grey} cast={false} />)}
        <Box s={[0.2, 0.16, 0.16]} p={[0, 1.47, 0]} m={P.cream} />
        <Ball rad={0.07} p={[0, 1.61, 0]} m={P.cream} />
        <Cyl rt={0.008} h={0.3} p={[0, 1.0, 0]} m={P.black} seg={5} />
        <mesh geometry={bellGeo} material={P.brass} position={[0, 0.6, 0]} scale={1.6} castShadow />
      </group>
    );
  }

  /* open pavilion: red plinth, posts, pyramidal dull-red roof */
  function Pavilion({ p }) {
    const M = useM(); const P = pal(M);
    return (
      <group position={p}>
        <Box s={[3.0, 0.1, 3.0]} p={[0, 0.05, 0]} m={P.stoneWall} />
        <Box s={[2.8, 0.18, 2.8]} p={[0, 0.19, 0]} m={P.red} />
        <Box s={[2.4, 0.18, 2.4]} p={[0, 0.37, 0]} m={P.redDeep} />
        {[[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9], [0, 0.9], [0, -0.9]].map(([x, z], i) => <Box key={i} s={[0.13, 1.0, 0.13]} p={[x, 0.95, z]} m={P.timberLt} />)}
        <Box s={[2.1, 0.12, 0.16]} p={[0, 1.5, 0.9]} m={P.timber} />
        <Box s={[2.1, 0.12, 0.16]} p={[0, 1.5, -0.9]} m={P.timber} />
        <Box s={[0.16, 0.12, 2.1]} p={[0.9, 1.5, 0]} m={P.timber} />
        <Box s={[0.16, 0.12, 2.1]} p={[-0.9, 1.5, 0]} m={P.timber} />
        <HipRoof w={2.9} d={2.9} h={0.8} y={1.56} m={P.pavRoof} />
        <Ball rad={0.07} p={[0, 2.4, 0]} m={P.ochre} />
      </group>
    );
  }

  /* small single-storey tiled sanctum, double-eave hip roof */
  function Sanctum({ p }) {
    const M = useM(); const P = pal(M);
    return (
      <group position={p}>
        <Box s={[3.0, 0.14, 3.0]} p={[0, 0.07, 0]} m={P.brkPl} />
        <Box s={[2.7, 0.14, 2.7]} p={[0, 0.21, 0]} m={P.brkPl} />
        <Box s={[2.1, 0.95, 2.1]} p={[0, 0.775, 0]} m={P.cream} />
        <Box s={[2.12, 0.35, 2.12]} p={[0, 0.46, 0]} m={P.red} />
        <Box s={[0.8, 0.8, 0.06]} p={[0, 0.7, 1.07]} m={P.timber} cast={false} />
        <Box s={[0.9, 0.08, 0.1]} p={[0, 1.12, 1.07]} m={P.red} cast={false} />
        {[-0.5, 0.5].map((x) => <Box key={x} s={[0.08, 0.8, 0.1]} p={[x, 0.7, 1.08]} m={P.red} cast={false} />)}
        <HipRoof w={2.9} d={2.9} h={0.5} y={1.25} m={P.tile} />
        <Box s={[1.1, 0.5, 1.1]} p={[0, 1.78, 0]} m={P.cream} />
        <HipRoof w={1.7} d={1.7} h={0.4} y={2.0} m={P.tile} />
        <Cyl rt={0.05} h={0.22} p={[0, 2.5, 0]} m={P.ochre} seg={8} />
        <Ball rad={0.09} p={[0, 2.66, 0]} m={P.ochre} />
      </group>
    );
  }

  function Parapet({ L, ang = 0 }) {
    const M = useM(); const P = pal(M);
    const nP = Math.max(2, Math.round(L / 0.8));
    return (
      <group rotation={[ang, 0, 0]}>
        <Box s={[0.22, 0.5, L]} p={[0, 0.25, 0]} m={P.red} />
        <Box s={[0.28, 0.06, L]} p={[0, 0.53, 0]} m={P.cream} />
        {Array.from({ length: nP }, (_, i) => <Box key={i} s={[0.06, 0.3, 0.06]} p={[0, 0.7, -L / 2 + 0.1 + (i * (L - 0.2)) / (nP - 1)]} m={P.cream} cast={false} />)}
        <Box s={[0.07, 0.06, L]} p={[0, 0.86, 0]} m={P.cream} cast={false} />
      </group>
    );
  }

  function Person({ p, col = '#e0761c', s = 1 }) {
    const M = useM();
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.08} rb={0.13} h={0.45} p={[0, 0.23, 0]} m={M.plain(col)} seg={8} />
        <Ball rad={0.085} p={[0, 0.56, 0]} m={M.plain('#8a5a3c')} />
      </group>
    );
  }
  function Cow({ p, r = 0 }) {
    const M = useM(); const P = pal(M);
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[0.7, 0.3, 0.26]} p={[0, 0.4, 0]} m={P.black} />
        <Box s={[0.22, 0.2, 0.2]} p={[0.42, 0.5, 0]} m={P.black} />
        {[[-0.28, -0.08], [-0.28, 0.08], [0.28, -0.08], [0.28, 0.08]].map(([x, z], i) => <Box key={i} s={[0.06, 0.28, 0.06]} p={[x, 0.14, z]} m={P.black} />)}
      </group>
    );
  }

  /* ---------- MAIN ---------- */
  const DR = 0.27 / 0.6; // stair slope
  function RishikeshMain() {
    const M = useM(); const P = pal(M);
    const ang = Math.atan(DR);
    const gSteps = Array.from({ length: 9 }, (_, i) => i);
    return (
      <group>
        <GlowDriver />
        {/* terrace: stone retaining body and flagstone court */}
        <Box s={[12.8, 2.46, 10.5]} p={[0, -1.27, -0.15]} m={P.stoneWall} />
        <Box s={[12.8, 0.06, 10.5]} p={[0, -0.03, -0.15]} m={P.pave} />
        {Array.from({ length: 11 }, (_, i) => <Box key={'jx' + i} s={[12.6, 0.012, 0.03]} p={[0, 0.004, -5.1 + i * 0.95 + (i % 2) * 0.0]} m={P.grey} cast={false} />)}
        {Array.from({ length: 13 }, (_, i) => <Box key={'jz' + i} s={[0.03, 0.012, 10.3]} p={[-6.0 + i * 1.0, 0.004, -0.15]} m={P.grey} cast={false} />)}
        <Box s={[0.3, 0.6, 10.5]} p={[6.25, 0.3, -0.15]} m={P.brk(10, 1)} />
        <Box s={[0.4, 0.08, 10.6]} p={[6.25, 0.64, -0.15]} m={P.stoneWall} />
        {/* rear low wall */}
        <Box s={[2.9, 1.3, 0.3]} p={[-2.75, 0.65, -5.2]} m={P.brk(3, 1.3)} />
        <Box s={[3.0, 0.1, 0.5]} p={[-2.75, 1.33, -5.2]} m={P.tile} />

        {/* left range (west side), facing +x */}
        <group position={[-5.2, 0, -0.7]} rotation={[0, Math.PI / 2, 0]}><BrickRange W={8.8} D={2} n={8} /></group>
        {/* bell frames in front of the range */}
        <group position={[-3.3, 0, -2.4]} rotation={[0, Math.PI / 2, 0]} scale={1.3}><BellFrame L={3.0} n={6} n2={5} /></group>
        <group position={[-3.3, 0, 2.3]} rotation={[0, Math.PI / 2, 0]} scale={1.3}><BellFrame L={3.0} n={6} n2={5} /></group>

        {/* sanctum rear centre, facing +z */}
        <Sanctum p={[0, 0, -3.8]} />
        {/* yellow building rear right */}
        <group position={[3.95, 0, -4.3]}><YellowBldg W={4.2} D={1.8} /></group>
        {/* pavilion */}
        <Pavilion p={[3.7, 0, -1.2]} />
        {/* domed shrines */}
        <DomeShrine p={[-1.0, 0, 1.4]} s={1.0} rot={0.1} />
        <DomeShrine p={[0.4, 0, -1.0]} s={0.75} rot={0.1} />
        {/* bell gateway */}
        <BellGate p={[-0.6, 0, 3.3]} />
        {/* diyas on the dome plinth */}
        {[-1.8, -1.45, -1.1, -0.75, -0.4].map((x, i) => <Diyo key={i} p={[x, 0.16, 2.7]} />)}

        {/* gate passage over the stair: yellow outer faces, white inner faces, dark flat soffit */}
        <group>
          <Box s={[0.85, 2.5, 2.5]} p={[-5.425, -1.25, 5.65]} m={P.stoneWall} />
          <Box s={[0.85, 2.5, 2.5]} p={[-2.975, -1.25, 5.65]} m={P.stoneWall} />
          <Box s={[0.85, 1.8, 2.5]} p={[-5.425, 0.9, 5.65]} m={P.yellowBldg} />
          <Box s={[0.85, 1.8, 2.5]} p={[-2.975, 0.9, 5.65]} m={P.yellowBldg} />
          <Box s={[0.05, 1.8, 2.5]} p={[-4.98, 0.9, 5.65]} m={P.cream} cast={false} />
          <Box s={[0.05, 1.8, 2.5]} p={[-3.42, 0.9, 5.65]} m={P.cream} cast={false} />
          <Box s={[0.87, 0.35, 2.52]} p={[-5.425, 0.175, 5.65]} m={P.red} />
          <Box s={[0.87, 0.35, 2.52]} p={[-2.975, 0.175, 5.65]} m={P.red} />
          <Box s={[3.3, 0.1, 2.5]} p={[-4.2, 1.75, 5.65]} m={P.slab} />
          <Box s={[3.4, 0.16, 2.6]} p={[-4.2, 1.88, 5.65]} m={P.cream} />
          <Box s={[3.5, 0.06, 2.7]} p={[-4.2, 1.99, 5.65]} m={P.slab} />
        </group>
        {/* gate stair */}
        {gSteps.map((i) => { const top = -0.27 * (i + 1); const z0 = 5.1 + 0.6 * i; return <Box key={'g' + i} s={[2.0, top + 2.5, 0.6]} p={[-4.2, (top - 2.5) / 2, z0 + 0.3]} m={P.stoneWall} />; })}
        {[-5.2, -3.2].map((x) => <group key={x} position={[x, -DR * (8.7 - 5.1) + 0.05, 8.7]}><Parapet L={3.95} ang={ang} /></group>)}

        {/* wide ghat steps down to the river */}
        {gSteps.map((i) => { const top = -0.27 * (i + 1); const z0 = 5.1 + 0.6 * i; return <Box key={'w' + i} s={[2.4, top + 2.5, 0.6]} p={[1.6, (top - 2.5) / 2, z0 + 0.3]} m={P.stoneWall} />; })}
        {[0.4, 2.8].map((x) => <group key={x} position={[x, -DR * 2.7 + 0.05, 7.8]}><Parapet L={5.9} ang={ang} /></group>)}
        {/* front parapets along the terrace edge */}
        <group position={[-1.3, 0, 5.0]} rotation={[0, Math.PI / 2, 0]}><Parapet L={2.5} /></group>
        <group position={[5.3, 0, 5.0]} rotation={[0, Math.PI / 2, 0]}><Parapet L={2.0} /></group>

        {/* people and a cow */}
        <Person p={[2.4, 0, 2.6]} col="#e0761c" />
        <Person p={[3.0, 0, 2.2]} col="#f2efe6" />
        <Person p={[4.6, 0, 0.0]} col="#b23a48" s={0.95} />
        <Person p={[-1.7, 0, -1.2]} col="#e0761c" />
        <Cow p={[4.8, 0, 0.9]} r={0.5} />

        {/* dusk lights */}
        <DuskLight p={[-0.4, 1.6, 3.6]} i={2.6} d={7} />
        <DuskLight p={[2.5, 2.0, -1.0]} i={2.4} d={8} />
        <DuskLight p={[-4.2, 0.8, 5.0]} i={2.0} d={5} />
        <DuskLight p={[0, 1.2, -2.2]} i={1.8} d={5} />

        <Frame s={[13.2, 5.2, 12]} p={[0, 0.6, 1.4]} />
      </group>
    );
  }

  /* ---------- ENV ---------- */
  function Terrain() {
    const geo = useMemo(() => {
      const g = new THREE.PlaneGeometry(150, 135, 120, 108);
      g.rotateX(-Math.PI / 2);
      g.translate(0, 0, -7.5);
      const pos = g.attributes.position;
      const col = new Float32Array(pos.count * 3);
      const c = new THREE.Color(), cG = new THREE.Color('#5c8140'), cH = new THREE.Color('#3d6030'), cE = new THREE.Color('#6c6858'), cR = new THREE.Color('#5f5d54'), cS = new THREE.Color('#736f63'), cB = new THREE.Color('#5f5a4a');
      for (let i = 0; i < pos.count; i += 1) {
        const x = pos.getX(i), z = pos.getZ(i);
        const y = T(x, z);
        pos.setY(i, y);
        const n = vn(x * 0.35, z * 0.35);
        c.copy(cG).lerp(cH, Math.min(1, Math.max(0, y / 14) * 0.9 + n * 0.3));
        const shelf = (1 - sm(9, 11.5, Math.abs(x))) * (1 - sm(5.5, 7.5, z)) * (1 - sm(-8, -10, z) * 0 );
        if (z > -9.5) c.lerp(cE, shelf * 0.9 * sm(-9.5, -7.5, z));
        if (y < -2.0 && z > 7) c.copy(cR).lerp(cS, n * 0.8);
        if (y > -2.0 && y < -1.2 && z > 7) c.lerp(cB, 0.55);
        const sd = Math.abs(x - streamX(z));
        if (z < 14 && sd < 3.2 && y < -1) c.lerp(cR, 0.6);
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      g.computeVertexNormals();
      return g;
    }, []);
    return <mesh geometry={geo} receiveShadow><meshStandardMaterial vertexColors roughness={1} flatShading /></mesh>;
  }

  function StreamRibbon() {
    const M = useM(); const P = pal(M);
    const geo = useMemo(() => {
      const pos = [], idx = [];
      const N = 22;
      for (let i = 0; i <= N; i += 1) {
        const z = -26 + (i * 40) / N;
        const x = streamX(z), y = yS(z) + 0.12;
        pos.push(x - 6, y, z, x + 6, y, z);
      }
      for (let i = 0; i < N; i += 1) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setIndex(idx);
      g.computeVertexNormals();
      return g;
    }, []);
    const m = useMemo(() => { const x = P.water.clone(); x.side = THREE.DoubleSide; return x; }, [P]);
    return <mesh geometry={geo} material={m} />;
  }

  function Tributary() {
    const M = useM(); const P = pal(M);
    const geo = useMemo(() => {
      const pos = [], idx = [];
      const N = 14;
      for (let i = 0; i <= N; i += 1) {
        const z = 0.5 + (i * 13) / N;
        const x = tribX(z), y = Math.max(tribY(z) + 0.1, -2.33);
        pos.push(x - 1.9, y, z, x + 1.9, y, z);
      }
      for (let i = 0; i < N; i += 1) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setIndex(idx);
      g.computeVertexNormals();
      return g;
    }, []);
    const m = useMemo(() => { const x = P.water.clone(); x.side = THREE.DoubleSide; return x; }, [P]);
    return <mesh geometry={geo} material={m} />;
  }

  const BARS = [[-12.5, 11.5, 2.2, 0.9], [-16, 12.5, 1.6, 0.8], [-8, 13, 2.8, 1.1], [-2, 12.5, 3.2, 1.2], [8, 14.5, 3.6, 1.3], [-20, 16, 3, 1.1], [18, 17, 4, 1.4], [-6, 20, 3.4, 1.3], [4, 24, 3.8, 1.2],
    [streamX(-8) + 3.1, -8, 1.4, 1.0], [streamX(2) - 3.1, 2, 1.6, 1.0], [streamX(10) + 3.0, 10, 1.4, 0.9]];
  function GravelBars() {
    const M = useM(); const P = pal(M);
    return (
      <group>
        {BARS.map(([x, z, a, b], i) => {
          const y = z > 8.5 ? -2.3 : T(x, z) + 0.02;
          return <mesh key={i} position={[x, y, z]} scale={[a, 0.05, b]} rotation={[0, rn(i) * 3, 0]} material={P.gravel} receiveShadow><sphereGeometry args={[1, 10, 6]} /></mesh>;
        })}
      </group>
    );
  }

  function Forest() {
    const { broad, cones } = useMemo(() => {
      const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, flatShading: true });
      const arr = [];
      for (let i = 0; i < 1300 && arr.length < 460; i += 1) {
        const x = (rn(i * 3.1) - 0.5) * 140, z = -68 + rn(i * 5.7 + 1) * 120;
        const y = T(x, z);
        if (y < -1.3) continue;
        if (Math.abs(x) < 10.5 && z > -9.5 && z < 6.5) continue;
        if (Math.abs(x - streamX(z)) < 2.8 && z < 14) continue;
        if (HOUSES.some((h) => Math.hypot(h.x - x, h.z - z) < 2.8)) continue;
        arr.push({ x, y, z, s: 0.8 + rn(i * 7.3) * 1.1, k: rn(i * 2.2) });
      }
      const nb = arr.filter((a) => a.k > 0.22), nc = arr.filter((a) => a.k <= 0.22);
      const d = new THREE.Object3D();
      const mk = (geo, list, base) => {
        const im = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length));
        list.forEach((a, i) => {
          d.position.set(a.x, a.y + a.s * base, a.z); d.scale.set(a.s, a.s * (base > 1 ? 1 : 0.85), a.s); d.rotation.set(0, a.k * 9, 0); d.updateMatrix();
          im.setMatrixAt(i, d.matrix);
          im.setColorAt(i, new THREE.Color().setHSL(0.27 + rn(i * 1.7 + base) * 0.05, 0.42, 0.12 + rn(i * 4.1) * 0.08));
        });
        im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
        im.castShadow = true;
        return im;
      };
      return { broad: mk(new THREE.IcosahedronGeometry(0.8, 0), nb, 1), cones: mk(new THREE.ConeGeometry(0.75, 3.2, 6), nc, 1.5) };
    }, []);
    return <group><primitive object={broad} /><primitive object={cones} /></group>;
  }

  function Boulders() {
    const im = useMemo(() => {
      const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, flatShading: true });
      const arr = [];
      for (let i = 0; i < 700 && arr.length < 110; i += 1) {
        const x = (rn(i * 2.3 + 40) - 0.5) * 130, z = 8.5 + rn(i * 4.9 + 8) * 30;
        const y = T(x, z);
        if (y > -2.0 || (Math.abs(x) < 6 && z < 11.5)) continue;
        arr.push({ x, y: Math.max(y, -2.4), z, s: 0.15 + Math.pow(rn(i * 8.1), 2) * 0.7 });
      }
      for (let i = 0; i < 400 && arr.length < 150; i += 1) {
        const z = -20 + rn(i * 3.3) * 34, x = streamX(z) + (rn(i * 6.1) - 0.5) * 2.4;
        arr.push({ x, y: T(x, z), z, s: 0.15 + rn(i * 9.7) * 0.35 });
      }
      const m = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), mat, arr.length);
      const d = new THREE.Object3D();
      arr.forEach((a, i) => {
        d.position.set(a.x, a.y + a.s * 0.25, a.z); d.scale.set(a.s * 1.3, a.s * 0.7, a.s); d.rotation.set(rn(i) * 3, rn(i * 2) * 3, 0); d.updateMatrix();
        m.setMatrixAt(i, d.matrix);
        m.setColorAt(i, new THREE.Color().setHSL(0.09 + rn(i * 3) * 0.04, 0.08 + rn(i * 5) * 0.1, 0.42 + rn(i * 7) * 0.25));
      });
      m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
      m.castShadow = true;
      return m;
    }, []);
    return <primitive object={im} />;
  }

  function Village() {
    const M = useM(); const P = pal(M);
    const roofs = [P.tile, P.tile, P.tin, P.tile];
    return (
      <group>
        {HOUSES.map((h, i) => {
          const hh = h.yTop - h.yLo + 0.5;
          const wall = h.k === 1 ? P.brk(h.w, h.ht) : h.k === 3 ? P.yellowBldg : P.cream;
          return (
            <group key={i} position={[h.x, h.yTop, h.z]} rotation={[0, h.r, 0]}>
              <Box s={[h.w + 0.12, hh, h.d + 0.12]} p={[0, -hh / 2 + 0.02, 0]} m={P.stoneWall} />
              <Box s={[h.w, h.ht, h.d]} p={[0, h.ht / 2, 0]} m={wall} />
              {h.k !== 1 && <Box s={[h.w + 0.02, 0.4, h.d + 0.02]} p={[0, 0.2, 0]} m={P.red} />}
              {h.ht > 2 && <Box s={[h.w + 0.06, 0.07, h.d + 0.06]} p={[0, h.ht * 0.46, 0]} m={P.timber} cast={false} />}
              {[-1, 1].map((sg) => (
                <group key={sg} position={[sg * h.w * 0.26, h.ht > 2 ? h.ht * 0.74 : h.ht * 0.62, h.d / 2 + 0.03]}>
                  <Box s={[0.46, 0.5, 0.1]} p={[0, 0, 0]} m={P.timberLt} cast={false} />
                  <Box s={[0.3, 0.34, 0.12]} p={[0, 0, 0.01]} m={P.black} cast={false} />
                </group>
              ))}
              {h.a ? (
                <group>
                  <Box s={[h.w * 0.92, 0.75, 0.08]} p={[0, 0.5, h.d / 2 + 0.04]} m={P.timber} cast={false} />
                  {[-0.42, -0.14, 0.14, 0.42].map((u) => <Box key={u} s={[0.07, 0.8, 0.1]} p={[u * h.w, 0.45, h.d / 2 + 0.1]} m={P.timberLt} cast={false} />)}
                  <Box s={[0.7, 0.5, 0.3]} p={[0, h.ht * 0.74, h.d / 2 + 0.14]} m={P.timberLt} />
                  <Box s={[0.8, 0.06, 0.38]} p={[0, h.ht * 0.74 + 0.28, h.d / 2 + 0.14]} m={P.timber} />
                </group>
              ) : <Box s={[0.4, 0.75, 0.05]} p={[0, 0.4, h.d / 2 + 0.02]} m={P.timber} cast={false} />}
              <HipRoof w={h.w + 0.5} d={h.d + 0.5} h={h.rh} y={h.ht} m={roofs[h.k]} />
            </group>
          );
        })}
      </group>
    );
  }

  function RishikeshEnv() {
    const M = useM(); const P = pal(M);
    return (
      <group>
        <Terrain />
        <Box s={[150, 0.08, 40]} p={[0, -2.36, 27.5]} m={P.water} cast={false} />
        <StreamRibbon />
        <Tributary />
        <GravelBars />
        <Forest />
        <Boulders />
        <Village />
        <Tree p={[8.2, T(8.2, -3.5), -3.5]} s={1.9} />
        <Tree p={[-9.0, T(-9, 6.5), 6.5]} s={1.4} />
        <Tree p={[8.6, T(8.6, 3.5), 3.5]} s={1.6} />
      </group>
    );
  }

  return { 'rishikesh-temple-ridi': { Main: RishikeshMain, Env: RishikeshEnv } };
}
