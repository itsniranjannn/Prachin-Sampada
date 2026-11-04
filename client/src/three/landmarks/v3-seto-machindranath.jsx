// Seto (White) Machindranath temple, Jana Bahal, Kel Tol, Kathmandu.
// A LOW, broad two-tier gilded-copper temple standing free in the middle of a closed brick-house courtyard (bahal),
// crowded with dark stone chaityas, carved pillars with gilt statues, a white Kanak Chaitya before the door and a small
// brick shrine with a grey metal roof. Entrance / courtyard gate on +z. Flat paved ground, no hill, no river.
// 1 unit ~ 2.3 m.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Diyo, Frame, THREE, useMemo } = K;

  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  /* ---------- merged-geometry helpers ---------- */
  const tmpM = new THREE.Matrix4();
  const tmpQ = new THREE.Quaternion();
  const tmpE = new THREE.Euler();
  const tmpS = new THREE.Vector3(1, 1, 1);
  const tmpP = new THREE.Vector3();
  const boxG = new THREE.BoxGeometry(1, 1, 1);
  const cylG = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
  const coneG = new THREE.ConeGeometry(0.5, 1, 8);
  const coneDownG = new THREE.ConeGeometry(0.5, 1, 4).rotateX(Math.PI);
  const sphG = new THREE.SphereGeometry(0.5, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  const bx = (sx, sy, sz, x, y, z, ry = 0) => ({ g: boxG, s: [sx, sy, sz], p: [x, y, z], ry });
  const cy = (d, h, x, y, z) => ({ g: cylG, s: [d, h, d], p: [x, y, z], ry: 0 });
  const cn = (d, h, x, y, z) => ({ g: coneG, s: [d, h, d], p: [x, y, z], ry: 0 });
  const cnd = (sx, sy, sz, x, y, z, ry = 0) => ({ g: coneDownG, s: [sx, sy, sz], p: [x, y, z], ry });
  const sph = (sx, sy, sz, x, y, z) => ({ g: sphG, s: [sx, sy, sz], p: [x, y, z], ry: 0 });
  function mergeParts(parts) {
    const pos = [], nor = [], uv = [], idx = [];
    let off = 0;
    parts.forEach((q) => {
      tmpE.set(q.rx || 0, q.ry || 0, q.rz || 0); tmpQ.setFromEuler(tmpE); tmpP.set(q.p[0], q.p[1], q.p[2]); tmpS.set(q.s[0], q.s[1], q.s[2]);
      tmpM.compose(tmpP, tmpQ, tmpS);
      const g = q.g.clone().applyMatrix4(tmpM);
      pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array); uv.push(...g.attributes.uv.array);
      g.index.array.forEach((i) => idx.push(i + off));
      off += g.attributes.position.count;
      g.dispose();
    });
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    out.setIndex(idx);
    return out;
  }
  function Mg({ build, m, cast = true }) {
    const geo = useMemo(() => mergeParts(build()), []); // eslint-disable-line
    return <mesh geometry={geo} material={m} castShadow={cast} receiveShadow />;
  }

  /* ---------- materials / textures (lazy, cached) ---------- */
  let cache = null;
  function mats(M) {
    if (cache && cache.M === M) return cache;
    const goldTex = (() => {
      const c = document.createElement('canvas'); c.width = 128; c.height = 128;
      const g = c.getContext('2d');
      g.fillStyle = '#8a7440'; g.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 160; i += 1) { g.fillStyle = `rgba(30,20,8,${0.08 + Math.random() * 0.18})`; g.fillRect(Math.random() * 128, Math.random() * 128, 1 + Math.random() * 3, 14 + Math.random() * 50); }
      for (let i = 0; i < 400; i += 1) { g.fillStyle = `rgba(${100 + Math.random() * 40},${92 + Math.random() * 30},${60 + Math.random() * 20},0.12)`; g.fillRect(Math.random() * 128, Math.random() * 128, 3 + Math.random() * 10, 2 + Math.random() * 6); }
      g.fillStyle = 'rgba(70,45,5,0.55)';
      for (let i = 0; i < 128; i += 21) g.fillRect(i, 0, 2, 128);
      g.fillStyle = 'rgba(220,205,160,0.25)';
      for (let i = 1; i < 128; i += 21) g.fillRect(i, 0, 1, 128);
      const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 1); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
      return t;
    })();
    const roofGold = new THREE.MeshStandardMaterial({ map: goldTex, color: '#ffffff', metalness: 0.5, roughness: 0.62, side: THREE.DoubleSide });
    cache = {
      M, roofGold,
      gold: M.plain('#d3a62e', { metalness: 0.6, roughness: 0.33, emissive: '#6b4a08', emissiveIntensity: 0.4 }),
      brass: M.plain('#d2ae6c', { metalness: 0.65, roughness: 0.38, emissive: '#4a340e', emissiveIntensity: 0.35 }),
      goldB: M.plain('#efc649', { metalness: 0.55, roughness: 0.28, emissive: '#8a600c', emissiveIntensity: 0.6 }),
      chA: M.plain('#3a352f', { roughness: 0.95 }),
      chB: M.plain('#463f36', { roughness: 0.95 }),
      zinc: M.plain('#585d61', { metalness: 0.2, roughness: 0.7 }),
      tile: M.mat('roof', 3, 2, { color: '#8f6350' }),
      tikiDark: M.plain('#3a2314', { roughness: 0.85 }),
      tikiLat: M.plain('#6b4425', { roughness: 0.85 }),
      dkwood: M.plain('#2b1b11', { roughness: 0.85 }),
      wood: M.plain('#4a2c18', { roughness: 0.85 }),
      stoneA: M.plain('#4d463e', { roughness: 0.95 }),
      stoneB: M.plain('#645c50', { roughness: 0.95 }),
      white: M.plain('#f1ede3', { roughness: 0.8 }),
      bronze: M.plain('#6d5430', { metalness: 0.75, roughness: 0.42 }),
      grey: M.plain('#6f7478', { metalness: 0.2, roughness: 0.7 }),
      brick: M.mat('brick', 2, 2, { color: '#e2a58f' }),
      flag: new THREE.MeshStandardMaterial({ map: flagTex(), color: '#b3a894', roughness: 0.95 }),
      outer: M.plain('#7e5a48', { roughness: 0.95 }),
      plasterSide: M.plain('#cbb998', { roughness: 0.95 }),
      lamp: new THREE.MeshBasicMaterial({ color: '#ffcf7a', toneMapped: false }),
    };
    return cache;
  }

  function flagTex() {
    const c = document.createElement('canvas'); c.width = 256; c.height = 256;
    const g = c.getContext('2d');
    const r = rng(3);
    g.fillStyle = '#7d7262'; g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 32) for (let x = (y / 32) % 2 ? 0 : -24; x < 256; x += 48) {
      const k = 150 + r() * 40;
      g.fillStyle = `rgb(${k},${k - 10},${k - 28})`; g.fillRect(x + 2, y + 2, 44, 28);
      for (let i = 0; i < 8; i += 1) { g.fillStyle = `rgba(60,50,40,${0.05 + r() * 0.08})`; g.fillRect(x + 2 + r() * 40, y + 2 + r() * 24, 3 + r() * 8, 2 + r() * 5); }
    }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(19, 19); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  }

  /* ---------- gilded valance: hanging pointed plates under an eave ---------- */
  function fringeParts(W, y, step, gold, bells, tall = 0.42) {
    const n = Math.floor(W / step);
    const off = (W - (n - 1) * step) / 2;
    [0, Math.PI / 2, Math.PI, -Math.PI / 2].forEach((ry) => {
      const c = Math.cos(ry), s = Math.sin(ry);
      const put = (lx, lz) => [lx * c + lz * s, -lx * s + lz * c];
      for (let i = 0; i < n; i += 1) {
        const lx = -W / 2 + off + i * step;
        const [x, z] = put(lx, W / 2 + 0.01);
        gold.push(cnd(step * 0.92, tall, 0.04, x, y - tall / 2 - 0.05, z, ry));
        if (i < n - 1) { const [bx2, bz2] = put(lx + step / 2, W / 2 + 0.03); bells.push(cy(0.07, 0.15, bx2, y - 0.16, bz2)); bells.push(cy(0.015, 0.1, bx2, y - 0.3, bz2)); }
      }
      const [x, z] = put(0, W / 2 + 0.01);
      gold.push(bx(W + 0.1, 0.1, 0.07, x, y - 0.03, z, ry));
    });
  }

  /* ---------- the temple ---------- */
  // A gilded, cage-like screened storey: dark core, gilded bar screens on every face, carved posts.
  function CageStorey({ w, h, y, door = false, bars = 0.15 }) {
    const C = mats(useM());
    const half = w / 2 - 0.05;
    return (
      <group position={[0, y, 0]}>
        <Box s={[w - 0.2, h, w - 0.2]} p={[0, h / 2, 0]} m={C.dkwood} />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => <Box key={`${a}${b}`} s={[0.2, h + 0.1, 0.2]} p={[a * half, h / 2, b * half]} m={C.wood} />)}
        <Mg m={C.brass} build={() => {
          const parts = [];
          [0, Math.PI / 2, Math.PI, -Math.PI / 2].forEach((ry, side) => {
            const c = Math.cos(ry), s = Math.sin(ry);
            const put = (lx, lz) => [lx * c + lz * s, -lx * s + lz * c];
            const n = Math.floor((w - 0.4) / bars);
            for (let i = 0; i < n; i += 1) {
              const lx = -(w - 0.4) / 2 + (i + 0.5) * ((w - 0.4) / n);
              if (door && side === 0 && Math.abs(lx) < 0.6) continue;
              const [x, z] = put(lx, half + 0.04);
              parts.push(bx(0.045, h * 0.8, 0.045, x, h * 0.5, z, ry));
            }
            [0.14, h * 0.5, h - 0.14].forEach((yy) => { const [x, z] = put(0, half + 0.04); parts.push(bx(w - 0.3, 0.07, 0.06, x, yy, z, ry)); });
          });
          return parts;
        }} />
        {/* repousse panels beside the door / on each face */}
        {[[0, 1], [Math.PI / 2, 1], [Math.PI, 1], [-Math.PI / 2, 1]].map(([ry], side) => (
          <group key={side} rotation={[0, ry, 0]}>
            {(door && side === 0 ? [-1, 1] : [-1, 0, 1]).map((k) => (
              <group key={k} position={[k * (door && side === 0 ? 1.0 : w * 0.3), h * 0.5, half + 0.07]}>
                <Box s={[w * 0.18, h * 0.66, 0.04]} m={C.goldB} cast={false} />
                <Box s={[w * 0.1, h * 0.4, 0.045]} m={C.dkwood} cast={false} />
                <Ball rad={0.08} p={[0, 0, 0.04]} m={C.goldB} />
                <Box s={[w * 0.14, 0.05, 0.05]} p={[0, h * 0.24, 0.03]} m={C.brass} cast={false} />
                <Box s={[w * 0.14, 0.05, 0.05]} p={[0, -h * 0.24, 0.03]} m={C.brass} cast={false} />
              </group>
            ))}
          </group>
        ))}
        {/* golden figures standing between the posts */}
        {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((ry, side) => (
          <group key={`fg${side}`} rotation={[0, ry, 0]}>
            {[-1, 1].map((k) => (
              <group key={k} position={[k * (w * 0.41), h * 0.1, half + 0.1]}>
                <Box s={[0.13, 0.34, 0.08]} p={[0, 0.2, 0]} m={C.goldB} cast={false} />
                <Box s={[0.2, 0.08, 0.1]} p={[0, 0.03, 0]} m={C.goldB} cast={false} />
                <Ball rad={0.065} p={[0, 0.44, 0]} m={C.goldB} />
                <mesh position={[0, 0.5, 0]} material={C.goldB}><coneGeometry args={[0.05, 0.1, 6]} /></mesh>
                <mesh position={[0, 0.3, -0.03]} material={C.goldB}><torusGeometry args={[0.2, 0.018, 5, 14]} /></mesh>
              </group>
            ))}
          </group>
        ))}
      </group>
    );
  }
  // carved struts (with gilded bird-head ends) carrying the eaves on all four sides
  function Struts({ y, reach, n, span, h }) {
    const C = mats(useM());
    const ang = Math.atan2(h, reach);
    const len = Math.hypot(h, reach);
    const out = [];
    for (let i = 0; i < n; i += 1) {
      const t = -span + (2 * span * i) / (n - 1);
      out.push(
        <group key={`f${i}`} position={[t, y, span]}><group position={[0, h / 2, reach / 2]} rotation={[-ang, 0, 0]}><Box s={[0.09, 0.12, len]} m={C.wood} /><Box s={[0.11, 0.16, 0.14]} p={[0, 0, len / 2]} m={C.gold} /></group></group>,
        <group key={`b${i}`} position={[t, y, -span]} rotation={[0, Math.PI, 0]}><group position={[0, h / 2, reach / 2]} rotation={[-ang, 0, 0]}><Box s={[0.09, 0.12, len]} m={C.wood} /><Box s={[0.11, 0.16, 0.14]} p={[0, 0, len / 2]} m={C.gold} /></group></group>,
        <group key={`l${i}`} position={[-span, y, t]} rotation={[0, -Math.PI / 2, 0]}><group position={[0, h / 2, reach / 2]} rotation={[-ang, 0, 0]}><Box s={[0.09, 0.12, len]} m={C.wood} /><Box s={[0.11, 0.16, 0.14]} p={[0, 0, len / 2]} m={C.gold} /></group></group>,
        <group key={`r${i}`} position={[span, y, t]} rotation={[0, Math.PI / 2, 0]}><group position={[0, h / 2, reach / 2]} rotation={[-ang, 0, 0]}><Box s={[0.09, 0.12, len]} m={C.wood} /><Box s={[0.11, 0.16, 0.14]} p={[0, 0, len / 2]} m={C.gold} /></group></group>,
      );
    }
    return <group>{out}</group>;
  }
  // pinnacle: gilded base, four snakes rearing around a pole, a stack of umbrellas, bell finial
  function SnakeGajur({ y }) {
    const C = mats(useM());
    return (
      <group position={[0, y, 0]}>
        <Box s={[0.5, 0.1, 0.5]} p={[0, 0.05, 0]} m={C.gold} />
        <Cyl rt={0.14} rb={0.2} h={0.16} p={[0, 0.18, 0]} m={C.gold} />
        <Cyl rt={0.05} h={0.9} p={[0, 0.6, 0]} m={C.gold} seg={8} />
        {[0, 1, 2, 3].map((k) => {
          const a = (k * Math.PI) / 2 + Math.PI / 4;
          return (
            <group key={k} rotation={[0, a, 0]}>
              <Cyl rt={0.035} rb={0.045} h={0.4} p={[0.17, 0.4, 0]} r={[0, 0, -0.35]} m={C.brass} seg={6} />
              <Ball rad={0.06} p={[0.26, 0.62, 0]} m={C.brass} />
              <Ball rad={0.04} p={[0.12, 0.2, 0]} m={C.brass} />
            </group>
          );
        })}
        {[0.5, 0.68, 0.84].map((yy, i) => <mesh key={yy} position={[0, yy, 0]} material={C.gold} castShadow><coneGeometry args={[0.3 - i * 0.07, 0.1, 12]} /></mesh>)}
        <Ball rad={0.1} p={[0, 0.98, 0]} m={C.gold} />
        <mesh position={[0, 1.2, 0]} material={C.gold} castShadow><coneGeometry args={[0.045, 0.3, 8]} /></mesh>
      </group>
    );
  }
  function Torana({ w = 0.62 }) {
    const C = mats(useM());
    return (
      <group>
        <mesh material={C.goldB} castShadow><torusGeometry args={[w, 0.09, 6, 20, Math.PI]} /></mesh>
        <mesh material={C.brass} position={[0, 0, -0.01]}><circleGeometry args={[w - 0.05, 20, 0, Math.PI]} /></mesh>
        <mesh material={C.dkwood} position={[0, 0, 0.004]}><circleGeometry args={[w - 0.16, 20, 0, Math.PI]} /></mesh>
        <Ball rad={0.1} p={[0, w * 0.45, 0.04]} m={C.gold} />
        {[-70, -45, -20, 20, 45, 70].map((d) => {
          const a = (d * Math.PI) / 180 + Math.PI / 2;
          return <mesh key={d} position={[Math.cos(a) * (w + 0.06), Math.sin(a) * (w + 0.06), 0]} rotation={[0, 0, a - Math.PI / 2]} material={C.gold}><coneGeometry args={[0.06, 0.24, 5]} /></mesh>;
        })}
        <mesh position={[0, w + 0.14, 0]} material={C.gold}><coneGeometry args={[0.07, 0.22, 6]} /></mesh>
      </group>
    );
  }

  function Temple() {
    const C = mats(useM());
    const B = 0.2; // body base height above ground (low platform)
    return (
      <group>
        {/* one low stone platform step */}
        <Box s={[4.5, 0.1, 4.5]} p={[0, 0.05, 0]} m={C.stoneB} />
        <Box s={[4.0, 0.1, 4.0]} p={[0, 0.15, 0]} m={C.stoneA} />
        {/* ground storey: gilded brass cage */}
        <CageStorey w={3.2} h={1.45} y={B} door />
        {/* golden door, carved frame and torana on the front */}
        <group position={[0, B, 1.52]}>
          <Box s={[1.2, 1.2, 0.1]} p={[0, 0.6, 0]} m={C.wood} />
          <Box s={[0.5, 1.02, 0.06]} p={[-0.27, 0.55, 0.05]} m={C.gold} />
          <Box s={[0.5, 1.02, 0.06]} p={[0.27, 0.55, 0.05]} m={C.gold} />
          {[-0.27, 0.27].map((x) => [0.25, 0.55, 0.85].map((yy) => <Box key={`${x}${yy}`} s={[0.38, 0.2, 0.03]} p={[x, yy, 0.09]} m={C.brass} cast={false} />))}
          <Box s={[1.4, 0.08, 0.12]} p={[0, 1.22, 0.02]} m={C.gold} />
          <group position={[0, 1.2, 0.1]}><Torana w={0.55} /></group>
        </group>
        {/* bronze guardian lions on stone pedestals flanking the door */}
        {[-1, 1].map((k) => (
          <group key={k} position={[k * 1.45, 0.2, 2.18]}>
            <Box s={[0.5, 0.2, 0.5]} p={[0, 0.1, 0]} m={C.stoneA} />
            <group position={[0, 0.2, 0]} scale={1.3}><BronzeLion m={C.bronze} /></group>
          </group>
        ))}
        <Struts y={B + 0.9} reach={1.05} n={5} span={1.5} h={0.62} />
        {/* lower broad hipped gilded roof with hanging valance */}
        <Roof w={5.2} d={5.2} h={0.62} y={1.58} m={C.roofGold} sag={1.35} lift={0.1} fascia={false} />
        <Mg m={C.gold} build={() => { const g = [], b = []; fringeParts(5.2, 1.58, 0.347, g, b, 0.5); return g; }} />
        <Mg m={C.brass} build={() => { const g = [], b = []; fringeParts(5.2, 1.58, 0.347, g, b, 0.5); return b; }} />
        {/* upper storey */}
        <CageStorey w={1.5} h={0.7} y={1.84} door bars={0.14} />
        <group position={[0, 1.9, 0.79]}><group position={[0, 0.08, 0]}><Torana w={0.27} /></group></group>
        <Struts y={2.2} reach={0.5} n={3} span={0.7} h={0.4} />
        <Roof w={2.6} d={2.6} h={0.5} y={2.58} m={C.roofGold} sag={1.3} lift={0.1} fascia={false} />
        <Mg m={C.gold} build={() => { const g = [], b = []; fringeParts(2.6, 2.58, 0.26, g, b, 0.36); return g; }} />
        <Mg m={C.brass} build={() => { const g = [], b = []; fringeParts(2.6, 2.58, 0.26, g, b, 0.36); return b; }} />
        <SnakeGajur y={3.02} />
      </group>
    );
  }

  /* ---------- sculpture and furniture ---------- */
  function BronzeLion({ m }) {
    return (
      <group>
        <Ball rad={0.16} sc={[1, 0.9, 1.1]} p={[0, 0.2, -0.1]} m={m} />
        <Box s={[0.2, 0.3, 0.16]} p={[0, 0.3, 0.04]} r={[0.2, 0, 0]} m={m} />
        {[-0.07, 0.07].map((x) => <Cyl key={x} rt={0.03} rb={0.035} h={0.3} p={[x, 0.15, 0.12]} m={m} seg={6} />)}
        {[-0.12, 0.12].map((x) => <Box key={x} s={[0.07, 0.05, 0.12]} p={[x * 0.7, 0.02, 0.17]} m={m} />)}
        <Ball rad={0.19} sc={[1, 0.9, 0.7]} p={[0, 0.46, 0.08]} m={m} />
        <Ball rad={0.1} p={[0, 0.46, 0.2]} m={m} />
        <Box s={[0.12, 0.05, 0.1]} p={[0, 0.4, 0.28]} m={m} />
        {[-0.08, 0.08].map((x) => <mesh key={x} position={[x, 0.62, 0.08]} material={m}><coneGeometry args={[0.04, 0.08, 5]} /></mesh>)}
        <mesh position={[0, 0.33, -0.28]} rotation={[0, 0, 0]} material={m}><torusGeometry args={[0.08, 0.025, 5, 12]} /></mesh>
      </group>
    );
  }

  const twistedGeo = (() => {
    let g = null;
    return () => {
      if (g) return g;
      const gg = new THREE.CylinderGeometry(0.15, 0.15, 1, 16, 28, true);
      const p = gg.attributes.position;
      for (let i = 0; i < p.count; i += 1) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        const th = Math.atan2(z, x);
        const r = 0.15 * (1 + 0.16 * Math.cos(3 * th + y * 14));
        p.setXYZ(i, Math.cos(th) * r, y, Math.sin(th) * r);
      }
      gg.computeVertexNormals();
      g = gg; return g;
    };
  })();

  // tall stone pillar topped with a gilt statue under a small tasselled umbrella
  function StatuePillar({ p, spiral }) {
    const C = mats(useM());
    const H = 1.6;
    return (
      <group position={p}>
        <Box s={[0.66, 0.2, 0.66]} p={[0, 0.1, 0]} m={C.stoneA} />
        <Cyl rt={0.27} rb={0.34} h={0.24} p={[0, 0.32, 0]} m={C.stoneA} seg={12} />
        {spiral
          ? <mesh position={[0, 0.44 + H / 2, 0]} scale={[1.34, H, 1.34]} geometry={twistedGeo()} material={C.stoneA} castShadow />
          : <Cyl rt={0.19} rb={0.21} h={H} p={[0, 0.44 + H / 2, 0]} m={C.stoneA} seg={12} />}
        {[0.7, 1.4].map((yy) => <Cyl key={yy} rt={0.25} h={0.06} p={[0, yy, 0]} m={C.stoneB} seg={12} />)}
        <Cyl rt={0.38} rb={0.2} h={0.22} p={[0, 0.44 + H + 0.11, 0]} m={C.stoneB} seg={12} />
        <Cyl rt={0.4} h={0.06} p={[0, 0.44 + H + 0.25, 0]} m={C.dkwood} seg={12} />
        <group position={[0, 0.44 + H + 0.28, 0]} scale={1.5}>
          <Box s={[0.2, 0.14, 0.16]} p={[0, 0.07, 0]} m={C.gold} />
          <Box s={[0.13, 0.2, 0.1]} p={[0, 0.24, 0]} m={C.gold} />
          <Ball rad={0.055} p={[0, 0.39, 0]} m={C.gold} />
          <mesh position={[0, 0.48, 0]} material={C.gold}><coneGeometry args={[0.045, 0.1, 6]} /></mesh>
          {[-1, 1].map((k) => <Box key={k} s={[0.03, 0.03, 0.14]} p={[k * 0.1, 0.28, 0.05]} r={[0.5, 0, 0]} m={C.gold} />)}
          <Cyl rt={0.012} h={0.5} p={[0.14, 0.4, -0.04]} m={C.gold} seg={5} />
          <mesh position={[0.14, 0.7, -0.04]} material={C.dkwood} castShadow><coneGeometry args={[0.28, 0.14, 14]} /></mesh>
          <mesh position={[0.14, 0.64, -0.04]} rotation={[Math.PI / 2, 0, 0]} material={C.gold}><torusGeometry args={[0.27, 0.012, 4, 16]} /></mesh>
          <Ball rad={0.04} p={[0.14, 0.8, -0.04]} m={C.gold} />
        </group>
      </group>
    );
  }
  function KanakChaitya({ p }) {
    const C = mats(useM());
    const rings = [0, 1, 2, 3, 4, 5, 6, 7];
    return (
      <group position={p}>
        <Box s={[1.1, 0.12, 1.1]} p={[0, 0.06, 0]} m={C.stoneB} />
        <Box s={[0.9, 0.14, 0.9]} p={[0, 0.19, 0]} m={C.white} />
        <Box s={[0.74, 0.16, 0.74]} p={[0, 0.34, 0]} m={C.white} />
        <Cyl rt={0.34} h={0.18} p={[0, 0.5, 0]} m={C.white} seg={16} />
        <mesh position={[0, 0.58, 0]} material={C.white} castShadow><sphereGeometry args={[0.36, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
        <Box s={[0.26, 0.2, 0.26]} p={[0, 0.98, 0]} m={C.gold} />
        {rings.map((i) => <Cyl key={i} rt={0.2 - i * 0.016} h={0.05} p={[0, 1.14 + i * 0.055, 0]} m={C.gold} seg={12} />)}
        <mesh position={[0, 1.7, 0]} material={C.gold}><coneGeometry args={[0.05, 0.22, 8]} /></mesh>
        {[-0.3, -0.1, 0.1, 0.3].map((x) => <Diyo key={x} p={[x, 0.27, 0.6]} />)}
      </group>
    );
  }
  function LampCage({ p }) {
    const C = mats(useM());
    return (
      <group position={p}>
        <Cyl rt={0.36} rb={0.4} h={0.18} p={[0, 0.09, 0]} m={C.stoneA} seg={14} />
        {Array.from({ length: 14 }, (_, i) => {
          const a = (i / 14) * Math.PI * 2;
          return <Cyl key={i} rt={0.012} h={0.8} p={[Math.cos(a) * 0.34, 0.58, Math.sin(a) * 0.34]} m={C.dkwood} seg={5} />;
        })}
        <mesh position={[0, 0.98, 0]} rotation={[Math.PI / 2, 0, 0]} material={C.dkwood}><torusGeometry args={[0.34, 0.02, 5, 20]} /></mesh>
        <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]} material={C.dkwood}><torusGeometry args={[0.34, 0.02, 5, 20]} /></mesh>
        <Cyl rt={0.07} rb={0.09} h={0.5} p={[0, 0.5, 0]} m={C.bronze} seg={8} />
        <Ball rad={0.06} p={[0, 0.82, 0]} m={C.bronze} />
        <mesh position={[0, 0.62, 0]} rotation={[Math.PI / 2, 0, 0]} material={C.bronze}><torusGeometry args={[0.16, 0.014, 5, 16]} /></mesh>
        {Array.from({ length: 10 }, (_, i) => {
          const a = (i / 10) * Math.PI * 2;
          return <mesh key={i} position={[Math.cos(a) * 0.28, 0.32, Math.sin(a) * 0.28]} material={C.lamp}><coneGeometry args={[0.02, 0.06, 5]} /></mesh>;
        })}
        <pointLight position={[0, 0.5, 0.2]} intensity={1.2} distance={3.2} color="#ffb35a" />
      </group>
    );
  }
  function Parasol({ p }) {
    const C = mats(useM());
    return (
      <group position={p}>
        <Cyl rt={0.03} h={1.5} p={[0, 0.75, 0]} m={C.dkwood} seg={6} />
        <mesh position={[0, 1.55, 0]} material={C.white} castShadow><coneGeometry args={[0.55, 0.22, 16]} /></mesh>
        <mesh position={[0, 1.44, 0]} rotation={[Math.PI / 2, 0, 0]} material={C.gold}><torusGeometry args={[0.52, 0.012, 4, 20]} /></mesh>
        <Ball rad={0.04} p={[0, 1.68, 0]} m={C.gold} />
      </group>
    );
  }
  function BrickShrine({ p, s = 1, ry = 0 }) {
    const C = mats(useM());
    return (
      <group position={p} rotation={[0, ry, 0]} scale={s}>
        <Box s={[1.4, 0.16, 1.4]} p={[0, 0.08, 0]} m={C.stoneB} />
        <Box s={[1.0, 1.0, 1.0]} p={[0, 0.66, 0]} m={C.brick} />
        <Box s={[0.4, 0.62, 0.05]} p={[0, 0.5, 0.5]} m={C.dkwood} />
        <Box s={[0.5, 0.06, 0.07]} p={[0, 0.84, 0.51]} m={C.wood} />
        <Box s={[1.08, 0.08, 1.08]} p={[0, 1.2, 0]} m={C.dkwood} />
        <Roof w={1.8} d={1.8} h={0.6} y={1.22} m={C.zinc} sag={1.1} lift={0} fascia={false} />
        <Box s={[0.5, 0.3, 0.5]} p={[0, 1.95, 0]} m={C.dkwood} />
        <Roof w={1.0} d={1.0} h={0.5} y={2.08} m={C.zinc} sag={1.1} lift={0} fascia={false} />
        <Cyl rt={0.035} h={0.4} p={[0, 2.75, 0]} m={C.goldB} seg={6} />
        <Ball rad={0.1} p={[0, 2.58, 0]} m={C.goldB} />
        <Ball rad={0.07} p={[0, 2.85, 0]} m={C.goldB} />
        <mesh position={[0, 3.03, 0]} material={C.goldB}><coneGeometry args={[0.05, 0.22, 6]} /></mesh>
      </group>
    );
  }
  // dark narrow timber gateway into the court (foreground, facing +z)
  function TimberGate({ p }) {
    const C = mats(useM());
    const hw = 1.3;
    const H = 2.6;
    return (
      <group position={p}>
        {[-1, 1].map((k) => (
          <group key={k} position={[k * hw, 0, 0]}>
            <Box s={[0.5, 0.3, 0.5]} p={[0, 0.15, 0]} m={C.stoneA} />
            <Box s={[0.26, H, 0.26]} p={[0, H / 2 + 0.2, 0]} m={C.wood} />
            <Box s={[0.34, 0.2, 0.34]} p={[0, H + 0.25, 0]} m={C.dkwood} />
            <group position={[0, H - 0.75, 0]} scale={[-k, 1, 1]}>
              <mesh position={[-0.9 - 0.13, 0, 0]} material={C.wood} castShadow><torusGeometry args={[0.95, 0.14, 6, 18, Math.PI / 2]} /></mesh>
            </group>
          </group>
        ))}
        <Box s={[hw * 2 + 0.6, 0.3, 0.34]} p={[0, H + 0.45, 0]} m={C.wood} />
        <Box s={[hw * 2 - 0.4, 0.18, 0.28]} p={[0, H + 0.1, 0]} m={C.dkwood} />
        <Box s={[hw * 2 + 0.2, 0.1, 0.1]} p={[0, H + 0.68, 0.0]} m={C.dkwood} />
        <Box s={[hw * 2 + 0.7, 0.22, 0.4]} p={[0, H + 0.45, 0.02]} m={C.dkwood} />
        {[-0.9, -0.45, 0, 0.45, 0.9].map((x) => <Ball key={x} rad={0.06} p={[x, H + 0.45, 0.22]} m={C.gold} />)}
      </group>
    );
  }

  /* ---------- the crowd of stone chaityas ---------- */
  const PILLARS = [[-2.2, 3.2, true], [2.2, 3.2, false], [-4.6, 5.3, false], [4.3, 5.5, true], [-6.3, -0.9, true], [6.2, 0.8, false], [3.8, -4.4, false], [-3.4, -4.6, true]];
  const AVOID = [[-1.7, 4.6, 0.9], [1.5, 4.1, 0.8], [-4.0, 1.0, 1.35], [-4.9, -2.2, 1.1], [-5.6, 5.0, 1.6], ...PILLARS.map(([x, z]) => [x, z, 0.75])];
  const KW = 0.65, KH = 0.5; // horizontal / vertical design scale of one chaitya
  function buildChaityas() {
    const r = rng(7);
    const A = [], Bp = [], G = [];
    const placed = [];
    const maxS = (z) => (z > 2.4 ? 1.3 : 2.2);
    const free = (x, z, s) => {
      if (Math.abs(x) > 7.3 || z < -7.3 || z > 6.8) return false;
      if (s > maxS(z)) return false;
      const hw = 0.42 * KW * s;
      if (Math.abs(x) < 2.75 + hw && Math.abs(z) < 2.75 + hw) return false;
      if (Math.abs(x) < 1.3 + hw && z > 0) return false;
      if (AVOID.some(([ax, az, rr]) => Math.hypot(x - ax, z - az) < rr + hw)) return false;
      if (placed.some((q) => Math.max(Math.abs(x - q.x), Math.abs(z - q.z)) < 0.42 * KW * (s + q.s) + 0.15)) return false;
      return true;
    };
    const queue = [];
    [[-3.7, -0.4, 2.0], [3.8, 0.0, 1.9], [3.9, -3.6, 2.1], [-3.6, -3.7, 1.9], [0, -3.7, 2.2], [-6.0, -4.5, 1.8], [5.9, -1.6, 1.7], [-5.8, 2.8, 1.7]].forEach(([x, z, s]) => queue.push({ x, z, s }));
    [2.2, 2.0, 1.8, 1.6, 1.4, 1.2, 1.0, 0.85].forEach((s) => {
      for (let t = 0; t < 2500; t += 1) queue.push({ x: (r() * 2 - 1) * 7.2, z: -7.2 + r() * 14, s: s * (0.94 + r() * 0.12) });
    });
    for (let qi = 0; qi < queue.length && placed.length < 175; qi += 1) {
      const { x, z, s } = queue[qi];
      if (!free(x, z, s)) continue;
      placed.push({ x, z, s });
      const tier = r() < 0.6;
      const ry = Math.floor(r() * 4) * (Math.PI / 2);
      const arr = r() < 0.5 ? A : Bp;
      const i0 = arr.length;
      const gi0 = G.length;
      const c = Math.cos(ry), sn = Math.sin(ry);
      let y = 0;
      const P = (sx, sy, sz, lx, ly, lz, kind = 'b') => {
        const px = x + s * KW * (lx * c + lz * sn), pz = z + s * KW * (-lx * sn + lz * c);
        const wx = s * KW, hy = s * KH;
        return kind === 'b' ? bx(sx * wx, sy * hy, sz * wx, px, ly * hy, pz, ry)
          : kind === 'c' ? cy(sx * wx, sy * hy, px, ly * hy, pz)
          : kind === 'n' ? cn(sx * wx, sy * hy, px, ly * hy, pz)
          : sph(sx * wx, sy * hy, sz * wx, px, ly * hy, pz);
      };
      const stack = (w, h) => { arr.push(P(w, h, w, 0, y + h / 2, 0)); y += h; };
      const ring = (d, h) => { arr.push(P(d, h, 0, 0, y + h / 2, 0, 'c')); y += h; };
      stack(0.84, 0.12); stack(0.72, 0.12); stack(0.6, 0.12);
      if (tier) {
        arr.push(P(0.4, 0.22, 0.4, 0, y + 0.11, 0));
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => arr.push(P(0.11, 0.22, 0.11, a * 0.27, y + 0.11, b * 0.27)));
        y += 0.22;
        stack(0.58, 0.08); stack(0.5, 0.1); stack(0.42, 0.1); stack(0.34, 0.1);
        ring(0.3, 0.14);
      } else {
        stack(0.5, 0.1); ring(0.44, 0.2); stack(0.4, 0.1); stack(0.34, 0.1);
        arr.push(P(0.46, 0.3, 0.46, 0, y + 0.15, 0)); y += 0.3;
        ring(0.3, 0.1);
      }
      arr.push(P(0.36, 0.3, 0.36, 0, y, 0, 's')); y += 0.15;
      stack(0.14, 0.14);
      for (let i = 0; i < 5; i += 1) ring(0.13 - i * 0.012, 0.045);
      G.push(P(0.055, 0.42, 0, 0, y + 0.21, 0, 'n'));
      G.push(P(0.09, 0.05, 0, 0, y + 0.03, 0, 'c'));
      if (s > 0.85 && r() < 0.6) { // weathered lean about the base
        const t = (r() < 0.5 ? -1 : 1) * 0.025;
        const ct = Math.cos(t), st = Math.sin(t);
        [[arr, i0], [G, gi0]].forEach(([L, from]) => {
          for (let k = from; k < L.length; k += 1) {
            const q = L[k]; const dx = q.p[0] - x, dy = q.p[1];
            q.p = [x + dx * ct - dy * st, dx * st + dy * ct, q.p[2]]; q.rz = (q.rz || 0) + t;
          }
        });
      }
    }
    return { A, Bp, G };
  }

  /* ---------- MAIN ---------- */
  function SetoMain() {
    const C = mats(useM());
    const ch = useMemo(buildChaityas, []);
    return (
      <group>
        <Temple />
        <KanakChaitya p={[0, 0, 3.9]} />
        <LampCage p={[-1.7, 0, 4.6]} />
        <Parasol p={[1.5, 0, 4.1]} />
        <BrickShrine p={[-4.0, 0, 1.0]} />
        <BrickShrine p={[-4.9, 0, -2.2]} s={0.8} />
        {/* wide carved stone basin / plinth at left foreground */}
        <group position={[-5.6, 0, 5.0]}>
          <Box s={[2.4, 0.55, 1.4]} p={[0, 0.275, 0]} m={C.stoneB} />
          <Box s={[2.5, 0.08, 1.5]} p={[0, 0.59, 0]} m={C.stoneA} />
          <Cyl rt={0.25} h={0.05} p={[0, 0.65, 0.7]} r={[Math.PI / 2, 0, 0]} m={C.stoneA} seg={14} />
        </group>
        {PILLARS.map(([x, z, sp], i) => <StatuePillar key={i} p={[x, 0, z]} spiral={sp} />)}
        <mesh geometry={useMemo(() => mergeParts(ch.A), [ch])} material={C.chA} castShadow receiveShadow />
        <mesh geometry={useMemo(() => mergeParts(ch.Bp), [ch])} material={C.chB} castShadow receiveShadow />
        <mesh geometry={useMemo(() => mergeParts(ch.G), [ch])} material={C.gold} />
        <group position={[0, 0, 17]} scale={0.7}><TimberGate p={[0, 0, 0]} /></group>
        <pointLight position={[0, 1.1, 2.4]} intensity={1.6} distance={5} color="#ffb860" />
        <Frame s={[9, 5, 8]} p={[0, 2.5, 1.4]} />
      </group>
    );
  }

  /* ---------- ENV: the ring of brick houses, flagstones, city beyond ---------- */
  const facadeCache = new Map();
  function facadeMat(M, rows, cols, tone, seed) {
    const key = `${rows}|${cols}|${tone}|${seed}`;
    if (facadeCache.has(key)) return facadeCache.get(key);
    const c = document.createElement('canvas'); c.width = 256; c.height = 256;
    const g = c.getContext('2d');
    const plaster = tone >= 3;
    const rr = rng(seed * 31 + tone * 7 + rows);
    if (plaster) {
      g.fillStyle = tone === 3 ? '#d9c9a8' : '#e4dac4'; g.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 120; i += 1) { g.fillStyle = `rgba(${rr() < 0.5 ? '90,70,50' : '120,95,70'},${0.05 + rr() * 0.1})`; g.fillRect(rr() * 256, rr() * 256, 8 + rr() * 30, 6 + rr() * 30); }
      g.fillStyle = 'rgba(70,50,35,0.25)'; g.fillRect(0, 256 / rows - 3, 256, 3);
    } else {
      g.fillStyle = ['#93472f', '#a35a3e', '#83402c'][tone]; g.fillRect(0, 0, 256, 256);
      for (let y = 0; y < 256; y += 8) {
        g.fillStyle = 'rgba(40,20,12,0.28)'; g.fillRect(0, y, 256, 1);
        for (let x = (y / 8) % 2 ? 0 : 8; x < 256; x += 16) { g.fillRect(x, y, 1, 8); }
      }
      for (let i = 0; i < 90; i += 1) { g.fillStyle = `rgba(${rr() < 0.5 ? '60,25,15' : '200,130,100'},0.10)`; g.fillRect(rr() * 256, rr() * 256, 6 + rr() * 22, 4 + rr() * 8); }
      if (seed % 2 === 1) { g.fillStyle = 'rgba(225,210,180,0.55)'; g.fillRect(0, 0, 256, 256 * 0.26); }
    }
    const rh = 256 / rows, cw = 256 / cols;
    const surround = plaster ? '#b9a98a' : '#a8896a';
    for (let r = 0; r < rows; r += 1) {
      const top = r * rh;
      if (r === rows - 1) {
        for (let k = 0; k < cols; k += 1) {
          const cx = k * cw + cw / 2;
          const shop = (k + seed) % 2 === 0;
          g.fillStyle = '#2a170d'; g.fillRect(cx - cw * 0.3, top + rh * 0.12, cw * 0.6, rh * 0.88);
          g.fillStyle = shop ? '#8a5a30' : '#6a4224'; g.fillRect(cx - cw * 0.24, top + rh * 0.2, cw * 0.48, rh * 0.8);
          if (shop) { g.fillStyle = ['#c0392b', '#2f6f9f', '#d4a017'][(k + seed) % 3]; g.fillRect(cx - cw * 0.24, top + rh * 0.2, cw * 0.48, rh * 0.16); }
          g.fillStyle = '#2a170d'; g.fillRect(cx - 1, top + rh * 0.2, 2, rh * 0.8);
        }
        g.fillStyle = '#3a2314'; g.fillRect(0, top, 256, 4);
        continue;
      }
      const kind = Math.floor(rr() * 4);
      for (let k = 0; k < cols; k += 1) {
        const cx = k * cw + cw / 2;
        const kk = (kind + k) % 4;
        const wide = kk === 0;
        const ww = wide ? cw * 0.84 : kk === 2 ? cw * 0.4 : cw * 0.52, hh = rh * (kk === 2 ? 0.52 : 0.58);
        const x0 = cx - ww / 2, y0 = top + rh * 0.2;
        g.fillStyle = surround; g.fillRect(x0 - 2, y0 - 3, ww + 4, hh + 7);
        g.fillStyle = '#2b180d'; g.fillRect(x0, y0, ww, hh);
        if (kk === 2) {
          g.fillStyle = '#4a3322'; g.fillRect(x0 + 2, y0 + 2, ww / 2 - 3, hh - 4); g.fillRect(x0 + ww / 2 + 1, y0 + 2, ww / 2 - 3, hh - 4);
          if (rr() < 0.5) { g.fillStyle = ['#c0392b', '#3b7dd8', '#e8e0cc'][Math.floor(rr() * 3)]; g.fillRect(x0 + 4, y0 + hh + 3, ww * 0.5, hh * 0.5); }
          continue;
        }
        g.fillStyle = kk === 3 ? '#3b2314' : '#7a4d2a'; g.fillRect(x0 + 3, y0 + 3, ww - 6, hh - 6);
        g.strokeStyle = '#2b180d'; g.lineWidth = 2;
        const nv = wide ? 9 : kk === 3 ? 3 : 5;
        for (let i = 1; i < nv; i += 1) { g.beginPath(); g.moveTo(x0 + (ww * i) / nv, y0 + 3); g.lineTo(x0 + (ww * i) / nv, y0 + hh - 3); g.stroke(); }
        if (kk !== 3) for (let j = 1; j < 4; j += 1) { g.beginPath(); g.moveTo(x0 + 3, y0 + (hh * j) / 4); g.lineTo(x0 + ww - 3, y0 + (hh * j) / 4); g.stroke(); }
        if (wide) { g.fillStyle = '#2b180d'; g.fillRect(x0 + ww * 0.34, y0, 3, hh); g.fillRect(x0 + ww * 0.66, y0, 3, hh); }
      }
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.92 });
    facadeCache.set(key, m);
    return m;
  }
  function HouseSeg({ x, z, ry, w, storeys, tone, seed, depth = 1.8 }) {
    const M = useM();
    const C = mats(M);
    const H = storeys === 4 ? 3.3 : storeys === 3 ? 2.6 : 1.9;
    const fm = facadeMat(M, storeys, w > 3.3 ? 3 : 2, tone, seed);
    const side = tone >= 3 ? C.plasterSide : C.brick;
    const back = tone >= 3 ? C.plasterSide : C.outer;
    const rowH = H / storeys;
    const cloth = ['#b5382b', '#2f6f9f', '#e8e0cc'][seed % 3];
    return (
      <group position={[x, 0, z]} rotation={[0, ry, 0]}>
        <mesh position={[0, H / 2, -depth / 2]} material={[side, side, C.dkwood, C.dkwood, fm, back]} castShadow receiveShadow>
          <boxGeometry args={[w, H, depth]} />
        </mesh>
        <Box s={[w + 0.14, 0.1, 0.5]} p={[0, H + 0.02, 0.1]} m={C.dkwood} />
        {/* projecting timber bay windows (tikijhya), three across the first floor */}
        {[-1, 0, 1].map((k) => (
          <group key={k} position={[k * w * 0.3, rowH * 1.5 + 0.02, 0.1]}>
            <Box s={[w * 0.2, rowH * 0.58, 0.2]} m={C.tikiDark} />
            <Box s={[w * 0.15, rowH * 0.38, 0.03]} p={[0, 0, 0.11]} m={C.tikiLat} cast={false} />
            <Box s={[w * 0.22, 0.05, 0.24]} p={[0, rowH * 0.31, 0]} m={C.tikiDark} />
          </group>
        ))}
        {storeys >= 3 && [-1, 1].map((k) => (
          <group key={`u${k}`} position={[k * w * 0.3, rowH * 2.5 + 0.02, 0.1]}>
            <Box s={[w * 0.2, rowH * 0.55, 0.2]} m={C.tikiDark} />
            <Box s={[w * 0.15, rowH * 0.36, 0.03]} p={[0, 0, 0.11]} m={C.tikiLat} cast={false} />
          </group>
        ))}
        {seed % 2 === 0 && <Box s={[0.5, 0.45, 0.02]} p={[w * 0.12, rowH * 1.55, 0.24]} m={M.plain(cloth, { roughness: 1 })} cast={false} />}
        {/* sloped tiled roof */}
        <group position={[0, H, -depth / 2 + 0.1]}>
          <Roof w={w + 0.3} d={depth + 0.9} h={0.55 + (seed % 3) * 0.12} y={0.06} m={C.tile} sag={1.05} lift={0} fascia={false} />
        </group>
      </group>
    );
  }
  function wallSegs(len, from, seed, tallBias) {
    const r = rng(seed);
    const out = [];
    let t = from;
    while (t < from + len - 0.8) {
      const w = Math.min(2.5 + r() * 1.7, from + len - t);
      out.push({ c: t + w / 2, w, storeys: r() < tallBias ? 4 : 3, tone: r() < 0.28 ? 3 + Math.floor(r() * 2) : Math.floor(r() * 3), seed: Math.floor(r() * 5), off: r() * 0.3 });
      t += w;
    }
    return out;
  }
  function Court() {
    const segs = useMemo(() => {
      // the left (camera-side) wall drops to two storeys in front so the court stays open to view
      const L = wallSegs(15.2, -8.2, 11, 0.5).filter((s) => s.c < -2.4).map((s) => ({ ...s, x: -8 - s.off, z: s.c, ry: Math.PI / 2 }));
      const Rr = wallSegs(15.2, -8.2, 23, 0.4).filter((s) => s.c < 1.5).map((s) => ({ ...s, x: 8 + s.off, z: s.c, ry: -Math.PI / 2 }));
      const Bk = wallSegs(16.8, -8.4, 37, 0.6).map((s) => ({ ...s, x: s.c, z: -8 - s.off, ry: 0 }));
      return [...L, ...Rr, ...Bk];
    }, []);
    const C = mats(useM());
    return (
      <group>
        {segs.map((s, i) => <HouseSeg key={i} x={s.x} z={s.z} ry={s.ry} w={s.w} storeys={s.storeys} tone={s.tone} seed={s.seed} />)}
        {/* low plastered boundary walls where the court opens to the lane (keeps the view in) */}
        <Box s={[0.5, 0.8, 9.6]} p={[-8.2, 0.4, 2.4]} m={C.plasterSide} />
        <Box s={[0.62, 0.1, 9.7]} p={[-8.2, 0.85, 2.4]} m={C.dkwood} />
        <Box s={[0.5, 0.8, 5.2]} p={[8.2, 0.4, 4.2]} m={C.plasterSide} />
        <Box s={[0.62, 0.1, 5.3]} p={[8.2, 0.85, 4.2]} m={C.dkwood} />
      </group>
    );
  }
  function CityBeyond() {
    const C = mats(useM());
    const build = (col) => () => {
      const r = rng(col * 101 + 5);
      const parts = [];
      for (let i = 0; i < 170; i += 1) {
        const a = r() * Math.PI * 2;
        const rad = 12 + r() * 18;
        const x = Math.cos(a) * rad * 1.05, z = Math.sin(a) * rad;
        if (z > -3 && Math.hypot(x, z) < 26) continue; // keep the camera side clear
        if (Math.abs(x) < 10.6 && Math.abs(z - 1) < 10.6) continue;
        if (Math.floor(r() * 3) !== col) continue;
        const h = 2.6 + r() * 1.4, w = 2.5 + r() * 3, d = 2.5 + r() * 3;
        parts.push(bx(w, h, d, x, h / 2, z));
        parts.push(bx(w + 0.3, 0.12, d + 0.3, x, h + 0.06, z));
      }
      return parts;
    };
    return (
      <group>
        <Mg m={C.M.plain('#7a5446', { roughness: 0.95 })} build={build(0)} />
        <Mg m={C.M.plain('#a89b88', { roughness: 0.95 })} build={build(1)} />
        <Mg m={C.M.plain('#664a3f', { roughness: 0.95 })} build={build(2)} />
      </group>
    );
  }
  function SetoEnv() {
    const M = useM();
    const C = mats(M);
    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow material={M.plain('#6a5a4a', { roughness: 1 })}><circleGeometry args={[60, 48]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 1.0]} receiveShadow material={C.flag}><planeGeometry args={[40, 40]} /></mesh>
        <Court />
        <CityBeyond />
      </group>
    );
  }

  return { 'seto-machindranath': { Main: SetoMain, Env: SetoEnv } };
}
