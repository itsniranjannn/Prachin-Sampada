// Gorkha Durbar (Gorkha Palace), Gorkha, Gandaki: a compact courtyard-style Newar palace of red brick and dark carved timber
// under one big dark-tile hipped roof, standing on a tall battered grey-stone rampart (rows of small loopholes) at the top of a
// narrow forested ridge. A long worn stone stair climbs the ridge to the front gate (+z). Inside: a brick-paved courtyard with
// red-flagged poles. Kalika temple (own tiled roof) on the west, Gorakhkali shrine on a ledge to the south-west, palms and dense
// forest on the flanks, hazy layered hills, plains to the south and the snow range (Manaslu, Himalchuli, Ganesh Himal) north.
// 1 unit is about 1.5 m. Storey counts are estimates from the photographs.
export default function make(K) {
  const { THREE, useMemo, useRef, useEffect, useState, useM, Frame, Box, Cyl, Ball } = K;

  const YR = 3.0; // rampart top (palace floor)
  const PY = YR - 4.2; // the palace is modelled for a 4.2 floor and shifted down onto the lower rampart
  const FL = -38; // valley floor
  const SLOPE = 0.4167; // stair rise per unit of run (0.3 / 0.72)
  /* irregular rampart plan following the crest (x,z): wider to the north, narrower to the south, bulging east */
  const POLY = [[-6.6, 7.2], [6.2, 7.2], [7.4, 2.0], [7.9, -6.8], [0.5, -8.2], [-7.6, -7.0], [-7.9, -1.0]];
  const CEN = [0, -0.5];
  const BASE_Y = -13;
  const FB = 1.42; // batter: footprint scale at the base
  const wallScale = (y) => 1 + ((YR - y) / (YR - BASE_Y)) * (FB - 1);
  const wallPt = (P, y) => { const k = wallScale(y); return [CEN[0] + (P[0] - CEN[0]) * k, y, CEN[1] + (P[1] - CEN[1]) * k]; };

  /* the narrow winding stair: runs of 8 steps with a landing that shifts sideways between runs */
  const SEG_X = [0, 3.5, -3.4, 3.3, -3.5, 2.2];
  const STAIR_N = 46;
  const STAIR_TOP = YR - 0.3;
  const STAIRS = (() => {
    const steps = []; const lands = []; const segs = [];
    let z = 7.0;
    for (let i = 0; i < STAIR_N; i += 1) {
      const sg = Math.floor(i / 8); const x = SEG_X[sg];
      if (i > 0 && i % 8 === 0) {
        lands.push({ x0: SEG_X[sg - 1], x1: x, z: z + 0.65, top: STAIR_TOP - 0.3 * (i - 1), i });
        z += 1.3;
      }
      if (!segs[sg]) segs[sg] = { sg, x, z0: z, i0: i };
      steps.push({ i, sg, x, z: z + 0.36, top: STAIR_TOP - 0.3 * i });
      segs[sg].z1 = z + 0.72; segs[sg].i1 = i + 1;
      z += 0.72;
    }
    return { steps, lands, segs, zEnd: z };
  })();
  const stairXAt = (zq) => {
    let best = null;
    STAIRS.steps.forEach((st) => { if (!best || Math.abs(st.z - zq) < Math.abs(best.z - zq)) best = st; });
    return best.x;
  };
  const UB = new THREE.BoxGeometry(1, 1, 1);

  const rng = (seed) => () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  function useDusk() {
    const ref = useRef();
    const [dusk, setDusk] = useState(false);
    useEffect(() => {
      try { let o = ref.current; while (o && o.parent) o = o.parent; const c = o && o.background; if (c && c.isColor) setDusk(c.r + c.g + c.b < 0.7); } catch (e) { /* ignore */ }
    }, []);
    return [dusk, ref];
  }
  const useLit = (M, dusk) => (dusk
    ? M.plain('#ffd48a', { emissive: '#ff9d33', emissiveIntensity: 1.5, roughness: 0.6 })
    : M.plain('#1f1712', { roughness: 0.5 }));

  /* coursed grey hill-stone, drawn on a canvas: thin courses of irregular stones with mossy patches */
  let stoneTex = null;
  const stoneCache = {};
  function stoneMat(rx, ry, tint = '#ffffff', rough = 0.95) {
    const key = `${rx}|${ry}|${tint}`;
    if (stoneCache[key]) return stoneCache[key];
    if (!stoneTex) {
      const cv = document.createElement('canvas'); cv.width = 512; cv.height = 512;
      const g = cv.getContext('2d');
      g.fillStyle = '#3d3a32'; g.fillRect(0, 0, 512, 512);
      const R = rng(5); const rows = 14; const rh = 512 / rows;
      for (let r = 0; r < rows; r += 1) {
        let x = -R() * 60;
        while (x < 512) {
          const w = 34 + R() * 70; const tone = 128 + R() * 52; const warm = R() * 22;
          g.fillStyle = `rgb(${Math.round(tone + warm)},${Math.round(tone + warm * 0.55)},${Math.round(tone - 12)})`;
          g.fillRect(x + 1.5, r * rh + 1.5, w - 3, rh - 3);
          if (R() > 0.84) { g.fillStyle = 'rgba(88,112,64,0.38)'; g.fillRect(x + 1.5, r * rh + 1.5, w - 3, rh - 3); }
          if (R() > 0.9) { g.fillStyle = 'rgba(40,36,30,0.25)'; g.fillRect(x + w * 0.3, r * rh + rh * 0.35, 10, 8); }
          x += w;
        }
      }
      stoneTex = new THREE.CanvasTexture(cv);
      stoneTex.wrapS = stoneTex.wrapT = THREE.RepeatWrapping; stoneTex.colorSpace = THREE.SRGBColorSpace; stoneTex.anisotropy = 4;
    }
    const t = stoneTex.clone(); t.repeat.set(rx, ry); t.needsUpdate = true;
    stoneCache[key] = new THREE.MeshStandardMaterial({ map: t, color: tint, roughness: rough });
    return stoneCache[key];
  }

  /* salmon-red fired brick with pale joints */
  let brickTex = null;
  const brickCache = {};
  function brickMat(rx, ry, tint = '#ffffff') {
    const key = `${rx}|${ry}|${tint}`;
    if (brickCache[key]) return brickCache[key];
    if (!brickTex) {
      const cv = document.createElement('canvas'); cv.width = 256; cv.height = 256;
      const g = cv.getContext('2d');
      g.fillStyle = '#cfa898'; g.fillRect(0, 0, 256, 256);
      const R = rng(11); const rows = 10; const rh = 256 / rows;
      for (let r = 0; r < rows; r += 1) {
        const off = (r % 2) * 25;
        for (let x = -50 + off; x < 256; x += 50) {
          const k = R(); const dk = R() > 0.78 ? (R() > 0.5 ? 0.78 : 0.88) : 1;
          g.fillStyle = `rgb(${Math.round((176 + k * 24) * dk)},${Math.round((94 + k * 22) * dk)},${Math.round((78 + k * 20) * dk)})`;
          g.fillRect(x + 1.5, r * rh + 1.5, 47, rh - 3);
        }
      }
      brickTex = new THREE.CanvasTexture(cv);
      brickTex.wrapS = brickTex.wrapT = THREE.RepeatWrapping; brickTex.colorSpace = THREE.SRGBColorSpace; brickTex.anisotropy = 4;
    }
    const t = brickTex.clone(); t.repeat.set(rx, ry); t.needsUpdate = true;
    brickCache[key] = new THREE.MeshStandardMaterial({ map: t, color: tint, roughness: 0.9 });
    return brickCache[key];
  }

  /* ---------------- terrain: a narrow ridge network falling steeply to a valley floor ---------------- */
  const FEATS = [
    { a: [-2, 0], b: [2, 0], w: 5, ya: 0, yb: 0 }, // palace summit
    ...STAIRS.segs.map((g) => ({ a: [g.x, g.z0], b: [g.x, g.z1], w: 1.3, ya: STAIR_TOP - 0.3 * g.i0 - 0.5, yb: STAIR_TOP - 0.3 * (g.i1 - 1) - 0.5 })), // the stair ridge, run by run
    ...STAIRS.lands.map((l) => ({ a: [l.x0, l.z], b: [l.x1, l.z], w: 1.3, ya: l.top - 0.5, yb: l.top - 0.5 })),
    { a: [SEG_X[5], STAIRS.zEnd], b: [SEG_X[5], 74], w: 2.0, ya: STAIR_TOP - 0.3 * STAIR_N - 0.2, yb: STAIR_TOP - 0.3 * STAIR_N - 0.2 - SLOPE * (74 - STAIRS.zEnd) }, // the ridge runs on south
    { a: [0, -5], b: [0, -64], w: 2.6, ya: 0, yb: -10 }, // ridge continuing north
    { a: [-6, 0], b: [-13.4, 0], w: 2.6, ya: 0, yb: 0 }, // neck to Kalika
    { a: [-13.4, 0], b: [-13.4, 0], w: 4.8, ya: 0, yb: 0 }, // Kalika platform
    { a: [-1.8, 24.3], b: [-12.5, 26.8], w: 1.8, ya: STAIR_TOP - 0.3 * 22 - 0.9, yb: STAIR_TOP - 0.3 * 22 - 1.3 }, // path to the lower Gorakhkali ledge
    { a: [-13, 26.8], b: [-13, 26.8], w: 2.8, ya: STAIR_TOP - 0.3 * 22 - 1.3, yb: STAIR_TOP - 0.3 * 22 - 1.3 },
  ];
  function ridgeH(x, z) {
    let best = FL;
    for (let i = 0; i < FEATS.length; i += 1) {
      const f = FEATS[i];
      const dx = f.b[0] - f.a[0];
      const dz = f.b[1] - f.a[1];
      const L2 = dx * dx + dz * dz;
      let t = L2 ? ((x - f.a[0]) * dx + (z - f.a[1]) * dz) / L2 : 0;
      t = Math.max(0, Math.min(1, t));
      const dist = Math.hypot(x - (f.a[0] + dx * t), z - (f.a[1] + dz * t));
      const d = Math.max(0, dist - f.w);
      const amp = Math.hypot(x, z) < 25 ? 1.2 : 0.7;
      const nz = amp * Math.sin(x * 0.9 + z * 0.5) * Math.sin(z * 0.7 - x * 0.35) * Math.min(1, d / 2);
      const y = f.ya + (f.yb - f.ya) * t - 1.05 * Math.pow(d, 1.12) + nz;
      if (y > best) best = y;
    }
    return best;
  }

  /* ---------------- generic helpers ---------------- */
  function Inst({ geo = UB, mat, items, cast = false }) {
    const ref = useRef();
    useEffect(() => {
      const o = new THREE.Object3D();
      const col = new THREE.Color();
      items.forEach((it, i) => {
        o.position.set(it.p[0], it.p[1], it.p[2]);
        o.rotation.set(...(it.r || [0, 0, 0]));
        o.scale.set(...(it.s || [1, 1, 1]));
        o.updateMatrix();
        ref.current.setMatrixAt(i, o.matrix);
        if (it.c) ref.current.setColorAt(i, col.set(it.c));
      });
      ref.current.instanceMatrix.needsUpdate = true;
      if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    }, [items]);
    return <instancedMesh ref={ref} args={[geo, mat, items.length]} castShadow={cast} receiveShadow frustumCulled={false} />;
  }

  /** Brick-faced box (red-orange fired brick), textured per face so the courses keep their scale. */
  function BB({ s, p, col = '#ffc2aa', tile = 1.5 }) {
    const M = useM();
    const [w, h, d] = s;
    const mats = useMemo(() => {
      const side = brickMat(Math.max(1, d / tile), h / tile);
      const front = brickMat(Math.max(1, w / tile), h / tile);
      const top = M.plain('#6a4a3c');
      return [side, side, top, top, front, front];
    }, [M, w, h, d, col, tile]);
    return <mesh position={p} material={mats} castShadow receiveShadow><boxGeometry args={s} /></mesh>;
  }

  /** Hip roof over a w x d plan: four slopes meeting at a ridge (a point when square). */
  function hipGeo(w, d, h, tile = 2.4) {
    const hw = w / 2; const hd = d / 2;
    const c = [[-hw, 0, -hd], [hw, 0, -hd], [hw, 0, hd], [-hw, 0, hd]];
    const wide = w >= d;
    const rx = wide ? (w - d) / 2 : 0; const rz = wide ? 0 : (d - w) / 2;
    const A = [-rx, h, -rz]; const B = [rx, h, rz];
    const tris = [];
    if (wide) {
      tris.push([c[3], c[2], B], [c[3], B, A], [c[1], c[0], A], [c[1], A, B], [c[2], c[1], B], [c[0], c[3], A]);
    } else {
      tris.push([c[3], c[2], B], [c[1], c[0], A], [c[2], c[1], A], [c[2], A, B], [c[0], c[3], B], [c[0], B, A]);
    }
    const pos = []; const uv = [];
    tris.forEach((t) => t.forEach((v) => { pos.push(v[0], v[1], v[2]); uv.push(v[0] / tile, v[2] / tile + v[1] * 0.25); }));
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    return g;
  }
  function HipRoof({ w, d, h, y, p = [0, 0, 0], m }) {
    const M = useM();
    const geo = useMemo(() => hipGeo(w, d, h), [w, d, h]);
    return (
      <group position={[p[0], y, p[2]]}>
        <mesh geometry={geo} material={m} castShadow receiveShadow />
        <Box s={[w, 0.16, 0.1]} p={[0, 0.02, d / 2]} m={M.dark} cast={false} />
        <Box s={[w, 0.16, 0.1]} p={[0, 0.02, -d / 2]} m={M.dark} cast={false} />
        <Box s={[0.1, 0.16, d]} p={[w / 2, 0.02, 0]} m={M.dark} cast={false} />
        <Box s={[0.1, 0.16, d]} p={[-w / 2, 0.02, 0]} m={M.dark} cast={false} />
        <Box s={[w - 0.1, 0.05, d - 0.1]} p={[0, -0.03, 0]} m={M.dark} cast={false} />
        <Box s={[Math.abs(w - d) + 0.45, 0.16, 0.24]} p={[0, h + 0.03, 0]} r={[0, w >= d ? 0 : Math.PI / 2, 0]} m={M.dark} cast={false} />
      </group>
    );
  }

  /** Carved window group (faces +z, centred on its own origin): n narrow lattice lights, projecting cornice, carved crest. */
  function WinGroup({ p, r = 0, w = 1.3, h = 0.75, n = 4, dusk, crest = 0.3 }) {
    const M = useM();
    const wood = M.plain('#3b2f28', { roughness: 0.85 });
    const lit = useLit(M, dusk);
    const lw = (w - 0.2) / n;
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[w + 0.2, h + 0.1, 0.06]} p={[0, 0, 0.03]} m={wood} cast={false} />
        {Array.from({ length: n }, (_, i) => <Box key={i} s={[lw - 0.07, h - 0.12, 0.05]} p={[-w / 2 + 0.1 + lw * (i + 0.5), 0, 0.07]} m={lit} cast={false} />)}
        {w > 3 && [-1, 1].map((sd) => <Box key={sd} s={[0.14, h + 0.06, 0.16]} p={[sd * lw, 0, 0.1]} m={wood} cast={false} />)}
        {w > 3 && [-1, 1].map((sd) => <Box key={'k' + sd} s={[0.2, 0.2, 0.2]} p={[sd * lw, -h / 2 - 0.12, 0.12]} m={wood} cast={false} />)}
        <Box s={[w + 0.5, 0.1, 0.3]} p={[0, h / 2 + 0.09, 0.14]} m={wood} />
        <Box s={[w + 0.25, 0.1, 0.18]} p={[0, -h / 2 - 0.05, 0.09]} m={wood} />
        <mesh position={[0, h / 2 + 0.14, 0.1]} rotation={[Math.PI / 2, 0, 0]} material={wood}><cylinderGeometry args={[crest, crest, 0.1, 12, 1, false, Math.PI / 2, Math.PI]} /></mesh>
        {crest > 0.4 && <Box s={[0.12, 0.3, 0.1]} p={[0, h / 2 + 0.14 + crest + 0.1, 0.1]} m={wood} cast={false} />}
        {crest > 0.4 && <Box s={[0.3, 0.1, 0.12]} p={[0, h / 2 + 0.14 + crest * 0.6, 0.13]} m={wood} cast={false} />}
      </group>
    );
  }
  function Door({ p, r = 0, k = 1 }) {
    const M = useM();
    const wood = M.plain('#33281f', { roughness: 0.85 });
    return (
      <group position={p} rotation={[0, r, 0]} scale={[k, 1, 1]}>
        <Box s={[0.95, 1.55, 0.05]} p={[0, 0.78, 0.03]} m={M.plain('#0e0907')} cast={false} />
        <Box s={[0.14, 1.65, 0.2]} p={[-0.56, 0.82, 0.1]} m={wood} />
        <Box s={[0.14, 1.65, 0.2]} p={[0.56, 0.82, 0.1]} m={wood} />
        <Box s={[1.4, 0.16, 0.26]} p={[0, 1.68, 0.12]} m={wood} />
        <Box s={[1.7, 0.1, 0.3]} p={[0, 1.82, 0.14]} m={wood} />
        {k > 1 && <Box s={[1.95, 0.12, 0.34]} p={[0, 1.94, 0.16]} m={wood} />}
        {k > 1 && <Box s={[2.15, 0.1, 0.38]} p={[0, 2.05, 0.18]} m={wood} />}
        <Box s={[0.2, 1.85, 0.26]} p={[-0.74, 0.92, 0.1]} m={stoneMat(0.3, 1, '#d6d1c1')} />
        <Box s={[0.2, 1.85, 0.26]} p={[0.74, 0.92, 0.1]} m={stoneMat(0.3, 1, '#d6d1c1')} />
        <Box s={[1.5, 0.16, 0.6]} p={[0, 0.08, 0.38]} m={stoneMat(1, 0.3, '#ddd8c8')} />
        <Box s={[2.1, 0.12, 0.45]} p={[0, 0.0, 0.78]} m={stoneMat(1, 0.3, '#cfcabb')} />
      </group>
    );
  }
  function Flag({ p, h = 6.8, col = '#c4221a', dir = 1 }) {
    const M = useM();
    const geo = useMemo(() => {
      const s = new THREE.Shape();
      s.moveTo(0, 0); s.lineTo(1.35, 0.05); s.lineTo(0.95, -0.4); s.lineTo(1.35, -0.8); s.lineTo(0, -0.85); s.closePath();
      return new THREE.ShapeGeometry(s);
    }, []);
    return (
      <group position={p}>
        <Cyl rt={0.045} rb={0.07} h={h} p={[0, h / 2, 0]} m={M.plain('#a58a52', { roughness: 0.9 })} seg={6} />
        <mesh geometry={geo} position={[0.03 * dir, h - 0.1, 0]} scale={[dir, 1, 1]} material={M.plain(col, { side: THREE.DoubleSide, roughness: 0.9 })} castShadow />
      </group>
    );
  }
  /** a sloped fan of leaves on a slender trunk */
  function Palm({ p, h = 6, lean = 0.08, rot = 0, s = 1 }) {
    const M = useM();
    const leaves = useMemo(() => Array.from({ length: 10 }, (_, i) => ({ a: (i / 10) * Math.PI * 2, d: 0.55 + ((i * 37) % 10) / 40 })), []);
    return (
      <group position={p} rotation={[0, rot, lean]} scale={s}>
        <Cyl rt={0.1} rb={0.19} h={h} p={[0, h / 2, 0]} m={M.plain('#7d6a50', { roughness: 1 })} seg={7} />
        <group position={[0, h, 0]}>
          {leaves.map((l, i) => (
            <group key={i} rotation={[0, l.a, 0]}>
              <mesh position={[0.9, -0.2, 0]} rotation={[0, 0, -l.d]} material={M.plain('#3f6b2c', { roughness: 1, side: THREE.DoubleSide })}><boxGeometry args={[1.9, 0.03, 0.42]} /></mesh>
            </group>
          ))}
        </group>
      </group>
    );
  }

  /* ---------------- the stone stair ---------------- */
  function StairRun({ i0, i1, dusk }) {
    const M = useM();
    const { items, lands, walls, diya } = useMemo(() => {
      const st = STAIRS.steps.filter((q) => q.i >= i0 && q.i < i1);
      const cols = ['#8f8a78', '#a29c88', '#7d8468', '#948e7c', '#6f7a5a'];
      const it = st.map((q) => ({ p: [q.x, q.top - 0.55, q.z], s: [1.0, 1.1, 0.74], c: cols[(q.i * 7 + q.sg) % 5] }));
      const ld = STAIRS.lands.filter((l) => l.i >= i0 && l.i < i1).map((l) => ({ p: [(l.x0 + l.x1) / 2, l.top - 0.55, l.z], s: [Math.abs(l.x1 - l.x0) + 1.0, 1.1, 1.3], c: '#8f8a78' }));
      const th = Math.atan(SLOPE);
      const wl = [];
      STAIRS.segs.forEach((g) => {
        const q = st.filter((x) => x.sg === g.sg);
        if (!q.length) return;
        const zA = q[0].z - 0.38; const zB = q[q.length - 1].z + 0.38;
        const len = (zB - zA) / Math.cos(th);
        const topMid = (q[0].top + q[q.length - 1].top) / 2;
        [g.sg % 2 ? -1 : 1].forEach((sd) => wl.push({ p: [g.x + sd * 0.58, topMid + 0.2, (zA + zB) / 2], r: [th, 0, 0], s: [0.15, 0.4, len] }));
      });
      const dy = st.filter((_, k) => k % 3 === 0).flatMap((q) => [{ p: [q.x - 0.45, q.top + 0.62, q.z], s: [0.14, 0.07, 0.14] }, { p: [q.x + 0.45, q.top + 0.62, q.z], s: [0.14, 0.07, 0.14] }]);
      return { items: it, lands: ld, walls: wl, diya: dy };
    }, [i0, i1]);
    return (
      <group>
        <Inst mat={stoneMat(2, 0.8, '#c0bba9')} items={items} cast />
        {lands.length > 0 && <Inst mat={stoneMat(2, 0.8, '#c0bba9')} items={lands} cast />}
        <Inst mat={stoneMat(0.6, 6, '#c4bfae')} items={walls} />
        {dusk && <Inst mat={M.plain('#ffd48a', { emissive: '#ffa030', emissiveIntensity: 2 })} items={diya} />}
      </group>
    );
  }

  /* ---------------- rampart: irregular, rock-hugging battered wall following the crest ---------------- */
  const edgeInfo = (i) => {
    const P = POLY[i]; const Q = POLY[(i + 1) % POLY.length];
    const dx = Q[0] - P[0]; const dz = Q[1] - P[1]; const L = Math.hypot(dx, dz);
    let nx = dz / L; let nz = -dx / L;
    const mx = (P[0] + Q[0]) / 2 - CEN[0]; const mz = (P[1] + Q[1]) / 2 - CEN[1];
    if (nx * mx + nz * mz < 0) { nx = -nx; nz = -nz; }
    return { P, Q, dx, dz, L, nx, nz, yaw: -Math.atan2(dz, dx) };
  };
  // gaps in the parapet as [edge, t0, t1]: the gate at the stair head and the way over to Kalika
  const GAPS = [[0, 0.41, 0.62], [6, 0.03, 0.22]];

  function Rampart({ dusk }) {
    const M = useM();
    const geo = useMemo(() => {
      const pos = []; const uv = [];
      const n = POLY.length;
      for (let i = 0; i < n; i += 1) {
        const e = edgeInfo(i);
        const T0 = wallPt(e.P, YR); const T1 = wallPt(e.Q, YR); const B0 = wallPt(e.P, BASE_Y); const B1 = wallPt(e.Q, BASE_Y);
        const u1 = e.L / 4; const vb = (YR - BASE_Y) / 4;
        const tri = (a, b, c, ua, ub, uc) => {
          const ux = b[0] - a[0]; const uy = b[1] - a[1]; const uz = b[2] - a[2];
          const vx = c[0] - a[0]; const vy = c[1] - a[1]; const vz = c[2] - a[2];
          const nxx = uy * vz - uz * vy; const nzz = ux * vy - uy * vx;
          if (nxx * e.nx + nzz * e.nz < 0) { [b, c] = [c, b]; [ub, uc] = [uc, ub]; }
          [a, b, c].forEach((v, k) => { pos.push(v[0], v[1], v[2]); uv.push(...[ua, ub, uc][k]); });
        };
        tri(T0, B0, B1, [0, 0], [0, vb], [u1, vb]);
        tri(T0, B1, T1, [0, 0], [u1, vb], [u1, 0]);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.computeVertexNormals();
      return g;
    }, []);
    const { holes, copes } = useMemo(() => {
      const h = []; const c = [];
      for (let i = 0; i < POLY.length; i += 1) {
        const e = edgeInfo(i);
        const cnt = Math.floor(e.L / 1.5);
        [0.5, 1.5, 2.4].forEach((y, row) => {
          for (let k = 0; k < cnt; k += 1) {
            const t = (k + 0.5 + (row % 2) * 0.5) / cnt;
            if (t > 0.98) continue;
            if (i === 0 && t > 0.3 && t < 0.72) continue;
            if (i === 6 && t < 0.3) continue;
            const w = wallPt([e.P[0] + e.dx * t, e.P[1] + e.dz * t], y);
            h.push({ p: [w[0] + e.nx * 0.02, y, w[2] + e.nz * 0.02], r: [0, Math.atan2(e.nx, e.nz), 0], s: [0.2, 0.22, 0.14] });
          }
        });
        let ranges = [[0, 1]];
        GAPS.filter((g) => g[0] === i).forEach((g) => {
          ranges = ranges.flatMap(([a, b]) => (g[2] <= a || g[1] >= b ? [[a, b]] : [[a, Math.max(a, g[1])], [Math.min(b, g[2]), b]].filter(([x, y]) => y - x > 0.01)));
        });
        ranges.forEach(([a, b], q) => {
          const tm = (a + b) / 2;
          const hy = YR + 0.28 + (((i * 3 + q) % 4) - 1.5) * 0.13; // uneven coping height
          c.push({ p: [e.P[0] + e.dx * tm, hy, e.P[1] + e.dz * tm], r: [0, e.yaw, 0], s: [e.L * (b - a) + 0.05, 0.42, 0.4] });
        });
      }
      return { holes: h, copes: c };
    }, []);
    const { ledges, patches } = useMemo(() => {
      const Rn = rng(31); const l = []; const pt = [];
      for (let i = 0; i < POLY.length; i += 1) {
        const e = edgeInfo(i);
        [-3.0, -6.4, -9.8, -12.2].forEach((y, k) => {
          const yy = y + ((i + k) % 3) * 0.4; const k2 = wallScale(yy);
          const w = wallPt([(e.P[0] + e.Q[0]) / 2, (e.P[1] + e.Q[1]) / 2], yy);
          l.push({ p: [w[0] + e.nx * 0.16, yy, w[2] + e.nz * 0.16], r: [0, e.yaw, 0], s: [e.L * k2, 0.14 + ((i * 5 + k * 3) % 4) * 0.07, 0.4], c: k % 2 ? '#7f7a6b' : '#928d7c' });
        });
        for (let q = 0; q < 6; q += 1) {
          const t = 0.08 + Rn() * 0.84; const y = -12 + Rn() * 14;
          const w = wallPt([e.P[0] + e.dx * t, e.P[1] + e.dz * t], y);
          pt.push({ p: [w[0] + e.nx * 0.08, y, w[2] + e.nz * 0.08], r: [0, e.yaw, 0], s: [0.8 + Rn() * 1.4, 0.4 + Rn() * 0.7, 0.14], c: Rn() > 0.5 ? '#5e5a4c' : '#5f7a45' });
        }
      }
      return { ledges: l, patches: pt };
    }, []);
    const rock = stoneMat(1, 1, '#8a8576');
    const stoneTop = stoneMat(4, 0.5, '#a39e8d');
    const stoneW = stoneMat(4, 1.6, '#908b7b');
    const gx = 1.35;
    const ste = useMemo(() => Array.from({ length: 9 }, (_, k) => ({ p: [-10.0 + 0.25 * k + 0.12, 0.333 * (k + 1) - 0.55, 0.0], s: [0.27, 1.1, 1.5], c: k % 2 ? '#aaa493' : '#bdb7a6' })), []);
    return (
      <group>
        <mesh geometry={geo} material={rock} castShadow receiveShadow />
        <Box s={[13.6, 0.1, 14.2]} p={[0.2, YR + 0.03, -0.4]} m={M.mat('herring', 6, 6, { color: '#c99a88' })} cast={false} />
        <Inst mat={M.plain('#15120e')} items={holes} />
        <Inst mat={M.plain('#ffffff', { roughness: 1 })} items={ledges} cast />
        <Inst mat={M.plain('#ffffff', { roughness: 1 })} items={patches} />
        <Inst mat={stoneTop} items={copes} />
        {/* gate posts at the stair head */}
        <Box s={[0.5, 1.0, 0.5]} p={[-gx - 0.1, YR + 0.5, 7.2]} m={stoneTop} />
        <Box s={[0.5, 1.0, 0.5]} p={[gx + 0.1, YR + 0.5, 7.2]} m={stoneTop} />
        {/* a lower stepped terrace wall on the south-west flank, a round bastion at the north-east corner */}
        <Box s={[4.4, 2.6, 5.8]} p={[-9.6, -3.6, 6.3]} m={stoneW} />
        <Box s={[3.6, 2.8, 5.0]} p={[-9.6, -0.9, 6.3]} m={stoneW} />
        <Box s={[3.7, 0.25, 5.1]} p={[-9.6, 0.62, 6.3]} m={stoneTop} />
        <Box s={[2.4, 3.0, 3.0]} p={[8.6, -3.2, -7.0]} m={stoneW} />
        <Box s={[2.6, 0.3, 3.2]} p={[8.6, -1.55, -7.0]} m={stoneTop} />
        {/* the narrow path from the Kalika side climbs to a gap in the west parapet */}
        <Inst mat={stoneMat(0.4, 0.8, '#cfcabb')} items={ste} cast />
        {[-0.85, 0.85].map((z) => <Box key={z} s={[2.4, 0.5, 0.25]} p={[-9.0, 1.65, z]} r={[0, 0, 0.45]} m={stoneW} />)}
        <StairRun i0={0} i1={26} dusk={dusk} />
      </group>
    );
  }

  /* ---------------- palace ---------------- */
  function Palace({ dusk }) {
    const M = useM();
    const YR = 4.2; // local floor level (the group is shifted down onto the rampart)
    const wood = M.plain('#3b2f28', { roughness: 0.85 });
    const dark = M.plain('#0e0907');
    const lit = useLit(M, dusk);
    const tile = M.mat('roof', 1, 1, { color: '#7a4636' });
    const tileLow = M.mat('roof', 1, 1, { color: '#6e3a2a' });
    const greenRoof = M.plain('#59645f', { roughness: 0.7, metalness: 0.2 });
    const plinth = [stoneMat(3, 0.3), stoneMat(3, 0.3), M.mat('herring', 5, 5, { color: '#e8b8a2' }), stoneMat(1, 1), stoneMat(3, 0.3), stoneMat(3, 0.3)];

    // top-storey lattice cells of the tall block (3 sides facing out + courtyard side)
    const cells = useMemo(() => {
      const out = [];
      [8.0, 8.78].forEach((y) => {
        for (let k = 0; k < 9; k += 1) {
          const x = -4.0 + k * 1.0;
          out.push({ p: [x, y, -0.4], s: [0.66, 0.52, 0.06] });
          out.push({ p: [x, y, -6.1], s: [0.66, 0.52, 0.06] });
        }
        for (let k = 0; k < 5; k += 1) {
          const z = -5.2 + k * 1.0;
          out.push({ p: [4.7, y, z], s: [0.06, 0.52, 0.66] });
          out.push({ p: [-4.7, y, z], s: [0.06, 0.52, 0.66] });
        }
      });
      return out;
    }, []);
    // ground-floor arcade openings on the courtyard faces
    const arcade = useMemo(() => {
      const out = [];
      for (let k = 0; k < 4; k += 1) out.push({ p: [-1.95 + k * 1.3, YR + 0.78, -0.47], s: [0.95, 1.35, 0.06] });
      [-1, 1].forEach((sd) => { [0.5, 1.95, 3.4].forEach((z) => out.push({ p: [sd * 2.63, YR + 0.78, z], s: [0.06, 1.35, 0.95] })); });
      return out;
    }, []);
    const posts = useMemo(() => {
      const out = [];
      for (let k = 0; k < 5; k += 1) out.push({ p: [-2.6 + k * 1.3, YR + 0.78, -0.42], s: [0.16, 1.5, 0.2] });
      return out;
    }, []);
    // carved eave struts
    const struts = useMemo(() => {
      const out = [];
      const th = 0.75;
      for (let k = 0; k < 10; k += 1) out.push({ p: [-4.5 + k * 1.0, 8.5, 6.4], r: [th, 0, 0], s: [0.7, 1.82, 1.68] });
      for (let k = 0; k < 9; k += 1) out.push({ p: [-4.4 + k * 1.1, 9.0, -7.1], r: [-th, 0, 0], s: [0.7, 1.61, 1.54] });
      for (let k = 0; k < 8; k += 1) { out.push({ p: [5.7, 9.0, -6.0 + k * 1.0], r: [0, 0, -th], s: [0.7, 1.61, 1.54] }); out.push({ p: [-5.7, 9.0, -6.0 + k * 1.0], r: [0, 0, th], s: [0.7, 1.61, 1.54] }); }
      for (let k = 0; k < 4; k += 1) { out.push({ p: [-4.62, 8.5, 0.2 + k * 1.1], r: [0, 0, th], s: [0.7, 1.68, 1.40] }); out.push({ p: [4.62, 8.5, 0.2 + k * 1.1], r: [0, 0, -th], s: [0.7, 1.68, 1.40] }); }
      return out;
    }, []);
    // continuous dark timber lattice band under the main eave of the front wing
    const frontCells = useMemo(() => {
      const out = [];
      for (let k = 0; k < 8; k += 1) out.push({ p: [-3.85 + k * 1.1, 8.2, 6.1], s: [0.7, 1.0, 0.05] });
      return out;
    }, []);
    const bands = [5.9, 7.6];
    return (
      <group>
        {/* plinth and the brick-paved courtyard floor */}
        <mesh position={[0, YR + 0.1, 0]} material={plinth} receiveShadow><boxGeometry args={[11.4, 0.2, 12.5]} /></mesh>
        <Box s={[5.2, 0.05, 4.9]} p={[0, YR + 0.22, 1.98]} m={M.mat('herring', 3, 3, { color: '#e29a84' })} cast={false} />

        {/* tall back block: three storeys, top storey of dark lattice timber */}
        <BB s={[9.2, 5.1, 5.5]} p={[0, YR + 2.55, -3.25]} />
        <Box s={[9.4, 1.5, 5.7]} p={[0, 8.45, -3.25]} m={wood} />
        <Box s={[9.9, 0.2, 6.2]} p={[0, 9.28, -3.25]} m={wood} />
        <Inst mat={lit} items={cells} />
        {bands.map((y) => <Box key={y} s={[9.35, 0.1, 5.65]} p={[0, y - 0.85 + 0.85, -3.25]} m={wood} cast={false} />)}
        <Inst mat={dark} items={arcade} />
        <Inst mat={wood} items={posts} />

        {/* side wings and front wing: two storeys */}
        <BB s={[2.0, 4.6, 4.9]} p={[-3.6, YR + 2.3, 1.98]} />
        <BB s={[2.0, 4.6, 4.9]} p={[3.6, YR + 2.3, 1.98]} />
        <BB s={[9.2, 4.6, 1.6]} p={[0, YR + 2.3, 5.2]} />
        <Box s={[9.1, 1.3, 0.14]} p={[0, 8.2, 6.03]} m={wood} />
        <Inst mat={lit} items={frontCells} />
        <Box s={[9.3, 0.14, 0.4]} p={[0, 7.55, 6.1]} m={wood} />
        {[-1, 1].map((sd) => <Box key={sd} s={[0.14, 1.3, 4.9]} p={[sd * 4.63, 8.2, 1.98]} m={wood} />)}
        {[5.9].map((y) => (
          <group key={y}>
            <Box s={[9.3, 0.1, 1.8]} p={[0, y, 5.2]} m={wood} cast={false} />
            <Box s={[2.2, 0.1, 4.9]} p={[-3.6, y, 1.98]} m={wood} cast={false} />
            <Box s={[2.2, 0.1, 4.9]} p={[3.6, y, 1.98]} m={wood} cast={false} />
          </group>
        ))}

        {/* roofs: the big dark-tile hip over the tall block, lower steps around it */}
        <HipRoof w={12} d={9.8} h={2.6} y={9.3} p={[0, 0, -2.9]} m={tile} />
        <HipRoof w={9.4} d={2.2} h={0.7} y={8.8} p={[0, 0, 5.2]} m={greenRoof} />
        <HipRoof w={2.8} d={5.5} h={0.6} y={8.8} p={[-3.6, 0, 1.98]} m={tileLow} />
        <HipRoof w={2.8} d={5.5} h={0.6} y={8.8} p={[3.6, 0, 1.98]} m={tileLow} />
        <Inst mat={wood} items={struts} />

        {/* front facade: narrow recessed door, carved first-floor window group with crest, smaller windows */}
        <Door p={[0, YR, 6.0]} k={1.3} />
        <WinGroup p={[0, 6.3, 6.0]} w={4.2} h={1.3} n={4} crest={0.6} dusk={dusk} />
        <WinGroup p={[-3.4, 6.2, 6.0]} w={1.0} h={0.7} n={2} dusk={dusk} />
        <WinGroup p={[3.4, 6.2, 6.0]} w={1.0} h={0.7} n={2} dusk={dusk} />
        {[-3.8, -2.4, 2.4, 3.8].map((x) => <Box key={x} s={[0.5, 0.55, 0.06]} p={[x, YR + 1.0, 6.02]} m={lit} cast={false} />)}
        {[-3.8, -2.4, 2.4, 3.8].map((x) => <Box key={'f' + x} s={[0.64, 0.1, 0.14]} p={[x, YR + 0.68, 6.06]} m={wood} cast={false} />)}

        {/* courtyard faces */}
        <WinGroup p={[0, 6.7, -0.47]} w={1.7} h={0.8} n={4} dusk={dusk} />
        <WinGroup p={[-1.75, 6.7, -0.47]} w={0.7} h={0.7} n={2} dusk={dusk} />
        <WinGroup p={[1.75, 6.7, -0.47]} w={0.7} h={0.7} n={2} dusk={dusk} />
        <WinGroup p={[-2.63, 6.2, 0.8]} r={Math.PI / 2} w={1.1} h={0.7} n={3} dusk={dusk} />
        <WinGroup p={[-2.63, 6.2, 3.0]} r={Math.PI / 2} w={0.9} h={0.7} n={2} dusk={dusk} />
        <WinGroup p={[2.63, 6.2, 0.8]} r={-Math.PI / 2} w={1.1} h={0.7} n={3} dusk={dusk} />
        <WinGroup p={[2.63, 6.2, 3.0]} r={-Math.PI / 2} w={0.9} h={0.7} n={2} dusk={dusk} />
        <WinGroup p={[-1.4, 6.2, 4.38]} r={Math.PI} w={0.9} h={0.7} n={2} dusk={dusk} />
        <WinGroup p={[1.4, 6.2, 4.38]} r={Math.PI} w={0.9} h={0.7} n={2} dusk={dusk} />
        <Door p={[0, YR + 0.2, 4.38]} r={Math.PI} />
        <WinGroup p={[-2.4, 6.7, -6.03]} r={Math.PI} w={1.2} h={0.75} n={3} dusk={dusk} />
        <WinGroup p={[2.4, 6.7, -6.03]} r={Math.PI} w={1.2} h={0.75} n={3} dusk={dusk} />
        <WinGroup p={[4.63, 6.7, -3.2]} r={Math.PI / 2} w={1.2} h={0.75} n={3} dusk={dusk} />
        <WinGroup p={[-4.63, 6.7, -3.2]} r={-Math.PI / 2} w={1.2} h={0.75} n={3} dusk={dusk} />
        <WinGroup p={[4.63, 6.2, 1.8]} r={Math.PI / 2} w={1.0} h={0.7} n={3} dusk={dusk} />
        <WinGroup p={[-4.63, 6.2, 1.8]} r={-Math.PI / 2} w={1.0} h={0.7} n={3} dusk={dusk} />

        {/* flagpoles with red flags in the courtyard, one at the rampart corner */}
        <Flag p={[-0.8, YR + 0.2, 1.6]} h={8.0} />
        <Flag p={[0.7, YR + 0.2, 2.3]} h={7.4} col="#d9541e" />
        {dusk && <pointLight position={[0, 6.4, 2]} color="#ffb060" intensity={14} distance={13} decay={2} />}
        {dusk && <pointLight position={[0, 6, 8.5]} color="#ffb060" intensity={8} distance={10} decay={2} />}
      </group>
    );
  }

  function GorkhaMain() {
    const [dusk, ref] = useDusk();
    return (
      <group ref={ref}>
        <Rampart dusk={dusk} />
        <group position={[0, PY, 0]}><Palace dusk={dusk} /></group>
        <Frame s={[22, 14, 22]} p={[0, 4.5, 1]} />
      </group>
    );
  }

  /* ---------------- environment ---------------- */
  function Terrain() {
    const M = useM();
    const geo = useMemo(() => {
      const N = 160; const S = 126;
      const g = new THREE.PlaneGeometry(S, S, N, N);
      g.rotateX(-Math.PI / 2);
      const pos = g.attributes.position;
      const col = new Float32Array(pos.count * 3);
      const c = new THREE.Color(); const haze = new THREE.Color('#a9bcc6');
      const field = ['#a2b070', '#bdb87e', '#8ea363', '#b0ae7c', '#7f9a5d', '#c4bc86'];
      const green = ['#2f4c28', '#284425', '#365532', '#30502a', '#2c4a2b'];
      const hash = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
      for (let i = 0; i < pos.count; i += 1) {
        const x = pos.getX(i); const z = pos.getZ(i);
        const h = ridgeH(x, z);
        pos.setY(i, h);
        const sl = Math.hypot(ridgeH(x + 0.8, z) - h, ridgeH(x, z + 0.8) - h) / 0.8;
        if (h <= FL + 0.05) c.set(field[Math.floor(hash(Math.floor(x / 4), Math.floor(z / 5)) * field.length)]);
        else if (sl > (Math.hypot(x, z) < 30 ? 1.45 : 2.1)) c.set(['#5e5b52', '#54514a', '#666158', '#4c4a43'][Math.floor(hash(x * 3, z * 3) * 4)]);
        else if (Math.abs(x) < 3.2 && Math.abs(z) < 11) c.set('#5d6a42');
        else c.set(green[Math.floor(hash(Math.floor(x), Math.floor(z)) * green.length)]);
        const r = Math.hypot(x, z);
        const k = Math.min(1, Math.max(0, (r - 22) / 40)) * 0.8;
        c.lerp(haze, k);
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      g.computeVertexNormals();
      return g;
    }, []);
    return <mesh geometry={geo} material={M.plain('#ffffff', { vertexColors: true, roughness: 1 })} receiveShadow />;
  }

  function Forest() {
    const M = useM();
    const { canopy, big, dark } = useMemo(() => {
      const R = rng(7);
      const a = []; const b = []; const c = [];
      const greens = ['#2f5a2e', '#38603a', '#2f5a2e', '#43703a', '#2c4e2c', '#35582f'];
      const clear = (x, z, h) => {
        if (h < FL + 2) return false;
        if (Math.abs(x) < 9.8 && z > -10 && z < 8.6) return false;
        if (x < -7.5 && x > -16 && Math.abs(z) < 4.5) return false; // Kalika knoll and path
        if (z > 6 && Math.abs(x - stairXAt(Math.min(z, STAIRS.zEnd - 1))) < 3 && z < 60) return false; // keep the stair visible
        if (Math.hypot(x + 13, z - 26.8) < 5) return false;
        return true;
      };
      let tries = 0;
      while (a.length < 400 && tries < 14000) {
        tries += 1;
        const x = (R() - 0.5) * 80; const z = (R() - 0.5) * 80;
        const h = ridgeH(x, z);
        if (!clear(x, z, h)) continue;
        const sz = 0.7 + R() * 0.7;
        a.push({ p: [x, h + sz * 0.55, z], s: [sz * (1.1 + R() * 0.4), sz * (0.85 + R() * 0.3), sz * (1.1 + R() * 0.4)], r: [0, R() * 6, 0], c: greens[Math.floor(R() * greens.length)] });
      }
      tries = 0;
      while (b.length + c.length < 90 && tries < 5000) {
        tries += 1;
        const x = (R() - 0.5) * 100; const z = (R() - 0.5) * 100;
        const h = ridgeH(x, z);
        if (!clear(x, z, h) || Math.hypot(x, z) < 16 || (z > 8 && Math.abs(x) < 11)) continue;
        const sz = 1.2 + R() * 1.1;
        if (R() > 0.45) b.push({ p: [x, h + sz * 0.7, z], s: [sz * 1.2, sz * 1.1, sz * 1.2], r: [0, R() * 6, 0], c: greens[Math.floor(R() * greens.length)] });
        else c.push({ p: [x, h + sz * 1.2, z], s: [sz * 0.9, sz * 1.1, sz * 0.9], r: [0, R() * 6, 0], c: '#27432a' });
      }
      // dense trees hugging the rampart base on the north, east and south flanks
      for (let i = 0; i < POLY.length; i += 1) {
        if (i === 6) continue;
        const e = edgeInfo(i);
        const cnt = Math.floor(e.L / 1.6);
        for (let k = 0; k < cnt; k += 1) {
          const t = (k + R() * 0.8) / cnt;
          if (i === 0 && t > 0.3 && t < 0.72) continue;
          const y = -2.5 - R() * 10;
          const w = wallPt([e.P[0] + e.dx * t, e.P[1] + e.dz * t], y);
          const out = 0.9 + R() * 1.8;
          const x = w[0] + e.nx * out; const z = w[2] + e.nz * out;
          const sz = 1.0 + R() * 0.9;
          const yy = Math.max(ridgeH(x, z), y - 0.8);
          if (R() > 0.35) b.push({ p: [x, yy + sz * 0.7, z], s: [sz * 1.2, sz * 1.1, sz * 1.2], r: [0, R() * 6, 0], c: greens[Math.floor(R() * greens.length)] });
          else c.push({ p: [x, yy + sz * 1.2, z], s: [sz * 0.9, sz * 1.2, sz * 0.9], r: [0, R() * 6, 0], c: '#27432a' });
        }
      }
      return { canopy: a, big: b, dark: c };
    }, []);
    const ico = useMemo(() => new THREE.IcosahedronGeometry(1, 0), []);
    const cone = useMemo(() => new THREE.ConeGeometry(0.8, 2.6, 6), []);
    const mat = M.plain('#ffffff', { roughness: 1, flatShading: true });
    return (
      <group>
        <Inst geo={ico} mat={mat} items={canopy} cast />
        <Inst geo={ico} mat={mat} items={big} cast />
        <Inst geo={cone} mat={mat} items={dark} cast />
      </group>
    );
  }

  /* hazy blue foothill layers: a nearer low ring and a paler, taller second layer on the north */
  function Hills() {
    const M = useM();
    const items = useMemo(() => {
      const R = rng(21);
      const out = [];
      const near = ['#6d8c96', '#7897a1', '#85a2ab'];
      const far = ['#a2b8c7', '#aebfcc', '#b8c8d3'];
      for (let i = 0; i < 20; i += 1) {
        const ang = (-0.12 + (i / 19) * 1.24) * Math.PI;
        const rad = 58 + R() * 8;
        const side = Math.abs(Math.cos(ang));
        const hgt = 14 + R() * 10 + (1 - side) * 8;
        const wr = 15 + R() * 8;
        out.push({ p: [Math.cos(ang) * rad, FL + hgt / 2 - 3, -Math.sin(ang) * rad], s: [wr * (1.2 + R() * 0.5), hgt, wr], r: [0, R() * 6, 0], c: near[Math.floor(R() * near.length)] });
      }
      for (let i = 0; i < 12; i += 1) {
        const ang = (0.16 + (i / 11) * 0.68) * Math.PI;
        const rad = 96 + R() * 14;
        const hgt = 26 + R() * 14;
        const wr = 24 + R() * 10;
        out.push({ p: [Math.cos(ang) * rad, FL + hgt / 2 - 3, -Math.sin(ang) * rad], s: [wr * (1.4 + R() * 0.5), hgt, wr], r: [0, R() * 6, 0], c: far[Math.floor(R() * far.length)] });
      }
      const mid = ['#8fb0b0', '#9bb8b8', '#8aa8ae'];
      for (let i = 0; i < 16; i += 1) {
        const ang = (-0.05 + (i / 15) * 1.1) * Math.PI;
        const rad = 128 + R() * 10; const hgt = 12 + R() * 8; const wr = 22 + R() * 8;
        out.push({ p: [Math.cos(ang) * rad, FL + hgt / 2 - 3, -Math.sin(ang) * rad], s: [wr * 1.8, hgt, wr], r: [0, R() * 6, 0], c: mid[Math.floor(R() * mid.length)] });
      }
      return out;
    }, []);
    const cone = useMemo(() => new THREE.ConeGeometry(1, 1, 7), []);
    return <Inst geo={cone} mat={M.plain('#ffffff', { roughness: 1, flatShading: true, fog: false })} items={items} />;
  }

  /* the Himalaya: distant, low and wide, only on the north horizon, several jagged peaks to each massif */
  function SnowRange() {
    const M = useM();
    const peaks = [[-170, -250, 15, 30], [-90, -246, 20, 34], [-10, -244, 24, 38], [70, -246, 19, 34], [150, -250, 14, 30]];
    const rockM = M.plain('#a9bccb', { roughness: 1, flatShading: true, fog: false });
    const snow = M.plain('#e6eef5', { roughness: 0.9, flatShading: true, fog: false });
    return (
      <group>
        {peaks.map(([x, z, h, r], i) => {
          const parts = [[0, h, r], [-r * 1.15, h * 0.72, r * 0.72], [r * 1.05, h * 0.6, r * 0.65]];
          return (
            <group key={i} position={[x, FL - 4, z]} rotation={[0, i * 0.7, 0]} scale={[1.5, 1, 0.8]}>
              {parts.map(([dx, hh, rr], j) => (
                <group key={j}>
                  <mesh position={[dx, hh / 2, 0]} material={rockM}><coneGeometry args={[rr, hh, 5]} /></mesh>
                  <mesh position={[dx, hh * 0.7, 0]} material={snow}><coneGeometry args={[rr * 0.6 * 1.03, hh * 0.6, 5]} /></mesh>
                </group>
              ))}
            </group>
          );
        })}
        {[-110, -55, 0, 55, 110].map((x, i) => (
          <mesh key={i} position={[x * 1.5, FL + 3, -190 - (i % 2) * 6]} scale={[56, 0.7, 16]} material={M.plain(i % 2 ? '#a7bcc4' : '#9db6bd', { roughness: 1, flatShading: true, fog: false })}><coneGeometry args={[1, 18 + (i % 3) * 4, 6]} /></mesh>
        ))}
      </group>
    );
  }

  function SkyDome({ dusk }) {
    const geo = useMemo(() => {
      const R = 175;
      const g = new THREE.SphereGeometry(R, 24, 16);
      const pos = g.attributes.position;
      const top = new THREE.Color(dusk ? '#1b1838' : '#9cbddb');
      const hor = new THREE.Color(dusk ? '#4b3a62' : '#dbe4ea');
      const col = new Float32Array(pos.count * 3);
      const c = new THREE.Color();
      for (let i = 0; i < pos.count; i += 1) {
        const t = Math.max(0, Math.min(1, pos.getY(i) / (R * 0.7)));
        c.copy(hor).lerp(top, Math.pow(t, 0.7));
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      return g;
    }, [dusk]);
    return <mesh geometry={geo} renderOrder={-10}><meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} /></mesh>;
  }

  function SmallShrine({ p, w = 3.4, hgt = 2.0, tileM, dusk }) {
    const M = useM();
    return (
      <group position={p}>
        <Box s={[w + 2.0, 0.35, w + 2.0]} p={[0, 0.175, 0]} m={stoneMat(2, 0.4, '#e8e4d6')} />
        <BB s={[w, hgt, w]} p={[0, 0.35 + hgt / 2, 0]} />
        <Box s={[w + 0.1, 0.14, w + 0.1]} p={[0, 0.35 + hgt - 0.1, 0]} m={M.plain('#3b2f28')} />
        <Door p={[0, 0.35, w / 2]} />
        <HipRoof w={w + 2.0} d={w + 2.0} h={hgt * 0.95} y={0.35 + hgt} m={tileM} />
        <Cyl rt={0.07} rb={0.1} h={0.5} p={[0, 0.35 + hgt + hgt * 0.95 + 0.2, 0]} m={M.plain('#2b2420')} seg={6} />
        {dusk && <pointLight position={[0, 1.2, w / 2 + 1]} color="#ffb060" intensity={4} distance={7} decay={2} />}
      </group>
    );
  }

  /* Kalika temple: two-step tiled roof over a small upper storey, stone plinth, gilded pinnacle, bell and flag */
  function Kalika({ p, tileM, dusk }) {
    const M = useM();
    const stoneP = stoneMat(2, 0.4, '#e2ded0');
    return (
      <group position={p} scale={0.8}>
        <Box s={[6.2, 0.3, 6.2]} p={[0, 0.15, 0]} m={stoneP} />
        <Box s={[5.2, 0.3, 5.2]} p={[0, 0.45, 0]} m={stoneP} />
        <BB s={[3.2, 2.1, 3.2]} p={[0, 0.6 + 1.05, 0]} />
        <Box s={[3.35, 0.16, 3.35]} p={[0, 0.6 + 2.1 - 0.08, 0]} m={M.plain('#3b2f28')} />
        <Door p={[0, 0.6, 1.6]} />
        <HipRoof w={5.6} d={5.6} h={0.9} y={2.7} m={tileM} />
        <BB s={[2.2, 0.9, 2.2]} p={[0, 3.6 + 0.4, 0]} />
        <HipRoof w={3.6} d={3.6} h={1.1} y={4.5} m={tileM} />
        <Cyl rt={0.05} rb={0.14} h={0.9} p={[0, 5.95, 0]} m={M.gold} seg={8} />
        <Ball rad={0.2} p={[0, 5.6, 0]} m={M.gold} />
        <Cyl rt={0.01} rb={0.03} h={0.5} p={[0, 6.6, 0]} m={M.gold} seg={5} />
        <Cyl rt={0.02} rb={0.02} h={0.35} p={[0, 2.5, 2.8]} m={M.dark} seg={5} />
        <Cyl rt={0.06} rb={0.26} h={0.36} p={[0, 2.2, 2.8]} m={M.gold} seg={10} />
        <Flag p={[2.4, 0.6, -2.2]} h={5.0} />
        {dusk && <pointLight position={[0, 1.4, 3]} color="#ffb060" intensity={5} distance={8} decay={2} />}
      </group>
    );
  }

  function Village() {
    const M = useM();
    const { walls, roofs } = useMemo(() => {
      const R = rng(99);
      const w = []; const r = [];
      for (let i = 0; i < 60; i += 1) {
        const x = -48 + R() * 36; const z = 20 + R() * 34;
        if (ridgeH(x, z) > FL + 0.3) continue;
        const s = 1.2 + R() * 1.0;
        w.push({ p: [x, FL + 0.5 * s, z], s: [s * 1.6, s, s * 1.3], r: [0, R() * 3, 0], c: ['#e6ddcd', '#ddcbb0', '#cfb09a', '#e6d7c0'][Math.floor(R() * 4)] });
        r.push({ p: [x, FL + s + 0.18, z], s: [s * 1.8, 0.35, s * 1.5], r: [0, w[w.length - 1].r[1], 0], c: ['#7a5a4a', '#6c7a76', '#8a5a48'][Math.floor(R() * 3)] });
      }
      return { walls: w, roofs: r };
    }, []);
    return (
      <group>
        <Inst mat={M.plain('#ffffff', { roughness: 0.95 })} items={walls} />
        <Inst mat={M.plain('#ffffff', { roughness: 0.95 })} items={roofs} />
      </group>
    );
  }

  function GorkhaEnv() {
    const M = useM();
    const [dusk, ref] = useDusk();
    const tileM = M.mat('roof', 1, 1, { color: '#7a4636' });
    // 5 palms in a loose clump on the east / south-east: three outside the rampart, two on the terrace behind it
    const palms = useMemo(() => [[10.2, 2.5, 6.6, 0.06, null], [11.6, -1.4, 6.0, -0.05, null], [9.4, 6.4, 6.9, 0.05, null], [6.8, -4.6, 5.8, -0.04, YR + 0.05], [6.9, -1.2, 5.2, 0.05, YR + 0.05], [14.2, 4.6, 7.4, 0.07, null], [13.6, -3.8, 6.6, -0.06, null]].map(([x, z, h, l, yy], i) => ({ x, z, h, l, i, y: yy === null ? ridgeH(x, z) : yy + 0.2 })), []);
    const gz = [-13, ridgeH(-13, 26.8), 26.8];
    return (
      <group ref={ref}>
        <SkyDome dusk={dusk} />
        <mesh position={[0, FL - 0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[200, 32]} /><meshBasicMaterial color="#a4b6b8" fog={false} /></mesh>
        <Terrain />
        <Forest />
        <StairRun i0={26} i1={STAIR_N} dusk={dusk} />
        {palms.map((p) => <Palm key={p.i} p={[p.x, p.y - 0.2, p.z]} h={p.h} lean={p.l} rot={p.i} s={1.0} />)}
        {/* Kalika temple: beside the palace on the west, on its own platform, reached by a stone path up to the rampart */}
        <Kalika p={[-13.4, ridgeH(-13.4, 0), 0.4]} tileM={tileM} dusk={dusk} />
        {/* Gorakhkali shrine on a lower ledge to the south-west, well away from the stair */}
        <SmallShrine p={gz} w={2.0} hgt={1.5} tileM={tileM} dusk={dusk} />
        <Village />
        <Hills />
        <SnowRange />
      </group>
    );
  }

  return { 'gorkha-durbar': { Main: GorkhaMain, Env: GorkhaEnv } };
}
