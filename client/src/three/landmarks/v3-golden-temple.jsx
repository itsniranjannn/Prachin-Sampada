// Golden Temple (Hiranya Varna Mahavihar / Kwa Bahal), Patan: an enclosed Newar Buddhist monastery courtyard.
// Axis: entrance on +z (low dark stone gate, two metal elephants), small gilded chaitya in the yard, 4-storey / 3-roof gilded shrine at the back (-z).
// 1 unit ~ 3 m. Courtyard 9 x 7.2 units (~27 x 21 m). Ranges: two-storey carved-timber verandahs left/right/back; low one-storey wings flank the gate.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Gajur, Lion, Elephant, Diyo, Frame, GroundDisc, THREE, useMemo } = K;

  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  /* ---------- merged-geometry helpers (many small parts, one mesh) ---------- */
  const tmpM = new THREE.Matrix4();
  const tmpQ = new THREE.Quaternion();
  const tmpE = new THREE.Euler();
  const tmpS = new THREE.Vector3(1, 1, 1);
  const tmpP = new THREE.Vector3();
  const boxG = new THREE.BoxGeometry(1, 1, 1);
  const cylG = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
  const coneG = new THREE.ConeGeometry(0.5, 1, 8);
  const bx = (sx, sy, sz, x, y, z, ry = 0) => ({ g: boxG, s: [sx, sy, sz], p: [x, y, z], ry });
  const cy = (d, h, x, y, z) => ({ g: cylG, s: [d, h, d], p: [x, y, z], ry: 0 });
  const cn = (d, h, x, y, z) => ({ g: coneG, s: [d, h, d], p: [x, y, z], ry: 0 });
  function mergeParts(parts) {
    const pos = [], nor = [], uv = [], idx = [];
    let off = 0;
    parts.forEach((q) => {
      tmpE.set(0, q.ry || 0, 0); tmpQ.setFromEuler(tmpE); tmpP.set(q.p[0], q.p[1], q.p[2]); tmpS.set(q.s[0], q.s[1], q.s[2]);
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

  /* ---------- textures ---------- */
  const texCache = new Map();
  function latticeTex(rx) {
    const key = `lat${rx}`;
    if (texCache.has(key)) return texCache.get(key);
    const c = document.createElement('canvas'); c.width = 128; c.height = 64;
    const g = c.getContext('2d');
    g.fillStyle = '#2a1a10'; g.fillRect(0, 0, 128, 64);
    g.strokeStyle = '#8a5d36'; g.lineWidth = 4;
    for (let i = 8; i < 128; i += 16) { g.beginPath(); g.moveTo(i, 4); g.lineTo(i, 60); g.stroke(); }
    for (let j = 10; j < 64; j += 18) { g.beginPath(); g.moveTo(4, j); g.lineTo(124, j); g.stroke(); }
    g.strokeStyle = '#c9a227'; g.lineWidth = 3; g.strokeRect(2, 2, 124, 60);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, 1); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    texCache.set(key, t); return t;
  }
  function houseTex(brick, storeys, seed) {
    const key = `h${brick}${storeys}${seed}`;
    if (texCache.has(key)) return texCache.get(key);
    const W = 160, fh = 84, H = fh * storeys;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'); const r = rng(seed);
    g.fillStyle = brick; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(70,30,20,0.28)'; g.lineWidth = 1;
    for (let y = 6; y < H; y += 8) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    for (let s = 0; s < storeys; s++) {
      const top = H - (s + 1) * fh;
      if (s === 0) {
        g.fillStyle = '#3a2416'; g.fillRect(12, top + 22, 52, fh - 22);
        g.fillStyle = '#7a5434'; g.fillRect(18, top + 28, 40, fh - 28);
        g.fillStyle = '#2b1c12'; g.fillRect(92, top + 26, 44, 34);
        g.strokeStyle = '#a07040'; g.lineWidth = 2; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(98 + i * 10, top + 26); g.lineTo(98 + i * 10, top + 60); g.stroke(); }
      } else {
        const tri = s === storeys - 1 && r() < 0.6;
        [[14, 46], [100, 46]].forEach(([x, w]) => {
          g.fillStyle = '#3a2416'; g.fillRect(x - 3, top + 14, w + 6, 48);
          g.fillStyle = '#2b1c12'; g.fillRect(x, top + 18, w, 40);
          g.strokeStyle = '#9a6a3c'; g.lineWidth = 2;
          for (let i = 1; i < 5; i++) { g.beginPath(); g.moveTo(x + i * w / 5, top + 18); g.lineTo(x + i * w / 5, top + 58); g.stroke(); }
        });
        if (tri) { g.fillStyle = '#3a2416'; g.fillRect(58, top + 20, 44, 38); g.fillStyle = '#2b1c12'; g.fillRect(61, top + 23, 38, 32); }
        g.fillStyle = 'rgba(40,24,14,0.9)'; g.fillRect(0, top + fh - 5, W, 5);
      }
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    texCache.set(key, t); return t;
  }

  function glowTex(storeys) {
    const key = 'glow' + storeys;
    if (texCache.has(key)) return texCache.get(key);
    const W = 160, fh = 84, H = fh * storeys;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    for (let k = 0; k < storeys; k++) {
      const top = H - (k + 1) * fh;
      g.fillStyle = '#ffb060';
      if (k === 0) { g.fillRect(92, top + 26, 44, 34); } else { g.fillRect(14, top + 18, 46, 40); g.fillRect(100, top + 18, 46, 40); }
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    texCache.set(key, t); return t;
  }

  /* ---------- roof prism (ridge along x) ---------- */
  function Prism({ len, w, h, y, m, p = [0, 0, 0] }) {
    const geo = useMemo(() => {
      const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(0, h); sh.closePath();
      const g = new THREE.ExtrudeGeometry(sh, { depth: len, bevelEnabled: false });
      g.translate(0, 0, -len / 2); g.rotateY(Math.PI / 2); return g;
    }, [len, w, h]);
    return <mesh geometry={geo} material={m} position={[p[0], y, p[2]]} castShadow receiveShadow />;
  }

  /* ---------- the monastery ranges ---------- */
  const TIM = '#3a2416';
  function Range({ len, storeys = 2, p, ry = 0 }) {
    const M = useM();
    const timber = M.plain(TIM, { roughness: 0.8 });
    const timber2 = M.plain('#5d3a22', { roughness: 0.8 });
    const brass = M.plain('#d9aa30', { metalness: 0.7, roughness: 0.3, emissive: '#6a4a0a', emissiveIntensity: 0.4 });
    const wallLo = M.mat('brick', len / 0.9, 1, { color: '#c89a84' });
    const plasterUp = M.plain('#9a4a38', { roughness: 0.85 });
    const tile = M.mat('roof', 3, 3, { color: '#c8987c' });
    const redRail = M.plain('#9a2a1f', { roughness: 0.6 });
    const gilt = M.plain('#d9aa30', { metalness: 0.6, roughness: 0.35, emissive: '#5a4208', emissiveIntensity: 0.35 });
    const h1 = 0.9, y1 = 0.12, h2 = 0.75;
    const n = Math.max(2, Math.round(len / 0.55));
    const step = len / n;
    const px = (i) => -len / 2 + step * (i + 0.5);
    const topY = y1 + h1 + (storeys > 1 ? 0.1 + h2 : 0);
    return (
      <group position={p} rotation={[0, ry, 0]}>
        <Box s={[len, 0.14, 1.04]} p={[0, 0.07, 0]} m={M.stone} />
        {/* ground storey */}
        <Box s={[len, h1, 0.12]} p={[0, y1 + h1 / 2, -0.44]} m={wallLo} />
        <Box s={[len, h1, 0.1]} p={[0, y1 + h1 / 2, -0.02]} m={M.plain('#a86a52', { roughness: 0.9 })} />
        <Mg m={timber} build={() => {
          const a = [];
          for (let i = 0; i < n; i++) { a.push(bx(0.08, h1, 0.08, px(i) - step / 2, y1 + h1 / 2, 0.46)); }
          a.push(bx(0.08, h1, 0.08, len / 2, y1 + h1 / 2, 0.46));
          a.push(bx(len, 0.1, 0.12, 0, y1 + h1, 0.46)); a.push(bx(len, 0.05, 0.05, 0, y1 + 0.42, 0.46)); a.push(bx(len, 0.05, 0.05, 0, y1 + 0.12, 0.46));
          for (let i = 0; i < n; i++) { a.push(bx(0.3, 0.55, 0.03, px(i), y1 + 0.5, 0.05)); }
          return a;
        }} />
        <Mg m={brass} build={() => {
          const a = [];
          const nw = Math.round(len / 0.36), sw = len / nw;
          for (let i = 0; i < nw; i++) a.push(cy(0.14, 0.45, -len / 2 + sw * (i + 0.5), y1 + 0.46, 0.4));
          return a;
        }} />
        <Mg m={redRail} build={() => [bx(len, 0.05, 0.06, 0, y1 + 0.2, 0.42), bx(len, 0.04, 0.05, 0, y1 + 0.76, 0.42), bx(len, 0.14, 0.1, 0, y1 + 0.87, 0.5)]} />
        <Mg m={gilt} build={() => [bx(len + 0.04, 0.05, 0.16, 0, y1 + h1 + 0.02, 0.5), ...(storeys > 1 ? [bx(len + 0.04, 0.05, 0.16, 0, y1 + h1 + 0.1 + h2 + 0.07, 0.52)] : [])]} />
        {storeys > 1 && (
          <>
            <Box s={[len, 0.1, 1.0]} p={[0, y1 + h1 + 0.05, 0]} m={timber} />
            <Box s={[len, h2, 0.1]} p={[0, y1 + h1 + 0.1 + h2 / 2, -0.04]} m={plasterUp} />
            <Mg m={timber} build={() => {
              const a = []; const b = y1 + h1 + 0.1;
              for (let i = 0; i <= n; i++) a.push(bx(0.09, h2, 0.09, -len / 2 + step * i, b + h2 / 2, 0.46));
              a.push(bx(len, 0.12, 0.14, 0, b + h2, 0.46)); a.push(bx(len, 0.05, 0.05, 0, b + 0.38, 0.46)); a.push(bx(len, 0.07, 0.06, 0, b + 0.06, 0.48)); a.push(bx(len, 0.07, 0.06, 0, b + 0.5, 0.48));
              for (let i = 0; i < n; i++) a.push(bx(0.34, 0.34, 0.02, px(i), b + h2 * 0.55, -0.0));
              return a;
            }} />
            <mesh position={[0, y1 + h1 + 0.1 + 0.2, 0.455]}><boxGeometry args={[len, 0.34, 0.03]} /><meshStandardMaterial map={latticeTex(Math.round(len * 2.2))} roughness={0.85} emissive="#ff9a40" emissiveMap={latticeTex(Math.round(len * 2.2))} emissiveIntensity={0.3} /></mesh>
          </>
        )}
        <Box s={[len + 0.1, 0.1, 1.3]} p={[0, topY + 0.04, 0.12]} m={timber2} cast={false} />
        <Prism len={len + 0.3} w={1.75} h={0.34} y={topY + 0.08} p={[0, 0, 0.1]} m={tile} />
      </group>
    );
  }

  /* ---------- gate: low dark arched passage cut through a two-storey brick frontage ---------- */
  function GateRange() {
    const M = useM();
    const black = useMemo(() => new THREE.MeshStandardMaterial({ color: '#0d0a08', roughness: 1, side: THREE.DoubleSide }), []);
    const brickM = M.plain('#a8735c', { roughness: 0.9 });
    const stone = M.plain('#3f3b36', { roughness: 0.95 });
    const timber = M.plain(TIM, { roughness: 0.8 });
    const tile = M.mat('roof', 3, 3, { color: '#c8987c' });
    const gilt = M.plain('#d9aa30', { metalness: 0.6, roughness: 0.35, emissive: '#5a4208', emissiveIntensity: 0.3 });
    const lion = M.plain('#4a453e', { roughness: 0.9 });
    const W = 4.0, H = 1.5, D = 0.9, AR = 0.8, AY = 0.3;
    const facade = useMemo(() => {
      const sh = new THREE.Shape(); sh.moveTo(-W / 2, 0); sh.lineTo(W / 2, 0); sh.lineTo(W / 2, H); sh.lineTo(-W / 2, H); sh.closePath();
      const h = new THREE.Path(); h.moveTo(-AR, 0); h.lineTo(-AR, AY); h.absarc(0, AY, AR, Math.PI, 0, true); h.lineTo(AR, 0); h.closePath(); sh.holes.push(h);
      const g = new THREE.ExtrudeGeometry(sh, { depth: D, bevelEnabled: false, curveSegments: 14 }); g.translate(0, 0, -D / 2); return g;
    }, []);
    const ring = useMemo(() => {
      const o = AR + 0.2;
      const sh = new THREE.Shape(); sh.moveTo(-o, 0); sh.lineTo(-o, AY); sh.absarc(0, AY, o, Math.PI, 0, true); sh.lineTo(o, 0); sh.lineTo(AR, 0); sh.lineTo(AR, AY); sh.absarc(0, AY, AR, 0, Math.PI, false); sh.lineTo(-AR, 0); sh.closePath();
      const g = new THREE.ExtrudeGeometry(sh, { depth: 0.1, bevelEnabled: false, curveSegments: 14 }); g.translate(0, 0, D / 2); return g;
    }, []);
    const tunnel = useMemo(() => {
      const g = new THREE.CylinderGeometry(AR, AR, D, 16, 1, true, -Math.PI / 2, Math.PI); g.rotateX(Math.PI / 2); g.translate(0, AY, 0); return g;
    }, []);
    return (
      <group position={[0, 0, 3.85]}>
        <mesh geometry={facade} material={brickM} castShadow receiveShadow />
        <mesh geometry={ring} material={stone} castShadow />
        <mesh geometry={tunnel} material={black} />
        <Box s={[AR * 2, 0.03, D]} p={[0, 0.03, 0]} m={M.plain('#2a2622')} cast={false} />
        <Box s={[W + 0.06, 0.08, D + 0.14]} p={[0, 0.92, 0.02]} m={timber} />
        <Box s={[W + 0.06, 0.05, D + 0.2]} p={[0, H - 0.02, 0.03]} m={gilt} cast={false} />
        {[-1.5, 1.5].map((x, i) => (
          <group key={i} position={[x, 1.2, D / 2 + 0.01]}>
            <Box s={[0.46, 0.5, 0.06]} p={[0, 0, 0]} m={timber} />
            <Box s={[0.38, 0.42, 0.05]} p={[0, 0, 0.02]} m={M.plain('#3a2210', { emissive: '#ff9a40', emissiveIntensity: 0.4 })} cast={false} />
          </group>
        ))}
        <Box s={[W + 0.4, 0.1, 1.3]} p={[0, H + 0.04, 0.1]} m={timber} cast={false} />
        <Prism len={W + 0.3} w={1.75} h={0.34} y={H + 0.08} p={[0, 0, 0.1]} m={tile} />
        <Box s={[0.7, 0.1, 0.04]} p={[0, 1.38, D / 2 + 0.11]} m={gilt} cast={false} />
        {[-1, 1].map((k) => (
          <group key={k} position={[k * 1.42, 0, D / 2 + 0.4]}>
            <Box s={[0.6, 0.26, 0.6]} p={[0, 0.13, 0]} m={stone} />
            <group position={[0, 0.26, 0]} scale={1.25}><Lion m={lion} /></group>
          </group>
        ))}
        {[-1, 1].map((k) => <Range key={k} len={3.1} storeys={1} p={[k * 3.55, 0, 0.05]} ry={Math.PI} />)}
      </group>
    );
  }

  /* ---------- metal elephant + rider on tall stone plinth ---------- */
  function MetalElephant({ p, ry = 0 }) {
    const M = useM();
    const bronze = M.plain('#5a4a38', { metalness: 0.6, roughness: 0.45 });
    const st = M.plain('#5a554e', { roughness: 0.95 });
    const gild = M.plain('#d9a93a', { metalness: 0.6, roughness: 0.35, emissive: '#4a3306', emissiveIntensity: 0.3 });
    const crim = M.plain('#8e2520', { roughness: 0.8 });
    const S = 1.2;
    return (
      <group position={p} rotation={[0, ry, 0]}>
        <Box s={[1.1, 0.5, 1.9]} p={[0, 0.25, 0]} m={st} />
        <Box s={[1.18, 0.06, 1.98]} p={[0, 0.5, 0]} m={M.plain('#6a645b')} />
        <group position={[0, 0.5 - 0.27 * S, 0]} scale={S}>
          <group position={[0, 0.27, 0]} scale={2.1}><Elephant m={bronze} /></group>
          <Box s={[0.62, 0.05, 0.5]} p={[0, 1.2, -0.02]} m={gild} />
          <Box s={[0.66, 0.2, 0.05]} p={[0, 1.08, -0.02]} m={gild} cast={false} />
          <Box s={[0.5, 0.14, 0.02]} p={[0.0, 1.1, 0.24]} m={crim} cast={false} />
          <Box s={[0.4, 0.2, 0.32]} p={[0, 1.34, -0.02]} m={gild} />
          <Box s={[0.44, 0.04, 0.36]} p={[0, 1.46, -0.02]} m={crim} />
          <Box s={[0.18, 0.28, 0.14]} p={[0, 1.62, -0.02]} m={bronze} />
          <Ball rad={0.085} p={[0, 1.84, -0.02]} m={bronze} />
        </group>
      </group>
    );
  }

  /* ---------- gilded chaitya pavilion in the centre of the yard ---------- */
  function ChaityaPavilion({ p }) {
    const M = useM();
    const post = M.plain(TIM, { roughness: 0.75 });
    return (
      <group position={p} scale={0.72}>
        <Box s={[1.85, 0.1, 1.85]} p={[0, 0.05, 0]} m={M.plain('#8d877d', { roughness: 0.95 })} />
        <Box s={[1.5, 0.34, 1.5]} p={[0, 0.27, 0]} m={M.gold} />
        <Box s={[1.56, 0.06, 1.56]} p={[0, 0.46, 0]} m={M.plain('#b8862b', { metalness: 0.5, roughness: 0.4 })} />
        {/* balustrade */}
        <Mg m={M.gold} build={() => {
          const a = []; const R = 0.68;
          [[0, R, 1.36, 0.045], [0, -R, 1.36, 0.045]].forEach(([x, z, l, t]) => a.push(bx(l, 0.05, t, x, 0.62, z)));
          [[R, 0], [-R, 0]].forEach(([x, z]) => a.push(bx(0.045, 0.05, 1.36, x, 0.62, z)));
          for (let i = 0; i <= 6; i++) { const t = -0.68 + i * 0.2267; a.push(bx(0.04, 0.12, 0.04, t, 0.54, R)); a.push(bx(0.04, 0.12, 0.04, t, 0.54, -R)); if (i > 0 && i < 6) { a.push(bx(0.04, 0.12, 0.04, R, 0.54, t)); a.push(bx(0.04, 0.12, 0.04, -R, 0.54, t)); } }
          return a;
        }} />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], i) => <Cyl key={i} rt={0.045} h={0.82} p={[a * 0.55, 0.92, b * 0.55]} m={post} seg={8} />)}
        <Box s={[1.3, 0.08, 1.3]} p={[0, 1.36, 0]} m={post} />
        <group position={[0, 0.5, 0]} scale={0.75}>
          <Box s={[0.5, 0.26, 0.5]} p={[0, 0.13, 0]} m={M.stone} />
          <mesh position={[0, 0.26, 0]} material={M.stone} castShadow><sphereGeometry args={[0.21, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
          <Box s={[0.14, 0.14, 0.14]} p={[0, 0.5, 0]} m={M.gold} />
        </group>
        <Roof w={2.4} d={2.4} h={0.66} y={1.38} m={M.gold} sag={1.35} lift={0.22} />
        <Roof w={1.7} d={1.7} h={0.5} y={1.78} m={M.gold} sag={1.35} lift={0.18} />
        {/* gilded spire */}
        <Cyl rt={0.13} rb={0.2} h={0.24} p={[0, 2.38, 0]} m={M.gold} seg={10} />
        {[0, 1, 2, 3].map((i) => <Cyl key={i} rt={0.12 - i * 0.015} rb={0.14 - i * 0.015} h={0.06} p={[0, 2.54 + i * 0.09, 0]} m={M.gold} seg={10} />)}
        <mesh position={[0, 2.95, 0]} material={M.gold}><coneGeometry args={[0.08, 0.4, 8]} /></mesh>
        <Ball rad={0.07} p={[0, 3.18, 0]} m={M.gold} />
      </group>
    );
  }

  /* ---------- relief texture for the gilded repousse walls ---------- */
  function reliefTex() {
    if (texCache.has('relief')) return texCache.get('relief');
    const c = document.createElement('canvas'); c.width = 256; c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#c99a32'; g.fillRect(0, 0, 256, 128);
    for (let k = 0; k < 4; k++) {
      const x0 = k * 64;
      g.fillStyle = '#dcb552'; g.fillRect(x0 + 3, 4, 58, 120);
      g.strokeStyle = '#8a5f18'; g.lineWidth = 2; g.strokeRect(x0 + 3, 4, 58, 120);
      g.fillStyle = '#4a3210'; g.fillRect(x0 + 14, 16, 36, 58);
      g.fillStyle = '#e6c15a'; g.beginPath(); g.arc(x0 + 32, 34, 7, 0, 7); g.fill(); g.fillRect(x0 + 24, 42, 16, 24);
      g.strokeStyle = '#8a5f18'; g.lineWidth = 3;
      for (let j = 0; j < 3; j++) { g.beginPath(); g.arc(x0 + 32, 96, 8 + j * 6, Math.PI, 0); g.stroke(); }
      g.fillStyle = '#f0d070'; for (let j = 0; j < 6; j++) g.fillRect(x0 + 8 + j * 9, 112, 4, 6);
    }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    texCache.set('relief', t); return t;
  }

  /* ---------- the three-roof gilded main shrine (small gajur on top) ---------- */
  function Shrine({ p }) {
    const M = useM();
    const gold = M.gold;
    const goldBody = useMemo(() => new THREE.MeshStandardMaterial({ map: reliefTex(), color: '#ffffff', metalness: 0.45, roughness: 0.5, emissive: '#5a3c06', emissiveMap: reliefTex(), emissiveIntensity: 0.38 }), []);
    const goldDeep = M.plain('#a97a22', { metalness: 0.5, roughness: 0.45 });
    const dark = M.plain('#1c120a', { roughness: 0.85 });
    const post = M.plain(TIM, { roughness: 0.75 });
    const red = M.plain('#a32a1f', { roughness: 0.6, metalness: 0.2 });
    const cloth = [M.plain('#c9a227', { roughness: 0.7 }), M.plain('#8e2520', { roughness: 0.8 })];
    const PY = 0.36;
    const L = [
      { bw: 2.55, bd: 1.9, bh: 0.95, yb: PY, rw: 3.45, rd: 2.75, rh: 0.68 },
      { bw: 2.15, bd: 1.65, bh: 0.85, yb: 1.5, rw: 3.0, rd: 2.4, rh: 0.64 },
      { bw: 1.75, bd: 1.35, bh: 0.8, yb: 2.62, rw: 2.45, rd: 2.0, rh: 0.62 },
    ];
    const ye = (l) => l.yb + l.bh;
    /* gilt hanging fringe + 5 carved struts per side under a roof */
    const eave = (l) => (
      <>
        <Mg m={goldDeep} cast={false} build={() => {
          const a = []; const y = ye(l) + 0.02;
          const nf = Math.round(l.rw / 0.17), nd = Math.round(l.rd / 0.17);
          for (let i = 0; i < nf; i++) { const x = -l.rw / 2 * 0.94 + (l.rw * 0.94) * (i + 0.5) / nf; a.push(bx(0.11, 0.2, 0.02, x, y - 0.04, l.rd / 2 * 0.96)); }
          for (let i = 0; i < nd; i++) { const z = -l.rd / 2 * 0.94 + (l.rd * 0.94) * (i + 0.5) / nd; a.push(bx(0.02, 0.2, 0.11, l.rw / 2 * 0.96, y - 0.04, z)); a.push(bx(0.02, 0.2, 0.11, -l.rw / 2 * 0.96, y - 0.04, z)); }
          a.push(bx(l.rw * 0.96, 0.07, 0.05, 0, y + 0.07, l.rd / 2 * 0.96));
          a.push(bx(0.05, 0.07, l.rd * 0.96, l.rw / 2 * 0.96, y + 0.07, 0)); a.push(bx(0.05, 0.07, l.rd * 0.96, -l.rw / 2 * 0.96, y + 0.07, 0));
          return a;
        }} />
        <Mg m={red} cast={false} build={() => {
          const a = []; const y = ye(l) - 0.13;
          for (let i = 0; i < 5; i++) {
            const x = -l.bw * 0.42 + l.bw * 0.84 * i / 4; a.push(bx(0.05, 0.26, 0.05, x, y, l.bd / 2 + 0.3)); a.push(bx(0.04, 0.04, 0.3, x, y + 0.1, l.bd / 2 + 0.15));
            const z = -l.bd * 0.42 + l.bd * 0.84 * i / 4;
            [-1, 1].forEach((k) => { a.push(bx(0.05, 0.26, 0.05, k * (l.bw / 2 + 0.3), y, z)); a.push(bx(0.3, 0.04, 0.04, k * (l.bw / 2 + 0.15), y + 0.1, z)); });
          }
          return a;
        }} />
      </>
    );
    return (
      <group position={p}>
        {/* plinth with steps */}
        <Box s={[3.1, PY, 2.6]} p={[0, PY / 2, 0]} m={M.plain('#6a645b', { roughness: 0.95 })} />
        <Box s={[3.15, 0.05, 2.65]} p={[0, PY - 0.02, 0]} m={goldDeep} cast={false} />
        <Box s={[1.9, 0.12, 0.3]} p={[0, 0.06, 1.45]} m={M.plain('#7d776d')} />
        <Box s={[1.5, 0.12, 0.2]} p={[0, 0.18, 1.28]} m={M.plain('#867f74')} />
        {/* storey 1: gilded repousse front with red grille, verandah posts */}
        {(() => {
          const l = L[0];
          return (
            <>
              <Box s={[l.bw, l.bh, l.bd]} p={[0, l.yb + l.bh / 2, 0]} m={goldBody} />
              <Box s={[l.bw + 0.05, 0.08, l.bd + 0.05]} p={[0, l.yb + 0.04, 0]} m={goldDeep} cast={false} />
              <Box s={[1.3, 0.72, 0.06]} p={[0, l.yb + 0.45, l.bd / 2 + 0.01]} m={dark} />
              <Mg m={red} build={() => {
                const a = []; const z = l.bd / 2 + 0.2;
                for (let i = 0; i <= 12; i++) a.push(bx(0.025, 0.72, 0.025, -0.66 + i * 0.11, l.yb + 0.47, z));
                a.push(bx(1.4, 0.05, 0.05, 0, l.yb + 0.1, z)); a.push(bx(1.4, 0.05, 0.05, 0, l.yb + 0.84, z)); a.push(bx(1.4, 0.04, 0.04, 0, l.yb + 0.45, z));
                return a;
              }} />
              {[-1, 1].map((k) => <Box key={k} s={[0.5, 0.62, 0.05]} p={[k * 0.95, l.yb + 0.45, l.bd / 2 + 0.01]} m={dark} />)}
              {[-1, 1].map((k) => <Box key={`g${k}`} s={[0.58, 0.07, 0.06]} p={[k * 0.95, l.yb + 0.8, l.bd / 2 + 0.03]} m={goldDeep} cast={false} />)}
              {[-1.4, -0.9, -0.45, 0.45, 0.9, 1.4].map((x, i) => <Cyl key={i} rt={0.055} h={l.bh - 0.02} p={[x, l.yb + l.bh / 2, l.bd / 2 + 0.38]} m={post} seg={8} />)}
              <Box s={[3.0, 0.1, 0.12]} p={[0, ye(l) - 0.03, l.bd / 2 + 0.38]} m={post} cast={false} />
              <Box s={[3.0, 0.06, 0.05]} p={[0, l.yb + 0.28, l.bd / 2 + 0.38]} m={post} cast={false} />
              <Roof w={l.rw} d={l.rd} h={l.rh} y={ye(l)} m={gold} sag={1.35} lift={0.24} />
              {eave(l)}
            </>
          );
        })()}
        {/* storeys 2 and 3: deep dark gilt-framed windows on every face */}
        {[1, 2].map((i) => {
          const l = L[i];
          const wy = l.yb + l.bh * 0.5;
          return (
            <group key={i}>
              <Box s={[l.bw, l.bh, l.bd]} p={[0, l.yb + l.bh / 2, 0]} m={goldBody} />
              <Box s={[l.bw + 0.05, 0.06, l.bd + 0.05]} p={[0, l.yb + 0.03, 0]} m={goldDeep} cast={false} />
              {[-1, 0, 1].map((k) => (
                <group key={k} position={[k * l.bw * 0.3, wy, l.bd / 2]}>
                  <Box s={[0.62, 0.64, 0.07]} p={[0, 0, 0.01]} m={goldDeep} />
                  <Box s={[0.46, 0.5, 0.1]} p={[0, 0, 0.03]} m={dark} />
                  <Box s={[0.7, 0.07, 0.1]} p={[0, 0.36, 0.02]} m={gold} cast={false} />
                </group>
              ))}
              {[-1, 1].map((k) => (
                <group key={`s${k}`} position={[k * (l.bw / 2), wy, 0]}>
                  <Box s={[0.07, 0.64, 0.62]} p={[k * 0.01, 0, 0]} m={goldDeep} />
                  <Box s={[0.1, 0.5, 0.46]} p={[k * 0.03, 0, 0]} m={dark} />
                </group>
              ))}
              <Box s={[0.5, 0.5, 0.05]} p={[0, wy, -l.bd / 2 - 0.01]} m={dark} />
              <Roof w={l.rw} d={l.rd} h={l.rh} y={ye(l)} m={gold} sag={1.35} lift={0.24} />
              {eave(l)}
            </group>
          );
        })}
        {/* banners hanging from the top two roofs */}
        {[-0.7, -0.35, 0, 0.35, 0.7].map((x, i) => <Box key={i} s={[0.12, 0.5, 0.012]} p={[x, ye(L[2]) - 0.3, L[2].bd / 2 + 0.3]} m={cloth[i % 2]} cast={false} />)}
        {[-0.9, -0.45, 0.45, 0.9].map((x, i) => <Box key={i} s={[0.1, 0.42, 0.012]} p={[x, ye(L[1]) - 0.3, L[1].bd / 2 + 0.3]} m={cloth[(i + 1) % 2]} cast={false} />)}
        {/* small gajur on the top roof (spire kept short) */}
        <Cyl rt={0.3} rb={0.46} h={0.24} p={[0, ye(L[2]) + L[2].rh + 0.08, 0]} m={gold} seg={14} />
        <Gajur y={ye(L[2]) + L[2].rh + 0.15} s={1.4} />
        <mesh position={[0, ye(L[2]) + L[2].rh + 1.95, 0]} material={gold}><coneGeometry args={[0.04, 0.6, 6]} /></mesh>
        <Box s={[0.4, 0.04, 0.04]} p={[0, ye(L[2]) + 0.25, L[2].rd / 2 + 0.34]} m={gold} cast={false} />
        {/* long patāka banner hanging down the front of the top roof */}
        <Box s={[0.2, 1.3, 0.015]} p={[0, ye(L[2]) - 0.4, L[2].rd / 2 + 0.34]} m={cloth[1]} cast={false} />
        <Box s={[0.05, 1.3, 0.02]} p={[-0.12, ye(L[2]) - 0.4, L[2].rd / 2 + 0.34]} m={gold} cast={false} />
        <Box s={[0.05, 1.3, 0.02]} p={[0.12, ye(L[2]) - 0.4, L[2].rd / 2 + 0.34]} m={gold} cast={false} />
        <pointLight position={[0, 1.6, 2.4]} intensity={3.2} distance={9} color="#ffb860" />
        <pointLight position={[0, 3.2, 2.0]} intensity={1.6} distance={7} color="#ffa850" />
      </group>
    );
  }

  /* ---------- bronze bell on timber frame, brass monkeys, butter lamps ---------- */
  function BellFrame({ p }) {
    const M = useM();
    const post = M.plain(TIM, { roughness: 0.75 });
    const bronze = M.plain('#2f2923', { metalness: 0.75, roughness: 0.4 });
    return (
      <group position={p}>
        <Box s={[0.9, 0.12, 0.5]} p={[0, 0.06, 0]} m={M.plain('#7d776d', { roughness: 0.95 })} />
        {[-1, 1].map((k) => <Box key={k} s={[0.09, 1.25, 0.09]} p={[k * 0.38, 0.72, 0]} m={post} />)}
        <Box s={[1.0, 0.1, 0.12]} p={[0, 1.34, 0]} m={post} />
        <Cyl rt={0.03} h={0.2} p={[0, 1.2, 0]} m={bronze} seg={8} />
        <mesh position={[0, 0.84, 0]} material={bronze} castShadow><cylinderGeometry args={[0.16, 0.3, 0.55, 16]} /></mesh>
        <mesh position={[0, 0.57, 0]} material={bronze}><torusGeometry args={[0.3, 0.025, 6, 16]} /></mesh>
        <Ball rad={0.055} p={[0, 0.56, 0]} m={M.plain('#8a6a2a', { metalness: 0.7 })} />
      </group>
    );
  }
  function VotiveChaitya({ p }) {
    const M = useM();
    const wh = M.plain('#cfc8b8', { roughness: 0.9 });
    return (
      <group position={p}>
        <Box s={[0.5, 0.14, 0.5]} p={[0, 0.07, 0]} m={M.stone} />
        <Box s={[0.36, 0.14, 0.36]} p={[0, 0.21, 0]} m={wh} />
        <mesh position={[0, 0.28, 0]} material={wh} castShadow><sphereGeometry args={[0.16, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
        <Box s={[0.1, 0.1, 0.1]} p={[0, 0.5, 0]} m={M.gold} />
        {[0, 1, 2, 3].map((i) => <Cyl key={i} rt={0.06 - i * 0.012} rb={0.07 - i * 0.012} h={0.04} p={[0, 0.58 + i * 0.05, 0]} m={M.gold} seg={8} />)}
      </group>
    );
  }
  function Monkey2({ p, m }) {
    return (
      <group position={p}>
        <Box s={[0.1, 0.1, 0.1]} p={[0, 0.08, 0]} m={m} />
        <Ball rad={0.045} p={[0, 0.17, 0.02]} m={m} />
        <Cyl rt={0.015} h={0.12} p={[0.06, 0.1, -0.06]} r={[0.8, 0, 0]} m={m} seg={5} />
      </group>
    );
  }

  /* ================= MAIN ================= */
  function GoldenTempleMain() {
    const M = useM();
    const paving = M.mat('herring', 6, 5, { color: '#ffffff', roughness: 0.95 });
    const paving2 = M.plain('#6f695f', { roughness: 0.95 });
    const brassM = M.plain('#c9a227', { metalness: 0.7, roughness: 0.35 });
    return (
      <group>
        {/* courtyard paving */}
        <mesh position={[0, 0.015, -0.2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={paving}><planeGeometry args={[9.2, 7.6]} /></mesh>
        <Box s={[1.3, 0.03, 4.0]} p={[0, 0.02, 1.9]} m={paving2} cast={false} />

        {/* enclosing two-storey ranges (left, right, back) */}
        <Range len={7.6} p={[-5.0, 0, -0.2]} ry={Math.PI / 2} />
        <Range len={7.6} p={[5.0, 0, -0.2]} ry={-Math.PI / 2} />
        <Range len={10.8} p={[0, 0, -4.3]} ry={0} />
        {/* front: gate and low wings */}
        <GateRange />

        {/* single central axis */}
        <MetalElephant p={[-1.55, 0, 3.0]} ry={Math.PI / 2} />
        <MetalElephant p={[1.55, 0, 3.0]} ry={-Math.PI / 2} />
        <ChaityaPavilion p={[0, 0, 0.85]} />
        {[-1, 1].map((k) => <VotiveChaitya key={k} p={[k * 2.5, 0, 0.9]} />)}
        <Shrine p={[0, 0, -2.5]} />

        {/* bell, monkeys, lamps */}
        <group position={[-3.3, 0, -0.4]} scale={1.4}><BellFrame p={[0, 0, 0]} /></group>
        
        {/* butter-lamp shelf in front of the right range */}
        <Box s={[0.36, 0.08, 1.7]} p={[3.55, 0.34, 0.3]} m={M.plain('#3a2416')} />
        {[-1, 1].map((k) => <Box key={k} s={[0.06, 0.3, 0.06]} p={[3.55, 0.17, 0.3 + k * 0.75]} m={M.plain('#3a2416')} />)}
        {[-0.7, -0.5, -0.3, -0.1, 0.1, 0.3, 0.5, 0.7].map((z, i) => <group key={i} position={[3.55, 0.3, 0.3 + z]} scale={1.5}><Diyo p={[0, 0.04, 0]} light={i % 3 === 0} /></group>)}
        <pointLight position={[3.4, 0.7, 0.3]} intensity={1.4} distance={3.5} color="#ff9a40" />
        <Frame s={[8.8, 5.8, 7.6]} p={[0, 2.8, -0.2]} />
      </group>
    );
  }

  /* ================= ENV: dense flat Newar neighbourhood ================= */
  function NearHouse({ x, z, w, d, st, ry, seed }) {
    const M = useM();
    const cols = ['#a87a62', '#c9b79e', '#9c8a7a', '#b08468', '#d8cbb4', '#8f7060', '#a89684'];
    const r = rng(seed);
    const col = cols[Math.floor(r() * cols.length)];
    const tex = houseTex(col, st, Math.floor(r() * 3) + 1);
    const hh = st * 0.58;
    const tc = ['#8a5a48', '#9a6a50', '#7f6a5c', '#8a5a48'][Math.floor(r() * 4)];
    const tile = M.mat('roof', 2, 2, { color: tc });
    return (
      <group position={[x, 0, z]} rotation={[0, ry, 0]}>
        <mesh position={[0, hh / 2, 0]} castShadow receiveShadow><boxGeometry args={[w, hh, d]} /><meshStandardMaterial map={tex} roughness={0.9} emissive="#ff9a40" emissiveMap={glowTex(st)} emissiveIntensity={0.3} /></mesh>
        <Box s={[w + 0.1, 0.06, d + 0.1]} p={[0, hh + 0.02, 0]} m={M.dark} cast={false} />
        <Roof w={w + 0.28} d={d + 0.28} h={0.24} y={hh + 0.04} m={tile} sag={1.1} lift={0.05} fascia={false} />
      </group>
    );
  }
  function FarField() {
    const M = useM();
    const { bodies, roofs, n } = useMemo(() => {
      const r = rng(77); const b = []; const rf = [];
      for (let gx = -18; gx <= 18; gx++) for (let gz = -18; gz <= 18; gz++) {
        const x = gx * 1.55 + (r() - 0.5) * 0.3, z = gz * 1.55 + (r() - 0.5) * 0.3;
        const dd = Math.hypot(x, z);
        if (dd > 27) continue;
        if (Math.abs(x) < 1.2 && z > 0) { r(); r(); r(); continue; }
        if (Math.abs(x) < 10.4 && z > -9.4 && z < 10.2) { r(); r(); r(); continue; }
        if (gx % 6 === 0 || gz % 7 === 0 || r() < 0.12) { r(); r(); r(); continue; }
        const st = 2 + Math.floor(r() * 2);
        const w = 1.1 + r() * 0.35, hh = st * 0.58;
        const cream = r() < 0.3; const c = new THREE.Color().setHSL(cream ? 0.1 : 0.05 + r() * 0.03, cream ? 0.25 : 0.2 + r() * 0.1, cream ? 0.72 + r() * 0.08 : 0.5 + r() * 0.1);
        b.push({ x, z, w, d: w * (0.9 + r() * 0.3), hh, c });
        const flat = r() < 0.2; rf.push({ x, z, w, hh, flat, c: new THREE.Color().setHSL(flat ? 0.08 : 0.06, flat ? 0.08 : 0.22, flat ? 0.42 : 0.5 + r() * 0.08), rot: 0 });
      }
      return { bodies: b, roofs: rf, n: b.length };
    }, []);
    const setB = (im) => {
      if (!im || im.userData.done) return; im.userData.done = true;
      const m4 = new THREE.Matrix4();
      bodies.forEach((o, i) => { m4.compose(new THREE.Vector3(o.x, o.hh / 2, o.z), new THREE.Quaternion(), new THREE.Vector3(o.w, o.hh, o.d)); im.setMatrixAt(i, m4); im.setColorAt(i, o.c); });
      im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
    };
    const setR = (im) => {
      if (!im || im.userData.done) return; im.userData.done = true;
      const m4 = new THREE.Matrix4(); const q = new THREE.Quaternion();
      roofs.forEach((o, i) => { q.setFromEuler(new THREE.Euler(0, Math.PI / 4 + o.rot * 0, 0)); m4.compose(new THREE.Vector3(o.x, o.hh + (o.flat ? 0.04 : 0.2), o.z), q, new THREE.Vector3(o.w * 1.18, o.flat ? 0.08 : 0.4, o.w * 1.18)); im.setMatrixAt(i, m4); im.setColorAt(i, o.c); });
      im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
    };
    return (
      <group>
        <instancedMesh args={[undefined, undefined, n]} ref={setB} castShadow receiveShadow>
          <boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#ffffff" map={houseTex('#e0b49c', 3, 2)} roughness={0.95} />
        </instancedMesh>
        <instancedMesh args={[undefined, undefined, n]} ref={setR} castShadow>
          <coneGeometry args={[0.7071, 1, 4]} /><meshStandardMaterial color="#ffffff" map={M.mat('roof', 1, 1).map} roughness={0.95} />
        </instancedMesh>
      </group>
    );
  }

  /* whitewashed stupa and a stone shikhara rising behind the roofs (Patan skyline) */
  function NearStupa({ p }) {
    const M = useM();
    const wh = M.plain('#e8e2d4', { roughness: 0.85 });
    return (
      <group position={p}>
        <Box s={[2.2, 1.6, 2.2]} p={[0, 0.8, 0]} m={M.plain('#9a7a62', { roughness: 0.95 })} />
        <Cyl rt={1.05} rb={1.15} h={0.3} p={[0, 1.75, 0]} m={M.stone} seg={16} />
        <mesh position={[0, 1.9, 0]} material={wh} castShadow><sphereGeometry args={[0.95, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
        <Box s={[0.5, 0.4, 0.5]} p={[0, 2.95, 0]} m={M.gold} />
        {[0, 1, 2, 3, 4, 5].map((i) => <Cyl key={i} rt={0.2 - i * 0.025} rb={0.24 - i * 0.025} h={0.09} p={[0, 3.25 + i * 0.1, 0]} m={M.gold} seg={10} />)}
        <mesh position={[0, 4.1, 0]} material={M.gold}><coneGeometry args={[0.06, 0.4, 6]} /></mesh>
      </group>
    );
  }
  function NearShikhara({ p }) {
    const M = useM();
    const st = M.plain('#b9ad99', { roughness: 0.95 });
    return (
      <group position={p}>
        <Box s={[2.6, 0.5, 2.6]} p={[0, 0.25, 0]} m={M.plain('#8a7a68', { roughness: 0.95 })} />
        <Box s={[1.5, 1.5, 1.5]} p={[0, 1.25, 0]} m={st} />
        {[0, 1, 2, 3, 4].map((i) => <Box key={i} s={[1.35 - i * 0.22, 0.34, 1.35 - i * 0.22]} p={[0, 2.15 + i * 0.32, 0]} m={st} />)}
        <Cyl rt={0.08} rb={0.2} h={0.26} p={[0, 3.9, 0]} m={M.gold} seg={10} />
        <mesh position={[0, 4.25, 0]} material={M.gold}><coneGeometry args={[0.06, 0.45, 6]} /></mesh>
      </group>
    );
  }

  function GoldenTempleEnv() {
    const M = useM();
    const houses = useMemo(() => {
      const r = rng(31); const a = []; let id = 1;
      const run = (from, to, f) => { let t = from; while (t < to) { const w = 1.05 + r() * 0.5; if (r() > 0.06) a.push(f(t + w / 2, w, id++)); t += w + 0.02; } };
      // left and right sides (abut the outer wall of the ranges)
      [-1, 1].forEach((k) => {
        [0, 1].forEach((row) => {
          const d = 1.3 + r() * 0.2;
          const cx = k * (5.65 + d / 2 + row * 1.55);
          run(-5.6, 4.1, (t, w, i) => ({ x: cx, z: t, w: d, d: w, st: row === 0 ? 2 + Math.floor(r() * 2) : 2 + Math.floor(r() * 3), ry: 0, seed: i }));
        });
      });
      // back
      [0, 1].forEach((row) => { const d = 1.3 + r() * 0.2; run(-5.6, 5.6, (t, w, i) => ({ x: t, z: -4.85 - d / 2 - row * 1.55, w, d, st: row === 0 ? 2 + Math.floor(r() * 2) : 2 + Math.floor(r() * 3), ry: 0, seed: i })); });
      // front, across the narrow lane (kept 2-3 storeys so the view stays open)
      [-1, 1].forEach((k) => {
        const from = k < 0 ? -7.8 : 1.6; const to = k < 0 ? -1.7 : 7.8;
        run(from, to, (t, w, i) => ({ x: t, z: 6.2, w, d: 1.25, st: 2, ry: 0, seed: i }));
      });
      return a;
    }, []);
    return (
      <group>
        <GroundDisc r={46} m={M.plain('#a08c78', { roughness: 1 })} y={-0.02} />
        {/* narrow brick-paved lane along the front and down the sides */}
        <Box s={[26, 0.03, 1.5]} p={[0, 0.0, 5.0]} m={M.mat('herring', 14, 1, { color: '#9a8a78' })} cast={false} />
        <Box s={[1.4, 0.03, 12]} p={[0, 0.0, 10.5]} m={M.mat('herring', 1, 6, { color: '#9a8a78' })} cast={false} />
        {houses.map((h, i) => <NearHouse key={i} {...h} />)}
        <FarField />
      </group>
    );
  }

  return { 'golden-temple': { Main: GoldenTempleMain, Env: GoldenTempleEnv } };
}
