// Siddha Pokhari (Ta Pukhu), Bhaktapur. A plain, huge rectangular man-made pond, about 171 x 73 m, nothing in the water.
// Scale: 1 unit = 3 m, so the water is 57 x 24.3 units. Camera sits at +x,+y,+z; the long far bank (-z) carries the small red-roofed
// pavilions and a wall of trees; the hill ridge, radio mast and a red/white building show beyond. The near (+z) bank is kept low and clear.
// Compass is not given by any source, so orientation is a free choice here.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Frame, THREE, useMemo, useRef, useEffect, useState } = K;

  const W = 57, D = 24.3, HX = W / 2, HZ = D / 2;
  const WY = -0.72;            // water level
  const CT = 0.16;             // coping top above walkway
  const BAT = 0.5;             // horizontal run of the sloped inner face
  const COP = 0.38;            // coping width
  const WALK = 1.2;            // walkway width

  const mkRng = (seed) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
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

  /* ---------- helpers ---------- */
  const rectRing = (ox, oz, ix, iz) => {
    const s = new THREE.Shape();
    s.moveTo(-ox, -oz); s.lineTo(ox, -oz); s.lineTo(ox, oz); s.lineTo(-ox, oz); s.closePath();
    const h = new THREE.Path();
    h.moveTo(-ix, -iz); h.lineTo(-ix, iz); h.lineTo(ix, iz); h.lineTo(ix, -iz); h.closePath();
    s.holes.push(h);
    return s;
  };
  const flatRing = (ox, oz, ix, iz) => { const g = new THREE.ShapeGeometry(rectRing(ox, oz, ix, iz)); g.rotateX(-Math.PI / 2); return g; };
  const slabRing = (ox, oz, ix, iz, depth) => { const g = new THREE.ExtrudeGeometry(rectRing(ox, oz, ix, iz), { depth, bevelEnabled: false }); g.rotateX(-Math.PI / 2); return g; };

  function Inst({ items, m, kind = 'sphere', cast = false }) {
    const ref = useRef();
    useEffect(() => {
      if (!ref.current) return;
      const o = new THREE.Object3D(); const c = new THREE.Color();
      items.forEach((it, i) => {
        o.position.set(it[0], it[1], it[2]); o.rotation.set(0, it[6] || 0, 0); o.scale.set(it[3], it[4], it[5]);
        o.updateMatrix(); ref.current.setMatrixAt(i, o.matrix);
        if (it[7]) { c.set(it[7]); ref.current.setColorAt(i, c); }
      });
      ref.current.instanceMatrix.needsUpdate = true;
      if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    }, [items]);
    return (
      <instancedMesh ref={ref} args={[null, null, items.length]} material={m} castShadow={cast} receiveShadow frustumCulled={false}>
        {kind === 'box' ? <boxGeometry args={[1, 1, 1]} /> : kind === 'cyl' ? <cylinderGeometry args={[0.5, 0.5, 1, 7]} /> : <icosahedronGeometry args={[0.5, 1]} />}
      </instancedMesh>
    );
  }

  function Strut({ a, b, r = 0.03, m }) {
    const g = useMemo(() => {
      const A = new THREE.Vector3(...a); const B = new THREE.Vector3(...b);
      const d = B.clone().sub(A); const len = d.length();
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
      return { pos: A.clone().add(B).multiplyScalar(0.5).toArray(), len, q: q.toArray() };
    }, [a, b]);
    return <mesh position={g.pos} quaternion={g.q} material={m}><cylinderGeometry args={[r, r, g.len, 5]} /></mesh>;
  }

  /* ---------- water texture: fine ripples, murky green ---------- */
  function useWaterTex() {
    return useMemo(() => {
      const c = document.createElement('canvas'); c.width = 256; c.height = 256;
      const g = c.getContext('2d');
      g.fillStyle = '#54735a'; g.fillRect(0, 0, 256, 256);
      const r = mkRng(11);
      for (let i = 0; i < 900; i += 1) {
        const x = r() * 256; const y = r() * 256; const l = 5 + r() * 14;
        g.strokeStyle = r() > 0.5 ? 'rgba(170,196,170,0.40)' : 'rgba(30,52,38,0.40)';
        g.lineWidth = 1 + r() * 1.4;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y + (r() - 0.5) * 1.5); g.stroke();
      }
      const t = new THREE.CanvasTexture(c);
      t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping; t.repeat.set(13, 5.5);
      if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
      return t;
    }, []);
  }
  function useReflTex() {
    return useMemo(() => {
      const c = document.createElement('canvas'); c.width = 256; c.height = 64;
      const g = c.getContext('2d');
      const gr = g.createLinearGradient(0, 0, 0, 64);
      gr.addColorStop(0, 'rgba(22,48,28,0.62)'); gr.addColorStop(0.55, 'rgba(34,62,38,0.34)'); gr.addColorStop(1, 'rgba(40,70,44,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 256, 64);
      const r = mkRng(5);
      try { g.filter = 'blur(3px)'; } catch (e) { /* ignore */ }
      for (let i = 0; i < 60; i += 1) { g.fillStyle = `rgba(20,40,24,${0.05 + r() * 0.08})`; g.fillRect(r() * 256, 0, 4 + r() * 12, 14 + r() * 36); }
      try { g.filter = 'none'; } catch (e) { /* ignore */ }
      g.globalCompositeOperation = 'destination-in';
      const hf = g.createLinearGradient(0, 0, 256, 0);
      hf.addColorStop(0, 'rgba(0,0,0,0)'); hf.addColorStop(0.12, 'rgba(0,0,0,1)'); hf.addColorStop(0.88, 'rgba(0,0,0,1)'); hf.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = hf; g.fillRect(0, 0, 256, 64);
      const t = new THREE.CanvasTexture(c);
      if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
      return t;
    }, []);
  }

  /* ---------- the pond: sloped white inner face, coping, brick-edged walkway ---------- */
  function PondShell() {
    const M = useM();
    const batter = useMemo(() => {
      const top = (sx, sz) => [sx * HX, CT, sz * HZ];
      const bot = (sx, sz) => [sx * (HX - BAT), WY - 0.05, sz * (HZ - BAT)];
      const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
      const pos = []; const col = []; const idx = [];
      const cTop = new THREE.Color('#e6e2d6'); const cBot = new THREE.Color('#5d7a5a');
      corners.forEach(([sx, sz]) => { pos.push(...top(sx, sz)); col.push(cTop.r, cTop.g, cTop.b); });
      corners.forEach(([sx, sz]) => { pos.push(...bot(sx, sz)); col.push(cBot.r, cBot.g, cBot.b); });
      for (let i = 0; i < 4; i += 1) { const j = (i + 1) % 4; idx.push(i, j, 4 + j, i, 4 + j, 4 + i); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.setIndex(idx); g.computeVertexNormals();
      return g;
    }, []);
    const cop = useMemo(() => slabRing(HX + COP, HZ + COP, HX, HZ, CT), []);
    const brick = useMemo(() => flatRing(HX + COP + 0.5, HZ + COP + 0.5, HX + COP, HZ + COP), []);
    const walk = useMemo(() => flatRing(HX + COP + WALK, HZ + COP + WALK, HX + COP + 0.5, HZ + COP + 0.5), []);
    const tex = useWaterTex(); const refl = useReflTex();
    const waterGeo = useMemo(() => {
      const g = new THREE.PlaneGeometry(W - 2 * BAT + 0.3, D - 2 * BAT + 0.3, 1, 8);
      const p = g.attributes.position; const c = []; const near = new THREE.Color('#4a6b5a'); const far = new THREE.Color('#3a5a44'); const t = new THREE.Color();
      for (let i = 0; i < p.count; i += 1) { const k = (p.getY(i) / (D / 2)) * 0.5 + 0.5; t.copy(far).lerp(near, 1 - k); c.push(t.r * 3.6, t.g * 3.6, t.b * 3.6); }
      g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
      return g;
    }, []);
    const white = M.plain('#ece8de', { roughness: 0.9 });
    return (
      <group>
        <mesh geometry={batter}><meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.95} /></mesh>
        <mesh geometry={cop} material={white} castShadow receiveShadow />
        <mesh geometry={brick} position={[0, 0.012, 0]} material={M.plain('#b0705a', { roughness: 1 })} receiveShadow />
        <mesh geometry={walk} position={[0, 0.01, 0]} material={M.plain('#8f8a6c', { roughness: 1 })} receiveShadow />
        {/* water */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, WY, 0]} receiveShadow>
          <primitive object={waterGeo} attach="geometry" />
          <meshStandardMaterial map={tex} color="#ffffff" metalness={0.12} roughness={0.28} vertexColors />
        </mesh>
        {/* soft mirror of the far tree line */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, WY + 0.01, -HZ + BAT + 5]}>
          <planeGeometry args={[W - 2 * BAT, 10]} />
          <meshBasicMaterial map={refl} transparent opacity={0.85} depthWrite={false} />
        </mesh>
      </group>
    );
  }

  /* ---------- a small red-roofed pavilion (not a temple: no finial) ---------- */
  function Pavilion({ p, w = 1.5, d = 1.3, big = false, glow = false, sc = 1.6 }) {
    const M = useM();
    const cream = M.plain('#efe8d6', { roughness: 0.9 });
    const dark = glow ? <meshBasicMaterial color="#ffb85a" /> : null;
    const tile = M.mat('roof', 4, 3, { color: '#b5543a' });
    const wh = big ? 1.15 : 1.0;
    const open = (x, ww) => (
      <mesh key={x} position={[x, 0.24 + wh * 0.5 - 0.05, d / 2 + 0.01]}>
        <boxGeometry args={[ww, wh - 0.2, 0.04]} />
        {dark || <meshStandardMaterial color="#3a2616" roughness={1} />}
      </mesh>
    );
    return (
      <group position={p} scale={sc}>
        <Box s={[w + 0.7, 0.24, d + 0.7]} p={[0, 0.12, 0]} m={M.plain('#e4dccb', { roughness: 0.95 })} />
        <Box s={[w, wh, d]} p={[0, 0.24 + wh / 2, 0]} m={cream} />
        {big
          ? [-1.4, -0.7, 0, 0.7, 1.4].map((x) => open(x * (w / 3.4), 0.5))
          : [-0.38, 0.38].map((x) => open(x * (w / 1.5) * 1.1, 0.42))}
        {big && [-1.55, -0.78, 0, 0.78, 1.55].map((x) => <Box key={x} s={[0.14, wh, 0.14]} p={[x * (w / 3.4), 0.24 + wh / 2, d / 2 + 0.14]} m={cream} />)}
        <Box s={[w + 0.06, 0.1, d + 0.06]} p={[0, 0.24 + wh + 0.02, 0]} m={M.plain('#8a3a28', { roughness: 0.9 })} />
        <Roof w={w + (big ? 2.4 : 1.0)} d={d + (big ? 2.2 : 1.0)} h={big ? 1.0 : 0.8} y={0.24 + wh + 0.06} m={tile} sag={1.03} lift={0.08} fascia={false} />
      </group>
    );
  }

  /* tiny stone deity on a plinth */
  function Image({ p, kind = 0 }) {
    const M = useM();
    const st = M.plain('#8d8a80', { roughness: 1 });
    return (
      <group position={p}>
        <Box s={[0.5, 0.28, 0.42]} p={[0, 0.14, 0]} m={M.plain('#cfc8b8')} />
        {kind === 0 && <><Box s={[0.26, 0.3, 0.16]} p={[0, 0.43, 0]} m={st} /><Ball rad={0.11} p={[0, 0.66, 0]} m={st} /></>}
        {kind === 1 && <><Cyl rt={0.1} rb={0.15} h={0.26} p={[0, 0.41, 0]} m={st} seg={8} /><Ball rad={0.1} p={[0, 0.62, 0]} m={st} /></>}
        {kind === 2 && <><Box s={[0.3, 0.46, 0.1]} p={[0, 0.51, 0]} m={st} /><Ball rad={0.15} p={[0, 0.76, 0]} sc={[1, 0.8, 0.4]} m={st} /></>}
      </group>
    );
  }

  /* short ghat flight down to the water, cut through the coping */
  function Ghat({ x, dir = 1 }) {
    const M = useM();
    const st = M.plain('#d8d2c3', { roughness: 0.95 });
    return (
      <group position={[x, 0, 0]}>
        {[0, 1, 2, 3, 4].map((k) => {
          const top = CT - k * 0.2;
          return <Box key={k} s={[0.5, top - WY + 0.2, 3.4]} p={[dir * (0.15 + k * 0.38 - 0.5), (top + WY - 0.2) / 2, 0]} m={st} cast={false} />;
        })}
        {[-1, 1].map((q) => <Box key={q} s={[2.2, 0.5, 0.3]} p={[dir * -0.1, 0.1, q * 1.85]} m={M.plain('#ece8de')} />)}
      </group>
    );
  }

  function LampPost({ p, dusk }) {
    const M = useM();
    return (
      <group position={p}>
        <Cyl rt={0.03} rb={0.045} h={1.25} p={[0, 0.62, 0]} m={M.plain('#2c3036')} seg={6} />
        <mesh position={[0, 1.3, 0]}><sphereGeometry args={[0.1, 8, 6]} />{dusk ? <meshBasicMaterial color="#ffd48a" /> : <meshStandardMaterial color="#e8e6dc" />}</mesh>
        {dusk && <pointLight position={[0, 1.3, 0]} color="#ffc87a" intensity={0.9} distance={7} />}
      </group>
    );
  }

  /* ---------- the peepal with its brick-wrapped base ---------- */
  function Peepal({ p }) {
    const M = useM();
    const bark = M.plain('#4a3c30', { roughness: 1 });
    const leaf = [M.plain('#5f8a3a', { roughness: 1 }), M.plain('#4a7a32', { roughness: 1 }), M.plain('#7a9a45', { roughness: 1 })];
    const stems = useMemo(() => [[[0, 2.2, 0], [-1.6, 4.4, 0.6]], [[0, 2.4, 0], [1.7, 4.8, -0.4]], [[0, 2.6, 0], [0.2, 5.4, -1.2]], [[0, 2.6, 0], [-0.4, 5.2, 1.2]]], []);
    return (
      <group position={p}>
        <Cyl rt={1.35} rb={1.45} h={0.95} p={[0, 0.45, 0]} m={M.mat('brick', 4, 1, { color: '#d99a7c' })} seg={14} />
        <Cyl rt={1.25} rb={1.25} h={0.08} p={[0, 0.96, 0]} m={M.plain('#dcd2c0')} seg={14} />
        <Cyl rt={1.0} rb={1.2} h={2.2} p={[0, 2.0, 0]} m={M.mat('brick', 3, 2, { color: '#cf8f72' })} seg={12} />
        <Cyl rt={0.8} rb={1.0} h={1.5} p={[0, 3.4, 0]} m={bark} seg={9} />
        {stems.map(([a, b], i) => <Strut key={i} a={a} b={b} r={0.2} m={bark} />)}
        {[[-2.0, 5.0, 0.7, 2.0, 0], [2.1, 5.3, -0.4, 2.2, 1], [0.2, 6.2, -1.2, 2.1, 2], [-0.4, 5.8, 1.6, 2.0, 0], [-3.4, 4.4, -0.8, 1.7, 1], [3.5, 4.5, 0.8, 1.6, 2], [0, 7.2, 0, 1.8, 0], [-1.2, 4.2, 2.0, 1.5, 2], [1.4, 4.3, -2.2, 1.6, 0]].map(([x, y, z, r, k], i) => (
          <Ball key={i} rad={r} p={[x, y, z]} sc={[1, 0.85, 1]} m={leaf[k]} />
        ))}
        <Cyl rt={0.045} rb={0.06} h={3.3} p={[1.9, 1.65, 1.3]} m={M.plain('#6a6e72')} seg={5} />
      </group>
    );
  }

  /* ---------- MAIN ---------- */
  function SiddhaMain() {
    const M = useM();
    const [dusk, dref] = useDusk();
    const zf = -(HZ + COP + 1.45);   // far-bank pavilion line, on the walkway
    return (
      <group ref={dref}>
        <PondShell />
        {/* the far bank: three small pavilions and one larger */}
        <Pavilion p={[-21, 0, zf]} w={1.5} d={1.25} glow={dusk} />
        <Pavilion p={[-4, 0, zf]} w={1.7} d={1.3} glow={dusk} />
        <Pavilion p={[8, 0, zf - 0.6]} w={4.5} d={2.2} big sc={1.6} glow={dusk} />
        <Pavilion p={[25, 0, zf]} w={1.5} d={1.25} glow={dusk} />
        {/* deity images on small plinths along the walkway */}
        {[[-27, 0], [-13, 1], [-9, 2], [3, 0], [17, 1], [29, 2]].map(([x, k], i) => <Image key={i} p={[x, 0.01, zf + 0.35]} kind={k} />)}
        {/* minor ghat on the west end */}
        <Ghat x={-HX + 0.2} dir={1} />
        {/* peepal on the east side, beyond the walkway */}
        <group scale={1.15}><Peepal p={[(HX + 8) / 1.15, -0.02, -6 / 1.15]} /></group>
        {[-25, -1, 20, 29].map((x, i) => <LampPost key={i} p={[x, 0.02, zf - 1.3]} dusk={dusk} />)}
        <Frame s={[W - 18, 3, D - 8]} p={[2, 1, -3]} />
      </group>
    );
  }

  /* ---------- ENV ---------- */
  function Hill({ z, h, color, top, seed, w = 260, depth = 40 }) {
    const geo = useMemo(() => {
      const r = mkRng(seed); const ph = [r() * 6, r() * 6, r() * 6];
      const n = 90; const pos = []; const col = []; const idx = [];
      const cB = new THREE.Color(color); const cT = new THREE.Color(top);
      const hf = (x) => h * (0.55 + 0.28 * Math.sin(x * 0.035 + ph[0]) + 0.17 * Math.sin(x * 0.09 + ph[1]) + 0.08 * Math.sin(x * 0.21 + ph[2]));
      for (let i = 0; i <= n; i += 1) {
        const x = (i / n - 0.5) * w; const hh = hf(x);
        pos.push(x, 0, depth * 0.5); col.push(cB.r, cB.g, cB.b);
        pos.push(x, hh, 0); col.push(cT.r, cT.g, cT.b);
        pos.push(x, hh * 0.3, -depth * 0.5); col.push(cB.r, cB.g, cB.b);
      }
      for (let i = 0; i < n; i += 1) {
        const a = i * 3; const b = (i + 1) * 3;
        idx.push(a, b, a + 1, b, b + 1, a + 1, a + 1, b + 1, a + 2, b + 1, b + 2, a + 2);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.setIndex(idx); g.computeVertexNormals();
      return g;
    }, [z, h, color, top, seed, w, depth]);
    return <mesh geometry={geo} position={[0, -0.1, z]}><meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={1} flatShading /></mesh>;
  }

  function Mast({ p }) {
    const M = useM();
    const white = M.plain('#e8e8e4', { roughness: 0.7 });
    const red = M.plain('#c8402e', { roughness: 0.7 });
    const H = 20; const lv = 14;
    const pts = useMemo(() => {
      const out = [];
      for (let i = 0; i <= lv; i += 1) {
        const y = (i / lv) * H; const r = 0.8 * (1 - i / lv) + 0.09;
        out.push([0, 1, 2].map((k) => { const a = Math.PI / 2 + (k * Math.PI * 2) / 3; return [Math.cos(a) * r, y, Math.sin(a) * r]; }));
      }
      return out;
    }, []);
    return (
      <group position={p}>
        {[0, 1, 2].map((k) => <Strut key={`l${k}`} a={pts[0][k]} b={pts[lv][k]} r={0.045} m={white} />)}
        {pts.slice(0, lv).map((row, i) => {
          const nx = pts[i + 1]; const mm = (i === 3 || i === 8 || i === 12) ? red : white;
          return [0, 1, 2].map((k) => <Strut key={`${i}-${k}`} a={row[k]} b={nx[(k + 1) % 3]} r={0.018} m={mm} />);
        })}
        {[2, 5, 8, 11, 13].map((i) => [0, 1, 2].map((k) => <Strut key={`h${i}${k}`} a={pts[i][k]} b={pts[i][(k + 1) % 3]} r={0.02} m={white} />))}
        <Box s={[0.5, 0.35, 0.5]} p={[0, H * 0.62, 0]} m={white} cast={false} />
        <Cyl rt={0.01} rb={0.02} h={1.2} p={[0, H + 0.6, 0]} m={white} seg={4} />
      </group>
    );
  }

  function Building({ p, w, d, storeys, wall, band, roof, dusk }) {
    const M = useM();
    const sh = 1.05;
    return (
      <group position={p}>
        {Array.from({ length: storeys }, (_, k) => (
          <Box key={k} s={[w, sh, d]} p={[0, sh * (k + 0.5), 0]} m={M.plain(k % 2 === 0 ? band : wall, { roughness: 0.95 })} cast={false} />
        ))}
        {Array.from({ length: storeys }, (_, k) => Array.from({ length: Math.floor(w / 1.4) }, (_, j) => (
          <mesh key={`${k}${j}`} position={[-w / 2 + 0.7 + j * 1.4, sh * (k + 0.55), d / 2 + 0.02]}>
            <boxGeometry args={[0.55, 0.5, 0.03]} />
            {dusk ? <meshBasicMaterial color="#ffd27a" /> : <meshStandardMaterial color="#3a4048" roughness={0.4} />}
          </mesh>
        )))}
        <Roof w={w + 0.8} d={d + 0.8} h={0.9} y={sh * storeys} m={M.mat('roof', 4, 3, { color: roof })} sag={1.05} fascia={false} />
      </group>
    );
  }

  function SiddhaEnv() {
    const M = useM();
    const [dusk, dref] = useDusk();
    const hole = (ox, oz) => flatRing(ox, oz, HX, HZ);
    const groundOuter = useMemo(() => hole(130, 130), []);
    const groundDust = useMemo(() => hole(HX + COP + WALK + 2, HZ + COP + WALK + 2), []);

    // trees: a dense wall on the far (-z) side, sparse ones at the ends, none tall on the near side
    const { crowns, trunks } = useMemo(() => {
      const r = mkRng(3); const cs = []; const ts = [];
      const pal = ['#2f5a2a', '#3d6b30', '#4d7a35', '#6b8e3a', '#35602e', '#456f2f'];
      const add = (x, z, hgt, rad) => {
        ts.push([x, hgt * 0.3, z, 0.5, hgt * 0.6, 0.5, 0, '#5a4636']);
        const n = 4;
        for (let k = 0; k < n; k += 1) {
          const a = r() * 6.28; const o = rad * 0.45 * k / n;
          const rr = rad * (1.0 - k * 0.12) * (0.95 + r() * 0.3);
          cs.push([x + Math.cos(a) * o, hgt * (0.5 + k * 0.1) + r() * 0.4, z + Math.sin(a) * o, rr * 2, rr * 2.1, rr * 2, r() * 3, pal[Math.floor(r() * pal.length)]]);
        }
      };
      const zf0 = -(HZ + COP + WALK);
      for (let x = -78; x <= 78; x += 2.6 + r() * 1.6) {
        const nearGap = false;
        const bgap = Math.abs(x - 22) < 6 || Math.abs(x + 33) < 5 || Math.abs(x - 40) < 5 || Math.abs(x + 14) < 4.5;
        const nearPav = [-21, -4, 8, 25].some((q) => Math.abs(x - q) < 4.2);
        if (!nearPav && !bgap) add(x, zf0 - 5.2 - r() * 1.6, 3.4 + r() * 1.8, 2.0 + r() * 0.8);
        if (!bgap) add(x + 1.3, zf0 - 6.5 - r() * 3.5, 4.6 + r() * 1.6, 2.2 + r() * 1.0);
        if (!bgap && r() > 0.4) add(x, zf0 - 11 - r() * 5, 5 + r() * 2, 2.4 + r() * 1.0);
      }
      for (const s of [-1, 1]) {
        for (let z = -HZ - 1; z < HZ - 9; z += 3.5 + r() * 3) { const xx = s * (HX + COP + WALK + 4 + r() * 5); if (s > 0 && Math.abs(z - 4) < 7 && xx < HX + 14) continue; add(xx, z, 4.5 + r() * 3.5, 1.9 + r() * 1.1); }
        for (let z = HZ + 8; z < HZ + 28; z += 5 + r() * 4) add(s * (HX + 22 + r() * 18), z, 4 + r() * 3, 2 + r());
      }
      return { crowns: cs, trunks: ts };
    }, []);

    const leafM = M.plain('#ffffff', { roughness: 1 });
    const trunkM = M.plain('#ffffff', { roughness: 1 });
    const zb = -(HZ + COP + WALK) - 8.5; const zr = -HZ - 14;

    return (
      <group ref={dref}>
        <mesh geometry={groundOuter} position={[0, -0.06, 0]} receiveShadow material={M.plain('#8a9a62', { roughness: 1 })} />
        <mesh geometry={groundDust} position={[0, -0.02, 0]} receiveShadow material={M.plain('#a08568', { roughness: 1 })} />
        {/* near-bank lane / road edge, low */}
        <Box s={[120, 0.03, 2.6]} p={[10, 0.0, HZ + COP + WALK + 25]} m={M.plain('#86946a', { roughness: 1 })} cast={false} />

        <Inst items={trunks} kind="cyl" m={trunkM} />
        <Inst items={crowns} kind="sphere" m={leafM} cast />

        {/* low town fabric glimpsed through the trees on the far side */}
        <Building p={[22, 0, zr]} w={7} d={5} storeys={3} wall="#ece6d8" band="#b8452f" roof="#9c3e2a" dusk={dusk} />
        <Building p={[-33, 0, zb - 1]} w={6} d={4.5} storeys={2} wall="#e8dcc6" band="#c9bda8" roof="#a4482e" dusk={dusk} />
        <Building p={[40, 0, zb - 1.5]} w={5.5} d={4.5} storeys={2} wall="#d9ad8c" band="#e8e0cf" roof="#8f3b28" dusk={dusk} />
        <Building p={[-14, 0, zb - 6]} w={6} d={4.5} storeys={2} wall="#e8dcc6" band="#b45838" roof="#8f3b28" dusk={dusk} />

        <Mast p={[30, 0, -HZ - 14]} />
        <Hill z={-52} h={22} color="#3f6b3a" top="#4d7d44" seed={4} w={300} depth={34} />
        <Hill z={-112} h={26} color="#5f8a6c" top="#7fa08a" seed={9} w={400} depth={60} />
      </group>
    );
  }

  return { 'siddha-pokhari': { Main: SiddhaMain, Env: SiddhaEnv } };
}
