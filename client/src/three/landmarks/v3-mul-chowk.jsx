// Mul Chowk, Patan Royal Palace (Lalitpur). An enclosed, inward-facing Newar courtyard: four continuous red-brick and carved-timber
// ranges under deep dark clay-tile roofs around a sunken red-brick floor. A tiny gilded Bidya Mandir stands at the exact centre on a
// low stepped stone plinth. The tiered Taleju tower rises over the north (back) range; the gilded Taleju door and torana, flanked by
// Ganga on a tortoise and Jamuna on a makara, sit in the west range. The entrance (+z, towards Durbar Square) is a low open
// timber-post arcade between two brick corner blocks, with stone lions on stepped plinths and Bhairav murals.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Gajur, Frame, GroundDisc, Diyo, Tree, THREE, useMemo, useRef, useEffect } = K;

  const I = 4.6;     // half width of the court
  const D = 1.4;     // depth of each range
  const O = I + D;   // outer half width
  const H = 2.4;     // eave height of the two-storey ranges
  const S = 1.3;     // bay width
  const BRICK = '#a8573f';
  const WOOD = '#34200f';

  /* ---------- instanced meshes: [x,y,z, sx,sy,sz, rotY, rotX] ---------- */
  function Inst({ items, m, kind = 'box', geo, cast = false }) {
    const ref = useRef();
    useEffect(() => {
      if (!ref.current) return;
      const o = new THREE.Object3D();
      o.rotation.order = 'YXZ';
      items.forEach((it, i) => {
        o.position.set(it[0], it[1], it[2]);
        o.scale.set(it[3], it[4], it[5]);
        o.rotation.set(it[7] || 0, it[6] || 0, 0);
        o.updateMatrix();
        ref.current.setMatrixAt(i, o.matrix);
      });
      ref.current.instanceMatrix.needsUpdate = true;
    }, [items]);
    if (!items.length) return null;
    return (
      <instancedMesh ref={ref} args={[geo || null, null, items.length]} material={m} castShadow={cast} receiveShadow frustumCulled={false}>
        {!geo && (kind === 'box' ? <boxGeometry args={[1, 1, 1]} /> : <planeGeometry args={[1, 1]} />)}
      </instancedMesh>
    );
  }

  function latticeTex() {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const g = c.getContext('2d');
    g.fillStyle = '#160b05'; g.fillRect(0, 0, 64, 64);
    g.strokeStyle = '#9a6a38'; g.lineWidth = 5;
    g.beginPath();
    g.moveTo(0, 0); g.lineTo(64, 64); g.moveTo(0, 64); g.lineTo(64, 0);
    g.moveTo(-32, 32); g.lineTo(32, 96); g.moveTo(32, -32); g.lineTo(96, 32);
    g.moveTo(32, 96); g.lineTo(96, 32); g.moveTo(-32, 32); g.lineTo(32, -32);
    g.stroke();
    g.strokeStyle = '#5d3a1b'; g.lineWidth = 6; g.strokeRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2, 2);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  function tileTex() {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const g = c.getContext('2d');
    g.fillStyle = '#5c4d42'; g.fillRect(0, 0, 64, 64);
    for (let r = 0; r < 8; r += 1) {
      for (let k = 0; k < 8; k += 1) {
        const v = 70 + ((r * 7 + k * 13) % 5) * 6;
        g.fillStyle = `rgb(${v + 10},${v - 4},${v - 14})`;
        g.fillRect(k * 8 + (r % 2) * 4 - 4, r * 8, 7, 7);
      }
      g.fillStyle = '#2b2320'; g.fillRect(0, r * 8 + 7, 64, 1);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1, 1);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  function useTile(tint) {
    return useMemo(() => new THREE.MeshStandardMaterial({ map: tileTex(), color: tint || '#ffffff', side: THREE.DoubleSide, roughness: 1, emissive: '#1a1614', emissiveIntensity: 0.15 }), [tint]);
  }

  /* hipped (or gabled) tile roof over local x0..x1; court side eave at zIn, outer eave at zOut */
  function roofGeo(x0, x1, zIn, zOut, yE, yR, hip0, hip1) {
    const zm = (zIn + zOut) / 2;
    const span = Math.abs(zIn - zOut) / 2;
    const r0 = hip0 ? x0 + span : x0;
    const r1 = hip1 ? x1 - span : x1;
    const A = [x0, yE, zIn]; const B = [x1, yE, zIn]; const C = [x1, yE, zOut]; const Dd = [x0, yE, zOut];
    const R0 = [r0, yR, zm]; const R1 = [r1, yR, zm];
    const pos = []; const uv = [];
    const tri = (a, b, c) => {
      const ux = b[0] - a[0]; const uz = b[2] - a[2];
      const vx = c[0] - a[0]; const vz = c[2] - a[2];
      const ny = uz * vx - ux * vz;
      const t = ny >= 0 ? [a, b, c] : [a, c, b];
      t.forEach((p) => { pos.push(p[0], p[1], p[2]); uv.push(p[0] / 0.7, p[2] / 0.6); });
    };
    tri(A, B, R1); tri(A, R1, R0);
    tri(C, Dd, R0); tri(C, R0, R1);
    if (hip0) tri(Dd, A, R0);
    if (hip1) tri(B, C, R1);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    return g;
  }

  /* ---------- shared geometry ---------- */
  function useGeos() {
    return useMemo(() => {
      // arched recess (flat shape)
      const a = new THREE.Shape();
      const w = 0.4; const hs = 0.45;
      a.moveTo(-w, 0); a.lineTo(w, 0); a.lineTo(w, hs); a.absarc(0, hs, w, 0, Math.PI, false); a.lineTo(-w, 0);
      const arch = new THREE.ShapeGeometry(a, 12);
      // timber arch ring (for the entrance arcade)
      const r = 0.6; const ri = 0.46;
      const q = new THREE.Shape();
      q.moveTo(-r, 0); q.absarc(0, 0, r, Math.PI, 0, true); q.lineTo(ri, 0); q.absarc(0, 0, ri, 0, Math.PI, false); q.lineTo(-r, 0);
      const ring = new THREE.ExtrudeGeometry(q, { depth: 0.16, bevelEnabled: false, curveSegments: 14 });
      ring.translate(0, 0, -0.08);
      // gilded torana tympanum
      const t = new THREE.Shape();
      t.moveTo(-0.72, 0); t.lineTo(0.72, 0); t.lineTo(0.72, 0.14);
      t.quadraticCurveTo(0.5, 0.26, 0.16, 0.58); t.lineTo(0, 0.74); t.lineTo(-0.16, 0.58);
      t.quadraticCurveTo(-0.5, 0.26, -0.72, 0.14); t.lineTo(-0.72, 0);
      const tor = new THREE.ExtrudeGeometry(t, { depth: 0.1, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 1 });
      const bol = new THREE.CylinderGeometry(0.035, 0.045, 0.5, 8);
      bol.translate(0, 0.25, 0);
      return { arch, ring, tor, bol };
    }, []);
  }

  /* ---------- the gilded Taleju door, torana, Ganga and Jamuna (west range) ---------- */
  function GoldDoor() {
    const M = useM();
    const g = useGeos();
    const dk = M.plain('#6e4f0e', { metalness: 0.6, roughness: 0.45 });
    return (
      <group>
        <Box s={[1.1, 1.22, 0.1]} p={[0, 0.81, 0.05]} m={M.gold} />
        <Box s={[0.66, 1.06, 0.06]} p={[0, 0.76, 0.12]} m={M.gold} />
        {[-1, 1].map((s) => [0.45, 0.78, 1.1].map((y) => <Box key={`${s}${y}`} s={[0.25, 0.28, 0.02]} p={[s * 0.16, y, 0.16]} m={dk} cast={false} />))}
        <Box s={[0.04, 1.06, 0.03]} p={[0, 0.76, 0.16]} m={dk} cast={false} />
        <Box s={[0.12, 0.06, 0.03]} p={[0, 0.7, 0.19]} m={M.plain('#1a1612')} cast={false} />
        {[-1, 1].map((s) => <Cyl key={s} rt={0.045} h={1.08} p={[s * 0.44, 0.76, 0.13]} m={M.gold} seg={8} />)}
        <Box s={[1.34, 0.1, 0.3]} p={[0, 1.45, 0.14]} m={M.gold} />
        <Box s={[1.5, 0.05, 0.36]} p={[0, 1.52, 0.16]} m={M.gold} />
        <mesh geometry={g.tor} material={M.gold} position={[0, 1.54, 0.02]} castShadow />
        {[[0, 1.82], [-0.3, 1.68], [0.3, 1.68]].map(([x, y], i) => <Ball key={i} rad={0.07} p={[x, y, 0.14]} sc={[1, 1, 0.5]} m={dk} />)}
        {[-1, 1].map((s) => <Cyl key={s} rt={0.02} h={0.5} p={[s * 0.45, 1.86, 0.15]} r={[0, 0, s * -0.9]} m={M.gold} seg={6} />)}
        <Gajur y={1.8} s={0.14} />
        {/* Ganga on tortoise (left) and Jamuna on makara (right) */}
        <group position={[-1.0, 0.2, 0.2]} scale={1.0}>
          <Box s={[0.34, 0.1, 0.34]} p={[0, 0.05, 0]} m={M.stone} />
          <Ball rad={0.13} p={[0, 0.15, 0]} sc={[1.3, 0.55, 1]} m={M.copper} />
          <group position={[0, 0.2, 0]}><K.Goddess m={M.gold} /></group>
        </group>
        <group position={[1.0, 0.2, 0.2]} scale={1.0}>
          <Box s={[0.34, 0.1, 0.34]} p={[0, 0.05, 0]} m={M.stone} />
          <Box s={[0.12, 0.1, 0.3]} p={[0, 0.16, 0]} m={M.copper} />
          <mesh position={[0, 0.2, 0.2]} rotation={[Math.PI / 2, 0, 0]} material={M.copper}><coneGeometry args={[0.06, 0.14, 8]} /></mesh>
          <group position={[0, 0.2, 0]}><K.Goddess m={M.gold} /></group>
        </group>
      </group>
    );
  }

  /* ---------- one two-storey range. Local frame: court face on z=0, wall behind it (z<0), x along the wing ---------- */
  const CFG = {
    N: { ks: [-3, -2, -1, 0, 1, 2, 3], arches: [-2, -1, 1, 2], door: [0], large: [-1, 0, 1] },
    E: { ks: [-3, -2, -1, 0, 1, 2, 3], arches: [-2, -1, 0, 1], door: [2], large: [-1, 0, 1] },
    W: { ks: [-3, -2, -1, 0, 1, 2, 3], arches: [], door: [0], large: [-2, -1, 1, 2] },
  };
  function Wing({ kind, x0, x1 }) {
    const M = useM();
    const g = useGeos();
    const c = CFG[kind];
    const lat = useMemo(() => new THREE.MeshStandardMaterial({ map: latticeTex(), roughness: 0.8 }), []);
    const data = useMemo(() => {
      const frames = []; const lats = []; const arches = []; const posts = []; const struts = [];
      c.ks.forEach((k) => {
        const x = k * S;
        const big = c.large.includes(k);
        const gold = (kind === 'W' || kind === 'N') && k === 0;
        if (!gold) {
          const w = big ? 1.0 : 0.62; const h = big ? 0.84 : 0.56;
          frames.push([x, 1.78, 0.075, w + 0.16, h + 0.16, 0.15, 0]);
          lats.push([x, 1.78, 0.156, w, h, 1, 0]);
          if (big) { frames.push([x, 1.78 + h / 2 + 0.12, 0.15, w + 0.4, 0.09, 0.32, 0]); frames.push([x, 1.78 - h / 2 - 0.09, 0.08, w + 0.2, 0.06, 0.16, 0]); }
        }
        if (c.arches.includes(k)) {
          arches.push([x, 0.24, 0.035, 1, 1, 1, 0]);
        } else if (c.door.includes(k) && kind !== 'W') {
          frames.push([x, 0.72, 0.05, 0.74, 1.0, 0.1, 0]);
          lats.push([x, 0.68, 0.106, 0.5, 0.82, 1, 0]);
          frames.push([x, 1.2 - 0.02, 0.1, 0.9, 0.06, 0.2, 0]);
        } else if (!(kind === 'W' && k === 0)) {
          frames.push([x, 0.78, 0.045, 0.54, 0.46, 0.09, 0]);
          lats.push([x, 0.78, 0.096, 0.4, 0.32, 1, 0]);
        }
      });
      // dark posts between the arches
      if (c.arches.length) {
        const a0 = Math.min(...c.arches); const a1 = Math.max(...c.arches);
        const edges = [];
        for (let k = a0; k <= a1 + 1; k += 1) edges.push((k - 0.5) * S);
        const keep = (x) => c.arches.some((k) => Math.abs(k * S - x) < S * 0.6);
        edges.filter(keep).forEach((x) => posts.push([x, 0.7, 0.07, 0.16, 1.0, 0.18, 0]));
      }
      // carved struts under the eave (court face and outer face)
      for (let x = -I + 0.3; x < I; x += 0.6) struts.push([x, H - 0.42, 0.22, 0.1, 0.7, 0.1, 0, 0.7]);
      for (let x = x0 + 0.3; x < x1; x += 0.6) struts.push([x, H - 0.42, -D - 0.22, 0.1, 0.7, 0.1, Math.PI, 0.7]);
      // outer face windows
      for (let x = x0 + 0.7; x < x1 - 0.5; x += S) {
        frames.push([x, 1.78, -D - 0.05, 0.56, 0.6, 0.1, Math.PI]);
        lats.push([x, 1.78, -D - 0.106, 0.42, 0.46, 1, Math.PI]);
        if (Math.round((x - x0) / S) % 2 === 0) {
          frames.push([x, 0.78, -D - 0.045, 0.5, 0.44, 0.09, Math.PI]);
          lats.push([x, 0.78, -D - 0.096, 0.36, 0.3, 1, Math.PI]);
        }
      }
      return { frames, lats, arches, posts, struts };
    }, [kind, x0, x1]);
    const brick = M.mat('brick', (x1 - x0) / 1.1, 2.0, { color: BRICK, emissive: '#3a1608', emissiveIntensity: 0.1 });
    const wood = M.plain(WOOD, { roughness: 0.8 });
    const dark = M.plain('#3a2515', { roughness: 0.9 });
    const stone = M.mat('granite', 3, 0.3, { color: '#b9ad9c' });
    const L = x1 - x0; const mx = (x0 + x1) / 2;
    return (
      <group>
        <Box s={[L + 0.1, 0.2, D + 0.4]} p={[mx, 0.1, -D / 2 + 0.15]} m={stone} />
        <Box s={[L, H - 0.2, D]} p={[mx, 0.2 + (H - 0.2) / 2, -D / 2]} m={brick} />
        {/* timber bands and the continuous projecting eave */}
        <Box s={[L, 0.09, 0.1]} p={[mx, 1.2, 0.04]} m={wood} cast={false} />
        <Box s={[2 * I, 0.09, 0.12]} p={[0, 1.62, 0.05]} m={wood} cast={false} />
        <Box s={[2 * I, 0.2, 0.26]} p={[0, H - 0.1, 0.12]} m={wood} />
        <Box s={[L, 0.2, 0.26]} p={[mx, H - 0.1, -D - 0.1]} m={wood} />
        <Box s={[2 * I, 0.05, 0.9]} p={[0, H - 0.2, 0.45]} m={dark} cast={false} />
        <Inst items={data.frames} m={wood} />
        <Inst items={data.lats} m={lat} kind="plane" />
        <Inst items={data.arches} m={dark} geo={g.arch} />
        <Inst items={data.posts} m={wood} />
        <Inst items={data.struts} m={wood} />
        {(kind === 'W' || kind === 'N') && <group scale={[1.18, 1.3, 1.4]}><GoldDoor /></group>}
      </group>
    );
  }

  /* ---------- the entrance range: low open timber-post arcade (dalan) ---------- */
  function Gate() {
    const M = useM();
    const g = useGeos();
    const wood = M.plain('#3e2616', { roughness: 0.8 });
    const dark = M.plain('#150c07', { roughness: 0.9 });
    const stone = M.mat('granite', 3, 0.3, { color: '#b9ad9c' });
    const data = useMemo(() => {
      const posts = []; const rings = []; const struts = [];
      for (let k = 0; k <= 6; k += 1) {
        const x = -I + k * 1.4;
        posts.push([x, 0.2 + 0.5, -D + 0.18, 0.24, 1.0, 0.24, 0]);
        posts.push([x, 0.2 + 0.5, -0.2, 0.24, 1.0, 0.24, 0]);
        if (k < 6) {
          rings.push([x + 0.7, 1.2, -D + 0.18, 1, 1, 1, 0]);
          rings.push([x + 0.7, 1.2, -0.2, 1, 1, 1, 0]);
        }
      }
      for (let x = -I + 0.35; x < I; x += 0.55) {
        struts.push([x, 1.5, -D - 0.12, 0.08, 0.5, 0.08, Math.PI, 0.7]);
        struts.push([x, 1.5, 0.14, 0.08, 0.5, 0.08, 0, 0.7]);
      }
      return { posts, rings, struts };
    }, []);
    return (
      <group>
        <Box s={[2 * I + 0.2, 0.2, D + 0.2]} p={[0, 0.1, -D / 2]} m={stone} />
        <Box s={[2 * I, 0.06, D]} p={[0, 0.23, -D / 2]} m={M.mat('herring', 4, 1, { color: '#cfc4b4' })} cast={false} />
        <Inst items={data.posts} m={wood} cast />
        <Inst items={data.rings} m={wood} geo={g.ring} cast />
        <Box s={[2 * I, 0.22, 0.26]} p={[0, 1.78, -D + 0.18]} m={wood} />
        <Box s={[2 * I, 0.22, 0.26]} p={[0, 1.78, -0.2]} m={wood} />
        <Box s={[2 * I, 0.06, D]} p={[0, 1.7, -D / 2]} m={dark} cast={false} />
        <Inst items={data.struts} m={wood} />
      </group>
    );
  }

  /* ---------- the entrance: a low brick wall with a central gap (stair) ---------- */
  function FrontWall() {
    const M = useM();
    const brick = M.mat('brick', 3, 0.4, { color: BRICK, emissive: '#3a1608', emissiveIntensity: 0.1 });
    const stone = M.mat('granite', 3, 0.3, { color: '#9a9288' });
    const segs = [[-(I + 1.3) / 2 - 0.65, I - 1.3 + 0.1], [(I + 1.3) / 2 + 0.65, I - 1.3 + 0.1]];
    return (
      <group>
        {segs.map(([x, w], i) => (
          <group key={i}>
            <Box s={[w + 0.8, 0.5, 0.5]} p={[x - Math.sign(x) * 0.4, 0.25, I + 0.25]} m={brick} />
            <Box s={[w + 0.9, 0.07, 0.62]} p={[x - Math.sign(x) * 0.4, 0.53, I + 0.25]} m={stone} />
          </group>
        ))}
      </group>
    );
  }

  /* ---------- tiled roofs ---------- */
  function Roofs() {
    const M = useM();
    const tile = useTile();
    const gN = useMemo(() => roofGeo(-O - 0.3, O + 0.3, 0.45, -D - 0.2, H - 0.05, H + 0.6, true, true), []);
    const gE = useMemo(() => roofGeo(-(I + 0.45), I + 0.3, 0.45, -D - 0.2, H - 0.05, H + 0.6, false, true), []);
    const gW = useMemo(() => roofGeo(-(I + 0.3), I + 0.45, 0.45, -D - 0.2, H - 0.05, H + 0.6, true, false), []);
    const gF = useMemo(() => roofGeo(-I - 0.3, I + 0.3, 0.6, -D - 0.35, 1.72, 2.05, false, false), []);
    const wood = M.plain(WOOD, { roughness: 0.8 });
    return (
      <group>
        <group position={[0, 0, -I]}>
          <mesh geometry={gN} material={tile} castShadow receiveShadow />
          <Box s={[2 * O - 1.2, 0.08, 0.12]} p={[0, H + 0.62, -0.5]} m={wood} cast={false} />
        </group>
        <group position={[I, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh geometry={gF} material={tile} castShadow receiveShadow />
        </group>
        <group position={[-I, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <mesh geometry={gW} material={tile} castShadow receiveShadow />
        </group>
      </group>
    );
  }

  /* ---------- Bidya Mandir, the tiny gilded shrine at the centre ---------- */
  function Bidya() {
    const M = useM();
    const pl = M.mat('granite', 1, 1, { color: '#6f665b' });
    const dk = M.plain('#17110c');
    const cone = (r, h, y) => <mesh position={[0, y, 0]} rotation={[0, Math.PI / 4, 0]} material={M.gold} castShadow><coneGeometry args={[r, h, 4]} /></mesh>;
    return (
      <group scale={1.0} position={[0, 0.06, 0]}>
        <Box s={[1.9, 0.1, 1.9]} p={[0, 0.05, 0]} m={pl} />
        <Box s={[1.55, 0.1, 1.55]} p={[0, 0.15, 0]} m={pl} />
        <Box s={[1.2, 0.1, 1.2]} p={[0, 0.25, 0]} m={pl} />
        {[-1, 1].flatMap((a) => [-1, 1].map((b) => <Box key={`${a}${b}`} s={[0.16, 0.16, 0.16]} p={[a * 0.74, 0.22, b * 0.74]} m={M.mat('granite', 1, 1, { color: '#a89c8c' })} />))}
        {[-1, 1].map((a) => <Box key={`f${a}`} s={[1.2, 0.05, 0.03]} p={[0, 0.18, a * 0.79]} m={M.gold} cast={false} />)}
        <group position={[0, 0.06, 0]}>
        <Box s={[0.74, 0.46, 0.74]} p={[0, 0.47, 0]} m={M.mat('granite', 1, 1, { color: '#8a7f72' })} />
        <Box s={[0.28, 0.32, 0.06]} p={[0, 0.4, 0.36]} m={dk} cast={false} />
        <mesh position={[0, 0.56, 0.36]} material={dk}><circleGeometry args={[0.14, 14, 0, Math.PI]} /></mesh>
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], i) => <Box key={i} s={[0.06, 0.46, 0.06]} p={[a * 0.35, 0.47, b * 0.35]} m={M.gold} />)}
        <Box s={[0.9, 0.07, 0.9]} p={[0, 0.74, 0]} m={M.gold} />
        <Box s={[0.6, 0.22, 0.6]} p={[0, 0.88, 0]} m={M.gold} />
        <Box s={[0.74, 0.05, 0.74]} p={[0, 1.02, 0]} m={M.gold} />
        {cone(0.52, 0.22, 1.15)}
        {cone(0.38, 0.2, 1.34)}
        {cone(0.25, 0.18, 1.5)}
        <Gajur y={1.58} s={0.5} />
        </group>
        {[-0.3, 0.3].map((x) => <Diyo key={x} p={[x, 0.32, 1.0]} light />)}
      </group>
    );
  }

  /* ---------- stone lion on a stepped plinth ---------- */
  function SLion({ p, face = 0 }) {
    const M = useM();
    const st = M.plain('#a89a82', { roughness: 0.95 });
    return (
      <group position={p} rotation={[0, face, 0]}>
        <Box s={[1.0, 0.14, 1.0]} p={[0, 0.07, 0]} m={st} />
        <Box s={[0.8, 0.14, 0.8]} p={[0, 0.21, 0]} m={st} />
        <Box s={[0.62, 0.18, 0.62]} p={[0, 0.37, 0]} m={st} />
        <group position={[0, 0.46, 0]} scale={1.6}>
          <Box s={[0.22, 0.2, 0.3]} p={[0, 0.2, -0.04]} m={st} />
          <Ball rad={0.13} sc={[1.1, 1, 1]} p={[0, 0.14, -0.14]} m={st} />
          <Ball rad={0.1} sc={[1, 1.3, 0.8]} p={[0, 0.31, 0.08]} m={st} />
          <Ball rad={0.115} p={[0, 0.4, 0.1]} m={st} />
          <Ball rad={0.16} sc={[1.1, 1.05, 0.6]} p={[0, 0.4, 0.05]} m={st} />
          <Ball rad={0.065} sc={[1, 0.8, 1.1]} p={[0, 0.37, 0.21]} m={st} />
          {[-0.07, 0.07].map((x) => <Cyl key={x} rt={0.025} rb={0.03} h={0.2} p={[x, 0.1, 0.1]} m={st} seg={8} />)}
          <Cyl rt={0.02} h={0.18} p={[0, 0.28, -0.2]} r={[0.5, 0, 0]} m={st} seg={6} />
        </group>
      </group>
    );
  }

  /* ---------- Bhairav mural on a brick face ---------- */
  function Mural({ p, r = 0 }) {
    const M = useM();
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[1.08, 1.34, 0.05]} p={[0, 0, 0]} m={M.plain('#3a2515')} cast={false} />
        <Box s={[0.96, 1.22, 0.03]} p={[0, 0, 0.03]} m={M.plain('#c2a45a', { roughness: 0.9 })} cast={false} />
        <mesh position={[0, 0.2, 0.05]} material={M.plain('#e0b020', { roughness: 0.9 })}><circleGeometry args={[0.4, 20]} /></mesh>
        <mesh position={[0, 0.2, 0.055]} material={M.plain('#2f8a5a', { roughness: 0.9 })}><ringGeometry args={[0.32, 0.4, 20]} /></mesh>
        <Ball rad={0.22} p={[0, 0.2, 0.08]} sc={[1, 1.1, 0.25]} m={M.plain('#1c2a5a', { roughness: 0.8 })} />
        {[-0.08, 0.08].map((x) => <Ball key={x} rad={0.035} p={[x, 0.26, 0.12]} sc={[1.3, 0.8, 0.4]} m={M.plain('#f3ede0')} />)}
        <Box s={[0.18, 0.05, 0.02]} p={[0, 0.1, 0.12]} m={M.plain('#b3202a')} cast={false} />
        <Box s={[0.6, 0.5, 0.02]} p={[0, -0.28, 0.05]} m={M.plain('#27407a', { roughness: 0.9 })} cast={false} />
        <Box s={[0.9, 0.05, 0.02]} p={[0, -0.5, 0.05]} m={M.plain('#a02a22', { roughness: 0.9 })} cast={false} />
      </group>
    );
  }

  /* ---------- Taleju tower rising over the north range ---------- */
  function Tower() {
    const M = useM();
    const lat = useMemo(() => new THREE.MeshStandardMaterial({ map: latticeTex(), roughness: 0.8 }), []);
    const brick = M.mat('brick', 1.2, 2.2, { color: BRICK, emissive: '#3a1608', emissiveIntensity: 0.1 });
    const tile = useTile();
    const wood = M.plain(WOOD, { roughness: 0.8 });
    // [width, y0, y1, roof width, roof y]
    const tiers = [[1.6, 2.2, 4.0, 2.5, 4.0], [1.4, 4.1, 5.2, 2.1, 5.2], [1.2, 5.3, 6.2, 1.7, 6.2]];
    return (
      <group position={[3.7, 0, -I - 0.5]}>
        {tiers.map(([w, y0, y1, rw, ry], i) => {
          const h = y1 - y0;
          return (
            <group key={i}>
              <Box s={[w, h, w]} p={[0, y0 + h / 2, 0]} m={brick} />
              <Box s={[w + 0.08, 0.09, w + 0.08]} p={[0, y0 + 0.04, 0]} m={wood} cast={false} />
              <Box s={[w + 0.08, 0.09, w + 0.08]} p={[0, y1 - 0.12, 0]} m={wood} cast={false} />
              {[0, 1, 2, 3].map((k) => (
                <group key={k} rotation={[0, (k * Math.PI) / 2, 0]}>
                  <Box s={[w * 0.5, h * 0.5, 0.08]} p={[0, y0 + h * 0.52, w / 2 + 0.01]} m={wood} cast={false} />
                  <mesh position={[0, y0 + h * 0.52, w / 2 + 0.06]} material={lat}><planeGeometry args={[w * 0.4, h * 0.4]} /></mesh>
                  {i === 0 && <Box s={[w * 0.7, 0.07, 0.1]} p={[0, y0 + 1.2, w / 2 + 0.03]} m={wood} cast={false} />}
                </group>
              ))}
              <Roof w={rw} d={rw} h={0.5} y={ry} m={tile} sag={1.25} lift={0.12} />
            </group>
          );
        })}
        <Gajur y={6.7} s={0.5} />
      </group>
    );
  }

  /* ---------- MAIN ---------- */
  function MulChowkMain() {
    const M = useM();
    const g = useGeos();
    const lat = useMemo(() => new THREE.MeshStandardMaterial({ map: latticeTex(), roughness: 0.8 }), []);
    const front = useMemo(() => {
      const frames = []; const lats = [];
      [-1, 1].forEach((s) => {
        const x = s * (I + D / 2);
        frames.push([x, 1.78, O + 0.05, 0.92, 0.94, 0.1, 0]);
        lats.push([x, 1.78, O + 0.106, 0.78, 0.8, 1, 0]);
        frames.push([x, 2.4 - 0.5, O + 0.1, 1.12, 0.07, 0.22, 0]);
      });
      return { frames, lats };
    }, []);
    const bollards = [-1.4, -0.7, 0, 0.7, 1.4].flatMap((v) => [[v, 1.45], [v, -1.45], [1.45, v], [-1.45, v]]).filter(([x, z], i, a) => a.findIndex(([p, q]) => p === x && q === z) === i).map(([x, z]) => [x, 0.06, z, 1, 1, 1, 0]);
    const wood = M.plain(WOOD, { roughness: 0.8 });
    const dk = M.plain('#241a14', { roughness: 0.7 });
    const stone = M.mat('granite', 3, 3, { color: '#b5a999' });
    const walls = [
      ['N', [0, 0, -I], 0, -I, I],
      ['W', [-I, 0, 0], Math.PI / 2, -I, I],
    ];
    return (
      <group>
        {/* sunken brick court with stone border */}
        <Box s={[2 * I + 0.5, 0.06, 2 * I + 0.5]} p={[0, 0.03, 0]} m={M.mat('herring', 5, 5, { color: '#d98a6a' })} cast={false} />
        {[-1, 1].map((s) => (
          <group key={s}>
            <Box s={[2 * I, 0.02, 0.7]} p={[0, 0.065, s * (I - 0.35)]} m={stone} cast={false} />
            <Box s={[0.7, 0.02, 2 * I - 1.4]} p={[s * (I - 0.35), 0.065, 0]} m={stone} cast={false} />
          </group>
        ))}
        <Inst items={bollards} m={dk} geo={g.bol} cast />
        {walls.map(([k, p, r, a, b]) => (
          <group key={k} position={p} rotation={[0, r, 0]}><Wing kind={k} x0={a} x1={b} /></group>
        ))}
        <group position={[I, 0, 0]} rotation={[0, -Math.PI / 2, 0]}><Gate /></group>
        <FrontWall />
        <Roofs />
        <Tower />
        <Bidya />
        {/* entrance: low wall, central stair, lions and Bhairav murals */}
        {[0, 1, 2].map((i) => <Box key={i} s={[2.6 - i * 0.2, 0.09 * (3 - i), 0.34]} p={[0, 0.045 * (3 - i), I + 0.15 + (i + 0.5) * 0.34 - 0.34 * 0 + 0.0]} m={stone} />)}
        <SLion p={[-1.7, 0.5, I + 0.35]} />
        <SLion p={[1.7, 0.5, I + 0.35]} />
        <ambientLight intensity={0.45} />
        <pointLight position={[-I + 1.5, 1.2, 0.6]} intensity={0.5} distance={4} color="#ffd48a" />
        <pointLight position={[0, 1.4, 1.2]} intensity={0.5} distance={4} color="#ffcf80" />
        <pointLight position={[-I + 0.8, 1.3, 0.3]} intensity={1.6} distance={7} color="#ffb85a" />
        <pointLight position={[I - 0.8, 1.3, -1.2]} intensity={1.4} distance={7} color="#ffb85a" />
        <pointLight position={[-0.4, 1.0, I - 0.8]} intensity={1.2} distance={6} color="#ffc070" />
        <Frame s={[2 * I + 3.2, 6.6, 2 * I + 3.2]} p={[0, 3.3, 0.3]} />
      </group>
    );
  }

  /* ---------- ENV ---------- */
  function MulChowkEnv() {
    const M = useM();
    const tints = ['#8f4b38', '#a89a84', '#7a6a5a', '#9c8468'];
    const tile = useTile();
    const wood = M.plain(WOOD, { roughness: 0.8 });
    const lat = useMemo(() => new THREE.MeshStandardMaterial({ map: latticeTex(), roughness: 0.8 }), []);
    const stone = M.mat('herring', 3, 14, { color: '#b9ad9c' });
    const list = useMemo(() => {
      const out = [];
      let n = 0;
      const rnd = () => { n += 1; const v = Math.sin(n * 91.7) * 43758.5; return v - Math.floor(v); };
      const row = (x0, z0, x1, z1, rot, gap, d, hMin) => {
        const len = Math.hypot(x1 - x0, z1 - z0);
        let t = 0;
        while (t < len) {
          const w = 2.6 + rnd() * 2.6;
          const st = Math.max(1, Math.min(2, hMin + Math.floor(rnd() * 3.2) - 2));
          const f = (t + w / 2) / len;
          out.push({ p: [x0 + (x1 - x0) * f, z0 + (z1 - z0) * f], rot, w, d, st, tint: Math.floor(rnd() * 4) });
          t += w + gap;
        }
      };
      // palace blocks beside the court (Sundari Chowk / Keshav Narayan side)
      out.push({ p: [-O - 12.5, 0], rot: Math.PI / 2, w: 2 * O + 4, d: 5, st: 2, tint: 2, block: true });
      out.push({ p: [O + 12.5, -3.2], rot: -Math.PI / 2, w: 2 * O - 6.4, d: 5, st: 2, tint: 1, block: true });
      out.push({ p: [0, -O - 12.4], rot: 0, w: 2 * O + 8, d: 4, st: 2, tint: 3, block: true });
      row(-27, -21, 27, -21, 0, 0.5, 3.2, 3);
      row(-22, -12, -22, 24, Math.PI / 2, 0.8, 3.2, 3);
      row(24, -12, 24, 24, -Math.PI / 2, 0.8, 3.2, 2);
      return out;
    }, []);
    const geo = useMemo(() => list.map((h) => {
      const sh = h.block ? 1.15 : 1.05;
      const ht = h.st * sh + 0.3;
      return { ht, g: roofGeo(-h.w / 2 - 0.35, h.w / 2 + 0.35, h.d / 2 + 0.4, -h.d / 2 - 0.4, ht, ht + (h.block ? 0.9 : 0.8), true, true) };
    }), [list]);
    const win = useMemo(() => {
      const frames = []; const lats = [];
      list.forEach((h, i) => {
        const sh = h.block ? 1.15 : 1.05;
        const cs = Math.cos(h.rot); const sn = Math.sin(h.rot);
        const nx = Math.max(1, Math.floor(h.w / 1.25));
        for (let s = 0; s < h.st; s += 1) {
          for (let k = 0; k < nx; k += 1) {
            const lx = -h.w / 2 + (k + 0.5) * (h.w / nx);
            const y = 0.2 + s * sh + sh * 0.55;
            const lz = h.d / 2;
            const wx = h.p[0] + lx * cs + lz * sn; const wz = h.p[1] - lx * sn + lz * cs;
            const big = s > 0 && k % 2 === 0;
            frames.push([wx, y, wz, big ? 0.62 : 0.4, big ? 0.62 : 0.4, 0.1, h.rot]);
            const q = lz + 0.056;
            lats.push([h.p[0] + lx * cs + q * sn, y, h.p[1] - lx * sn + q * cs, big ? 0.5 : 0.28, big ? 0.5 : 0.28, 1, h.rot]);
          }
        }
      });
      return { frames, lats };
    }, [list]);
    const people = [[-3.4, 9.2], [3.2, 10.4], [0.6, 12.5], [-6, 8.5]];
    return (
      <group>
        <GroundDisc r={62} m={M.plain('#5f564d', { roughness: 1 })} y={-0.02} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} material={M.mat('stone', 40, 40, { color: '#7a6f62' })}><circleGeometry args={[110, 48]} /></mesh>
        {/* stone-edged path leading from the square to the gate */}
        {list.map((h, i) => (
          <group key={i} position={[h.p[0], 0, h.p[1]]} rotation={[0, h.rot, 0]}>
            <Box s={[h.w, geo[i].ht - 0.0, h.d]} p={[0, geo[i].ht / 2, 0]} m={h.tint === 1 || h.tint === 3 ? M.mat('plaster', h.w / 2, h.st, { color: tints[h.tint] }) : M.mat('brick', h.w / 1.4, h.st * 0.8, { color: tints[h.tint], emissive: '#3a1608', emissiveIntensity: 0.1 })} />
            <mesh geometry={geo[i].g} material={tile} castShadow receiveShadow />
            <Box s={[h.w, 0.1, 0.16]} p={[0, geo[i].ht - 0.05, h.d / 2 + 0.06]} m={wood} cast={false} />
          </group>
        ))}
        <Inst items={win.frames} m={wood} />
        <Inst items={win.lats} m={lat} kind="plane" />
        {people.map(([x, z], i) => (
          <group key={i} position={[x, 0, z]}>
            <Cyl rt={0.06} rb={0.07} h={0.22} p={[0, 0.14, 0]} m={M.plain(['#b3202a', '#2f6db5', '#e2b33c', '#f2efe6'][i])} seg={8} />
            <Ball rad={0.05} p={[0, 0.3, 0]} m={M.plain('#8a5a3a')} />
          </group>
        ))}
      </group>
    );
  }

  return { 'mul-chowk': { Main: MulChowkMain, Env: MulChowkEnv } };
}
