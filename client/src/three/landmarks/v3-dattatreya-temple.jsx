// Dattatreya Temple, Tachupal Tole (Dattatreya Square), Bhaktapur.
// Three-roofed Newar pagoda at the EAST end of the square, facing west (model: front = +z). Very wide lowest roof over an open arched
// porch, low 3-level brick plinth with one stair, two seated stone wrestlers, tall Garuda pillar on the square, chakra and conch pillars.
// Scale: lowest roof 10.4 units wide (about 13 m), so roughly 0.8 units per metre.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Gajur, Frame, Trident, Diyo, THREE, useMemo, useRef, useEffect } = K;

  /* ---------- dimensions ---------- */
  const G = 1.0;                 // plinth top
  const SAG = 1.25;
  const LIFT = 0.12;
  const R1 = { w: 10.4, d: 8.6, h: 1.45, e: G + 2.4 };
  const W2 = { hx: 2.6, hz: 2.4, h: 1.6 };
  const R2 = { w: 6.5, d: 5.9, h: 1.15 };
  const W3 = { hx: 1.55, hz: 1.4, h: 1.75 };
  const R3 = { w: 3.9, d: 3.6, h: 1.0 };
  const roofBase = (e, rh, hx, hz, rw, rd) => {
    const ax = hx / (rw / 2); const az = hz / (rd / 2);
    return e + rh * ((1 - Math.max(ax, az)) ** SAG + LIFT * (ax * az) ** 2.4);
  };
  const B2 = roofBase(R1.e, R1.h, W2.hx, W2.hz, R1.w, R1.d) - 0.08;
  const E2 = B2 + W2.h;
  const B3 = roofBase(E2, R2.h, W3.hx, W3.hz, R2.w, R2.d) - 0.08;
  const E3 = B3 + W3.h;
  const APEX = E3 + R3.h;
  const TOTAL = APEX + 1.6;

  /* ---------- procedural canvas textures (desaturated clay tile, brick, paving) ---------- */
  const texCache = {};
  const canvasTex = (key, w, h, rx, ry, draw) => {
    const k = `${key}|${rx}|${ry}`;
    if (texCache[k]) return texCache[k];
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4;
    if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
    texCache[k] = t; return t;
  };
  const hexRgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const jit = (base, a, i) => { const n = Math.sin(i * 12.9898) * 43758.5453; const f = (n - Math.floor(n) - 0.5) * a; const [r, g, b] = hexRgb(base); return `rgb(${Math.max(0, Math.min(255, r + f))|0},${Math.max(0, Math.min(255, g + f))|0},${Math.max(0, Math.min(255, b + f))|0})`; };
  const tileTex = (base, rx, ry) => canvasTex(`tile${base}`, 128, 128, rx, ry, (g, w, h) => {
    g.fillStyle = jit(base, 0, 0); g.fillRect(0, 0, w, h);
    const rh = 16; const tw = 16;
    for (let r = 0; r < h / rh; r += 1) for (let c = -1; c < w / tw; c += 1) {
      const x = c * tw + (r % 2) * (tw / 2); const y = r * rh;
      g.fillStyle = jit(base, 26, r * 17 + c * 5 + 3); g.fillRect(x + 1, y, tw - 1, rh - 3);
      g.fillStyle = 'rgba(40,24,14,0.55)'; g.fillRect(x, y, 1, rh - 3);
      g.fillStyle = 'rgba(30,18,10,0.7)'; g.fillRect(x, y + rh - 3, tw, 3);
    }
  });
  const brickTex = (base, mortar, rx, ry) => canvasTex(`brick${base}${mortar}`, 128, 128, rx, ry, (g, w, h) => {
    g.fillStyle = mortar; g.fillRect(0, 0, w, h);
    const bh = 10; const bw = 26;
    for (let r = 0; r < Math.ceil(h / bh); r += 1) for (let c = -1; c < w / bw + 1; c += 1) {
      g.fillStyle = jit(base, 30, r * 13 + c * 7 + 1); g.fillRect(c * bw + (r % 2) * (bw / 2) + 1, r * bh + 1, bw - 2, bh - 2);
    }
  });
  const useMatT = (tex, extra = {}) => useMemo(() => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, metalness: 0, ...extra }), [tex]);

  /* ---------- shared small parts ---------- */
  function Struts({ y, faces, drop = 0.72, m, th = 0.11 }) {
    const out = [];
    faces.forEach((f, fi) => {
      f.at.forEach((t, i) => {
        const y1 = y - drop; const y2 = y - 0.1;
        const dy = y2 - y1; const dd = f.to - f.from;
        const len = Math.hypot(dd, dy); const mid = (f.from + f.to) / 2;
        if (f.ax === 'z') out.push(<Box key={`${fi}-${i}`} s={[th, len, th * 0.9]} p={[t, (y1 + y2) / 2, mid]} r={[Math.atan2(dd, dy), 0, 0]} m={m} cast={false} />);
        else out.push(<Box key={`${fi}-${i}`} s={[th * 0.9, len, th]} p={[mid, (y1 + y2) / 2, t]} r={[0, 0, -Math.atan2(dd, dy)]} m={m} cast={false} />);
      });
    });
    return <group>{out}</group>;
  }
  const spread = (n, half) => Array.from({ length: n }, (_, i) => (n === 1 ? 0 : -half + (2 * half * i) / (n - 1)));
  const faceSet = (hxW, hzW, hxE, hzE, nf, ns, zf = hzW) => [
    { ax: 'z', from: zf, to: hzE * 0.93, at: spread(nf, hxE * 0.9) },
    { ax: 'z', from: -hzW, to: -hzE * 0.93, at: spread(Math.max(3, nf - 3), hxE * 0.8) },
    { ax: 'x', from: hxW, to: hxE * 0.93, at: spread(ns, hzE * 0.8) },
    { ax: 'x', from: -hxW, to: -hxE * 0.93, at: spread(ns, hzE * 0.8) },
  ];
  /* red-orange hanging fringe (0.22 tall) with a dark under-band and scalloped teeth on all four sides of a roof edge */
  function Fringe({ w, d, y }) {
    const M = useM();
    const red = M.plain('#c4532a', { roughness: 0.9 });
    const dk = M.plain('#4a1a0c', { roughness: 0.8 });
    const tooth = M.plain('#a8381a', { roughness: 0.85 });
    const ref = useRef();
    const pts = useMemo(() => {
      const a = []; const st = 0.2;
      for (let x = -w / 2 + 0.1; x <= w / 2 - 0.05; x += st) { a.push([x, d / 2 + 0.03]); a.push([x, -d / 2 - 0.03]); }
      for (let z = -d / 2 + 0.1; z <= d / 2 - 0.05; z += st) { a.push([w / 2 + 0.03, z]); a.push([-w / 2 - 0.03, z]); }
      return a;
    }, [w, d]);
    useEffect(() => {
      if (!ref.current) return;
      const o = new THREE.Object3D();
      pts.forEach(([x, z], i) => { o.position.set(x, -0.185, z); o.updateMatrix(); ref.current.setMatrixAt(i, o.matrix); });
      ref.current.instanceMatrix.needsUpdate = true;
    }, [pts]);
    return (
      <group position={[0, y - 0.12, 0]}>
        <Box s={[w + 0.04, 0.22, 0.05]} p={[0, 0, d / 2 + 0.01]} m={red} cast={false} />
        <Box s={[w + 0.04, 0.22, 0.05]} p={[0, 0, -d / 2 - 0.01]} m={red} cast={false} />
        <Box s={[0.05, 0.22, d + 0.04]} p={[w / 2 + 0.01, 0, 0]} m={red} cast={false} />
        <Box s={[0.05, 0.22, d + 0.04]} p={[-w / 2 - 0.01, 0, 0]} m={red} cast={false} />
        <Box s={[w + 0.04, 0.05, 0.08]} p={[0, -0.135, d / 2 + 0.01]} m={dk} cast={false} />
        <Box s={[w + 0.04, 0.05, 0.08]} p={[0, -0.135, -d / 2 - 0.01]} m={dk} cast={false} />
        <Box s={[0.08, 0.05, d + 0.04]} p={[w / 2 + 0.01, -0.135, 0]} m={dk} cast={false} />
        <Box s={[0.08, 0.05, d + 0.04]} p={[-w / 2 - 0.01, -0.135, 0]} m={dk} cast={false} />
        <instancedMesh ref={ref} args={[null, null, pts.length]} material={tooth} frustumCulled={false}>
          <boxGeometry args={[0.12, 0.09, 0.07]} />
        </instancedMesh>
      </group>
    );
  }
  function Win({ p, r = 0, w = 1.05, h = 1.0 }) {
    const M = useM();
    const dk = M.plain('#3a2412', { roughness: 0.85 });
    const lat = M.plain('#8a5a30', { roughness: 0.8 });
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[w, h, 0.1]} p={[0, 0, 0]} m={dk} cast={false} />
        <Box s={[w * 0.78, h * 0.78, 0.12]} p={[0, 0, 0.01]} m={lat} cast={false} />
        <Box s={[0.05, h * 0.8, 0.14]} p={[0, 0, 0.02]} m={dk} cast={false} />
        <Box s={[w * 0.8, 0.14, 0.15]} p={[0, h * 0.54, 0.02]} m={dk} cast={false} />
      </group>
    );
  }
  function Gallery({ hx, hz, y }) {
    const M = useM();
    const dk = M.plain('#6a4424', { roughness: 0.85 });
    const gx = hx + 0.72; const gz = hz + 0.72;
    const pts = useMemo(() => {
      const a = []; const st = 0.27;
      for (let x = -gx; x <= gx + 1e-6; x += st) { a.push([x, -gz]); a.push([x, gz]); }
      for (let z = -gz + st; z < gz - 1e-6; z += st) { a.push([-gx, z]); a.push([gx, z]); }
      return a;
    }, [gx, gz]);
    const ref = useRef();
    useEffect(() => {
      if (!ref.current) return;
      const o = new THREE.Object3D();
      pts.forEach(([x, z], i) => { o.position.set(x, y + 0.26, z); o.updateMatrix(); ref.current.setMatrixAt(i, o.matrix); });
      ref.current.instanceMatrix.needsUpdate = true;
    }, [pts, y]);
    return (
      <group>
        <Box s={[gx * 2 + 0.1, 0.12, gz * 2 + 0.1]} p={[0, y, 0]} m={dk} />
        {[[0, gz, gx * 2, 0.08, 0.08], [0, -gz, gx * 2, 0.08, 0.08]].map(([x, z, a], i) => <Box key={`rz${i}`} s={[a + 0.08, 0.08, 0.1]} p={[x, y + 0.48, z]} m={dk} cast={false} />)}
        {[gx, -gx].map((x) => <Box key={`rx${x}`} s={[0.1, 0.08, gz * 2]} p={[x, y + 0.48, 0]} m={dk} cast={false} />)}
        <instancedMesh ref={ref} args={[null, null, pts.length]} material={dk} frustumCulled={false}>
          <boxGeometry args={[0.07, 0.42, 0.07]} />
        </instancedMesh>
      </group>
    );
  }
  function Storey({ hx, hz, y, h, nf, ns }) {
    const M = useM();
    const wall = M.mat('wood', 2, 1, { color: '#b8875a' });
    const gy = y + 0.5; const wy = gy + 0.62;
    const wins = [];
    spread(nf, hx * 0.62).forEach((x, i) => { wins.push(<Win key={`f${i}`} p={[x, wy, hz + 0.05]} w={hx*2/nf*0.78} />); wins.push(<Win key={`b${i}`} p={[x, wy, -hz - 0.05]} r={Math.PI} w={hx*2/nf*0.78} />); });
    spread(ns, hz * 0.55).forEach((z, i) => { wins.push(<Win key={`l${i}`} p={[-hx - 0.05, wy, z]} r={-Math.PI / 2} />); wins.push(<Win key={`r${i}`} p={[hx + 0.05, wy, z]} r={Math.PI / 2} />); });
    return (
      <group>
        <Box s={[hx * 2, h, hz * 2]} p={[0, y + h / 2, 0]} m={wall} />
        <Box s={[hx * 2 + 0.12, 0.14, hz * 2 + 0.12]} p={[0, y + h - 0.07, 0]} m={M.plain('#6a4424')} cast={false} />
        <Gallery hx={hx} hz={hz} y={gy} />
        {wins}
      </group>
    );
  }

  /* ---------- sculpture ---------- */
  function Wrest({ m, tm, dk }) {
    return (
      <group>
        <Cyl rt={0.62} rb={0.7} h={0.16} p={[0, 0.08, 0]} m={m} seg={20} />
        <Cyl rt={0.5} rb={0.6} h={0.14} p={[0, 0.23, 0]} m={m} seg={20} />
        {/* lotus base: ring of 12 petal wedges */}
        {Array.from({ length: 12 }, (_, i) => (
          <group key={`pt${i}`} rotation={[0, (i / 12) * Math.PI * 2, 0]}>
            <Ball rad={0.17} sc={[0.62, 0.95, 0.3]} p={[0, 0.2, 0.68]} m={m} />
          </group>
        ))}
        <mesh position={[0, 0.31, 0]} rotation={[Math.PI / 2, 0, 0]} material={m} castShadow><torusGeometry args={[0.55, 0.06, 6, 20]} /></mesh>
        <Ball rad={0.5} sc={[1.55, 0.4, 1.0]} p={[0, 0.5, 0.05]} m={m} />
        {[-1, 1].map((k) => <Ball key={k} rad={0.22} p={[k * 0.62, 0.6, 0.38]} m={m} />)}
        <Ball rad={0.46} sc={[1.08, 1.1, 0.78]} p={[0, 1.0, 0]} m={m} />
        <Box s={[1.05, 0.44, 0.52]} p={[0, 1.32, 0]} m={m} />
        {[-1, 1].map((k) => <Ball key={`s${k}`} rad={0.22} p={[k * 0.58, 1.42, 0]} m={m} />)}
        {[-1, 1].map((k) => <Cyl key={`a${k}`} rt={0.14} rb={0.11} h={0.62} p={[k * 0.64, 1.02, 0.18]} r={[0.45, 0, -k * 0.1]} m={m} seg={8} />)}
        <Box s={[0.07, 1.0, 0.03]} p={[0.66, 0.95, 0.42]} r={[0.1, 0, 0.05]} m={dk} />
        <Cyl rt={0.3} rb={0.3} h={0.07} p={[-0.7, 0.9, 0.46]} r={[Math.PI / 2, 0, 0]} m={dk} seg={16} />
        {/* broad face */}
        <Ball rad={0.34} sc={[1.18, 1.0, 0.95]} p={[0, 1.74, 0]} m={m} />
        <Box s={[0.5, 0.05, 0.07]} p={[0, 1.82, 0.3]} m={dk} cast={false} />
        <Box s={[0.08, 0.17, 0.1]} p={[0, 1.7, 0.34]} m={m} />
        {/* moustache */}
        {[-1, 1].map((k) => <Box key={`mu${k}`} s={[0.2, 0.05, 0.06]} p={[k * 0.12, 1.6, 0.34]} r={[0, 0, -k * 0.35]} m={dk} cast={false} />)}
        <Box s={[0.2, 0.035, 0.05]} p={[0, 1.53, 0.33]} m={dk} cast={false} />
        {[-1, 1].map((k) => <Ball key={`e${k}`} rad={0.08} p={[k * 0.38, 1.72, 0]} m={m} />)}
        {/* large rounded turban */}
        <Cyl rt={0.46} rb={0.42} h={0.36} p={[0, 2.05, 0]} m={tm} seg={18} />
        <Ball rad={0.42} sc={[1, 0.62, 1]} p={[0, 2.22, 0]} m={tm} />
        <Cyl rt={0.46} rb={0.46} h={0.07} p={[0, 1.9, 0]} m={dk} seg={18} />
        <Ball rad={0.13} p={[0, 2.45, 0]} m={tm} />
      </group>
    );
  }
  function GarudaFig({ m, gm }) {
    /* kneeling, joined hands (anjali), winged, halo; faces +z of its own frame */
    return (
      <group>
        <Box s={[0.55, 0.14, 0.5]} p={[0, 0.07, 0]} m={m} />
        <Box s={[0.42, 0.14, 0.34]} p={[0, 0.21, 0.04]} m={m} />
        <Ball rad={0.1} sc={[1.6, 0.8, 1.6]} p={[0, 0.3, 0.12]} m={m} />
        <Box s={[0.3, 0.42, 0.22]} p={[0, 0.58, 0]} m={m} />
        <Box s={[0.36, 0.1, 0.24]} p={[0, 0.8, 0]} m={m} />
        <Ball rad={0.14} p={[0, 0.98, 0.02]} m={m} />
        <mesh position={[0, 0.95, 0.17]} rotation={[Math.PI / 2, 0, 0]} material={gm} castShadow><coneGeometry args={[0.04, 0.12, 8]} /></mesh>
        <mesh position={[0, 1.2, 0.02]} material={gm} castShadow><coneGeometry args={[0.1, 0.2, 8]} /></mesh>
        {[-1, 1].map((k) => <Cyl key={k} rt={0.04} rb={0.045} h={0.3} p={[k * 0.13, 0.66, 0.1]} r={[0.9, 0, k * 0.2]} m={m} seg={6} />)}
        <Ball rad={0.06} sc={[1.2, 1, 0.7]} p={[0, 0.7, 0.26]} m={m} />
        {[-1, 1].map((k) => <Box key={`w${k}`} s={[0.04, 0.6, 0.34]} p={[k * 0.24, 0.8, -0.18]} r={[0.2, 0, k * 0.45]} m={m} />)}
        <mesh position={[0, 0.98, -0.12]} material={gm} castShadow><torusGeometry args={[0.26, 0.025, 6, 20]} /></mesh>
      </group>
    );
  }
  function GaruraPillar({ p }) {
    const M = useM();
    const st = M.plain('#7a766f', { roughness: 0.95 });
    const stD = M.plain('#625e58', { roughness: 0.95 });
    const stP = M.plain('#6c6860', { roughness: 0.95 });
    const H = 5.4;
    return (
      <group position={p}>
        <Box s={[1.3, 0.22, 1.3]} p={[0, 0.11, 0]} m={st} />
        <Box s={[1.0, 0.22, 1.0]} p={[0, 0.33, 0]} m={st} />
        <Box s={[0.72, 0.3, 0.72]} p={[0, 0.59, 0]} m={stD} />
        <Cyl rt={0.2} rb={0.27} h={H} p={[0, 0.74 + H / 2, 0]} r={[0, Math.PI / 4, 0]} m={st} seg={4} />
        {[0.06, 0.12, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.88, 0.94].map((t, i) => <Box key={i} s={[0.46 - t * 0.12, 0.09, 0.46 - t * 0.12]} p={[0, 0.74 + H * t, 0]} m={stD} />)}
        {[0.16, 0.3, 0.44, 0.58, 0.72].map((t, i) => [0, 1, 2, 3].map((f) => {
          const a = (f * Math.PI) / 2; const rf = 0.19 - 0.05 * t + 0.02;
          return <Box key={`pn${i}${f}`} s={[0.16, 0.55, 0.05]} p={[Math.sin(a) * rf, 0.74 + H * t, Math.cos(a) * rf]} r={[0, a, 0]} m={stP} cast={false} />;
        }))}
        <Cyl rt={0.4} rb={0.2} h={0.26} p={[0, 0.87 + H, 0]} m={st} seg={12} />
        <Box s={[0.7, 0.1, 0.7]} p={[0, 1.05 + H, 0]} m={stD} />
        <group position={[0, 1.1 + H, 0]} scale={1.8} rotation={[0, Math.PI, 0]}><GarudaFig m={st} gm={M.plain('#8f7a52', { roughness: 0.9 })} /></group>
      </group>
    );
  }
  function ChakraTop() {
    const M = useM();
    return (
      <group>
        <mesh material={M.gold} castShadow><torusGeometry args={[0.36, 0.06, 8, 24]} /></mesh>
        <Cyl rt={0.3} h={0.04} r={[Math.PI / 2, 0, 0]} m={M.plain('#e8d9a2', { metalness: 0.4, roughness: 0.4, emissive: '#6b4a08', emissiveIntensity: 0.25 })} seg={20} />
        <Box s={[0.6, 0.05, 0.05]} m={M.gold} />
        <Box s={[0.05, 0.6, 0.05]} m={M.gold} />
        <Ball rad={0.08} p={[0, 0, 0.03]} m={M.gold} />
        {Array.from({ length: 9 }, (_, i) => {
          const a = (i / 9) * Math.PI * 2;
          return <mesh key={i} position={[Math.sin(a) * 0.44, Math.cos(a) * 0.44, 0]} rotation={[0, 0, -a]} material={M.gold}><coneGeometry args={[0.05, 0.16, 6]} /></mesh>;
        })}
      </group>
    );
  }
  function ConchTop() {
    const M = useM();
    return (
      <group>
        <Ball rad={0.2} sc={[0.85, 1.15, 0.85]} p={[0, 0.2, 0]} m={M.gold} />
        <mesh position={[0, 0.7, 0]} material={M.gold} castShadow><coneGeometry args={[0.17, 0.62, 10]} /></mesh>
        <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.gold}><torusGeometry args={[0.2, 0.035, 6, 16]} /></mesh>
        <mesh position={[0, 1.04, 0]} material={M.gold}><coneGeometry args={[0.04, 0.2, 6]} /></mesh>
      </group>
    );
  }
  function StonePillar({ p, chakra }) {
    const M = useM();
    const st = M.plain('#7a766f', { roughness: 0.95 });
    const stD = M.plain('#625e58', { roughness: 0.95 });
    return (
      <group position={p}>
        <Box s={[0.7, 0.24, 0.7]} p={[0, 0.12, 0]} m={st} />
        <Box s={[0.5, 0.2, 0.5]} p={[0, 0.34, 0]} m={stD} />
        <Cyl rt={0.12} rb={0.16} h={2.1} p={[0, 1.5, 0]} m={st} seg={10} />
        <Cyl rt={0.2} rb={0.14} h={0.1} p={[0, 2.6, 0]} m={stD} seg={12} />
        <Cyl rt={0.28} rb={0.12} h={0.3} p={[0, 2.8, 0]} m={st} seg={12} />
        <Ball rad={0.24} sc={[1, 0.8, 1]} p={[0, 3.02, 0]} m={st} />
        <Cyl rt={0.06} rb={0.08} h={0.3} p={[0, 3.25, 0]} m={M.gold} seg={8} />
        {chakra ? <group position={[0, 3.72, 0]}><ChakraTop /></group> : <group position={[0, 3.35, 0]}><ConchTop /></group>}
      </group>
    );
  }

  /* ---------- Main: the temple ---------- */
  const arcShape = (bw, ah) => {
    const hw = bw / 2 - 0.13;
    const s = new THREE.Shape();
    s.moveTo(-bw / 2, 0); s.lineTo(-hw, 0); s.lineTo(-hw, ah * 0.5);
    s.bezierCurveTo(-hw, ah * 0.78, -hw * 0.35, ah * 0.84, 0, ah * 0.94);
    s.bezierCurveTo(hw * 0.35, ah * 0.84, hw, ah * 0.78, hw, ah * 0.5);
    s.lineTo(hw, 0); s.lineTo(bw / 2, 0); s.lineTo(bw / 2, ah); s.lineTo(-bw / 2, ah); s.closePath();
    return s;
  };

  function DattaMain() {
    const M = useM();
    const brick = useMatT(brickTex('#8a5a44', '#a89684', 6, 1));
    const brickT = useMatT(brickTex('#85563f', '#a89684', 3, 1));
    const brickC = useMatT(brickTex('#8e5e46', '#a89684', 5, 1));
    const wood = M.plain('#6a4224', { roughness: 0.85 });
    const woodL = M.plain('#8a5a30', { roughness: 0.85 });
    const dark = M.plain('#5a3a24', { roughness: 0.9 });
    const backW = useMatT(brickTex('#9a7258', '#6a5444', 5, 1));
    const stone = M.plain('#6f6b64', { roughness: 0.95 });
    const stoneD = M.plain('#5c5852', { roughness: 0.95 });
    const coping = M.plain('#8a5a46', { roughness: 0.95 });
    const tile = useMatT(tileTex('#7a5a44', 5, 5));
    const arc = useMemo(() => new THREE.ExtrudeGeometry(arcShape(1.68, 1.95), { depth: 0.14, bevelEnabled: false }), []);
    const PZ = 3.25;
    const postX = spread(6, 4.2);
    const bayX = spread(5, 3.36);
    const steps = [0, 1, 2, 3, 4];
    const SW = 1.7;
    return (
      <group>
        {/* stepped brick plinth, three levels */}
        <Box s={[11.8, 0.35, 9.3]} p={[0, 0.175, 0.35]} m={brick} />
        <Box s={[11.0, 0.35, 8.9]} p={[0, 0.525, 0.15]} m={brickC} />
        <Box s={[10.2, 0.3, 8.5]} p={[0, 0.85, -0.05]} m={brickT} />
        <Box s={[11.9, 0.05, 9.4]} p={[0, 0.36, 0.35]} m={coping} cast={false} />
        <Box s={[11.1, 0.05, 9.0]} p={[0, 0.71, 0.15]} m={coping} cast={false} />
        <Box s={[10.3, 0.05, 8.6]} p={[0, 1.0, -0.05]} m={coping} cast={false} />
        {/* central stair: five stone treads below the plinth top = six steps */}
        {steps.map((j) => {
          const zEnd = 6.05 - 0.3 * j;
          const zs = 4.15;
          return <Box key={j} s={[SW * 2, 0.167 * (j + 1), zEnd - zs]} p={[0, (0.167 * (j + 1)) / 2, (zEnd + zs) / 2]} m={j % 2 ? stone : stoneD} />;
        })}

        {/* body behind the porch */}
        <Box s={[8.8, 2.4, 5.2]} p={[0, G + 1.2, -0.9]} m={brick} />
        <Box s={[8.0, 2.0, 0.1]} p={[0, G + 1.0, 1.75]} m={backW} cast={false} />
        <Box s={[1.1, 1.5, 0.12]} p={[0, G + 0.75, 1.78]} m={M.plain('#6b2a14', { roughness: 0.9 })} cast={false} />
        <mesh position={[0, G + 1.52, 1.82]} material={M.gold}><torusGeometry args={[0.55, 0.035, 6, 20, Math.PI]} /></mesh>
        {[-1, 1].map((k) => <Box key={k} s={[0.34, 2.0, 1.7]} p={[k * 4.35, G + 1.0, 2.45]} m={brick} />)}
        {/* open arcade: six slender posts, five cusped arches */}
        {bayX.map((x, i) => <mesh key={i} geometry={arc} position={[x, G, PZ - 0.07]} material={woodL} castShadow />)}
        {postX.map((x, i) => (
          <group key={i} position={[x, G, PZ]}>
            <Box s={[0.34, 0.2, 0.34]} p={[0, 0.1, 0]} m={stone} />
            <Cyl rt={0.11} rb={0.14} h={1.8} p={[0, 1.1, 0]} m={woodL} seg={10} />
            <Box s={[0.3, 0.16, 0.3]} p={[0, 1.96, 0]} m={wood} />
          </group>
        ))}
        <Box s={[9.0, 0.36, 0.34]} p={[0, G + 2.18, PZ]} m={wood} />
        <Box s={[9.0, 0.08, 0.38]} p={[0, G + 2.38, PZ]} m={M.plain('#a8812a', { metalness: 0.4, roughness: 0.5 })} cast={false} />
        <Box s={[8.9, 0.2, 1.5]} p={[0, G + 2.1, PZ - 0.8]} m={wood} cast={false} />
        {/* lighter carved lintel band and cusps hanging at each arch */}
        <Box s={[9.0, 0.16, 0.3]} p={[0, G + 2.0, PZ + 0.04]} m={M.plain('#b07c3c', { roughness: 0.7 })} cast={false} />
        {bayX.map((x, i) => (
          <group key={`cu${i}`}>
            <Box s={[0.16, 0.16, 0.08]} p={[x, G + 1.82, PZ + 0.05]} r={[0, 0, Math.PI / 4]} m={M.plain('#b07c3c', { roughness: 0.7 })} cast={false} />
            {[-1, 1].map((k) => <Box key={k} s={[0.1, 0.1, 0.08]} p={[x + k * 0.38, G + 1.6, PZ + 0.05]} r={[0, 0, Math.PI / 4]} m={M.plain('#b07c3c', { roughness: 0.7 })} cast={false} />)}
          </group>
        ))}

        {/* soffits so the roofs are closed from below */}
        <Box s={[R1.w - 0.1, 0.08, R1.d - 0.1]} p={[0, R1.e - 0.02, 0]} m={wood} cast={false} />
        <Box s={[R2.w - 0.1, 0.08, R2.d - 0.1]} p={[0, E2 - 0.02, 0]} m={wood} cast={false} />
        <Box s={[R3.w - 0.1, 0.08, R3.d - 0.1]} p={[0, E3 - 0.02, 0]} m={wood} cast={false} />

        {/* roof 1 */}
        <Roof w={R1.w} d={R1.d} h={R1.h} y={R1.e} m={tile} sag={SAG} lift={LIFT} fascia={false} />
        <Fringe w={R1.w} d={R1.d} y={R1.e} />
        <Struts y={R1.e} m={wood} drop={0.78} faces={[
          { ax: 'z', from: PZ + 0.05, to: R1.d / 2 * 0.93, at: spread(11, 4.8) },
          { ax: 'z', from: -3.5, to: -R1.d / 2 * 0.93, at: spread(8, 4.0) },
          { ax: 'x', from: 4.4, to: R1.w / 2 * 0.93, at: spread(7, 3.4) },
          { ax: 'x', from: -4.4, to: -R1.w / 2 * 0.93, at: spread(7, 3.4) },
        ]} />

        {/* storey 2 and roof 2 */}
        <Storey hx={W2.hx} hz={W2.hz} y={B2} h={W2.h} nf={3} ns={2} />
        <Roof w={R2.w} d={R2.d} h={R2.h} y={E2} m={tile} sag={SAG} lift={LIFT} fascia={false} />
        <Fringe w={R2.w} d={R2.d} y={E2} />
        <Struts y={E2} m={woodL} drop={0.95} th={0.2} faces={faceSet(W2.hx + 0.6, W2.hz + 0.6, R2.w / 2, R2.d / 2, 4, 3, W2.hz + 0.6).map((f) => ({ ...f, at: spread(f.at.length > 3 ? 4 : 3, f.ax === 'z' ? 2.3 : 1.8) }))} />
        <Struts y={E2} m={wood} drop={0.68} faces={faceSet(W2.hx + 0.34, W2.hz + 0.34, R2.w / 2, R2.d / 2, 7, 5)} />

        {/* storey 3 and roof 3 */}
        <Storey hx={W3.hx} hz={W3.hz} y={B3} h={W3.h} nf={2} ns={2} />
        <Roof w={R3.w} d={R3.d} h={R3.h} y={E3} m={tile} sag={SAG} lift={LIFT} fascia={false} />
        <Fringe w={R3.w} d={R3.d} y={E3} />
        <Struts y={E3} m={woodL} drop={0.8} th={0.17} faces={faceSet(W3.hx + 0.6, W3.hz + 0.6, R3.w / 2, R3.d / 2, 3, 3, W3.hz + 0.6).map((f) => ({ ...f, at: spread(3, f.ax === 'z' ? 1.2 : 1.0) }))} />
        <Struts y={E3} m={wood} drop={0.6} faces={faceSet(W3.hx + 0.34, W3.hz + 0.34, R3.w / 2, R3.d / 2, 5, 4)} />
        <Gajur y={APEX - 0.05} s={1.5} />

        {/* stone wrestlers Jaya Malla and Patta Malla on lotus bases flanking the stair */}
        {[-1, 1].map((k) => (
          <group key={k} position={[k * 2.4, 0, 5.2]}>
            <Box s={[1.55, 0.7, 1.55]} p={[0, 0.35, 0]} m={stoneD} />
            <Box s={[1.3, 0.12, 1.3]} p={[0, 0.76, 0]} m={stone} />
            <group position={[0, 0.82, 0]} scale={1.28}><Wrest m={k < 0 ? stone : M.plain('#827d74', { roughness: 0.95 })} tm={M.plain('#9a8a6a', { roughness: 0.9 })} dk={M.plain('#3e3a35', { roughness: 0.9 })} /></group>
          </group>
        ))}
        <Trident p={[3.8, 0.35, 4.7]} h={2.4} />

        {/* chakra pillar (left) and conch pillar (right) */}
        <StonePillar p={[-4.15, 0, 5.4]} chakra />
        <StonePillar p={[4.15, 0, 5.4]} />

        {/* the tall Garuda pillar on the square, in front of the stair and a little right of the axis */}
        <GaruraPillar p={[2.6, 0, 8.6]} />

        {/* diyas along the plinth */}
        {[-3.6, -3.2, 3.2, 3.6].map((x) => <Diyo key={x} p={[x, 0.36, 5.0]} />)}
        {[-1.2, -0.6, 0.6, 1.2].map((x) => <Diyo key={`s${x}`} p={[x, 1.0, 4.35]} />)}

        <Frame s={[12.6, TOTAL + 0.2, 16.2]} p={[0, (TOTAL + 0.2) / 2, 2.6]} />
      </group>
    );
  }

  /* ---------- Env: Tachupal square ---------- */
  function House({ p, rot, w, d, st, brickC, roofC, vr = 0, shop = false }) {
    const M = useM();
    const SH = shop ? 1.9 : 1.75; const H = SH * st;
    const brick = useMatT(brickTex(brickC, '#b3a08c', Math.max(2, w / 1.8), st));
    const wood = M.plain('#5e3a20', { roughness: 0.85 });
    const dk = M.plain('#2a180c', { roughness: 0.9 });
    const tile = useMatT(tileTex(roofC, 4, 4));
    const out = [];
    const wd = M.plain('#8a5a30', { roughness: 0.85 });
    for (let s = 1; s < st; s += 1) {
      const y = s * SH + SH * 0.5;
      const top = s === st - 1;
      const bal = shop ? s === 1 : (s + vr) % 2 === 0;
      if (bal) {
        out.push(<Box key={`bl${s}`} s={[w * 0.8, 0.12, 0.6]} p={[0, s * SH + 0.18, d / 2 + 0.3]} m={wd} cast={false} />);
        out.push(<Box key={`br${s}`} s={[w * 0.8, 0.07, 0.06]} p={[0, s * SH + 0.66, d / 2 + 0.58]} m={wd} cast={false} />);
        [-1, -0.5, 0, 0.5, 1].forEach((t, j) => out.push(<Box key={`bb${s}${j}`} s={[0.06, 0.46, 0.06]} p={[t * w * 0.38, s * SH + 0.42, d / 2 + 0.58]} m={wd} cast={false} />));
        out.push(<Box key={`bw${s}`} s={[w * 0.64, SH * 0.55, 0.1]} p={[0, y, d / 2 + 0.03]} m={wood} cast={false} />);
        [-0.3, 0, 0.3].forEach((t, j) => out.push(<Box key={`bm${s}${j}`} s={[0.06, SH * 0.55, 0.12]} p={[t * w * 0.9, y, d / 2 + 0.06]} m={dk} cast={false} />));
      } else {
        [-1, 1].forEach((k) => out.push(<Box key={`w${s}${k}`} s={[w * 0.26, SH * 0.55, 0.12]} p={[k * w * 0.22, y, d / 2 + 0.03]} m={wood} cast={false} />));
        if (!top) out.push(<Box key={`ws${s}`} s={[w * 0.9, 0.1, 0.16]} p={[0, s * SH + 0.04, d / 2 + 0.05]} m={wd} cast={false} />);
      }
      if (s > 0) out.push(<Box key={`e${s}`} s={[w + 0.4, 0.1, 0.3]} p={[0, s * SH + SH * 0.93, d / 2 + 0.1]} m={wd} cast={false} />);
    }
    const rh = [1.1, 0.8, 1.35, 0.95][(vr + st) % 4];
    const ov = [1.0, 1.4, 0.8][vr % 3];
    return (
      <group position={p} rotation={[0, rot, 0]}>
        <Box s={[w, H, d]} p={[0, H / 2, 0]} m={brick} />
        {shop ? (
          <group>
            <Box s={[w * 0.86, SH * 0.7, 0.14]} p={[0, SH * 0.38, d / 2 + 0.04]} m={dk} cast={false} />
            {[-0.42, -0.14, 0.14, 0.42].map((t, j) => <Cyl key={j} rt={0.07} rb={0.08} h={SH * 0.74} p={[t * w, SH * 0.37, d / 2 + 0.12]} m={wd} seg={6} />)}
            <Box s={[w * 0.96, 0.12, 0.3]} p={[0, SH * 0.78, d / 2 + 0.1]} m={wd} cast={false} />
          </group>
        ) : <Box s={[w * 0.6, SH * 0.66, 0.1]} p={[0, SH * 0.36, d / 2 + 0.03]} m={dk} cast={false} />}
        <Box s={[w + 0.12, 0.12, d + 0.12]} p={[0, H, 0]} m={M.plain('#6a4424')} cast={false} />
        {out}
        <Roof w={w + ov} d={d + ov} h={rh} y={H} m={tile} sag={1.15} lift={0.08} fascia={false} />
      </group>
    );
  }
  const BR = ['#a8664c', '#9e6a52', '#b07458', '#98644e'];
  const RC = ['#7e5e48', '#76594a', '#86664f', '#70584a'];
  // [width, storeys, depth, shopfront?]
  const LEFT = [[5.4, 3, 6.2, 0], [4.6, 2, 6.0, 1], [6.0, 4, 6.6, 0], [5.0, 2, 6.0, 1], [5.6, 3, 6.4, 0], [4.4, 2, 6.0, 1], [5.8, 3, 6.6, 0], [5.2, 2, 6.2, 1], [6.0, 2, 6.0, 1], [5.0, 3, 6.4, 0], [5.4, 2, 6.0, 1], [5.4, 2, 6.0, 1]];
  const RIGHT = [[5.0, 3, 6.4, 0], [5.6, 4, 6.0, 0], [4.8, 3, 6.4, 0], [5.2, 2, 6.0, 1], [6.0, 2, 6.6, 1], [5.0, 3, 6.0, 0], [5.4, 2, 6.2, 1], [4.6, 3, 6.4, 0], [6.0, 2, 6.0, 1], [5.2, 2, 6.2, 1], [5.4, 2, 6.0, 1], [5.4, 3, 6.0, 0]];
  function Row({ list, side }) {
    let z = -17;
    return (
      <group>
        {list.map(([w, st, d, shop], i) => {
          const zc = z + w / 2; z += w;
          if (zc > (side > 0 ? 5 : 2)) return null;
          return <House key={i} p={[side * (13.4 + d / 2), 0, zc]} rot={side < 0 ? Math.PI / 2 : -Math.PI / 2} w={w} d={d} st={st} shop={!!shop} brickC={BR[(i * 3 + (side > 0 ? 1 : 0)) % 4]} roofC={RC[(i * 2 + (side > 0 ? 1 : 3)) % 4]} vr={i} />;
        })}
      </group>
    );
  }
  function Shrine({ p, rot = 0 }) {
    const M = useM();
    const brick = useMatT(brickTex('#a8664c', '#b3a08c', 2, 1));
    const wd = M.plain('#6a4224', { roughness: 0.85 });
    const tile = useMatT(tileTex('#8f6f58', 3, 3));
    return (
      <group position={p} rotation={[0, rot, 0]}>
        <Box s={[3.0, 0.5, 3.0]} p={[0, 0.25, 0]} m={brick} />
        <Box s={[1.7, 1.5, 1.7]} p={[0, 1.25, 0]} m={brick} />
        <Box s={[0.7, 1.0, 0.1]} p={[0, 1.05, 0.86]} m={M.plain('#1c110a')} cast={false} />
        <Roof w={2.9} d={2.9} h={0.8} y={2.0} m={tile} sag={1.25} lift={0.1} fascia={false} />
        <Fringe w={2.9} d={2.9} y={2.0} />
        <Box s={[1.0, 0.9, 1.0]} p={[0, 2.5, 0]} m={wd} />
        <Roof w={1.9} d={1.9} h={0.65} y={2.9} m={tile} sag={1.25} lift={0.1} fascia={false} />
        <Gajur y={3.5} s={0.6} />
      </group>
    );
  }
  function PujariMath() {
    const M = useM();
    const brick = useMatT(brickTex('#a5694f', '#b3a08c', 8, 3));
    const wood = M.plain('#6a4224', { roughness: 0.85 });
    const dk = M.plain('#2a180c');
    const tile = useMatT(tileTex('#8f6f58', 8, 4));
    const SH = 1.9; const H = SH * 3;
    const wins = [];
    for (let s = 0; s < 3; s += 1) for (let i = 0; i < 6; i += 1) {
      const x = -6 + i * 2.4; const y = s * SH + (s === 0 ? 0.95 : 1.1);
      wins.push(<Box key={`${s}${i}`} s={[s === 0 ? 1.1 : 1.3, s === 0 ? 1.2 : 1.1, 0.12]} p={[x, y, 3.53]} m={s === 0 ? dk : wood} cast={false} />);
    }
    return (
      <group position={[4.5, 0, -10.2]}>
        <Box s={[15.4, H, 7]} p={[0, H / 2, 0]} m={brick} />
        {[1, 2].map((s) => <Box key={s} s={[15.5, 0.12, 7.1]} p={[0, s * SH, 0]} m={M.plain('#6a4424')} cast={false} />)}
        {wins}
        <Roof w={16.8} d={8.4} h={1.6} y={H} m={tile} sag={1.1} lift={0.08} fascia={false} />
      </group>
    );
  }
  function Bhimsen() {
    const M = useM();
    const brick = useMatT(brickTex('#a5694f', '#b3a08c', 4, 1));
    const wood = M.plain('#6a4224', { roughness: 0.85 });
    const dark = M.plain('#5a3a24');
    const stone = M.plain('#7a766f', { roughness: 0.95 });
    const tile = useMatT(tileTex('#8f6f58', 5, 5));
    return (
      <group position={[0, 0, 36]} rotation={[0, Math.PI, 0]}>
        <Box s={[10.0, 0.7, 6.6]} p={[0, 0.35, 0]} m={brick} />
        <Box s={[8.0, 2.0, 4.2]} p={[0, 1.7, -0.4]} m={dark} />
        {spread(6, 3.6).map((x) => <Cyl key={x} rt={0.13} rb={0.15} h={2.0} p={[x, 1.7, 2.0]} m={wood} seg={8} />)}
        <Box s={[8.4, 0.3, 0.4]} p={[0, 2.8, 2.0]} m={wood} />
        <Roof w={10.4} d={7.2} h={0.95} y={2.95} m={tile} sag={1.25} lift={LIFT} fascia={false} />
        <Box s={[5.6, 1.8, 3.4]} p={[0, 3.95, -0.3]} m={M.plain('#8a5a30')} />
        {spread(3, 1.6).map((x) => <Box key={x} s={[0.8, 0.9, 0.1]} p={[x, 4.1, 1.45]} m={dark} cast={false} />)}
        <Roof w={7.4} d={5.2} h={0.9} y={4.85} m={tile} sag={1.25} lift={LIFT} fascia={false} />
        <Gajur y={5.7} s={0.9} />
        <Fringe w={10.4} d={7.2} y={2.95} />
        <Fringe w={7.4} d={5.2} y={4.85} />
        {/* Naga column on the dance platform in front */}
        <group position={[0, 0, 5.8]}>
          <Box s={[1.6, 0.4, 1.6]} p={[0, 0.2, 0]} m={stone} />
          <Cyl rt={0.2} rb={0.26} h={4.4} p={[0, 2.6, 0]} m={stone} seg={10} />
          <Ball rad={0.26} sc={[1.5, 0.7, 1]} p={[0, 4.9, 0]} m={stone} />
          <Ball rad={0.12} p={[0, 5.1, 0.12]} m={stone} />
        </group>
      </group>
    );
  }
  function FarTown() {
    const M = useM();
    const list = [
      [-36, 4, 9, 8, 3], [-37, 18, 8, 9, 2], [-36, 32, 9, 8, 3], [-37, 46, 9, 9, 2], [-37, 60, 8, 8, 3],
      [36, 2, 9, 8, 2], [37, 16, 8, 9, 3], [36, 30, 9, 8, 3], [37, 44, 9, 9, 2], [37, 58, 8, 8, 3],
      [-12, -24, 10, 8, 3], [4, -23, 9, 8, 4], [18, -25, 10, 8, 2], [-35, -16, 9, 9, 3], [35, -14, 9, 9, 2],
      [-20, -34, 9, 8, 3], [0, -34, 10, 8, 2], [20, -35, 10, 8, 3],
      [-14, 62, 10, 8, 2], [6, 63, 10, 8, 3], [18, 64, 9, 8, 2],
    ];
    return (
      <group>
        {list.map(([x, z, w, d, st], i) => {
          const H = 1.75 * st;
          return (
            <group key={i} position={[x, 0, z]}>
              <Box s={[w, H, d]} p={[0, H / 2, 0]} m={useMatT(brickTex(BR[i % 4], '#b3a08c', 3, st))} />
              <Roof w={w + 1.2 + (i % 3) * 0.4} d={d + 1.2} h={[1.2, 0.85, 1.5][i % 3]} y={H} m={useMatT(tileTex(RC[(i + 1) % 4], 3, 3))} sag={1.15} lift={0.08} fascia={false} />
            </group>
          );
        })}
      </group>
    );
  }
  /* distant hazy roof silhouettes of the old town, plus layered blue-grey haze at the horizon */
  function Horizon() {
    const M = useM();
    const far = M.plain('#a08e84', { roughness: 1 });
    const farR = M.plain('#8a7468', { roughness: 1 });
    const items = useMemo(() => Array.from({ length: 30 }, (_, i) => {
      const a = (i / 30) * Math.PI * 2 + (i % 3) * 0.04;
      const r = 72 + (i % 4) * 5;
      return { x: Math.sin(a) * r, z: Math.cos(a) * r, w: 7 + (i % 3) * 2, h: 3.5 + (i % 5) * 1.1, a };
    }), []);
    const haze = [0.34, 0.27, 0.21, 0.16, 0.12, 0.09, 0.06, 0.03];
    return (
      <group>
        {items.map((t, i) => (
          <group key={i} position={[t.x, 0, t.z]} rotation={[0, t.a, 0]}>
            <Box s={[t.w, t.h, 6]} p={[0, t.h / 2, 0]} m={far} cast={false} />
            <Roof w={t.w + 1.4} d={7.4} h={1.4 + (i % 3) * 0.5} y={t.h} m={farR} sag={1.15} lift={0.08} fascia={false} />
          </group>
        ))}
        {haze.map((o, i) => (
          <mesh key={i} position={[0, 3 + i * 4, 0]}>
            <cylinderGeometry args={[100, 100, 4.2, 40, 1, true]} />
            <meshBasicMaterial color="#a9b6c6" transparent opacity={o} side={THREE.BackSide} depthWrite={false} fog={false} />
          </mesh>
        ))}
      </group>
    );
  }
  function DattaEnv() {
    const ground = useMatT(brickTex('#a87c5e', '#8c705a', 40, 40));
    const plaza = useMatT(brickTex('#c2946f', '#a88a70', 18, 24));
    const plaza2 = useMatT(brickTex('#c2946f', '#a88a70', 12, 5));
    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]} receiveShadow material={ground}><circleGeometry args={[110, 48]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 17]} receiveShadow material={plaza}><planeGeometry args={[27, 38]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, -3]} receiveShadow material={plaza2}><planeGeometry args={[27, 12]} /></mesh>
        <Row list={LEFT} side={-1} />
        <Row list={RIGHT} side={1} />
        <PujariMath />
        <Shrine p={[-10.2, 0, -0.5]} rot={0.3} />
        <Bhimsen />
        <FarTown />
        <Horizon />
      </group>
    );
  }

  return { 'dattatreya-temple': { Main: DattaMain, Env: DattaEnv } };
}
