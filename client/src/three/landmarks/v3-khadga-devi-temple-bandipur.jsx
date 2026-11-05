// Khadga Devi Temple (Khadga Mai), Bandipur, Tanahun.
// A modest single-gabled RAW RED-BRICK shrine (not a pagoda) whose FRONT is the narrow gable end: carved dark-brown eave band
// with upturned curled tips, copper-brown sheet roof, black iron-grille door between two small pointed niches, a saffron banner
// down the gable, one small hipped lantern with a spire on the ridge. It stands on a raised terrace above an open flagstone
// hilltop, reached by a wide grey stone stair with gate posts; a long red-walled BLUE-roofed rest house lies to the left,
// a huge pipal tree to the right, an ornate cast-iron lamp post at the stair foot. Distant lower town, faint far mountains.
// Units inside the group are metres; the whole model is scaled by 0.4 (a Newar pagoda body ~2.6 units).  Front = +z.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Tree, Frame, THREE, useMemo } = K;
  const S = 0.4;
  const TERR = 2.2; // terrace height above the plaza
  const ZF = 1.5; // temple front wall z
  const D = 9.4; // temple depth
  const LIGHTS = new Set();
  const regLight = (l) => { if (l) LIGHTS.add(l); };
  const GLOW = new THREE.MeshStandardMaterial({ color: '#fff0c8', emissive: '#ffb347', emissiveIntensity: 0.1, roughness: 0.6 });
  const DOORGLOW = new THREE.MeshStandardMaterial({ color: '#1b1511', emissive: '#ff9a3c', emissiveIntensity: 0, roughness: 0.8 });
  const cache = {};

  /* ---------- canvas materials ---------- */
  function canvasMat(key, w, h, draw, rx, ry, opts = {}) {
    const id = `${key}|${rx}|${ry}`;
    if (!cache[id]) {
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      draw(cv.getContext('2d'), w, h);
      const t = new THREE.CanvasTexture(cv);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      t.repeat.set(rx, ry);
      cache[id] = new THREE.MeshStandardMaterial({ map: t, roughness: 0.9, ...opts });
    }
    return cache[id];
  }
  const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const flagMat = (rx, ry) => canvasMat('flag', 256, 256, (g, w, h) => {
    g.fillStyle = '#5b5a55'; g.fillRect(0, 0, w, h);
    const n = 2; const c = w / n;
    for (let i = 0; i < n; i += 1) for (let j = 0; j < n; j += 1) {
      const v = 112 + Math.floor(rnd(i * 7 + j * 13) * 34);
      g.fillStyle = `rgb(${v + 6},${v + 4},${v - 2})`;
      g.fillRect(i * c + 4, j * c + 4, c - 8, c - 8);
      for (let k = 0; k < 30; k += 1) { g.fillStyle = `rgba(90,88,80,${0.12 + rnd(k + i * 3 + j * 5) * 0.12})`; g.fillRect(i * c + 6 + rnd(k * 3 + i) * (c - 14), j * c + 6 + rnd(k * 5 + j) * (c - 14), 3 + rnd(k) * 9, 2 + rnd(k + 9) * 6); }
    }
    for (let k = 0; k < 90; k += 1) { const onx = k % 2; const a = Math.floor(rnd(k * 3) * w); g.fillStyle = k % 3 ? '#6f8a3c' : '#8aa04a'; if (onx) g.fillRect(a, (k % 4 < 2 ? 0 : c) - 3 + rnd(k) * 6, 4 + rnd(k + 2) * 10, 5); else g.fillRect((k % 4 < 2 ? 0 : c) - 3 + rnd(k) * 6, a, 5, 4 + rnd(k + 2) * 10); }
  }, rx, ry, { roughness: 1 });
  const brickCanvas = () => canvasMat('brk', 128, 128, (g, w, h) => {
    g.fillStyle = '#7a3a2a'; g.fillRect(0, 0, w, h);
    for (let r = 0; r < 8; r += 1) {
      for (let c = 0; c < 4; c += 1) {
        const off = r % 2 ? 16 : 0; const k = r * 4 + c;
        const v = rnd(k + 3);
        g.fillStyle = `rgb(${186 + Math.floor(v * 34)},${66 + Math.floor(rnd(k) * 22)},${44 + Math.floor(rnd(k + 8) * 16)})`;
        g.fillRect(((c * 32 + off) % w) + 1, r * 16 + 1, 30, 14);
        if (c * 32 + off + 32 > w) g.fillRect(0, r * 16 + 1, off - 1, 14);
      }
    }
    for (let k = 0; k < 40; k += 1) { g.fillStyle = `rgba(70,30,20,${0.12 + rnd(k) * 0.12})`; g.fillRect(rnd(k + 1) * w, rnd(k + 2) * h, 3, 10 + rnd(k) * 30); }
  }, 2, 2.5, { roughness: 1 });
  const dryStone = (rx, ry) => canvasMat('dry', 256, 128, (g, w, h) => {
    g.fillStyle = '#4d4a44'; g.fillRect(0, 0, w, h);
    let y = 0; let row = 0;
    while (y < h) {
      const rh = 22 + Math.floor(rnd(row) * 12); let x = -rnd(row + 5) * 30;
      while (x < w) {
        const rw = 34 + Math.floor(rnd(x + row * 9) * 40); const v = 128 + Math.floor(rnd(x * 3 + row) * 50);
        g.fillStyle = `rgb(${v},${v - 4},${v - 14})`; g.fillRect(x + 2, y + 2, rw - 4, rh - 4); x += rw;
      }
      y += rh; row += 1;
    }
  }, rx, ry, { roughness: 1 });
  const blueMat = () => canvasMat('blue', 64, 64, (g, w, h) => {
    g.fillStyle = '#1f62b8'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 8; i += 1) { g.fillStyle = '#3b83d8'; g.fillRect(i * 8, 0, 2, h); g.fillStyle = '#16498f'; g.fillRect(i * 8 + 4, 0, 3, h); }
  }, 6, 1, { roughness: 0.45, metalness: 0.35 });
  const copperRoof = (len) => canvasMat('cu', 64, 64, (g, w, h) => {
    g.fillStyle = '#8a5232'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i += 1) { g.fillStyle = '#a0623e'; g.fillRect(0, i * 16, w, 2); g.fillStyle = '#6a3c24'; g.fillRect(0, i * 16 + 2, w, 2); }
    for (let k = 0; k < 40; k += 1) { g.fillStyle = `rgba(40,25,18,${rnd(k) * 0.25})`; g.fillRect(rnd(k + 3) * w, rnd(k + 8) * h, 10, 3); }
  }, 1, len / 1.1, { roughness: 0.75, metalness: 0.2 });

  /* ---------- gabled house prism (pentagon extruded along -z) ---------- */
  function prismGeo(pts, depth) {
    const sh = new THREE.Shape();
    pts.forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y)));
    const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false });
    g.translate(0, 0, -depth);
    return g;
  }
  function Prism({ pts, depth, m, p = [0, 0, 0] }) {
    const g = useMemo(() => prismGeo(pts, depth), []); // eslint-disable-line
    return <mesh geometry={g} material={m} position={p} castShadow receiveShadow />;
  }

  /* ---------- stairs ---------- */
  function Stair({ x = 0, w, z0, n, rise, run, m, extra = 0, mTop }) {
    return (
      <group>
        {Array.from({ length: n }, (_, i) => {
          const h = (i + 1) * rise + extra;
          return <Box key={i} s={[w, h, run]} p={[x, h / 2, z0 - (i + 0.5) * run]} m={i % 2 || !mTop ? m : mTop} />;
        })}
      </group>
    );
  }
  function Post({ p, h = 2.4, w = 0.45, m }) {
    return (
      <group position={p}>
        <Box s={[w, h, w]} p={[0, h / 2, 0]} m={m} />
        <Box s={[w + 0.14, 0.14, w + 0.14]} p={[0, h + 0.07, 0]} m={m} />
        <Box s={[w - 0.1, 0.2, w - 0.1]} p={[0, h + 0.24, 0]} m={m} />
      </group>
    );
  }

  /* ---------- the temple ---------- */
  function Temple() {
    const M = useM();
    const brick = brickCanvas();
    const brickLight = M.plain('#d2573a', { roughness: 1 });
    const brown = M.plain('#4a2a1c', { roughness: 0.7 });
    const carved = M.plain('#5c3322', { roughness: 0.65 });
    const gold = M.plain('#d6a93c', { roughness: 0.4, metalness: 0.6 });
    const shutter = M.plain('#6b3a26', { roughness: 0.8 });
    const iron = M.plain('#1d1815', { roughness: 0.5, metalness: 0.5 });
    const saffron = M.plain('#f0b21e', { roughness: 0.85 });
    const roofM = copperRoof(D + 1.4);
    const frameL = M.plain('#a8704c', { roughness: 0.8 });
    const stoneSill = M.plain('#8a857c', { roughness: 1 });
    const hull = [[-3.15, 0], [3.15, 0], [3.0, 5.6], [0, 7.6], [-3.0, 5.6]];
    const ang = Math.atan2(2.667, 4.0);
    const rl = Math.hypot(4.0, 2.667);
    const wx = (y) => 3.15 - 0.027 * y;
    const winZ = [-1.9, -3.7, -5.5, -7.3];
    const latZ = [-2.8, -4.6, -6.4];
    return (
      <group position={[0, TERR, ZF]}>
        <Prism pts={hull} depth={D} m={brick} />
        {/* plinth band & string course */}
        <Box s={[6.45, 0.5, 0.12]} p={[0, 0.25, 0.04]} m={brickLight} />
        <Box s={[6.12, 0.1, 0.07]} p={[0, 4.3, 0.03]} m={brickLight} />
        <Box s={[6.12, 0.08, 0.06]} p={[0, 1.1, 0.03]} m={brickLight} />
        {/* roof: two copper sheets, ridge cap, deep carved side fascias */}
        {[1, -1].map((sg) => (
          <group key={sg}>
            <mesh position={[sg * 2.0, 6.44, (0.4 - D) / 2]} rotation={[0, 0, -sg * ang]} material={roofM} castShadow receiveShadow>
              <boxGeometry args={[rl + 0.05, 0.16, D + 1.4]} />
            </mesh>
            <Box s={[rl, 0.34, 0.14]} p={[sg * 2.0, 6.32, 0.92]} r={[0, 0, -sg * ang]} m={carved} />
            <Box s={[0.14, 0.34, D + 1.4]} p={[sg * 3.98, 5.0, (0.4 - D) / 2]} r={[0, 0, -sg * ang]} m={carved} />
            <Box s={[0.1, 0.07, D + 1.3]} p={[sg * 3.99, 5.12, (0.4 - D) / 2]} r={[0, 0, -sg * ang]} m={gold} />
          </group>
        ))}
        <Box s={[0.5, 0.2, D + 1.45]} p={[0, 7.85, (0.4 - D) / 2]} m={brown} />
        <Box s={[0.16, 0.08, D + 1.45]} p={[0, 7.99, (0.4 - D) / 2]} m={gold} />
        {/* front eave band with upturned curled tips */}
        <Box s={[7.4, 0.55, 0.95]} p={[0, 5.45, 0.45]} m={carved} />
        <Box s={[7.44, 0.1, 1.0]} p={[0, 5.8, 0.46]} m={brown} />
        <Box s={[7.4, 0.12, 0.05]} p={[0, 5.3, 0.95]} m={gold} />
        <Box s={[7.1, 0.1, 0.05]} p={[0, 5.62, 0.95]} m={gold} />
        {Array.from({ length: 13 }, (_, i) => <Box key={i} s={[0.14, 0.2, 0.05]} p={[-3.0 + i * 0.5, 5.46, 0.96]} m={gold} />)}
        {[1, -1].map((sg) => (
          <group key={`t${sg}`}>
            <Box s={[0.8, 0.26, 0.95]} p={[sg * 4.0, 5.6, 0.45]} r={[0, 0, sg * 0.4]} m={carved} />
            <Box s={[0.55, 0.16, 0.9]} p={[sg * 4.42, 5.85, 0.45]} r={[0, 0, sg * 0.7]} m={carved} />
            <Box s={[0.4, 0.09, 0.85]} p={[sg * 4.68, 6.12, 0.45]} r={[0, 0, sg * 1.0]} m={brown} />
            <Box s={[0.3, 0.05, 0.8]} p={[sg * 4.85, 6.38, 0.45]} r={[0, 0, sg * 1.2]} m={brown} />
            <Box s={[0.5, 0.05, 0.05]} p={[sg * 4.0, 5.66, 0.97]} r={[0, 0, sg * 0.4]} m={gold} />
          </group>
        ))}
        {/* saffron banner down the gable */}
        <Box s={[0.36, 2.6, 0.05]} p={[0, 6.1, 0.99]} m={saffron} />
        <Box s={[0.5, 0.35, 0.06]} p={[0, 4.8, 1.0]} r={[0, 0, Math.PI / 4]} m={gold} />
        <Box s={[0.5, 0.18, 0.06]} p={[0, 7.4, 0.97]} m={saffron} />
        {/* door with iron grille */}
        <Box s={[2.4, 3.5, 0.14]} p={[0, 2.5, 0.07]} m={shutter} />
        <Box s={[1.95, 3.2, 0.16]} p={[0, 2.45, 0.09]} m={DOORGLOW} />
        {[-0.8, -0.4, 0, 0.4, 0.8].map((x) => <Box key={x} s={[0.06, 3.2, 0.06]} p={[x, 2.45, 0.19]} m={iron} />)}
        {[0.9, 1.5, 2.1, 2.7, 3.3, 3.9].map((y) => <Box key={y} s={[1.95, 0.06, 0.06]} p={[0, y, 0.19]} m={iron} />)}
        <Box s={[0.06, 3.2, 0.08]} p={[0, 2.45, 0.2]} m={shutter} />
        {/* pointed niches with small figures */}
        {[-2.0, 2.0].map((x) => (
          <group key={x} position={[x, 2.7, 0.04]}>
            <Box s={[0.62, 0.95, 0.07]} p={[0, 0, 0]} m={brickLight} />
            <Box s={[0.42, 0.75, 0.1]} p={[0, -0.02, 0.03]} m={iron} />
            <Box s={[0.3, 0.3, 0.1]} p={[0, 0.4, 0.03]} r={[0, 0, Math.PI / 4]} m={iron} />
            <Ball rad={0.1} p={[0, -0.1, 0.1]} sc={[1, 1.5, 0.7]} m={M.plain('#d8872a')} />
          </group>
        ))}
        {/* brick entrance steps */}
        <Stair w={3.3} x={0} z0={0.05 + 1.45} n={4} rise={0.175} run={0.36} m={brickLight} />
        {/* side walls: shuttered windows, lattice windows, rear door, railing */}
        {[1, -1].map((sg) => (
          <group key={`s${sg}`}>
            {winZ.map((z) => (
              <group key={z} position={[sg * (wx(3.4) + 0.03), 3.5, z]}>
                <Box s={[0.1, 1.7, 1.1]} m={frameL} />
                <Box s={[0.14, 1.5, 0.9]} p={[sg * 0.02, 0, 0]} m={shutter} />
                <Box s={[0.16, 1.5, 0.06]} p={[sg * 0.02, 0, 0]} m={brown} />
                <Box s={[0.16, 0.06, 0.9]} p={[sg * 0.02, 0.35, 0]} m={brown} />
                <Box s={[0.18, 0.08, 1.2]} p={[sg * 0.05, -0.9, 0]} m={stoneSill} />
              </group>
            ))}
            {latZ.map((z) => (
              <group key={z} position={[sg * (wx(1.7) + 0.03), 1.9, z]}>
                <Box s={[0.1, 0.84, 0.84]} m={frameL} />
                <Box s={[0.13, 0.7, 0.7]} p={[sg * 0.02, 0, 0]} m={iron} />
                {[-0.22, 0, 0.22].map((o) => <Box key={o} s={[0.16, 0.7, 0.05]} p={[sg * 0.03, 0, o]} m={shutter} />)}
                {[-0.22, 0, 0.22].map((o) => <Box key={`h${o}`} s={[0.16, 0.05, 0.7]} p={[sg * 0.03, o, 0]} m={shutter} />)}
                <Box s={[0.16, 0.07, 0.95]} p={[sg * 0.04, -0.46, 0]} m={stoneSill} />
              </group>
            ))}
            <Box s={[0.1, 2.3, 0.95]} p={[sg * (wx(1.4) + 0.02), 1.65, -8.4]} m={shutter} />
          </group>
        ))}
        {[-3.4, -4.4, -5.4, -6.4, -7.4, -8.4].map((z) => <Box key={z} s={[0.14, 1.0, 0.14]} p={[3.85, 0.9, z]} m={shutter} />)}
        <Box s={[0.12, 0.12, 5.2]} p={[3.85, 1.35, -5.9]} m={shutter} />
        <Box s={[0.1, 0.07, 5.2]} p={[3.85, 0.9, -5.9]} m={shutter} />
        {/* lantern: two-tier small hipped roof + spire, centred toward the rear of the ridge */}
        <group position={[0, 7.75, -6.4]}>
          <Box s={[1.4, 1.0, 1.4]} p={[0, 0.5, 0]} m={brick} />
          {[1, -1].map((s2) => <Box key={s2} s={[0.45, 0.5, 0.06]} p={[0, 0.55, s2 * 0.71]} m={shutter} />)}
          {[1, -1].map((s2) => <Box key={`x${s2}`} s={[0.06, 0.5, 0.45]} p={[s2 * 0.71, 0.55, 0]} m={shutter} />)}
          <Box s={[2.1, 0.14, 2.1]} p={[0, 1.07, 0]} m={carved} />
          <mesh position={[0, 1.5, 0]} rotation={[0, Math.PI / 4, 0]} material={M.plain('#9a5a3a', { roughness: 0.5, metalness: 0.45 })} castShadow>
            <coneGeometry args={[1.48, 0.8, 4]} />
          </mesh>
          <Box s={[0.7, 0.45, 0.7]} p={[0, 2.0, 0]} m={brick} />
          <Box s={[1.15, 0.1, 1.15]} p={[0, 2.27, 0]} m={carved} />
          <mesh position={[0, 2.62, 0]} rotation={[0, Math.PI / 4, 0]} material={M.plain('#9a5a3a', { roughness: 0.5, metalness: 0.45 })} castShadow>
            <coneGeometry args={[0.78, 0.65, 4]} />
          </mesh>
          <Cyl rt={0.03} rb={0.06} h={0.8} p={[0, 3.3, 0]} m={gold} seg={8} />
          <Ball rad={0.1} p={[0, 3.75, 0]} m={gold} />
        </group>
        {/* diyas on the steps (lit at dusk) */}
        {[-0.9, -0.3, 0.3, 0.9].map((x) => <Cyl key={x} rt={0.07} rb={0.05} h={0.05} p={[x, 0.78, 1.58]} m={GLOW} seg={8} />)}
        <pointLight ref={regLight} position={[0, 1.5, 2.4]} intensity={0} distance={9} color="#ffa24a" userData={{ k: 5 }} />
        <pointLight ref={regLight} position={[0, 4.4, 1.6]} intensity={0} distance={7} color="#ffb870" userData={{ k: 3 }} />
        <pointLight ref={regLight} position={[0, 6.4, 3.2]} intensity={0} distance={8} color="#ffb060" userData={{ k: 6 }} />
      </group>
    );
  }

  /* ---------- cast-iron lamp post ---------- */
  function LampPost({ p }) {
    const M = useM();
    const bz = M.plain('#4e3020', { roughness: 0.45, metalness: 0.6 });
    const lant = (x, y, k) => (
      <group key={`${x}${y}`} position={[x, y, 0]}>
        <Cyl rt={0.14} rb={0.1} h={0.1} p={[0, -0.22, 0]} m={bz} seg={8} />
        <Cyl rt={0.19} rb={0.12} h={0.36} m={GLOW} seg={8} />
        <mesh position={[0, 0.3, 0]} material={bz}><coneGeometry args={[0.26, 0.24, 8]} /></mesh>
        {k && <Ball rad={0.05} p={[0, 0.46, 0]} m={bz} />}
      </group>
    );
    return (
      <group position={p}>
        <Cyl rt={0.34} rb={0.42} h={0.25} p={[0, 0.12, 0]} m={bz} seg={8} />
        <Cyl rt={0.2} rb={0.3} h={0.7} p={[0, 0.6, 0]} m={bz} seg={8} />
        <Cyl rt={0.07} rb={0.1} h={3.2} p={[0, 2.2, 0]} m={bz} seg={8} />
        <mesh position={[0, 3.55, 0]} material={bz}><torusGeometry args={[0.55, 0.04, 6, 24]} /></mesh>
        {[0, 1, 2, 3, 4, 5].map((i) => <Box key={i} s={[1.04, 0.03, 0.03]} p={[0, 3.55, 0]} r={[0, 0, (i * Math.PI) / 6]} m={bz} />)}
        <Cyl rt={0.1} rb={0.1} h={0.2} p={[0, 3.55, 0]} r={[Math.PI / 2, 0, 0]} m={bz} seg={8} />
        <Box s={[1.5, 0.06, 0.06]} p={[0, 2.75, 0]} m={bz} />
        <Box s={[0.05, 0.4, 0.05]} p={[0.75, 2.92, 0]} m={bz} />
        <Box s={[0.05, 0.4, 0.05]} p={[-0.75, 2.92, 0]} m={bz} />
        {lant(0, 3.95, true)}
        {lant(0.75, 3.35, false)}
        {lant(-0.75, 3.35, false)}
        <pointLight ref={regLight} position={[0, 3.6, 0.5]} intensity={0} distance={13} color="#ffc27a" userData={{ k: 9 }} />
      </group>
    );
  }

  /* ---------- MAIN ---------- */
  function KhadgaMain() {
    const M = useM();
    const stone = M.plain('#7a7873', { roughness: 1 });
    const stoneTop = M.plain('#95938c', { roughness: 1 });
    const wall = dryStone(6, 1);
    const grey = M.plain('#85867f', { roughness: 0.95 });
    const white = M.plain('#e9ece8', { roughness: 0.7 });
    const pane = M.plain('#b9c6cc', { roughness: 0.3, metalness: 0.3 });
    const NS = 11;
    const rise = TERR / NS;
    return (
      <group scale={S}>
        <Frame s={[15, 12.2, 17.5]} p={[0, 6.1, 0.2]} />
        {/* terrace */}
        <Box s={[26, TERR, 15.5]} p={[6, TERR / 2, 3.5 - 7.75]} m={wall} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[6, TERR + 0.01, 3.5 - 7.75]} receiveShadow material={flagMat(6, 3.6)}>
          <planeGeometry args={[26, 15.5]} />
        </mesh>
        {/* wide grey stone stair + cheek walls + gate posts */}
        <Stair w={8} x={0} z0={3.5 + NS * 0.42} n={NS} rise={rise} run={0.42} m={stone} mTop={stoneTop} />
        <Stair w={0.7} x={-4.4} z0={3.5 + NS * 0.42} n={NS} rise={rise} run={0.42} m={grey} extra={0.55} />
        <Stair w={0.7} x={4.4} z0={3.5 + NS * 0.42} n={NS} rise={rise} run={0.42} m={grey} extra={0.55} />
        <Post p={[-4.4, TERR + 0.55, 3.9]} m={grey} />
        <Post p={[4.4, TERR + 0.55, 3.9]} m={grey} />
        <Post p={[4.4, TERR + 0.55, 6.1]} h={1.6} w={0.4} m={grey} />
        {/* narrow side stair at the left with its gateway and the white frame */}
        <Stair w={1.4} x={-6.2} z0={3.5 + NS * 0.42} n={NS} rise={rise} run={0.42} m={stone} mTop={stoneTop} />
        <Stair w={0.6} x={-5.2} z0={3.5 + NS * 0.42} n={NS} rise={rise} run={0.42} m={grey} extra={0.5} />
        <Post p={[-7.1, 0, 8.0]} h={2.5} w={0.4} m={grey} />
        <Post p={[-5.3, 0, 8.0]} h={2.5} w={0.4} m={grey} />
        <Box s={[2.3, 0.3, 0.5]} p={[-6.2, 2.7, 8.0]} m={grey} />
        <Stair w={0.7} x={-7.15} z0={3.5 + NS * 0.42} n={NS} rise={rise} run={0.42} m={wall} extra={0.9} />
        <Box s={[0.8, TERR + 1.0, 1.0]} p={[-7.15, (TERR + 1.0) / 2, 3.9]} m={wall} />
        <group position={[-5.8, TERR + 1.6, 4.4]} rotation={[0.06, 0.25, -0.16]}>
          <Box s={[0.14, 0.14, 1.9]} p={[0, 1.4, 0]} m={white} />
          <Box s={[0.14, 0.14, 1.9]} p={[0, -1.4, 0]} m={white} />
          <Box s={[0.14, 2.9, 0.14]} p={[0, 0, 0.9]} m={white} />
          <Box s={[0.14, 2.9, 0.14]} p={[0, 0, -0.9]} m={white} />
          <Box s={[0.14, 2.8, 0.08]} p={[0, 0, 0]} m={white} />
          {[-0.45, 0.45].map((z) => [-0.7, 0.7].map((y) => <Box key={`${z}${y}`} s={[0.1, 1.15, 0.7]} p={[0.01, y, z]} m={pane} />))}
        </group>
        {/* extra dry-stone courses and coping on the terrace face */}
        {[0.55, 1.1, 1.65].map((y) => <Box key={y} s={[14.4, 0.1, 0.14]} p={[11.8, y, 3.55]} m={stoneTop} />)}
        <Box s={[26.2, 0.14, 15.7]} p={[6, TERR - 0.07, -4.25]} m={stoneTop} />
        <Box s={[0.5, 0.3, 2.0]} p={[-5.8, TERR + 0.15, 4.4]} m={grey} />
        <Temple />
        <LampPost p={[7.2, 0, 9.0]} />
        <Cyl rt={0.4} rb={0.4} h={0.1} p={[7.2, 0.05, 9]} m={grey} seg={8} />
      </group>
    );
  }

  /* ---------- ENV ---------- */
  function Sky() {
    const mat = useMemo(() => new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: { top: { value: new THREE.Color('#4f88d0') }, bot: { value: new THREE.Color('#d4e4f0') } },
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 bot; varying vec3 vP; void main(){ float h = normalize(vP).y; float t = smoothstep(-0.02, 0.55, h); vec3 c = mix(bot, top, t); gl_FragColor = vec4(pow(c, vec3(0.4545)), 1.0); }',
    }), []);
    const before = (renderer, scene) => {
      const bg = scene.background;
      const dusk = !!(bg && bg.isColor && bg.getHSL({}).l < 0.2);
      mat.uniforms.top.value.set(dusk ? '#150c2a' : '#4f88d0');
      mat.uniforms.bot.value.set(dusk ? '#4a2a58' : '#d4e4f0');
      LIGHTS.forEach((l) => { l.intensity = dusk ? (l.userData.k || 3) : 0; });
      GLOW.emissiveIntensity = dusk ? 2.2 : 0.1;
      DOORGLOW.emissiveIntensity = dusk ? 0.9 : 0;
    };
    return <mesh material={mat} renderOrder={-10} onBeforeRender={before}><sphereGeometry args={[175, 24, 16]} /></mesh>;
  }

  function Pipal({ p }) {
    const M = useM();
    const bark = M.plain('#6b5a48', { roughness: 1 });
    const leaves = useMemo(() => ['#4a7034', '#56803a', '#3f6a30', '#5d8a3e'], []);
    const blobs = useMemo(() => {
      const out = [];
      for (let i = 0; i < 22; i += 1) {
        const a = (i / 22) * Math.PI * 2 * 2.3;
        const r = 1.2 + (i % 5) * 1.0 + rnd(i) * 1.0;
        out.push([Math.cos(a) * r * 0.8, 8 + rnd(i + 4) * 3 - (r > 4 ? 0.8 : 0), Math.sin(a) * r * 0.8, 2.0 + rnd(i + 9) * 1.3, i % 4]);
      }
      return out;
    }, []);
    return (
      <group position={p}>
        <Cyl rt={0.75} rb={1.35} h={5} p={[0, 2.5, 0]} m={bark} seg={9} />
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2 + 0.4;
          return <Cyl key={i} rt={0.28} rb={0.5} h={6.2} p={[Math.cos(a) * 1.8, 6.6, Math.sin(a) * 1.8]} r={[Math.sin(a) * 0.62, 0, -Math.cos(a) * 0.62]} m={bark} seg={7} />;
        })}
        {Array.from({ length: 9 }, (_, i) => { const a = (i / 9) * Math.PI * 2; return (
          <mesh key={`w${i}`} position={[Math.cos(a) * 4.0, 8.0 + rnd(i + 30) * 1.0, Math.sin(a) * 4.0]} scale={[1.5, 0.5, 1.5]} castShadow>
            <icosahedronGeometry args={[2.3 + rnd(i + 2) * 0.8, 1]} />
            <meshStandardMaterial color={leaves[(i + 1) % 4]} roughness={1} flatShading />
          </mesh>); })}
        {blobs.map(([x, y, z, r, c], i) => (
          <mesh key={i} position={[x, y, z]} scale={[1.25, 0.72, 1.25]} castShadow>
            <icosahedronGeometry args={[r, 1]} />
            <meshStandardMaterial color={leaves[c]} roughness={1} flatShading />
          </mesh>
        ))}
      </group>
    );
  }

  function Pati() {
    const M = useM();
    const wallM = M.plain('#c43a2a', { roughness: 0.9 });
    const brown = M.plain('#5a3422', { roughness: 0.8 });
    const iron = M.plain('#26201c', { roughness: 0.5, metalness: 0.4 });
    const white = M.plain('#f1f1ec', { roughness: 0.7 });
    const blue = blueMat();
    const base = M.plain('#8d8a84', { roughness: 1 });
    const cx = -10.6; const L = 15.4; const z0 = 8.6; // spans z 8.6 .. -6.8
    const hw = 2.6;
    const hull = [[-hw, 0], [hw, 0], [hw, 3.0], [0, 4.25], [-hw, 3.0]];
    const ang = Math.atan2(1.25, 3.0);
    const rl = Math.hypot(3.0, 1.25);
    const zs = [6.6, 3.2, -0.2, -3.6, -5.8];
    return (
      <group position={[cx, 0, 0]}>
        <Prism pts={hull} depth={L} m={wallM} p={[0, 0, z0]} />
        <Box s={[hw * 2 + 0.2, 0.35, L + 0.1]} p={[0, 0.17, z0 - L / 2]} m={base} />
        {[1, -1].map((sg) => (
          <mesh key={sg} position={[sg * 1.5, 3.65, z0 - L / 2]} rotation={[0, 0, -sg * ang]} material={blue} castShadow receiveShadow>
            <boxGeometry args={[rl + 0.8, 0.1, L + 0.9]} />
          </mesh>
        ))}
        <Box s={[0.3, 0.14, L + 0.9]} p={[0, 4.3, z0 - L / 2]} m={M.plain('#16498f')} />
        {/* long wall facing the plaza (+x): doors, grilled windows, notice boards */}
        {[5.4, 0.9, -4.7].map((z) => <Box key={z} s={[0.1, 2.1, 1.0]} p={[hw + 0.03, 1.35, z]} m={brown} />)}
        {[7.6, 2.2, -2.1, -3.0].map((z, i) => (
          <group key={z} position={[hw + 0.03, 1.8, z]}>
            <Box s={[0.1, 0.7, 0.9]} m={white} />
            <Box s={[0.12, 0.56, 0.74]} m={iron} />
          </group>
        ))}
        {[4.0, -1.5].map((z) => <Box key={z} s={[0.06, 1.0, 1.5]} p={[hw + 0.03, 1.85, z]} m={white} />)}
        {zs.map((z) => <Box key={z} s={[0.12, 0.5, 0.12]} p={[hw + 0.05, 0.6, z]} m={base} />)}
        {/* end wall facing the stair (+z) */}
        <Box s={[1.0, 2.0, 0.1]} p={[0, 1.3, z0 + 0.03]} m={brown} />
        <group position={[-1.3, 1.8, z0 + 0.04]}><Box s={[0.9, 0.7, 0.08]} m={white} /><Box s={[0.74, 0.56, 0.1]} m={iron} /></group>
        {/* pati veranda lamp-glow windows */}
        <Box s={[0.05, 0.5, 0.7]} p={[hw + 0.07, 1.8, 5.4 - 3.3]} m={GLOW} />
      </group>
    );
  }

  function TownBlocks() {
    const blocks = useMemo(() => {
      const cols = ['#e8e0d0', '#d9c9b2', '#c9d6dd', '#e6c9b8', '#bfc8c0', '#f0eee8', '#d8b0a0', '#a9b7c9'];
      const out = [];
      for (let i = 0; i < 46; i += 1) {
        const a = rnd(i * 3 + 1) * Math.PI * 2;
        const r = 58 + rnd(i * 5 + 2) * 36;
        const w = 4 + rnd(i * 7 + 3) * 8;
        const h = 4 + rnd(i * 11 + 4) * (i % 7 === 0 ? 22 : 9);
        const ground = -16 - (r - 58) * 0.35;
        out.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, w, h, y: ground, c: cols[i % cols.length], roof: i % 3 === 0 });
      }
      return out;
    }, []);
    return (
      <group>
        {blocks.map((b, i) => (
          <group key={i} position={[b.x, b.y, b.z]}>
            <mesh position={[0, b.h / 2, 0]}><boxGeometry args={[b.w, b.h, b.w * 0.9]} /><meshStandardMaterial color={b.c} roughness={1} /></mesh>
            {b.roof && <mesh position={[0, b.h + 0.4, 0]}><boxGeometry args={[b.w + 0.4, 0.8, b.w * 0.9 + 0.4]} /><meshStandardMaterial color="#2f6db5" roughness={0.7} /></mesh>}
          </group>
        ))}
      </group>
    );
  }

  function MidHouses() {
    const list = useMemo(() => {
      const cols = ['#eadfca', '#d8b89e', '#c9d6dd', '#e8d0c0', '#f0eee8', '#cf9f8a'];
      const out = [];
      const spots = [[-26, 38], [-18, 41], [-8, 40], [2, 43], [12, 40], [22, 41], [30, 36], [-33, 33], [34, 28], [-36, 20], [37, 14], [-38, 6], [8, 47], [-14, 47]];
      spots.forEach(([x, z], i) => {
        const r = Math.hypot(x, z);
        const y = -Math.max(0, r - 40) * (16 / 18) - 0.6;
        out.push({ x, z, y, w: 3.2 + rnd(i * 3) * 2.2, h: 2.6 + rnd(i * 5 + 1) * 2.6, c: cols[i % cols.length], blue: i % 3 !== 1, ry: rnd(i + 7) * 0.5 - 0.25 });
      });
      return out;
    }, []);
    return (
      <group>
        {list.map((b, i) => (
          <group key={i} position={[b.x, b.y, b.z]} rotation={[0, b.ry, 0]}>
            <mesh position={[0, b.h / 2, 0]}><boxGeometry args={[b.w, b.h, b.w * 0.8]} /><meshStandardMaterial color={b.c} roughness={1} /></mesh>
            <mesh position={[0, b.h + 0.25, 0]}><boxGeometry args={[b.w + 0.5, 0.5, b.w * 0.8 + 0.5]} /><meshStandardMaterial color={b.blue ? '#2f6db5' : '#8a4a3a'} roughness={0.7} /></mesh>
          </group>
        ))}
      </group>
    );
  }

  function KhadgaEnv() {
    const M = useM();
    const grass = M.plain('#93ad5e', { roughness: 1 });
    const hillM = M.plain('#86a458', { roughness: 1 });
    const lowM = M.plain('#7a9a62', { roughness: 1 });
    const stoneWall = dryStone(8, 1);
    const haze = M.plain('#9db3b0', { roughness: 1 });
    const haze2 = M.plain('#b4c6d6', { roughness: 1 });
    const snow = M.plain('#d6e0ea', { roughness: 1 });
    return (
      <>
      <Sky />
      <group scale={S}>
        {/* hilltop: flat grass crown, then the slope down to the valley */}
        <mesh position={[0, -0.06, 0]} receiveShadow material={hillM}><cylinderGeometry args={[40, 40, 0.1, 48]} /></mesh>
        <mesh position={[0, -8, 0]} material={hillM}><cylinderGeometry args={[40, 58, 16, 48, 1, true]} /></mesh>
        <mesh position={[0, -21, 0]} material={lowM}><cylinderGeometry args={[58, 100, 10, 48, 1, true]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -27, 0]} material={lowM}><circleGeometry args={[140, 40]} /></mesh>
        {/* raised grass bank behind the terrace */}
        <mesh position={[12, TERR / 2 - 0.1, -24]} receiveShadow material={grass}><cylinderGeometry args={[19, 24, TERR, 32]} /></mesh>
        {/* open flagstone plaza in front of the stair */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1, 0.02, 14]} receiveShadow material={flagMat(11, 9)}><planeGeometry args={[44, 36]} /></mesh>
        {/* dry-stone parapet along the hill brim */}
        <Box s={[44, 0.9, 0.6]} p={[1, 0.45, 31.8]} m={stoneWall} />
        <Box s={[0.6, 0.9, 36]} p={[23.3, 0.45, 14]} m={stoneWall} />
        <Pati />
        <Pipal p={[26, TERR, -2]} />
        {/* broadleaf trees behind and around the hilltop */}
        {[[-2, TERR, -15, 4.2], [3, TERR, -19, 3.6], [20, TERR, -12, 3.8], [31, 0, 14, 3.6], [-16, 0, -12, 3.4], [-20, 0, 12, 3.8], [-24, 0, -2, 4.4], [27, 0, 20, 3.4], [-12, TERR, -20, 4.0], [10, TERR, -30, 4.6]].map(([x, y, z, s], i) => <Tree key={i} p={[x, y, z]} s={s} />)}
        <TownBlocks />
        <MidHouses />
        {/* far ridges and faint snow peaks */}
        {[[-60, -110, 28, 70], [10, -125, 32, 80], [95, -90, 26, 65], [-120, -20, 30, 76], [120, 40, 26, 68], [-80, 90, 24, 65]].map(([x, z, h, r], i) => (
          <mesh key={i} position={[x, -26 + h / 2 - 4, z]} scale={[1, 1, 0.8]}><coneGeometry args={[r, h, 7]} />{i % 2 ? <primitive object={haze2} attach="material" /> : <primitive object={haze} attach="material" />}</mesh>
        ))}
        {[[-90, -190, 30, 26], [-40, -195, 38, 32], [10, -192, 33, 28], [60, -185, 28, 24], [120, -160, 26, 24]].map(([x, z, h, r], i) => (
          <group key={i} position={[x, -26, z]}>
            <mesh position={[0, h / 2, 0]}><coneGeometry args={[r, h, 6]} /><primitive object={haze2} attach="material" /></mesh>
            <mesh position={[0, h * 0.86, 0]}><coneGeometry args={[r * 0.24, h * 0.28, 6]} /><primitive object={snow} attach="material" /></mesh>
          </group>
        ))}
      </group>
      </>
    );
  }

  return { 'khadga-devi-temple-bandipur': { Main: KhadgaMain, Env: KhadgaEnv } };
}
