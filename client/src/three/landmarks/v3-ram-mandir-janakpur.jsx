// Ram Mandir, Janakpur: a small two-tier red-brick Nepali pagoda (rebuilt 1782) in the flat Terai. Plain exposed brick
// walls with timber pilasters and fascia, wide hipped roofs of dull gold-grey ribbed metal on raking timber struts, a small
// gilded gajur, a pointed timber-framed niche on the front, squat pink-red stone columns on a pale paved court, a one-step
// pink-edged plinth. West bank of Dhanush Sagar: the pond lies in FRONT (+z) with ghat steps. Painted Rajdevi gate on the
// east wall, a white shikhara shrine with trident behind, a lingam on a square base, market lane outside, no hills.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Gajur, Frame, Diyo, THREE, useMemo, useRef, useEffect } = K;

  const TIM = '#4a3426', PINK = '#d9a392', PALE = '#e6dccb';

  /* ---------- helpers ---------- */
  function archPath(P, w, hs, ha) {
    const hw = w / 2, r = ha - hs;
    P.moveTo(-hw, 0); P.lineTo(hw, 0); P.lineTo(hw, hs);
    P.bezierCurveTo(hw, hs + r * 0.55, hw * 0.22, ha - r * 0.2, 0, ha);
    P.bezierCurveTo(-hw * 0.22, ha - r * 0.2, -hw, hs + r * 0.55, -hw, hs);
    P.lineTo(-hw, 0);
    return P;
  }
  function Inst({ items, m }) {
    const ref = useRef();
    useEffect(() => {
      if (!ref.current) return;
      const o = new THREE.Object3D();
      items.forEach((it, i) => {
        o.position.set(it[0], it[1], it[2]); o.rotation.set(0, it[6] || 0, 0); o.scale.set(it[3], it[4], it[5]);
        o.updateMatrix(); ref.current.setMatrixAt(i, o.matrix);
      });
      ref.current.instanceMatrix.needsUpdate = true;
    }, [items]);
    return (
      <instancedMesh ref={ref} args={[null, null, items.length]} material={m} receiveShadow frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>
    );
  }

  const brickCache = {};
  function realBrick(rx, ry, tone = 0) {
    const key = `${rx}_${ry}_${tone}`;
    if (brickCache[key]) return brickCache[key];
    const c = document.createElement('canvas'); c.width = 128; c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#b9a58a'; g.fillRect(0, 0, 128, 128);
    const base = tone ? ['#8a3f27', '#94452c', '#823a24', '#9a4a2e'] : ['#a9512f', '#9a4a2e', '#b3583a', '#8f4529', '#7a3a24', '#a9512f'];
    for (let r = 0; r < 8; r += 1) {
      for (let q = 0; q < 5; q += 1) {
        const x = q * 26 - (r % 2 ? 13 : 0);
        g.fillStyle = base[(r * 3 + q * 5) % base.length];
        g.fillRect(x + 1.5, r * 16 + 1.5, 23, 13);
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.repeat.set(rx, ry);
    return (brickCache[key] = new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 }));
  }

  /** Ribbed metal roof: four triangular faces, corrugation runs down the slope on every face. */
  const ribTex = (() => {
    let t = null;
    return () => {
      if (t) return t;
      const c = document.createElement('canvas'); c.width = 64; c.height = 16;
      const g = c.getContext('2d');
      g.fillStyle = '#8f8560'; g.fillRect(0, 0, 64, 16);
      g.fillStyle = '#a38f55'; g.fillRect(0, 0, 22, 16);
      g.fillStyle = '#5f573c'; g.fillRect(22, 0, 10, 16);
      g.fillStyle = '#756b4a'; g.fillRect(48, 0, 6, 16);
      t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
      return t;
    };
  })();
  function RibRoof({ w, h, y, ribs = 11, sag = 1.0, lift = 0 }) {
    const geo = useMemo(() => {
      const hw = w / 2, NU = 16, NV = 10, pos = [], uv = [], idx = [];
      for (let j = 0; j <= NV; j += 1) {
        for (let i = 0; i <= NU; i += 1) {
          const a = -1 + (2 * i) / NU, t = j / NV;
          const x = a * hw * (1 - t), z = hw * (1 - t);
          const ax = Math.abs(a) * (1 - t), az = 1 - t;
          pos.push(x, h * t ** sag + lift * h * (ax * az) ** 2.4, z);
          uv.push(((x / hw + 1) / 2) * ribs, t * 3);
        }
      }
      for (let j = 0; j < NV; j += 1) {
        for (let i = 0; i < NU; i += 1) {
          const a = j * (NU + 1) + i, b = a + 1, c = a + NU + 1, e = c + 1;
          idx.push(a, b, c, b, e, c);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setIndex(idx); g.computeVertexNormals();
      return g;
    }, [w, h, sag, lift, ribs]);
    const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: ribTex(), roughness: 0.72, metalness: 0.05, side: THREE.DoubleSide }), []);
    const M = useM();
    return (
      <group position={[0, y, 0]}>
        {[0, 1, 2, 3].map((k) => <mesh key={k} geometry={geo} material={mat} rotation={[0, (k * Math.PI) / 2, 0]} castShadow receiveShadow />)}
        {/* soffit and dark timber fascia */}
        <Box s={[w * 0.96, 0.05, w * 0.96]} p={[0, -0.08, 0]} m={M.plain('#2e2018')} cast={false} />
        <Box s={[w - 0.08, 0.12, w - 0.08]} p={[0, -0.17, 0]} m={M.plain('#33231a')} cast={false} />
        <Box s={[w + 0.02, 0.3, 0.12]} p={[0, -0.09, w / 2]} m={M.plain(TIM)} cast={false} />
        <Box s={[w + 0.02, 0.3, 0.12]} p={[0, -0.09, -w / 2]} m={M.plain(TIM)} cast={false} />
        <Box s={[0.12, 0.3, w]} p={[w / 2, -0.09, 0]} m={M.plain(TIM)} cast={false} />
        <Box s={[0.12, 0.3, w]} p={[-w / 2, -0.09, 0]} m={M.plain(TIM)} cast={false} />
      </group>
    );
  }

  /** Raking timber struts under the eaves: n per face plus the four diagonal corner struts. */
  function Struts({ wall, reach, y, drop, n = 3, th = 0.11 }) {
    const M = useM(), tm = M.plain(TIM);
    const len = Math.hypot(reach, drop), ang = Math.atan2(reach, drop);
    const xs = n === 5 ? [-0.4, -0.2, 0, 0.2, 0.4].map((k) => k * wall) : n === 3 ? [-wall * 0.33, 0, wall * 0.33] : [-wall * 0.3, wall * 0.3];
    return (
      <group position={[0, y, 0]}>
        {[0, 1, 2, 3].map((k) => (
          <group key={k} rotation={[0, (k * Math.PI) / 2, 0]}>
            {xs.map((x) => (
              <Box key={x} s={[th, len, th * 1.3]} p={[x, -drop / 2, wall / 2 + reach / 2]} r={[ang, 0, 0]} m={tm} cast={false} />
            ))}
          </group>
        ))}
        {[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([sx, sz], i) => (
          <group key={i} position={[sx * wall / 2, 0, sz * wall / 2]} rotation={[0, Math.atan2(sx, sz), 0]}>
            <Box s={[th * 1.2, Math.hypot(reach * 1.2, drop), th * 1.2]} p={[0, -drop / 2, reach * 0.6]} r={[Math.atan2(reach * 1.2, drop), 0, 0]} m={tm} cast={false} />
          </group>
        ))}
      </group>
    );
  }

  /** Exposed red-brick storey: rough brick, timber corner posts, stepped corbel courses, optional dark lattice band. */
  function BrickStorey({ w, h, lattice = false, front = false, doorShape }) {
    const M = useM();
    const brick = realBrick(Math.round(w * 1.6), Math.round(h * 1.6));
    const brickD = realBrick(Math.round(w * 1.6), 1, 1);
    const tm = M.plain(TIM);
    const ltex = latticeTex();
    return (
      <group>
        <Box s={[w, h, w]} p={[0, h / 2, 0]} m={brick} />
        {[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([sx, sz]) => <Box key={`${sx}${sz}`} s={[0.1, h, 0.1]} p={[sx * (w / 2 - 0.01), h / 2, sz * (w / 2 - 0.01)]} m={tm} />)}
        <Box s={[w + 0.12, h * 0.08, w + 0.12]} p={[0, h * 0.04, 0]} m={M.plain('#b07a5c')} />
        {/* stepped corbel courses under the eave */}
        {[0, 1, 2, 3].map((i) => <Box key={i} s={[w + 0.03 + i * 0.05, 0.07, w + 0.03 + i * 0.05]} p={[0, h - 0.33 + i * 0.075, 0]} m={i % 2 ? brickD : brick} cast={false} />)}
        <Box s={[w + 0.14, h * 0.06, w + 0.14]} p={[0, h - h * 0.03, 0]} m={tm} />
        {lattice && [0, 1, 2, 3].map((k) => (
          <group key={k} rotation={[0, (k * Math.PI) / 2, 0]}>
            <mesh position={[0, h * 0.62, w / 2 + 0.025]}><planeGeometry args={[w * 0.8, h * 0.2]} /><meshStandardMaterial map={ltex} roughness={0.9} /></mesh>
          </group>
        ))}
        {front && doorShape}
      </group>
    );
  }
  const latticeTex = (() => {
    let t = null;
    return () => {
      if (t) return t;
      const c = document.createElement('canvas'); c.width = 128; c.height = 48;
      const g = c.getContext('2d');
      g.fillStyle = '#6a3524'; g.fillRect(0, 0, 128, 48);
      g.strokeStyle = '#a0634a'; g.lineWidth = 3;
      for (let x = -48; x < 160; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 48, 48); g.stroke(); g.beginPath(); g.moveTo(x + 48, 0); g.lineTo(x, 48); g.stroke(); }
      g.strokeRect(1.5, 1.5, 125, 45);
      t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
    };
  })();

  function Niche({ s = 1 }) {
    const M = useM();
    const [frame, inner] = useMemo(() => {
      const o = archPath(new THREE.Shape(), 0.98, 0.62, 1.12);
      o.holes.push(archPath(new THREE.Path(), 0.72, 0.58, 1.02));
      const i = archPath(new THREE.Shape(), 0.72, 0.58, 1.02);
      return [new THREE.ExtrudeGeometry(o, { depth: 0.1, bevelEnabled: false }), new THREE.ShapeGeometry(i)];
    }, []);
    return (
      <group scale={s}>
        <mesh geometry={inner} material={M.plain('#1b1109')} position={[0, 0.03, 0.01]} />
        <mesh geometry={frame} material={M.plain(TIM)} position={[0, 0.0, 0]} castShadow />
        {/* cusp in the arch + glow of a lamp inside */}
        <Box s={[0.5, 0.05, 0.12]} p={[0, 0.58, 0.05]} m={M.plain(TIM)} cast={false} />
        <mesh position={[0, 0.3, 0.02]}><planeGeometry args={[0.16, 0.22]} /><meshBasicMaterial color="#ffb25a" toneMapped={false} /></mesh>
      </group>
    );
  }

  /* ---------- the pagoda ---------- */
  function Tarp() {
    const geo = useMemo(() => {
      const g = new THREE.PlaneGeometry(1.8, 1.1, 10, 8);
      const p = g.attributes.position;
      for (let k = 0; k < p.count; k += 1) {
        const x = p.getX(k), y = p.getY(k);
        p.setZ(k, Math.sin(x * 3.2) * 0.09 + Math.sin(y * 4) * 0.01);
      }
      g.computeVertexNormals();
      return g;
    }, []);
    return <mesh geometry={geo} position={[1.4, 1.85, 1.85]} rotation={[0.66, 0, 0]} castShadow><meshStandardMaterial color="#d9d2bd" roughness={1} side={THREE.DoubleSide} /></mesh>;
  }
  function Pagoda() {
    const M = useM();
    const gold = M.gold;
    const bell = (x, y, z, k) => <mesh key={k} position={[x, y, z]} material={gold}><coneGeometry args={[0.045, 0.1, 8]} /></mesh>;
    const LH = 2.3, D = LH - 1.8, U = 0.2; // lower storey height, shift of everything above
    return (
      <group scale={1.25}>
        {/* one-step plinth with pink edge */}
        <Box s={[3.45, 0.16, 3.45]} p={[0, 0.08, 0]} m={M.plain(PINK, { roughness: 0.9 })} />
        <Box s={[3.2, 0.02, 3.2]} p={[0, 0.165, 0]} m={M.plain('#cdc2ad', { roughness: 1 })} cast={false} />
        {/* lower storey */}
        <group position={[0, 0.16, 0]}>
          <BrickStorey w={2.7} h={LH} front doorShape={<group position={[0, 0.06, 1.37]}><Niche s={1.35} /></group>} />
        </group>
        <Struts wall={2.7} reach={0.75} y={1.91 + D} drop={0.5} n={5} />
        <RibRoof w={4.3} h={0.75} y={1.98 + D} ribs={16} lift={0.2} />
        {/* stepped brick band and upper storey */}
        <Box s={[2.15, 0.1, 2.15]} p={[0, 2.29 + D, 0]} m={realBrick(3, 1, 1)} />
        <Box s={[2.03, 0.1, 2.03]} p={[0, 2.39 + D, 0]} m={realBrick(3, 1)} />
        {[0, 1, 2, 3].map((k) => (
          <group key={k} rotation={[0, (k * Math.PI) / 2, 0]}>
            {Array.from({ length: 9 }, (_, i) => <Box key={i} s={[0.1, 0.07, 0.07]} p={[(i - 4) * 0.22, 2.35 + D, 1.1]} m={M.plain('#7a3a24')} cast={false} />)}
          </group>
        ))}
        <group position={[0, 2.44 + D, 0]}>
          <BrickStorey w={1.85} h={1.15} lattice />
        </group>
        <Struts wall={1.85} reach={0.6} y={3.53 + D} drop={0.4} n={2} th={0.09} />
        <RibRoof w={3.1} h={0.68} y={3.61 + D} ribs={12} lift={0.22} />
        {/* gajur on short neck */}
        <Cyl rt={0.14} rb={0.22} h={0.16} p={[0, 4.2 + D, 0]} m={M.plain(TIM)} seg={8} />
        <Cyl rt={0.16} rb={0.16} h={0.05} p={[0, 4.3 + D, 0]} m={gold} seg={12} />
        <Gajur y={4.32 + D} s={0.65} />
        {/* sparse tiny bells at the roof corners */}
        {[[1.95, 1.97, 1.95], [-1.95, 1.97, 1.95], [1.95, 1.97, -1.95], [-1.95, 1.97, -1.95]].map(([x, y, z], i) => bell(x, y + D - 0.1, z, i))}
        {[[1.45, 3.65, 1.45], [-1.45, 3.65, 1.45], [1.45, 3.65, -1.45], [-1.45, 3.65, -1.45]].map(([x, y, z], i) => bell(x, y + D - 0.1, z, i + 9))}
        {/* sagging white tarpaulin on the right half only, niche stays clear */}
        <Tarp />
        <Cyl rt={0.014} h={2.5} p={[0.55, 1.2, 2.45]} r={[-0.25, 0, 0]} m={M.plain('#6a5a48')} seg={5} />
        <Cyl rt={0.014} h={2.5} p={[2.25, 1.2, 2.45]} r={[-0.25, 0, 0]} m={M.plain('#6a5a48')} seg={5} />
      </group>
    );
  }

  /** Fat pink-red stone pillars: pairs of fused shafts on a shared grey base, deep cornice capitals, a stone beam on top. */
  function Columns() {
    const M = useM();
    const col = M.plain('#b2604a', { roughness: 0.85 });
    const grey = M.plain('#c4c0b6', { roughness: 0.9 });
        const xs = [-2.9, -2.0, -1.1];
    return (
      <group>
        {xs.map((x) => (
          <group key={x} position={[x, 0, 2.85]}>
            <Box s={[0.9, 0.12, 0.58]} p={[0, 0.06, 0]} m={grey} />
            <Cyl rt={0.3} rb={0.36} h={0.2} p={[0, 0.22, 0]} m={col} seg={14} />
            {[-0.18, 0.18].map((dx) => <Cyl key={dx} rt={0.2} rb={0.22} h={1.35} p={[dx, 0.84, 0]} m={col} seg={14} />)}
            <Box s={[0.95, 0.2, 0.62]} p={[0, 1.6, 0]} m={grey} />
          </group>
        ))}
        <Box s={[3.0, 0.08, 0.34]} p={[-2.0, 0.04, 2.85]} m={M.plain('#d9a392')} cast={false} />
      </group>
    );
  }

  function Main() {
    return (
      <group>
        <Pagoda />
        <Columns />
        <Frame s={[7.4, 5.8, 11.8]} p={[-0.4, 2.8, 4.7]} />
      </group>
    );
  }

  /* ---------- environment pieces ---------- */
  const floralTex = (() => {
    let t = null;
    return () => {
      if (t) return t;
      const c = document.createElement('canvas'); c.width = 256; c.height = 64;
      const g = c.getContext('2d');
      g.fillStyle = '#2d8a4b'; g.fillRect(0, 0, 256, 64);
      for (let i = 0; i < 14; i += 1) {
        const x = 9 + i * 18.5, y = i % 2 ? 40 : 22;
        g.fillStyle = '#1f6a38'; g.beginPath(); g.ellipse(x + 8, y + 9, 9, 4, 0.6, 0, 7); g.fill();
        g.fillStyle = '#f4a8bf'; for (let a = 0; a < 6; a += 1) { g.beginPath(); g.arc(x + Math.cos(a * 1.047) * 5, y + Math.sin(a * 1.047) * 5, 4.2, 0, 7); g.fill(); }
        g.fillStyle = '#fff1d8'; g.beginPath(); g.arc(x, y, 2.6, 0, 7); g.fill();
      }
      t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
    };
  })();

  /** Painted Rajdevi gate: pink wall with a pointed arch outlined in blue, scalloped yellow rim, green floral panel above. */
  function RajdeviGate({ p, ry = 0, s = 0.85 }) {
    const M = useM();
    const { wall, ring, rim } = useMemo(() => {
      const W = 3.4, H = 2.5;
      const sh = new THREE.Shape(); sh.moveTo(-W / 2, 0); sh.lineTo(W / 2, 0); sh.lineTo(W / 2, H); sh.lineTo(-W / 2, H); sh.lineTo(-W / 2, 0);
      sh.holes.push(archPath(new THREE.Path(), 1.7, 0.95, 2.0));
      const o = archPath(new THREE.Shape(), 2.0, 1.0, 2.2);
      o.holes.push(archPath(new THREE.Path(), 1.7, 0.95, 2.0));
      const pts = archPath(new THREE.Path(), 1.84, 0.98, 2.1).getPoints(40).filter((q) => q.y > 0.9);
      const rimPts = pts.filter((_, i) => i % 3 === 0);
      return {
        wall: new THREE.ExtrudeGeometry(sh, { depth: 0.5, bevelEnabled: false }),
        ring: new THREE.ExtrudeGeometry(o, { depth: 0.58, bevelEnabled: false }),
        rim: rimPts,
      };
    }, []);
    const orange = M.plain('#ee9a2c'), yellow = M.plain('#f2c63e'), pinkm = M.plain('#f0a5b6'), blue = M.plain('#3f6dc2'), red = M.plain('#c8332c');
    return (
      <group position={p} rotation={[0, ry, 0]} scale={s}>
        <mesh geometry={wall} material={pinkm} position={[0, 0, -0.25]} castShadow />
        <mesh geometry={ring} material={blue} position={[0, 0, -0.29]} castShadow />
        {rim.map((q, i) => (
          <group key={i}>
            <Ball rad={0.07} p={[q.x * 0.97, q.y, 0.3]} m={yellow} />
            <Ball rad={0.07} p={[q.x * 0.97, q.y, -0.3]} m={yellow} />
          </group>
        ))}
        {[-1, 1].map((k) => (
          <group key={k}>
            <Box s={[0.5, 2.6, 0.7]} p={[k * 1.95, 1.3, 0]} m={orange} />
            <Box s={[0.6, 0.2, 0.8]} p={[k * 1.95, 0.1, 0]} m={yellow} />
            <Box s={[0.62, 0.14, 0.8]} p={[k * 1.95, 2.65, 0]} m={yellow} />
            <Box s={[0.2, 0.34, 0.06]} p={[k * 1.4, 2.0, 0.28]} m={red} cast={false} />
            <Ball rad={0.13} p={[k * 1.95, 2.9, 0]} m={M.plain('#fff3d0', { emissive: '#ffd890', emissiveIntensity: 0.6 })} />
          </group>
        ))}
        <Box s={[4.2, 0.2, 0.9]} p={[0, 2.6, 0]} m={yellow} />
        <Box s={[3.5, 0.9, 0.6]} p={[0, 3.15, 0]} m={blue} />
        <mesh position={[0, 3.15, 0.31]}><planeGeometry args={[3.3, 0.72]} /><meshStandardMaterial map={floralTex()} roughness={0.9} /></mesh>
        <mesh position={[0, 3.15, -0.31]} rotation={[0, Math.PI, 0]}><planeGeometry args={[3.3, 0.72]} /><meshStandardMaterial map={floralTex()} roughness={0.9} /></mesh>
        <Box s={[4.0, 0.16, 0.8]} p={[0, 3.68, 0]} m={orange} />
        <Box s={[3.6, 0.1, 0.7]} p={[0, 3.78, 0]} m={pinkm} />
        <Box s={[0.5, 0.3, 0.06]} p={[0, 2.4, 0.3]} m={red} cast={false} />
      </group>
    );
  }

  const SHIK = (() => {
    const pts = [[0.58, 0], [0.56, 0.5], [0.46, 1.0], [0.34, 1.5], [0.24, 1.9], [0.2, 2.2], [0.24, 2.3], [0.1, 2.4]];
    return pts.map(([r, y]) => new THREE.Vector2(r, y));
  })();
  const doorGeo = (() => { let g = null; return () => g || (g = new THREE.ShapeGeometry(archPath(new THREE.Shape(), 0.42, 0.45, 0.78))); })();
  const doorRim = (() => {
    let g = null;
    return () => {
      if (g) return g;
      const o = archPath(new THREE.Shape(), 0.5, 0.45, 0.86);
      o.holes.push(archPath(new THREE.Path(), 0.42, 0.45, 0.78));
      return (g = new THREE.ShapeGeometry(o));
    };
  })();
  /** Small whitewashed shikhara shrine with trident. */
  function ShikharaShrine({ p, ry = 0 }) {
    const M = useM();
    const white = M.plain('#f3efe6', { roughness: 0.85 });
    const geo = useMemo(() => new THREE.LatheGeometry(SHIK, 4), []);
    return (
      <group position={p} rotation={[0, ry, 0]} scale={0.62}>
        <Box s={[1.5, 0.2, 1.5]} p={[0, 0.1, 0]} m={M.plain('#cfc6b6')} />
        <Box s={[1.15, 1.2, 1.15]} p={[0, 0.8, 0]} m={white} />
        <Box s={[1.25, 0.1, 1.25]} p={[0, 1.45, 0]} m={white} />
        <mesh geometry={geo} material={white} position={[0, 1.5, 0]} rotation={[0, Math.PI / 4, 0]} scale={[1.1, 1, 1.1]} castShadow />
        {/* ribbed amalaka */}
        <Cyl rt={0.36} rb={0.36} h={0.22} p={[0, 3.4, 0]} m={white} seg={12} />
        {Array.from({ length: 12 }, (_, i) => <Box key={i} s={[0.05, 0.22, 0.05]} p={[Math.cos(i * 0.5236) * 0.37, 3.4, Math.sin(i * 0.5236) * 0.37]} m={M.plain('#cfc6b6')} cast={false} />)}
        <Cyl rt={0.3} rb={0.3} h={0.08} p={[0, 3.55, 0]} m={white} seg={12} />
        <Cyl rt={0.05} h={0.3} p={[0, 3.65, 0]} m={M.gold} seg={8} />
        <Trident p={[0, 3.75, 0]} h={0.6} />
        <mesh geometry={doorGeo()} material={M.plain('#2a1c14')} position={[0, 0.2, 0.575]} />
        <mesh geometry={doorRim()} material={M.plain('#d0a233')} position={[0, 0.2, 0.572]} />
      </group>
    );
  }
  const Trident = ({ p, h }) => {
    const M = useM(); const iron = M.plain('#7a7570', { metalness: 0.8, roughness: 0.35 });
    return (
      <group position={p}>
        <Cyl rt={0.02} h={h} p={[0, h / 2, 0]} m={iron} seg={6} />
        {[-0.1, 0, 0.1].map((x) => <mesh key={x} position={[x, h + (x ? 0.1 : 0.16), 0]} material={iron}><coneGeometry args={[0.025, x ? 0.22 : 0.32, 6]} /></mesh>)}
        <Box s={[0.22, 0.03, 0.03]} p={[0, h, 0]} m={iron} />
      </group>
    );
  };
  /** Small brick shrine with a stacked, scaled roof and several tiny pinnacles (photo 4). */
  function BrickShrine({ p }) {
    const M = useM();
    const tm = M.plain('#6a4a3a'), roofm = M.plain('#8a5a48', { roughness: 0.7 });
    return (
      <group position={p}>
        <Box s={[1.3, 0.16, 1.3]} p={[0, 0.08, 0]} m={M.plain(PINK)} />
        <Box s={[1.0, 0.95, 1.0]} p={[0, 0.63, 0]} m={realBrick(2, 2)} />
        <Box s={[1.18, 0.1, 1.18]} p={[0, 1.15, 0]} m={tm} />
        <Box s={[1.1, 0.06, 1.1]} p={[0, 1.23, 0]} m={M.plain('#b8a88a')} cast={false} />
        {[0, 1, 2].map((i) => <Box key={i} s={[0.95 - i * 0.22, 0.18, 0.95 - i * 0.22]} p={[0, 1.38 + i * 0.17, 0]} m={roofm} />)}
        {[[0.32, 0.32], [-0.32, 0.32], [0.32, -0.32], [-0.32, -0.32]].map(([x, z], i) => <mesh key={i} position={[x, 1.42, z]} material={M.gold}><coneGeometry args={[0.05, 0.2, 6]} /></mesh>)}
        <Cyl rt={0.03} h={0.3} p={[0, 2.05, 0]} m={M.gold} seg={6} />
        <Box s={[0.34, 0.5, 0.05]} p={[0, 0.55, 0.52]} m={M.plain('#1d140f')} />
      </group>
    );
  }
  function ShivaLingam({ p }) {
    const M = useM();
    return (
      <group position={p}>
        <Box s={[0.95, 0.38, 0.95]} p={[0, 0.19, 0]} m={M.plain('#8d8a85', { roughness: 0.95 })} />
        <Box s={[0.7, 0.06, 0.7]} p={[0, 0.39, 0]} m={M.plain('#6e6b66', { roughness: 0.95 })} />
        <Cyl rt={0.14} rb={0.15} h={0.4} p={[0, 0.62, 0]} m={M.plain('#2b2928', { roughness: 0.45 })} seg={14} />
        <Ball rad={0.14} p={[0, 0.82, 0]} m={M.plain('#2b2928', { roughness: 0.45 })} />
        <Diyo p={[0.5, 0.0, 0.7]} light />
        <Diyo p={[-0.3, 0.0, 0.75]} />
      </group>
    );
  }

  const skin = ['#c58a62', '#a8704a', '#d2996f'];
  function Person({ p, c, ry = 0 }) {
    const M = useM();
    return (
      <group position={p} rotation={[0, ry, 0]} scale={1.5}>
        <Cyl rt={0.09} rb={0.14} h={0.5} p={[0, 0.25, 0]} m={M.plain(c, { roughness: 1 })} seg={8} />
        <Ball rad={0.075} p={[0, 0.58, 0]} m={M.plain(skin[Math.floor(Math.abs(p[0] * 7 + p[2] * 3)) % 3], { roughness: 1 })} />
      </group>
    );
  }
  function Stall({ p, tarp, goods, ry = 0 }) {
    const M = useM();
    return (
      <group position={p} rotation={[0, ry, 0]}>
        <Box s={[1.3, 0.38, 0.6]} p={[0, 0.19, 0]} m={M.plain('#b89a6a')} />
        {goods.map((c, i) => <Ball key={i} rad={0.14} sc={[1, 0.7, 1]} p={[-0.45 + i * 0.3, 0.46, 0]} m={M.plain(c, { roughness: 1 })} />)}
        {[-0.7, 0.7].map((x) => <Cyl key={x} rt={0.025} h={1.3} p={[x, 0.65, -0.3]} m={M.plain('#6a5a48')} seg={6} />)}
        <mesh position={[0, 1.28, -0.05]} rotation={[-0.45, 0, 0]}>
          <planeGeometry args={[1.5, 0.9]} /><meshStandardMaterial color={tarp} roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
      </group>
    );
  }
  function Lamp({ p, light }) {
    const M = useM();
    return (
      <group position={p}>
        <Cyl rt={0.03} h={1.7} p={[0, 0.85, 0]} m={M.plain('#e8e4da')} seg={6} />
        <mesh position={[0, 1.8, 0]}><sphereGeometry args={[0.14, 12, 10]} /><meshBasicMaterial color="#fff0c4" toneMapped={false} /></mesh>
        {light && <pointLight position={[0, 1.7, 0]} intensity={2} distance={5} color="#ffc878" />}
      </group>
    );
  }
  function BigTree({ p, s = 1, c = '#4d6b38', kind = 0 }) {
    const M = useM();
    const leaf = M.plain(c, { roughness: 1 });
    const bl = [
      [[0, 2.5, 0, 1.15], [0.8, 2.1, 0.3, 0.85], [-0.8, 2.2, -0.2, 0.9], [0.15, 3.1, -0.2, 0.8]],
      [[0, 3.4, 0, 0.8], [0.1, 2.5, 0.1, 0.95], [0, 4.2, 0, 0.55]],
      [[0, 2.3, 0, 1.4], [1.4, 2.1, 0.2, 1.0], [-1.4, 2.0, -0.2, 1.05]],
      [[0.2, 2.6, 0, 1.0], [-0.7, 3.2, 0.3, 0.7], [0.9, 3.3, -0.3, 0.6]],
    ][kind % 4];
    const sc = [[1, 0.85, 1], [0.9, 1.3, 0.9], [1, 0.6, 1], [1, 0.95, 1]][kind % 4];
    return (
      <group position={p} scale={s} rotation={[0, kind * 1.3, 0]}>
        <Cyl rt={0.16} rb={0.26} h={1.8} p={[0, 0.9, 0]} m={M.plain('#5a4030')} seg={6} />
        {bl.map(([x, y, z, r], i) => <Ball key={i} rad={r} p={[x, y, z]} m={leaf} sc={sc} />)}
      </group>
    );
  }
  const frondGeo = (() => {
    let g = null;
    return () => {
      if (g) return g;
      const N = 7, pos = [], idx = [];
      let x = 0, y = 0, z = 0;
      for (let k = 0; k <= N; k += 1) {
        const w = 0.26 * Math.sin((k / N) * 2.6 + 0.4) + 0.02;
        pos.push(-w, y, z, w, y, z);
        const ph = 0.55 - (k / N) * 1.7;
        y += Math.sin(ph) * 0.4; z += Math.cos(ph) * 0.4;
        if (k < N) { const a = k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      }
      g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setIndex(idx); g.computeVertexNormals();
      return g;
    };
  })();
  function Palm({ p, h = 5, lean = 0.1 }) {
    const M = useM();
    const trunk = M.plain('#8a7358');
    const fm = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4a8236', roughness: 0.9, side: THREE.DoubleSide }), []);
    return (
      <group position={p} rotation={[0, 0, lean]}>
        <Cyl rt={0.08} rb={0.16} h={h} p={[0, h / 2, 0]} m={trunk} seg={6} />
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={i} geometry={frondGeo()} material={fm} position={[0, h, 0]} rotation={[0, (i * Math.PI) / 4 + (i % 2) * 0.2, 0]} scale={0.8 + (i % 3) * 0.2} />
        ))}
      </group>
    );
  }
  function Town({ p, w, d, floors, c, ry = 0 }) {
    const M = useM();
    const h = floors * 0.95;
    const n = Math.max(2, Math.round(w / 1.2));
    const frame = M.plain('#f1ead8'), glass = M.plain('#3b3128', { roughness: 0.5 }), shut = M.plain('#6a8a58');
    return (
      <group position={p} rotation={[0, ry, 0]}>
        <Box s={[w, h, d]} p={[0, h / 2, 0]} m={M.plain(c, { roughness: 0.95 })} />
        <Box s={[w + 0.15, 0.12, d + 0.15]} p={[0, h + 0.06, 0]} m={M.plain('#cfc9bd')} />
        <Box s={[w + 0.1, 0.4, 0.1]} p={[0, h + 0.3, d / 2]} m={M.plain(c, { roughness: 0.95 })} />
        {Array.from({ length: floors }, (_, f) => (
          <group key={f}>
            {Array.from({ length: n }, (_, k) => {
              const x = (k - (n - 1) / 2) * (w / n);
              return (
                <group key={k} position={[x, f * 0.95 + 0.62, d / 2]}>
                  <Box s={[0.5, 0.64, 0.05]} p={[0, 0, 0.01]} m={frame} cast={false} />
                  <Box s={[0.36, 0.5, 0.05]} p={[0, 0, 0.04]} m={glass} cast={false} />
                  <Box s={[0.08, 0.5, 0.06]} p={[-0.26, 0, 0.05]} m={shut} cast={false} />
                  <Box s={[0.08, 0.5, 0.06]} p={[0.26, 0, 0.05]} m={shut} cast={false} />
                </group>
              );
            })}
            <Box s={[w * 0.98, 0.06, 0.22]} p={[0, f * 0.95 + 0.02 + 0.95, d / 2 + 0.07]} m={M.plain('#d8d2c4')} cast={false} />
          </group>
        ))}
      </group>
    );
  }

  /* ---------- Env ---------- */
  function Env() {
    const M = useM();
    const grass = M.plain('#aab585', { roughness: 1 });
    const lawn = M.plain('#aab585', { roughness: 1 });
    const farField = M.plain('#a3b07f', { roughness: 1 });
    const stone = M.plain('#cfc6b2', { roughness: 1 });
    const copingM = M.plain('#cfc5b2');
    const wallPink = M.plain('#d9a8a6', { roughness: 0.95 });
    const white = M.plain('#f1eee6');
    const railing = useMemo(() => {
      const it = [];
      for (let z = -8.9; z <= 3.6; z += 0.3) if (Math.abs(z) > 2.0) it.push([9, 0.95, z, 0.045, 0.8, 0.045, 0]);
      for (let x = -8.9; x <= 8.9; x += 0.3) it.push([x, 0.95, -9, 0.045, 0.8, 0.045, 0]);
      for (let z = -8.9; z <= 3.6; z += 0.3) it.push([-9, 0.95, z, 0.045, 0.8, 0.045, 0]);
      return it;
    }, []);
    const trees = useMemo(() => {
      const out = [];
      const greens = ['#4d6b38', '#3f5f32', '#587a3c', '#355a30', '#6a8240'];
      for (let i = 0; i < 26; i += 1) {
        const x = -36 + i * 2.5 + Math.sin(i * 12.9) * 2.2;
        const z = -11.5 - ((i * 7) % 5) * 2.3 - Math.abs(Math.cos(i * 3.3)) * 3;
        out.push({ p: [x, 0, z], s: 0.9 + ((i * 5) % 5) * 0.22, c: greens[(i * 3) % 5], k: (i * 7 + (i >> 1)) % 4 });
      }
      [[-24, 6], [-12, -3], [-12.5, 0], [13.5, -12], [-16, -9], [20, -8], [-22, -3], [-26, 14]].forEach(([x, z], i) => out.push({ p: [x, 0, z], s: 1.4 + (i % 3) * 0.25, c: greens[(i + 2) % 5], k: i + 2 }));
      return out;
    }, []);
    return (
      <group>
        {/* hazy Terai: pale green-grey fields to the horizon; ground in pieces so the pond is excavated in front (+z) */}
        <mesh position={[0, 4, 0]}><cylinderGeometry args={[105, 105, 9, 48, 1, true]} /><meshBasicMaterial color="#b0ba95" side={THREE.BackSide} fog={false} /></mesh>
        <color attach="background" args={['#c9d0c0']} />
        <fog attach="fog" args={['#c4cdb4', 45, 160]} />
        <Box s={[700, 0.5, 400]} p={[0, -0.34, -195]} m={M.plain('#b9c29a', { roughness: 1 })} cast={false} />
        <Box s={[120, 0.5, 80]} p={[0, -0.29, -45]} m={farField} cast={false} />
        <Box s={[300, 0.5, 400]} p={[-178, -0.29, 205]} m={grass} cast={false} />
        <Box s={[300, 0.5, 400]} p={[178, -0.29, 205]} m={grass} cast={false} />
        <Box s={[56, 0.5, 360]} p={[0, -0.29, 225]} m={grass} cast={false} />
        {/* pale paved court inside the walled complex (front edge at z=5) */}
        <Box s={[18, 0.1, 12.7]} p={[0, -0.05, -2.65]} m={stone} cast={false} />
        {/* market lane beyond the east wall */}
        <Box s={[7, 0.08, 14]} p={[12.5, -0.04, -2]} m={M.plain('#cbbd9e', { roughness: 1 })} cast={false} />

        {/* Dhanush Sagar in front (+z): short grass strip, paved apron, three ghat steps, then dark green-brown water 24 m wide */}
        <Box s={[56, 0.5, 5.3]} p={[0, -0.29, 5.65]} m={lawn} cast={false} />
        <Box s={[30, 0.1, 3.2]} p={[0, -0.05, 6.8]} m={stone} cast={false} />
        {[-12, -6, 0, 6, 12].map((x) => <Box key={x} s={[0.06, 0.02, 3.2]} p={[x, 0.01, 6.8]} m={M.plain('#a89f8a')} cast={false} />)}
        {[1, 2].map((k) => <Box key={k} s={[30, 0.02, 0.06]} p={[0, 0.01, 5.6 + k * 1.1]} m={M.plain('#a89f8a')} cast={false} />)}
        {[[-5, 5.0, 3.5], [6, 4.7, 2.5], [-11, 3.2, 2.2]].map(([x, z, w], i) => <Box key={i} s={[w, 0.03, 0.9]} p={[x, 0.0, z]} m={M.plain('#9fae7c', { roughness: 1 })} cast={false} />)}
        <Box s={[16, 0.5, 24]} p={[-20, -0.29, 20.3]} m={lawn} cast={false} />
        <Box s={[16, 0.5, 24]} p={[20, -0.29, 20.3]} m={lawn} cast={false} />
        <Box s={[56, 0.5, 12.7]} p={[0, -0.29, 38.65]} m={lawn} cast={false} />
        <Box s={[24, 0.3, 24]} p={[0, -0.85, 20.3]} m={M.plain('#3f4a38')} cast={false} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 20.3]} receiveShadow>
          <planeGeometry args={[24, 24]} /><meshStandardMaterial color="#5f7358" metalness={0.1} roughness={0.4} emissive="#2e3a2a" emissiveIntensity={0.12} />
        </mesh>
        {[0, 1, 2].map((k) => <Box key={k} s={[24.8, 0.6, 0.5]} p={[0, -0.12 * (k + 1) - 0.3, 8.55 + 0.5 * k]} m={M.plain(k % 2 ? '#cfc4ae' : '#ddd3bf', { roughness: 1 })} cast={false} />)}
        {[-1, 1].map((sd) => <Box key={sd} s={[0.5, 0.7, 24]} p={[sd * 12.2, -0.35, 20.3]} m={copingM} cast={false} />)}
        <Box s={[24.8, 0.6, 0.4]} p={[0, -0.3, 32.3]} m={copingM} cast={false} />
        {[-12.6, 12.6].map((x) => <Cyl key={x} rt={0.1} h={0.5} p={[x, 0.25, 8.2]} m={M.plain('#c9c5bc')} seg={8} />)}
        <group position={[4, -0.5, 23]} rotation={[0, 0.4, 0]}>
          <Box s={[2.6, 0.35, 0.8]} p={[0, 0.05, 0]} m={M.plain('#6a4a30')} />
          <Box s={[0.5, 0.35, 0.78]} p={[1.4, 0.2, 0]} r={[0, 0, 0.5]} m={M.plain('#6a4a30')} />
          <Box s={[0.5, 0.35, 0.78]} p={[-1.4, 0.2, 0]} r={[0, 0, -0.5]} m={M.plain('#6a4a30')} />
        </group>
        <Person p={[-4, 0, 6.8]} c="#2f6db5" ry={2.5} />

        {/* low boundary walls with iron railings, east gate */}
        <Box s={[18.4, 0.55, 0.3]} p={[0, 0.275, -9]} m={wallPink} />
        <Box s={[0.3, 0.55, 12.7]} p={[-9, 0.275, -2.65]} m={wallPink} />
        <Box s={[0.3, 0.55, 7.0]} p={[9, 0.275, -5.5]} m={wallPink} />
        <Box s={[0.3, 0.55, 1.8]} p={[9, 0.275, 2.9]} m={wallPink} />
        <Inst items={railing} m={white} />
        <Box s={[18.4, 0.06, 0.08]} p={[0, 1.35, -9]} m={white} cast={false} />
        <Box s={[0.08, 0.06, 12.7]} p={[-9, 1.35, -2.65]} m={white} cast={false} />
        <Box s={[0.08, 0.06, 7.0]} p={[9, 1.35, -5.5]} m={white} cast={false} />
        <Box s={[0.08, 0.06, 1.8]} p={[9, 1.35, 2.9]} m={white} cast={false} />
        <RajdeviGate p={[9, 0, 0]} ry={Math.PI / 2} s={1.15} />
        <RajdeviGate p={[16.6, 0, 0]} ry={Math.PI / 2} s={0.85} />

        {/* complex neighbours: white shikhara + trident behind, small brick shrine, lingam */}
        <ShikharaShrine p={[-5.2, 0, -7]} />
        <ShikharaShrine p={[3.9, 0, -4.2]} ry={0.2} />
        <BrickShrine p={[6.6, 0, -6.2]} />
        <BrickShrine p={[-7.6, 0, -3.6]} />
        <ShivaLingam p={[4.6, 0, 2.7]} />
        <Person p={[2.8, 0, 3.0]} c="#c0392b" ry={3} />

        {/* market lane: flower/puja stalls under blue and orange tarps, lamps, passers-by */}
        <Stall p={[11, 0, -3.6]} tarp="#2f5fa8" goods={['#f08a1c', '#f4c430', '#d63a8a', '#f08a1c']} ry={-Math.PI / 2} />
        <Lamp p={[9.5, 0, -5]} light />
        <Lamp p={[9.5, 0, 5.4]} />
        <Person p={[11.2, 0, 1.2]} c="#c0392b" ry={0} />

        {/* flat Terai town beyond the lane: low concrete houses */}
        <Town p={[19, 0, -3]} w={4} d={5} floors={3} c="#d9c7a3" ry={-Math.PI / 2} />
        <Town p={[19.5, 0, 4]} w={4.2} d={4.4} floors={2} c="#c9d3c1" ry={-Math.PI / 2} />
        <Town p={[19, 0, -10]} w={4.4} d={4.6} floors={4} c="#e2b7a0" ry={-Math.PI / 2} />
        <Town p={[-15.5, 0, 3]} w={4.4} d={4.4} floors={2} c="#d9d0b8" ry={Math.PI / 2} />
        <Town p={[-16.5, 0, -6]} w={4.2} d={5} floors={3} c="#bdd0cf" ry={Math.PI / 2} />

        {/* dense broadleaf trees and palms behind; no hills */}
        {trees.map((t, i) => <BigTree key={i} p={t.p} s={t.s} c={t.c} kind={t.k} />)}
        {[[-9, -13], [-1.5, -12.5], [6.5, -12], [12, -11], [-14, -11], [-19, -8]].map(([x, z], i) => <Palm key={i} p={[x, 0, z]} h={4.8 + (i % 3) * 0.9} lean={0.05 + (i % 2) * 0.06} />)}
        {[[16, 6.5], [10.2, -7.9]].map(([x, z], i) => <Palm key={`g${i}`} p={[x, 0, z]} h={5.5} lean={-0.07} />)}
      </group>
    );
  }

  return { 'ram-mandir-janakpur': { Main, Env } };
}
