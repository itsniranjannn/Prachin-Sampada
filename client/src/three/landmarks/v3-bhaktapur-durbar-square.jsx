// Bhaktapur Durbar Square: a wide open brick-paved plaza. The long red-brick Palace of 55 Windows (with the Golden Gate)
// forms the north side and its facade faces +z; temples are spread across the plaza, not stacked.
// Axes: front = +z (south, the open plaza), east = +x, north = -z (palace). Units: 1 ~ 3.5 m.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Gajur, Lion, Elephant, Griffin, Frame, Tree, Diyo, THREE, useMemo } = K;

  const BRICK = '#f2b79c';
  const BRICK_P = '#b89c9c';    // palace brick tint -> ~#7a2f22
  const TILE = '#d8a380';       // terracotta tile tint
  const TILE_P = '#bf8460';     // darker palace roof tile -> ~#a8481f
  const STONEC = '#c8b896';     // buff stone
  const STONE_D = '#b8a888';    // darker stone (Vatsala)
  const STONE_L = '#b8a780';    // pale stone (Siddhi Lakshmi)
  const PAVE = '#dcc0a6';       // paler terracotta herringbone
  const TIM = '#4a2a16';
  const TIM_L = '#8f5a2c';
  const RED = '#a3281f';
  const OFF = [-0.8, 0, 0.3];
  const FR = { s: [21, 8.4, 6], p: [1.6, 3.7, 0.4] };

  /* ---------- own canvas textures ---------- */
  const texCache = new Map();
  function canvasMat(kind, rx, ry, tint) {
    const key = kind + '|' + rx + '|' + ry + '|' + (tint || '');
    if (texCache.has(key)) return texCache.get(key);
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    let seed = kind === 'pave' ? 7 : 3;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    if (kind === 'brick') {
      g.fillStyle = '#c9a98c'; g.fillRect(0, 0, 128, 128);
      for (let j = 0; j < 8; j++) for (let i = -1; i < 4; i++) {
        const x = i * 32 + (j % 2 ? 16 : 0), y = j * 16;
        const r = 150 + rnd() * 40, gg = 62 + rnd() * 28, b = 42 + rnd() * 22;
        g.fillStyle = 'rgb(' + (r | 0) + ',' + (gg | 0) + ',' + (b | 0) + ')'; g.fillRect(x + 1, y + 1, 30, 14);
      }
    } else {
      g.fillStyle = '#8a5236'; g.fillRect(0, 0, 128, 128);
      // herringbone: 8x4 px bricks, alternating horizontal and vertical pairs, strong dark joints
      for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
        const horiz = (i + j) % 2 === 0;
        for (let k = 0; k < 2; k++) {
          const v = (rnd() - 0.5) * 40;
          g.fillStyle = 'rgb(' + ((212 + v) | 0) + ',' + ((172 + v * 0.8) | 0) + ',' + ((140 + v * 0.6) | 0) + ')';
          if (horiz) g.fillRect(i * 8 + 0.5, j * 8 + k * 4 + 0.5, 7, 3); else g.fillRect(i * 8 + k * 4 + 0.5, j * 8 + 0.5, 3, 7);
        }
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.95, color: tint || '#ffffff' });
    texCache.set(key, m); return m;
  }
  const brickM = (rx, ry, tint) => canvasMat('brick', rx, ry, tint);
  const paveM = (rx, ry, tint) => canvasMat('pave', rx, ry, tint);
  function rngMk(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }

  /* ---------- geometry helpers ---------- */
  /** Long hip roof (ridge along x), eave at y=0. */
  function hipGeo(L, D, h) {
    const a = L / 2, b = D / 2, r = Math.max(0.01, a - b);
    const E = [[-a, 0, -b], [a, 0, -b], [a, 0, b], [-a, 0, b]];
    const R = [[-r, h, 0], [r, h, 0]];
    const pos = [], uv = [];
    const f = Math.sqrt(1 + (h / b) ** 2);
    const tri = (p, q, s, mode) => {
      let n = new THREE.Vector3().subVectors(new THREE.Vector3(...q), new THREE.Vector3(...p)).cross(new THREE.Vector3().subVectors(new THREE.Vector3(...s), new THREE.Vector3(...p)));
      if (n.y < 0) { const t = q; q = s; s = t; }
      [p, q, s].forEach((v) => { pos.push(...v); uv.push(mode ? v[2] * 0.9 : v[0] * 0.9, mode ? -Math.abs(v[0]) * 0.9 * f : -Math.abs(v[2]) * 0.9 * f); });
    };
    tri(E[3], E[2], R[1], 0); tri(E[3], R[1], R[0], 0);
    tri(E[1], E[0], R[0], 0); tri(E[1], R[0], R[1], 0);
    tri(E[0], E[3], R[0], 1); tri(E[2], E[1], R[1], 1);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    return g;
  }
  function HipRoof({ L, D, h, y = 0, p = [0, 0, 0], m }) {
    const g = useMemo(() => hipGeo(L, D, h), [L, D, h]);
    return <mesh geometry={g} position={[p[0], p[1] + y, p[2]]} material={m} castShadow receiveShadow />;
  }
  /** Stepped, ribbed stone/brick shikhara spire (square plan). */
  function ribSpireGeo(r0, h, layers) {
    const pts = [];
    for (let k = 0; k < layers; k += 1) {
      const t0 = k / layers, t1 = (k + 1) / layers;
      const R = (t) => Math.max(0.03, r0 * (1 - t ** 1.9) * (1 + 0.05 * Math.sin(t * Math.PI)));
      pts.push(new THREE.Vector2(R(t0), t0 * h));
      pts.push(new THREE.Vector2(R(t1) * 0.8, t1 * h * 0.999));
    }
    pts.push(new THREE.Vector2(0.03, h));
    return new THREE.LatheGeometry(pts, 4);
  }
  function RibSpire({ r0, h, layers = 9, y = 0, m, p = [0, 0, 0], gold = true, ribs }) {
    const M = useM();
    const g = useMemo(() => ribSpireGeo(r0, h, layers), [r0, h, layers]);
    return (
      <group position={[p[0], p[1] + y, p[2]]}>
        <mesh geometry={g} rotation={[0, Math.PI / 4, 0]} material={m} castShadow receiveShadow />
        <Cyl rt={r0 * 0.3} rb={r0 * 0.34} h={r0 * 0.14} p={[0, h * 0.97, 0]} m={m} seg={12} />
        <Ball rad={r0 * 0.2} sc={[1, 0.6, 1]} p={[0, h * 1.0, 0]} m={m} />
        {ribs && [0, 1, 2, 3].map((q) => (
          <group key={q} rotation={[0, q * Math.PI / 2, 0]}>
            {[-0.3, 0, 0.3].map((o) => <Box key={o} s={[0.07, h * 0.93, 0.06]} p={[o * r0, h * 0.47, r0 * 0.7 * 0.5 + 0.02]} r={[Math.atan(r0 * 0.7 / (h * 0.95)), 0, 0]} m={ribs} cast={false} />)}
          </group>
        ))}
        {gold && <Cyl rt={r0 * 0.07} rb={r0 * 0.1} h={r0 * 0.22} p={[0, h * 1.03 + r0 * 0.1, 0]} m={M.gold} seg={8} />}
        {gold && <mesh position={[0, h * 1.03 + r0 * 0.42, 0]} material={M.gold} castShadow><coneGeometry args={[r0 * 0.06, r0 * 0.5, 8]} /></mesh>}
      </group>
    );
  }
  /** Instanced boxes from a list of [x,y,z] (optional euler rot). */
  function Inst({ pts, s, color, emissive, ei = 0, rough = 0.8, rot }) {
    const mesh = useMemo(() => {
      const geo = new THREE.BoxGeometry(...s);
      const mt = new THREE.MeshStandardMaterial({ color, roughness: rough, emissive: emissive || '#000', emissiveIntensity: ei });
      const im = new THREE.InstancedMesh(geo, mt, pts.length);
      const o = new THREE.Object3D();
      if (rot) o.rotation.set(...rot);
      pts.forEach((q, i) => { o.position.set(...q); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
      im.castShadow = false; im.receiveShadow = true;
      return im;
    }, [pts, s, color, emissive, ei, rough, rot]);
    return <primitive object={mesh} />;
  }

  /* ---------- the Palace of 55 Windows ---------- */
  const SP = 0.33, GG = 0.1, GAP = 3.2, PX0 = -13.6, PZ = -4.6, PD = 2.6, GI = 39;
  const WX0 = PX0 + 0.35;
  // 55 windows in groups of five, with the Golden Gate bay between window 38 and 39
  const WXS = (() => {
    const out = []; let x = WX0;
    for (let i = 0; i < 55; i += 1) {
      if (i === GI) x += GAP;
      out.push(x); x += SP; if ((i + 1) % 5 === 0) x += GG;
    }
    return out;
  })();
  const GATEX = (WXS[GI - 1] + WXS[GI]) / 2;
  const PX1 = WXS[54] + 0.45;
  const GROUND = 1.3, UP = 1.9, PL = 0.18;
  function Palace() {
    const M = useM();
    const brick = brickM(14, 2, BRICK_P);
    const tile = M.mat('roof', 8, 2, { color: TILE_P });
    const dark = M.plain('#2e180b', { roughness: 0.8 });
    const red = M.plain('#8a1d16', { roughness: 0.7 });
    const L = PX1 - PX0, cx = (PX0 + PX1) / 2, cz = PZ - PD / 2;
    const WY = PL + GROUND + UP * 0.5 + 0.02;
    const top = PL + GROUND + UP;
    const wins = useMemo(() => WXS.map((x) => [x, WY, PZ + 0.04]), []);
    const frame = useMemo(() => wins.map((q) => [q[0], q[1], q[2]]), [wins]);
    const lat = useMemo(() => wins.map((q) => [q[0], q[1], q[2] + 0.04]), [wins]);
    const bars = useMemo(() => wins.flatMap((q) => [-0.05, 0.05].map((dx) => [q[0] + dx, q[1], q[2] + 0.075])), [wins]);
    const rail = useMemo(() => wins.map((q) => [q[0], q[1] + 0.05, q[2] + 0.078]), [wins]);
    const sills = useMemo(() => wins.map((q) => [q[0], q[1] - 0.62, q[2] + 0.07]), [wins]);
    const lintels = useMemo(() => {
      const out = [];
      for (let g = 0; g < 11; g += 1) {
        const a = WXS[g * 5], b = WXS[g * 5 + 4];
        out.push([(a + b) / 2, WY + 0.68, PZ + 0.07, b - a + 0.4]);
      }
      return out;
    }, []);
    const struts = useMemo(() => {
      const out = [];
      for (let g = 0; g < 11; g += 1) {
        const a = WXS[g * 5], b = WXS[g * 5 + 4];
        [a - 0.12, (a + b) / 2, b + 0.12].forEach((x) => out.push([x, top - 0.24, PZ + 0.17]));
      }
      return out;
    }, [top]);
    const doors = useMemo(() => [-12.2, -10.0, -7.8, -5.6, -3.4, 5.8, 8.0].map((x) => [x, PL + 0.5, PZ + 0.03]), []);
    return (
      <group>
        {/* stone platform with a stone-edged border along the front */}
        <Box s={[L + 1.2, PL, PD + 0.9]} p={[cx, PL / 2, cz + 0.3]} m={M.plain(STONEC, { roughness: 0.92 })} />
        <Box s={[L + 1.4, PL + 0.08, 0.22]} p={[cx, (PL + 0.08) / 2, PZ + 1.18]} m={M.plain('#b9aa8a', { roughness: 0.92 })} cast={false} />
        {/* ground floor */}
        <Box s={[L, GROUND, PD]} p={[cx, PL + GROUND / 2, cz]} m={brick} />
        <Inst pts={doors} s={[0.7, 1.0, 0.07]} color="#2b170c" />
        <Inst pts={doors.map((q) => [q[0], q[1] + 0.58, q[2] + 0.01])} s={[0.86, 0.08, 0.1]} color={TIM_L} />
        {/* carved cornice beam between floors */}
        <Box s={[L + 0.1, 0.12, PD + 0.14]} p={[cx, PL + GROUND + 0.02, cz]} m={dark} />
        <Box s={[L + 0.14, 0.05, 0.2]} p={[cx, PL + GROUND - 0.06, PZ + 0.05]} m={red} cast={false} />
        {/* upper floor */}
        <Box s={[L, UP, PD]} p={[cx, PL + GROUND + UP / 2, cz]} m={brick} />
        {/* 55 projecting carved timber windows: frame, lattice, bars, sill */}
        <Inst pts={frame} s={[0.32, 1.15, 0.1]} color="#3a1e0e" />
        <Inst pts={lat} s={[0.24, 1.0, 0.06]} color="#ecc07a" emissive="#ff9a3c" ei={0.18} />
        <Inst pts={bars} s={[0.022, 0.84, 0.03]} color="#5a3010" />
        <Inst pts={rail} s={[0.24, 0.03, 0.03]} color="#5a3010" />
        <Inst pts={sills} s={[0.36, 0.06, 0.2]} color="#7a4a22" />
        {/* darker carved lintel strips above each group of five and bracket struts */}
        {lintels.map((q, i) => <Box key={'li' + i} s={[q[3], 0.11, 0.13]} p={[q[0], q[1], q[2]]} m={dark} cast={false} />)}
        {lintels.map((q, i) => <Box key={'lg' + i} s={[q[3] - 0.1, 0.035, 0.15]} p={[q[0], q[1] + 0.08, q[2]]} m={M.plain('#c98f4a', { roughness: 0.6 })} cast={false} />)}
        <Inst pts={struts} s={[0.07, 0.5, 0.07]} color="#6a3a18" rot={[0.75, 0, 0]} />
        {/* upper cornice, red eaves frieze */}
        <Box s={[L + 0.2, 0.12, PD + 0.22]} p={[cx, top + 0.03, cz]} m={dark} />
        <Box s={[L + 1.1, 0.18, 0.1]} p={[cx, top + 0.15, PZ + 0.55]} m={red} cast={false} />
        {/* low hip roof of clay tile with a generous eave */}
        <HipRoof L={L + 1.2} D={PD + 1.1} h={0.72} y={top + 0.1} p={[cx, 0, cz]} m={tile} />
        <Box s={[0.3, 0.2, 0.3]} p={[cx - 4.0, top + 0.95, cz]} m={brick} />
        <Box s={[0.3, 0.2, 0.3]} p={[cx + 4.2, top + 0.95, cz]} m={brick} />
        {[PX0 - 0.55, PX1 + 0.55].map((x) => <mesh key={x} position={[x, top + 0.3, cz]} material={M.gold}><coneGeometry args={[0.06, 0.22, 6]} /></mesh>)}
        <WhiteBay />
      </group>
    );
  }
  function WhiteBay() {
    const M = useM();
    const wh = M.plain('#efe6d3', { roughness: 0.85 });
    const tile = M.mat('roof', 4, 2, { color: TILE });
    const dark = M.plain(TIM, { roughness: 0.8 });
    const x = PX0 - 1.4, z = PZ - 1.1;
    return (
      <group>
        <Box s={[2.0, 2.05, 2.2]} p={[x, 1.1, z]} m={wh} />
        <Box s={[2.06, 0.1, 2.26]} p={[x, 1.2, z]} m={dark} cast={false} />
        {[-0.5, 0.5].map((dx) => (
          <group key={dx}>
            <Box s={[0.5, 0.62, 0.06]} p={[x + dx, 1.7, z + 1.13]} m={dark} cast={false} />
            <Box s={[0.36, 0.5, 0.04]} p={[x + dx, 1.7, z + 1.16]} m={M.plain(TIM_L)} cast={false} />
          </group>
        ))}
        <Box s={[1.2, 0.8, 0.06]} p={[x, 0.55, z + 1.12]} m={dark} cast={false} />
        <HipRoof L={2.7} D={2.9} h={0.55} y={2.12} p={[x, 0, z]} m={tile} />
      </group>
    );
  }

  /* ---------- the Golden Gate ---------- */
  function GoldenGate() {
    const M = useM();
    const brick = brickM(3, 2, '#d8b4a8');
    const gold = useMemo(() => new THREE.MeshStandardMaterial({ color: '#c9a227', metalness: 0.5, roughness: 0.4, emissive: '#6a4a00', emissiveIntensity: 0.2 }), []);
    const goldD = useMemo(() => new THREE.MeshStandardMaterial({ color: '#a98418', metalness: 0.6, roughness: 0.45, emissive: '#4a3000', emissiveIntensity: 0.15 }), []);
    const dk = M.plain(TIM, { roughness: 0.8 });
    const x = GATEX, z = PZ + 0.06;
    return (
      <group position={[x, PL, z]} scale={1.2}>
        {/* brick surround stepping forward */}
        <Box s={[1.56, 1.5, 0.22]} p={[0, 0.75, 0.1]} m={brick} />
        <Box s={[1.3, 1.3, 0.1]} p={[0, 0.7, 0.2]} m={dk} cast={false} />
        <Box s={[1.58, 0.07, 0.3]} p={[0, 1.52, 0.12]} m={dk} cast={false} />
        <Box s={[1.4, 0.09, 0.32]} p={[0, 0.045, 0.4]} m={M.plain(STONEC, { roughness: 0.92 })} />
        <Box s={[1.2, 0.09, 0.22]} p={[0, 0.1, 0.55]} m={M.plain(STONEC, { roughness: 0.92 })} />
        {/* gilded frame, leaves and repousse panels */}
        <Box s={[1.06, 1.12, 0.07]} p={[0, 0.58, 0.24]} m={dk} cast={false} />
        <Box s={[0.46, 0.96, 0.05]} p={[-0.24, 0.52, 0.28]} m={gold} cast={false} />
        <Box s={[0.46, 0.96, 0.05]} p={[0.24, 0.52, 0.28]} m={gold} cast={false} />
        {[-0.24, 0.24].map((dx) => [0.22, 0.52, 0.82].map((yy, k) => <Box key={`${dx}${k}`} s={[0.34, 0.22, 0.03]} p={[dx, yy, 0.31]} m={goldD} cast={false} />))}
        <Box s={[0.12, 1.14, 0.06]} p={[-0.58, 0.58, 0.27]} m={gold} cast={false} />
        <Box s={[0.12, 1.14, 0.06]} p={[0.58, 0.58, 0.27]} m={gold} cast={false} />
        <Box s={[1.28, 0.12, 0.06]} p={[0, 1.14, 0.27]} m={gold} cast={false} />
        {/* wide gilded torana: arch, inner arch, beasts, crest */}
        <mesh position={[0, 1.14, 0.3]} material={gold}><torusGeometry args={[0.62, 0.06, 8, 30, Math.PI]} /></mesh>
        <mesh position={[0, 1.14, 0.3]} material={gold}><torusGeometry args={[0.44, 0.04, 8, 26, Math.PI]} /></mesh>
        <mesh position={[0, 1.14, 0.29]} material={goldD}><circleGeometry args={[0.4, 20, 0, Math.PI]} /></mesh>
        <Box s={[0.2, 0.2, 0.05]} p={[0, 1.5, 0.3]} m={gold} cast={false} />
        {[-1, 1].map((s) => <Ball key={s} rad={0.09} p={[s * 0.52, 1.14, 0.31]} m={gold} />)}
        {[-1, 1].map((s) => <Box key={'tb' + s} s={[0.14, 0.34, 0.06]} p={[s * 0.3, 1.42, 0.3]} m={gold} r={[0, 0, s * 0.5]} cast={false} />)}
        {/* tall two-tier gilded canopy */}
        <Roof w={1.8} d={0.8} h={0.3} y={1.56} m={gold} sag={1.3} lift={0.1} fascia={false} />
        <Cyl rt={0.02} rb={0.08} h={0.3} p={[0, 1.98, 0.1]} m={gold} seg={8} />
      </group>
    );
  }

  /* ---------- King Bhupatindra Malla on his stone column ---------- */
  function KingColumn() {
    const M = useM();
    const st = M.plain(STONEC, { roughness: 0.92 });
    return (
      <group>
        {[0, 1, 2].map((k) => <Box key={k} s={[1.0 - k * 0.2, 0.1, 1.0 - k * 0.2]} p={[0, 0.05 + k * 0.1, 0]} m={st} />)}
        <Box s={[0.4, 0.28, 0.4]} p={[0, 0.44, 0]} m={st} />
        <Cyl rt={0.1} rb={0.14} h={1.9} p={[0, 1.5, 0]} m={st} seg={16} />
        <Cyl rt={0.18} rb={0.12} h={0.1} p={[0, 2.5, 0]} m={st} seg={16} />
        <Box s={[0.5, 0.08, 0.5]} p={[0, 2.59, 0]} m={st} />
        {/* gilded king, seated, hands folded, facing the gate (-z), under a naga hood */}
        <group position={[0, 2.63, 0]} rotation={[0, Math.PI, 0]} scale={1.8}>
          <Box s={[0.3, 0.1, 0.3]} p={[0, 0.05, 0]} m={M.gold} />
          <Box s={[0.2, 0.24, 0.14]} p={[0, 0.22, 0]} m={M.gold} />
          <Ball rad={0.075} p={[0, 0.42, 0.01]} m={M.gold} />
          <Box s={[0.07, 0.07, 0.15]} p={[-0.12, 0.28, 0.08]} m={M.gold} />
          <Box s={[0.07, 0.07, 0.15]} p={[0.12, 0.28, 0.08]} m={M.gold} />
          <mesh position={[0, 0.54, 0.01]} material={M.gold}><coneGeometry args={[0.06, 0.1, 8]} /></mesh>
          <Box s={[0.04, 0.5, 0.04]} p={[0, 0.3, -0.12]} m={M.gold} />
          {[-0.14, -0.07, 0, 0.07, 0.14].map((dx, k) => <Ball key={k} rad={0.06} sc={[0.7, 1, 0.5]} p={[dx, 0.62 - Math.abs(dx) * 0.7, -0.12]} m={M.gold} />)}
        </group>
      </group>
    );
  }

  /* ---------- Taleju bell on its stone pedestal ---------- */
  function TalejuBell() {
    const M = useM();
    const st = M.plain(STONEC, { roughness: 0.92 });
    const tile = M.mat('roof', 2, 2, { color: TILE });
    const bronze = M.plain('#a8742a', { metalness: 0.8, roughness: 0.4 });
    return (
      <group>
        <Box s={[1.0, 0.16, 1.0]} p={[0, 0.08, 0]} m={st} />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => <Box key={`${a}${b}`} s={[0.1, 0.78, 0.1]} p={[a * 0.36, 0.55, b * 0.36]} m={st} />)}
        <Box s={[0.86, 0.1, 0.86]} p={[0, 0.98, 0]} m={st} />
        <Cyl rt={0.03} rb={0.03} h={0.2} p={[0, 0.83, 0]} m={M.dark} seg={6} />
        <mesh position={[0, 0.52, 0]} material={bronze} castShadow><cylinderGeometry args={[0.07, 0.24, 0.34, 18]} /></mesh>
        <Ball rad={0.06} p={[0, 0.34, 0]} m={bronze} />
        <Roof w={1.1} d={1.1} h={0.32} y={1.03} m={tile} sag={1.25} lift={0.1} />
        <Cyl rt={0.02} rb={0.05} h={0.2} p={[0, 1.42, 0]} m={M.gold} seg={8} />
      </group>
    );
  }

  /* ---------- Vatsala Durga: smaller, darker stone shikhara with corner turrets ---------- */
  function Vatsala() {
    const M = useM();
    const st = M.plain(STONE_D, { roughness: 0.92 });
    const stl = M.plain('#a99a7c', { roughness: 0.92 });
    return (
      <group>
        {[0, 1].map((k) => <Box key={k} s={[1.7 - k * 0.2, 0.14, 1.7 - k * 0.2]} p={[0, 0.07 + k * 0.14, 0]} m={st} />)}
        <Box s={[1.1, 0.9, 1.1]} p={[0, 0.73, 0]} m={stl} />
        <Box s={[1.18, 0.07, 1.18]} p={[0, 1.2, 0]} m={st} />
        <Box s={[0.4, 0.62, 0.06]} p={[0, 0.6, 0.57]} m={M.plain('#2a180c')} cast={false} />
        <Box s={[0.54, 0.07, 0.1]} p={[0, 0.94, 0.58]} m={M.gold} cast={false} />
        <Box s={[0.5, 0.1, 0.35]} p={[0, 0.05, 1.0]} m={st} />
        {[-1, 1].map((s) => <group key={s} position={[s * 0.62, 0.28, 0.78]} scale={0.8}><Lion m={st} /></group>)}
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => <RibSpire key={`${a}${b}`} r0={0.2} h={0.55} layers={5} y={1.25} p={[a * 0.45, 0, b * 0.45]} m={st} gold={false} />)}
        <RibSpire r0={0.5} h={1.45} layers={10} y={1.24} m={st} />
      </group>
    );
  }

  /* ---------- Siddhi Lakshmi: tall pale stone shikhara, 5-step plinth, paired beasts ---------- */
  function SiddhiLakshmi() {
    const M = useM();
    const st = M.plain(STONEC, { roughness: 0.92 });
    const stl = M.plain(STONE_L, { roughness: 0.92 });
    const stp = M.plain('#e2d6b4', { roughness: 0.92 });
    const rib = M.plain('#6f624a', { roughness: 0.95 });
    const edge = M.plain('#7e7058', { roughness: 0.95 });
    const steps = 5, sh = 0.16, top = steps * sh;
    return (
      <group>
        {Array.from({ length: steps }, (_, k) => <group key={k}><Box s={[3.3 - k * 0.38, sh, 3.3 - k * 0.38]} p={[0, sh / 2 + k * sh, 0]} m={k % 2 ? stp : st} /><Box s={[3.34 - k * 0.38, 0.03, 3.34 - k * 0.38]} p={[0, k * sh + 0.015, 0]} m={edge} cast={false} /></group>)}
        <Box s={[0.7, 0.55, 1.5]} p={[0, 0.275, 1.55]} m={st} />
        {/* paired beasts on the steps: griffins, elephants, lions */}
        {[[Griffin, 0.88, 0.8], [Elephant, 1.16, 0.48], [Lion, 1.44, 0.32]].map(([B, zz, yy], i) => [-1, 1].map((s) => (
          <group key={`${i}${s}`} position={[s * 0.66, yy, zz]} scale={2.0}><B m={st} /></group>
        )))}
        <Box s={[1.9, 1.1, 1.9]} p={[0, top + 0.55, 0]} m={stl} />
        <Box s={[2.0, 0.08, 1.62]} p={[0, top + 1.1, 0]} m={st} />
        <Box s={[0.5, 0.8, 0.06]} p={[0, top + 0.45, 0.96]} m={M.plain('#2a180c')} cast={false} />
        <Box s={[0.66, 0.07, 0.12]} p={[0, top + 0.88, 0.97]} m={M.gold} cast={false} />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => <RibSpire key={`${a}${b}`} r0={0.28} h={0.9} layers={6} y={top + 1.14} p={[a * 0.78, 0, b * 0.78]} m={stl} gold={false} />)}
        <RibSpire r0={1.0} h={3.9} layers={14} y={top + 1.14} m={stl} ribs={rib} />
      </group>
    );
  }

  /* ---------- big three-roof pagoda: broad overhangs, 0.9 / 0.8 / 0.7 roofs ---------- */
  function BigPagoda() {
    const M = useM();
    const tile = M.mat('roof', 4, 4, { color: '#bf8460' });
    const dark = M.plain(TIM, { roughness: 0.8 });
    const lat = M.plain(TIM_L, { roughness: 0.8 });
    const red = M.plain(RED, { roughness: 0.7 });
    const out = [];
    let y = 0, w = 2.3;
    const wallH = [1.5, 0.8, 0.7], roofH = [1.1, 1.0, 0.9];
    for (let i = 0; i < 3; i += 1) {
      const h = wallH[i];
      out.push(<Box key={'w' + i} s={[w, h, w]} p={[0, y + h / 2, 0]} m={brickM(w / 1.3, h / 0.5, null)} />);
      out.push(<Box key={'b' + i} s={[w + 0.08, 0.08, w + 0.08]} p={[0, y + h - 0.04, 0]} m={dark} cast={false} />);
      if (i === 0) {
        out.push(<Box key="d" s={[0.7, 0.85, 0.06]} p={[0, 0.45, w / 2 + 0.02]} m={M.plain('#26150a')} cast={false} />);
        out.push(<Box key="dl" s={[0.86, 0.08, 0.1]} p={[0, 0.9, w / 2 + 0.03]} m={lat} cast={false} />);
        [-1, 1].forEach((k) => out.push(<Box key={'ww' + k} s={[0.34, 0.5, 0.05]} p={[k * 0.7, 0.62, w / 2 + 0.02]} m={dark} cast={false} />));
      } else {
        [[0, w / 2 + 0.02, 0], [w / 2 + 0.02, 0, Math.PI / 2], [0, -w / 2 - 0.02, Math.PI], [-w / 2 - 0.02, 0, -Math.PI / 2]].forEach(([x, z, r], k) => out.push(
          <group key={'q' + i + k} position={[x, y + h * 0.5, z]} rotation={[0, r, 0]}>
            <Box s={[w * 0.5, h * 0.55, 0.05]} p={[0, 0, 0]} m={dark} cast={false} />
            <Box s={[w * 0.4, h * 0.45, 0.04]} p={[0, 0, 0.03]} m={lat} cast={false} />
          </group>));
      }
      const o = 1.3 - i * 0.08;
      const rw = w + 2 * o;
      for (let sd = 0; sd < 4; sd += 1) {
        out.push(<group key={'st' + i + sd} rotation={[0, sd * Math.PI / 2, 0]}>
          {[0, 1, 2, 3].map((j) => <Box key={j} s={[0.09, 0.95, 0.09]} p={[(j - 1.5) * w * 0.25, y + h - 0.4, w / 2 + 0.5]} r={[0.75, 0, 0]} m={lat} cast={false} />)}
        </group>);
      }
      out.push(<Roof key={'r' + i} w={rw} d={rw} h={roofH[i]} y={y + h - 0.05} m={tile} sag={1.4} lift={0.18} />);
      out.push(<Box key={'f' + i} s={[rw + 0.04, 0.1, rw + 0.04]} p={[0, y + h - 0.1, 0]} m={red} cast={false} />);
      y += h + roofH[i] * 0.62;
      w *= 0.76;
    }
    out.push(<Gajur key="g" y={y + 0.1} s={1.4} />);
    return <group>{out}</group>;
  }
  /* ---------- Pashupatinath / Yakshesvara: tallest pagoda of the square, on a 5-step plinth ---------- */
  function Pashupati() {
    const M = useM();
    const st = M.plain(STONEC, { roughness: 0.92 });
    return (
      <group>
        {[0, 1, 2, 3, 4].map((k) => <Box key={k} s={[5.0 - k * 0.4, 0.14, 5.0 - k * 0.4]} p={[0, 0.07 + k * 0.14, 0]} m={st} />)}
        <Box s={[1.2, 0.56, 0.9]} p={[0, 0.28, 2.85]} m={st} />
        <group position={[0, 0.7, 0]}><BigPagoda /></group>
        {[-1, 1].map((s) => <group key={s} position={[s * 1.0, 0.7, 1.95]} scale={0.9}><Lion m={st} /></group>)}
      </group>
    );
  }

  /* ---------- Chyasilin Mandap: two-storey octagonal pavilion ---------- */
  function Chyasilin() {
    const M = useM();
    const st = M.plain(STONEC, { roughness: 0.92 });
    const tile = M.mat('roof', 2, 2, { color: TILE });
    const brick = brickM(4, 1, null);
    const dark = M.plain(TIM, { roughness: 0.8 });
    const rail = M.plain(TIM_L, { roughness: 0.8 });
    const oct = (r, i) => [Math.cos((i + 0.5) * Math.PI / 4) * r, Math.sin((i + 0.5) * Math.PI / 4) * r];
    return (
      <group rotation={[0, Math.PI / 8, 0]}>
        <Cyl rt={1.05} rb={1.15} h={0.2} p={[0, 0.1, 0]} m={st} seg={8} />
        {Array.from({ length: 8 }, (_, i) => { const [x, z] = oct(0.88, i - 0.5); return <Cyl key={i} rt={0.05} rb={0.06} h={0.72} p={[x, 0.56, z]} m={dark} seg={8} />; })}
        <Cyl rt={0.9} rb={0.9} h={0.05} p={[0, 0.62, 0]} m={rail} seg={8} />
        <Cyl rt={0.93} rb={0.93} h={0.08} p={[0, 0.94, 0]} m={dark} seg={8} />
        <Cyl rt={0.5} rb={0.5} h={0.7} p={[0, 0.58, 0]} m={M.plain('#2a180c')} seg={8} />
        <mesh position={[0, 0.96, 0]} castShadow receiveShadow material={tile}><cylinderGeometry args={[0.55, 1.5, 0.42, 8]} /></mesh>
        <Cyl rt={0.62} rb={0.7} h={0.55} p={[0, 1.42, 0]} m={brick} seg={8} />
        {Array.from({ length: 8 }, (_, i) => { const [x, z] = oct(0.69, i - 0.5); const a = Math.atan2(x, z); return <group key={i} position={[x, 1.44, z]} rotation={[0, a, 0]}><Box s={[0.2, 0.3, 0.05]} p={[0, 0, 0.0]} m={dark} cast={false} /><Box s={[0.12, 0.22, 0.04]} p={[0, 0, 0.03]} m={rail} cast={false} /></group>; })}
        <Cyl rt={0.66} rb={0.66} h={0.06} p={[0, 1.72, 0]} m={dark} seg={8} />
        <mesh position={[0, 1.95, 0]} castShadow receiveShadow material={tile}><cylinderGeometry args={[0.1, 1.1, 0.5, 8]} /></mesh>
        <Gajur y={2.12} s={0.55} />
      </group>
    );
  }

  /* ---------- Fasidega: white dome on a high seven-step plinth ---------- */
  function Fasidega() {
    const M = useM();
    const st = M.plain(STONEC, { roughness: 0.92 });
    const wh = M.plain('#f5f0e4', { roughness: 0.85 });
    return (
      <group>
        {Array.from({ length: 7 }, (_, k) => <Box key={k} s={[3.3 - k * 0.2, 0.22, 3.3 - k * 0.2]} p={[0, 0.11 + k * 0.22, 0]} m={st} />)}
        <Box s={[0.8, 0.9, 0.6]} p={[0, 0.45, 1.9]} m={st} />
        <group position={[0, 0.74, 0]}>
          <Box s={[1.5, 1.0, 1.5]} p={[0, 0.85 + 0.5, 0]} m={wh} />
          {[[0, 0.76, 0], [0.76, 0, Math.PI / 2], [0, -0.76, Math.PI], [-0.76, 0, -Math.PI / 2]].map(([x, z, r], k) => (
            <group key={k} position={[x, 0.85, z]} rotation={[0, r, 0]}>
              <Box s={[0.5, 0.74, 0.05]} p={[0, 0.5, 0.01]} m={M.plain('#2a180c')} cast={false} />
              <mesh position={[0, 0.88, 0.02]} material={M.plain('#2a180c')}><circleGeometry args={[0.25, 14, 0, Math.PI]} /></mesh>
              <Box s={[0.62, 0.06, 0.1]} p={[0, 1.05, 0.02]} m={wh} cast={false} />
            </group>
          ))}
          <Box s={[1.62, 0.08, 1.62]} p={[0, 1.88, 0]} m={wh} />
          {[0.78, 0.73, 0.69].map((r, k) => <Cyl key={k} rt={r} rb={r + 0.03} h={0.07} p={[0, 1.96 + k * 0.07, 0]} m={k === 1 ? st : wh} seg={24} />)}
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => (
            <group key={`${a}${b}`} position={[a * 0.74, 1.92, b * 0.74]}>
              <Cyl rt={0.045} rb={0.07} h={0.26} p={[0, 0.13, 0]} m={wh} seg={8} />
              <mesh position={[0, 0.34, 0]} material={M.gold}><coneGeometry args={[0.05, 0.16, 8]} /></mesh>
            </group>
          ))}
          <mesh position={[0, 2.17, 0]} material={wh} castShadow receiveShadow scale={[1, 0.95, 1]}><sphereGeometry args={[0.66, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
          <Cyl rt={0.14} rb={0.2} h={0.16} p={[0, 2.84, 0]} m={wh} seg={16} />
          <Cyl rt={0.05} rb={0.1} h={0.3} p={[0, 3.02, 0]} m={M.gold} seg={10} />
          <mesh position={[0, 3.32, 0]} material={M.gold}><coneGeometry args={[0.05, 0.3, 8]} /></mesh>
        </group>
      </group>
    );
  }

  /* ---------- Kedarnath / Badrinath: wide-based ribbed red-brick shikhara with creeper ---------- */
  function Kedarnath() {
    const M = useM();
    const brick = brickM(3, 6, '#e6a68a');
    const green = M.plain('#4f7a35', { roughness: 0.95 });
    const greenL = M.plain('#6a9444', { roughness: 0.95 });
    const st = M.plain(STONEC, { roughness: 0.92 });
    const dk = M.plain('#6a2a1c', { roughness: 0.9 });
    return (
      <group>
        {[0, 1, 2].map((k) => <Box key={k} s={[2.6 - k * 0.2, 0.14, 2.6 - k * 0.2]} p={[0, 0.07 + k * 0.14, 0]} m={st} />)}
        <Box s={[2.0, 1.2, 2.0]} p={[0, 0.42 + 0.6, 0]} m={brick} />
        {/* vertical ribs on the body */}
        {[-0.65, 0, 0.65].map((dx) => <Box key={dx} s={[0.12, 1.2, 0.08]} p={[dx, 1.02, 1.02]} m={dk} cast={false} />)}
        <Box s={[2.1, 0.08, 2.1]} p={[0, 1.66, 0]} m={st} />
        <Box s={[0.54, 0.8, 0.06]} p={[0, 0.82, 1.02]} m={M.plain('#2a180c')} cast={false} />
        <RibSpire r0={0.9} h={4.5} layers={16} y={1.68} m={brick} ribs={dk} />
        {/* creeper patches climbing the spire */}
        {[[0.3, 5.0, 0.12, 0.22], [0.38, 4.0, 0.28, 0.3], [0.5, 3.2, 0.3, 0.28], [0.62, 2.5, 0.34, 0.24]].map(([x, y, z, r], k) => <Ball key={k} rad={r} sc={[1, 0.8, 0.8]} p={[x, y, z]} m={k % 2 ? greenL : green} />)}
        <Box s={[0.5, 0.7, 0.1]} p={[0.7, 1.4, 1.04]} m={green} cast={false} />
      </group>
    );
  }

  /* ---------- Main ---------- */
  function BhaktapurMain() {
    const M = useM();
    const stoneP = M.plain(STONEC, { roughness: 0.92 });
    const brickP = brickM(4, 1, '#c8a090');
    const CX = GATEX - 2.2;
    return (
      <group position={OFF}>
        {/* brick dabali and stone steps in front of the palace */}
        <Box s={[4.2, 0.34, 1.5]} p={[-8.2, 0.17, -2.5]} m={brickP} />
        <Box s={[4.4, 0.08, 1.7]} p={[-8.2, 0.37, -2.5]} m={stoneP} cast={false} />
        <Palace />
        <GoldenGate />
        <group position={[CX, 0.1, -2.9]} scale={1.4}><KingColumn /></group>
        <group position={[GATEX + 3.0, 0.1, -3.3]} scale={1.3}><TalejuBell /></group>
        <group position={[-4.6, 0, -2.0]} scale={1.4}><Vatsala /></group>
        <group position={[-7.6, 0, 3.4]} scale={1.5}><Chyasilin /></group>
        <group position={[4.2, 0, 2.2]} scale={1.3}><SiddhiLakshmi /></group>
        <group position={[12.4, 0, 3.0]} scale={1.5}><Pashupati /></group>
        <group position={[10.0, 0, -2.4]} scale={1.15}><Fasidega /></group>
        <group position={[-16.6, 0, -0.2]} scale={1.0}><Kedarnath /></group>
        <Diyos cx={CX} />
        <Frame {...FR} />
      </group>
    );
  }
  function Diyos({ cx }) {
    return (
      <group>
        {[-0.5, 0, 0.5].map((dx, k) => <Diyo key={`a${k}`} p={[cx + dx, 0.05, -1.1]} light={k === 1} />)}
        {[-0.6, 0.6].map((dx, k) => <Diyo key={`b${k}`} p={[4.2 + dx, 0.02, 5.4]} light={k === 0} />)}
        {[-1.2, 1.2].map((dx, k) => <Diyo key={`c${k}`} p={[12.4 + dx, 0.02, 8.4]} light={k === 1} />)}
      </group>
    );
  }

  /* ---------- Env: surrounding brick houses, paving, distant haze ---------- */
  const WALLS = [null, '#ecd0c0', '#d6b4a4', '#f0c4ac', '#c89886', '#e8cfa0', '#a8827a', '#d9c4b0'];
  const ROOFS = ['#d8a380', '#c8906c', '#b88060', '#d0987a'];
  function Block({ p, r = 0, w = 3, d = 2.4, st = 3, wall = 0, rt = 0, plaster = false, sh = 0.85, shop = true }) {
    const M = useM();
    const H = st * sh;
    const wm = plaster ? M.plain('#e8dcc4', { roughness: 0.85 }) : brickM(Math.max(1, w / 1.2), st, WALLS[wall]);
    const tile = M.mat('roof', Math.max(2, w / 1.4), 2, { color: ROOFS[rt] });
    const wins = useMemo(() => {
      const out = [], n = Math.max(2, Math.floor(w / 0.85));
      for (let s = 1; s < st; s += 1) for (let i = 0; i < n; i += 1) out.push([-w / 2 + ((i + 0.5) * w) / n, s * sh + sh * 0.5, d / 2 + 0.02]);
      return out;
    }, [w, d, st, sh]);
    const lat = useMemo(() => wins.map((q) => [q[0], q[1], q[2] + 0.03]), [wins]);
    const shopP = useMemo(() => {
      const out = [], n = Math.max(2, Math.floor(w / 1.1));
      for (let i = 0; i < n; i += 1) out.push([-w / 2 + ((i + 0.5) * w) / n, sh * 0.36, d / 2 + 0.02]);
      return out;
    }, [w, d, sh]);
    const bands = useMemo(() => Array.from({ length: st - 1 }, (_, i) => [0, (i + 1) * sh, 0]), [st, sh]);
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[w, H, d]} p={[0, H / 2, 0]} m={wm} />
        <Inst pts={wins} s={[0.42, sh * 0.5, 0.06]} color="#2c180c" />
        <Inst pts={lat} s={[0.3, sh * 0.38, 0.03]} color="#9a6a3a" emissive="#ff9a3c" ei={0.1} />
        {shop && <Inst pts={shopP} s={[0.7, sh * 0.62, 0.06]} color="#201208" />}
        <Inst pts={bands} s={[w + 0.06, 0.06, d + 0.08]} color={TIM} />
        <HipRoof L={w + 0.7} D={d + 0.7} h={0.45 + st * 0.06} y={H} m={tile} />
      </group>
    );
  }
  /** Low single-storey brick arcade with a red eaves frieze and tiled roof (plaza-edge buildings). */
  function ArcadeRow({ p, r = 0, len = 12, n = 8 }) {
    const M = useM();
    const wall = brickM(len / 1.4, 1, null);
    const tile = M.mat('roof', len / 1.4, 2, { color: TILE });
    const red = M.plain(RED, { roughness: 0.7 });
    const dark = M.plain(TIM, { roughness: 0.8 });
    const op = useMemo(() => Array.from({ length: n }, (_, i) => [-len / 2 + ((i + 0.5) * len) / n, 0.5, 1.12]), [len, n]);
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[len, 0.3, 2.6]} p={[0, 0.15, 0]} m={M.plain(STONEC, { roughness: 0.92 })} cast={false} />
        <Box s={[len, 1.2, 2.2]} p={[0, 0.9, 0]} m={wall} />
        <Inst pts={op} s={[len / n * 0.55, 0.85, 0.06]} color="#26150a" />
        <Box s={[len + 0.3, 0.14, 2.7]} p={[0, 1.55, 0]} m={dark} cast={false} />
        <Box s={[len + 0.5, 0.14, 0.1]} p={[0, 1.42, 1.38]} m={red} cast={false} />
        <HipRoof L={len + 1.0} D={3.2} h={0.55} y={1.56} m={tile} />
      </group>
    );
  }
  function BhaktapurEnv() {
    const M = useM();
    const ground = paveM(34, 34, '#8a5f4a');
    const plaza = paveM(26, 20, PAVE);
    const mat = M.plain('#7f9a8c', { roughness: 1 });
    const mat2 = M.plain('#9fb4ad', { roughness: 1 });
    const haze = useMemo(() => {
      const c = document.createElement('canvas'); c.width = 4; c.height = 128;
      const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 128, 0, 0);
      gr.addColorStop(0, 'rgba(190,208,205,1)'); gr.addColorStop(0.35, 'rgba(170,200,215,0.75)'); gr.addColorStop(1, 'rgba(150,190,225,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 4, 128);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
      return new THREE.MeshStandardMaterial({ map: t, transparent: true, depthWrite: false, side: THREE.BackSide, roughness: 1, fog: false });
    }, []);
    // rows of 2-4 storey houses: widths 2.6-4.5, staggered z, varied tint/roof, non-integer steps
    const rows = useMemo(() => {
      const out = [];
      const run = (seed, x0, x1, z0, jz, wmin, wmax, shop, face, along, st0 = 3) => {
        const rnd = rngMk(seed); let x = x0, i = 0;
        while (x < x1) {
          const w = wmin + rnd() * (wmax - wmin);
          const gap = rnd() < 0.3 ? 0.9 + rnd() * 0.8 : 0.15;
          out.push({ a: x + w / 2, z: z0 + (rnd() - 0.5) * 2 * jz, w, st: st0 + Math.floor(rnd() * 2), wall: Math.floor(rnd() * WALLS.length), rt: Math.floor(rnd() * ROOFS.length), plaster: rnd() < 0.1, shop, face, along });
          x += w + gap; i += 1;
        }
      };
      run(11, -27, 29, -12.4, 1.2, 2.6, 4.2, true, 0, 'x');       // behind the palace
      run(29, -29, 33, -18.2, 1.2, 3.2, 4.5, false, 0, 'x', 4);
      run(41, 13, 21, -8.6, 0.4, 2.8, 3.5, false, 0, 'x', 3);      // second, taller row
      // south side stays open (camera side)
      run(17, -16, 3, -2.0, 0.6, 2.8, 3.6, true, -Math.PI / 2, 'z'); // west end (a column of houses at x=-24)
      return out;
    }, []);
    const cloudM = M.plain('#fbfbff', { roughness: 1 });
    const pvM = [M.plain('#c98a64', { roughness: 1 }), M.plain('#c4825e', { roughness: 1 }), M.plain('#b87a58', { roughness: 1 }), M.plain('#cf9470', { roughness: 1 })];
    const paveBits = useMemo(() => {
      const r = rngMk(5), out = [];
      for (let i = 0; i < 90; i += 1) out.push([-30 + r() * 62, -5 + r() * 40, 1 + r() * 3, 0.8 + r() * 2.5, pvM[i % 4]]);
      return out;
    }, []);
    const clouds = useMemo(() => Array.from({ length: 14 }, (_, i) => ({ p: [Math.cos(i * 1.9) * 70, 30 + (i % 4) * 7, -50 - (i % 5) * 9 + Math.sin(i) * 20], s: [5 + (i % 3) * 2, 4, 4] })), []);
    const hills = useMemo(() => Array.from({ length: 22 }, (_, i) => ({ a: (i / 22) * Math.PI * 2, R: 92 + (i % 3) * 4, w: 40 + (i % 4) * 7, h: 3.2 + (i % 3) * 1.1 })), []);
    return (
      <group position={OFF}>
        {/* dark brick ground around the rim, herringbone plaza extending to the Env edge */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.09, 0]} receiveShadow material={ground}><circleGeometry args={[115, 48]} /></mesh>
        <Box s={[90, 0.06, 64]} p={[0.8, -0.03, 6]} m={plaza} cast={false} />
        {paveBits.map((b, i) => <Box key={'pv' + i} s={[b[2], 0.01, b[3]]} p={[b[0], 0.01, b[1]]} m={b[4]} cast={false} />)}
        {clouds.map((c, i) => (
          <group key={'cl' + i} position={c.p} scale={c.s}>
            {[[0, 0, 0, 1], [1.1, -0.15, 0.2, 0.8], [-1.1, -0.2, 0, 0.75], [0.4, 0.3, -0.2, 0.7]].map((q, k) => <Ball key={k} rad={q[3]} sc={[1.5, 0.55, 1]} p={[q[0], q[1], q[2]]} m={cloudM} />)}
          </group>
        ))}
        <mesh position={[0, 12, 0]} material={haze}><cylinderGeometry args={[108, 108, 34, 40, 1, true]} /></mesh>
        {/* east: a short low arcade only; the plaza stays open on that side */}
        <ArcadeRow p={[23.5, 0, -4.8]} r={-Math.PI / 2} len={8} n={6} />
        {[[29.5, -6.5, 3.6, 3], [29.0, -11.0, 3.2, 4], [29.8, -15.4, 3.4, 3]].map(([x, z, w, st], i) => <Block key={`e${i}`} p={[x, 0, z]} r={-Math.PI / 2} w={w} st={st} wall={(i + 2) % 5} rt={i % 4} shop={false} />)}
        {rows.map((h, i) => (h.along === 'x'
          ? <Block key={`r${i}`} p={[h.a, 0, h.z]} r={h.face} w={h.w} st={h.st} wall={h.wall} rt={h.rt} plaster={h.plaster} shop={h.shop} />
          : <Block key={`r${i}`} p={[-25.3 + (h.z + 2.0) * 0, 0, h.a]} r={Math.PI / 2} w={h.w} st={h.st} wall={h.wall} rt={h.rt} plaster={h.plaster} shop={h.shop} />))}
        <ArcadeRow p={[-27, 0, 11]} r={Math.PI / 2} len={10} n={7} />
        {/* trees only at the plaza corners */}
        {[[-22, 12], [23, 13], [-23, -7]].map(([x, z], i) => <Tree key={`t${i}`} p={[x, 0, z]} s={0.95 + (i % 2) * 0.1} />)}
        {/* one faint ring of valley hills far behind the roofs */}
        {hills.map((h, i) => <mesh key={i} position={[Math.cos(h.a) * h.R, -1.5, Math.sin(h.a) * h.R]} scale={[h.w, h.h, h.w * 0.5]} rotation={[0, -h.a, 0]} material={i % 2 ? mat : mat2}><sphereGeometry args={[1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>)}
      </group>
    );
  }

  return { 'bhaktapur-durbar-square': { Main: BhaktapurMain, Env: BhaktapurEnv } };
}
