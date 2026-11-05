// Charumati (Chabahil) Stupa, Kathmandu: a small, WIDE, LOW whitewashed dome (weathered grey-green, orange stain at the top)
// on a ~1 m drum with a pale balustrade and a ring of dark prayer wheels; a brass harmika with Buddha eyes, third eye and
// spiral nose, a red/yellow/blue + green-fringed valance, a block of three gilt Buddhas and 13 SQUARE steps, a small second
// valance, a ribbed cap and a pinnacle; dense prayer-flag strings fanning to the ground; grey Licchavi chaityas around the
// base; black iron fence and Ring Road in front; irregular concrete shop blocks, trees, wires and a small brick vihara.
// Scale: 1 unit is about 1.5 m (dome 10 units = 15 m across).
export default function make(K) {
  const { useM, Box, Cyl, Ball, Frame, Tree, Roof, Gajur, roofMat, THREE, useMemo } = K;

  const TAU = Math.PI * 2;
  const hash = (i, j = 0) => { const s = Math.sin(i * 127.1 + j * 311.7 + 7.7) * 43758.5453; return s - Math.floor(s); };
  const n1 = (x, j = 0) => { const i = Math.floor(x); const f = x - i; const u = f * f * (3 - 2 * f); return hash(i, j) * (1 - u) + hash(i + 1, j) * u; };
  const FLAGC = ['#2f6db5', '#f4f1e8', '#c8352b', '#2e9a5c', '#f0c23a'];

  /* ---------- shared materials ---------- */
  const cache = {};
  const mat = (c, o = {}) => { const k = c + JSON.stringify(o); if (!cache[k]) cache[k] = new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, ...o }); return cache[k]; };
  const BRASS = { roughness: 0.55, metalness: 0.45 };
  const brass = () => mat('#8a6a30', BRASS);
  const brassD = () => mat('#6f5424', BRASS);
  const brassL = () => mat('#9c7c3c', BRASS);

  /* ---------- day / dusk switch (the page background tells us which) ---------- */
  const duskItems = new Set();
  let lastDusk = null;
  const applyDusk = (d) => {
    duskItems.forEach((it) => {
      if (it.k === 'emi') it.m.emissiveIntensity = d ? it.v : 0;
      else if (it.k === 'vis') it.m.visible = d;
      else if (it.k === 'col') it.m.color.set(d ? it.n : it.d);
      else if (it.k === 'light') it.l.intensity = d ? it.v : 0;
    });
  };
  const probe = (rd, sc) => {
    const b = sc.background;
    const d = !!(b && b.isColor && b.r + b.g + b.b < 1.2);
    if (d !== lastDusk) { lastDusk = d; applyDusk(d); }
  };
  function DuskProbe() {
    return (
      <mesh position={[0, -0.6, 0]} frustumCulled={false} renderOrder={-1000} onBeforeRender={probe}>
        <boxGeometry args={[0.01, 0.01, 0.01]} />
        <meshBasicMaterial colorWrite={false} depthWrite={false} />
      </mesh>
    );
  }
  const Light = ({ p, v, dist = 14 }) => (
    <pointLight position={p} intensity={0} distance={dist} decay={2} color="#ffb766" ref={(l) => { if (l) { duskItems.forEach((it) => { if (it.l === l) duskItems.delete(it); }); duskItems.add({ k: 'light', l, v }); if (lastDusk !== null) applyDusk(lastDusk); } }} />
  );

  /* ---------- generic instancing ---------- */
  function Inst({ n, mat: m, place, children, cast = true }) {
    const set = (im) => {
      if (!im) return;
      const o = new THREE.Object3D();
      for (let i = 0; i < n; i += 1) {
        const q = place(i);
        o.position.set(q.p[0], q.p[1], q.p[2]);
        o.rotation.set(0, q.r || 0, 0);
        o.scale.set(...(q.s || [1, 1, 1]));
        o.updateMatrix();
        im.setMatrixAt(i, o.matrix);
      }
      im.instanceMatrix.needsUpdate = true;
    };
    return <instancedMesh ref={set} args={[null, null, n]} material={m} castShadow={cast} receiveShadow frustumCulled={false}>{children}</instancedMesh>;
  }

  /* ---------- canvas textures ---------- */
  const tex = (c, rx = 1, ry = 1) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; };

  function drawEye(g, cx, cy, s) {
    g.save(); g.translate(cx, cy); g.scale(s, 1);
    // brow
    g.lineCap = 'round';
    g.strokeStyle = '#0d0d18'; g.lineWidth = 22;
    g.beginPath(); g.moveTo(-84, -34); g.quadraticCurveTo(-10, -92, 84, -30); g.stroke();
    g.strokeStyle = '#2a58b5'; g.lineWidth = 12;
    g.beginPath(); g.moveTo(-82, -34); g.quadraticCurveTo(-10, -88, 82, -30); g.stroke();
    // eye almond
    g.beginPath(); g.moveTo(-72, 8); g.bezierCurveTo(-40, -40, 30, -44, 74, 14); g.bezierCurveTo(30, 44, -36, 38, -72, 8); g.closePath();
    g.fillStyle = '#f6f3ea'; g.fill();
    g.save(); g.clip();
    g.beginPath(); g.arc(4, 8, 24, 0, TAU); g.fillStyle = '#2c5ab8'; g.fill();
    g.beginPath(); g.arc(4, 8, 11, 0, TAU); g.fillStyle = '#0a0a12'; g.fill();
    g.restore();
    g.strokeStyle = '#0d0d18'; g.lineWidth = 8;
    g.beginPath(); g.moveTo(-72, 8); g.bezierCurveTo(-40, -40, 30, -44, 74, 14); g.stroke();
    g.strokeStyle = '#2a58b5'; g.lineWidth = 9;
    g.beginPath(); g.moveTo(-72, 10); g.bezierCurveTo(-36, 40, 30, 46, 74, 16); g.stroke();
    g.restore();
  }
  function faceTexture() {
    const c = document.createElement('canvas'); c.width = 512; c.height = 512;
    const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#8b6b30'); gr.addColorStop(1, '#6f5324');
    g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 160; i += 1) { g.fillStyle = `rgba(${hash(i) > 0.5 ? '30,20,5' : '190,150,70'},0.06)`; g.fillRect(hash(i, 2) * 512, hash(i, 3) * 300, 2 + hash(i, 4) * 3, 60 + hash(i, 5) * 260); }
    // carved side panels
    for (const x0 of [10, 438]) {
      g.fillStyle = '#b8924a'; g.fillRect(x0, 70, 64, 430);
      g.strokeStyle = '#5a4118'; g.lineWidth = 3; g.strokeRect(x0 + 2, 72, 60, 426);
      for (let y = 92; y < 480; y += 30) {
        g.strokeStyle = '#6a4d1c'; g.lineWidth = 3; g.strokeRect(x0 + 14, y, 36, 22);
        g.fillStyle = '#d8b660'; g.beginPath(); g.arc(x0 + 32, y + 11, 6, 0, TAU); g.fill();
      }
    }
    g.fillStyle = '#c9a458'; g.fillRect(84, 496, 344, 6);
    drawEye(g, 166, 318, 1); drawEye(g, 346, 318, -1);
    // third eye
    g.beginPath(); g.ellipse(256, 215, 22, 31, 0, 0, TAU); g.fillStyle = '#f0ede2'; g.fill();
    g.lineWidth = 6; g.strokeStyle = '#0d0d18'; g.stroke();
    g.beginPath(); g.ellipse(256, 217, 13, 20, 0, 0, TAU); g.fillStyle = '#2a58b5'; g.fill();
    g.beginPath(); g.arc(256, 218, 5, 0, TAU); g.fillStyle = '#0a0a12'; g.fill();
    // spiral nose
    const spiral = (w, col) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); for (let a = 0; a <= TAU * 2.4; a += 0.15) { const r = 3 + a * 3.9; const x = 256 + Math.cos(a - 1) * r; const y = 372 + Math.sin(a - 1) * r * 0.95; if (a === 0) g.moveTo(x, y); else g.lineTo(x, y); } g.stroke(); };
    spiral(17, '#0d0d18'); spiral(9, '#e8eef2');
    return tex(c);
  }
  function blockTexture() {
    const c = document.createElement('canvas'); c.width = 384; c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#8c6c30'; g.fillRect(0, 0, 384, 128);
    for (let i = 0; i < 3; i += 1) {
      const x = 64 + i * 128;
      g.fillStyle = '#2e2010'; g.beginPath(); g.moveTo(x - 30, 112); g.lineTo(x - 30, 52); g.quadraticCurveTo(x, 6, x + 30, 52); g.lineTo(x + 30, 112); g.fill();
      g.strokeStyle = '#c9a458'; g.lineWidth = 4; g.stroke();
      g.fillStyle = '#d9b559'; g.beginPath(); g.arc(x, 52, 11, 0, TAU); g.fill();
      g.beginPath(); g.moveTo(x - 24, 108); g.quadraticCurveTo(x - 20, 66, x, 64); g.quadraticCurveTo(x + 20, 66, x + 24, 108); g.fill();
    }
    return tex(c);
  }
  function pleatTexture() {
    const c = document.createElement('canvas'); c.width = 128; c.height = 32;
    const g = c.getContext('2d');
    for (let i = 0; i < 16; i += 1) { g.fillStyle = i % 2 ? '#1f7a43' : '#2f9a58'; g.fillRect(i * 8, 0, 8, 32); }
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 26, 128, 6);
    return tex(c, 4, 1);
  }

  /* ---------- the dome: lathe with weathering painted into vertex colours ---------- */
  const R = 5.0, SY = 0.8, DY = 1.1, CUT = 0.9;
  function Dome() {
    const geo = useMemo(() => {
      const pts = [];
      const phiMax = Math.acos(CUT / R);
      for (let i = 0; i <= 44; i += 1) { const ph = (i / 44) * phiMax; pts.push(new THREE.Vector2(R * Math.cos(ph), R * SY * Math.sin(ph))); }
      const g = new THREE.LatheGeometry(pts, 112);
      const pos = g.attributes.position; const col = [];
      for (let i = 0; i < pos.count; i += 1) {
        const x = pos.getX(i); const y = pos.getY(i); const z = pos.getZ(i);
        const az = Math.atan2(x, z);
        const hf = Math.min(1, y / (R * SY));
        const streak = 0.55 * n1(az * 17 + 3, 1) + 0.45 * n1(az * 41, 2);
        const patch = n1(x * 0.7 + 10, 5) * n1(z * 0.7 + 4, 6) * n1(y * 0.9, 7);
        const low = Math.pow(Math.max(0, 1 - hf / 0.62), 1.2);
        let moss = Math.min(1, low * (0.5 + 0.7 * streak) * 1.25 + patch * 0.2 * (1 - hf));
        moss = Math.max(0, moss - 0.04);
        let r = 0.94, gg = 0.93, b = 0.89;
        const mr = 0.38, mg = 0.48, mb = 0.32;
        r += (mr - r) * moss * 1.0; gg += (mg - gg) * moss * 1.0; b += (mb - b) * moss * 1.0;
        // orange wash dripping from the top
        const len = 0.1 + 0.34 * n1(az * 13, 9) + 0.1 * n1(az * 37, 3);
        const o = Math.max(0, Math.min(1, (hf - (1 - len)) / 0.12)) * 0.85;
        r += (0.82 - r) * o; gg += (0.46 - gg) * o; b += (0.16 - b) * o;
        col.push(r, gg, b);
      }
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      return g;
    }, []);
    return <mesh geometry={geo} position={[0, DY, 0]} material={mat('#ffffff', { vertexColors: true, side: THREE.DoubleSide, roughness: 0.96 })} castShadow receiveShadow />;
  }

  /* ---------- Adi-Buddha niche on the dome ---------- */
  function Niche({ az }) {
    const phi = 0.66;
    const x = R * Math.cos(phi); const y = DY + R * SY * Math.sin(phi);
    const el = Math.atan2(R * SY * Math.sin(phi) / (R * SY * R * SY), R * Math.cos(phi) / (R * R));
    return (
      <group rotation={[0, az, 0]}>
        <group position={[0, y, x]} rotation={[-el, 0, 0]}>
          <Box s={[0.8, 1.0, 0.14]} p={[0, 0, -0.03]} m={mat('#cfc9bb')} />
          <Box s={[0.62, 0.82, 0.14]} p={[0, 0, 0.0]} m={mat('#4a3a26')} />
          <Ball rad={0.09} p={[0, 0.16, 0.08]} m={mat('#c9a456', { metalness: 0.5, roughness: 0.5 })} />
          <Box s={[0.26, 0.2, 0.08]} p={[0, -0.04, 0.08]} m={mat('#c9a456', { metalness: 0.5, roughness: 0.5 })} />
          <Box s={[0.9, 0.06, 0.2]} p={[0, -0.52, 0.0]} m={mat('#b9b2a4')} />
        </group>
      </group>
    );
  }

  /* ---------- harmika, valance, block and 13 square tiers ---------- */
  const HY0 = 5.15, HH = 2.4, HW = 2.6, BH = 0.8, TH = 0.30, W0 = 2.2, W1 = 0.6, BW = 2.1;
  const T0 = HY0 + HH + 0.4 + BH;
  function Spire() {
    const face = useMemo(() => faceTexture(), []);
    const blk = useMemo(() => blockTexture(), []);
    const pleat = useMemo(() => pleatTexture(), []);
    const faceM = mat('#ffffff', { map: face, roughness: 0.7, metalness: 0.2 });
    const topM = brassD();
    const harmMats = [faceM, faceM, topM, topM, faceM, faceM];
    const blkM = mat('#ffffff', { map: blk, roughness: 0.7, metalness: 0.2 });
    const blkMats = [blkM, blkM, brassD(), brassD(), blkM, blkM];
    const skirtM = mat('#ffffff', { map: pleat, roughness: 0.9, side: THREE.DoubleSide });
    const red = mat('#c42b22', { roughness: 0.7 }); const yel = mat('#f0b92a', { roughness: 0.7 }); const blu = mat('#244fa6', { roughness: 0.7 });
    const yTop = HY0 + HH;
    const bY = yTop + 0.4;           // top of stripes
    const t0 = T0;
    const tiers = Array.from({ length: 13 }, (_, i) => ({ w: W0 - (i * (W0 - W1)) / 12, y: t0 + i * TH }));
    const yTiers = t0 + 13 * TH;
    const capGeo = useMemo(() => {
      const pts = [];
      for (let i = 0; i <= 22; i += 1) {
        const t = i / 22; const y = t * 0.5;
        const r = 0.56 * Math.sqrt(Math.max(0, 1 - t * t)) * (1 + 0.07 * Math.sin(i * 2.4));
        pts.push(new THREE.Vector2(Math.max(r, 0.001), y));
      }
      return new THREE.LatheGeometry(pts, 20);
    }, []);
    return (
      <group>
        {/* whitewashed collar so the cube never floats */}
        <Cyl rt={1.75} rb={2.0} h={0.5} p={[0, HY0 - 0.22, 0]} m={mat('#efe9dc')} seg={28} />
        {/* gilded cube with eyes on all four faces */}
        <mesh position={[0, HY0 + HH / 2, 0]} material={harmMats} castShadow receiveShadow><boxGeometry args={[HW, HH, HW]} /></mesh>
        {/* valance: flared pleated green fringe and striped band */}
        <mesh position={[0, yTop - 0.33, 0]} rotation={[0, Math.PI / 4, 0]} material={skirtM} castShadow><cylinderGeometry args={[(HW / 2 + 0.08) * 1.414, (HW / 2 + 0.36) * 1.414, 0.7, 4, 1, true]} /></mesh>
        {[[red, 0], [yel, 1], [blu, 2], [yel, 3]].map(([m, i]) => <Box key={i} s={[HW + 0.2 - i * 0.01, 0.1, HW + 0.2 - i * 0.01]} p={[0, yTop + 0.05 + i * 0.1, 0]} m={m} cast={false} />)}
        {/* block with three seated Buddhas on each face */}
        <mesh position={[0, bY + BH / 2, 0]} material={blkMats} castShadow><boxGeometry args={[BW, BH, BW]} /></mesh>
        {/* 13 square tiers */}
        {tiers.map((t, i) => (
          <group key={i}>
            <Box s={[t.w + 0.14, 0.045, t.w + 0.14]} p={[0, t.y + 0.022, 0]} m={brassD()} cast={false} />
            <Box s={[t.w, TH - 0.045, t.w]} p={[0, t.y + 0.045 + (TH - 0.045) / 2, 0]} m={i % 2 ? brassD() : mat('#7d6129', BRASS)} />
          </group>
        ))}
        {[[3,0],[5,1],[7,2],[8,3],[9,0],[10,1],[4,2],[6,3],[11,2],[2,1]].map(([k, c], i) => { const t = tiers[k]; const a = c * Math.PI / 2 + 0.7; return <Box key={'pg' + i} s={[0.1, 0.09, 0.15]} p={[Math.sin(a) * t.w * 0.38, t.y + 0.1, Math.cos(a) * t.w * 0.38]} r={[0, a, 0]} m={mat(i % 2 ? '#8e9094' : '#b4b3ae')} cast={false} />; })}
        {Array.from({ length: 22 }, (_, i) => { const a = (i % 4) * Math.PI / 2; const k = 1 + Math.floor(hash(i, 4) * 10); const t = tiers[k]; const off = (hash(i, 5) - 0.5) * t.w * 0.7; const hh = 0.3 + hash(i, 6) * 0.5; const f = t.w / 2 + 0.01; const px = Math.cos(a) * off + Math.sin(a) * f; const pz = -Math.sin(a) * off + Math.cos(a) * f; return <Box key={'sk' + i} s={[0.05, hh, 0.02]} p={[px, t.y + 0.2 + hh / 2 - 0.1, pz]} r={[0, a, 0]} m={mat('#2f230e')} cast={false} />; })}
        {/* second small valance, ribbed cap, pinnacle */}
        <mesh position={[0, yTiers + 0.16, 0]} rotation={[0, Math.PI / 4, 0]} material={skirtM}><cylinderGeometry args={[0.36 * 1.414, 0.62 * 1.414, 0.34, 4, 1, true]} /></mesh>
        {[red, yel, blu].map((m, i) => <Box key={i} s={[0.78, 0.05, 0.78]} p={[0, yTiers + 0.345 + i * 0.05, 0]} m={m} cast={false} />)}
        <mesh geometry={capGeo} position={[0, yTiers + 0.5, 0]} material={brassL()} castShadow />
        <Cyl rt={0.07} rb={0.1} h={0.18} p={[0, yTiers + 1.1, 0]} m={brassL()} seg={10} />
        <Ball rad={0.1} p={[0, yTiers + 1.27, 0]} m={brassL()} />
        <mesh position={[0, yTiers + 1.5, 0]} material={brassL()}><coneGeometry args={[0.045, 0.34, 8]} /></mesh>
      </group>
    );
  }
  const TOP = T0 + 13 * TH + 1.5;

  /* ---------- prayer flags: strings fan from the spire top to the ground ---------- */
  function Flags() {
    const NS = 36, NF = 16;
    const data = useMemo(() => {
      const lines = []; const items = []; const poles = [];
      const top = T0 + 10 * TH + 0.1;
      for (let s = 0; s < NS + 5; s += 1) {
        const front = s >= NS;
        let az = front ? -0.45 + (s - NS) * (1.5 / 4) + (hash(s) - 0.5) * 0.12 : (s / NS) * TAU + (hash(s) - 0.5) * 0.14;
        if (az > Math.PI) az -= TAU;
        if (!front && az > -0.55 && az < 1.2) continue;
        const re = front ? 8.2 + 1.2 * hash(s, 3) : 8 + 7.5 * hash(s, 3) * hash(s, 11) + 2 * hash(s, 12);
        const ye = front ? 3.0 + 1.0 * hash(s, 4) : 0.5 + 0.8 * hash(s, 4) + (hash(s, 8) > 0.7 ? 1.6 : 0);
        if (front) poles.push({ x: Math.sin(az) * re, z: Math.cos(az) * re, h: ye + 0.3 });
        const nf = front ? 7 : NF - Math.floor(hash(s, 13) * 5);
        const a = new THREE.Vector3(Math.sin(az) * 0.12, top - 0.1 * hash(s, 9), Math.cos(az) * 0.12);
        const b = new THREE.Vector3(Math.sin(az) * re, ye, Math.cos(az) * re);
        const P = (t) => new THREE.Vector3().lerpVectors(a, b, t).add(new THREE.Vector3(0, -Math.sin(Math.PI * t) * 1.2, 0));
        let prev = P(0);
        for (let k = 1; k <= 18; k += 1) { const q = P(k / 18); lines.push(prev.x, prev.y, prev.z, q.x, q.y, q.z); prev = q; }
        for (let k = 0; k < nf; k += 1) {
          const t = 0.16 + 0.82 * ((k + 0.5) / nf);
          const p = P(t); const T = P(t + 0.01).sub(P(t - 0.01)).normalize();
          const Z = new THREE.Vector3().crossVectors(T, new THREE.Vector3(0, 1, 0)).normalize();
          const Y = new THREE.Vector3().crossVectors(Z, T).normalize();
          const m = new THREE.Matrix4().makeBasis(T, Y, Z);
          m.setPosition(p.x - Y.x * 0.16, p.y - Y.y * 0.16, p.z - Y.z * 0.16);
          items.push({ m, c: FLAGC[(k + s * 2) % 5] });
        }
      }
      const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3));
      return { lg, items, poles };
    }, []);
    const set = (im) => {
      if (!im) return;
      const c = new THREE.Color();
      data.items.forEach((it, i) => { im.setMatrixAt(i, it.m); c.set(it.c); im.setColorAt(i, c); });
      im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
    };
    return (
      <group>
        <lineSegments geometry={data.lg}><lineBasicMaterial color="#e9e2d2" /></lineSegments>
        {data.poles.map((q, i) => <Cyl key={i} rt={0.035} rb={0.05} h={q.h} p={[q.x, q.h / 2, q.z]} m={mat('#6b5a3c')} seg={5} cast={false} />)}
        <instancedMesh ref={set} args={[null, null, data.items.length]} frustumCulled={false}>
          <planeGeometry args={[0.42, 0.32]} />
          <meshStandardMaterial side={THREE.DoubleSide} roughness={0.9} />
        </instancedMesh>
      </group>
    );
  }

  /* ---------- Licchavi stone chaitya ---------- */
  function LChaitya({ p, s = 1, r = 0 }) {
    const g1 = mat('#a9a69d', { roughness: 0.95 }); const g2 = mat('#98958c', { roughness: 0.95 }); const g3 = mat('#bab6ab', { roughness: 0.95 });
    return (
      <group position={p} rotation={[0, r, 0]} scale={s}>
        <Box s={[0.95, 0.12, 0.95]} p={[0, 0.06, 0]} m={g2} />
        <Box s={[0.78, 0.16, 0.78]} p={[0, 0.2, 0]} m={g1} />
        <Cyl rt={0.31} rb={0.33} h={0.24} p={[0, 0.4, 0]} m={g3} seg={16} />
        {[0, 1, 2, 3].map((i) => <Box key={i} s={[0.1, 0.14, 0.06]} p={[Math.sin(i * Math.PI / 2) * 0.32, 0.4, Math.cos(i * Math.PI / 2) * 0.32]} r={[0, i * Math.PI / 2, 0]} m={mat('#3a3834')} cast={false} />)}
        <Ball rad={0.29} sc={[1, 0.82, 1]} p={[0, 0.52, 0]} m={g1} />
        <Box s={[0.2, 0.2, 0.2]} p={[0, 0.82, 0]} m={g3} />
        {[0, 1, 2, 3, 4].map((i) => <Cyl key={i} rt={0.115 - i * 0.015} rb={0.125 - i * 0.015} h={0.08} p={[0, 0.96 + i * 0.075, 0]} m={g1} seg={10} />)}
        <Ball rad={0.04} p={[0, 1.37, 0]} m={brassL()} />
      </group>
    );
  }

  /* ---------- the stupa and its courtyard features ---------- */
  function Main() {
    const M = useM();
    const dark = mat('#2b231d', { roughness: 0.6 });
    const pale = mat('#e0d8c8', { roughness: 0.9 });
    const NW = 84, NB = 64;
    return (
      <group>
        <Frame s={[19, 14.8, 19]} p={[0, 7.3, 0]} />
        <DuskProbe />
        {/* paved ring, platform, drum */}
        <Cyl rt={7.6} rb={7.6} h={0.07} p={[0, 0.035, 0]} m={mat('#a79e8c', { roughness: 1 })} seg={64} />
        <Cyl rt={5.15} rb={5.2} h={1.1} p={[0, 0.55, 0]} m={mat('#d8d2c4', { roughness: 0.95 })} seg={64} />
        <Cyl rt={5.2} rb={5.2} h={0.06} p={[0, 1.1, 0]} m={pale} seg={64} />
        {/* dark prayer wheels around the drum */}
        <Inst n={NW} mat={dark} place={(i) => { const a = (i / NW) * TAU; return { p: [Math.sin(a) * 5.32, 0.5, Math.cos(a) * 5.32] }; }}>
          <cylinderGeometry args={[0.1, 0.1, 0.5, 8]} />
        </Inst>
        <Inst n={NW} mat={brassD()} cast={false} place={(i) => { const a = (i / NW) * TAU; return { p: [Math.sin(a) * 5.32, 0.79, Math.cos(a) * 5.32] }; }}>
          <cylinderGeometry args={[0.105, 0.105, 0.05, 8]} />
        </Inst>
        {/* pale balustrade */}
        <Inst n={NB} mat={pale} place={(i) => { const a = (i / NB) * TAU; return { p: [Math.sin(a) * 5.7, 0.34, Math.cos(a) * 5.7], r: a }; }}>
          <boxGeometry args={[0.16, 0.68, 0.16]} />
        </Inst>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.72, 0]} material={pale}><torusGeometry args={[5.7, 0.06, 6, 96]} /></mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.4, 0]} material={pale}><torusGeometry args={[5.7, 0.04, 6, 96]} /></mesh>
        <Dome />
        {[0, 1, 2, 3].map((i) => <Niche key={i} az={i * Math.PI / 2} />)}
        <Spire />
        <Flags />
        {/* grey Licchavi chaityas: a few irregular small ones, two larger in the front corners */}
        {[[-8.4, 1.5, 0.9, 0.2], [8.6, -2.6, 1.1, 1.2], [-3.2, -8.0, 0.95, 2.4], [5.2, -7.4, 1.05, 0.7], [-7.0, -5.0, 0.85, 1.9]].map(([x, z, sc, r], i) => <LChaitya key={i} p={[x, 0, z]} r={r} s={sc} />)}
        <LChaitya p={[-7.0, 0, 7.6]} s={1.6} r={0.5} />
        <LChaitya p={[7.4, 0, 7.2]} s={1.6} r={-0.4} />
        {/* butter lamps on the platform */}
        <Inst n={4} mat={mat('#7a4a2a')} place={(i) => ({ p: [Math.sin(i * Math.PI / 2 + 0.3) * 6.1, 0.07, Math.cos(i * Math.PI / 2 + 0.3) * 6.1] })}>
          <cylinderGeometry args={[0.1, 0.07, 0.07, 8]} />
        </Inst>
        <DiyaFlames />
        <Light p={[0, 2.4, 8.5]} v={7} dist={13} />
      </group>
    );
  }
  function DiyaFlames() {
    const m = useMemo(() => { const x = new THREE.MeshBasicMaterial({ color: '#ffcf7a', toneMapped: false }); x.visible = false; duskItems.add({ k: 'vis', m: x }); if (lastDusk !== null) x.visible = lastDusk; return x; }, []);
    return (
      <Inst n={4} mat={m} cast={false} place={(i) => ({ p: [Math.sin(i * Math.PI / 2 + 0.3) * 6.1, 0.21, Math.cos(i * Math.PI / 2 + 0.3) * 6.1] })}>
        <coneGeometry args={[0.05, 0.14, 6]} />
      </Inst>
    );
  }

  /* ---------- concrete shop / house blocks with painted facades ---------- */
  const WALLS = ['#cdc6b8', '#d9c8ae', '#b8b3a9', '#dfd2bd', '#c2a796', '#c9cfc4', '#d6cdb9', '#b9a898'];
  const SHUT = ['#6a7f95', '#4f7f58', '#a24a3a', '#c9b04f', '#7b7f86', '#3a5f9a'];
  const SIGN = ['#c4382d', '#2d5ea8', '#e8c43a', '#2f8a58', '#f2efe6', '#d9772d'];
  function facade(seed, w, h, floors) {
    const S = 22; const cw = Math.max(64, Math.round(w * S)); const ch = Math.max(64, Math.round(h * S));
    const c = document.createElement('canvas'); c.width = cw; c.height = ch;
    const e = document.createElement('canvas'); e.width = cw; e.height = ch;
    const g = c.getContext('2d'); const ge = e.getContext('2d');
    const rnd = (k) => hash(seed * 31 + k, floors);
    g.fillStyle = WALLS[seed % WALLS.length]; g.fillRect(0, 0, cw, ch);
    ge.fillStyle = '#000'; ge.fillRect(0, 0, cw, ch);
    for (let i = 0; i < 40; i += 1) { g.fillStyle = `rgba(50,44,36,${0.04 + 0.05 * rnd(i + 90)})`; g.fillRect(rnd(i + 100) * cw, 0, 2 + rnd(i + 110) * 6, ch * (0.3 + 0.7 * rnd(i + 120))); }
    const fh = ch / floors; const cols = Math.max(2, Math.round(w / 2.4)); const cwid = cw / cols;
    for (let f = 0; f < floors; f += 1) {
      const y0 = f * fh;
      if (f === floors - 1) {
        for (let k = 0; k < cols; k += 1) {
          const x0 = k * cwid;
          g.fillStyle = SHUT[Math.floor(rnd(k + f * 9) * SHUT.length)]; g.fillRect(x0 + 3, y0 + fh * 0.38, cwid - 6, fh * 0.62);
          for (let yy = y0 + fh * 0.4; yy < y0 + fh; yy += 4) { g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(x0 + 3, yy, cwid - 6, 1); }
          const sg = SIGN[Math.floor(rnd(k + 40) * SIGN.length)];
          g.fillStyle = sg; g.fillRect(x0 + 2, y0 + fh * 0.06, cwid - 4, fh * 0.28);
          g.fillStyle = 'rgba(255,255,255,0.85)'; for (let t = 0; t < 4; t += 1) g.fillRect(x0 + 6 + t * (cwid - 12) / 4, y0 + fh * 0.14, (cwid - 12) / 4 - 3, fh * 0.1);
          ge.fillStyle = '#ffd9a0'; ge.fillRect(x0 + 2, y0 + fh * 0.06, cwid - 4, fh * 0.28);
          if (rnd(k + 60) > 0.5) { ge.fillStyle = '#ffcf80'; ge.fillRect(x0 + 6, y0 + fh * 0.4, cwid - 12, fh * 0.3); }
        }
      } else {
        for (let k = 0; k < cols; k += 1) {
          const x0 = k * cwid; const wx = x0 + cwid * 0.2; const ww = cwid * 0.6; const wy = y0 + fh * 0.2; const wh = fh * 0.52;
          g.fillStyle = '#ece6d8'; g.fillRect(wx - 2, wy - 2, ww + 4, wh + 4);
          g.fillStyle = rnd(k + f * 13) > 0.7 ? '#8a6a4a' : '#26394d'; g.fillRect(wx, wy, ww, wh);
          g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(wx + ww / 2 - 0.5, wy, 1, wh);
          if (rnd(k + f * 17 + 5) > 0.45) { ge.fillStyle = rnd(k + f * 7) > 0.5 ? '#ffd68a' : '#ffe9bd'; ge.fillRect(wx, wy, ww, wh); }
          if (rnd(k + f * 5 + 2) > 0.55) { g.fillStyle = '#6d675d'; g.fillRect(x0 + 2, y0 + fh * 0.82, cwid - 4, 3); for (let r = 0; r < 8; r += 1) g.fillRect(x0 + 4 + r * (cwid - 8) / 8, y0 + fh * 0.74, 1, fh * 0.1); }
        }
      }
      g.fillStyle = '#8c877c'; g.fillRect(0, y0, cw, 3);
    }
    return { map: tex(c), emi: tex(e) };
  }
  function Block({ p, w, d, floors, seed, r = 0, sign }) {
    const FH = 1.7 + 0.65 * hash(seed, 3); const h = floors * FH;
    const { mats, emis } = useMemo(() => {
      const a = facade(seed, w, h, floors); const b = facade(seed + 5, d, h, floors);
      const mk = (f) => { const m = new THREE.MeshStandardMaterial({ map: f.map, emissiveMap: f.emi, emissive: '#ffffff', emissiveIntensity: 0, roughness: 0.92 }); duskItems.add({ k: 'emi', m, v: 1.25 }); return m; };
      const ma = mk(a); const mb = mk(b);
      if (lastDusk) applyDusk(true);
      return { mats: [mb, mb, mat('#8d8a82'), mat('#8d8a82'), ma, ma], emis: null };
    }, [seed, w, d, floors, h]);
    return (
      <group position={[p[0] + (hash(seed, 1) - 0.5) * 4, p[1], p[2] + (hash(seed, 2) - 0.5) * 4]} rotation={[0, r, 0]}>
        <mesh position={[0, h / 2, 0]} material={mats} castShadow receiveShadow><boxGeometry args={[w, h, d]} /></mesh>
        <Box s={[w + 0.3, 0.22, d + 0.3]} p={[0, h + 0.11, 0]} m={mat('#9a968c')} />
        <Cyl rt={0.55} h={0.95} p={[-w * 0.28, h + 0.7, -d * 0.2]} m={mat('#26567f')} seg={12} />
        <Box s={[1.5, 1.2, 1.5]} p={[w * 0.28, h + 0.8, d * 0.15]} m={mat('#b2ada2')} />
        {sign && <Box s={[w * 0.6, 1.4, 0.16]} p={[0, h + 0.95, d / 2 - 0.4]} m={mat(sign, { roughness: 0.6 })} />}
      </group>
    );
  }

  /* ---------- Charumati Vihara: small square brick building with tiled roofs ---------- */
  function Vihara({ p, r }) {
    const M = useM();
    const brickM = M.mat('brick', 3, 2, { color: '#f1cdb4' });
    const wood = mat('#3b2616', { roughness: 0.7 });
    const tile = roofMat(M, 'clay-tile');
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[7.4, 0.3, 7.4]} p={[0, 0.15, 0]} m={M.stone} />
        <Box s={[6.4, 3.1, 6.4]} p={[0, 1.85, 0]} m={brickM} />
        <Box s={[1.5, 1.9, 0.2]} p={[0, 1.25, 3.25]} m={wood} />
        <Box s={[1.8, 0.2, 0.3]} p={[0, 2.25, 3.25]} m={brassL()} />
        {[-2.2, 2.2].map((x) => <Box key={x} s={[1.0, 0.9, 0.18]} p={[x, 1.8, 3.22]} m={wood} />)}
        {[-1.6, 0, 1.6].map((x) => <Box key={'u' + x} s={[0.9, 0.8, 0.18]} p={[x, 3.0, 3.22]} m={wood} />)}
        <Box s={[0.9, 0.8, 0.18]} p={[3.22, 2.9, 0]} r={[0, Math.PI / 2, 0]} m={wood} />
        <Box s={[0.9, 0.8, 0.18]} p={[-3.22, 2.9, 0]} r={[0, Math.PI / 2, 0]} m={wood} />
        <Roof w={7.8} d={7.8} h={1.5} y={3.4} m={tile} sag={1.25} />
        <Gajur y={4.95} s={0.6} />
      </group>
    );
  }

  /* ---------- lamp post, poles and wires ---------- */
  function LampPost({ p, face = 0 }) {
    const grey = mat('#5b5e61', { metalness: 0.5, roughness: 0.5 });
    const bulb = useMemo(() => { const m = new THREE.MeshStandardMaterial({ color: '#e8e4d8', emissive: '#ffe2a0', emissiveIntensity: 0 }); duskItems.add({ k: 'emi', m, v: 2.2 }); if (lastDusk) applyDusk(true); return m; }, []);
    return (
      <group position={p} rotation={[0, face, 0]}>
        <Cyl rt={0.08} rb={0.12} h={6.2} p={[0, 3.1, 0]} m={grey} seg={8} />
        <Box s={[1.5, 0.09, 0.09]} p={[0.7, 6.15, 0]} m={grey} />
        <Box s={[0.7, 0.14, 0.3]} p={[1.35, 6.05, 0]} m={bulb} />
        <Light p={[1.35, 5.7, 0]} v={26} dist={16} />
      </group>
    );
  }
  function Pole({ p, h = 7.6 }) {
    const conc = mat('#8f8c84', { roughness: 0.95 });
    return (
      <group position={p}>
        <Cyl rt={0.12} rb={0.19} h={h} p={[0, h / 2, 0]} m={conc} seg={8} />
        <Box s={[1.5, 0.1, 0.1]} p={[0, h - 0.3, 0]} m={mat('#3b3a37')} />
        <Box s={[1.3, 0.1, 0.1]} p={[0, h - 1.0, 0]} m={mat('#3b3a37')} />
      </group>
    );
  }
  function SignPole({ p, c, r = 0 }) {
    const grey = mat('#4f5256', { metalness: 0.5, roughness: 0.5 });
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Cyl rt={0.05} rb={0.06} h={3.4} p={[0, 1.7, 0]} m={grey} seg={6} />
        <Box s={[1.1, 0.5, 0.06]} p={[0.0, 3.2, 0]} m={mat(c, { roughness: 0.6 })} cast={false} />
        <Box s={[0.9, 0.08, 0.07]} p={[0, 3.2, 0.01]} m={mat('#f2efe6')} cast={false} />
        <Box s={[0.7, 0.5, 0.05]} p={[0.1, 2.5, 0]} m={mat('#e8e4d4')} cast={false} />
      </group>
    );
  }
  function Wires({ list }) {
    const g = useMemo(() => {
      const pts = [];
      list.forEach(([a, b, sag]) => {
        let prev = new THREE.Vector3(...a);
        for (let k = 1; k <= 14; k += 1) { const t = k / 14; const q = new THREE.Vector3().lerpVectors(new THREE.Vector3(...a), new THREE.Vector3(...b), t); q.y -= Math.sin(Math.PI * t) * sag; pts.push(prev.x, prev.y, prev.z, q.x, q.y, q.z); prev = q; }
      });
      const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); return bg;
    }, [list]);
    return <lineSegments geometry={g}><lineBasicMaterial color="#26262a" /></lineSegments>;
  }

  /* ---------- the road-side iron fence ---------- */
  function Fence() {
    const black = mat('#17171a', { roughness: 0.5, metalness: 0.4 });
    const bars = useMemo(() => { const a = []; for (let x = -23; x <= 23; x += 0.34) { if (x > -2.1 && x < 2.1) continue; a.push(x); } return a; }, []);
    return (
      <group position={[0, 0, 10.2]}>
        <Inst n={bars.length} mat={black} place={(i) => ({ p: [bars[i], 0.7, 0] })}><boxGeometry args={[0.05, 1.4, 0.05]} /></Inst>
        <Inst n={bars.length} mat={black} cast={false} place={(i) => ({ p: [bars[i], 1.48, 0] })}><coneGeometry args={[0.05, 0.16, 4]} /></Inst>
        {[[-12.5, 21], [12.5, 21]].map(([x, w], i) => <group key={i}><Box s={[w, 0.06, 0.06]} p={[x, 1.2, 0]} m={black} cast={false} /><Box s={[w, 0.06, 0.06]} p={[x, 0.3, 0]} m={black} cast={false} /></group>)}
        <Box s={[0.7, 0.35, 0.7]} p={[-2.4, 0.18, 0]} m={mat('#b6b0a4')} />
        <Box s={[0.7, 0.35, 0.7]} p={[2.4, 0.18, 0]} m={mat('#b6b0a4')} />
        {[-2.4, 2.4].map((x) => <Box key={x} s={[0.5, 1.9, 0.5]} p={[x, 1.3, 0]} m={mat('#c9c2b4')} />)}
        {[-2.4, 2.4].map((x) => <Ball key={x} rad={0.22} p={[x, 2.4, 0]} m={mat('#d8d2c4')} />)}
        {/* gate leaves, standing open */}
        {[-2.1, 2.1].map((x) => (
          <group key={x}>
            <Box s={[0.05, 0.06, 1.7]} p={[x, 1.25, 0.95]} m={black} cast={false} />
            <Box s={[0.05, 0.06, 1.7]} p={[x, 0.3, 0.95]} m={black} cast={false} />
            {Array.from({ length: 6 }, (_, i) => <Box key={i} s={[0.04, 1.3, 0.04]} p={[x, 0.75, 0.2 + i * 0.3]} m={black} cast={false} />)}
          </group>
        ))}
      </group>
    );
  }

  /* ---------- the surroundings ---------- */
  const BLOCKS = [
    { p: [-16, 0, -22], w: 10, d: 8, floors: 4, seed: 1, r: 0.08, sign: '#c4382d' },
    { p: [-4, 0, -26], w: 9, d: 8, floors: 5, seed: 2, r: -0.04 },
    { p: [8, 0, -25], w: 9, d: 8, floors: 3, seed: 3, r: 0.1, sign: '#2d5ea8' },
    { p: [19, 0, -20], w: 9, d: 9, floors: 4, seed: 4, r: -0.3 },
    { p: [28, 0, -8], w: 9, d: 9, floors: 5, seed: 5, r: -0.9, sign: '#e8c43a' },
    { p: [-28, 0, -12], w: 8, d: 9, floors: 3, seed: 6, r: 0.9 },
    { p: [-30, 0, -2], w: 8, d: 8, floors: 4, seed: 7, r: 1.3 },
    { p: [31, 0, -12], w: 8, d: 9, floors: 3, seed: 8, r: -1.3, sign: '#2f8a58' },
    { p: [32, 0, -2], w: 8, d: 8, floors: 5, seed: 10, r: -1.7 },
    { p: [-34, 0, -22], w: 9, d: 9, floors: 6, seed: 11, r: 0.6 },
    { p: [36, 0, -20], w: 9, d: 9, floors: 4, seed: 12, r: -0.7 },
    { p: [-10, 0, -15], w: 5, d: 5, floors: 3, seed: 20, r: 0.05, sign: '#e8c43a' },
    { p: [11, 0, -16], w: 5.5, d: 5, floors: 3, seed: 21, r: -0.08, sign: '#c4382d' },
    { p: [-25, 0, 7], w: 5, d: 5, floors: 3, seed: 22, r: 0.2, sign: '#2f8a58' },
    { p: [26, 0, 5], w: 5, d: 5.5, floors: 3, seed: 23, r: -0.25, sign: '#2d5ea8' },
    { p: [4, 0, -40], w: 14, d: 9, floors: 5, seed: 13, r: 0 },
    { p: [-18, 0, -42], w: 12, d: 9, floors: 6, seed: 14, r: 0.1 },
    { p: [22, 0, -40], w: 12, d: 9, floors: 4, seed: 15, r: -0.1 },
  ];
  const WIRES = [
    [[-31, 7.3, 12.5], [-27, 6.9, 0], 0.4], [[-31, 6.6, 12.5], [-27, 6.2, 0], 0.4],
    [[-27, 6.9, 0], [-28, 6.8, -14], 0.4], [[-27, 6.2, 0], [-28, 6.1, -14], 0.4],
    [[32, 7.3, 12.5], [34, 6.0, 4], 0.3], [[-31, 7.3, 12.5], [-40, 7.0, 12.5], 0.5],
  ];
  function Haze() {
    const t = useMemo(() => { const c = document.createElement('canvas'); c.width = 4; c.height = 128; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0.95)'); g.fillStyle = gr; g.fillRect(0, 0, 4, 128); return new THREE.CanvasTexture(c); }, []);
    const m = useMemo(() => { const x = new THREE.MeshBasicMaterial({ color: '#e6dccb', map: t, transparent: true, side: THREE.BackSide, depthWrite: false, fog: false }); duskItems.add({ k: 'col', m: x, d: '#e6dccb', n: '#3a2a4c' }); if (lastDusk) applyDusk(true); return x; }, [t]);
    return <mesh position={[0, 29, 0]} material={m} renderOrder={-1} frustumCulled={false}><cylinderGeometry args={[85, 85, 60, 48, 1, true]} /></mesh>;
  }
  function Env() {
    const M = useM();
    const asphalt = mat('#3d3d41', { roughness: 0.95 });
    return (
      <group>
        <DuskProbe />
        <Haze />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} receiveShadow material={mat('#7d796f', { roughness: 1 })}><circleGeometry args={[110, 48]} /></mesh>
        {/* paved courtyard */}
        <Box s={[46, 0.1, 25]} p={[0, -0.01, -2.4]} m={mat('#968c79', { roughness: 1 })} cast={false} />
        {/* footpath, road, centre line */}
        <Box s={[120, 0.12, 5]} p={[0, 0, 12.6]} m={mat('#b3ada0')} cast={false} />
        <Box s={[120, 0.05, 13]} p={[0, -0.01, 21.5]} m={asphalt} cast={false} />
        <Inst n={20} mat={mat('#e8e4d4')} cast={false} place={(i) => ({ p: [-57 + i * 6, 0.03, 21.5] })}><boxGeometry args={[3, 0.02, 0.18]} /></Inst>
        <Box s={[120, 0.12, 3]} p={[0, 0, 29.6]} m={mat('#b3ada0')} cast={false} />
        <Fence />
        <LampPost p={[-29, 0, 12]} face={0} />
        <Pole p={[-31, 0, 12.5]} />
        <Pole p={[32, 0, 12.5]} />
        <SignPole p={[-10.6, 0, 11]} c='#2d5ea8' />
        <SignPole p={[11.2, 0, 11.2]} c='#c4382d' r={-0.3} />
        <Pole p={[-9.2, 0, 11.4]} h={5.2} />
        <Pole p={[-27, 0, 0]} h={7.2} />
        <Pole p={[-28, 0, -14]} h={7.0} />
        <Wires list={WIRES} />
        {/* the small brick Charumati Vihara to the south-west, with a stone chaitya before it */}
        <Vihara p={[-19, 0, -2]} r={1.75} />
        <LChaitya p={[-14.2, 0, -1]} s={1.5} r={0.3} />
        {/* blocks */}
        {BLOCKS.map((b, i) => <Block key={i} {...b} />)}
        {/* leafy trees at the edges */}
        <Tree p={[17, 0, -9]} s={3.6} />
        <Tree p={[-19, 0, 10.8]} s={2.0} />
        <Tree p={[21, 0, 10.8]} s={2.0} />
        <Tree p={[-18, 0, -8]} s={3.3} />
        <Tree p={[23, 0, -3]} s={3.0} />
        <Tree p={[-23, 0, -2]} s={3.2} />
        <Tree p={[5, 0, -17]} s={3.4} />
      </group>
    );
  }

  return { 'charumati-stupa': { Main, Env } };
}
