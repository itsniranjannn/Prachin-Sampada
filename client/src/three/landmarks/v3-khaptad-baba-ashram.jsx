/* Khaptad Baba Ashram, Khaptad plateau (c.3,000 m), Sudurpashchim. 1 unit = 1 m. Front/veranda = +z.
   A modest hermitage, NOT a temple: a long single-storey whitewashed rubble house (~14 x 8 x 5 m) with a low stone-slate gable
   roof, a full-width red timber veranda (railing of vertical balusters on stilts) with its own lower red corrugated roof, a long
   white platform wall to the left, a small gate block with a blue-grey canopy on red posts and a grey standing stone at the right
   end, a white stone circle on the lawn in front, a dirt path with white marker stones, a dark timber outbuilding to the left rear,
   rough rail fence at the plateau edge, a bare tree at right, dark firs all round and reddish earth hillocks beyond.
   Sizes are inferred from photographs (no plan is documented). */
export default function make(K) {
  const { useM, Frame, THREE, useMemo } = K;

  const rnd = (i) => { const v = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return v - Math.floor(v); };
  const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const bump = (x, z, cx, cz, s, a) => a * Math.exp(-(((x - cx) ** 2 + (z - cz) ** 2) / (s * s)));

  /* ---------- terrain ---------- */
  const HILLS = [[-42, -50, 18, 8], [34, -58, 20, 6], [-78, -14, 22, 6], [70, -6, 24, 5], [-20, -80, 26, 10]];
  function hillAmt(x, z) { let h = 0; for (const [cx, cz, s, a] of HILLS) h += bump(x, z, cx, cz, s, a); return h; }
  function H(x, z) {
    const r = Math.hypot(x * 0.8, z);
    const w = sstep(14, 38, r);
    let h = w * (0.55 * Math.sin(x * 0.085 + 1.2) * Math.cos(z * 0.07 + 0.4) + 0.3 * Math.sin(x * 0.19 + z * 0.13) + 0.22 * Math.sin(z * 0.23 - x * 0.11 + 2));
    h += hillAmt(x, z) * sstep(22, 50, r);
    h += sstep(40, 100, -z) * 4;
    return h;
  }

  /* ---------- canvas textures + materials (cached) ---------- */
  const texCache = {}, matCache = {};
  function ctex(key, draw, rx, ry) {
    const k = `${key}|${rx}|${ry}`;
    if (texCache[k]) return texCache[k];
    const c = document.createElement('canvas'); c.width = c.height = 256;
    draw(c.getContext('2d'));
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4;
    if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
    texCache[k] = t; return t;
  }
  const drawers = {
    rubble: (g) => {
      g.fillStyle = '#ece9df'; g.fillRect(0, 0, 256, 256);
      let y = 0, r = 0;
      while (y < 256) {
        const h = Math.min(256 - y, 80 + Math.floor(rnd(r * 3.3) * 40)); let x = -Math.floor(rnd(r * 7.1) * 50);
        while (x < 256) {
          const w = 50 + Math.floor(rnd(x * 0.31 + r * 9) * 70); const L = 236 + Math.floor(rnd(x * 1.7 + r * 5.3) * 18);
          g.fillStyle = `rgb(${L},${L - 1},${L - 6})`; g.fillRect(x, y, w, h);
          g.fillStyle = 'rgba(120,110,95,0.06)'; g.fillRect(x + 3, y + h - 7, w - 6, 4);
          x += w;
        }
        y += h; r++;
      }
    },
    slate: (g) => {
      g.fillStyle = '#5c564d'; g.fillRect(0, 0, 256, 256);
      let y = 0, r = 0;
      while (y < 256) {
        const h = Math.min(256 - y, 16 + Math.floor(rnd(r * 4.1) * 12)); let x = -Math.floor(rnd(r * 6.7) * 60);
        while (x < 256) {
          const w = 36 + Math.floor(rnd(x * 0.41 + r * 8) * 60); const L = 110 + Math.floor(rnd(x * 1.3 + r * 3.7) * 40);
          g.fillStyle = `rgb(${L + 8},${L},${L - 10})`; g.fillRect(x + 1, y + 1, w - 2, h - 2);
          g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x + 1, y + h - 4, w - 2, 3);
          g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(x + 1, y + 1, w - 2, 1);
          x += w;
        }
        y += h; r++;
      }
    },
    corrug: (g) => { for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#6f2c22' : '#7d3226'; g.fillRect(i * 16, 0, 16, 256); } },
    corrugBlue: (g) => { for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#6d7f94' : '#8294a8'; g.fillRect(i * 16, 0, 16, 256); } },
    corrugGrey: (g) => { for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#7d8185' : '#979b9f'; g.fillRect(i * 16, 0, 16, 256); } },
    planks: (g) => {
      for (let i = 0; i < 12; i++) { const L = 44 + Math.floor(rnd(i * 3.3) * 20); g.fillStyle = `rgb(${L + 14},${L},${L - 12})`; g.fillRect(i * 22, 0, 22, 256); g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(i * 22, 0, 2, 256); }
    },
  };
  function tm(kind, rx = 1, ry = 1, o = {}) {
    const k = `${kind}|${rx}|${ry}|${JSON.stringify(o)}`;
    if (!matCache[k]) matCache[k] = new THREE.MeshStandardMaterial({ map: ctex(kind, drawers[kind], rx, ry), roughness: 0.93, ...o });
    return matCache[k];
  }
  function pm(color, o = {}) {
    const k = `p|${color}|${JSON.stringify(o)}`;
    if (!matCache[k]) matCache[k] = new THREE.MeshStandardMaterial({ color, roughness: 0.9, ...o });
    return matCache[k];
  }

  const RED = '#7a3126';
  const Bx = ({ s, p, r, m, cast = true }) => (
    <mesh position={p} rotation={r} material={m} castShadow={cast} receiveShadow><boxGeometry args={s} /></mesh>
  );

  /* instanced meshes: items {p, s, ry, look, c} */
  function Inst({ geo, mat, items, cast = true }) {
    const g = useMemo(() => geo(), []); // eslint-disable-line
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const col = useMemo(() => new THREE.Color(), []);
    return (
      <instancedMesh
        args={[g, mat, items.length]}
        castShadow={cast}
        receiveShadow
        frustumCulled={false}
        ref={(m) => {
          if (!m) return;
          items.forEach((it, i) => {
            dummy.position.set(...it.p); dummy.rotation.set(it.rx || 0, it.ry || 0, it.rz || 0);
            dummy.scale.set(...(it.s || [1, 1, 1]));
            if (it.look) { dummy.lookAt(...it.look); }
            dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix);
            if (it.c) { col.set(it.c); m.setColorAt(i, col); }
          });
          m.instanceMatrix.needsUpdate = true;
          if (m.instanceColor) m.instanceColor.needsUpdate = true;
        }}
      />
    );
  }
  const unitBox = () => new THREE.BoxGeometry(1, 1, 1);
  const unitCone = () => new THREE.ConeGeometry(1, 1, 8);
  const unitCyl = () => new THREE.CylinderGeometry(0.7, 1, 1, 6);
  const unitRock = () => new THREE.DodecahedronGeometry(1, 0);

  /* gable triangle (house end) */
  function GableTri({ x, flip, m }) {
    const geo = useMemo(() => {
      const g = new THREE.BufferGeometry();
      const v = new Float32Array([0, 4.05, -4.5, 0, 4.05, 1.9, 0, 5.45, -1.3]);
      g.setAttribute('position', new THREE.BufferAttribute(v, 3));
      g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 0.5, 0.4]), 2));
      g.setIndex([0, 1, 2]); g.computeVertexNormals(); return g;
    }, []);
    return <mesh geometry={geo} material={m} position={[x, 0, 0]} scale={[flip, 1, 1]} receiveShadow />;
  }

  /* ================================ MAIN ================================ */
  function KhaptadMain() {
    const M = useM();
    const wallF = tm('rubble', 3, 0.5, { side: THREE.DoubleSide });
    const wallE = tm('rubble', 1.0, 0.6, { side: THREE.DoubleSide });
    const wall = [wallE, wallE, wallF, wallF, wallF, wallF];
    const base = [tm('rubble', 1.6, 0.35), tm('rubble', 1.6, 0.35), wallF, wallF, tm('rubble', 4, 0.35), tm('rubble', 4, 0.35)];
    const slate = tm('slate', 4, 1.4);
    const red = pm(RED, { roughness: 0.8 });
    const redD = pm('#6f2c22', { roughness: 0.8 });
    const dark = pm('#2a1f1a');
    const pillarX = useMemo(() => Array.from({ length: 8 }, (_, i) => -6.1 + i * (12.2 / 7)), []);
    const bal = useMemo(() => {
      const a = [];
      for (let x = -5.95; x <= 6.0; x += 0.2) { if (x > -1.85 && x < -0.2) continue; a.push({ p: [x, 1.5, 3.5], s: [0.06, 0.9, 0.06] }); }
      for (const sx of [-6.1, 6.1]) for (let z = 1.8; z < 3.45; z += 0.2) a.push({ p: [sx, 1.5, z], s: [0.06, 0.9, 0.06] });
      return a;
    }, []);
    const stilts = useMemo(() => pillarX.map((x) => ({ p: [x, 0.45, 3.4], s: [0.38, 0.9, 0.38] })), [pillarX]);
    const wallW = 13, ang = Math.atan2(1.4, 3.2);

    return (
      <group>
        <Frame s={[24, 6.5, 10]} p={[1, 3.25, 0]} />
        {/* long whitewashed platform wall to the left */}
        <Bx s={[13.2, 1.1, 2.0]} p={[-13.4, 0.55, 2.6]} m={[tm('rubble', 1, 0.4), tm('rubble', 1, 0.4), tm('rubble', 4, 0.4), tm('rubble', 4, 0.4), tm('rubble', 4, 0.4), tm('rubble', 4, 0.4)]} />
        {/* house foundation */}
        <Bx s={[13.4, 1.3, 5.9]} p={[0, 0.35, -1.35]} m={base} />
        {/* walls */}
        <Bx s={[wallW, 3.1, 5.9]} p={[0, 2.55, -1.35]} m={wall} />
        <Bx s={[wallW + 0.1, 0.1, 6.0]} p={[0, 4.07, -1.35]} m={pm('#6a5e50')} />
        <GableTri x={6.55} flip={1} m={wallE} />
        <GableTri x={-6.55} flip={1} m={wallE} />
        {[6.6, -6.6].map((x) => <Bx key={x} s={[0.08, 0.1, 5.9]} p={[x, 4.2, -1.35]} m={redD} cast={false} />)}
        {/* stone-slate gable roof (low pitch), ridge along x */}
        <Bx s={[14.7, 0.35, 3.95]} p={[0, 4.93, 0.3]} r={[ang, 0, 0]} m={slate} />
        <Bx s={[14.7, 0.35, 3.95]} p={[0, 4.93, -2.9]} r={[-ang, 0, 0]} m={slate} />
        <Bx s={[14.6, 0.16, 0.3]} p={[0, 5.62, -1.3]} m={pm('#4a443d')} />
        {/* doors, windows, niche (front wall at z = 1.6) */}
        <Bx s={[1.3, 2.15, 0.12]} p={[-1.05, 2.12, 1.62]} m={dark} />
        <Bx s={[1.0, 1.95, 0.14]} p={[-1.05, 2.1, 1.64]} m={pm('#4a3326')} />
        {[-4.3, 2.6].map((x) => (
          <group key={x} position={[x, 2.25, 1.62]}>
            <Bx s={[1.3, 1.1, 0.1]} m={dark} />
            <Bx s={[1.05, 0.85, 0.12]} p={[0, 0, 0.02]} m={pm('#3a2b22', { emissive: '#ffa648', emissiveIntensity: 0.25 })} />
            <Bx s={[0.07, 0.85, 0.14]} p={[0, 0, 0.03]} m={dark} />
          </group>
        ))}
        <Bx s={[0.7, 0.85, 0.28]} p={[5.0, 2.2, 1.7]} m={dark} />
        <Bx s={[0.4, 0.45, 0.06]} p={[5.0, 2.2, 1.86]} m={pm('#ffb04a', { emissive: '#ff9a30', emissiveIntensity: 0.5 })} />
        <mesh position={[5.0, 2.95, 1.9]} material={M.gold} castShadow><cylinderGeometry args={[0.12, 0.2, 0.28, 10]} /></mesh>
        <Bx s={[0.02, 0.5, 0.02]} p={[5.0, 3.35, 1.9]} m={dark} />
        {/* veranda: stilts, floor, posts, railing, beam, red corrugated roof */}
        <Inst geo={unitBox} mat={pm('#cfcabf')} items={stilts} />
        <Bx s={[12.8, 0.12, 2.1]} p={[0, 0.98, 2.6]} m={pm('#5a2a20')} />
        <Bx s={[12.9, 0.22, 0.14]} p={[0, 0.88, 3.62]} m={red} />
        {pillarX.map((x) => <Bx key={x} s={[0.2, 2.25, 0.2]} p={[x, 2.1, 3.5]} m={red} />)}
        <Bx s={[13.0, 0.26, 0.24]} p={[0, 3.2, 3.5]} m={redD} />
        <Bx s={[5.0, 0.08, 0.1]} p={[-3.85, 1.95, 3.5]} m={red} />
        <Bx s={[7.0, 0.08, 0.1]} p={[2.6, 1.95, 3.5]} m={red} />
        <Bx s={[12.2, 0.08, 0.1]} p={[0, 1.12, 3.5]} m={red} cast={false} />
        <Bx s={[0.1, 0.08, 1.9]} p={[-6.1, 1.95, 2.6]} m={red} />
        <Bx s={[0.1, 0.08, 1.9]} p={[6.1, 1.95, 2.6]} m={red} />
        <Inst geo={unitBox} mat={red} items={bal} cast={false} />
        {/* two entry steps at the gap in the railing */}
        <Bx s={[1.5, 0.33, 0.5]} p={[-1.05, 0.17, 4.05]} m={red} />
        <Bx s={[1.5, 0.66, 0.5]} p={[-1.05, 0.33, 3.65]} m={red} />
        <Bx s={[13.6, 0.07, 2.45]} p={[0, 3.35, 2.75]} r={[0.14, 0, 0]} m={tm('corrug', 1, 1, { color: '#cfc0bc' })} />
        <Bx s={[13.6, 0.1, 0.1]} p={[0, 3.0, 3.95]} m={redD} />
        {/* orange-clad statue seated on the veranda, and a lamp */}
        <mesh position={[-3.0, 1.35, 2.5]} castShadow material={pm('#e07a1f')}><cylinderGeometry args={[0.22, 0.34, 0.6, 10]} /></mesh>
        <mesh position={[-3.0, 1.82, 2.5]} castShadow material={pm('#c89a72')}><sphereGeometry args={[0.15, 10, 8]} /></mesh>
        <pointLight position={[0, 2.4, 2.6]} intensity={0.5} distance={11} color="#ffb060" />
        {/* gate / porch block at the right end with blue-grey canopy on red posts */}
        <Bx s={[2.6, 3.6, 2.2]} p={[9.2, 1.8, 2.0]} m={tm('rubble', 1, 1)} />
        <Bx s={[2.8, 0.14, 2.4]} p={[9.2, 3.67, 2.0]} m={pm('#e3e0d6')} />
        <Bx s={[0.9, 1.7, 0.1]} p={[9.2, 1.0, 3.13]} m={dark} />
        {[[7.7, 3.3], [10.7, 3.3]].map(([x, z]) => <Bx key={x} s={[0.2, 4.0, 0.2]} p={[x, 2.0, z]} m={red} />)}
        <Bx s={[3.7, 0.08, 2.9]} p={[9.2, 4.06, 2.2]} r={[0.1, 0, 0]} m={tm('corrugBlue', 1, 1, { color: '#c4ccd6' })} />
        <Bx s={[3.8, 0.14, 0.14]} p={[9.2, 3.95, 3.58]} m={redD} />
        {/* tall grey standing stone */}
        <Bx s={[0.95, 3.5, 0.45]} p={[12.1, 1.55, 1.5]} r={[0, 0.35, 0.03]} m={pm('#8d8c88', { roughness: 1 })} />
        <Bx s={[0.8, 0.7, 0.6]} p={[12.1, 0.2, 1.5]} m={pm('#a09e98')} />
      </group>
    );
  }

  /* ================================ ENV ================================ */
  function KhaptadEnv() {
    const ground = useMemo(() => {
      const g = new THREE.PlaneGeometry(260, 260, 170, 170); g.rotateX(-Math.PI / 2);
      const pos = g.attributes.position; const cols = new Float32Array(pos.count * 3);
      const green = new THREE.Color('#648a3e'), straw = new THREE.Color('#a79a56'), earth = new THREE.Color('#9a6a4c'), dry = new THREE.Color('#8d8a48'), c = new THREE.Color();
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), z = pos.getZ(i);
        pos.setY(i, H(x, z));
        const n = Math.sin(x * 0.31 + 1) * Math.sin(z * 0.27 + 2) * 0.5 + 0.5, n2 = Math.sin(x * 0.07 + z * 0.05) * 0.5 + 0.5;
        const rr = Math.hypot(x, z), sw = sstep(15, 32, rr); c.copy(green).lerp(straw, Math.min(1, sw * 0.9 + n * 0.12 * sw)); c.lerp(dry, 0.25 * n2 * sw);
        c.lerp(earth, Math.min(0.5, hillAmt(x, z) / 7) * sstep(24, 50, Math.hypot(x, z)));
        c.offsetHSL(0, 0, (rnd(i) - 0.5) * 0.03);
        cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
      }
      g.setAttribute('color', new THREE.BufferAttribute(cols, 3)); g.computeVertexNormals(); return g;
    }, []);

    const path = useMemo(() => {
      const pts = []; for (let z = 4.4; z <= 46; z += 1) pts.push([-1.05 - 0.04 * (z - 4) + 0.9 * Math.sin(z * 0.12), z]);
      const v = [], idx = [];
      pts.forEach(([x, z], i) => {
        const w = 0.75 - Math.min(0.15, i * 0.004);
        v.push(x - w, H(x - w, z) + 0.06, z, x + w, H(x + w, z) + 0.06, z);
        if (i) { const a = (i - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
      });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(v), 3)); g.setIndex(idx); g.computeVertexNormals(); return { g, pts };
    }, []);
    const markers = useMemo(() => {
      const a = []; path.pts.forEach(([x, z], i) => { if (i % 4 === 1 && i > 1) { const s = i % 8 === 1 ? 1 : -1; a.push({ p: [x + s * (1.0 + rnd(i) * 0.4), H(x, z) + 0.12, z], s: [0.14, 0.2, 0.12], ry: rnd(i * 2) * 3 }); } }); return a;
    }, [path]);

    const CX = 1, CZ = 19;
    const ring = useMemo(() => {
      const a = [];
      for (let i = 0; i < 46; i++) { const t = (i / 46) * Math.PI * 2 + rnd(i) * 0.05; const x = CX + Math.cos(t) * 5.2, z = CZ + Math.sin(t) * 2.6; a.push({ p: [x, H(x, z) + 0.05, z], s: [0.2 + rnd(i * 3) * 0.14, 0.09 + rnd(i * 5) * 0.06, 0.16 + rnd(i * 7) * 0.1], ry: rnd(i * 9) * 6, c: '#f1efe9' }); }
      for (let i = 0; i < 12; i++) { const t = Math.PI * (0.1 + 0.8 * i / 11); const dx = Math.cos(t) * 2.4, dz = -Math.sin(t) * 0.9 + 0.2; a.push({ p: [CX + dx, H(CX + dx, CZ + dz) + 0.05, CZ + dz], s: [0.26, 0.11, 0.2], ry: i, c: '#f4f2ec' }); }
      return a;
    }, []);
    const earthDisc = useMemo(() => ({ y: H(CX, CZ) + 0.04 }), []);

    /* fence along the plateau edge */
    const fence = useMemo(() => {
      const posts = [], rails = [];
      const run = (x0, x1, zf, step) => {
        let prev = null;
        for (let x = x0; x <= x1 + 0.01; x += step) {
          const z = zf(x), y = H(x, z); posts.push({ p: [x, y + 0.65, z], s: [0.12, 1.3, 0.12] });
          if (prev) for (const hh of [0.5, 1.0]) { const a = [prev[0], prev[1] + hh, prev[2]], b = [x, y + hh, z]; rails.push({ p: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], s: [0.07, 0.07, Math.hypot(b[0] - a[0], b[2] - a[2])], look: b }); }
          prev = [x, y, z];
        }
      };
      run(-48, 30, (x) => -17 + 2.2 * Math.sin(x * 0.08), 3);
      run(-23, -20, () => 3.0, 1.5);
      return { posts, rails };
    }, []);

    const firs = useMemo(() => {
      const list = [[-3, -10, 15], [4, -9, 16], [13, -8, 15], [-9, -10, 14], [20, -9, 13], [-16, -9, 10], [-26, -4, 9], [-22, 4, 7]];
      let tries = 0;
      while (list.length < 70 && tries < 900) {
        tries++;
        const x = (rnd(tries * 1.3) - 0.5) * 210, z = (rnd(tries * 2.9 + 7) - 0.65) * 190;
        const r = Math.hypot(x, z);
        if (r < 35 || r > 105) continue;
        if (z > -8 && Math.abs(x) < 40 && z < 75) continue;
        if (z > 40 && Math.abs(x) < 70) continue;
        if (Math.hypot(x + 24, z + 12) < 7) continue;
        if (z > -14 && Math.abs(x) < 24) continue;
        list.push([x, z, 8 + rnd(tries * 4.7) * 5 + (r > 60 ? 4 : 0)]);
      }
      return list;
    }, []);
    const layers = useMemo(() => {
      const bf = [0.1, 0.32, 0.53, 0.72], hf = [0.42, 0.36, 0.3, 0.26], rf = [1, 0.78, 0.56, 0.36];
      const col = new THREE.Color();
      return bf.map((b, li) => firs.map(([x, z, Hh], i) => {
        const y0 = H(x, z) - 0.3, R = Hh * 0.17;
        col.setHSL(0.38 + rnd(i * 1.7) * 0.04, 0.34, 0.075 + rnd(i * 2.3) * 0.05);
        return { p: [x, y0 + Hh * (b + hf[li] / 2), z], s: [R * rf[li], Hh * hf[li], R * rf[li]], ry: rnd(i + li) * 6, c: `#${col.getHexString()}` };
      }));
    }, [firs]);
        const trunks = useMemo(() => firs.map(([x, z, Hh]) => ({ p: [x, H(x, z) - 0.3 + Hh * 0.14, z], s: [0.28 + Hh * 0.012, Hh * 0.28, 0.28 + Hh * 0.012] })), [firs]);

    const OX = -24, OZ = -12, oy = H(OX, OZ);
    const bare = [11, -4.5];
    const by = H(bare[0], bare[1]);
    const barkM = pm('#6b5d52');

    return (
      <group>
        <mesh geometry={ground} receiveShadow><meshStandardMaterial vertexColors roughness={1} /></mesh>
        {/* dirt path with white marker stones */}
        <mesh geometry={path.g} material={pm('#7c5d43', { roughness: 1 })} receiveShadow />
        <Inst geo={unitRock} mat={pm('#f1efe9')} items={markers} />
        {/* white stone circle on the lawn, bare earth inside */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[CX, earthDisc.y, CZ]} scale={[1.3, 0.65, 1]} receiveShadow material={pm('#8a6b4f', { roughness: 1 })}><circleGeometry args={[4.0, 40]} /></mesh>
        <Inst geo={unitRock} mat={pm('#ffffff')} items={ring} />
        {/* rail fence */}
        <Inst geo={unitBox} mat={pm('#6e5a46')} items={fence.posts} />
        <Inst geo={unitBox} mat={pm('#7a6550')} items={fence.rails} cast={false} />
        {/* dark timber outbuilding with grey metal roof, left rear */}
        <group position={[OX, oy, OZ]} rotation={[0, 0.12, 0]}>
          <Bx s={[5, 2.6, 3.4]} p={[0, 1.3, 0]} m={tm('planks', 3, 1)} />
          <Bx s={[5.6, 0.08, 2.35]} p={[0, 3.2, 0.9]} r={[0.45, 0, 0]} m={tm('corrugGrey', 1, 1, { color: '#ffffff' })} />
          <Bx s={[5.6, 0.08, 2.35]} p={[0, 3.2, -0.9]} r={[-0.45, 0, 0]} m={tm('corrugGrey', 1, 1, { color: '#ffffff' })} />
          <Bx s={[0.9, 1.8, 0.1]} p={[-0.8, 0.9, 1.72]} m={pm('#241b16')} />
          <Bx s={[0.8, 0.7, 0.1]} p={[1.2, 1.5, 1.72]} m={pm('#241b16')} />
        </group>
        {/* bare tree right of the house */}
        <group position={[bare[0], by, bare[1]]}>
          <mesh material={barkM} position={[0, 2.2, 0]} castShadow><cylinderGeometry args={[0.1, 0.2, 4.4, 6]} /></mesh>
          {[[0.7, 4.2, 0.1, 0.9], [-0.6, 4.4, 0.2, -0.8], [0.2, 5.0, -0.5, 0.3], [-0.3, 3.4, 0.6, -0.9], [0.5, 3.0, -0.4, 1.0], [0, 5.6, 0.2, -0.2]].map(([x, y, z, t], i) => (
            <mesh key={i} material={barkM} position={[x * 0.9, y, z]} rotation={[0.2, 0, -t]} castShadow><cylinderGeometry args={[0.025, 0.07, 2.2, 5]} /></mesh>
          ))}
        </group>
        {[[-7, -16, 3.6, 1.0], [9, -17, 4, 1.2], [25, -15, 3.4, 0.9]].map(([x, z, r, h], i) => (
          <mesh key={'em' + i} position={[x, H(x, z) + h * 0.15, z]} scale={[r, h, r * 0.8]} material={pm('#8e6246', { roughness: 1 })} receiveShadow><sphereGeometry args={[1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
        ))}
        {/* dark firs ringing the meadow */}
        <Inst geo={unitCyl} mat={pm('#4a3a2e')} items={trunks} />
        {layers.map((it, i) => <Inst key={i} geo={unitCone} mat={pm('#ffffff', { roughness: 1 })} items={it} />)}
        {/* faint snow peaks on the far horizon */}
        {[[-70, -150, 80, 16], [10, -160, 100, 20], [85, -150, 70, 14]].map(([x, z, r, h], i) => (
          <mesh key={i} position={[x, h / 2 - 2, z]} material={pm('#a9b6c4', { roughness: 1 })}><coneGeometry args={[r, h, 6]} /></mesh>
        ))}
      </group>
    );
  }

  return { 'khaptad-baba-ashram': { Main: KhaptadMain, Env: KhaptadEnv } };
}
