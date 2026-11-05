/* Prithvi Malla's Kirtistambha, Dullu (Dailekh, Karnali): one tall, narrow, flat weathered-grey stone stele with a rounded top,
   a stepped chaitya in relief near the head, one row of large letters, then dense small inscription; standing inside a modern
   silver steel cage on a small concrete base in a hill-village bazaar yard. Whitewashed two-storey house left, small rubble-stone
   hut with a low dark roof behind-right, concrete steps right, small bullet-topped pillars and a small chaitya in the lane.
   Sizes are photo estimates (no published dimensions). 1 unit = 1 m. Front = +z. */
export default function make(K) {
  const { useM, Box, Cyl, Ball, Frame, THREE, useMemo } = K;

  const rnd = (i) => { const v = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return v - Math.floor(v); };
  const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  const SW = 0.66, SH = 2.9, SD = 0.24; // slab width, height (incl. rounded top), depth
  const STONE = '#6f7470', SILVER = '#b4b9bd', CONC = '#c9c9c0';

  /* ---------- slab with rounded (bullnose) top ---------- */
  function slabGeo() {
    const s = new THREE.Shape();
    const hw = SW / 2, r = hw * 0.6, top = SH - r;
    s.moveTo(-hw, 0); s.lineTo(hw, 0); s.lineTo(hw, top);
    s.absarc(hw - r, top, r, 0, Math.PI / 2, false);
    s.lineTo(-hw + r, SH);
    s.absarc(-hw + r, top, r, Math.PI / 2, Math.PI, false);
    s.lineTo(-hw, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: SD, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 1, curveSegments: 16 });
    g.translate(0, 0, -SD / 2);
    return g;
  }

  /* ---------- carved face texture: chaitya, large letters, dense small lines ---------- */
  function faceTexture() {
    const W = 256, H = 1280;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    c.clearRect(0, 0, W, H);
    // arch-shaped stone body
    const rr = W * 0.3;
    c.beginPath(); c.moveTo(0, H); c.lineTo(0, rr); c.arc(rr, rr, rr, Math.PI, Math.PI * 1.5, false); c.lineTo(W - rr, 0); c.arc(W - rr, rr, rr, Math.PI * 1.5, 0, false); c.lineTo(W, H); c.closePath();
    c.fillStyle = STONE; c.fill();
    c.save(); c.clip();
    // weathered patches and rain streaks
    for (let i = 0; i < 90; i += 1) {
      const x = rnd(i) * W, y = rnd(i + 200) * H, w = 10 + rnd(i + 400) * 50, h = 20 + rnd(i + 600) * 120;
      c.fillStyle = `rgba(169,170,164,${0.1 + rnd(i + 800) * 0.2})`; c.fillRect(x, y, w, h);
    }
    for (let i = 0; i < 30; i += 1) {
      const x = rnd(i + 50) * W, y = rnd(i + 90) * H * 0.9;
      c.fillStyle = 'rgba(40,46,40,0.12)'; c.fillRect(x, y, 3 + rnd(i) * 5, 80 + rnd(i + 5) * 200);
    }
    const dark = 'rgba(38,42,40,0.85)';
    c.strokeStyle = dark; c.fillStyle = dark; c.lineWidth = 2.4; c.lineCap = 'round';
    // bold stepped chaitya under the arch: 6 filled tiers, dome, harmika, 5 spire discs, finial (~0.5 m x 0.38 m)
    const cx = W / 2; const base = 378;
    const relief = (fn) => {
      c.fillStyle = 'rgba(225,227,220,0.8)'; c.save(); c.translate(-3, -3); fn(); c.restore();
      c.fillStyle = 'rgba(40,44,42,0.75)'; fn();
    };
    const tiers = [200, 182, 164, 146, 128, 110];
    const chaitya = () => {
      let y = base;
      tiers.forEach((w) => { c.fillRect(cx - w / 2, y - 15, w, 13); y -= 14; });
      c.beginPath(); c.moveTo(cx - 52, y); c.arc(cx, y, 52, Math.PI, 0, false); c.closePath(); c.fill();
      y -= 52;
      c.fillRect(cx - 20, y - 30, 40, 30);
      y -= 30;
      for (let i = 0; i < 5; i += 1) { const w = 34 - i * 5; c.fillRect(cx - w / 2, y - 11 - i * 11, w, 9); }
      y -= 58;
      c.beginPath(); c.arc(cx, y - 5, 5, 0, Math.PI * 2); c.fill(); c.fillRect(cx - 1.5, y - 20, 3, 16);
    };
    relief(chaitya);
    // one bold line of large letters (0.13 m tall) directly under the chaitya
    const ly = 394, lh = 70;
    const letters = () => {
      c.strokeStyle = c.fillStyle; c.lineCap = 'round';
      c.lineWidth = 9; c.beginPath(); c.moveTo(14, ly); c.lineTo(W - 14, ly); c.stroke();
      c.lineWidth = 8;
      for (let i = 0; i < 6; i += 1) {
        const x0 = 22 + i * 37;
        c.beginPath(); c.moveTo(x0, ly); c.lineTo(x0 + 4, ly + lh * 0.7);
        c.moveTo(x0 + 18, ly); c.lineTo(x0 + 18, ly + lh);
        c.moveTo(x0 + 4, ly + lh * 0.55); c.quadraticCurveTo(x0 + 14, ly + lh * 1.05, x0 + 27, ly + lh * 0.55);
        c.stroke();
      }
    };
    relief(letters);
    // dense rows of fine inscription
    c.lineWidth = 1.2; c.strokeStyle = 'rgba(38,42,40,0.7)';
    for (let row = 0; row < 50; row += 1) {
      const ry = 490 + row * 16.5;
      if (ry > H - 30) break;
      c.beginPath(); c.moveTo(16, ry); c.lineTo(W - 16, ry); c.stroke();
      for (let k = 0; k < 28; k += 1) {
        if (rnd(row * 31 + k) < 0.15) continue;
        const x = 16 + k * 7.7;
        c.fillStyle = 'rgba(38,42,40,0.65)'; c.fillRect(x, ry, 1.4, 6 + rnd(row * 7 + k) * 5);
      }
    }
    c.restore();
    const t = new THREE.CanvasTexture(cv);
    t.anisotropy = 8;
    if ('SRGBColorSpace' in THREE) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  function Stele() {
    const M = useM();
    const geo = useMemo(slabGeo, []);
    const tex = useMemo(faceTexture, []);
    const stone = M.plain(STONE, { roughness: 1 });
    return (
      <group>
        <mesh geometry={geo} material={stone} castShadow receiveShadow />
        {/* inscribed face (arched alpha plane just proud of the front) */}
        <mesh position={[0, SH / 2, SD / 2 + 0.014]}>
          <planeGeometry args={[SW, SH]} />
          <meshStandardMaterial map={tex} transparent alphaTest={0.4} roughness={1} metalness={0} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
        </mesh>
      </group>
    );
  }

  /* ---------- silver steel cage ---------- */
  function Cage() {
    const M = useM();
    const steel = M.plain(SILVER, { roughness: 0.6, metalness: 0.3 });
    const hx = 1.2, hz = 0.9, n = 7;
    const sides = [[0, hz, 0, hx, 1.3], [0, -hz, 0, hx, 1.2], [hx, 0, Math.PI / 2, hz, 1.2], [-hx, 0, Math.PI / 2, hz, 1.2]];
    return (
      <group>
        {sides.map(([x, z, r, hw, HH], si) => (
          <group key={si} position={[x, 0, z]} rotation={[0, r, 0]}>
            {(si === 0 ? [0.12, 0.7] : [0.12, 0.65]).map((y, i) => <Box key={i} s={[hw * 2, 0.05, 0.04]} p={[0, y, 0]} m={steel} />)}
            <Box s={[hw * 2 + 0.06, 0.09, 0.07]} p={[0, HH, 0]} m={steel} />
            {Array.from({ length: n + 1 }, (_, i) => (
              <Box key={i} s={[0.025, HH, 0.025]} p={[-hw + (i * hw * 2) / n, HH / 2 + 0.05, 0]} m={steel} />
            ))}
          </group>
        ))}
        {[[1, 1, 1.35], [-1, 1, 1.35], [1, -1, 1.25], [-1, -1, 1.25]].map(([a, b, h], i) => <Box key={i} s={[0.07, h, 0.07]} p={[a * hx, h / 2, b * hz]} m={steel} />)}
      </group>
    );
  }

  /* ---------- gable roof prism (ridge along x) ---------- */
  function Gable({ w, d, h, p, m, eave = 0.25 }) {
    const geo = useMemo(() => {
      const s = new THREE.Shape();
      s.moveTo(-(d / 2 + eave), 0); s.lineTo(d / 2 + eave, 0); s.lineTo(0, h); s.closePath();
      const g = new THREE.ExtrudeGeometry(s, { depth: w + eave * 2, bevelEnabled: false });
      g.translate(0, 0, -(w + eave * 2) / 2);
      g.rotateY(Math.PI / 2);
      return g;
    }, [w, d, h, eave]);
    return <mesh geometry={geo} position={p} material={m} castShadow receiveShadow />;
  }

  function Pillar({ p, s = 1, r = 0 }) {
    const M = useM();
    const st = M.plain('#7d7f78', { roughness: 1 });
    return (
      <group position={p} rotation={[0, r, 0]} scale={s}>
        <Box s={[0.28, 0.7, 0.28]} p={[0, 0.35, 0]} m={st} />
        <Cyl rt={0.13} rb={0.15} h={0.18} p={[0, 0.79, 0]} m={st} seg={10} />
        <mesh position={[0, 1.12, 0]} material={st} castShadow><coneGeometry args={[0.13, 0.5, 10]} /></mesh>
        <Ball rad={0.13} p={[0, 0.9, 0]} sc={[1, 0.8, 1]} m={st} />
      </group>
    );
  }

  function SmallChaitya({ p, s = 1 }) {
    const M = useM();
    const st = M.plain('#85877f', { roughness: 1 });
    return (
      <group position={p} scale={s}>
        <Box s={[0.5, 0.3, 0.5]} p={[0, 0.15, 0]} m={st} />
        <Box s={[0.4, 0.14, 0.4]} p={[0, 0.37, 0]} m={st} />
        <mesh position={[0, 0.44, 0]} material={st} castShadow><sphereGeometry args={[0.2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
        <Box s={[0.12, 0.1, 0.12]} p={[0, 0.7, 0]} m={st} />
        <mesh position={[0, 0.9, 0]} material={st}><coneGeometry args={[0.07, 0.3, 8]} /></mesh>
      </group>
    );
  }

  /* ---------- MAIN ---------- */
  function DulluMain() {
    const M = useM();
    const conc = M.plain(CONC, { roughness: 0.95 });
    const concD = M.plain('#b9b9b0', { roughness: 1 });
    const step = M.plain('#c9c9c0', { roughness: 1 });
    return (
      <group>
        {/* concrete pad and step plinth under the cage */}
        <Box s={[2.9, 0.14, 2.3]} p={[0, 0.07, 0]} m={conc} />
        <Box s={[2.7, 0.1, 2.1]} p={[0, 0.19, 0]} m={concD} />
        <group position={[0, 0.24, 0]}>
          <Stele />
          <Cage />
        </group>
        {/* paved apron about 3 x 3 m around the plinth */}
        <Box s={[3.7, 0.05, 3.1]} p={[0, 0.025, 0.05]} m={M.plain('#b3afa2', { roughness: 1 })} />
        {/* concrete steps right of the cage (about 70% size) */}
        <Box s={[0.9, 0.21, 0.63]} p={[2.5, 0.105, 0.5]} m={step} />
        <Box s={[0.77, 0.21, 0.63]} p={[2.55, 0.315, 0.4]} m={step} />
        <Box s={[0.63, 0.21, 0.56]} p={[2.6, 0.525, 0.3]} m={step} />
        <Box s={[0.5, 0.56, 0.5]} p={[2.0, 0.28, -1.6]} m={concD} />
        {/* carved bullet-topped pillars and small chaitya from the lane, brought into view */}
        <Pillar p={[-2.1, 0, 2.5]} s={0.8} r={0.3} />
        <Pillar p={[-3.0, 0, 2.2]} s={0.7} r={-0.3} />
        <SmallChaitya p={[-3.6, 0, 3.0]} s={0.8} />
        <Frame s={[6.2, 3.3, 3.6]} p={[-0.3, 1.65, 0.4]} />
      </group>
    );
  }

  /* ---------- terrain ---------- */
  function hgt(x, z) {
    let h = 0;
    if (z < -3) h += sstep(-3, -22, z) * 0 + (-3 - z) * 0.18 + Math.sin(x * 0.2) * 0.4 * sstep(-6, -16, z);
    if (z < -14) h += (-14 - z) * 0.25;
    if (z > 7) h -= (z - 7) * 0.12 + (z > 18 ? (z - 18) * 0.5 : 0);
    h += Math.max(0, Math.abs(x) - 14) * 0.18;
    const r = Math.hypot(x, z);
    if (r > 48) h += (r - 48) * 0.3;
    return h;
  }

  function Terrain() {
    const geo = useMemo(() => {
      const S = 170, N = 130;
      const g = new THREE.PlaneGeometry(S, S, N, N);
      g.rotateX(-Math.PI / 2);
      const p = g.attributes.position;
      const col = new Float32Array(p.count * 3);
      const c = new THREE.Color();
      for (let i = 0; i < p.count; i += 1) {
        const x = p.getX(i), z = p.getZ(i);
        const h = hgt(x, z);
        p.setY(i, h - 0.02);
        const n = rnd(Math.floor(x / 2) * 31 + Math.floor(z / 2) * 17);
        c.set(n < 0.3 ? '#6f9a45' : n < 0.6 ? '#86a84c' : n < 0.85 ? '#8fa857' : '#7a8f4a');
        const yard = Math.hypot(x, z - 0.5) < 5;
        if (yard) c.set(n < 0.5 ? '#8f8068' : '#7d7160');
        if (Math.hypot(x, z) > 50) c.lerp(new THREE.Color('#4a6a3a'), 0.6);
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      g.computeVertexNormals();
      return g;
    }, []);
    return <mesh geometry={geo} receiveShadow><meshStandardMaterial vertexColors roughness={1} /></mesh>;
  }

  function House({ p }) {
    const M = useM();
    const wash = M.plain('#ddd5c2', { roughness: 1 });
        const clay = M.plain('#a67b55', { roughness: 1 });
    const wood = M.plain('#5a3d28', { roughness: 0.9 });
    const roof = M.plain('#6c7068', { roughness: 0.9 });
    const dark = M.plain('#2a2018');
    const glow = M.plain('#ffcf7a', { roughness: 0.6, emissive: '#ffb347', emissiveIntensity: 0.6 });
    return (
      <group position={p} rotation={[0, 0.25, 0]}>
        <Box s={[5.2, 2.5, 4]} p={[0, 1.25, 0]} m={wash} />
        <Box s={[5.2, 0.9, 4.02]} p={[0, 0.45, 0]} m={clay} />
        <Box s={[5.2, 2.4, 4]} p={[0, 3.7, 0]} m={wash} />
        {/* timber balcony on the front */}
        <Box s={[5.4, 0.12, 1.1]} p={[0, 2.55, 2.5]} m={wood} />
        {[-2.5, -1.25, 0, 1.25, 2.5].map((x, i) => <Box key={i} s={[0.1, 1, 0.1]} p={[x, 3.1, 3]} m={wood} />)}
        <Box s={[5.4, 0.08, 0.08]} p={[0, 3.6, 3]} m={wood} />
        <Box s={[5.4, 0.08, 0.08]} p={[0, 2.8, 3]} m={wood} />
        {[-1.6, 1.4].map((x, i) => <Box key={i} s={[0.8, 1.2, 0.05]} p={[x, 3.6, 2.03]} m={dark} />)}
        <Box s={[0.9, 1.7, 0.05]} p={[-1.2, 1.1, 2.03]} m={wood} />
        <Box s={[1, 0.8, 0.05]} p={[1.4, 1.4, 2.03]} m={dark} />
        <Gable w={5.2} d={4} h={1.4} p={[0, 4.9, 0]} m={roof} eave={0.5} />
      </group>
    );
  }

  function Hut({ p }) {
    const M = useM();
    const rub = M.plain('#8a7a66', { roughness: 1 });
    const rubD = M.plain('#6f6250', { roughness: 1 });
    const roof = M.plain('#4a3b2e', { roughness: 1 });
    const wood = M.plain('#5a3d28');
    const band = M.plain('#9a8a74', { roughness: 1 });
    const rag = Array.from({ length: 14 }, (_, i) => i);
    return (
      <group position={p} rotation={[0, -0.5, 0]}>
        <Box s={[3.2, 2.1, 2.6]} p={[0, 1.05, 0]} m={rub} />
        {[0, 1, 2, 3].map((i) => <Box key={i} s={[3.24, 0.04, 2.64]} p={[0, 0.4 + i * 0.5, 0]} m={band} />)}
        {[-1.4, -0.7, 0, 0.7, 1.4].map((x, i) => <Box key={'q' + i} s={[0.45, 0.35, 0.03]} p={[x, 0.3 + rnd(i + 3) * 1.5, 1.31]} m={band} />)}
        {Array.from({ length: 22 }, (_, i) => <Box key={'r' + i} s={[0.4 + rnd(i) * 0.35, 0.22, 0.03]} p={[-1.3 + (i % 6) * 0.52 + rnd(i + 9) * 0.1, 0.25 + Math.floor(i / 6) * 0.45, 1.315]} m={i % 2 ? rubD : band} />)}
        <Box s={[0.7, 1.2, 0.05]} p={[0.6, 0.6, 1.32]} m={wood} />
        <Gable w={3.2} d={2.6} h={1.3} p={[0, 2.1, 0]} m={roof} eave={0.85} />
        {/* ragged thatch eave on the long front and back */}
        {rag.map((i) => (
          <group key={i}>
            <Box s={[0.18, 0.28 + rnd(i + 11) * 0.25, 0.1]} p={[-1.7 + i * 0.26, 2.0, 1.78 + rnd(i) * 0.1]} r={[0.5, 0, 0]} m={roof} />
            <Box s={[0.18, 0.28 + rnd(i + 31) * 0.25, 0.1]} p={[-1.7 + i * 0.26, 2.0, -1.78 - rnd(i + 5) * 0.1]} r={[-0.5, 0, 0]} m={roof} />
          </group>
        ))}
      </group>
    );
  }

  function Tree({ p, s = 1 }) {
    const M = useM();
    const k = rnd(p[0] * 3 + p[2]);
    const greens = ['#6f9a45', '#86a84c', '#5d8a3e', '#9bb355', '#7c9a4a'];
    const leaf = M.plain(greens[Math.floor(k * 5)], { roughness: 1 });
    const leaf2 = M.plain(greens[(Math.floor(k * 5) + 2) % 5], { roughness: 1 });
    const blobs = [[0, 3, 0, 1.3, 1], [0.9, 2.6, 0.3, 0.95, 0.8], [-0.8, 3.2, -0.3, 1, 1.1], [0.2, 3.9, 0.2, 0.8, 0.9], [-0.3, 2.4, 0.8, 0.7, 0.8]];
    return (
      <group position={p} scale={s} rotation={[0, k * 6, 0]}>
        <Cyl rt={0.12} rb={0.2} h={2.2} p={[0, 1.1, 0]} m={M.plain('#6a5038', { roughness: 1 })} seg={7} />
        {blobs.map(([x, y, z, r, sy], i) => <Ball key={i} rad={r} p={[x, y, z]} sc={[1 + (i % 2) * 0.25, sy, 0.9 + (i % 3) * 0.15]} m={i % 2 ? leaf2 : leaf} />)}
      </group>
    );
  }

  function DulluEnv() {
    const M = useM();
    const treeSpots = useMemo(() => {
      const a = [];
      for (let i = 0; i < 60; i += 1) {
        const ang = rnd(i) * Math.PI * 2, rad = 9 + rnd(i + 50) * 34;
        const x = Math.cos(ang) * rad, z = Math.sin(ang) * rad - 2;
        if (z > 3) continue; // keep the foreground open
        if (Math.abs(x) < 6 && z > -6) continue;
        a.push([x, hgt(x, z), z, 0.8 + rnd(i + 9) * 0.9]);
      }
      return a;
    }, []);
    const ridges = [
      [-40, -58, 30, 0.5, '#7f9fb4', 44], [-10, -66, 38, 0.55, '#7596ae', 52], [30, -60, 34, 0.5, '#86a4b8', 48],
      [62, -30, 30, 0.5, '#7f9fb4', 42], [-62, -26, 28, 0.5, '#86a4b8', 40], [10, -80, 50, 0.45, '#9ab4c6', 58],
    ];
    const scrub = M.plain('#3f5c2c', { roughness: 1 });
    return (
      <group>
        <Terrain />
        {/* short broken terrace-wall segments following the slope */}
        {[[-17, -9, 6], [-11, -12, 4.5], [9, -14, 6], [16, -10.5, 5]].map(([x0, z, L], si) => (
          <group key={si}>
            {Array.from({ length: Math.round(L / 0.6) }, (_, i) => {
              const x = x0 + i * 0.6;
              if (rnd(si * 40 + i) < 0.12) return null;
              return <Box key={i} s={[0.62, 0.3 + rnd(si * 40 + i + 7) * 0.35, 0.45]} p={[x, hgt(x, z) + 0.15, z + rnd(i + si) * 0.1]} m={M.plain(rnd(i) < 0.5 ? '#8d8372' : '#7b715f', { roughness: 1 })} />;
            })}
          </group>
        ))}
        <House p={[-8.5, 0, -5.5]} />
        <Hut p={[4.5, hgt(4.5, -5), -5]} />
        {treeSpots.map((t, i) => <Tree key={i} p={[t[0], t[1], t[2]]} s={t[3]} />)}
        {/* darker weedy tufts near the yard */}
        {Array.from({ length: 7 }, (_, i) => {
          const x = -5 + rnd(i + 300) * 11, z = -5.5 + rnd(i + 340) * 2.5;
          return <Ball key={i} rad={0.3 + rnd(i) * 0.15} p={[x, 0.28, z]} sc={[0.8, 1.4, 0.8]} m={scrub} />;
        })}
        {/* scattered stones */}
        {Array.from({ length: 10 }, (_, i) => (
          <Box key={i} s={[0.3 + rnd(i) * 0.3, 0.15, 0.25 + rnd(i + 4) * 0.2]} p={[-6 + rnd(i + 70) * 12, 0.05, 2 + rnd(i + 90) * 4]} r={[0, rnd(i) * 3, 0]} m={M.plain('#8a8579', { roughness: 1 })} />
        ))}
        {/* hazy blue ridges */}
        {ridges.map(([x, z, r, k, col, top], i) => <Ball key={i} rad={r} p={[x, top - r * (0.8 + k * 0.3), z]} sc={[1.8, 0.8 + k * 0.3, 1]} m={M.plain(col, { roughness: 1 })} />)}
      </group>
    );
  }

  return { 'dullu-kirtistambha': { Main: DulluMain, Env: DulluEnv } };
}
