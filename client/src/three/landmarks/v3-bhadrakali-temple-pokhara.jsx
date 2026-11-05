export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Frame, Diyo, GroundDisc, THREE, useMemo, useEffect, useRef } = K;

  const TY = 0.62; // platform top
  const rnd = (seed) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };
  const sstep = (t) => { const c = Math.min(1, Math.max(0, t)); return c * c * (3 - 2 * c); };
  const HILL_R0 = 7, HILL_R1 = 32, HILL_DROP = 16;
  const slopeY = (r) => {
    const t = Math.min(1, Math.max(0, (r - HILL_R0) / (HILL_R1 - HILL_R0)));
    return -HILL_DROP * (1 - Math.pow(1 - t, 1.8));
  };
  const STX = 0; // x of the long stair, straight south of the lions

  const RED = '#c24a2e';
  const TILE = '#5a4d52';
  const TERRA = '#a8503a';

  /* ---------- small helpers ---------- */
  function Strut({ y0, z0, y1, z1, x = 0, t = 0.07, m }) {
    const dy = y1 - y0, dz = z1 - z0;
    const L = Math.hypot(dy, dz);
    return <Box s={[t, t, L]} p={[x, (y0 + y1) / 2, (z0 + z1) / 2]} r={[-Math.atan2(dy, dz), 0, 0]} m={m} cast={false} />;
  }
  function canvasTex(kind, rx, ry) {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 128;
    const g = c.getContext('2d');
    const R = rnd(kind === 'cobble' ? 11 : 5);
    if (kind === 'cobble') {
      g.fillStyle = '#3a342b'; g.fillRect(0, 0, 256, 128);
      for (let row = 0; row < 4; row += 1) {
        let x = (row % 2) * 12;
        while (x < 256) {
          const w = 24 + R() * 22; const l = 120 + R() * 55;
          g.fillStyle = `rgb(${l},${l - 8},${l - 22})`;
          g.beginPath(); g.ellipse(x + w / 2, row * 32 + 16, w / 2 - 3, 12.5, 0, 0, 7); g.fill();
          x += w;
        }
      }
    } else {
      g.fillStyle = '#5a4d52'; g.fillRect(0, 0, 256, 128);
      for (let row = 0; row < 16; row += 1) {
        g.fillStyle = row % 2 ? '#6b5d62' : '#4c4046'; g.fillRect(0, row * 8, 256, 3);
        for (let x = (row % 2) * 8; x < 256; x += 16) { g.fillStyle = '#3f343a'; g.fillRect(x, row * 8, 1.5, 8); }
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry);
    t.anisotropy = 4;
    return t;
  }
  function fringeTexture() {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 32;
    const g = c.getContext('2d');
    g.clearRect(0, 0, 256, 32);
    g.fillStyle = '#b8381f'; g.fillRect(0, 0, 256, 8);
    for (let i = 0; i < 16; i += 1) {
      g.fillStyle = i % 2 ? '#f1e9dc' : '#c2452a';
      g.beginPath(); g.moveTo(i * 16 + 1, 8); g.lineTo(i * 16 + 15, 8); g.lineTo(i * 16 + 8, 30); g.closePath(); g.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  /** red fascia board plus hanging fringe on all four eaves */
  function EaveTrim({ w, y, red, fringeM }) {
    const sides = [[0, 0], [Math.PI / 2, 0], [Math.PI, 0], [-Math.PI / 2, 0]];
    return (
      <group position={[0, y, 0]}>
        {sides.map(([ry], i) => (
          <group key={i} rotation={[0, ry, 0]}>
            <Box s={[w + 0.02, 0.1, 0.06]} p={[0, -0.02, w / 2]} m={red} cast={false} />
            <mesh position={[0, -0.17, w / 2 + 0.02]} material={fringeM}><planeGeometry args={[w, 0.2]} /></mesh>
          </group>
        ))}
      </group>
    );
  }

  function LionG({ m, mane }) {
    return (
      <group>
        <Box s={[0.24, 0.2, 0.22]} p={[0, 0.16, -0.12]} m={m} />
        <Box s={[0.22, 0.22, 0.2]} p={[0, 0.2, 0.05]} m={m} />
        <Box s={[0.3, 0.2, 0.12]} p={[0, 0.34, 0.16]} m={m} />
        <Box s={[0.14, 0.08, 0.12]} p={[0, 0.31, 0.27]} m={m} />
        <Box s={[0.15, 0.03, 0.04]} p={[0, 0.35, 0.33]} m={mane} cast={false} />
        <Cyl rt={0.2} rb={0.2} h={0.05} p={[0, 0.34, 0.1]} r={[Math.PI / 2, 0, 0]} m={mane} seg={10} />
        {[-0.1, 0.1].map((x) => <Box key={x} s={[0.05, 0.05, 0.05]} p={[x, 0.45, 0.14]} m={m} />)}
        {[-0.07, 0.07].map((x) => <Box key={x} s={[0.06, 0.12, 0.24]} p={[x, 0.06, 0.2]} m={m} />)}
        {[-0.12, 0.12].map((x) => <Box key={x} s={[0.07, 0.1, 0.18]} p={[x, 0.05, -0.12]} m={m} />)}
        <Box s={[0.05, 0.05, 0.2]} p={[0, 0.3, -0.3]} r={[0.6, 0, 0]} m={m} />
      </group>
    );
  }

  /* ---------- MAIN ---------- */
  function BhadrakaliMain() {
    const M = useM();
    const wall = M.plain('#f3eee4', { roughness: 0.85 });
    const red = M.plain(RED, { roughness: 0.8 });
    const terra = M.plain(TERRA, { roughness: 0.85 });
    const brass = M.plain('#c9a233', { roughness: 0.4, metalness: 0.5 });
    const redDeep = M.plain('#a9412c', { roughness: 0.85 });
    const timber = M.plain('#4a3326', { roughness: 0.85 });
    const tile = useMemo(() => new THREE.MeshStandardMaterial({ map: canvasTex('tile', 2, 2), roughness: 0.85, side: THREE.DoubleSide }), []);
    const cobble = useMemo(() => new THREE.MeshStandardMaterial({ map: canvasTex('cobble', 6, 1), roughness: 0.95 }), []);
    const flags = M.plain('#a49b8f', { roughness: 0.95 });
    const iron = M.plain('#7d8083', { roughness: 0.6, metalness: 0.4 });
    const goldY = M.plain('#e0ad2c', { roughness: 0.5 });
    const goldDeep = M.plain('#b98a1c', { roughness: 0.5 });
    const dark = M.plain('#1e1612', { roughness: 0.9 });
    const fringeM = useMemo(() => new THREE.MeshStandardMaterial({ map: fringeTexture(), transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.9 }), []);

    const E1 = 1.85, W1 = 2.6, ROOF1 = 4.3;       // lower eave height, wall width, eave width
    const FZ = E1 + 1.0; // frieze centre
    const E2 = FZ + 0.175 + 0.82, W2 = 1.55, ROOF2 = 2.7; // upper eave height, upper wall width, eave width
    const sides = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
    const P = 2.6;                                 // platform half width
    const post = [];
    for (let i = 0; i <= 11; i += 1) post.push(-P + 0.12 + ((2 * P - 0.24) * i) / 11);
    const orange = M.plain('#b8603a', { roughness: 0.9 });
    const ridgeRed = M.plain('#c8472c', { roughness: 0.7 });
    const lattice = M.plain('#7a3a26', { roughness: 0.85 });
    const infill = M.plain('#d8c7a2', { roughness: 0.9 });

    return (
      <group>
        {/* cobble platform */}
        <Box s={[2 * P, TY, 2 * P]} p={[0, TY / 2, 0]} m={cobble} />
        <Box s={[2 * P + 0.14, 0.07, 2 * P + 0.14]} p={[0, TY + 0.0, 0]} m={M.plain('#8c8478', { roughness: 0.95 })} />
        <Box s={[2 * P - 0.1, 0.03, 2 * P - 0.1]} p={[0, TY + 0.03, 0]} m={flags} cast={false} />
        {/* short red stair at the front */}
        {[0, 1, 2, 3].map((i) => (
          <Box key={i} s={[1.2, TY / 4, 0.26]} p={[0, (TY / 4) * (i + 0.5) , P + 0.12 + (3 - i) * 0.24]} m={i % 2 ? red : redDeep} />
        ))}
        {[-0.68, 0.68].map((x) => <Box key={x} s={[0.14, 0.34, 1.1]} p={[x, 0.17, P + 0.5]} m={red} />)}
        {/* golden lions, crouched on low plinths flanking the stair foot */}
        {[-1.05, 1.05].map((x) => (
          <group key={x} position={[x, 0, P + 0.85]}>
            <Box s={[0.5, 0.2, 0.55]} p={[0, 0.1, 0]} m={red} />
            <group position={[0, 0.2, 0]} scale={1.1}><LionG m={goldY} mane={goldDeep} /></group>
          </group>
        ))}
        {/* iron post-and-chain railing */}
        {sides.map((ry, si) => (
          <group key={si} rotation={[0, ry, 0]}>
            {post.map((x, i) => (si === 0 && Math.abs(x) < 0.7 ? null : <Box key={i} s={[0.07, 0.95, 0.07]} p={[x, TY + 0.475, P - 0.08]} m={iron} cast={false} />))}
            {[0.78, 0.5].map((hy) => (si === 0
              ? [[-P + 0.12, -0.7], [0.7, P - 0.12]].map(([a, b], k) => <Box key={`${hy}${k}`} s={[b - a, 0.02, 0.02]} p={[(a + b) / 2, TY + hy, P - 0.08]} m={iron} cast={false} />)
              : <Box key={hy} s={[2 * P - 0.24, 0.02, 0.02]} p={[0, TY + hy, P - 0.08]} m={iron} cast={false} />))}
          </group>
        ))}

        {/* lower storey: white plastered cella */}
        <Box s={[W1, E1 - TY, W1]} p={[0, (E1 + TY) / 2, 0]} m={wall} />
        <Box s={[W1 + 0.06, 0.1, W1 + 0.06]} p={[0, TY + 0.05, 0]} m={redDeep} cast={false} />
        {/* front door, dark, framed in timber */}
        <Box s={[0.7, 0.95, 0.06]} p={[0, TY + 0.5, W1 / 2 + 0.02]} m={dark} />
        <Box s={[0.84, 0.08, 0.09]} p={[0, TY + 1.0, W1 / 2 + 0.03]} m={timber} />
        {[-0.4, 0.4].map((x) => <Box key={x} s={[0.07, 1.0, 0.09]} p={[x, TY + 0.52, W1 / 2 + 0.03]} m={timber} />)}
        {/* long diagonal raking struts of the lower roof */}
        {sides.map((ry, si) => (
          <group key={si} rotation={[0, ry, 0]}>
            {(si === 0 ? [-1.05, -0.5, 0.5, 1.05] : [-1.05, 0, 1.05]).map((x) => (
              <Strut key={x} x={x} y0={1.12} z0={W1 / 2} y1={E1 - 0.04} z1={ROOF1 / 2 - 0.08} t={0.075} m={timber} />
            ))}
            {[-1.28, 1.28].map((x) => <Strut key={x} x={x} y0={1.25} z0={W1 / 2 + 0.02} y1={E1 - 0.04} z1={ROOF1 / 2 - 0.1} t={0.06} m={timber} />)}
            <Box s={[W1 - 0.1, 0.07, 0.07]} p={[0, 1.1, W1 / 2 + 0.03]} m={timber} cast={false} />
          </group>
        ))}
        {/* red porch of slim square posts, thin slab and brass bells on a beam */}
        {[-0.62, 0.62].map((x) => (
          <Box key={x} s={[0.2, 0.9, 0.2]} p={[x, TY + 0.45, W1 / 2 + 0.95]} m={orange} />
        ))}
        <Box s={[1.7, 0.12, 0.9]} p={[0, TY + 0.96, W1 / 2 + 0.55]} m={orange} />
        {[-0.4, 0, 0.4].map((x) => (
          <group key={x} position={[x, TY + 0.88, W1 / 2 + 0.95]}>
            <Box s={[0.015, 0.1, 0.015]} p={[0, 0.02, 0]} m={iron} cast={false} />
            <Ball rad={0.07} p={[0, -0.07, 0]} sc={[1, 1.1, 1]} m={brass} />
          </group>
        ))}
        {/* lower roof, red fascia and fringe */}
        <Roof w={ROOF1} d={ROOF1} h={1.25} y={E1} m={tile} sag={1.5} lift={0.45} fascia={false} />
        <EaveTrim w={ROOF1} y={E1} red={red} fringeM={fringeM} />
        <Box s={[0.5, 0.1, 0.5]} p={[0, E1 + 1.22, 0]} m={ridgeRed} cast={false} />
        {/* red frieze band between the roofs, emerging from the lower roof */}
        <Box s={[W2 + 0.08, 0.35, W2 + 0.08]} p={[0, FZ, 0]} m={terra} />
        {/* upper storey: short, narrower, white with small windows */}
        <Box s={[W2, E2 - (FZ + 0.175), W2]} p={[0, (E2 + FZ + 0.175) / 2, 0]} m={wall} />
        {sides.map((ry, si) => (
          <group key={si} rotation={[0, ry, 0]}>
            {[-0.38, 0.38].map((x) => (
              <group key={x} position={[x, E2 - 0.5, W2 / 2 + 0.01]}>
                <Box s={[0.34, 0.36, 0.05]} p={[0, 0, 0]} m={lattice} />
                <Box s={[0.26, 0.28, 0.06]} p={[0, 0, 0.005]} m={infill} />
                {[-0.065, 0, 0.065].map((lx) => <Box key={lx} s={[0.02, 0.28, 0.07]} p={[lx, 0, 0.01]} m={lattice} />)}
                {[-0.07, 0.07].map((ly) => <Box key={ly} s={[0.26, 0.02, 0.07]} p={[0, ly, 0.01]} m={lattice} />)}
              </group>
            ))}
            {[-0.58, 0.58].map((x) => <Strut key={x} x={x} y0={E2 - 0.3} z0={W2 / 2} y1={E2 - 0.04} z1={ROOF2 / 2 - 0.06} t={0.06} m={timber} />)}
          </group>
        ))}
        <Roof w={ROOF2} d={ROOF2} h={0.9} y={E2} m={tile} sag={1.5} lift={0.35} fascia={false} />
        <EaveTrim w={ROOF2} y={E2} red={red} fringeM={fringeM} />
        {/* small thin gilded pinnacle */}
        <group position={[0, E2 + 0.72, 0]}>
          <Box s={[0.18, 0.1, 0.18]} p={[0, 0.02, 0]} m={goldDeep} />
          <Ball rad={0.1} p={[0, 0.16, 0]} m={M.gold} />
          <Cyl rt={0.03} rb={0.07} h={0.16} p={[0, 0.3, 0]} m={M.gold} />
          <mesh position={[0, 0.58, 0]} material={M.gold} castShadow><coneGeometry args={[0.03, 0.46, 8]} /></mesh>
        </group>
        <Diyo p={[-1.05, 0.2, P + 1.5]} light />
        <Diyo p={[1.05, 0.2, P + 1.5]} light />
        <pointLight position={[0, TY + 0.6, W1 / 2 + 0.6]} intensity={1.2} distance={3.2} color="#ffb060" />
        <Frame s={[5.8, 6.0, 7.0]} p={[0, 3.0, 0.5]} />
      </group>
    );
  }

  /* ---------- ENV ---------- */
  function Forest() {
    const trunks = useRef();
    const lumps = useRef();
    const data = useMemo(() => {
      const R = rnd(7);
      const out = [];
      let guard = 0;
      while (out.length < 340 && guard < 9000) {
        guard += 1;
        const a = R() * Math.PI * 2;
        const r = 9 + R() * 42;
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        // keep the stair corridor and the open front clear
        if (Math.abs(x - STX) < 3.5 && z > 5) continue;
        if (z > 1 && r < 20) continue;
        if (z > 1 && x > 0 && r < 26) continue;
        const y = slopeY(r);
        out.push({ x, y, z, s: 0.8 + R() * 0.9, c: R() });
      }
      return out;
    }, []);
    useEffect(() => {
      const o = new THREE.Object3D();
      const col = new THREE.Color();
      data.forEach((t, i) => {
        o.position.set(t.x, t.y + 0.9 * t.s, t.z); o.scale.set(0.18 * t.s, 1.8 * t.s, 0.18 * t.s); o.rotation.set(0, 0, 0); o.updateMatrix();
        trunks.current.setMatrixAt(i, o.matrix);
        for (let k = 0; k < 2; k += 1) {
          o.position.set(t.x + (k ? 0.5 : -0.2) * t.s, t.y + (2.4 + k * 0.5) * t.s, t.z + (k ? -0.3 : 0.2) * t.s);
          o.scale.setScalar((1.5 - k * 0.35) * t.s); o.updateMatrix();
          lumps.current.setMatrixAt(i * 2 + k, o.matrix);
          col.setHSL(0.29 + t.c * 0.05, 0.45, 0.12 + t.c * 0.07 + k * 0.03);
          lumps.current.setColorAt(i * 2 + k, col);
        }
      });
      trunks.current.instanceMatrix.needsUpdate = true;
      lumps.current.instanceMatrix.needsUpdate = true;
      if (lumps.current.instanceColor) lumps.current.instanceColor.needsUpdate = true;
    }, [data]);
    return (
      <>
        <instancedMesh ref={trunks} args={[null, null, data.length]} castShadow>
          <cylinderGeometry args={[0.6, 1, 1, 6]} /><meshStandardMaterial color="#5a4332" roughness={1} />
        </instancedMesh>
        <instancedMesh ref={lumps} args={[null, null, data.length * 2]} castShadow>
          <icosahedronGeometry args={[1, 1]} /><meshStandardMaterial color="#ffffff" roughness={1} />
        </instancedMesh>
      </>
    );
  }

  function RingTrees() {
    const M = useM();
    const trunk = M.plain('#4a3a2c', { roughness: 1 });
    const g1 = M.plain('#2a5026', { roughness: 1 });
    const g2 = M.plain('#2f5a2a', { roughness: 1 });
    const list = [
      [-9.5, 0, 1.5], [-9.5, -5, 1.5], [-7, -9.5, 1.6], [-2, -10.5, 1.5], [3, -10.5, 1.6], [8, -8, 1.5], [10, -3, 1.5],
      [10.5, 2.5, 1.4], [-12, -9, 1.7], [-6, -13, 1.7], [2, -14, 1.7], [10, -12, 1.7], [14, -5, 1.7], [-14, -2, 1.7], [-9, 5, 1.4],
    ];
    return (
      <>
        {list.map(([x, z, s], i) => {
          const y = slopeY(Math.hypot(x, z));
          return (
            <group key={i} position={[x, y, z]}>
              <Cyl rt={0.14 * s} rb={0.22 * s} h={2.6 * s} p={[0, 1.3 * s, 0]} m={trunk} seg={7} />
              <Ball rad={1.5 * s} p={[0, 3.1 * s, 0]} sc={[1.15, 0.9, 1.15]} m={i % 2 ? g1 : g2} />
              <Ball rad={1.1 * s} p={[0.9 * s, 2.6 * s, 0.4 * s]} m={g1} />
              <Ball rad={1.0 * s} p={[-0.9 * s, 2.7 * s, -0.3 * s]} m={g2} />
              <Ball rad={0.9 * s} p={[0.1 * s, 4.1 * s, 0.2 * s]} m={g1} />
            </group>
          );
        })}
      </>
    );
  }

  function Hill({ m }) {
    const geo = useMemo(() => {
      const pts = [new THREE.Vector2(0, -0.04)];
      for (let r = HILL_R0 - 0.5; r <= HILL_R1 + 1; r += 1.5) pts.push(new THREE.Vector2(r, Math.min(-0.04, slopeY(r) - 0.04)));
      pts.push(new THREE.Vector2(HILL_R1 + 3, -HILL_DROP - 0.3));
      return new THREE.LatheGeometry(pts.reverse(), 56);
    }, []);
    return <mesh geometry={geo} material={m} receiveShadow />;
  }

  function Stair({ x, z0, z1 }) {
    const M = useM();
    const st = M.plain('#9d9588', { roughness: 0.95 });
    const rail = M.plain('#86898c', { roughness: 0.6 });
    const n = 80;
    const steps = Array.from({ length: n }, (_, i) => {
      const z = z0 + ((z1 - z0) * i) / (n - 1);
      return [z, slopeY(Math.hypot(x, z))];
    });
    return (
      <group>
        {steps.map(([z, y], i) => <Box key={i} s={[2.0, 0.6, 0.5]} p={[x, y - 0.3, z]} m={st} cast={false} />)}
        {steps.filter((_, i) => i % 6 === 0).map(([z, y], i) => (
          <group key={i}>
            <Box s={[0.05, 0.5, 0.05]} p={[x - 1.1, y + 0.25, z]} m={rail} cast={false} />
            <Box s={[0.05, 0.5, 0.05]} p={[x + 1.1, y + 0.25, z]} m={rail} cast={false} />
          </group>
        ))}
      </group>
    );
  }

  function Shrine({ p, r = 0, roofCol = '#6a5a5c' }) {
    const M = useM();
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[1.6, 0.25, 1.6]} p={[0, 0.125, 0]} m={M.plain('#a99f90')} />
        <Box s={[1.0, 0.9, 1.0]} p={[0, 0.7, 0]} m={M.plain('#f1ece0')} />
        <Box s={[0.34, 0.5, 0.05]} p={[0, 0.5, 0.52]} m={M.plain('#251a14')} />
        <Roof w={1.7} d={1.7} h={0.45} y={1.15} m={M.mat('roof', 2, 2, { color: roofCol })} sag={1.4} fascia={false} />
        <Box s={[1.72, 0.07, 1.72]} p={[0, 1.13, 0]} m={M.plain(RED)} cast={false} />
        <Cyl rt={0.02} rb={0.05} h={0.3} p={[0, 1.78, 0]} m={M.gold} seg={8} />
      </group>
    );
  }

  function StonePillar({ p }) {
    const M = useM();
    const orange = M.plain('#b8603a', { roughness: 0.9 });
    const orange2 = M.plain('#a4522f', { roughness: 0.9 });
    const bronze = M.plain('#566056', { roughness: 0.7, metalness: 0.3 });
    return (
      <group position={p}>
        <Box s={[0.9, 0.3, 0.9]} p={[0, 0.15, 0]} m={M.plain('#9d9588')} />
        <Box s={[0.5, 0.2, 0.5]} p={[0, 0.4, 0]} m={orange2} />
        <Box s={[0.34, 1.9, 0.34]} p={[0, 1.4, 0]} m={orange2} />
        <Cyl rt={0.3} rb={0.2} h={0.18} p={[0, 2.44, 0]} m={orange} seg={12} />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <Ball key={i} rad={0.06} p={[Math.cos(i * 0.785) * 0.3, 2.34, Math.sin(i * 0.785) * 0.3]} m={orange} />)}
        <Cyl rt={0.46} rb={0.3} h={0.2} p={[0, 2.62, 0]} m={orange} seg={16} />
        <Cyl rt={0.5} rb={0.5} h={0.1} p={[0, 2.76, 0]} m={orange2} seg={16} />
        <Cyl rt={0.4} rb={0.46} h={0.1} p={[0, 2.86, 0]} m={orange} seg={16} />
        <group position={[0, 2.9, 0]} scale={1.1}>
          <Box s={[0.28, 0.24, 0.5]} p={[0, 0.2, 0]} m={bronze} />
          <Ball rad={0.13} p={[0, 0.4, 0.2]} m={bronze} />
          <Box s={[0.1, 0.3, 0.1]} p={[0, 0.3, 0.3]} m={bronze} />
          <Box s={[0.34, 0.06, 0.2]} p={[0, 0.58, 0.1]} r={[0.4, 0, 0]} m={bronze} />
          <Box s={[0.08, 0.08, 0.3]} p={[0.2, 0.34, 0.15]} r={[0.5, 0, -0.3]} m={bronze} />
        </group>
      </group>
    );
  }

  function FloweringTree({ p }) {
    const M = useM();
    const tones = [M.plain('#c8203f', { roughness: 0.9 }), M.plain('#d93a5a', { roughness: 0.9 }), M.plain('#a8183a', { roughness: 0.9 })];
    const balls = useMemo(() => {
      const R = rnd(19);
      return Array.from({ length: 34 }, () => {
        const a = R() * Math.PI * 2, u = R() * 2 - 1, k = Math.sqrt(1 - u * u), d = 0.6 + R() * 1.5;
        return [Math.cos(a) * k * d * 1.05, 3.5 + u * d * 0.8 + R() * 0.3, Math.sin(a) * k * d * 1.05, 0.4 + R() * 0.4, Math.floor(R() * 3)];
      });
    }, []);
    const brick = M.mat('brick', 3, 1, { color: '#e8a58a' });
    return (
      <group position={p}>
        <Cyl rt={1.1} rb={1.15} h={0.3} p={[0, 0.15, 0]} m={brick} seg={20} />
        <Cyl rt={0.9} rb={0.9} h={0.34} p={[0, 0.17, 0]} m={M.plain('#6f8a3c')} seg={20} />
        <Cyl rt={0.14} rb={0.22} h={1.9} p={[0, 1.2, 0]} m={M.plain('#5a4536')} seg={8} />
        <Cyl rt={0.05} rb={0.09} h={1.3} p={[0.4, 2.2, 0.1]} r={[0, 0, -0.7]} m={M.plain('#5a4536')} seg={6} />
        <Cyl rt={0.05} rb={0.09} h={1.3} p={[-0.4, 2.2, -0.1]} r={[0, 0, 0.7]} m={M.plain('#5a4536')} seg={6} />
        {balls.map(([x, y, z, r, c], i) => <Ball key={i} rad={r} p={[x, y, z]} m={tones[c]} />)}
        <Ball rad={0.9} p={[0, 3.3, 0]} m={tones[2]} />
      </group>
    );
  }

  function Bench({ p, r = 0 }) {
    const M = useM();
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[0.8, 0.05, 0.25]} p={[0, 0.22, 0]} m={M.plain('#8a6a4a')} cast={false} />
        <Box s={[0.06, 0.22, 0.2]} p={[-0.34, 0.11, 0]} m={M.plain('#8d8a84')} cast={false} />
        <Box s={[0.06, 0.22, 0.2]} p={[0.34, 0.11, 0]} m={M.plain('#8d8a84')} cast={false} />
      </group>
    );
  }
  function Lamp({ p }) {
    const M = useM();
    return (
      <group position={p}>
        <Cyl rt={0.03} rb={0.05} h={1.9} p={[0, 0.95, 0]} m={M.plain('#55585b')} seg={8} />
        <Ball rad={0.1} p={[0, 1.95, 0]} m={M.plain('#fff2c8', { roughness: 0.4 })} />
        <pointLight position={[0, 1.9, 0]} intensity={1.4} distance={5} color="#ffd9a0" />
      </group>
    );
  }

  function Houses() {
    const M = useM();
    const cols = ['#d9d4cc', '#c9c2b6', '#e4ddd0', '#b8b0a4', '#d7cbb9'];
    const R = rnd(31);
    const list = useMemo(() => {
      const out = [];
      for (let i = 0; i < 16; i += 1) {
        const side = i % 2 ? 1 : -1;
        out.push({ x: STX + side * (4.5 + R() * 2) + (R() - 0.5), z: HILL_R1 + 1 + (i >> 1) * 2.2 + R(), w: 2 + R() * 1.4, d: 2.2 + R(), h: 1.4 + R() * 1.4, c: cols[i % 5] });
      }
      for (let i = 0; i < 14; i += 1) {
        const a = (R() * 2 - 1) * 1.3 + Math.PI / 2;
        const r = 55 + R() * 14;
        out.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, w: 2 + R() * 1.6, d: 2 + R() * 1.4, h: 1.2 + R() * 1.6, c: cols[(i + 2) % 5] });
      }
      return out;
    }, []);
    return (
      <>
        {list.map((h, i) => (
          <group key={i} position={[h.x, -HILL_DROP, h.z]}>
            <Box s={[h.w, h.h, h.d]} p={[0, h.h / 2, 0]} m={M.plain(h.c, { roughness: 0.95 })} />
            <Box s={[h.w + 0.2, 0.1, h.d + 0.2]} p={[0, h.h + 0.05, 0]} m={M.plain('#8e8a84')} cast={false} />
            {h.h > 2 && <Box s={[h.w * 0.6, 0.05, 0.3]} p={[0, h.h * 0.55, h.d / 2 + 0.15]} m={M.plain('#d8d8d6')} cast={false} />}
          </group>
        ))}
      </>
    );
  }

  function HazyHills() {
    const hills = useMemo(() => {
      const R = rnd(3);
      return Array.from({ length: 34 }, (_, i) => {
        const far = i >= 18;
        const a = ((far ? i - 18 : i) / (far ? 16 : 18)) * Math.PI * 2 + R() * 0.2;
        const r = far ? 138 + R() * 10 : 110 + R() * 10;
        return { x: Math.cos(a) * r, z: Math.sin(a) * r, s: far ? 40 + R() * 22 : 28 + R() * 20, h: far ? 0.3 + R() * 0.16 : 0.24 + R() * 0.2, c: far ? 2 : i % 2 };
      });
    }, []);
    const cols = ['#7f93a8', '#8a9db1', '#a9b8c7'];
    return (
      <>
        {hills.map((h, i) => (
          <mesh key={i} position={[h.x, -HILL_DROP - 2, h.z]} scale={[h.s, h.s * h.h, h.s]}>
            <sphereGeometry args={[1, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={cols[h.c]} roughness={1} />
          </mesh>
        ))}
      </>
    );
  }

  function SkyDome() {
    const geo = useMemo(() => {
      const g = new THREE.SphereGeometry(230, 32, 16);
      const pos = g.attributes.position;
      const cols = new Float32Array(pos.count * 3);
      const lo = new THREE.Color('#d8e2ea'), hi = new THREE.Color('#7fa6cf'), c = new THREE.Color();
      for (let i = 0; i < pos.count; i += 1) {
        const t = Math.min(1, Math.max(0, pos.getY(i) / 150));
        c.copy(lo).lerp(hi, Math.pow(t, 0.7));
        cols.set([c.r, c.g, c.b], i * 3);
      }
      g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
      return g;
    }, []);
    return <mesh geometry={geo} position={[0, -10, 0]}><meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} /></mesh>;
  }

  function BhadrakaliEnv() {
    const M = useM();
    const grass = M.plain('#2f5a2a', { roughness: 1 });
    const plain = M.plain('#a3b36c', { roughness: 1 });
    const flag = M.plain('#b6ada0', { roughness: 0.95 });
    const wallM = useMemo(() => new THREE.MeshStandardMaterial({ map: canvasTex('cobble', 24, 2), roughness: 0.95, side: THREE.DoubleSide }), []);
    const coping = M.plain('#a29a8c', { roughness: 0.9 });
    return (
      <group>
        {/* surrounding plain far below, hazy hills on the horizon */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -HILL_DROP - 0.35, 0]} receiveShadow material={plain}><circleGeometry args={[150, 48]} /></mesh>
        <HazyHills />
        <SkyDome />
        {/* rounded forested hillock */}
        <Hill m={grass} />
        <Forest />
        {/* paved summit plaza on a small mound, rimmed by a stone retaining wall */}
        <GroundDisc r={HILL_R0} m={flag} y={-0.02} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}><ringGeometry args={[HILL_R0 - 3.2, HILL_R0 - 0.2, 48]} /><meshStandardMaterial color="#86a35c" roughness={1} /></mesh>
        <mesh position={[0, -0.55, 0]} material={wallM} castShadow receiveShadow><cylinderGeometry args={[HILL_R0 + 0.05, HILL_R0 + 0.35, 1.1, 56, 1, true]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0, 0]} material={coping}><ringGeometry args={[HILL_R0 - 0.2, HILL_R0 + 0.12, 56]} /></mesh>
        {[[-3.5, -3.5, 1.6], [4.6, 3.6, 1.2], [3, -5.2, 1.4]].map(([x, z, r], i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.0, z]}><circleGeometry args={[r, 24]} /><meshStandardMaterial color="#7f9d54" roughness={1} /></mesh>
        ))}
        {/* worn path from the stair to the temple */}
        <Box s={[2.4, 0.03, 3.6]} p={[0, 0.0, 5.0]} m={M.plain('#a29b90', { roughness: 0.95 })} cast={false} />
        <group position={[-6.0, 0, -3.8]} scale={0.8}><FloweringTree p={[0, 0, 0]} /></group>
        <StonePillar p={[5.4, 0, 0.6]} />
        <Bench p={[-4.6, 0, 3.6]} r={0.3} />
        <Lamp p={[3.2, 0, 5.2]} />
        <Lamp p={[-3.2, 0, 5.2]} />
        <RingTrees />
        {/* subordinate shrines on the plaza, to the side and behind */}
        <Shrine p={[4.4, 0, -3.6]} r={-0.5} />
        <Shrine p={[1.0, 0, -6.0]} r={0.2} roofCol="#756466" />
        <group position={[-1.6, 0, -5.6]}>
          <Box s={[1.4, 0.9, 1.1]} p={[0, 0.45, 0]} m={M.plain('#e9e0cf')} />
          <Roof w={1.9} d={1.5} h={0.4} y={0.9} m={M.plain('#6a5448')} sag={1.2} fascia={false} />
        </group>
        {/* long stone stair down the forested slope, gate arch at the foot */}
        <Stair x={STX} z0={HILL_R0 - 0.2} z1={HILL_R1 - 3} />
        <group position={[STX, -HILL_DROP, HILL_R1 - 1.2]}>
          <Box s={[0.6, 2.4, 0.9]} p={[-1.25, 1.2, 0]} m={M.plain('#9b4a38')} />
          <Box s={[0.6, 2.4, 0.9]} p={[1.25, 1.2, 0]} m={M.plain('#9b4a38')} />
          <Box s={[3.1, 0.7, 1.0]} p={[0, 2.55, 0]} m={M.plain('#b9573c')} />
          <Box s={[3.3, 0.12, 1.2]} p={[0, 2.95, 0]} m={M.plain('#5a4d50')} />
        </group>
        <Houses />
      </group>
    );
  }

  return { 'bhadrakali-temple-pokhara': { Main: BhadrakaliMain, Env: BhadrakaliEnv } };
}
