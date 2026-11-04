/* Galeshwor Dham, Beni (Myagdi), Gandaki: small two-roof Shiva pagoda (wide rust-red metal roofs, yellow bands, gold gajur) standing on a huge
   bare grey layered rock slab where the Rahughat joins the grey Kali Gandaki in a steep forested gorge. Second, colourful South-Indian-style shrine
   on the same rock, narrow Vishnu pool, riverside stair with white parapet, swastika brick plaza on the town side.
   Counts/proportions are estimates from 7 photographs; compass bearings are not documented. Front = +z. */
export default function make(K) {
  const { useM, Box, Cyl, Ball, Gajur, Diyo, Frame, Tree, THREE, useMemo } = K;

  const rn = (i) => { const v = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return v - Math.floor(v); };
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const mix = (a, b, t) => a + (b - a) * t;

  /* ------------------------------------------------------------------ terrain height field */
  const BED = -6.4;
  const WATER_Y = -6;
  const PLAIN = -0.8;
  const XC = (z) => 15.6 + 2.5 * Math.sin(z * 0.07 + 0.5);   // Kali Gandaki centre line
  const ZR = (x) => -15.5 + 0.8 * Math.sin(x * 0.1);            // Rahughat centre line
  const W_MAIN = 8;
  const W_RAH = 5.5;

  function terrain(x, z) {
    const xr = XC(z);
    const nz = Math.sin(x * 0.21 + z * 0.13) * 0.6 + Math.sin(x * 0.07 - z * 0.19 + 1) * 1.2 + Math.sin(x * 0.5 + z * 0.4) * 0.25;
    let raw = 1.1 * Math.max(0, x - xr - 6) + 1.1 * Math.max(0, -z - 17) + 0.8 * Math.max(0, -x - 33) + 0.9 * Math.max(0, z - 48) + 0.6 * Math.max(0, z - 30);
    raw = 55 * Math.tanh(raw / 55);
    const r2 = raw + nz * 1.6;
    let h = PLAIN + raw + nz * Math.min(1, raw / 7) * 1.4 + 10 * sm(24.3, 24.75, r2);
    const cliff = sm(24.15, 24.35, r2) * (1 - sm(24.75, 24.95, r2));
    // terraced paddy on the far (upstream) right bank
    const pad = sm(xr + 7, xr + 9, x) * (1 - sm(xr + 22, xr + 30, x)) * sm(-46, -40, z) * (1 - sm(-12, -7, z)) * (1 - sm(7, 13, h));
    if (pad > 0) h = mix(h, Math.round(h / 0.8) * 0.8, pad * 0.9);
    // river channels
    const dM = Math.abs(x - xr);
    const cM = sm(W_MAIN, W_MAIN + 1.3, dM);
    if (cM < 1) h = BED + (h - BED) * cM;
    const dR = Math.abs(z - ZR(x));
    const sR = sm(-44, -34, x) * (1 - sm(xr + 4, xr + 6, x));
    const cR = 1 - sR * (1 - sm(W_RAH, W_RAH + 1.3, dR));
    if (cR < 1) h = BED + (h - BED) * cR;
    return { h, raw, cliff, pad, dM, dR };
  }

  function TerrainMesh() {
    const geo = useMemo(() => {
      const S = 200, N = 200;
      const g0 = new THREE.PlaneGeometry(S, S, N, N);
      g0.rotateX(-Math.PI / 2);
      const p0 = g0.attributes.position;
      for (let i = 0; i < p0.count; i += 1) p0.setY(i, terrain(p0.getX(i), p0.getZ(i)).h);
      g0.computeVertexNormals();
      const g = g0.toNonIndexed();
      g0.dispose();
      const p = g.attributes.position;
      const col = new Float32Array(p.count * 3);
      const c = new THREE.Color();
      const cc = new THREE.Color();
      const forest = ['#355f2e', '#2c5629', '#426f35', '#4c7b3b'];
      for (let i = 0; i < p.count; i += 3) {
        const x = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3, z = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3;
        const yv = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3;
        const t = terrain(x, z);
        const n = rn(Math.floor(x * 0.7) * 131 + Math.floor(z * 0.7) * 17);
        const n2 = 0.5 + 0.5 * Math.sin(x * 0.35 + z * 0.22) * Math.sin(z * 0.3 - x * 0.12);
        const steep = Math.max(Math.abs(p.getY(i) - p.getY(i + 1)), Math.abs(p.getY(i) - p.getY(i + 2)), Math.abs(p.getY(i + 1) - p.getY(i + 2)));
        if (t.h < WATER_Y + 0.9) c.set('#6d6b61');
        else if (t.cliff > 0.3 && (z < -10 || x > 8)) { c.set(n > 0.6 ? '#8f8a74' : '#b9b49c'); if (n < 0.15) c.set('#8a8068'); }
        else if (t.pad > 0.35 && t.h < 12) c.set(n > 0.5 ? '#86c451' : '#72b047');
        else if (t.raw > 2.2) { c.set(forest[Math.floor(n * 4) % 4]); if (t.raw > 40) c.lerp(cc.set('#6d8f66'), 0.35); }
        else if (t.dM < W_MAIN + 3.2 || t.dR < W_RAH + 2.8) c.set(n > 0.45 ? '#74766b' : '#656a5d');
        else { const n3 = rn(Math.floor(x * 0.25) * 57 + Math.floor(z * 0.25) * 91); c.set(n3 > 0.78 ? '#5f7f45' : n3 > 0.55 ? '#7d8a62' : n3 > 0.3 ? '#8f8c7c' : n3 > 0.12 ? '#6f7466' : '#a09a86'); if (n2 > 0.8) c.lerp(cc.set('#5c8040'), 0.4); }
        for (let k = 0; k < 3; k += 1) { col[(i + k) * 3] = c.r; col[(i + k) * 3 + 1] = c.g; col[(i + k) * 3 + 2] = c.b; }
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      // smooth normals kept
      return g;
    }, []);
    return <mesh geometry={geo} receiveShadow><meshStandardMaterial vertexColors roughness={1} /></mesh>;
  }

  /* ------------------------------------------------------------------ small helpers */
  function Inst({ geo, mat, items, cast = false }) {
    const ref = (mesh) => {
      if (!mesh || mesh.userData.done) return;
      const o = new THREE.Object3D();
      const c = new THREE.Color();
      items.forEach((it, i) => {
        o.position.set(it.p[0], it.p[1], it.p[2]);
        o.rotation.set(0, it.ry || 0, 0);
        if (Array.isArray(it.s)) o.scale.set(it.s[0], it.s[1], it.s[2]); else o.scale.setScalar(it.s == null ? 1 : it.s);
        o.updateMatrix();
        mesh.setMatrixAt(i, o.matrix);
        if (it.c) { c.set(it.c); mesh.setColorAt(i, c); }
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.userData.done = true;
    };
    return <instancedMesh ref={ref} args={[geo, mat, items.length]} castShadow={cast} receiveShadow frustumCulled={false} />;
  }

  /** Hipped roof (ridge length rl; rl = 0 gives a square pyramid). Eave at y = 0. UV runs along the slope so sheet ribs run downhill. */
  function hipGeo(w, d, h, rl = 0) {
    const a = w / 2, b = d / 2, r = Math.min(rl, w - 0.02) / 2;
    const A0 = [-a, 0, b], A1 = [a, 0, b], A2 = [a, 0, -b], A3 = [-a, 0, -b], R0 = [-r, h, 0], R1 = [r, h, 0];
    const pos = [], uv = [];
    const T = (p, q, s, u) => { pos.push(...p, ...q, ...s); uv.push(...u); };
    const sl = Math.hypot(b, h) / 2.2, sl2 = Math.hypot(a - r, h) / 2.2, k = 1 / 2.2;
    T(A0, A1, R1, [-a * k, 0, a * k, 0, r * k, sl]); T(A0, R1, R0, [-a * k, 0, r * k, sl, -r * k, sl]);
    T(A2, A3, R0, [a * k, 0, -a * k, 0, -r * k, sl]); T(A2, R0, R1, [a * k, 0, -r * k, sl, r * k, sl]);
    T(A3, A0, R0, [-b * k, 0, b * k, 0, 0, sl2]);
    T(A1, A2, R1, [b * k, 0, -b * k, 0, 0, sl2]);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    return g;
  }

  /** Corrugated rust-red metal-sheet material with ribs. */
  function useRoofMat(base = '#b8402e', rib = '#7c261b', hi = '#d9604a') {
    return useMemo(() => {
      const cv = document.createElement('canvas');
      cv.width = 64; cv.height = 64;
      const g = cv.getContext('2d');
      g.fillStyle = base; g.fillRect(0, 0, 64, 64);
      for (let i = 0; i < 8; i += 1) { g.fillStyle = rib; g.fillRect(i * 8, 0, 2, 64); g.fillStyle = hi; g.fillRect(i * 8 + 2, 0, 1, 64); }
      const t = new THREE.CanvasTexture(cv);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.colorSpace = THREE.SRGBColorSpace;
      return new THREE.MeshStandardMaterial({ map: t, roughness: 0.55, metalness: 0.2, side: THREE.DoubleSide });
    }, [base, rib, hi]);
  }

  function HipRoof({ w, d, h, rl = 0, y = 0, p = [0, 0, 0], m }) {
    const geo = useMemo(() => hipGeo(w, d, h, rl), [w, d, h, rl]);
    return <mesh geometry={geo} material={m} position={[p[0], y + p[1], p[2]]} castShadow receiveShadow />;
  }

  /** Four fascia / beam strips round a w x d rectangle. */
  function Ring({ w, d, y, h, t, m, cast = false }) {
    return (
      <group position={[0, y, 0]}>
        <Box s={[w, h, t]} p={[0, 0, d / 2]} m={m} cast={cast} />
        <Box s={[w, h, t]} p={[0, 0, -d / 2]} m={m} cast={cast} />
        <Box s={[t, h, d]} p={[w / 2, 0, 0]} m={m} cast={cast} />
        <Box s={[t, h, d]} p={[-w / 2, 0, 0]} m={m} cast={cast} />
      </group>
    );
  }

  /* ------------------------------------------------------------------ the rock slab */
  const ROCK_CTRL = [[4, 4.2], [7, 3.0], [9.6, 1.0], [10.4, -2], [9.8, -5.5], [10.2, -8.5], [8.5, -10.8], [4, -11.5], [-1, -10.5], [-6, -11.2],
    [-13, -10.5], [-20, -8.5], [-21, -3.5], [-19, -1], [-12, 0.8], [-6, 3.8], [-1, 4.6]];
  const ROCK_C = [-5, -3.5];
  const ROCK_N = 9;
  const ROCK_T = -BED / ROCK_N;
  const POOL_X = (z) => 5.0 + 0.35 * Math.sin((z + 5.4) * 0.9);
  const ROCK_COLS = ['#7a7873', '#8c8a85', '#807e78', '#9a968c', '#85837d', '#8f8c84', '#7c7b77', '#928f87', '#999690'];

  function rockOutline(i) {
    const pts = ROCK_CTRL.map(([x, z], k) => {
      const f = (ROCK_N - 1 - i) * 0.003 + (rn(i * 31 + k) - 0.5) * (i >= ROCK_N - 2 ? 0.05 : 0.06) - (i === ROCK_N - 1 ? 0.01 : 0);
      return new THREE.Vector3(ROCK_C[0] + (x - ROCK_C[0]) * (1 + f), 0, ROCK_C[1] + (z - ROCK_C[1]) * (1 + f));
    });
    return new THREE.CatmullRomCurve3(pts, true).getPoints(72).slice(0, -1).map((q) => {
      const th = Math.atan2(q.z - ROCK_C[1], q.x - ROCK_C[0]);
      const f = 1 + (0.03 * Math.sin(7 * th + i) + 0.03 * Math.sin(13 * th + 2 * i) + 0.035 * Math.sin(29 * th + 3 * i) + 0.02 * Math.sin(41 * th + i)) * (i >= ROCK_N - 3 ? 1.3 : 1);
      return new THREE.Vector3(ROCK_C[0] + (q.x - ROCK_C[0]) * f, 0, ROCK_C[1] + (q.z - ROCK_C[1]) * f);
    });
  }
  function poolPoly() {
    const L = [], R = [];
    for (let k = 0; k <= 10; k += 1) {
      const z = -7.9 + k * 0.5;
      const e = k === 0 || k === 10 ? 0.4 : 1;
      L.push([POOL_X(z) - 0.62 * e, z]);
      R.push([POOL_X(z) + 0.66 * e, z]);
    }
    return L.concat(R.reverse());
  }

  function useStrataTex() {
    return useMemo(() => {
      const cv = document.createElement('canvas');
      cv.width = 256; cv.height = 128;
      const g = cv.getContext('2d');
      g.fillStyle = '#c9c8c2'; g.fillRect(0, 0, 256, 128);
      const pal = ['#a9a8a2', '#e4e3dd', '#828384', '#b0b3b4', '#d2d3d0', '#9c9a94', '#f0efea'];
      for (let i = 0; i < 46; i += 1) {
        g.strokeStyle = pal[i % 7]; g.lineWidth = 1.5 + rn(i + 700) * 6;
        const y0 = rn(i + 800) * 150 - 10, ph = rn(i + 900) * 6, sl = (rn(i + 950) - 0.4) * 0.16;
        g.beginPath();
        for (let x = 0; x <= 256; x += 8) { const yy = y0 + x * sl + Math.sin(x * 0.045 + ph) * 3 + Math.sin(x * 0.13 + ph * 2) * 1.2; if (x === 0) g.moveTo(x, yy); else g.lineTo(x, yy); }
        g.stroke();
        if (i % 3 === 0) { g.strokeStyle = 'rgba(30,28,26,0.6)'; g.lineWidth = 1.5; g.stroke(); }
      }
      for (let i = 0; i < 40; i += 1) { g.fillStyle = `rgba(${rn(i) > 0.5 ? '70,64,54' : '240,236,226'},0.10)`; g.beginPath(); g.ellipse(rn(i + 1000) * 256, rn(i + 2000) * 128, 6 + rn(i + 5) * 20, 3 + rn(i + 6) * 8, 0, 0, 6.3); g.fill(); }
      const t = new THREE.CanvasTexture(cv);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(0.09, 0.09);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      return t;
    }, []);
  }

  function RockSlab() {
    const M = useM();
    const tex = useStrataTex();
    const mats = useMemo(() => ROCK_COLS.map((c) => new THREE.MeshStandardMaterial({ map: tex, color: c, roughness: 1 })), [tex]);
    const geos = useMemo(() => {
      const out = [];
      for (let i = 0; i < ROCK_N; i += 1) {
        const pts = rockOutline(i);
        const sh = new THREE.Shape(pts.map((p) => new THREE.Vector2(p.x, -p.z)));
        if (i >= ROCK_N - 1) {
          const hole = new THREE.Path();
          poolPoly().forEach(([x, z], k) => (k === 0 ? hole.moveTo(x, -z) : hole.lineTo(x, -z)));
          sh.holes.push(hole);
        }
        const g = new THREE.ExtrudeGeometry(sh, { depth: ROCK_T, bevelEnabled: false, curveSegments: 1 });
        g.rotateX(-Math.PI / 2);
        g.translate(0, BED + i * ROCK_T, 0);
        out.push(g);
      }
      return out;
    }, []);
    const lumps = useMemo(() => {
      const base = rockOutline(ROCK_N - 1);
      const out = [];
      for (let k = 0; k < 20; k += 1) {
        const q = base[Math.floor(rn(k + 300) * base.length)];
        const dx = ROCK_C[0] - q.x, dz = ROCK_C[1] - q.z, L = Math.hypot(dx, dz);
        const inset = 0.5 + rn(k + 9) * 1.2;
        out.push({ p: [q.x + (dx / L) * inset, 0.05 + rn(k + 5) * 0.12, q.z + (dz / L) * inset], s: [0.7 + rn(k + 1) * 1.1, 0.14 + rn(k + 2) * 0.16, 0.4 + rn(k + 3) * 0.7], r: [(rn(k + 4) - 0.5) * 0.28, rn(k + 6) * 3.1, (rn(k + 7) - 0.5) * 0.32], ci: k % 9 });
      }
      return out;
    }, []);
    return (
      <group>
        {geos.map((g, i) => <mesh key={i} geometry={g} material={mats[i % mats.length]} castShadow receiveShadow />)}
        {lumps.map((l, i) => <Box key={`l${i}`} s={l.s} p={[l.p[0], l.p[1] + 0.06, l.p[2]]} r={l.r} m={mats[l.ci]} />)}
      </group>
    );
  }

  /* ------------------------------------------------------------------ the pagoda */
  function Pagoda() {
    const M = useM();
    const roof = useRoofMat();
    const yellow = M.plain('#ecc424', { roughness: 0.6 });
    const white = M.plain('#eeece6', { roughness: 0.85 });
    const wall = M.mat('brick', 3, 1, { color: '#e8b9a2', roughness: 0.95 });
    const wallUp = M.plain('#e8cdb4', { roughness: 0.9 });
    const brown = M.plain('#5b3a22', { roughness: 0.8 });
    const dark = M.plain('#2a1b12', { roughness: 0.9 });
    const orange = M.plain('#d8431f', { roughness: 0.7 });
    const glow = <meshBasicMaterial color="#ffc873" toneMapped={false} />;
    const P0 = 0.3;
    const WH = 0.95;
    const ww = 2.8;
    const wy = P0 + WH / 2;
    const yb = P0 + WH + 0.07;       // yellow beam under the lower eave
    const rY = P0 + WH + 0.1;        // lower eave level
    const RH = 0.95;
    const fz = rY + RH + 0.02;       // base of the upper storey frieze
    const FH = 0.36;                 // frieze height
    const uw = 1.34;
    const swag = (key, face) => {
      const pts = [[-0.42, 0.06, 0.28], [-0.14, -0.02, -0.2], [0.14, -0.02, 0.2], [0.42, 0.06, -0.28]];
      return pts.map(([x, dy, rz], k) => {
        const pos = face === 0 ? [x, fz + FH * 0.5 + dy, uw / 2 + 0.035] : face === 1 ? [uw / 2 + 0.035, fz + FH * 0.5 + dy, x] : face === 2 ? [-x, fz + FH * 0.5 + dy, -uw / 2 - 0.035] : [-uw / 2 - 0.035, fz + FH * 0.5 + dy, -x];
        const sz = face % 2 === 0 ? [0.3, 0.07, 0.03] : [0.03, 0.07, 0.3];
        const rot = face % 2 === 0 ? [0, 0, rz] : [rz, 0, 0];
        return <Box key={key + k} s={sz} p={pos} r={rot} m={yellow} cast={false} />;
      });
    };
    return (
      <group>
        {/* white plinth with two low steps at the front */}
        <Box s={[5.4, 0.3, 5.0]} p={[0, 0.15, 0]} m={white} />
        <Box s={[3.0, 0.15, 0.5]} p={[0, 0.075, 2.75]} m={white} />
        <Box s={[2.5, 0.08, 0.4]} p={[0, 0.34, 2.75]} m={white} cast={false} />
        {/* ground storey: pink-brown stone/brick, about a quarter of the height */}
        <Box s={[ww, WH, ww]} p={[0, wy, 0]} m={wall} />
        <Box s={[ww + 0.04, 0.08, ww + 0.04]} p={[0, P0 + 0.04, 0]} m={M.plain('#8a6a58')} cast={false} />
        {/* front door, windows, notice board */}
        <Box s={[0.7, 0.78, 0.06]} p={[0, P0 + 0.42, ww / 2 + 0.01]} m={dark} cast={false} />
        <Box s={[0.58, 0.7, 0.07]} p={[0, P0 + 0.39, ww / 2 + 0.02]} m={brown} cast={false} />
        <Box s={[0.46, 0.46, 0.06]} p={[0.95, P0 + 0.55, ww / 2 + 0.01]} m={brown} cast={false} />
        <Box s={[0.38, 0.36, 0.07]} p={[0.95, P0 + 0.55, ww / 2 + 0.02]} m={dark} cast={false} />
        <Box s={[0.5, 0.42, 0.05]} p={[-0.95, P0 + 0.55, ww / 2 + 0.01]} m={M.plain('#f1efe6')} cast={false} />
        <Box s={[0.06, 0.46, 0.46]} p={[ww / 2 + 0.01, P0 + 0.55, 0.2]} m={brown} cast={false} />
        <Box s={[0.07, 0.36, 0.38]} p={[ww / 2 + 0.02, P0 + 0.55, 0.2]} m={dark} cast={false} />
        <Box s={[0.06, 0.46, 0.46]} p={[-ww / 2 - 0.01, P0 + 0.55, -0.2]} m={brown} cast={false} />
        <Box s={[0.07, 0.36, 0.38]} p={[-ww / 2 - 0.02, P0 + 0.55, -0.2]} m={dark} cast={false} />
        <Box s={[0.46, 0.46, 0.06]} p={[0.3, P0 + 0.55, -ww / 2 - 0.01]} m={brown} cast={false} />
        {/* bright yellow beam band under the lower eave */}
        <Box s={[ww + 0.26, 0.2, ww + 0.26]} p={[0, yb - 0.01, 0]} m={yellow} />
        {/* lower roof: wide, low pitch, hipped, plain eaves */}
        <HipRoof w={4.4} d={4.4} h={RH} y={rY} m={roof} />
        <Ring w={4.42} d={4.42} y={rY + 0.02} h={0.15} t={0.07} m={yellow} />
        {/* narrow upper storey: cream wall, bold red-orange frieze with yellow swags on all four faces */}
        <Box s={[uw, 1.1, uw]} p={[0, fz + 0.46, 0]} m={wallUp} />
        <Box s={[uw + 0.06, FH, uw + 0.06]} p={[0, fz + FH / 2, 0]} m={orange} />
        {[0, 1, 2, 3].map((fc) => <group key={'sw' + fc}>{swag('s' + fc, fc)}</group>)}
        <Box s={[0.26, 0.22, 0.05]} p={[0, fz + FH + 0.22, uw / 2 + 0.01]} m={dark} cast={false} />
        <Box s={[0.05, 0.22, 0.26]} p={[uw / 2 + 0.01, fz + FH + 0.22, 0]} m={dark} cast={false} />
        <Box s={[0.05, 0.22, 0.26]} p={[-uw / 2 - 0.01, fz + FH + 0.22, 0]} m={dark} cast={false} />
        <Box s={[0.26, 0.22, 0.05]} p={[0, fz + FH + 0.22, -uw / 2 - 0.01]} m={dark} cast={false} />
        {/* yellow band under the upper eave */}
        <Box s={[uw + 0.34, 0.19, uw + 0.34]} p={[0, fz + FH + 0.5, 0]} m={yellow} />
        {/* upper roof: smaller and steeper */}
        <HipRoof w={2.3} d={2.3} h={0.8} y={fz + FH + 0.55} m={roof} />
        <Ring w={2.32} d={2.32} y={fz + FH + 0.57} h={0.1} t={0.06} m={yellow} />
        <Gajur y={fz + FH + 0.55 + 0.8} s={1.3} />
        {/* warm light at the door for dusk */}
        <mesh position={[0, P0 + 0.4, ww / 2 + 0.06]}><planeGeometry args={[0.44, 0.6]} />{glow}</mesh>
        <Diyo p={[-0.5, 0.35, 3.0]} />
        <Diyo p={[0.5, 0.35, 3.0]} light />
      </group>
    );
  }

  /* iron railing along the front of the plinth, white gate pillar, plinth with carved animal, parapet */
  function Fittings() {
    const M = useM();
    const iron = M.plain('#1d1d1f', { roughness: 0.6, metalness: 0.4 });
    const white = M.plain('#efede7', { roughness: 0.85 });
    const grey = M.plain('#7b776e', { roughness: 0.95 });
    const posts = useMemo(() => Array.from({ length: 13 }, (_, i) => ({ p: [-2.4 + i * 0.4, 0.3 + 0.2, 2.45], s: 1 })), []);
    return (
      <group>
        <Box s={[5.0, 0.04, 0.04]} p={[0, 0.66, 2.45]} m={iron} cast={false} />
        <Box s={[5.0, 0.04, 0.04]} p={[0, 0.42, 2.45]} m={iron} cast={false} />
        <Inst geo={useMemo(() => new THREE.BoxGeometry(0.035, 0.4, 0.035), [])} mat={iron} items={posts} />
        {/* white gate pillar with gilded pin, left of the pagoda */}
        <group position={[-3.6, 0, 1.9]}>
          <Box s={[0.42, 0.2, 0.42]} p={[0, 0.1, 0]} m={white} />
          <Box s={[0.3, 1.3, 0.3]} p={[0, 0.85, 0]} m={white} />
          <Box s={[0.42, 0.1, 0.42]} p={[0, 1.55, 0]} m={white} />
          <Box s={[0.26, 0.12, 0.26]} p={[0, 1.66, 0]} m={white} />
          <Cyl rt={0.02} rb={0.05} h={0.3} p={[0, 1.87, 0]} m={M.gold} seg={8} />
          <Ball rad={0.06} p={[0, 2.05, 0]} m={M.gold} />
        </group>
        {/* white plinth with carved animal and inscription, right of the pagoda */}
        <group position={[3.7, 0, 0.6]}>
          <Box s={[1.5, 1.05, 1.1]} p={[0, 0.52, 0]} m={white} />
          <Box s={[1.1, 0.4, 0.04]} p={[0, 0.7, 0.57]} m={M.plain('#b9b5a8')} cast={false} />
          <Box s={[0.9, 0.04, 0.03]} p={[0, 0.78, 0.6]} m={iron} cast={false} />
          <Box s={[0.9, 0.04, 0.03]} p={[0, 0.66, 0.6]} m={iron} cast={false} />
          <Ball rad={0.42} p={[0, 1.4, 0]} sc={[1.1, 0.8, 1.3]} m={grey} />
          <Ball rad={0.22} p={[0, 1.6, 0.4]} m={grey} />
          <Cyl rt={0.07} rb={0.05} h={0.35} p={[0, 1.4, 0.64]} r={[1.0, 0, 0]} m={grey} seg={8} />
        </group>
        {/* thick white concrete parapet running along the rock edge */}
        <Box s={[3.4, 0.6, 0.38]} p={[6.2, 0.3, 1.0]} m={white} />
        <Box s={[0.38, 0.6, 2.4]} p={[7.7, 0.3, -0.2]} m={white} />
      </group>
    );
  }

  /* long narrow green pool between rock ribs with a stone Vishnu image */
  function Pool() {
    const M = useM();
    const wallM = M.plain('#b7b5a8', { roughness: 0.95 });
    const ribM = useMemo(() => [new THREE.MeshStandardMaterial({ color: '#7f7a6e', roughness: 1, flatShading: true }), new THREE.MeshStandardMaterial({ color: '#9a958a', roughness: 1, flatShading: true })], []);
    const ribs = [[3.55, -3.6, 0.5, 1.3], [3.35, -5.7, 0.55, 1.9], [3.6, -7.5, 0.45, 1.2], [6.5, -3.4, 0.5, 1.5], [6.7, -5.4, 0.6, 1.8], [6.45, -7.3, 0.45, 1.1]];
    return (
      <group>
        <Box s={[1.55, 0.02, 5.4]} p={[5.0, -0.28, -5.4]} m={M.plain('#4f7b2c', { roughness: 0.25, metalness: 0.1 })} cast={false} />
        <Box s={[0.14, 0.012, 1.0]} p={[5.0, -0.265, -4.2]} m={M.plain('#6f9a36', { roughness: 0.4 })} cast={false} />
        <group position={[5.0, -0.28, -5.4]}>
          <Box s={[0.56, 0.12, 0.8]} p={[0, 0.03, 0]} m={M.plain('#8c887b', { roughness: 0.95 })} />
          <Box s={[0.3, 0.28, 0.18]} p={[0, 0.2, 0]} m={M.plain('#9b978a', { roughness: 0.95 })} />
          <Ball rad={0.1} p={[0, 0.4, 0]} m={M.plain('#9b978a', { roughness: 0.95 })} />
        </group>
        {/* raised rock rim round the pool and grey rock ribs on each side */}
        <Box s={[0.26, 0.26, 5.6]} p={[4.16, 0.13, -5.4]} m={ribM[0]} />
        <Box s={[0.26, 0.26, 5.6]} p={[5.86, 0.13, -5.4]} m={ribM[0]} />
        <Box s={[1.9, 0.26, 0.26]} p={[5.0, 0.13, -2.65]} m={ribM[0]} />
        <Box s={[1.9, 0.26, 0.26]} p={[5.0, 0.13, -8.15]} m={ribM[0]} />
        {ribs.map(([x, z, h, L], i) => <Ball key={i} rad={1} p={[x, 0.08, z]} sc={[0.42, h * 0.5, L * 0.5]} m={ribM[i % 2]} />)}
        <Box s={[0.18, 0.35, 5.0]} p={[6.55, 0.17, -5.4]} m={wallM} />
      </group>
    );
  }

  /* narrow stone stair with white parapet cut down the rock face to the rapids */
  function RiverStair() {
    const M = useM();
    const stone = M.mat('stone', 1, 1, { color: '#9a958a', roughness: 1 });
    const white = M.plain('#eceae4', { roughness: 0.85 });
    const rope = M.plain('#e4b422', { roughness: 0.7 });
    const NS = 17, DZ = 0.42, DY = 0.34;
    const steps = useMemo(() => Array.from({ length: NS }, (_, i) => ({ z: -0.9 - i * DZ, top: -0.1 - i * DY })), []);
    const X = 10.9;
    const L = Math.hypot(NS * DZ, NS * DY), ang = -Math.atan2(NS * DY, NS * DZ);
    const zc = -0.9 - (NS * DZ) / 2 + DZ / 2, yc = -0.1 - (NS * DY) / 2 + DY / 2;
    return (
      <group>
        <Box s={[1.5, 0.3, 1.9]} p={[X - 0.2, -0.15, 0.1]} m={stone} />
        <Box s={[0.2, 1.0, 1.9]} p={[X + 0.62, 0.45, 0.1]} m={white} />
        {steps.map((s, i) => (
          <group key={i}>
            <Box s={[1.1, s.top - BED + 0.05, DZ + 0.01]} p={[X, (s.top + BED) / 2, s.z]} m={stone} />
            <Box s={[0.2, 0.95, DZ + 0.01]} p={[X + 0.62, s.top + 0.45, s.z]} m={white} />
          </group>
        ))}
        {/* parapet cap and rope rail on the rock side */}
        <Box s={[0.26, 0.06, L]} p={[X + 0.62, yc + 0.95, zc]} r={[ang, 0, 0]} m={white} />
        <Box s={[0.03, 0.03, L]} p={[X - 0.5, yc + 0.8, zc]} r={[ang, 0, 0]} m={rope} cast={false} />
        {[0, 4, 8, 12, 16].map((i) => <Cyl key={i} rt={0.03} rb={0.03} h={0.85} p={[X - 0.5, steps[i].top + 0.42, steps[i].z]} m={M.dark} seg={5} />)}
        {[[11.9, -4.2], [12.2, -5.6], [11.6, -7.6], [12.4, -2.4], [12.0, -9.2]].map(([x, z], i) => <Ball key={i} rad={0.7 + (i % 2) * 0.3} p={[x + 0.6, WATER_Y + 0.2, z]} sc={[1, 0.8, 1]} m={M.plain('#8d897e', { roughness: 1 })} />)}
      </group>
    );
  }

  function GaleshMain() {
    return (
      <group>
        <RockSlab />
        <Pagoda />
        <Fittings />
        <Pool />
        <RiverStair />
        <Frame s={[11, 6.5, 8]} p={[-1.5, 2.5, 0]} />
      </group>
    );
  }

  /* ------------------------------------------------------------------ the second, South-Indian-style shrine */
  function Shrine({ p }) {
    const M = useM();
    const white = M.plain('#f0eee8', { roughness: 0.85 });
    const maroon = M.plain('#8b2a2a', { roughness: 0.8 });
    const gold = M.plain('#e0a820', { roughness: 0.5, metalness: 0.3 });
    const pc = ['#e0508a', '#2fa35a', '#2f6fd0', '#f0902a', '#d8302a', '#f2d230'];
    const tierC = ['#2f8f9a', '#d86a8a', '#e0902a', '#2f8f9a', '#c84a4a'];
    const widths = [2.8, 2.3, 1.8, 1.35, 0.9];
    const TH = 0.5;
    const base = 2.2;
    return (
      <group position={p} scale={0.85}>
        {[[7.4, 5.8], [6.8, 5.3], [6.2, 4.8]].map(([w, d], i) => <Box key={i} s={[w, 0.18, d]} p={[0, 0.09 + i * 0.18, 0.0]} m={white} />)}
        <Box s={[5.8, 1.6, 3.0]} p={[0, 1.34, -0.4]} m={maroon} />
        {[-1.0, 1.0].map((x) => <Box key={x} s={[0.95, 1.2, 0.05]} p={[x, 1.2, 1.12]} m={gold} cast={false} />)}
        {[-2.0, 2.0].map((x) => <Box key={'n' + x} s={[0.7, 0.9, 0.05]} p={[x, 1.2, 1.12]} m={M.plain(x < 0 ? '#e0508a' : '#2f8f9a')} cast={false} />)}
        {pc.map((c, i) => <Cyl key={i} rt={0.13} rb={0.15} h={1.45} p={[-2.5 + i * 1.0, 1.27, 1.55]} m={M.plain(c, { roughness: 0.6 })} seg={10} />)}
        <Box s={[6.2, 0.14, 3.9]} p={[0, 2.1, -0.15]} m={M.plain('#2f8f9a')} />
        <Box s={[5.9, 0.1, 3.7]} p={[0, 2.22, -0.15]} m={M.plain('#f3d7e2')} />
        {/* tapering stepped pyramid, five receding tiers with ledges and small figures */}
        {widths.map((w, i) => {
          const y = base + i * TH;
          return (
            <group key={i}>
              <Box s={[w, TH * 0.8, w]} p={[0, y + TH * 0.4, -0.4]} m={M.plain(tierC[i], { roughness: 0.7 })} />
              <Box s={[w + 0.2, 0.08, w + 0.2]} p={[0, y + TH * 0.82, -0.4]} m={M.plain('#f4e6c8')} />
              {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz], k) => <Box key={k} s={[0.12, 0.2, 0.12]} p={[sx * (w / 2 + 0.02), y + TH + 0.1, -0.4 + sz * (w / 2 + 0.02)]} m={M.plain(['#f0902a', '#e0508a', '#f2d230', '#2f6fd0'][(i + k) % 4])} cast={false} />)}
              {[-0.3, 0, 0.3].map((dx, k) => <Box key={'f' + k} s={[0.1, 0.22, 0.04]} p={[dx * w, y + 0.28, -0.4 + w / 2 + 0.03]} m={M.plain(['#f2d230', '#e0508a', '#2fa35a'][(i + k) % 3])} cast={false} />)}
            </group>
          );
        })}
        {/* arched gopuram top: barrel vault with gold finials */}
        <mesh position={[0, base + 5 * TH + 0.3, -0.4]} rotation={[0, 0, Math.PI / 2]} material={M.plain('#2f8f9a', { roughness: 0.6 })} castShadow><cylinderGeometry args={[0.38, 0.38, 1.0, 14, 1, false, 0, Math.PI]} /></mesh>
        <Box s={[1.0, 0.04, 0.7]} p={[0, base + 5 * TH + 0.1, -0.4]} m={M.plain('#f4e6c8')} />
        {[-0.4, 0, 0.4].map((dx) => <mesh key={dx} position={[dx, base + 5 * TH + 0.74, -0.4]} material={M.gold} castShadow><coneGeometry args={[0.07, 0.3, 8]} /></mesh>)}
        <Cyl rt={0.035} h={1.8} p={[0.0, base + 5 * TH + 1.5, -0.4]} m={M.dark} seg={6} />
        <Box s={[1.1, 0.6, 0.03]} p={[0.57, base + 5 * TH + 2.1, -0.4]} m={M.plain('#f2c21a', { roughness: 0.7 })} cast={false} />
        <Diyo p={[-1.0, 0.45, 2.35]} /><Diyo p={[1.0, 0.45, 2.35]} />
      </group>
    );
  }

  /* ------------------------------------------------------------------ swastika brick plaza on the town side */
  function SwastikaPlaza({ p }) {
    const M = useM();
    const brick = M.mat('brick', 4, 1, { color: '#e0bba9' });
    const pink = M.plain('#e8c4b6', { roughness: 0.9 });
    const white = M.plain('#f3f0ea', { roughness: 0.8 });
    const iron = M.plain('#18181a', { roughness: 0.6, metalness: 0.4 });
    const W = 7.4, D = 6.0;
    const arms = [
      [[-2.4, 0], [2.4, 0]], [[0, -2.2], [0, 2.2]],
      [[0, -2.2], [1.6, -2.2]], [[2.4, 0], [2.4, 1.5]], [[0, 2.2], [-1.6, 2.2]], [[-2.4, 0], [-2.4, -1.5]],
    ];
    const lamps = useMemo(() => {
      const out = [];
      arms.forEach(([a, b], k) => {
        const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const n = Math.round(L / 0.45);
        for (let i = 0; i <= n; i += 1) { const t = i / n; out.push({ p: [mix(a[0], b[0], t), 0.4, mix(a[1], b[1], t)], s: 1 }); }
      });
      return out;
    }, []);
    const fence = useMemo(() => {
      const out = [];
      const hx = W / 2 + 0.35, hz = D / 2 + 0.35;
      for (let x = -hx; x <= hx + 0.01; x += 0.4) { out.push({ p: [x, 0.5, hz], s: 1 }); out.push({ p: [x, 0.5, -hz], s: 1 }); }
      for (let z = -hz + 0.4; z < hz - 0.01; z += 0.4) { out.push({ p: [hx, 0.5, z], s: 1 }); out.push({ p: [-hx, 0.5, z], s: 1 }); }
      return out;
    }, []);
    const lampGeo = useMemo(() => new THREE.CylinderGeometry(0.07, 0.09, 0.2, 8), []);
    const postGeo = useMemo(() => new THREE.BoxGeometry(0.035, 0.95, 0.035), []);
    return (
      <group position={p}>
        <Box s={[W, 0.1, D]} p={[0, 0.05, 0]} m={M.plain('#8a8672', { roughness: 0.95 })} />
        {[[W, 0.3, 0, D / 2], [W, 0.3, 0, -D / 2]].map(([w, t, x, z], i) => <Box key={i} s={[w, 0.42, t]} p={[x, 0.21, z]} m={brick} />)}
        {[W / 2, -W / 2].map((x, i) => <Box key={`s${i}`} s={[0.3, 0.42, D]} p={[x, 0.21, 0]} m={brick} />)}
        {arms.map(([a, b], i) => {
          const cx = (a[0] + b[0]) / 2, cz = (a[1] + b[1]) / 2;
          const horiz = Math.abs(b[0] - a[0]) > 0.01;
          const L = Math.hypot(b[0] - a[0], b[1] - a[1]) + 0.5;
          return (
            <group key={i}>
              <Box s={horiz ? [L, 0.3, 0.62] : [0.62, 0.3, L]} p={[cx, 0.2, cz]} m={pink} />
              <Box s={horiz ? [L, 0.03, 0.1] : [0.1, 0.03, L]} p={[cx, 0.36, cz]} m={white} cast={false} />
            </group>
          );
        })}
        <Inst geo={lampGeo} mat={M.plain('#8a857a', { roughness: 1 })} items={lamps} />
        <Inst geo={postGeo} mat={iron} items={fence} />
        {[[W / 2 + 0.35, 'x'], [-(W / 2 + 0.35), 'x']].map(([x], i) => <Box key={`rx${i}`} s={[0.03, 0.04, D + 0.7]} p={[x, 0.9, 0]} m={iron} cast={false} />)}
        {[D / 2 + 0.35, -(D / 2 + 0.35)].map((z, i) => <Box key={`rz${i}`} s={[W + 0.7, 0.04, 0.03]} p={[0, 0.9, z]} m={iron} cast={false} />)}
        {[0.5].map((h, i) => <Box key={`rx2${i}`} s={[W + 0.7, 0.04, 0.03]} p={[0, h, D / 2 + 0.35]} m={iron} cast={false} />)}
        {/* small white-and-red shrine pillar beside the plaza */}
        <group position={[W / 2 + 1.4, 0, -1.4]}>
          <Box s={[0.6, 1.1, 0.6]} p={[0, 0.55, 0]} m={white} />
          <Box s={[0.4, 0.5, 0.4]} p={[0, 1.35, 0]} m={M.plain('#d23a28')} />
          <mesh position={[0, 1.8, 0]} castShadow material={M.plain('#c83020')}><coneGeometry args={[0.38, 0.4, 4]} /></mesh>
        </group>
        <Diyo p={[-1.2, 0.4, 0.0]} />
      </group>
    );
  }

  /* ------------------------------------------------------------------ low roadside buildings */
  function Building({ p, r = 0, w = 5, d = 3, h = 1.4, wall = '#e2b9a8', roofC = 'rust', rows = 4 }) {
    const M = useM();
    const rust = useRoofMat();
    const blue = useRoofMat('#3f74ad', '#2e5886', '#5f93c8');
    const wm = M.plain(wall, { roughness: 0.9 });
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[w, h, d]} p={[0, h / 2, 0]} m={wm} />
        <HipRoof w={w + 0.7} d={d + 0.7} h={0.9} rl={Math.max(0, w - d)} y={h} m={roofC === 'blue' ? blue : rust} />
        {Array.from({ length: rows }, (_, i) => <Box key={i} s={[0.45, 0.45, 0.05]} p={[-w / 2 + (w * (i + 0.5)) / rows, h * 0.6, d / 2 + 0.01]} m={M.plain('#4a3a30')} cast={false} />)}
        <Box s={[0.6, 0.85, 0.05]} p={[0, 0.43, d / 2 + 0.01]} m={M.plain('#6a4326')} cast={false} />
      </group>
    );
  }

  /* ------------------------------------------------------------------ forest, boulders, foam */
  function Forest() {
    const geo = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);
    const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, flatShading: true }), []);
    const items = useMemo(() => {
      const out = [];
      const greens = ['#2d5a2b', '#386833', '#47763a', '#315f2f', '#52803f', '#244e29'];
      for (let k = 0; out.length < 6200 && k < 60000; k += 1) {
        const x = (rn(k * 3 + 1) - 0.5) * 190, z = (rn(k * 3 + 2) - 0.5) * 190;
        const t = terrain(x, z);
        if (t.cliff > 0.05 || t.pad > 0.15 || t.h < 1.0 || t.raw < 1.5) continue;
        if (t.raw > 24.3 && t.raw < 25.0) continue;
        if (rn(k * 5 + 3) > 0.9) continue;
        const s = 0.8 + rn(k + 7) * 0.8 + Math.min(1, t.raw / 20) * 0.4;
        out.push({ p: [x, t.h + s * 0.55, z], s: [s, s * 1.3, s], ry: rn(k) * 6, c: greens[k % 6] });
      }
      return out;
    }, []);
    return <Inst geo={geo} mat={mat} items={items} cast />;
  }

  function RiverBits() {
    const M = useM();
    const rockGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);
    const foamGeo = useMemo(() => new THREE.CircleGeometry(1, 14).rotateX(-Math.PI / 2), []);
    const boulders = useMemo(() => {
      const out = [];
      const gr = ['#7d796f', '#9a968a', '#6c685e', '#a9a498', '#857f72'];
      for (let k = 0; k < 220; k += 1) {
        const z = -48 + rn(k + 40) * 100;
        const xr = XC(z);
        const side = rn(k + 90);
        let x;
        if (side < 0.35) x = xr - W_MAIN + 0.4 - rn(k + 5) * 2.4;
        else if (side < 0.7) x = xr + W_MAIN - 0.4 + rn(k + 6) * 2.4;
        else x = xr + (rn(k + 7) - 0.5) * W_MAIN * 1.7;
        const s = 0.25 + rn(k + 8) * 0.55;
        out.push({ p: [x, WATER_Y + s * 0.15, z], s: [s * 1.2, s * 0.8, s], ry: rn(k) * 6, c: gr[k % 5] });
      }
      for (let k = 0; k < 70; k += 1) {
        const x = -34 + rn(k + 200) * 44;
        const zz = ZR(x) + (rn(k + 210) - 0.5) * 4.4;
        const s = 0.25 + rn(k + 220) * 0.4;
        out.push({ p: [x, WATER_Y + s * 0.15, zz], s: [s * 1.2, s * 0.8, s], ry: rn(k) * 6, c: gr[k % 5] });
      }
      // big boulders at the foot of the stair
      [[12.8, -7.2, 1.1], [13.2, -3.6, 0.9], [11.4, -9.5, 1.2], [8, -13.4, 1.0], [2, -13.8, 0.9], [-6, -14.2, 1.1]].forEach(([x, z, s], i) => out.push({ p: [x, WATER_Y + s * 0.3, z], s: [s * 1.2, s * 0.8, s], ry: i, c: '#a8a397' }));
      return out;
    }, []);
    const foam = useMemo(() => {
      const out = [];
      boulders.forEach((b, i) => { if (i % 2 === 0 || i > 220) out.push({ p: [b.p[0], WATER_Y + 0.03, b.p[2] + 0.4], s: [b.s[0] * 1.5, 1, b.s[2] * 1.9], ry: i }); });
      for (let k = 0; k < 30; k += 1) out.push({ p: [12 + rn(k + 500) * 9, WATER_Y + 0.03, -17 + rn(k + 510) * 6], s: [1.2 + rn(k) * 1.4, 1, 1.5 + rn(k + 3) * 2], ry: rn(k + 1) * 3 });
      for (let k = 0; k < 16; k += 1) out.push({ p: [11.4 + rn(k + 600) * 1.6, WATER_Y + 0.03, -1 - k * 0.8], s: [1.0 + rn(k + 601) * 0.8, 1, 1.4 + rn(k + 602)], ry: rn(k + 603) * 3 });
      for (let k = 0; k < 14; k += 1) out.push({ p: [-12 + k * 2.4 + rn(k + 610), WATER_Y + 0.03, -11.6 - rn(k + 611) * 0.8], s: [1.4 + rn(k + 612), 1, 1.0 + rn(k + 613) * 0.6], ry: rn(k + 614) * 3 });
      return out;
    }, [boulders]);
    const streaks = useMemo(() => Array.from({ length: 70 }, (_, k) => {
      const z = -45 + rn(k + 70) * 100;
      return { p: [XC(z) + (rn(k + 71) - 0.5) * 8, WATER_Y + 0.02, z], s: [0.1 + rn(k + 72) * 0.2, 0.01, 2 + rn(k + 73) * 5], c: '#f2f0ea' };
    }), []);
    const boxGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
    return (
      <group>
        <mesh position={[0, WATER_Y, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[200, 200]} /><meshStandardMaterial color="#a49f95" roughness={0.5} metalness={0} /></mesh>
        <Inst geo={boxGeo} mat={new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.4, transparent: true, opacity: 0.5 })} items={streaks} />
        <Inst geo={rockGeo} mat={new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, flatShading: true })} items={boulders} cast />
        <Inst geo={foamGeo} mat={new THREE.MeshBasicMaterial({ color: '#f4f4f0', transparent: true, opacity: 0.6 })} items={foam} />
      </group>
    );
  }

  /* road, kerb, paved strip, low retaining wall, shrubs and boulders in front of the rock */
  function Foreground() {
    const M = useM();
    const rg = useMemo(() => new THREE.IcosahedronGeometry(1, 0), []);
    const sh = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);
    const items = useMemo(() => {
      const out = [];
      for (let k = 0; k < 9; k += 1) out.push({ p: [-16 + k * 3.7 + rn(k) * 1.5, PLAIN + 0.25, 8.2 + rn(k + 3) * 2], s: [0.35 + rn(k + 1) * 0.4, 0.3 + rn(k + 2) * 0.2, 0.4 + rn(k + 5) * 0.3], ry: rn(k + 8) * 6, c: ['#7a7873', '#8c8a85', '#9a968c'][k % 3] });
      return out;
    }, []);
    const shrubs = useMemo(() => Array.from({ length: 10 }, (_, k) => ({ p: [-14 + k * 3.2 + rn(k + 50) * 2, PLAIN + 0.4, 17.2 + rn(k + 51) * 1.6], s: [0.7 + rn(k + 52) * 0.5, 0.55 + rn(k + 53) * 0.3, 0.7 + rn(k + 54) * 0.4], ry: rn(k + 55) * 6, c: ['#3f7a35', '#52883e', '#2f6a2f', '#6a9a45'][k % 4] })), []);
    const mt = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, flatShading: true }), []);
    return (
      <group>
        <Box s={[30, 0.1, 3.6]} p={[-3, PLAIN + 0.05, 8.0]} m={M.plain('#b9b3a4', { roughness: 0.95 })} />
        <Box s={[30, 0.16, 0.18]} p={[-3, PLAIN + 0.08, 9.9]} m={M.plain('#e8e5dc', { roughness: 0.9 })} />
        <Box s={[40, 0.06, 4.6]} p={[-6, PLAIN + 0.03, 12.4]} m={M.plain('#4b4b4d', { roughness: 0.95 })} />
        <Box s={[40, 0.02, 0.1]} p={[-6, PLAIN + 0.07, 12.4]} m={M.plain('#e6e0c8', { roughness: 0.9 })} cast={false} />
        <Box s={[40, 0.16, 0.18]} p={[-6, PLAIN + 0.08, 14.8]} m={M.plain('#e8e5dc', { roughness: 0.9 })} />
        <Box s={[26, 0.7, 0.4]} p={[-1, PLAIN + 0.35, 15.9]} m={M.mat('stone', 6, 1, { color: '#a8a496', roughness: 1 })} />
        <Box s={[26, 0.1, 0.55]} p={[-1, PLAIN + 0.75, 15.9]} m={M.plain('#d8d4c8', { roughness: 0.9 })} />
        <Inst geo={rg} mat={mt} items={items} cast />
        <Inst geo={sh} mat={mt} items={shrubs} cast />
      </group>
    );
  }

  /* ------------------------------------------------------------------ environment */
  function GaleshEnv() {
    const M = useM();
    const hAt = (x, z) => terrain(x, z).h;
    return (
      <group>
        <TerrainMesh />
        <RiverBits />
        <Forest />
        <Shrine p={[-11, 0, -1]} />
        <SwastikaPlaza p={[-13, PLAIN, 19.5]} />
        {/* town side: sparse low red-roofed buildings and the road */}
        <Building p={[-12.8, PLAIN, 3.2]} w={4.4} d={3.0} h={1.55} wall="#e6c2b2" rows={4} />
        <Building p={[-17.6, PLAIN, 3.6]} w={4.2} d={3.2} h={1.35} wall="#dfa994" rows={3} />
        <Building p={[-28.5, PLAIN, 4]} r={-Math.PI / 2} w={6} d={3.2} h={1.6} wall="#efe6cf" roofC="blue" rows={4} />
        <Building p={[-28.5, PLAIN, 14]} r={-Math.PI / 2} w={5} d={3.2} h={1.5} wall="#d6cfae" rows={3} />
        <Building p={[-28.5, PLAIN, 22]} r={-Math.PI / 2} w={4.4} d={3} h={1.4} wall="#e8c9b0" roofC="blue" rows={3} />
        <Building p={[-42, hAt(-42, -24), -24]} w={3.6} d={2.6} h={1.3} wall="#f0ece0" rows={3} />
        <mesh position={[-23.5, PLAIN + 0.03, 0]} receiveShadow><boxGeometry args={[4.2, 0.06, 110]} /><meshStandardMaterial color="#4b4b4d" roughness={0.95} /></mesh>
        <Tree p={[-19, PLAIN, 16]} s={2.6} />
        <Tree p={[-8, PLAIN, 24]} s={2.2} />
        <Foreground />
        {[[-30, -95, 30, 40], [10, -100, 36, 48], [50, -92, 30, 36], [-70, -80, 26, 34]].map(([x, z, r, h], i) => <mesh key={'rg' + i} position={[x, h / 2 + 8, z]} material={M.plain('#8fa3a8', { roughness: 1 })}><coneGeometry args={[r, h, 7]} /></mesh>)}
        <mesh position={[0, 0, 0]} visible={false}><boxGeometry args={[0.01, 0.01, 0.01]} /></mesh>
      </group>
    );
  }

  return { 'galeshwor-dham': { Main: GaleshMain, Env: GaleshEnv } };
}
