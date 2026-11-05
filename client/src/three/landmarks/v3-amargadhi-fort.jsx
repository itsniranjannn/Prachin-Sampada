/* Amargadhi Fort (Amargadhi Killa), Khalanga, Dadeldhura, c.1790. 1 unit = 1 m. Front/steps = +z.
   A single-level hill-top stone fortress: a tall (6.6 m outside), strongly battered (about 1:4) wall of thin dark slate courses
   (ochre only where the sun hits, mossy grey-green in shade) around a compact irregular ~29 x 21 m enclosure on a cliff-top. The
   red-and-white striped steps (red riser, white tread, green handrail) climb the front wall to a long ochre-plastered guard hut with
   a low hipped terracotta roof on the wall crest; a rough-slab stair slot between two mossy flanking walls with a blue pipe and an
   iron gate on the east side; an iron-studded timber door at the wall foot; inside, a bare earth yard with a stone barrack row
   (timber doors, black iron crosses) and a green pipe railing; the Amar Singh Thapa statue (white plinth, black coat) in a teal
   fence at the stair foot. The cliff drops ~26 m to Khalanga bazaar. Dimensions are estimates from six photographs. */
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Frame, Tree, THREE, useMemo } = K;

  const rnd = (i) => { const v = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return v - Math.floor(v); };
  const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const nz2 = (x, z) => Math.sin(x * 0.37 + z * 0.21 + 1.3) * 0.5 + Math.sin(x * 0.83 - z * 0.61 + 4.1) * 0.3 + Math.sin(x * 1.7 + z * 1.3 + 2.2) * 0.2;

  /* ---------------- plan ---------------- */
  const LEDGE = -4, FLOOR = -30, YB = -4.3, YT = 2.6, HT = 1.0, BAT = 0.35, FZ = 10.8;
  const P = [[-13.5, -9.8], [-15.8, -1.5], [-15, 5.5], [-14.2, FZ], [-5, FZ], [11.5, FZ], [14.8, 6.0], [15.4, -3.5], [11.5, -9.8], [5, -12.4], [-2.5, -12.8], [-9, -12.0]];
  const NP = P.length;
  const CEN = [P.reduce((a, p) => a + p[0], 0) / NP, P.reduce((a, p) => a + p[1], 0) / NP];
  const EN = P.map((p, i) => {
    const q = P[(i + 1) % NP]; const dx = q[0] - p[0], dz = q[1] - p[1]; const l = Math.hypot(dx, dz);
    let nx = dz / l, nz = -dx / l;
    if (nx * ((p[0] + q[0]) / 2 - CEN[0]) + nz * ((p[1] + q[1]) / 2 - CEN[1]) < 0) { nx = -nx; nz = -nz; }
    return [nx, nz];
  });
  const MITER = P.map((p, i) => {
    const a = EN[(i + NP - 1) % NP], b = EN[i];
    let mx = a[0] + b[0], mz = a[1] + b[1]; const l = Math.hypot(mx, mz); mx /= l; mz /= l;
    const sc = 1 / Math.max(0.5, mx * b[0] + mz * b[1]);
    return [mx * sc, mz * sc];
  });
  const off = (i, dist) => [P[i][0] + MITER[i][0] * dist, P[i][1] + MITER[i][1] * dist];
  const wallFaceZ = (y) => FZ + HT + BAT * (YT - y); // outer face of the front wall (z) at height y

  function segDist(x, z, a, b) {
    const dx = b[0] - a[0], dz = b[1] - a[1]; const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz)));
    return Math.hypot(x - (a[0] + dx * t), z - (a[1] + dz * t));
  }
  function polyDist(x, z) {
    let dmin = 1e9, inside = false;
    for (let i = 0; i < NP; i++) {
      const a = P[i], b = P[(i + 1) % NP];
      dmin = Math.min(dmin, segDist(x, z, a, b));
      if ((a[1] > z) !== (b[1] > z) && x < ((b[0] - a[0]) * (z - a[1])) / (b[1] - a[1]) + a[0]) inside = !inside;
    }
    return inside ? -dmin : dmin;
  }
  const ledgeW = (x, z) => {
    const e = Math.hypot((x - 5) / 2.4, z - 21.5);
    const f = Math.hypot(x - 19, z - 14);
    return 3.9 + 11 * (1 - sstep(4, 10, e)) + 9 * (1 - sstep(3, 8, f));
  };
  function terr(x, z) {
    const d = polyDist(x, z), w = ledgeW(x, z);
    if (d <= w) return { y: LEDGE, d, w, t: 0 };
    const t = Math.min(1, (d - w) / 9);
    const y = LEDGE + (FLOOR - LEDGE) * (t * t * (3 - 2 * t)) + nz2(x, z) * 1.0 * t * (1 - t) * 2 + nz2(x * 2.6 + 3, z * 2.6) * 2.2 * Math.sin(Math.min(1, t) * Math.PI) * (t < 0.9 ? 1 : 0);
    return { y, d, w, t };
  }

  /* ---------------- stone course texture: thin dark slate slabs ---------------- */
  let _tex = null;
  function courseTex() {
    if (_tex) return _tex;
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#34342c'; g.fillRect(0, 0, 256, 256);
    let y = 0, r = 0;
    while (y < 256) {
      const h = Math.min(256 - y, 3 + Math.floor(rnd(r * 3.1) * 3));
      let x = -Math.floor(rnd(r * 7.7) * 40);
      while (x < 256) {
        const w = 14 + Math.floor(rnd(x * 0.37 + r * 11) * 60);
        const L = 105 + Math.floor(rnd(x * 1.7 + r * 5.3) * 120);
        const warm = rnd(x * 0.9 + r * 2.7) * 10;
        g.fillStyle = `rgb(${L + warm},${L},${L - 10 - warm * 0.6})`; g.fillRect(x + 1, y + 1, w - 2, Math.max(2, h - 1));
        g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(x + 1, y + h - 1, w - 2, 1); g.fillStyle = 'rgba(20,16,10,0.6)'; g.fillRect(x, y, 2, h);
        g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(x + 1, y + 1, w - 2, 1);
        x += w;
      }
      y += h; r++;
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    _tex = t; return t;
  }
  const matCache = {};
  const stoneMatVC = () => (matCache.vc ||= new THREE.MeshStandardMaterial({ map: courseTex(), vertexColors: true, roughness: 1 }));
  const stoneMatC = (color) => (matCache[color] ||= new THREE.MeshStandardMaterial({ map: courseTex(), color, roughness: 1 }));

  const OCHRE = new THREE.Color('#b98a5c'), OCHRE2 = new THREE.Color('#a07a55'), SHADE = new THREE.Color('#4a4a40'), MOSS = new THREE.Color('#6b7a45'), CAP = new THREE.Color('#a88a62');
  const _c = new THREE.Color(), _o = new THREE.Color();
  function wallColor(x, y, z, h) {
    const sun = Math.min(1, Math.max(0, 0.1 + h[0] * 0.55 + h[2] * 0.95));
    const k = Math.min(1, Math.max(0, (y - YB) / (YT - YB)));
    const n = nz2(x * 0.6, z * 0.6 + y);
    _o.copy(OCHRE).lerp(OCHRE2, Math.min(1, Math.max(0, 0.5 + n * 0.8)));
    const m = sstep(0.3, 0.7, sun) * Math.min(1, 0.85 + 0.15 * k);
    _c.copy(SHADE).lerp(_o, m);
    const patch = nz2(x * 0.9 + y * 1.4, z * 0.9 - y) + (1 - k) * 0.6;
    if (patch > 0.4) _c.lerp(MOSS, Math.min(0.75, (patch - 0.4) * 1.6) * (1 - m * 0.85));
    return [_c.r * 1.5, _c.g * 1.5, _c.b * 1.5];
  }
  function capColor() { _c.copy(CAP); return [_c.r, _c.g, _c.b]; }

  function addGrid(out, A, B, C, D, nu, nv, hint, colFn) {
    const lerp = (p, q, s) => [p[0] + (q[0] - p[0]) * s, p[1] + (q[1] - p[1]) * s, p[2] + (q[2] - p[2]) * s];
    const pt = (s, t) => lerp(lerp(A, B, s), lerp(D, C, s), t);
    const lenU = Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]), lenV = Math.hypot(D[0] - A[0], D[1] - A[1], D[2] - A[2]);
    const US = 4.6;
    const push = (p, s, t) => { out.pos.push(p[0], p[1], p[2]); out.uv.push((s * lenU) / US, (t * lenV) / US); out.col.push(...colFn(p, hint)); };
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
      const s0 = i / nu, s1 = (i + 1) / nu, t0 = j / nv, t1 = (j + 1) / nv;
      const p00 = pt(s0, t0), p10 = pt(s1, t0), p11 = pt(s1, t1), p01 = pt(s0, t1);
      const e1 = [p10[0] - p00[0], p10[1] - p00[1], p10[2] - p00[2]], e2 = [p11[0] - p00[0], p11[1] - p00[1], p11[2] - p00[2]];
      const nrm = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
      const flip = nrm[0] * hint[0] + nrm[1] * hint[1] + nrm[2] * hint[2] < 0;
      const tris = flip
        ? [[p00, s0, t0, p11, s1, t1, p10, s1, t0], [p00, s0, t0, p01, s0, t1, p11, s1, t1]]
        : [[p00, s0, t0, p10, s1, t0, p11, s1, t1], [p00, s0, t0, p11, s1, t1, p01, s0, t1]];
      tris.forEach((tr) => { for (let k = 0; k < 9; k += 3) push(tr[k], tr[k + 1], tr[k + 2]); });
    }
  }

  function buildWallRing() {
    const out = { pos: [], uv: [], col: [] };
    const hb = HT + BAT * (YT - YB);
    for (let i = 0; i < NP; i++) {
      const j = (i + 1) % NP, en = EN[i];
      const len = Math.hypot(P[j][0] - P[i][0], P[j][1] - P[i][1]);
      const nu = Math.max(1, Math.round(len / 2.6));
      const a = off(i, hb), b = off(j, hb), c = off(i, HT), d = off(j, HT), e = off(i, -HT), f = off(j, -HT);
      const v = (p, y) => [p[0], y, p[1]];
      addGrid(out, v(a, YB), v(b, YB), v(d, YT), v(c, YT), nu, 4, [en[0], 0.25, en[1]], (p, h) => wallColor(p[0], p[1], p[2], h));
      addGrid(out, v(c, YT), v(d, YT), v(f, YT), v(e, YT), nu, 1, [0, 1, 0], () => capColor());
      addGrid(out, v(f, YB), v(e, YB), v(e, YT), v(f, YT), nu, 3, [-en[0], 0, -en[1]], (p, h) => wallColor(p[0], p[1], p[2], [-h[0] * 0.6, 0, -h[2] * 0.6]));
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(out.pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(out.uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(out.col, 3));
    g.computeVertexNormals();
    return g;
  }

  function buildTerrain() {
    const X0 = -57, X1 = 57, Z0 = -51, Z1 = 57, S = 1.5;
    const nx = Math.round((X1 - X0) / S) + 1, nz = Math.round((Z1 - Z0) / S) + 1;
    const pos = [], col = [], idx = [];
    const LED = new THREE.Color('#86724f'), GR = new THREE.Color('#5f7040'), DRY = new THREE.Color('#7d6c48'), PINE = new THREE.Color('#38502f'), FLD = new THREE.Color('#6f7f40'), FLD2 = new THREE.Color('#948e50'), ROCK = new THREE.Color('#5a5649'), ROCKD = new THREE.Color('#3f3d35'), PAR = new THREE.Color('#93b25f'), BAZ = new THREE.Color('#9b9786');
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const x = X0 + i * S, z = Z0 + j * S;
      const { y, d, w, t } = terr(x, z);
      pos.push(x, y, z);
      const n = nz2(x * 1.3, z * 1.3);
      if (d <= w + 0.4) _c.copy(LED).lerp(DRY, 0.3 + n * 0.3);
      else {
        _c.copy(GR).lerp(DRY, 0.4 + n * 0.5);
        if (t < 0.85) _c.lerp(ROCK, Math.min(0.9, 0.25 + 0.75 * Math.sin(Math.min(1, t * 1.15) * Math.PI)) * (0.55 + 0.45 * (n + 0.5)));
        if (t < 0.9) _c.lerp(ROCKD, Math.max(0, Math.sin(y * 2.1 + n * 3)) * 0.55 * Math.sin(Math.min(1, t) * Math.PI));
        const fo = nz2(x * 0.45 + 7, z * 0.45);
        if (t > 0.5 && t < 0.97 && fo > 0.0) _c.lerp(PINE, Math.min(0.7, fo * 1.4));
        if (t >= 0.97) { _c.copy(Math.floor(d / 2.6 + n) % 2 ? FLD : FLD2).lerp(DRY, 0.15 * (n + 0.5)); }
        if (t >= 0.97 && x > -34 && x < 36 && z > 35 && z < 53) _c.copy(BAZ).lerp(DRY, 0.2 * (n + 0.5));
        if (x < -37 && x > -50 && z > 34 && z < 48) _c.copy(PAR); // Fulpati parade ground (off to one side, far below)
      }
      col.push(_c.r, _c.g, _c.b);
    }
    for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i, b = a + 1, c = a + nx, e = c + 1;
      idx.push(a, c, b, b, c, e);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    const gf = g.toNonIndexed(); gf.computeVertexNormals();
    return gf;
  }

  function buildYard() {
    const pts = P.map((_, i) => off(i, -HT + 0.02));
    const sh = new THREE.Shape(pts.map((p) => new THREE.Vector2(p[0], -p[1])));
    const g = new THREE.ShapeGeometry(sh);
    g.rotateX(-Math.PI / 2);
    return g;
  }

  /* ---------------- instancing helpers ---------------- */
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
  const compose = (pos, rotY, sc) => _m.compose(_p.set(...pos), _q.setFromEuler(_e.set(0, rotY, 0)), _s.set(...sc)).clone();
  function Inst({ geo, mat, mats, colors, cast = true }) {
    const mesh = useMemo(() => {
      const im = new THREE.InstancedMesh(geo, mat, mats.length);
      mats.forEach((mm, i) => im.setMatrixAt(i, mm));
      if (colors) colors.forEach((c, i) => im.setColorAt(i, new THREE.Color(c)));
      im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
      im.castShadow = cast; im.receiveShadow = true; im.frustumCulled = false;
      return im;
    }, [geo, mat, mats, colors, cast]);
    return <primitive object={mesh} />;
  }
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const unitCone = new THREE.ConeGeometry(1, 1, 7);
  const unitCyl = new THREE.CylinderGeometry(1, 1, 1, 6);
  const unitBall = new THREE.IcosahedronGeometry(1, 1);

  function Rod({ a, b, r = 0.04, m, seg = 6 }) {
    const key = [...a, ...b].join(',');
    const o = useMemo(() => {
      const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b); const d = B.clone().sub(A); const len = d.length();
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
      return { pos: A.clone().add(B).multiplyScalar(0.5).toArray(), q, len };
    }, [key]); // eslint-disable-line
    return <mesh position={o.pos} quaternion={o.q} material={m} castShadow><cylinderGeometry args={[r, r, o.len, seg]} /></mesh>;
  }

  /* stone box with courses (uv scaled by size) */
  function StoneBox({ s, p, r, color = '#a0a090' }) {
    const geo = useMemo(() => {
      const g = new THREE.BoxGeometry(s[0], s[1], s[2]);
      const uv = g.attributes.uv; const dims = [[s[2], s[1]], [s[2], s[1]], [s[0], s[2]], [s[0], s[2]], [s[0], s[1]], [s[0], s[1]]];
      for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const ii = f * 4 + k; uv.setXY(ii, (uv.getX(ii) * dims[f][0]) / 3.5, (uv.getY(ii) * dims[f][1]) / 3.5); }
      return g;
    }, [s[0], s[1], s[2]]); // eslint-disable-line
    return <mesh position={p} rotation={r} geometry={geo} material={stoneMatC(color)} castShadow receiveShadow />;
  }

  /* ---------------- details ---------------- */
  function IronGate({ p, r, w = 1.9, h = 2.2 }) {
    const M = useM(); const iron = M.plain('#1d2022', { roughness: 0.6, metalness: 0.5 });
    const n = Math.round(w / 0.17);
    return (
      <group position={p} rotation={r}>
        <Box s={[w, 0.12, 0.12]} p={[0, h, 0]} m={iron} /><Box s={[w, 0.12, 0.12]} p={[0, 0.08, 0]} m={iron} /><Box s={[w, 0.1, 0.12]} p={[0, h * 0.55, 0]} m={iron} />
        {Array.from({ length: n + 1 }, (_, i) => <Box key={i} s={[0.06, h, 0.07]} p={[-w / 2 + (w * i) / n, h / 2, 0]} m={iron} cast={false} />)}
      </group>
    );
  }
  function StuddedDoor({ p, r }) {
    const M = useM();
    const frame = M.plain('#a35f3a'), leaf = M.plain('#5d4331'), plate = M.plain('#5a4a3a', { roughness: 0.5, metalness: 0.5 });
    return (
      <group position={p} rotation={r} scale={[1.35, 1.33, 1.35]}>
        <Box s={[0.22, 2.1, 0.34]} p={[-0.78, 1.05, 0]} m={frame} /><Box s={[0.22, 2.1, 0.34]} p={[0.78, 1.05, 0]} m={frame} />
        <Box s={[1.78, 0.22, 0.34]} p={[0, 2.0, 0]} m={frame} />
        <Box s={[1.34, 1.9, 0.14]} p={[0, 0.95, -0.02]} m={leaf} />
        {[0.28, 0.75, 1.22, 1.65].flatMap((y, ri) => [-0.4, 0.0, 0.4].map((x, ci) => <Box key={`${ri}-${ci}`} s={[0.26, 0.3, 0.04]} p={[x, y, 0.07]} m={plate} cast={false} />))}
        <mesh position={[0.45, 0.95, 0.1]} material={plate}><torusGeometry args={[0.1, 0.02, 6, 14]} /></mesh>
        <Box s={[1.5, 0.12, 0.5]} p={[0, 2.16, 0.0]} m={M.plain('#6d5a42')} />
        <Ball rad={0.1} p={[0, 2.5, 0.3]} m={M.plain('#ffe2a0', { emissive: '#ffb860', emissiveIntensity: 1.2 })} />
      </group>
    );
  }
  /* small plastered terracotta hut with a low hipped tile roof and eave overhang, on the wall crest at the stair head */
  function GuardHut({ p }) {
    const M = useM();
    const wall = M.plain('#b5714e', { roughness: 0.95 }), patch = M.plain('#a4623f', { roughness: 1 });
    return (
      <group position={p}>
        <Box s={[4.4, 0.5, 2.7]} p={[0, 0.25, 0]} m={stoneMatC('#b6a98e')} />
        <Box s={[4.0, 1.7, 2.5]} p={[0, 1.35, 0]} m={wall} />
        <Box s={[1.1, 0.7, 0.04]} p={[-1.1, 1.0, 1.27]} m={patch} cast={false} /><Box s={[0.8, 0.9, 0.04]} p={[1.2, 1.7, 1.27]} m={patch} cast={false} />
        <Box s={[4.5, 0.1, 3.0]} p={[0, 2.22, 0]} m={M.plain('#6d4a34')} />
        <Roof w={4.5} d={3.0} h={0.5} y={2.27} m={M.plain('#8f5a45', { roughness: 0.9 })} sag={1} lift={0} fascia={false} />
        {/* door on the end facing the stair head, small windows on the front */}
        <Box s={[0.08, 1.6, 0.9]} p={[2.02, 1.3, 0.4]} m={M.plain('#6d4a34')} cast={false} />
        <Box s={[0.6, 0.5, 0.05]} p={[-1.1, 1.5, 1.27]} m={M.plain('#3b2a20')} cast={false} />
        <Box s={[0.42, 0.36, 0.04]} p={[-1.1, 1.5, 1.3]} m={M.plain('#ffcf80', { emissive: '#ffb050', emissiveIntensity: 0.7 })} cast={false} />
      </group>
    );
  }

  /* the hero: 3.8 m wide gentle stripes, red riser + white tread, rises along the front wall to the guard hut */
  const ST = { n: 26, run: 0.8, rise: 0.24, W: 3.8, xFoot: 10.8 };
  function Stair() {
    const M = useM();
    const red = M.plain('#bb3d27', { roughness: 0.85 }), white = M.plain('#f4f2ec', { roughness: 0.9 }), core = stoneMatC('#8d8a78'), green = M.plain('#1f4a3a', { roughness: 0.5, metalness: 0.4 });
    const { n, run, rise, W, xFoot } = ST;
    const steps = [];
    for (let i = 0; i < n; i++) {
      const top = LEDGE + rise * (i + 1), xc = xFoot - i * run - run / 2, zi = wallFaceZ(top) - 0.2, zc = zi + W / 2;
      steps.push({ i, top, xc, zi, zc });
    }
    const first = steps[0], last = steps[n - 1];
    const outer = (s) => s.zi + W + 0.05;
    return (
      <group>
        {steps.map((s) => (
          <group key={s.i}>
            <Box s={[run, s.top - rise - (LEDGE - 0.3), W]} p={[s.xc, (s.top - rise + LEDGE - 0.3) / 2, s.zc]} m={core} cast={false} />
            <Box s={[run, rise - 0.04, W]} p={[s.xc, s.top - 0.04 - (rise - 0.04) / 2, s.zc]} m={red} />
            <Box s={[run * 0.58, 0.05, W]} p={[s.xc - run * 0.21, s.top - 0.025, s.zc]} m={white} cast={false} />
          </group>
        ))}
        {/* low red-white bottom landing */}
        <Box s={[1.4, 0.2, W]} p={[xFoot + 0.7, LEDGE + 0.1, first.zc]} m={white} cast={false} />
        {/* handrail (outer side) */}
        {steps.filter((s) => s.i % 2 === 0).map((s) => <Box key={`p${s.i}`} s={[0.07, 1.0, 0.07]} p={[s.xc, s.top + 0.5, outer(s)]} m={green} cast={false} />)}
        <Rod a={[first.xc + run / 2, first.top + 1.0, outer(first)]} b={[last.xc, last.top + 1.0, outer(last)]} r={0.045} m={green} />
        <Rod a={[first.xc + run / 2, first.top + 0.5, outer(first)]} b={[last.xc, last.top + 0.5, outer(last)]} r={0.035} m={green} />
        {/* inner rail along the wall side */}
        <Rod a={[first.xc + 0.1, first.top + 0.95, first.zi + 0.15]} b={[last.xc, last.top + 0.95, last.zi + 0.15]} r={0.035} m={green} />
        {/* red end posts at the foot */}
        <Box s={[0.4, 0.8, 0.4]} p={[xFoot + 0.3, LEDGE + 0.4, outer(first)]} m={red} />
        <Box s={[0.4, 0.8, 0.4]} p={[xFoot + 0.3, LEDGE + 0.4, first.zi + 0.1]} m={red} />
        {/* fern/shrub in a clay pot at the foot as in the photograph */}
        <Cyl rt={0.3} rb={0.22} h={0.45} p={[xFoot + 1.1, LEDGE + 0.22, first.zi + 0.4]} m={M.plain('#8a5a3a')} seg={8} />
        <Ball rad={0.45} p={[xFoot + 1.1, LEDGE + 0.75, first.zi + 0.4]} m={M.plain('#4e6a35', { roughness: 1 })} />
      </group>
    );
  }

  /* narrow rough-slab stair slot between two mossy flanking walls that grow out of the rampart, blue pipe, dark iron gate (front-right corner) */
  const SLOT_E = 5, SLOT_T = 0.45;
  function SlotStair() {
    const M = useM();
    const n = 14;
    const nrm = EN[SLOT_E], a = P[SLOT_E], b = P[(SLOT_E + 1) % NP];
    const cols = ['#9a9486', '#868074', '#a39c8a', '#8c8878'];
    const blue = M.plain('#3a69a8', { roughness: 0.5, emissive: '#1d3a66', emissiveIntensity: 0.35 });
    const moss = M.plain('#6b7a45', { roughness: 1 });
    const off0 = HT + BAT * YT;
    const base = [a[0] + (b[0] - a[0]) * SLOT_T + nrm[0] * off0, a[1] + (b[1] - a[1]) * SLOT_T + nrm[1] * off0];
    /* flank wall stepped in height: full crest height at the rampart, then dropping down the slope */
    const flank = (sx, c) => [[-1.0, 3.4, 2.6], [2.4, 3.1, 1.2], [5.5, 3.1, -0.7]].map(([z0, len, top], k) => {
      const h = top - (YB - 0.2);
      return <StoneBox key={k} s={[1.5, h, len]} p={[sx * 1.72, YB - 0.2 + h / 2, z0 + len / 2]} color={c} />;
    });
    return (
      <group position={[base[0], 0, base[1]]} rotation={[0, Math.atan2(nrm[0], nrm[1]), 0]}>
        {flank(-1, '#b8c0a0')}{flank(1, '#aeb89a')}
        {/* moss patches on tops and inner faces */}
        {[[-1, 0.8, 1.9], [1, 2.8, 0.5], [-1, 4.2, 0.2], [1, 6.2, -0.5], [-1, 6.5, -0.4]].map(([sx, z, y], i) => <Box key={`m${i}`} s={[0.12, 0.9 + rnd(i) * 0.5, 1.1]} p={[sx * 0.94, y + 0.3, z]} m={moss} cast={false} />)}
        {[[-1, 2.0, 1.28], [1, 4.0, 0.15], [-1, 6.8, -0.62]].map(([sx, z, y], i) => <Box key={`t${i}`} s={[1.1, 0.07, 1.3]} p={[sx * 1.72, y + 0.04, z]} m={moss} cast={false} />)}
        {/* dark recess for the gate, set into the wall */}
        <Box s={[2.0, 2.8, 1.5]} p={[0, 1.2, -0.7]} m={M.plain('#1c1814')} />
        {Array.from({ length: n }, (_, i) => {
          const top = LEDGE + ((0.0 - LEDGE) * (i + 1)) / n, zc = 7.5 - i * 0.5;
          return <Box key={i} s={[1.95 + rnd(i) * 0.06, top - (LEDGE - 0.3), 0.52]} p={[(rnd(i + 3) - 0.5) * 0.06, (top + LEDGE - 0.3) / 2, zc]} r={[0, (rnd(i + 9) - 0.5) * 0.06, 0]} m={M.plain(cols[i % 4], { roughness: 1 })} />;
        })}
        <Rod a={[0.78, -3.6, 7.4]} b={[0.78, 0.7, 0.5]} r={0.12} m={blue} />
        <IronGate p={[0, 0, 0.12]} w={1.95} h={2.4} />
        <Box s={[2.3, 0.35, 0.7]} p={[0, 2.6, 0.2]} m={stoneMatC('#9a9486')} />
        <Ball rad={0.13} p={[0, 3.0, 0.5]} m={M.plain('#ffe2a0', { emissive: '#ffb860', emissiveIntensity: 1.2 })} />
      </group>
    );
  }

  function Statue() {
    const M = useM();
    const white = M.plain('#f3f2ec'), black = M.plain('#141414', { roughness: 0.45 }), teal = M.plain('#3f9a9a', { roughness: 0.55, metalness: 0.3 }), teal2 = M.plain('#2f7f86', { roughness: 0.55, metalness: 0.3 });
    const S = 2.9;
    const posts = useMemo(() => {
      const L = [];
      for (let t = -S; t <= S + 0.01; t += 0.15) {
        L.push(compose([t, 0.75, -S], 0, [0.04, 1.5, 0.04])); L.push(compose([t, 0.75, S], 0, [0.04, 1.5, 0.04])); L.push(compose([-S, 0.75, t], 0, [0.04, 1.5, 0.04]));
        if (Math.abs(t) > 1.1) L.push(compose([S, 0.75, t], 0, [0.04, 1.5, 0.04]));
      }
      for (let t = -1.0; t <= 1.0; t += 0.12) L.push(compose([S, 1.2, t], 0, [0.04, 2.4, 0.04])); // taller gate panel
      return L;
    }, []);
    return (
      <group position={[5, LEDGE, 21.5]} rotation={[0, 0.35, 0]}>
        <Inst geo={unitBox} mat={teal} mats={posts} cast={false} />
        {[0.12, 0.75, 1.45].flatMap((y, i) => [-S, S].map((z, k) => <Box key={`a${i}${k}`} s={[2 * S, 0.06, 0.06]} p={[0, y, z]} m={teal} cast={false} />))}
        {[0.12, 0.75, 1.45].map((y, i) => <Box key={`c${i}`} s={[0.06, 0.06, 2 * S]} p={[-S, y, 0]} m={teal} cast={false} />)}
        {[0.12, 0.75, 1.45].flatMap((y, i) => [[-1, -1.1], [1.1, 1]].map(([a, b], k) => <Box key={`d${i}${k}`} s={[0.06, 0.06, 1.9]} p={[S, y, (a + b) / 2 + (k ? 0.0 : 0)]} m={teal} cast={false} />))}
        <Box s={[0.14, 2.6, 0.14]} p={[S, 1.3, -1.1]} m={teal2} /><Box s={[0.14, 2.6, 0.14]} p={[S, 1.3, 1.1]} m={teal2} /><Box s={[0.1, 0.1, 2.3]} p={[S, 2.45, 0]} m={teal2} />
        {/* plinth 2.6 wide x 2.2 tall */}
        <Box s={[3.6, 0.3, 3.6]} p={[0, 0.15, 0]} m={M.plain('#b7b2a6')} />
        <Box s={[2.6, 2.0, 2.6]} p={[0, 1.3, 0]} m={white} />
        <Box s={[2.9, 0.2, 2.9]} p={[0, 2.4, 0]} m={white} />
        {/* red-and-white nameplate */}
        <Box s={[1.9, 0.9, 0.06]} p={[0, 1.6, 1.33]} m={M.plain('#f8f8f8')} cast={false} />
        <Box s={[1.9, 0.1, 0.08]} p={[0, 2.05, 1.34]} m={M.plain('#c0392b')} cast={false} />
        <Box s={[1.9, 0.1, 0.08]} p={[0, 1.15, 1.34]} m={M.plain('#c0392b')} cast={false} />
        {/* statue about 1.6 m tall: black coat, white belt */}
        <group position={[0, 2.78, 0]} scale={[1.2, 1.2, 1.2]}>
          <Box s={[0.5, 0.75, 0.32]} p={[0, 0.4, 0]} m={black} />
          <Box s={[0.46, 0.5, 0.3]} p={[0, 0.9, 0]} m={black} />
          <Box s={[0.52, 0.07, 0.34]} p={[0, 0.58, 0]} m={white} />
          <Box s={[0.2, 0.5, 0.2]} p={[-0.12, -0.02, 0]} m={black} /><Box s={[0.2, 0.5, 0.2]} p={[0.12, -0.02, 0]} m={black} />
          <Box s={[0.14, 0.55, 0.15]} p={[-0.34, 0.85, 0.02]} r={[0, 0, -0.15]} m={black} /><Box s={[0.14, 0.5, 0.15]} p={[0.34, 0.8, 0.0]} r={[0, 0, 0.3]} m={black} />
          <Box s={[0.18, 0.14, 0.05]} p={[0, 1.0, 0.16]} m={white} cast={false} />
          <Ball rad={0.15} p={[0, 1.28, 0]} m={M.plain('#c9a27e')} />
          <Cyl rt={0.14} rb={0.16} h={0.1} p={[0, 1.42, 0]} m={M.plain('#2b3a2b')} seg={10} />
          <Box s={[0.18, 0.025, 0.04]} p={[0, 1.24, 0.14]} m={black} cast={false} />
        </group>
        {/* small teal-and-white building to the left (photo 5) */}
        <group position={[-7.2, 0, -1.8]}>
          <Box s={[6.0, 2.8, 3.2]} p={[0, 1.4, 0]} m={M.plain('#8fcfc6')} />
          <Box s={[6.5, 0.2, 3.7]} p={[0, 2.9, 0]} m={M.plain('#e9efec')} />
          <Box s={[1.1, 1.9, 0.05]} p={[-1.6, 0.95, 1.62]} m={M.plain('#2d6f6b')} cast={false} />
          <Box s={[1.3, 0.9, 0.05]} p={[1.2, 1.7, 1.62]} m={M.plain('#355a63')} cast={false} />
        </group>
        {/* lamp for dusk */}
        <Cyl rt={0.05} h={3.4} p={[3.6, 1.7, 3.4]} m={M.plain('#2c2c2c')} seg={6} />
        <Ball rad={0.14} p={[3.6, 3.45, 3.4]} m={M.plain('#ffe2a0', { emissive: '#ffb860', emissiveIntensity: 1 })} />
      </group>
    );
  }

  /* inner yard: curved barrack rows hugging the rear wall (timber doors, iron crosses), pipe railing, upper terrace with stair, stone path, outbuildings */
  const BD = 3.0;
  const BAR = [{ x0: -9.6, x1: -1.0, z: -9.3 }, { x0: -1.0, x1: 6.8, z: -9.7 }];
  const PATH = [[13.2, 6.6], [10, 2], [6, -1.5], [0, -3.6], [-6, -3.2], [-11, 0], [-12, 6]];
  function Yard() {
    const M = useM();
    const geo = useMemo(buildYard, []);
    const door = M.plain('#a35f3a'), dark = M.plain('#3a2a20'), iron = M.plain('#151515', { roughness: 0.6 }), green = M.plain('#1f4a3a', { roughness: 0.5, metalness: 0.4 });
    const slabs = useMemo(() => {
      const L = [];
      for (let i = 0; i < PATH.length - 1; i++) {
        const a = PATH[i], b = PATH[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), ang = Math.atan2(b[0] - a[0], b[1] - a[1]);
        const k = Math.round(len / 1.1);
        for (let j = 0; j < k; j++) { const t = (j + 0.5) / k; L.push(compose([a[0] + (b[0] - a[0]) * t + (rnd(i * 9 + j) - 0.5) * 0.3, 0.045, a[1] + (b[1] - a[1]) * t], ang + (rnd(j + i) - 0.5) * 0.3, [1.15 + rnd(j * 3 + i) * 0.4, 0.05, 0.85 + rnd(j + 5 * i) * 0.4])); }
      }
      return L;
    }, []);
    return (
      <group>
        <mesh geometry={geo} position={[0, 0.02, 0]} receiveShadow><meshStandardMaterial color="#86704e" roughness={1} side={THREE.DoubleSide} /></mesh>
        {[[-3, 6, 2.6, '#6f7a42'], [1, 8, 2.2, '#6c7640'], [-10, 2, 2.0, '#74703f'], [-12, -5, 2.4, '#6f7a42'], [8, -7, 1.6, '#74703f']].map(([x, z, r, c], i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.035 + i * 0.002, z]}><circleGeometry args={[r, 12]} /><meshStandardMaterial color={c} roughness={1} /></mesh>
        ))}
        <Inst geo={unitBox} mat={stoneMatC('#b8b4a4')} mats={slabs} cast={false} />
        {/* the barrack rows, hugging the inside of the rear wall */}
        {BAR.map((bk, bi) => {
          const w = bk.x1 - bk.x0, cx = (bk.x0 + bk.x1) / 2, fz = bk.z + BD / 2 + 0.02;
          const nd = Math.floor(w / 3.4);
          return (
            <group key={bi}>
              <StoneBox s={[w, 2.6, BD]} p={[cx, 1.3, bk.z]} color="#c9cbcd" />
              <Box s={[w + 0.8, 0.12, BD + 0.8]} p={[cx, 2.95, bk.z - 0.1]} r={[0.2, 0, 0]} m={M.plain('#4d5250', { roughness: 0.8 })} />
              {Array.from({ length: nd }, (_, k) => {
                const x = bk.x0 + 1.6 + k * 3.4;
                return (
                  <group key={k}>
                    <group position={[x, 0, fz]}>
                      <Box s={[1.5, 2.2, 0.14]} p={[0, 1.1, 0.04]} m={door} cast={false} />
                      <Box s={[1.1, 1.95, 0.08]} p={[0, 1.0, 0.1]} m={dark} cast={false} />
                    </group>
                    <group position={[x + 1.7, 0, fz]}>
                      <Box s={[0.16, 2.4, 0.1]} p={[0, 1.2, 0.04]} m={iron} cast={false} />
                      <Box s={[2.0, 0.16, 0.1]} p={[0, 1.3, 0.04]} m={iron} cast={false} />
                    </group>
                  </group>
                );
              })}
            </group>
          );
        })}
        {/* green pipe railing in front of the barracks */}
        <Rod a={[-9, 0.95, -4.6]} b={[7, 0.95, -4.9]} r={0.045} m={green} />
        <Rod a={[-9, 0.5, -4.6]} b={[7, 0.5, -4.9]} r={0.04} m={green} />
        {Array.from({ length: 7 }, (_, k) => <Box key={`rp${k}`} s={[0.08, 0.95, 0.08]} p={[-9 + (k * 16) / 6, 0.47, -4.6 - (k * 0.3) / 6]} m={green} cast={false} />)}
        {/* second level: raised stone terrace at the rear-right, reached by a small stair (photo 3) */}
        <StoneBox s={[6.4, 1.1, 7.4]} p={[11.2, 0.55, -5.4]} color="#b9b4a2" />
        <Box s={[6.2, 0.06, 7.2]} p={[11.2, 1.12, -5.4]} m={M.plain('#8a7a56', { roughness: 1 })} cast={false} />
        {Array.from({ length: 5 }, (_, i) => <Box key={`s${i}`} s={[0.4, 0.22 * (i + 1), 1.6]} p={[7.6 - i * 0.4 + 1.6 - 0.2, 0.11 * (i + 1), -3.2]} m={stoneMatC('#b9b4a2')} />)}
        {/* small pump house on the terrace and a water tank */}
        <group position={[12.4, 1.1, -7.2]}>
          <Box s={[2.6, 2.0, 2.2]} p={[0, 1.0, 0]} m={M.plain('#c8bba0', { roughness: 0.95 })} />
          <Box s={[3.0, 0.1, 2.0]} p={[0, 2.35, 0.55]} r={[0.35, 0, 0]} m={M.plain('#6a7a7c', { roughness: 0.7, metalness: 0.3 })} />
          <Box s={[3.0, 0.1, 2.0]} p={[0, 2.35, -0.55]} r={[-0.35, 0, 0]} m={M.plain('#6a7a7c', { roughness: 0.7, metalness: 0.3 })} />
          <Box s={[0.7, 1.5, 0.05]} p={[0, 0.75, 1.12]} m={M.plain('#6d4a34')} cast={false} />
        </group>
        <Cyl rt={0.75} rb={0.75} h={1.4} p={[8.8, 1.8, -8.0]} m={M.plain('#3f6b8f', { roughness: 0.5, metalness: 0.3 })} seg={10} />
        {/* outbuildings: stone store with a tin roof, small timber shed, later army armoury / library block */}
        <group position={[-9.8, 0, 4.2]} rotation={[0, 0.25, 0]}>
          <StoneBox s={[3.0, 2.3, 2.4]} p={[0, 1.15, 0]} color="#c3c5c0" />
          <Box s={[3.5, 0.1, 1.7]} p={[0, 2.55, 0.5]} r={[0.3, 0, 0]} m={M.plain('#8a5a45', { roughness: 0.7, metalness: 0.3 })} />
          <Box s={[3.5, 0.1, 1.7]} p={[0, 2.55, -0.5]} r={[-0.3, 0, 0]} m={M.plain('#8a5a45', { roughness: 0.7, metalness: 0.3 })} />
          <Box s={[0.9, 1.7, 0.05]} p={[0, 0.85, 1.22]} m={M.plain('#a35f3a')} cast={false} />
        </group>
        <group position={[-3.5, 0, 1.0]} rotation={[0, -0.2, 0]}>
          <Box s={[2.2, 1.9, 1.9]} p={[0, 0.95, 0]} m={M.plain('#9b6a45', { roughness: 1 })} />
          <Box s={[2.6, 0.1, 1.2]} p={[0, 2.2, 0.4]} r={[0.3, 0, 0]} m={M.plain('#5f6a6a', { roughness: 0.7, metalness: 0.3 })} />
          <Box s={[2.6, 0.1, 1.2]} p={[0, 2.2, -0.4]} r={[-0.3, 0, 0]} m={M.plain('#5f6a6a', { roughness: 0.7, metalness: 0.3 })} />
        </group>
        <group position={[6.2, 0, 3.6]} rotation={[0, 0.08, 0]}>
          <Box s={[6.0, 2.6, 3.4]} p={[0, 1.3, 0]} m={M.plain('#d3c7ae', { roughness: 0.95 })} />
          <Box s={[6.8, 0.1, 2.4]} p={[0, 3.0, 0.95]} r={[0.32, 0, 0]} m={M.plain('#6d7270', { roughness: 0.7, metalness: 0.3 })} />
          <Box s={[6.8, 0.1, 2.4]} p={[0, 3.0, -0.95]} r={[-0.32, 0, 0]} m={M.plain('#6d7270', { roughness: 0.7, metalness: 0.3 })} />
          {[-1.8, 0.2].map((x, i) => <Box key={i} s={[0.8, 1.2, 0.05]} p={[x, 1.5, 1.72]} m={M.plain('#3b4a52')} cast={false} />)}
          <Box s={[0.9, 1.9, 0.05]} p={[2.1, 0.95, 1.72]} m={M.plain('#6d4a34')} cast={false} />
        </group>
        <Tree p={[-12.5, 0, -3]} s={1.5} kind="broad" />
        <Tree p={[11, 0, 5]} s={1.1} kind="pine" />
      </group>
    );
  }

  /* ---------------- Main ---------------- */
  function AmargadhiMain() {
    const M = useM();
    const wallGeo = useMemo(buildWallRing, []);
    const terrGeo = useMemo(buildTerrain, []);
    return (
      <group>
        <mesh geometry={terrGeo} receiveShadow><meshStandardMaterial vertexColors roughness={1} /></mesh>
        <mesh geometry={wallGeo} material={stoneMatVC()} castShadow receiveShadow />
        <Yard />
        <Stair />
        {/* studded door in a flat stone porch at the foot of the wall, left of the stair head */}
        <StoneBox s={[3.2, 4.1, 1.9]} p={[-12.4, LEDGE + 2.0, wallFaceZ(LEDGE) + 0.3]} color="#9d9a88" />
        <StuddedDoor p={[-12.4, LEDGE, wallFaceZ(LEDGE) + 1.3]} />
        <GuardHut p={[-11.9, YT, 10.5]} />
        <SlotStair />
        <Statue />
        {/* shrubs at the wall foot */}
        {[[-4, 14.7], [-13, 11.8], [-15, 4]].map(([x, z], i) => <Ball key={i} rad={0.8 + rnd(i) * 0.3} p={[x, LEDGE + 0.45, z]} sc={[1.2, 0.8, 1.1]} m={M.plain('#4e6a35', { roughness: 1 })} />)}
        <Frame s={[30, 10, 24]} p={[1, 0.2, 12]} />
      </group>
    );
  }

  /* ---------------- Env ---------------- */
  function ridge(R, base, amp, seed, c1, c2) {
    const N = 140, pos = [], col = [], idx = [];
    const a1 = new THREE.Color(c1), a2 = new THREE.Color(c2);
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      const h = base + amp * (Math.sin(a * 3 + seed) * 0.5 + Math.sin(a * 7 + seed * 2) * 0.3 + Math.sin(a * 13 + seed * 3.1) * 0.15 + 0.6);
      pos.push(Math.cos(a) * R, h, Math.sin(a) * R, Math.cos(a) * R, -40, Math.sin(a) * R);
      col.push(a1.r, a1.g, a1.b, a2.r, a2.g, a2.b);
    }
    for (let i = 0; i < N; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  }

  function AmargadhiEnv() {
    const M = useM();
    const ridges = useMemo(() => [ridge(78, -3, 14, 1.0, '#5f7a72', '#9fb2b6'), ridge(96, 3, 16, 2.7, '#7f969c', '#b4c4cc'), ridge(118, 8, 20, 4.1, '#9db0ba', '#cfdae2')], []);
    const trees = useMemo(() => {
      const pine = [], broad = [];
      for (let k = 0; k < 900 && pine.length < 210; k++) {
        const x = -54 + rnd(k * 3.3 + 1) * 108, z = -48 + rnd(k * 5.1 + 2) * 100;
        const { y, d, w, t } = terr(x, z);
        if (d < 2.2 || t > 0.75) continue;
        if (d < w + 1.5 && x > -2 && z > 12) continue; // keep the front terrace and the camera side clear
        if (x > -4 && z > 12 && y > -22) continue;
        if (d < w + 0.5 && !(z < -4 || x < -17)) continue;
        const s = 1.6 + rnd(k * 7.7) * 1.5;
        if (rnd(k * 2.2) > 0.2) pine.push({ x, y, z, s, r: rnd(k) * 6 }); else broad.push({ x, y, z, s: s * 0.8, r: 0 });
      }
      return { pine, broad };
    }, []);
    /* compact Khalanga bazaar strip at the foot of the cliff: two rows either side of the road, tin and flat roofs */
    const houses = useMemo(() => {
      const hs = [];
      [[39.5, 0], [47, 1]].forEach(([z0, row]) => {
        let x = -32;
        let k = row * 40;
        while (x < 32) {
          const sx = 3.6 + rnd(k + 1) * 2.4, sz = 4 + rnd(k + 7) * 1.6, hh = 3.2 + rnd(k + 9) * 3.2;
          hs.push({ x: x + sx / 2, y: FLOOR, z: z0 + (rnd(k + 3) - 0.5) * 0.8, sx, sz, hh, rot: 0, flat: rnd(k + 5) > 0.4, wc: ['#d6c7a8', '#b8a58a', '#a9b8ac', '#c9a98a', '#9fb0bd', '#c4977a'][k % 6], rc: ['#6c7a80', '#8f4a3a', '#7d8286', '#3f6280', '#9a9a90'][k % 5] });
          x += sx + 0.35 + rnd(k + 11) * 0.8; k++;
        }
      });
      return hs;
    }, []);
    const hm = useMemo(() => ({
      body: houses.map((h) => compose([h.x, h.y + h.hh / 2, h.z], h.rot, [h.sx, h.hh, h.sz])),
      roof: houses.map((h) => compose([h.x, h.y + h.hh + (h.flat ? 0.1 : 0.35), h.z], h.rot, [h.sx + 0.3, h.flat ? 0.2 : 0.7, h.sz + 0.3])),
      win: houses.map((h) => compose([h.x, h.y + h.hh * 0.55, h.z - h.sz * 0.5 - 0.02], h.rot, [h.sx * 0.5, 0.7, 0.05])),
    }), [houses]);
    const pm = useMemo(() => ({
      trunk: trees.pine.map((t) => compose([t.x, t.y + 0.7 * t.s, t.z], 0, [0.1 * t.s, 1.4 * t.s, 0.1 * t.s])),
      c1: trees.pine.map((t) => compose([t.x, t.y + 1.6 * t.s, t.z], t.r, [0.95 * t.s, 1.5 * t.s, 0.95 * t.s])),
      c2: trees.pine.map((t) => compose([t.x, t.y + 2.4 * t.s, t.z], t.r, [0.72 * t.s, 1.4 * t.s, 0.72 * t.s])),
      c3: trees.pine.map((t) => compose([t.x, t.y + 3.1 * t.s, t.z], t.r, [0.45 * t.s, 1.2 * t.s, 0.45 * t.s])),
      btrunk: trees.broad.map((t) => compose([t.x, t.y + 0.8 * t.s, t.z], 0, [0.14 * t.s, 1.6 * t.s, 0.14 * t.s])),
      bcan: trees.broad.map((t) => compose([t.x, t.y + 2.3 * t.s, t.z], 0, [1.2 * t.s, 0.95 * t.s, 1.2 * t.s])),
    }), [trees]);
    const leaf = M.plain('#2f4c30', { roughness: 1 }), leaf2 = M.plain('#3a5732', { roughness: 1 }), bark = M.plain('#4a3626'), leafB = M.plain('#56743a', { roughness: 1 });
    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR - 0.25, 0]} receiveShadow><circleGeometry args={[130, 48]} /><meshStandardMaterial color="#66773f" roughness={1} /></mesh>
        {ridges.map((g, i) => <mesh key={i} geometry={g}><meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={1} emissive={['#26383a', '#38484e', '#566a76'][i]} emissiveIntensity={0.6} /></mesh>)}
        {/* cool grey-blue mist layers hugging the valley and cliff foot */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -24, 0]}><circleGeometry args={[100, 40]} /><meshBasicMaterial color="#b4c4d0" transparent opacity={0.08} depthWrite={false} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -14, 0]}><circleGeometry args={[110, 40]} /><meshBasicMaterial color="#c3d0da" transparent opacity={0.05} depthWrite={false} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -7, 0]}><circleGeometry args={[120, 40]} /><meshBasicMaterial color="#d2dce4" transparent opacity={0.03} depthWrite={false} /></mesh>
        <Inst geo={unitCyl} mat={bark} mats={pm.trunk} />
        <Inst geo={unitCone} mat={leaf} mats={pm.c1} />
        <Inst geo={unitCone} mat={leaf2} mats={pm.c2} />
        <Inst geo={unitCone} mat={leaf} mats={pm.c3} />
        <Inst geo={unitCyl} mat={bark} mats={pm.btrunk} />
        <Inst geo={unitBall} mat={leafB} mats={pm.bcan} />
        {/* Khalanga bazaar strip */}
        <Inst geo={unitBox} mat={M.plain('#ffffff', { roughness: 0.95 })} mats={hm.body} colors={houses.map((h) => h.wc)} />
        <Inst geo={unitBox} mat={M.plain('#ffffff', { roughness: 0.6, metalness: 0.25 })} mats={hm.roof} colors={houses.map((h) => h.rc)} />
        <Inst geo={unitBox} mat={M.plain('#ffd48a', { emissive: '#ffb860', emissiveIntensity: 0.9 })} mats={hm.win} cast={false} />
        {/* bazaar road between the two rows, and the Mahakali highway ribbon */}
        <Box s={[70, 0.1, 3.2]} p={[0, FLOOR + 0.1, 43.3]} m={M.plain('#5c5b57')} cast={false} />
        {Array.from({ length: 9 }, (_, i) => <Box key={i} s={[16, 0.12, 1.8]} p={[-60 + i * 15, FLOOR + 0.1, 60 + Math.sin(i * 0.7) * 6]} r={[0, Math.cos(i * 0.7) * 0.3, 0]} m={M.plain('#5c5b57')} cast={false} />)}
      </group>
    );
  }

  return { 'amargadhi-fort': { Main: AmargadhiMain, Env: AmargadhiEnv } };
}
