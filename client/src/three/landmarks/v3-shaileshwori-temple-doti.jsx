/* Shaileshwori Temple, Silgadhi (Dipayal Silgadhi), Doti. A small, brightly painted hill-shrine compound: a wide low
   single-storey gabled hall (pink/white brick-pattern gable, red scalloped bargeboards, gold-red fringe valance, three star
   lattice windows) with a small 2-tier tower behind its ridge, a painted gateway screen in front (red lantern posts, blue
   deity panel, OM plaques, iron grilles, two golden lions) and a giant gold trident, on a big stone courtyard under old trees.
   1 unit = 1 m. Front = +z. Dimensions are estimates from six photographs. */
export default function make(K) {
  const { useM, Box, Cyl, Ball, Frame, Lion, Diyo, THREE, useMemo } = K;

  const rnd = (i) => { const v = Math.sin(i * 12.9898 + 3.7) * 43758.5453; return v - Math.floor(v); };

  /* ---------- painted canvas textures ---------- */
  const texCache = new Map();
  const matCache = new Map();
  function canvasTex(key, w, h, draw, rx, ry) {
    const id = `${key}|${rx}|${ry}`;
    if (!texCache.has(id)) {
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      draw(c.getContext('2d'), w, h);
      const t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(rx, ry);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      texCache.set(id, t);
    }
    return texCache.get(id);
  }
  function tmat(key, w, h, draw, rx = 1, ry = 1, opts = {}) {
    const id = `${key}|${rx}|${ry}|${JSON.stringify(opts)}`;
    if (!matCache.has(id)) {
      matCache.set(id, new THREE.MeshStandardMaterial({ map: canvasTex(key, w, h, draw, rx, ry), roughness: 0.85, ...opts }));
    }
    return matCache.get(id);
  }
  const drawBrick = (g, w, h) => {
    g.fillStyle = '#e7aeb8'; g.fillRect(0, 0, w, h);
    const rows = 8, rh = h / rows;
    for (let r = 0; r < rows; r += 1) {
      const y = r * rh;
      if (r % 4 === 3) {
        g.fillStyle = '#f8f1ea'; g.fillRect(0, y, w, rh);
        g.fillStyle = '#c9423a'; g.fillRect(0, y + rh * 0.42, w, rh * 0.16);
      } else {
        g.fillStyle = '#f6efe8'; g.fillRect(0, y, w, 3);
        const off = (r % 2) * (w / 8);
        for (let x = off; x < w; x += w / 4) { g.fillRect(x, y, 3, rh); }
        g.fillStyle = 'rgba(190,110,125,0.25)';
        for (let x = off + 6; x < w; x += w / 4) { g.fillRect(x, y + 6, w / 4 - 12, rh - 12); }
      }
    }
  };
  const drawFringe = (g, w, h) => {
    g.fillStyle = '#b8231f'; g.fillRect(0, 0, w, h);
    const n = 8;
    for (let i = 0; i < n; i += 1) {
      g.fillStyle = i % 2 ? '#e6b53a' : '#b8231f';
      g.fillRect((i * w) / n, 0, w / n, h);
    }
    g.fillStyle = '#7a1612'; g.fillRect(0, 0, w, h * 0.18);
    g.fillStyle = '#e6b53a'; g.fillRect(0, h * 0.18, w, h * 0.08);
  };
  const drawDeity = (g, w, h) => {
    g.fillStyle = '#1f5f9a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#5db6e6'; g.fillRect(w * 0.05, h * 0.05, w * 0.9, h * 0.9);
    g.fillStyle = '#d63a2c'; g.fillRect(w * 0.05, h * 0.87, w * 0.9, h * 0.08);
    const cx = w / 2;
    g.fillStyle = '#f2902f'; g.beginPath(); g.arc(cx, h * 0.3, h * 0.27, 0, 7); g.fill();
    g.fillStyle = '#ffd34a'; g.beginPath(); g.arc(cx, h * 0.3, h * 0.22, 0, 7); g.fill();
    g.strokeStyle = '#e07a84'; g.lineWidth = h * 0.045; g.lineCap = 'round';
    [[-1, -0.28], [-1, 0.0], [-1, 0.3], [1, -0.28], [1, 0.0], [1, 0.3]].forEach(([sg, a]) => {
      g.beginPath(); g.moveTo(cx + sg * w * 0.09, h * 0.5); g.lineTo(cx + sg * w * 0.4, h * (0.38 + a * 0.5)); g.stroke();
    });
    g.strokeStyle = '#e8b830'; g.lineWidth = h * 0.03;
    g.beginPath(); g.moveTo(cx - w * 0.42, h * 0.84); g.lineTo(cx - w * 0.42, h * 0.1); g.stroke();
    g.lineWidth = h * 0.025;
    g.beginPath(); g.moveTo(cx - w * 0.5, h * 0.2); g.lineTo(cx - w * 0.5, h * 0.1); g.moveTo(cx - w * 0.34, h * 0.2); g.lineTo(cx - w * 0.34, h * 0.1); g.moveTo(cx - w * 0.5, h * 0.2); g.quadraticCurveTo(cx - w * 0.42, h * 0.27, cx - w * 0.34, h * 0.2); g.stroke();
    g.fillStyle = '#e88a94'; g.beginPath(); g.ellipse(cx, h * 0.58, w * 0.13, h * 0.17, 0, 0, 7); g.fill();
    g.fillStyle = '#d02e2a'; g.beginPath(); g.moveTo(cx - w * 0.34, h * 0.86); g.lineTo(cx - w * 0.11, h * 0.66); g.lineTo(cx + w * 0.11, h * 0.66); g.lineTo(cx + w * 0.34, h * 0.86); g.fill();
    g.fillStyle = '#f2b8a0'; g.beginPath(); g.arc(cx, h * 0.3, h * 0.1, 0, 7); g.fill();
    g.fillStyle = '#2a2a3a'; g.beginPath(); g.arc(cx, h * 0.25, h * 0.1, Math.PI, 0); g.fill();
    g.fillStyle = '#e6b53a'; g.beginPath(); g.moveTo(cx - w * 0.08, h * 0.24); g.lineTo(cx, h * 0.08); g.lineTo(cx + w * 0.08, h * 0.24); g.fill();
    g.fillStyle = '#7a3a6a'; g.beginPath(); g.ellipse(cx, h * 0.82, w * 0.32, h * 0.05, 0, 0, 7); g.fill();
  };
  const drawOm = (g, w, h) => {
    g.fillStyle = '#c9301f'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#e8b830'; g.lineWidth = 8; g.strokeRect(6, 6, w - 12, h - 12);
    g.fillStyle = '#fff1c4'; g.font = `bold ${h * 0.7}px "Nirmala UI","Noto Sans Devanagari",Mangal,serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ॐ', w / 2, h * 0.54);
  };
  const drawPave = (g, w, h) => {
    g.fillStyle = '#b8b0a0'; g.fillRect(0, 0, w, h);
    const n = 4, s = w / n;
    for (let j = 0; j < n; j += 1) for (let i = 0; i < n; i += 1) {
      const v = rnd(i * 7 + j * 13 + 1);
      g.fillStyle = `rgb(${178 + v * 20},${170 + v * 18},${154 + v * 16})`;
      g.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
    }
    g.fillStyle = 'rgba(80,72,60,0.22)';
    for (let k = 0; k < 420; k += 1) g.fillRect(rnd(k) * w, rnd(k + 900) * h, 2 + rnd(k + 5) * 4, 2);
  };
  const drawGrass = (g, w, h) => {
    g.fillStyle = '#8c9a58'; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 900; k += 1) { g.fillStyle = rnd(k) > 0.5 ? 'rgba(110,130,60,0.5)' : 'rgba(170,160,100,0.4)'; g.fillRect(rnd(k + 3) * w, rnd(k + 8) * h, 6, 3); }
  };

  /* ---------- materials ---------- */
  const useP = () => {
    const M = useM();
    return useMemo(() => ({
      M,
      brick: (rx, ry) => tmat('brick', 128, 128, drawBrick, rx, ry),
      fringe: (rx, ry) => tmat('fringe', 64, 32, drawFringe, rx, ry),
      deity: tmat('deity', 256, 220, drawDeity, 1, 1),
      om: tmat('om', 128, 128, drawOm, 1, 1),
      pave: (rx, ry) => tmat('pave', 256, 256, drawPave, rx, ry, { roughness: 1 }),
      grass: (rx, ry) => tmat('grass', 128, 128, drawGrass, rx, ry, { roughness: 1 }),
      red: M.plain('#c0332a'), darkRed: M.plain('#8f2420'), white: M.plain('#f6f1ea', { roughness: 0.8 }),
      pink: M.plain('#e7aeb8'), cream: M.plain('#efe0c2'), blue: M.plain('#3a8fc2'), lblue: M.plain('#8cc4e4'),
      roof: M.plain('#4c565f', { roughness: 0.6, metalness: 0.3 }), roofDk: M.plain('#3e474f', { roughness: 0.6, metalness: 0.3 }),
      gold: M.plain('#e2b02e', { roughness: 0.45, metalness: 0.45 }), brass: M.plain('#b98a2e', { roughness: 0.4, metalness: 0.7 }),
      lion: M.plain('#e8b82a', { roughness: 0.6 }), wood: M.plain('#4a2c1c'), dark: M.plain('#241a16'), iron: M.plain('#2b2b2e', { roughness: 0.5, metalness: 0.6 }),
      stone: M.plain('#cfc6b6', { roughness: 0.95 }), green: M.plain('#3f8a3c'), glass: M.plain('#35506a', { roughness: 0.3 }),
      glow: new THREE.MeshStandardMaterial({ color: '#e8d27a', emissive: '#ffb84a', emissiveIntensity: 0.3, roughness: 0.6 }),
      winGlow: new THREE.MeshStandardMaterial({ color: '#6a3a22', emissive: '#ff9a3a', emissiveIntensity: 0.22, roughness: 0.7 }),
      teal: new THREE.MeshStandardMaterial({ color: '#6fb8aa', emissive: '#2a9c8c', emissiveIntensity: 0.18, roughness: 0.5 }),
    }), [M]);
  };

  /* ---------- small geometry ---------- */
  const bellGeo = new THREE.LatheGeometry([[0.001, 0.5], [0.12, 0.48], [0.2, 0.36], [0.26, 0.1], [0.34, -0.1], [0.36, -0.14], [0.3, -0.12], [0.2, 0.0], [0.001, 0.4]].map(([r, y]) => new THREE.Vector2(r, y)), 14);
  const flagGeo = (() => { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(0, -0.5); s.lineTo(1.0, -0.22); s.closePath(); return new THREE.ShapeGeometry(s); })();

  function Limb({ a, b, r0, r1 = r0, m, seg = 6 }) {
    const { q, len, mid } = useMemo(() => {
      const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A);
      return { len: d.length(), mid: A.clone().add(B).multiplyScalar(0.5).toArray(), q: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()) };
    }, [a, b]);
    return (
      <mesh position={mid} quaternion={q} material={m} castShadow>
        <cylinderGeometry args={[r1, r0, len, seg]} />
      </mesh>
    );
  }
  function Bell({ p, s = 1, m }) {
    return <mesh position={p} scale={s} geometry={bellGeo} material={m} castShadow />;
  }
  function Flag({ p, h = 5, m, pole }) {
    return (
      <group position={p}>
        <Cyl rt={0.035} rb={0.05} h={h} p={[0, h / 2, 0]} m={pole} seg={6} />
        <mesh position={[0.02, h - 0.1, 0]} geometry={flagGeo} material={m}>{null}</mesh>
        <mesh position={[0.02, h - 0.1, 0]} rotation={[0, Math.PI, 0]} geometry={flagGeo} material={m} />
      </group>
    );
  }
  /* gable roof over a rectangle: ridge along z (hall-like) or along x; `rise` is eave-line to ridge */
  function GableRoof({ span, len, rise, y, m, over = 0.3, axis = 'z', ends = null, trim = null }) {
    const hs = span / 2 + over;
    const ang = Math.atan(rise / (span / 2));
    const L = hs / Math.cos(ang);
    const yc = y + rise - Math.tan(ang) * hs / 2 + 0.07;
    const triGeo = useMemo(() => { const sh = new THREE.Shape(); sh.moveTo(-span / 2, 0); sh.lineTo(span / 2, 0); sh.lineTo(0, rise); sh.closePath(); return new THREE.ShapeGeometry(sh); }, [span, rise]);
    const rot = (sg) => (axis === 'z' ? [0, 0, -sg * ang] : [sg * ang, 0, 0]);
    const pos = (sg) => (axis === 'z' ? [sg * hs / 2, yc, 0] : [0, yc, sg * hs / 2]);
    const size = axis === 'z' ? [L, 0.14, len + over] : [len + over, 0.14, L];
    return (
      <group>
        {[-1, 1].map((sg) => <Box key={sg} s={size} p={pos(sg)} r={rot(sg)} m={m} />)}
        {trim && [-1, 1].map((sg) => <Box key={`t${sg}`} s={axis === 'z' ? [0.1, 0.1, len + over] : [len + over, 0.1, 0.1]} p={axis === 'z' ? [sg * hs, y - rise * (over / (span / 2)), 0] : [0, y - rise * (over / (span / 2)), sg * hs]} m={trim} />)}
        {ends && [-1, 1].map((sg) => (
          <mesh key={`e${sg}`} geometry={triGeo} material={ends} position={axis === 'z' ? [0, y, sg * len / 2] : [sg * len / 2, y, 0]} rotation={axis === 'z' ? [0, sg > 0 ? 0 : Math.PI, 0] : [0, sg > 0 ? Math.PI / 2 : -Math.PI / 2, 0]} />
        ))}
      </group>
    );
  }
  function Pyramid({ half, h, p, m }) {
    return <Cyl rt={0.08} rb={half * 1.4142} h={h} p={p} r={[0, Math.PI / 4, 0]} m={m} seg={4} />;
  }
  function Win({ p, w = 0.7, h = 0.9, P }) {
    return (
      <group position={p}>
        <Box s={[w + 0.16, h + 0.16, 0.05]} p={[0, 0, 0]} m={P.white} cast={false} />
        <Box s={[w, h, 0.07]} p={[0, 0, 0.01]} m={P.glass} cast={false} />
        <Box s={[0.04, h, 0.09]} p={[0, 0, 0.01]} m={P.white} cast={false} />
      </group>
    );
  }
  function LowHouse({ p, ry = 0, w, d, h, wall, roofM, P, storeys = 1, label }) {
    const wallM = useMemo(() => P.M.plain(wall, { roughness: 0.9 }), [P, wall]);
    const nw = Math.max(2, Math.floor(w / 2.3));
    return (
      <group position={p} rotation={[0, ry, 0]}>
        <Box s={[w, h, d]} p={[0, h / 2, 0]} m={wallM} />
        <Box s={[w + 0.1, 0.18, d + 0.1]} p={[0, 0.09, 0]} m={P.stone} cast={false} />
        <GableRoof span={d} len={w} rise={d * 0.15} y={h} m={roofM} over={0.45} axis="x" ends={wallM} trim={P.white} />
        {Array.from({ length: storeys }).map((_, s) => Array.from({ length: nw }).map((__, i) => {
          const x = -w / 2 + (w * (i + 0.5)) / nw;
          if (s === 0 && i === Math.floor(nw / 2)) return <Box key={`${s}${i}`} s={[0.9, 1.9, 0.07]} p={[x, 0.95, d / 2 + 0.01]} m={P.wood} cast={false} />;
          return <Win key={`${s}${i}`} p={[x, 1.5 + s * 2.4, d / 2 + 0.03]} P={P} />;
        }))}
        {label}
      </group>
    );
  }
  function BigTree({ p, s = 1, seed = 0 }) {
    const M = useM();
    const bark = M.plain('#5b4a3c', { roughness: 1 });
    const leaf = [M.plain('#6b8a3a', { roughness: 1 }), M.plain('#86a044', { roughness: 1 }), M.plain('#557538', { roughness: 1 })];
    const br = useMemo(() => Array.from({ length: 6 }).map((_, i) => {
      const a = seed * 1.7 + i * 1.05 + rnd(seed + i) * 0.5, r = 1.8 + rnd(seed * 3 + i) * 1.4;
      const y0 = 2.5 + (i % 3) * 0.45;
      const b = [Math.cos(a) * r, y0 + 1.1 + rnd(seed + i * 5) * 0.9, Math.sin(a) * r];
      const tw = [0.55, -0.55].map((da, k) => {
        const a2 = a + da + (rnd(seed + i + k) - 0.5) * 0.3, r2 = r + 1.3 + rnd(seed + i * 2 + k) * 0.7;
        return { c: [Math.cos(a2) * r2, b[1] + 0.9 + rnd(seed + i * 7 + k) * 0.8, Math.sin(a2) * r2], k };
      });
      return { a: [0, y0, 0], b, tw, leaf: i % 3 !== 2 };
    }), [seed]);
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.6} rb={1.0} h={3.0} p={[0, 1.5, 0]} m={bark} seg={8} />
        <Cyl rt={1.0} rb={1.3} h={0.4} p={[0, 0.2, 0]} m={bark} seg={8} />
        {br.map((t, i) => (
          <group key={i}>
            <Limb a={t.a} b={t.b} r0={0.32} r1={0.16} m={bark} />
            {t.tw.map((w) => (
              <group key={w.k}>
                <Limb a={t.b} b={w.c} r0={0.14} r1={0.05} m={bark} seg={5} />
                {t.leaf && w.k === 0 && [[0, 0, 0], [0.8, -0.2, 0.3], [-0.6, -0.3, -0.5]].map(([dx, dy, dz], q) => (
                  <mesh key={q} position={[w.c[0] + dx, w.c[1] + dy, w.c[2] + dz]} scale={[1.2 + 0.2 * rnd(seed + i + q), 0.8, 1.2]} material={leaf[(i + seed + q) % 3]} castShadow>
                    <icosahedronGeometry args={[0.9, 0]} />
                  </mesh>
                ))}
              </group>
            ))}
          </group>
        ))}
      </group>
    );
  }

  /* ======================== MAIN ======================== */
  const E = 3.4;   // wall top (eave line) above ground
  const RISE = 3.0;
  const GZ = 9.5;  // gateway screen z

  function ShailMain() {
    const P = useP();
    const { M } = P;
    const half = 4.6;
    const rb = RISE / half;
    const ang = Math.atan(rb);
    const hs = 4.95;
    const triGeo = useMemo(() => { const sh = new THREE.Shape(); sh.moveTo(-half, 0); sh.lineTo(half, 0); sh.lineTo(0, RISE + 0.25); sh.closePath(); return new THREE.ShapeGeometry(sh); }, []);
    const starRing = (x, y, r, k) => (
      <group position={[x, y, 0.55]} rotation={[Math.PI / 2, 0, 0]} key={k}>
        <Cyl rt={r * 1.2} h={0.05} p={[0, 0, 0]} m={P.gold} seg={8} />
        <Cyl rt={r * 1.2} h={0.05} p={[0, 0.01, 0]} r={[0, Math.PI / 8, 0]} m={P.gold} seg={8} />
        <Cyl rt={r} h={0.09} p={[0, 0.02, 0]} m={P.darkRed} seg={8} />
        <Cyl rt={r * 0.78} h={0.1} p={[0, 0.03, 0]} r={[0, Math.PI / 8, 0]} m={P.winGlow} seg={8} />
        <Cyl rt={r * 0.3} h={0.11} p={[0, 0.04, 0]} m={P.red} seg={8} />
        <Box s={[r * 1.5, 0.12, 0.05]} p={[0, 0.05, 0]} m={P.gold} cast={false} />
        <Box s={[0.05, 0.12, r * 1.5]} p={[0, 0.05, 0]} m={P.gold} cast={false} />
      </group>
    );
    const scallops = [-1, 1].flatMap((sx) => Array.from({ length: 11 }).map((_, i) => {
      const t = 0.07 + i * 0.085;
      return { x: sx * hs * t, y: E - 0.27 + (RISE + 0.27) * (1 - t) - 0.34, k: `${sx}${i}` };
    }));
    return (
      <group>
        <Frame s={[18, 10.4, 16.5]} p={[-0.5, 5.2, 2.2]} />

        {/* plinth and steps */}
        <Box s={[11, 0.5, 7.2]} p={[0, 0.25, -0.2]} m={P.stone} />
        <Box s={[11.1, 0.12, 7.3]} p={[0, 0.46, -0.2]} m={P.red} cast={false} />
        <Box s={[2.6, 0.34, 1.5]} p={[0, 0.17, 4.15]} m={P.red} />
        <Box s={[2.6, 0.17, 2.1]} p={[0, 0.085, 4.45]} m={P.red} />
        <Box s={[2.5, 0.04, 1.4]} p={[0, 0.35, 4.15]} m={P.stone} cast={false} />
        <Box s={[2.5, 0.04, 2.0]} p={[0, 0.18, 4.45]} m={P.stone} cast={false} />

        {/* hall body, brick-banded pink and white */}
        <Box s={[9.2, 2.9, 4.0]} p={[0, 0.5 + 1.45, -1.5]} m={P.brick(4.6, 1.5)} />
        <Box s={[9.4, 0.14, 4.2]} p={[0, 0.57, -1.5]} m={P.red} cast={false} />
        {/* gable faces (front and back) */}
        <mesh geometry={triGeo} material={P.brick(0.5, 0.5)} position={[0, E, 0.52]} castShadow />
        <mesh geometry={triGeo} material={P.brick(0.5, 0.5)} position={[0, E, -3.52]} rotation={[0, Math.PI, 0]} />
        {/* roof */}
        <group position={[0, 0, -1.55]}>
          <GableRoof span={9.2} len={4.4} rise={RISE} y={E} m={P.roof} over={0.35} axis="z" trim={P.gold} />
          <Box s={[0.3, 0.14, 4.8]} p={[0, E + RISE + 0.1, 0]} m={P.gold} />
        </group>
        {/* bargeboards with scallops */}
        {[-1, 1].map((sx) => (
          <Box key={sx} s={[hs / Math.cos(ang) + 0.1, 0.4, 0.08]} p={[sx * hs / 2, E - 0.27 + (RISE + 0.27) * 0.5 - 0.13, 0.84]} r={[0, 0, -sx * ang]} m={P.red} />
        ))}
        {scallops.map((c) => <Ball key={c.k} rad={0.17} sc={[1, 0.8, 0.5]} p={[c.x, c.y + 0.02, 0.86]} m={P.red} />)}
        {[-1, 1].map((sx) => <Box key={`g${sx}`} s={[hs / Math.cos(ang), 0.05, 0.1]} p={[sx * hs / 2, E - 0.27 + (RISE + 0.27) * 0.5 + 0.1, 0.85]} r={[0, 0, -sx * ang]} m={P.gold} cast={false} />)}

        {/* three star lattice windows in the gable: two large, one small between and above */}
        {starRing(-1.55, 4.3, 0.42, 'a')}
        {starRing(1.55, 4.3, 0.42, 'b')}
        {starRing(0, 5.15, 0.27, 'c')}

        {/* skirt roof with gold edge and red-gold fringe valance */}
        <Box s={[10.6, 0.14, 2.5]} p={[0, 3.2, 1.72]} r={[0.3, 0, 0]} m={P.roofDk} />
        <Box s={[10.8, 0.1, 0.12]} p={[0, 2.93, 2.92]} m={P.gold} />
        <Box s={[10.6, 0.34, 0.05]} p={[0, 2.72, 2.94]} m={P.fringe(14, 1)} cast={false} />
        <Box s={[10.8, 0.1, 0.12]} p={[0, 3.14, 0.55]} m={P.gold} cast={false} />

        {/* porch pillars (white with red bands), beam */}
        {[-4.4, -2.6, 2.6, 4.4].map((x) => (
          <group key={x} position={[x, 0, 2.55]}>
            <Box s={[0.42, 2.45, 0.42]} p={[0, 1.72, 0]} m={P.white} />
            <Box s={[0.5, 0.5, 0.5]} p={[0, 0.78, 0]} m={P.red} />
            <Box s={[0.5, 0.3, 0.5]} p={[0, 2.62, 0]} m={P.red} />
            <Box s={[0.55, 0.12, 0.55]} p={[0, 2.97, 0]} m={P.white} />
          </group>
        ))}
        <Box s={[9.2, 0.22, 0.3]} p={[0, 2.8, 2.55]} m={P.wood} cast={false} />

        {/* door, red-gold curtain, painted niches */}
        <Box s={[1.7, 2.6, 0.14]} p={[0, 1.8, 0.58]} m={P.gold} cast={false} />
        <Box s={[1.4, 2.3, 0.16]} p={[0, 1.7, 0.6]} m={P.wood} cast={false} />
        <Box s={[1.0, 1.55, 0.06]} p={[0, 1.95, 0.7]} m={P.fringe(3, 1)} cast={false} />
        <Box s={[1.7, 0.16, 0.18]} p={[0, 3.2, 0.6]} m={P.red} cast={false} />
        {[-1.55, 1.55].map((x) => (
          <group key={x} position={[x, 0, 0.55]}>
            <Box s={[0.85, 1.4, 0.07]} p={[0, 1.85, 0]} m={P.blue} cast={false} />
            <Box s={[0.6, 0.9, 0.09]} p={[0, 1.8, 0.01]} m={P.lblue} cast={false} />
            <Box s={[0.9, 0.1, 0.1]} p={[0, 2.62, 0]} m={P.red} cast={false} />
          </group>
        ))}
        {[-3.5, 3.5].map((x) => (
          <group key={x} position={[x, 0, 0.55]}>
            <Box s={[0.7, 1.1, 0.08]} p={[0, 1.9, 0]} m={P.red} cast={false} />
            <Box s={[0.45, 0.8, 0.1]} p={[0, 1.85, 0.01]} m={P.dark} cast={false} />
            <Ball rad={0.1} p={[0, 1.8, 0.07]} m={P.lblue} />
          </group>
        ))}
        {/* hanging brass bell in the porch */}
        <Cyl rt={0.02} h={0.55} p={[-3.5, 2.5, 2.5]} m={P.iron} seg={4} />
        <Bell p={[-3.5, 1.8, 2.5]} s={0.75} m={P.brass} />
        <Box s={[0.12, 0.12, 0.12]} p={[-3.5, 2.0, 2.5]} m={P.gold} />
        {/* blue deity statue on its plinth */}
        <Box s={[1.0, 0.75, 1.0]} p={[0, 0.875, 1.7]} m={P.M.plain('#b2705a')} />
        <Box s={[0.5, 0.3, 0.04]} p={[0, 0.95, 2.22]} m={P.brass} cast={false} />
        <group position={[0, 1.25, 1.7]}>
          {[-0.12, 0.12].map((x) => <Cyl key={x} rt={0.09} h={0.7} p={[x, 0.35, 0]} m={P.blue} seg={8} />)}
          <Box s={[0.5, 0.7, 0.28]} p={[0, 1.05, 0]} m={P.blue} />
          <Box s={[0.55, 0.12, 0.3]} p={[0, 0.72, 0]} m={P.red} />
          <Ball rad={0.17} p={[0, 1.58, 0]} m={P.blue} />
          <Cyl rt={0.05} rb={0.18} h={0.3} p={[0, 1.85, 0]} m={P.gold} seg={8} />
          {[-1, 1].map((k) => <Limb key={k} a={[k * 0.25, 1.25, 0]} b={[k * 0.55, 1.65, 0.1]} r0={0.05} m={P.blue} />)}
          {[-1, 1].map((k) => <Limb key={`l${k}`} a={[k * 0.25, 1.1, 0.05]} b={[k * 0.55, 0.85, 0.25]} r0={0.05} m={P.blue} />)}
        </group>
        {/* lamp pedestals */}
        {[-1.95, 1.95].map((x) => (
          <group key={x} position={[x, 0, 1.9]}>
            <Box s={[0.55, 0.9, 0.55]} p={[0, 0.95, 0]} m={P.lblue} />
            <Ball rad={0.13} p={[0, 1.55, 0]} m={P.brass} />
          </group>
        ))}
        <Diyo p={[-1.95, 1.4, 1.9]} light />

        {/* tower: two tiers behind the ridge, dark pyramidal roof */}
        <group position={[0, 0.3, -1.55]}>
          <Box s={[3.0, 2.2, 3.0]} p={[0, 5.4, 0]} m={P.brick(1.5, 1.1)} />
          <Cyl rt={1.75} rb={2.5} h={0.4} p={[0, 6.7, 0]} r={[0, Math.PI / 4, 0]} m={P.roofDk} seg={4} />
          <Box s={[2.2, 1.1, 2.2]} p={[0, 7.4, 0]} m={P.brick(1.1, 0.8)} />
          <Box s={[2.3, 0.32, 2.3]} p={[0, 7.65, 0]} m={P.red} />
          <Box s={[2.34, 0.06, 2.34]} p={[0, 7.84, 0]} m={P.gold} cast={false} />
          <Pyramid half={1.55} h={1.4} p={[0, 8.6, 0]} m={P.roofDk} />
          <Ball rad={0.13} p={[0, 9.35, 0]} m={P.gold} />
          <Cyl rt={0.02} rb={0.05} h={0.45} p={[0, 9.6, 0]} m={P.gold} seg={6} />
          {[-1, 1].map((s) => <Box key={s} s={[0.012, 0.01, 0.01]} p={[0, 0, 0]} m={P.dark} cast={false} />)}
          {[[1.51, 0], [-1.51, 0], [0, 1.51], [0, -1.51]].map(([x, z], i) => (
            <Box key={i} s={x ? [0.05, 0.7, 0.5] : [0.5, 0.7, 0.05]} p={[x * 0.9 + (x ? Math.sign(x) * 0.5 : 0) * 0, 5.5, z * 0.9 + (z ? Math.sign(z) * 0.5 : 0) * 0]} m={P.red} cast={false} />
          ))}
        </group>

        {/* giant gold trident behind the gate */}
        <group position={[2.4, 0, GZ - 1.3]}>
          <Box s={[1.1, 0.5, 1.1]} p={[0, 0.25, 0]} m={P.stone} />
          <Box s={[0.85, 0.3, 0.85]} p={[0, 0.65, 0]} m={P.red} />
          <Cyl rt={0.3} rb={0.42} h={0.45} p={[0, 1.02, 0]} m={P.gold} seg={10} />
          <Cyl rt={0.12} rb={0.16} h={6.1} p={[0, 4.2, 0]} m={P.gold} seg={10} />
          <Cyl rt={0.2} rb={0.2} h={0.2} p={[0, 4.0, 0]} m={P.brass} seg={10} />
          <Ball rad={0.26} p={[0, 7.25, 0]} m={P.gold} />
          <Limb a={[0, 7.2, 0]} b={[0, 9.3, 0]} r0={0.12} r1={0.06} m={P.gold} />
          <mesh position={[0, 9.65, 0]} material={P.gold} castShadow><coneGeometry args={[0.13, 0.7, 6]} /></mesh>
          {[-1, 1].map((k) => (
            <group key={k}>
              <Limb a={[0, 7.2, 0]} b={[k * 0.55, 7.55, 0]} r0={0.12} r1={0.1} m={P.gold} />
              <Limb a={[k * 0.55, 7.55, 0]} b={[k * 0.8, 8.1, 0]} r0={0.11} r1={0.09} m={P.gold} />
              <Limb a={[k * 0.8, 8.1, 0]} b={[k * 0.8, 8.95, 0]} r0={0.1} r1={0.06} m={P.gold} />
              <mesh position={[k * 0.8, 9.3, 0]} material={P.gold} castShadow><coneGeometry args={[0.11, 0.6, 6]} /></mesh>
            </group>
          ))}
          <Box s={[1.7, 0.12, 0.12]} p={[0, 7.45, 0]} m={P.gold} />
          <Box s={[0.3, 0.45, 0.02]} p={[0.2, 6.2, 0]} m={P.red} cast={false} />
        </group>

        {/* ---- painted gateway screen: open walkway, red lantern posts, grille at left, blue deity panel at right ---- */}
        <group position={[0, 0, GZ]}>
          {[-1, 1].map((sg) => (
            <group key={sg}>
              <Box s={[3.9, 0.6, 0.38]} p={[sg * 3.95, 0.3, 0]} m={P.M.plain('#b5412f')} />
              <Box s={[4.0, 0.08, 0.46]} p={[sg * 3.95, 0.62, 0]} m={P.white} cast={false} />
            </group>
          ))}
          {/* clear walkway with three low steps toward the porch */}
          <Box s={[2.5, 0.1, 0.55]} p={[0, 0.05, 0.6]} m={P.stone} cast={false} />
          <Box s={[2.5, 0.2, 0.55]} p={[0, 0.1, 0]} m={P.stone} cast={false} />
          <Box s={[2.5, 0.1, 0.55]} p={[0, 0.05, -0.6]} m={P.stone} cast={false} />
          {/* red posts with lantern caps */}
          {[-1.65, 1.65].map((x) => (
            <group key={x} position={[x, 0, 0]}>
              <Box s={[0.72, 2.7, 0.72]} p={[0, 1.35, 0]} m={P.red} />
              <Box s={[0.46, 1.7, 0.06]} p={[0, 1.55, 0.37]} m={P.white} cast={false} />
              {[1.0, 1.5, 2.0].map((y, i) => <Box key={y} s={[0.14, 0.14, 0.04]} p={[(i % 2 ? 0.1 : -0.1), y, 0.41]} m={P.green} cast={false} />)}
              <Box s={[0.9, 0.2, 0.9]} p={[0, 2.8, 0]} m={P.white} />
              <Box s={[0.52, 0.6, 0.52]} p={[0, 3.2, 0]} m={P.glow} />
              {[0.27, -0.27].map((z) => <Box key={z} s={[0.3, 0.36, 0.02]} p={[0, 3.2, z]} m={P.wood} cast={false} />)}
              <Pyramid half={0.38} h={0.45} p={[0, 3.73, 0]} m={P.red} />
              <Ball rad={0.07} p={[0, 4.02, 0]} m={P.gold} />
            </group>
          ))}
          {/* open iron grille (thin bars only) at the left */}
          <group position={[-3.55, 0, 0]}>
            {Array.from({ length: 9 }).map((_, i) => <Box key={i} s={[0.04, 1.9, 0.04]} p={[-1.12 + i * 0.28, 1.55, 0]} m={P.iron} cast={false} />)}
            <Box s={[2.5, 0.06, 0.06]} p={[0, 2.5, 0]} m={P.iron} cast={false} />
            <Box s={[2.5, 0.06, 0.06]} p={[0, 0.7, 0]} m={P.iron} cast={false} />
            <Box s={[2.5, 0.06, 0.06]} p={[0, 1.6, 0]} m={P.iron} cast={false} />
          </group>
          {/* deity panel right of the walkway; OM plaques flank a gold lion above it */}
          <group position={[3.4, 0, 0]}>
            <Box s={[2.6, 2.0, 0.3]} p={[0, 1.6, 0]} m={P.red} />
            <mesh position={[0, 1.6, 0.16]} material={P.deity}><planeGeometry args={[2.46, 1.86]} /></mesh>
            <Box s={[2.8, 0.18, 0.42]} p={[0, 2.69, 0]} m={P.red} />
            <Box s={[2.8, 0.06, 0.44]} p={[0, 2.8, 0]} m={P.gold} cast={false} />
            {[-0.75, 0.75].map((x) => (
              <group key={x} position={[x, 3.25, 0]}>
                <Box s={[0.7, 0.7, 0.12]} p={[0, 0, 0]} m={P.gold} />
                <mesh position={[0, 0, 0.07]} material={P.om}><planeGeometry args={[0.6, 0.6]} /></mesh>
              </group>
            ))}
            <group position={[0, 2.86, 0]} scale={0.8}><Lion m={P.lion} /></group>
          </group>
        </group>

        <pointLight position={[0, 3.4, GZ + 1.2]} intensity={2.4} distance={10} color="#ffb85a" />
        {/* gold lions on red/white pedestals */}
        {[-2.7, 2.2].map((x) => (
          <group key={x} position={[x, 0, GZ + 1.4]}>
            <Box s={[0.95, 0.8, 1.4]} p={[0, 0.4, 0]} m={P.red} />
            <Box s={[1.05, 0.1, 1.5]} p={[0, 0.85, 0]} m={P.white} />
            <group position={[0, 0.9, 0]} scale={2.1}><Lion m={P.lion} /></group>
          </group>
        ))}

        {/* white bell frame at the viewer's left */}
        <group position={[-7.4, 0, GZ]}>
          {[-0.85, 0.85].map((x) => <Box key={x} s={[0.36, 2.8, 0.36]} p={[x, 1.4, 0]} m={P.white} />)}
          {[-0.85, 0.85].map((x) => <Box key={`b${x}`} s={[0.46, 0.4, 0.46]} p={[x, 0.2, 0]} m={P.red} />)}
          <Box s={[2.2, 0.36, 0.5]} p={[0, 2.85, 0]} m={P.white} />
          <Cyl rt={0.02} h={0.4} p={[0, 2.5, 0]} m={P.iron} seg={4} />
          <Bell p={[0, 1.95, 0]} s={0.9} m={P.brass} />
          {Array.from({ length: 5 }).map((_, i) => <Box key={i} s={[0.04, 0.9, 0.04]} p={[-0.6 + i * 0.3, 0.7, 0]} m={P.iron} cast={false} />)}
        </group>

        {/* red flags on poles */}
        <Flag p={[-8.2, 0, 4.4]} h={5.6} m={P.M.plain('#d02a22')} pole={P.iron} />
        <Flag p={[6.6, 0, 3.8]} h={5.2} m={P.M.plain('#d02a22')} pole={P.iron} />
        <Flag p={[-4.8, 3.4, -0.2]} h={1.6} m={P.M.plain('#d02a22')} pole={P.iron} />
      </group>
    );
  }

  /* ======================== ENV ======================== */
  function ShailEnv() {
    const P = useP();
    const { M } = P;
    const roofA = M.plain('#b3a5a3', { roughness: 0.9 });
    const roofB = M.plain('#a89895', { roughness: 0.9 });
    const slope = (r) => -0.1 - Math.max(0, r - 34) / 28 * 4;
    const smallTrees = useMemo(() => Array.from({ length: 16 }).map((_, i) => {
      const a = rnd(i * 3) * Math.PI * 2, r = 38 + rnd(i * 3 + 1) * 16;
      const x = Math.cos(a) * r, z = Math.sin(a) * r, d = Math.hypot(x, z + 14);
      return { x, z, s: 0.9 + rnd(i) * 0.8, i, d, y: d < 36 ? -0.1 : -0.1 - (d - 36) / 16 * 12 };
    }).filter((t) => t.z < 8 && t.d < 50), []);
    const wetM = useMemo(() => new THREE.MeshStandardMaterial({ color: '#6f6a60', transparent: true, opacity: 0.35, roughness: 0.5, depthWrite: false }), []);
    const lightM = useMemo(() => new THREE.MeshStandardMaterial({ color: '#e0d8c6', transparent: true, opacity: 0.45, roughness: 0.95, depthWrite: false }), []);
    const patches = useMemo(() => Array.from({ length: 14 }).map((_, i) => [(rnd(i * 5) - 0.5) * 30, -10 + rnd(i * 5 + 1) * 30, 1.5 + rnd(i * 5 + 2) * 3.5, 1.2 + rnd(i * 5 + 3) * 3, i % 3 === 0]).filter((q) => !(Math.abs(q[0]) < 3 && q[1] > 3 && q[1] < 9)), []);
    const leafs = [M.plain('#5f8038', { roughness: 1 }), M.plain('#7a9440', { roughness: 1 })];
    return (
      <group>
        {/* hill-top: summit, valley floor far below, hazy Lesser Himalayan ridges */}
        <Cyl rt={36} rb={52} h={12} p={[0, -6.1, -14]} m={P.grass(10, 10)} seg={44} />
        <mesh position={[0, -12.2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><circleGeometry args={[170, 40]} /><meshStandardMaterial color="#7e8f55" roughness={1} /></mesh>
        <mesh position={[0, -7.5, 20]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[150, 40]} /><meshBasicMaterial color="#cfdae0" transparent opacity={0.42} depthWrite={false} /></mesh>
        {[[0, -105, 38, 1.7, '#8fa2b0'], [-95, -50, 30, 1.9, '#9aabb7'], [100, -40, 34, 1.8, '#94a6b3'], [60, 95, 26, 2.0, '#a5b4bf'], [-70, 80, 28, 1.9, '#a0b0bc'], [-130, 0, 36, 1.6, '#aab8c2'], [30, -140, 44, 1.5, '#b3c0c9'], [135, 40, 40, 1.6, '#b0bdc7']].map(([x, z, r, k, c], i) => (
          <mesh key={i} position={[x, -10, z]} scale={[k, 0.5, 1]} material={M.plain(c, { roughness: 1 })}><sphereGeometry args={[r, 18, 10]} /></mesh>
        ))}
        {smallTrees.map((t) => (
          <group key={t.i} position={[t.x, t.y, t.z]} scale={t.s}>
            <Cyl rt={0.12} rb={0.2} h={1.6} p={[0, 0.8, 0]} m={M.plain('#5b4a3c')} seg={5} />
            <mesh position={[0, 2.3, 0]} scale={[1.5, 1.1, 1.5]} material={leafs[t.i % 2]}><icosahedronGeometry args={[1, 1]} /></mesh>
          </group>
        ))}

        {/* stone-paved courtyard */}
        <Box s={[34, 0.3, 30]} p={[0, -0.15, 4.5]} m={P.pave(5.3, 4.6)} cast={false} />
        <Box s={[2.6, 0.03, 14]} p={[0, 0.02, 12.5]} m={M.plain('#7d766a', { roughness: 1 })} cast={false} />
        <Box s={[34.2, 0.5, 0.45]} p={[0, 0.25, 19.5]} m={M.plain('#b5412f')} />
        <Box s={[34.2, 0.08, 0.6]} p={[0, 0.52, 19.5]} m={P.stone} cast={false} />
        {[-17, 17].map((x) => (
          <group key={x}>
            <Box s={[0.4, 0.7, 29]} p={[x, 0.35, 4.5]} m={M.plain('#b5412f')} />
            {Array.from({ length: 6 }).map((_, i) => <Box key={i} s={[0.5, 0.1, 2.4]} p={[x, 0.75, -8 + i * 5.4]} m={P.white} cast={false} />)}
          </group>
        ))}
        
        {/* low wall + teal lamp stubs continuing the gate line */}
        {[[-16.8, -6.0], [6.0, 16.8]].map(([a, b], i) => (
          <group key={i}>
            <Box s={[b - a, 0.6, 0.35]} p={[(a + b) / 2, 0.3, GZ]} m={M.plain('#b5412f')} />
            <Box s={[b - a, 0.08, 0.45]} p={[(a + b) / 2, 0.63, GZ]} m={P.white} cast={false} />
            {[a + 0.5, (a + b) / 2, b - 0.5].map((x) => (
              <group key={x} position={[x, 0, GZ]}>
                <Box s={[0.4, 1.0, 0.4]} p={[0, 0.9, 0]} m={P.white} />
                <Box s={[0.3, 0.4, 0.3]} p={[0, 1.6, 0]} m={P.teal} />
                <Box s={[0.4, 0.08, 0.4]} p={[0, 1.84, 0]} m={P.red} />
              </group>
            ))}
          </group>
        ))}

        {/* low pink and white hill-town buildings, pushed back behind the compound */}
        <LowHouse p={[-21, 0, -2]} ry={0.1} w={7} d={6} h={3.0} wall="#e6a3b2" roofM={roofA} P={P} />
        <LowHouse p={[-4, 0, -19]} w={9} d={5} h={3.1} wall="#eab4bd" roofM={roofA} P={P} />
        <LowHouse p={[10, 0, -18]} w={7} d={5} h={3.0} wall="#f2eee6" roofM={roofB} P={P} />
        <LowHouse p={[15.5, 0, -8]} w={5} d={4.6} h={3.0} wall="#efe0c2" roofM={roofA} P={P} />
        <LowHouse p={[24, 0, -13]} w={7} d={5} h={3.2} wall="#f1ece4" roofM={roofA} P={P} />
        <LowHouse p={[28, 0, -3]} ry={-0.2} w={6} d={5.5} h={3.0} wall="#e8d6d0" roofM={roofA} P={P} />

        {/* small blue-framed arch with a red flag, far left */}
        <group position={[-12.5, 0, 9.5]}>
          {[-1.2, 1.2].map((x) => <Box key={x} s={[0.26, 3.1, 0.26]} p={[x, 1.55, 0]} m={P.blue} />)}
          <Box s={[2.9, 0.3, 0.3]} p={[0, 3.1, 0]} m={P.blue} />
          <Box s={[2.9, 0.12, 0.34]} p={[0, 3.35, 0]} m={P.red} />
          <Flag p={[0, 3.4, 0]} h={1.6} m={M.plain('#d02a22')} pole={P.iron} />
        </group>

        {/* small red-roofed open pavilion on red posts, far at the viewer's right */}
        <group position={[20, 0, -1]}>
          <Box s={[3.8, 0.3, 3.8]} p={[0, 0.15, 0]} m={P.red} />
          <Box s={[3.9, 0.06, 3.9]} p={[0, 0.32, 0]} m={P.stone} cast={false} />
          {[[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]].map(([x, z]) => <Box key={`${x}${z}`} s={[0.24, 2.7, 0.24]} p={[x, 1.65, z]} m={P.red} />)}
          <Box s={[3.5, 0.2, 0.2]} p={[0, 3.1, 1.5]} m={P.darkRed} />
          <Box s={[3.5, 0.2, 0.2]} p={[0, 3.1, -1.5]} m={P.darkRed} />
          <Box s={[0.2, 0.2, 3.5]} p={[1.5, 3.1, 0]} m={P.darkRed} />
          <Box s={[0.2, 0.2, 3.5]} p={[-1.5, 3.1, 0]} m={P.darkRed} />
          <Pyramid half={2.2} h={1.1} p={[0, 3.75, 0]} m={M.plain('#b3382a', { roughness: 0.7 })} />
          <Ball rad={0.13} p={[0, 4.4, 0]} m={P.gold} />
        </group>

        {/* old broadleaf trees: left, right, behind (kept clear of the front-right camera side) */}
        {[[-9.5, -8, 1.1, 2], [-24, -8, 1.2, 3], [13, -7, 1.2, 4], [25, 6, 1.0, 5], [-7, -14, 1.2, 6], [3, -10, 1.0, 7]].map(([x, z, s, sd]) => (
          <BigTree key={sd} p={[x, 0, z]} s={s} seed={sd} />
        ))}
        {/* stone retaining wall, buttresses and the drop to the valley */}
        <Box s={[34.4, 9, 0.7]} p={[0, -4.5, 19.9]} m={M.plain('#9a8c76', { roughness: 1 })} />
        {Array.from({ length: 7 }).map((_, i) => <Box key={i} s={[0.9, 8.4, 1.3]} p={[-15 + i * 5, -4.2, 20.3]} m={M.plain('#867a66', { roughness: 1 })} cast={false} />)}
        {Array.from({ length: 5 }).map((_, i) => <Box key={`c${i}`} s={[34.2, 0.06, 0.12]} p={[0, -1.4 - i * 1.7, 20.3]} m={M.plain('#6e6455', { roughness: 1 })} cast={false} />)}
        {patches.map((q, i) => (
          <mesh key={i} position={[q[0], 0.012, q[1]]} rotation={[-Math.PI / 2, 0, 0]} material={q[4] ? wetM : lightM}><planeGeometry args={[q[2], q[3]]} /></mesh>
        ))}
      </group>
    );
  }

  return { 'shaileshwori-temple-doti': { Main: ShailMain, Env: ShailEnv } };
}
