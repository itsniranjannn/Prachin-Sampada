// Ghodaghodi Temple and Lake, Sukhad (Ghodaghodi Municipality), Kailali. A small plain flat-roofed yellow shrine with a maroon front beam,
// a shallow verandah on three slim pillars, one broad flight of nine grey concrete steps with cheek walls, and hundreds of red and white
// cloth strips tied to fences, poles, mesh and the verandah beam. It sits in sal forest above a big calm oxbow lake (lotus pads, a tree
// islet, flat Terai horizon). Scale: 1 unit = 2 m. Platform top y = 0.9 (1.8 m), lake level y = -0.9 (platform about 3.6 m above water).
// Layout: shrine front faces +z. The lake wraps the front and the left-hand (-x) side, so the 3/4 camera sees shrine, fence and water.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Frame, THREE, useMemo, useRef, useEffect, useState } = K;

  const mkRng = (seed) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };

  const WATER_Y = -0.9;
  const PLAT = 0.9;
  // lake: union of a left-hand lake (A) and a front lake (B); e < 1 is inside the ellipse
  const lakeE = (x, z) => {
    const eA = ((x + 50) / 38) ** 2 + ((z + 6) / 50) ** 2;
    const eB = ((x - 6) / 84) ** 2 + ((z - 55) / 41) ** 2;
    return Math.min(eA, eB);
  };
  const terrainH = (x, z) => -2.0 * smooth((1.3 - lakeE(x, z)) / 0.5);

  function useDusk() {
    const ref = useRef();
    const [dusk, setDusk] = useState(false);
    useEffect(() => {
      try { let o = ref.current; while (o && o.parent) o = o.parent; const c = o && o.background; if (c && c.isColor) setDusk(c.r + c.g + c.b < 0.7); } catch (e) { /* ignore */ }
    }, []);
    return [dusk, ref];
  }

  /* instanced primitives, per-instance colour. item = [x,y,z, sx,sy,sz, ry, color, rz] */
  function Inst({ items, m, kind = 'box', cast = false }) {
    const ref = useRef();
    useEffect(() => {
      if (!ref.current) return;
      const o = new THREE.Object3D(); const c = new THREE.Color();
      items.forEach((it, i) => {
        o.position.set(it[0], it[1], it[2]); o.rotation.set(0, it[6] || 0, it[8] || 0); o.scale.set(it[3], it[4], it[5]);
        o.updateMatrix(); ref.current.setMatrixAt(i, o.matrix);
        if (it[7]) { c.set(it[7]); ref.current.setColorAt(i, c); }
      });
      ref.current.instanceMatrix.needsUpdate = true;
      if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    }, [items]);
    return (
      <instancedMesh ref={ref} args={[null, null, items.length]} material={m} castShadow={cast} receiveShadow frustumCulled={false}>
        {kind === 'box' ? <boxGeometry args={[1, 1, 1]} /> : kind === 'cyl' ? <cylinderGeometry args={[0.5, 0.5, 1, 8]} /> : kind === 'cone' ? <coneGeometry args={[0.5, 1, 6]} /> : kind === 'disc' ? <cylinderGeometry args={[0.5, 0.5, 1, 10]} /> : <sphereGeometry args={[0.5, 9, 7]} />}
      </instancedMesh>
    );
  }

  /* a rod between two points */
  function Bar({ a, b, r = 0.04, m, seg = 6 }) {
    const { pos, quat, len } = useMemo(() => {
      const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
      const d = B.clone().sub(A); const len = d.length();
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
      return { pos: A.clone().add(B).multiplyScalar(0.5).toArray(), quat: q, len };
    }, [a, b]);
    return <mesh position={pos} quaternion={quat} material={m} castShadow><cylinderGeometry args={[r, r, len, seg]} /></mesh>;
  }

  /* side profile (z, y) polygon extruded across x from x0 to x1 */
  function Prism({ pts, x0, x1, m }) {
    const geo = useMemo(() => {
      const s = new THREE.Shape(); pts.forEach(([z, y], i) => (i ? s.lineTo(z, y) : s.moveTo(z, y))); s.closePath();
      const g = new THREE.ExtrudeGeometry(s, { depth: x1 - x0, bevelEnabled: false });
      g.rotateY(-Math.PI / 2); g.translate(x1, 0, 0); return g;
    }, [pts, x0, x1]);
    return <mesh geometry={geo} material={m} castShadow receiveShadow />;
  }

  /* ---------- cloth strips ---------- */
  const CLOTH = ['#c0392b', '#d23a2a', '#b8312a', '#c8402e', '#a8302a', '#cf3a28', '#f4f2ec', '#e8e4dc', '#e8602c', '#f08a3c'];
  const clothAt = (rng, x, y, z, L, w, ry) => [x, y - L / 2, z, w, L, 0.012, ry, CLOTH[(rng() * CLOTH.length) | 0], (rng() - 0.5) * 0.22];
  // fat irregular bunches tied along a line a->b (top edge), facing +z (side=false) or +/-x (side=true)
  function line(rng, a, b, n, lmin, lmax, side) {
    const out = [];
    const nb = Math.max(2, Math.round(n / 4));
    for (let k = 0; k < nb; k++) {
      const t0 = (k + 0.2 + rng() * 0.6) / nb;
      const cnt = 2 + ((rng() * 3) | 0);
      for (let j = 0; j < cnt; j++) {
        const t = clamp(t0 + (rng() - 0.5) * 0.035, 0, 1);
        const L = lmin + Math.pow(rng(), 1.4) * (lmax - lmin) * 1.15;
        out.push(clothAt(rng, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t + (rng() - 0.5) * 0.05, L, 0.12 + rng() * 0.06, (side ? Math.PI / 2 : 0) + (rng() - 0.5) * 0.7));
      }
    }
    return out;
  }
  function cluster(rng, x, y, z, n, lmin, lmax, spread = 0.13) {
    const out = [];
    for (let i = 0; i < n; i++) out.push(clothAt(rng, x + (rng() - 0.5) * spread * 2, y + (rng() - 0.5) * 0.05, z + (rng() - 0.5) * 0.12, lmin + rng() * (lmax - lmin), 0.13 + rng() * 0.05, (rng() - 0.5) * 1.1));
    return out;
  }
  const ZF = 5.8, ZB = 2.3, NST = 10, TD = 0.35, RS = 0.09;
  const slopeY = (z) => (ZF - z) * (RS * NST) / (ZF - ZB);   // surface height beside the steps
  const FX = 2.1;  // half width of the flight

  /* ====================== MAIN ====================== */
  function GhodaMain() {
    const M = useM();
    const [dusk, ref] = useDusk();
    const yellow = M.plain('#dcc25a', { roughness: 0.95 });
    const pillarM = M.plain('#ece0a8', { roughness: 0.9 });
    const maroon = M.plain('#8e2a2a', { roughness: 0.9 });
    const slab = M.plain('#a9a59d', { roughness: 0.95 });
    const earth = M.plain('#b9a272', { roughness: 1 });
    const earth2 = M.plain('#bba878', { roughness: 1 });
    const cheekR = M.plain('#bda898', { roughness: 0.95 });
    const cheekL = M.plain('#b0a79b', { roughness: 0.95 });
    const bamboo = M.plain('#8a6a3c', { roughness: 0.9 });
    const bambooDk = M.plain('#5f4a2c', { roughness: 0.9 });
    const dark = M.plain('#1e1410', { roughness: 1 });
    const clothMat = M.plain('#ffffff', { roughness: 1 });
    const white = M.plain('#f1eee6', { roughness: 0.9 });
    const redP = M.plain('#c62f25', { roughness: 0.9 });

    const meshTex = useMemo(() => {
      try {
        const c = document.createElement('canvas'); c.width = c.height = 128;
        const g = c.getContext('2d'); g.strokeStyle = '#7d8084'; g.lineWidth = 3;
        for (let k = -4; k <= 8; k++) { g.beginPath(); g.moveTo(k * 16, 0); g.lineTo(k * 16 + 128, 128); g.stroke(); g.beginPath(); g.moveTo(k * 16, 128); g.lineTo(k * 16 + 128, 0); g.stroke(); }
        const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
      } catch (e) { return null; }
    }, []);

    const rightTop = (z) => slopeY(z) + 0.9;
    const leftTop = (z) => slopeY(z) + 0.4;
    const wallPtsR = useMemo(() => [[ZF, 0], [ZF, rightTop(ZF)], [ZB, rightTop(ZB)], [ZB, 0]], []);
    const wallPtsL = useMemo(() => [[ZF, 0], [ZF, leftTop(ZF)], [ZB, leftTop(ZB)], [ZB, 0]], []);
    const wedgePts = useMemo(() => [[ZF + 0.6, 0], [ZB, PLAT], [ZB, 0]], []);
    const FXR = FX + 0.15;
    const meshGeo = useMemo(() => {
      const s = new THREE.Shape();
      s.moveTo(ZF, rightTop(ZF)); s.lineTo(ZB, rightTop(ZB)); s.lineTo(ZB, rightTop(ZB) + 0.62); s.lineTo(ZF, rightTop(ZF) + 0.62); s.closePath();
      const g = new THREE.ShapeGeometry(s); g.rotateY(-Math.PI / 2); g.translate(FXR, 0, 0); return g;
    }, []);

    // cloth
    const cloth = useMemo(() => {
      const rng = mkRng(7); const it = [];
      // verandah beam (bottom edge y = 2.3): heavy bunch over the door bay and smaller ones either side
      it.push(...cluster(rng, -0.55, 2.3, 1.86, 14, 0.45, 1.0, 0.2));
      [-1.6, 0.8, 1.6].forEach((x) => it.push(...cluster(rng, x, 2.3, 1.86, 5, 0.25, 0.6, 0.12)));
      it.push(...line(rng, [-1.8, 2.3, 1.88], [1.8, 2.3, 1.88], 8, 0.12, 0.3, false));
      // left platform-front rail (poles along z=2.2)
      it.push(...line(rng, [-3.9, 1.62, 2.2], [-FX - 0.5, 1.62, 2.2], 26, 0.3, 0.8, false));
      it.push(...line(rng, [-3.9, 1.32, 2.2], [-FX - 0.5, 1.32, 2.2], 12, 0.25, 0.5, false));
      // left slanted fence along the steps
      it.push(...line(rng, [-FX - 0.5, slopeY(5.6) + 1.05, 5.6], [-FX - 0.5, slopeY(2.4) + 1.05, 2.4], 34, 0.3, 0.8, true));
      it.push(...line(rng, [-FX - 0.5, slopeY(5.6) + 0.7, 5.6], [-FX - 0.5, slopeY(2.4) + 0.7, 2.4], 14, 0.25, 0.5, true));
      // right mesh fence top and draped
      it.push(...line(rng, [FXR, rightTop(5.7) + 0.62, 5.7], [FXR, rightTop(2.35) + 0.62, 2.35], 30, 0.3, 0.8, true));
      it.push(...line(rng, [FXR, rightTop(5.7) + 0.3, 5.7], [FXR, rightTop(2.35) + 0.3, 2.35], 14, 0.3, 0.6, true));
      // right platform rail
      it.push(...line(rng, [FX + 0.55, 1.62, 2.2], [3.8, 1.62, 2.2], 18, 0.3, 0.7, false));
      it.push(...line(rng, [3.8, 1.62, 2.2], [3.8, 1.62, -0.2], 10, 0.3, 0.6, true));
      // left return rail
      it.push(...line(rng, [-3.9, 1.62, 2.2], [-3.9, 1.62, 0.0], 12, 0.3, 0.6, true));
      it.push(...line(rng, [-3.9, 1.5, 0.0], [-4.0, 1.5, -2.0], 8, 0.3, 0.6, true));
      return it;
    }, []);

    // leaf litter on the platform and bare dirt/litter on the ground around it
    const litter = useMemo(() => {
      const rng = mkRng(3); const it = []; const cols = ['#7a5a34', '#8a6a3c', '#6a4a2a', '#9a7a48'];
      for (let i = 0; i < 70; i++) it.push([(rng() - 0.5) * 7.4, PLAT + 0.006, -1.3 + rng() * 3.5, 0.1 + rng() * 0.1, 0.008, 0.06 + rng() * 0.06, rng() * 3, cols[(rng() * 4) | 0]]);
      for (let i = 0; i < 90; i++) {
        const x = (rng() - 0.5) * 11, z = -2.6 + rng() * 9;
        if (x > -FX - 0.3 && x < FX + 0.3 && z > 2) continue;
        if (Math.abs(x) < 4.2 && z < 2.6 && z > -2.2) continue;
        it.push([x, 0.012, z, 0.15 + rng() * 0.2, 0.008, 0.1 + rng() * 0.15, rng() * 3, cols[(rng() * 4) | 0]]);
      }
      return it;
    }, []);

    const stepCols = ['#b8ada0', '#b3a89b', '#bcb1a4', '#b6ab9e'];
    const steps = [];
    for (let i = 1; i <= NST; i++) {
      const z0 = ZB + TD * (NST - i);
      steps.push(<Box key={i} s={[FX * 2, RS * i, TD]} p={[0, RS * i / 2, z0 + TD / 2]} m={M.plain(stepCols[i % 4], { roughness: 0.95 })} />);
    }
    const poles = [];
    [5.4, 4.1, 2.8].forEach((z, i) => {
      const y = slopeY(z);
      poles.push(<Bar key={'lp' + i} a={[-FX - 0.5, y - 0.1, z]} b={[-FX - 0.65, y + 1.15, z]} r={0.045} m={bamboo} />);
    });
    [-3.9, -3.1, -FX - 0.65].forEach((x, i) => poles.push(<Bar key={'pf' + i} a={[x, PLAT, 2.2]} b={[x, PLAT + 0.85, 2.2]} r={0.045} m={bamboo} />));
    [FX + 0.6, 3.1, 3.8].forEach((x, i) => poles.push(<Bar key={'rf' + i} a={[x, PLAT, 2.2]} b={[x, PLAT + 0.85, 2.2]} r={0.045} m={bamboo} />));
    [[-3.9, 1.0], [-3.9, -0.2]].forEach(([x, z], i) => poles.push(<Bar key={'lr' + i} a={[x, PLAT, z]} b={[x, PLAT + 0.85, z]} r={0.045} m={bamboo} />));
    [[3.8, 1.0]].forEach(([x, z], i) => poles.push(<Bar key={'rr' + i} a={[x, PLAT, z]} b={[x, PLAT + 0.85, z]} r={0.045} m={bamboo} />));
    const meshPosts = [5.7, 4.6, 3.5, 2.4].map((z, i) => <Bar key={'mp' + i} a={[FXR, rightTop(z), z]} b={[FXR, rightTop(z) + 0.66, z]} r={0.03} m={bambooDk} />);

    const pennants = [[-3.4, 0.6], [3.4, 0.3], [-0.9, -1.1], [-FX - 0.9, 3.9]].map(([x, z], i) => {
      const y0 = z > 2 ? slopeY(z) : PLAT;
      return (
        <group key={'pn' + i} position={[x, y0, z]}>
          <Cyl rt={0.025} rb={0.035} h={1.5} p={[0, 0.75, 0]} m={bamboo} seg={6} />
          <Box s={[0.34, 0.2, 0.012]} p={[0.18, 1.38, 0]} m={redP} cast={false} />
          <Box s={[0.16, 0.12, 0.012]} p={[0.42, 1.4, 0]} m={white} cast={false} />
        </group>
      );
    });

    return (
      <group ref={ref}>
        <Frame s={[10.0, 4.4, 8.0]} p={[0, 2.2, 1.8]} />
        {/* single earth platform on a natural bank, tan banks sloping to the ground */}
        <Box s={[8.2, PLAT, 4.3]} p={[0, PLAT / 2 + 0.02, 0.35]} m={earth} />
        <Box s={[8.25, 0.05, 4.35]} p={[0, PLAT - 0.01, 0.35]} m={earth2} />
        <Prism pts={wedgePts} x0={-4.1} x1={-FX - 0.3} m={earth} />
        <Prism pts={wedgePts} x0={FX + 0.3} x1={3.3} m={earth} />
        <Box s={[3.2, 0.03, 4.8]} p={[-FX - 1.9, 0.015, 4.2]} m={earth2} cast={false} />
        <Box s={[2.2, 0.03, 4.4]} p={[FX + 1.5, 0.015, 4.4]} m={earth2} cast={false} />
        <Inst items={litter} m={clothMat} />
        {/* steps and cheek walls */}
        {steps}
        <Prism pts={wallPtsL} x0={-FX - 0.3} x1={-FX} m={cheekL} />
        <Prism pts={wallPtsR} x0={FX} x1={FX + 0.3} m={cheekR} />
        {meshTex && (
          <mesh geometry={meshGeo} castShadow={false}>
            <meshStandardMaterial map={meshTex} transparent alphaTest={0.2} side={THREE.DoubleSide} roughness={0.8} />
          </mesh>
        )}
        <Bar a={[FXR, rightTop(ZF) + 0.64, ZF]} b={[FXR, rightTop(ZB) + 0.64, ZB]} r={0.04} m={bambooDk} />
        {meshPosts}
        <Box s={[FX * 2, 0.04, 0.8]} p={[0, PLAT + 0.01, 2.0]} m={M.plain('#cfc9be', { roughness: 0.95 })} cast={false} />
        {/* shrine body, 1.7 high */}
        <Box s={[3.5, 1.7, 2.4]} p={[0, PLAT + 0.85, -0.5]} m={yellow} />
        <Box s={[3.56, 0.1, 2.46]} p={[0, PLAT + 0.05, -0.5]} m={M.plain('#b9b3a8', { roughness: 1 })} />
        <Box s={[3.55, 0.16, 2.45]} p={[0, PLAT + 1.62, -0.5]} m={maroon} />
        {/* thin roof slab, parapet, front fascia */}
        <Box s={[3.7, 0.1, 3.6]} p={[0, PLAT + 1.75, 0.05]} m={slab} />
        <Box s={[3.7, 0.1, 0.07]} p={[0, PLAT + 1.85, 1.81]} m={slab} cast={false} />
        <Box s={[3.7, 0.1, 0.07]} p={[0, PLAT + 1.85, -1.71]} m={slab} cast={false} />
        <Box s={[0.07, 0.1, 3.6]} p={[1.82, PLAT + 1.85, 0.05]} m={slab} cast={false} />
        <Box s={[0.07, 0.1, 3.6]} p={[-1.82, PLAT + 1.85, 0.05]} m={slab} cast={false} />
        <Box s={[3.7, 0.3, 0.1]} p={[0, PLAT + 1.55, 1.83]} m={maroon} />
        {/* roof bump, pole, pennant */}
        <Box s={[0.6, 0.4, 0.6]} p={[0.1, PLAT + 2.1, -0.3]} m={white} />
        <Box s={[0.4, 0.14, 0.4]} p={[0.1, PLAT + 2.37, -0.3]} m={white} />
        <Cyl rt={0.02} rb={0.03} h={0.9} p={[0.1, PLAT + 2.9, -0.3]} m={bambooDk} seg={5} />
        <Box s={[0.4, 0.22, 0.012]} p={[0.3, PLAT + 3.22, -0.3]} m={redP} cast={false} />
        {/* verandah: four slim pillars, three bays */}
        {[-1.6, -0.8, 0.8, 1.6].map((x, i) => (
          <group key={'pl' + i} position={[x, PLAT, 1.75]}>
            <Box s={[0.2, 1.4, 0.2]} p={[0, 0.7, 0]} m={pillarM} />
            <Box s={[0.28, 0.1, 0.28]} p={[0, 0.05, 0]} m={maroon} />
            <Box s={[0.28, 0.1, 0.28]} p={[0, 1.35, 0]} m={maroon} />
          </group>
        ))}
        {/* tall door and altar visible inside */}
        <Box s={[0.74, 1.2, 0.03]} p={[-0.55, PLAT + 0.6, 0.71]} m={maroon} />
        <Box s={[0.58, 1.12, 0.04]} p={[-0.55, PLAT + 0.56, 0.72]} m={dusk ? M.plain('#5a3418', { roughness: 1 }) : dark} />
        <Box s={[0.5, 0.2, 0.18]} p={[-0.55, PLAT + 0.28, 0.76]} m={M.plain('#e08a5e', { roughness: 0.9 })} />
        <Box s={[0.5, 0.08, 0.02]} p={[-0.55, PLAT + 0.45, 0.76]} m={M.plain('#d4502c', { roughness: 0.9 })} cast={false} />
        {dusk && <mesh position={[-0.55, PLAT + 0.6, 0.745]}><planeGeometry args={[0.5, 1.0]} /><meshBasicMaterial color="#ff9c3c" transparent opacity={0.55} toneMapped={false} /></mesh>}
        {poles}
        {pennants}
        <group position={[-3.9, PLAT, 1.55]} rotation={[0, 0.25, 0]}>
          <Box s={[0.06, 0.8, 0.06]} p={[-0.4, 0.4, 0]} m={bambooDk} />
          <Box s={[0.06, 0.8, 0.06]} p={[0.4, 0.4, 0]} m={bambooDk} />
          <Box s={[1.05, 0.55, 0.05]} p={[0, 0.7, 0]} m={M.plain('#2a2420', { roughness: 0.7 })} />
        </group>
        {/* rails */}
        <Bar a={[-3.95, PLAT + 0.8, 2.2]} b={[-FX - 0.6, PLAT + 0.8, 2.2]} r={0.035} m={bamboo} />
        <Bar a={[-3.95, PLAT + 0.5, 2.2]} b={[-FX - 0.6, PLAT + 0.5, 2.2]} r={0.03} m={bamboo} />
        <Bar a={[FX + 0.55, PLAT + 0.8, 2.2]} b={[3.85, PLAT + 0.8, 2.2]} r={0.035} m={bamboo} />
        <Bar a={[3.8, PLAT + 0.8, 2.2]} b={[3.8, PLAT + 0.8, 1.0]} r={0.03} m={bamboo} />
        <Bar a={[-3.9, PLAT + 0.8, 2.2]} b={[-3.9, PLAT + 0.8, -0.2]} r={0.03} m={bamboo} />
        <Bar a={[-FX - 0.5, slopeY(5.6) + 1.05, 5.6]} b={[-FX - 0.65, slopeY(2.4) + 1.1, 2.4]} r={0.04} m={bamboo} />
        <Bar a={[-FX - 0.5, slopeY(5.6) + 0.7, 5.6]} b={[-FX - 0.65, slopeY(2.4) + 0.75, 2.4]} r={0.03} m={bamboo} />
        {/* cloth offerings */}
        <Inst items={cloth} m={clothMat} />
        {/* dusk lamps */}
        {[-1.0, -0.4, 0.2, 0.9, 1.5].map((x, i) => (
          <group key={'dy' + i} position={[x, PLAT + 0.04, 2.05]}>
            <Cyl rt={0.05} rb={0.035} h={0.03} p={[0, 0.015, 0]} m={M.plain('#8b4a2a')} seg={8} />
            <mesh position={[0, 0.07, 0]}><coneGeometry args={[0.02, 0.07, 6]} /><meshBasicMaterial color="#ffcf7a" toneMapped={false} /></mesh>
          </group>
        ))}
        {dusk && <pointLight position={[-0.5, PLAT + 0.9, 1.6]} intensity={5} distance={7} color="#ffa94a" />}
        {dusk && <pointLight position={[0.2, PLAT + 0.3, 2.3]} intensity={2.5} distance={5} color="#ffb35a" />}
        {dusk && <mesh position={[-0.55, PLAT + 1.72, 1.9]}><sphereGeometry args={[0.06, 8, 6]} /><meshBasicMaterial color="#ffd48a" toneMapped={false} /></mesh>}
      </group>
    );
  }


  /* ====================== ENV ====================== */
  function SalTree({ p, s = 1, tint = '#4f6232', lean = 0 }) {
    const M = useM();
    const leaf = M.plain(tint, { roughness: 1 });
    const bark = M.plain('#5d4a3a', { roughness: 1 });
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.16} rb={0.3} h={4.4} p={[0, 2.2, 0]} m={bark} seg={9} />
        <Bar a={[0, 3.8, 0]} b={[1.6 + lean, 5.4, 0.4]} r={0.1} m={bark} />
        <Bar a={[0, 4.1, 0]} b={[-1.7, 5.6, -0.3]} r={0.1} m={bark} />
        <Ball rad={1.6} p={[0, 5.9, 0]} sc={[1.5, 0.7, 1.4]} m={leaf} />
        <Ball rad={1.3} p={[2.3 + lean, 5.3, 0.5]} sc={[1.3, 0.7, 1.2]} m={leaf} />
        <Ball rad={1.3} p={[-2.4, 5.5, -0.4]} sc={[1.3, 0.7, 1.2]} m={leaf} />
        <Ball rad={1.0} p={[0.3, 7.1, -0.4]} sc={[1.3, 0.65, 1.2]} m={leaf} />
      </group>
    );
  }
  function BigSal({ p, s = 1, tint = '#3f5230', tint2 = '#4a5d2f' }) {
    const M = useM();
    const leaf = M.plain(tint, { roughness: 1 });
    const leaf2 = M.plain(tint2, { roughness: 1 });
    const bark = M.plain('#6b5d50', { roughness: 1 });
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.34} rb={0.5} h={5.2} p={[0, 2.6, 0]} m={bark} seg={9} />
        <Bar a={[0, 4.4, 0]} b={[1.8, 6.2, 0.4]} r={0.2} m={bark} />
        <Bar a={[0, 4.6, 0]} b={[-1.8, 6.4, -0.3]} r={0.2} m={bark} />
        <Ball rad={2.3} p={[0, 6.9, 0]} sc={[1.5, 0.95, 1.45]} m={leaf} />
        <Ball rad={1.9} p={[2.3, 6.3, 0.5]} sc={[1.3, 0.9, 1.3]} m={leaf2} />
        <Ball rad={1.9} p={[-2.4, 6.5, -0.4]} sc={[1.3, 0.9, 1.3]} m={leaf} />
        <Ball rad={1.6} p={[0.4, 8.3, -0.3]} sc={[1.3, 0.85, 1.2]} m={leaf2} />
        <Ball rad={1.5} p={[-0.8, 6.0, 2.0]} sc={[1.3, 0.8, 1.2]} m={leaf} />
      </group>
    );
  }
  function BareTree({ p }) {
    const M = useM();
    const bark = M.plain('#6a5848', { roughness: 1 });
    return (
      <group position={p}>
        <Cyl rt={0.07} rb={0.14} h={4.4} p={[0, 2.2, 0]} m={bark} seg={6} />
        {[[0, 3.4, 0, 1.2, 5.6, 0.2], [0, 3.8, 0, -1.1, 6, -0.3], [0, 4.2, 0, 0.3, 6.6, 0.8], [0, 2.8, 0, -0.9, 4.4, 0.1], [0.5, 4.8, 0, 1.4, 6.6, -0.3]].map(([x0, y0, z0, x1, y1, z1], i) => (
          <Bar key={i} a={[x0, y0, z0]} b={[x1, y1, z1]} r={0.04} m={bark} seg={5} />
        ))}
      </group>
    );
  }

  function GhodaEnv() {
    const M = useM();
    const [dusk, ref] = useDusk();

    const terrain = useMemo(() => {
      const g = new THREE.PlaneGeometry(300, 300, 190, 190); g.rotateX(-Math.PI / 2);
      const pos = g.attributes.position; const col = new Float32Array(pos.count * 3);
      const rng = mkRng(11); const c = new THREE.Color(); const cT = new THREE.Color('#a8935f'), cL = new THREE.Color('#9a8f5c'), cG = new THREE.Color('#867f4e'), cD = new THREE.Color('#6a7040'), cM = new THREE.Color('#6a7048'), cW = new THREE.Color('#4a5650'), cLit = new THREE.Color('#7a6444');
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), z = pos.getZ(i) + 10; // plane is centred at z=10
        const h = terrainH(x, z); pos.setY(i, h);
        const d = Math.hypot(x, z - 1);
        const n = rng();
        c.copy(cG).lerp(cD, n * 0.7);
        c.lerp(cL, 1 - smooth((d - 8) / 16));
        c.lerp(cT, 1 - smooth((d - 6) / 10));
        c.lerp(cLit, (1 - smooth((d - 6) / 14)) * 0.55 * rng());
        c.lerp(cM, smooth((0.15 - h) / 0.8) * 0.9);
        c.lerp(cW, smooth((-0.9 - h) / 0.5));
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals(); return g;
    }, []);

    const forest = useMemo(() => {
      const rng = mkRng(21); const trunks = [], crowns = [], reeds = [];
      const greens = ['#3f5230', '#4a5d2f', '#3a4a28', '#52663a', '#44562e', '#5b6d36', '#36482a'];
      let n = 0, guard = 0;
      while (n < 240 && guard++ < 20000) {
        const x = -150 + rng() * 300, z = -130 + rng() * 270;
        const e = lakeE(x, z);
        const shoreBand = n % 3 === 0;
        if (e < 1.22) continue;
        if (shoreBand && e > 1.6) continue;
        if (shoreBand && z > -14 && z < 40 && x > -30 && x < 20) continue;
        const d = Math.hypot(x, z - 2);
        if (d < 10.5) continue;
        if (d < 44 && !shoreBand) continue;
        if (x > -2 && z > -3 && d < 34) continue;           // keep the default camera side clear
        if (x > -9 && z > -3 && z < 14 && x < 8) continue;
        if (Math.abs(x) > 140 || z > 135 || z < -125) continue;
        const h = terrainH(x, z);
        const th = 4 + rng() * 3, cw = (shoreBand ? 3 : 4.5) + rng() * 3.5, ch = 2.4 + rng() * 1.8;
        const r = 0.15 + rng() * 0.12;
        trunks.push([x, h + th / 2, z, r * 2, th, r * 2, 0, '#5c4a3a']);
        crowns.push([x + (rng() - 0.5) * 1.2, h + th + ch * 0.25, z + (rng() - 0.5) * 1.2, cw, ch, cw * (0.85 + rng() * 0.3), rng() * 3, greens[(rng() * greens.length) | 0]]);
        if (rng() < 0.6) crowns.push([x + (rng() - 0.5) * 3, h + th * 0.85, z + (rng() - 0.5) * 3, cw * 0.7, ch * 0.8, cw * 0.7, rng() * 3, greens[(rng() * greens.length) | 0]]);
        n++;
      }
      // reeds along the shore
      guard = 0; let k = 0;
      while (k < 220 && guard++ < 20000) {
        const x = -120 + rng() * 240, z = -100 + rng() * 220;
        const e = lakeE(x, z);
        if (e < 0.98 || e > 1.14) continue;
        const h = 0.7 + rng() * 0.6;
        reeds.push([x, WATER_Y + h / 2 - 0.05, z, 0.14, h, 0.14, 0, rng() < 0.5 ? '#8c8a52' : '#7a8248', (rng() - 0.5) * 0.3]);
        k++;
      }
      return { trunks, crowns, reeds };
    }, []);

    const lotus = useMemo(() => {
      const rng = mkRng(33); const pads = [], flowers = [];
      const centres = [[-14, 24, 8], [4, 27, 9], [-26, 20, 8], [18, 31, 9], [-4, 38, 9], [-34, 30, 9], [30, 24, 6], [-26, 2, 9], [-30, -16, 10], [-22, 16, 8], [10, 48, 12]];
      const greens = ['#5f8a3c', '#55803a', '#6a9444', '#4f7a36', '#5c8640'];
      for (let i = 0; i < 900; i++) {
        const [cx, cz, cr] = centres[i % centres.length];
        const a = rng() * 6.283, r = Math.sqrt(rng()) * cr * 1.15;
        const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r * 0.8;
        if (lakeE(x, z) > 0.96) continue;
        const s = 1.2 + rng() * 1.2;
        pads.push([x, WATER_Y + 0.03, z, s, 0.03, s, 0, greens[(rng() * 5) | 0]]);
        if (rng() < 0.07) flowers.push([x + 0.2, WATER_Y + 0.15, z, 0.35, 0.3, 0.35, 0, rng() < 0.7 ? '#e48aa8' : '#f4d0dc']);
      }
      return { pads, flowers };
    }, []);

    const ridge = useMemo(() => {
      const rng = mkRng(5); const it = [];
      for (let i = 0; i < 46; i++) {
        const a = (i / 46) * 6.283; const R = 168 + rng() * 6;
        it.push([Math.sin(a) * R, 0, Math.cos(a) * R + 10, 55 + rng() * 25, 5 + rng() * 5, 24, a, '#b8c4cc']);
      }
      return it;
    }, []);

    const islet = useMemo(() => {
      const rng = mkRng(8); const t = [];
      for (let i = 0; i < 18; i++) { const a = rng() * 6.283, r = rng() * 4.5; t.push([-21 + Math.cos(a) * r, WATER_Y + 0.9, 2 + Math.sin(a) * r * 0.7, 2.4 + rng() * 1.8, 1.8 + rng() * 1.4, 2.4 + rng() * 1.8, rng() * 3, ['#3f5230', '#44562e', '#36482a', '#4a5d2f'][(rng() * 4) | 0]]); }
      for (let i = 0; i < 16; i++) { const a = rng() * 6.283, r = rng() * 4; t.push([-6 + Math.cos(a) * r, WATER_Y + 0.7, 34 + Math.sin(a) * r * 0.8, 2.2 + rng() * 1.6, 1.6 + rng() * 1.2, 2.2 + rng() * 1.6, rng() * 3, ['#44562e', '#53683a', '#3f5230', '#5f7040'][(rng() * 4) | 0]]); }
      return t;
    }, []);

    const water = M.plain(dusk ? '#4a5a70' : '#5b7480', { roughness: 0.12, metalness: 0.35 });
    const leafM = M.plain('#ffffff', { roughness: 1 });
    const egrets = [[-10.5, 6.2], [-12.2, 1.0], [-9.6, 11.5], [14, 16.2]].map(([x, z], i) => {
      const y = WATER_Y + 0.05;
      return (
        <group key={i} position={[x, y, z]} rotation={[0, i * 1.7, 0]}>
          <Cyl rt={0.012} rb={0.012} h={0.4} p={[0, 0.2, 0]} m={M.plain('#2a2a22')} seg={4} />
          <Ball rad={0.13} p={[0, 0.5, 0]} sc={[1, 0.8, 1.7]} m={M.plain('#f4f4f0')} />
          <Cyl rt={0.02} rb={0.03} h={0.28} p={[0, 0.7, -0.14]} r={[0.5, 0, 0]} m={M.plain('#f4f4f0')} seg={5} />
          <Ball rad={0.04} p={[0, 0.82, -0.22]} m={M.plain('#f4f4f0')} />
        </group>
      );
    });

    return (
      <group ref={ref}>
        <mesh geometry={terrain} position={[0, 0, 10]} receiveShadow>
          <meshStandardMaterial vertexColors roughness={1} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, WATER_Y, 10]} receiveShadow>
          <planeGeometry args={[300, 300]} />
          <meshStandardMaterial color={dusk ? '#4a5a70' : '#5b7480'} metalness={0.35} roughness={0.12} />
        </mesh>
        {dusk && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, WATER_Y + 0.35, 10]}>
            <planeGeometry args={[300, 300]} />
            <meshBasicMaterial color="#cfc6e0" transparent opacity={0.3} depthWrite={false} toneMapped={false} />
          </mesh>
        )}
        <Inst items={lotus.pads} m={leafM} kind="disc" />
        <Inst items={lotus.flowers} m={leafM} kind="sph" />
        {/* tree-covered islet */}
        <Ball rad={5.5} p={[-21, WATER_Y, 2]} sc={[1.3, 0.2, 0.9]} m={M.plain('#5f6040', { roughness: 1 })} />
        <Ball rad={5} p={[-6, WATER_Y, 34]} sc={[1.2, 0.2, 0.95]} m={M.plain('#6b6a44', { roughness: 1 })} />
        <Inst items={islet} m={leafM} kind="sph" />
        {/* forest and reeds */}
        <Inst items={forest.trunks} m={leafM} kind="cyl" />
        <Inst items={forest.crowns} m={leafM} kind="sph" />
        <Inst items={forest.reeds} m={leafM} kind="cone" />
        {/* far low ridge, only a faint blue-grey line */}
        <Inst items={ridge} m={leafM} kind="sph" />
        {/* big sal trees overhanging the shrine from behind and the left; thin leafless tree at left */}
        <SalTree p={[-4.5, 0, -10]} s={1.05} tint="#4a5d2f" />
        <SalTree p={[5, 0, -10.5]} s={1.0} tint="#56693a" lean={0.3} />
        <SalTree p={[-10, 0, -8.5]} s={1.1} tint="#4f6232" lean={-0.4} />
        <SalTree p={[1.5, 0, -14]} s={1.15} tint="#44562e" />
        <SalTree p={[11, 0, -9.5]} s={0.95} tint="#5b6d36" />
        {[[-7, -5.5], [-3, -17], [-2, -7], [2.5, -6.5], [8, -6], [4, -15.5], [-0.5, -12], [7, -13.5], [-8, -12.5], [13, -8]].map(([x, z], i) => (
          <BigSal key={'bs' + i} p={[x, 0, z]} s={0.95 + (i % 3) * 0.12} tint={['#3f5230', '#36482a', '#44562e'][i % 3]} tint2={['#4a5d2f', '#3a4a28', '#52663a'][i % 3]} />
        ))}
        <BareTree p={[-6.4, 0, -2.2]} />
        {egrets}
      </group>
    );
  }

  return { 'ghodaghodi-temple': { Main: GhodaMain, Env: GhodaEnv } };
}
