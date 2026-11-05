/* Maya Devi Temple, Lumbini: the plain white protective shelter (2003) over the Buddha's birthplace.
   Long low flat-roofed white box, squat red-lidded parapet piers with one thin railing, a band of small dark windows,
   a tall narrow raised block with a gilded chhatra pinnacle, ramped door at the right; the slender Ashoka Pillar in a
   yellow-red fence in front; massive stepped brick monastery foundations; stepped Puskarini pond; big bodhi with flags. */
export default function make(K) {
  const { useM, Box, Cyl, Ball, THREE, useMemo, useRef, useEffect, Frame, PrayerFlags } = K;

  const W = 14; const D = 7; const PL = 0.3; const WH = 2.9; const ROOF = PL + WH; // roof deck height 3.2
  const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  /** One draw call for many identical boxes / balls. items: [{p:[x,y,z], s:[sx,sy,sz]}] */
  function Inst({ items, mat, kind = 'box', cast = true }) {
    const ref = useRef();
    useEffect(() => {
      const o = new THREE.Object3D();
      items.forEach((it, i) => {
        o.position.set(it.p[0], it.p[1], it.p[2]);
        o.scale.set(it.s[0], it.s[1], it.s[2]);
        o.updateMatrix();
        ref.current.setMatrixAt(i, o.matrix);
      });
      ref.current.instanceMatrix.needsUpdate = true;
    }, [items]);
    return (
      <instancedMesh ref={ref} args={[null, null, items.length]} material={mat} castShadow={cast} receiveShadow frustumCulled={false}>
        {kind === 'ball' ? <sphereGeometry args={[1, 12, 9]} /> : <boxGeometry args={[1, 1, 1]} />}
      </instancedMesh>
    );
  }

  /** parapet post positions around a rectangle of w x d at height y */
  function postRing(w, d, y, step, h, sx) {
    const out = [];
    const nx = Math.round(w / step);
    for (let i = 0; i <= nx; i += 1) {
      const x = -w / 2 + (w * i) / nx;
      out.push({ p: [x, y + h / 2, d / 2], s: [sx, h, sx] }, { p: [x, y + h / 2, -d / 2], s: [sx, h, sx] });
    }
    const nz = Math.round(d / step);
    for (let i = 1; i < nz; i += 1) {
      const z = -d / 2 + (d * i) / nz;
      out.push({ p: [w / 2, y + h / 2, z], s: [sx, h, sx] }, { p: [-w / 2, y + h / 2, z], s: [sx, h, sx] });
    }
    return out;
  }

  /** a group of small dark panes in a white frame, facing +z (rotate the parent for other faces) */
  function WindowGroup({ p, w = 0.85, h = 0.42, n = 2, glass, frame }) {
    return (
      <group position={p}>
        <Box s={[w + 0.1, h + 0.1, 0.06]} p={[0, 0, -0.02]} m={frame} cast={false} />
        <Box s={[w, h, 0.05]} p={[0, 0, 0.01]} m={glass} cast={false} />
        {Array.from({ length: n - 1 }, (_, i) => <Box key={i} s={[0.035, h, 0.06]} p={[-w / 2 + (w * (i + 1)) / n, 0, 0.02]} m={frame} cast={false} />)}
      </group>
    );
  }

  /** gold chhatra pinnacle on a small white base, about 2 m tall */
  function Pinnacle({ y }) {
    const M = useM();
    const white = M.plain('#f4f1ea', { roughness: 0.85 });
    return (
      <group position={[0, y, 0]}>
        <Box s={[0.9, 0.12, 0.9]} p={[0, 0.06, 0]} m={white} />
        <Box s={[0.5, 0.3, 0.5]} p={[0, 0.27, 0]} m={white} />
        <Cyl rt={0.26} rb={0.3} h={0.16} p={[0, 0.5, 0]} m={M.gold} seg={16} />
        <mesh position={[0, 0.58, 0]} material={M.gold} castShadow><sphereGeometry args={[0.23, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
        <Cyl rt={0.07} rb={0.09} h={0.18} p={[0, 0.8, 0]} m={M.gold} seg={10} />
        {[0, 1, 2, 3].map((i) => <Cyl key={i} rt={0.17 - i * 0.035} rb={0.19 - i * 0.035} h={0.07} p={[0, 0.94 + i * 0.1, 0]} m={M.gold} seg={12} />)}
        <mesh position={[0, 1.55, 0]} material={M.gold} castShadow><coneGeometry args={[0.035, 0.4, 8]} /></mesh>
        <Ball rad={0.045} p={[0, 1.38, 0]} m={M.gold} />
      </group>
    );
  }

  function FlagPole({ p, col }) {
    const M = useM();
    return (
      <group position={p}>
        <Cyl rt={0.022} h={1.5} p={[0, 0.75, 0]} m={M.plain('#d9d6cf')} seg={6} />
        <mesh position={[0.2, 1.3, 0]} material={M.plain(col, { side: THREE.DoubleSide, roughness: 1 })}><planeGeometry args={[0.4, 0.26]} /></mesh>
        <Ball rad={0.04} p={[0, 1.52, 0]} m={M.gold} />
      </group>
    );
  }

  function AshokaStump() {
    const M = useM();
    const sand = M.plain('#cdb98f', { roughness: 0.95 });
    const red = M.plain('#b3261e');
    const yel = M.plain('#e3b02a');
    const bars = [];
    const hw = 0.72;
    for (let i = -4; i <= 4; i += 1) {
      bars.push([i * 0.18, hw], [i * 0.18, -hw], [hw, i * 0.18], [-hw, i * 0.18]);
    }
    return (
      <group>
        <Box s={[1.5, 0.12, 1.5]} p={[0, 0.06, 0]} m={M.mat('brick', 1, 1, { color: '#e0a690' })} />
        <Box s={[1.2, 0.18, 1.2]} p={[0, 0.2, 0]} m={M.plain('#c9c0b0', { roughness: 0.95 })} />
        <Cyl rt={0.13} rb={0.17} h={2.9} p={[0, 1.75, 0]} m={sand} seg={18} />
        <Cyl rt={0.17} rb={0.17} h={0.1} p={[0, 3.25, 0]} m={sand} seg={18} />
        <Box s={[0.34, 0.06, 0.34]} p={[0, 3.33, 0]} m={sand} />
        {/* fence */}
        {bars.map(([x, z], i) => <Box key={i} s={[0.04, 0.6, 0.04]} p={[x, 0.45, z]} m={yel} cast={false} />)}
        {[0.3, 0.68].map((y) => (
          <group key={y}>
            <Box s={[1.5, 0.05, 0.05]} p={[0, y, hw]} m={red} cast={false} />
            <Box s={[1.5, 0.05, 0.05]} p={[0, y, -hw]} m={red} cast={false} />
            <Box s={[0.05, 0.05, 1.5]} p={[hw, y, 0]} m={red} cast={false} />
            <Box s={[0.05, 0.05, 1.5]} p={[-hw, y, 0]} m={red} cast={false} />
          </group>
        ))}
        {[[hw, hw], [-hw, hw], [hw, -hw], [-hw, -hw]].map(([x, z], i) => <Box key={i} s={[0.09, 0.8, 0.09]} p={[x, 0.52, z]} m={red} cast={false} />)}
        {/* silk offerings draped on the fence */}
        {[[-0.4, '#e8a317'], [0, '#c9302c'], [0.4, '#f2c230']].map(([x, c]) => <Box key={x} s={[0.3, 0.3, 0.02]} p={[x, 0.52, hw + 0.04]} m={M.plain(c)} cast={false} />)}
      </group>
    );
  }

  function MayaMain() {
    const M = useM();
    const white = M.plain('#f6f3ec', { roughness: 0.85 });
    const rail = M.plain('#ece7dc', { roughness: 0.8 });
    const dkRail = M.plain('#3a2e2a', { roughness: 0.6, metalness: 0.3 });
    const redBrownRail = M.plain('#6b2f22', { roughness: 0.6 });
    const cap = M.plain('#b5503c', { roughness: 0.8 });
    const glass = M.plain('#1a232c', { roughness: 0.25, metalness: 0.3, emissive: '#ff9a3a', emissiveIntensity: 0.07 });
    const door = M.plain('#1b1410', { roughness: 0.7, emissive: '#ff9a3a', emissiveIntensity: 0.1 });
    const brick = M.mat('brick', 4, 1, { color: '#f0c2ae' });

    const UW = 3.4; const UD = 2.6; const UH = 1.8; const UTOP = ROOF + UH;
    const posts = useMemo(() => postRing(W - 0.3, D - 0.3, ROOF, 1.0, 0.9, 0.26), []);
    const caps = useMemo(() => posts.filter((q) => q.p[2] > -D / 2 + 0.3).map((q) => ({ p: [q.p[0], ROOF + 0.93, q.p[2]], s: [0.36, 0.08, 0.36] })), [posts]);
    const capsRear = useMemo(() => posts.filter((q) => q.p[2] <= -D / 2 + 0.3).map((q) => ({ p: [q.p[0], ROOF + 0.93, q.p[2]], s: [0.36, 0.08, 0.36] })), [posts]);

    const winX = [-5.2, -2.6, 0, 2.6, 5.2];
    const sideZ = [-1.0, 1.0];
    const wy = ROOF - 0.78;
    const hw = W / 2; const hd = D / 2;
    return (
      <group>
        {/* red-brick plinth */}
        <Box s={[W + 0.6, PL, D + 0.6]} p={[0, PL / 2, 0]} m={brick} />
        {/* main whitewashed box */}
        <Box s={[W, WH, D]} p={[0, PL + WH / 2, 0]} m={white} />
        <Box s={[W + 0.16, 0.1, D + 0.16]} p={[0, ROOF - 0.03, 0]} m={white} />
        {/* windows: 12 small ones on the front, 2 on each side, none at the rear */}
        {winX.map((x) => <WindowGroup key={`f${x}`} p={[x, wy, hd]} w={1.9} h={0.55} n={4} glass={glass} frame={rail} />)}
        {sideZ.map((z) => <group key={`r${z}`} rotation={[0, Math.PI / 2, 0]}><WindowGroup p={[z, wy, hw]} w={0.9} h={0.55} n={2} glass={glass} frame={rail} /></group>)}
        {sideZ.map((z) => <group key={`l${z}`} rotation={[0, -Math.PI / 2, 0]}><WindowGroup p={[z, wy, hw]} w={0.9} h={0.55} n={2} glass={glass} frame={rail} /></group>)}
        {/* parapet: squat white piers, dusty red lids on the front and sides only, one thin dark railing */}
        <Inst items={posts} mat={white} />
        <Inst items={caps} mat={cap} />
        <Inst items={capsRear} mat={white} />
        {[[-hw + 0.15, hd - 0.15], [hw - 0.15, hd - 0.15], [-hw + 0.15, -hd + 0.15], [hw - 0.15, -hd + 0.15]].map(([x, z], i) => (
          <group key={i}>
            <Box s={[0.32, 0.9, 0.32]} p={[x, ROOF + 0.45, z]} m={white} />
            <Box s={[0.4, 0.08, 0.4]} p={[x, ROOF + 0.94, z]} m={cap} />
          </group>
        ))}
        <Box s={[W - 0.3, 0.06, 0.05]} p={[0, ROOF + 0.6, hd - 0.15]} m={rail} cast={false} />
        <Box s={[W - 0.3, 0.06, 0.05]} p={[0, ROOF + 0.6, -hd + 0.15]} m={rail} cast={false} />
        <Box s={[0.04, 0.04, D - 0.3]} p={[hw - 0.15, ROOF + 0.6, 0]} m={rail} cast={false} />
        <Box s={[0.04, 0.04, D - 0.3]} p={[-hw + 0.15, ROOF + 0.6, 0]} m={rail} cast={false} />
        {/* tall narrow upper block: plain cube with a thin cornice and slab cap, one window group per face */}
        <Box s={[UW, UH, UD]} p={[0, ROOF + UH / 2, 0]} m={white} />
        <Box s={[UW + 0.18, 0.1, UD + 0.18]} p={[0, UTOP - 0.05, 0]} m={white} />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], i) => (
          <group key={i}>
            <Box s={[0.26, 0.4, 0.26]} p={[a * (UW / 2 - 0.05), UTOP + 0.2, b * (UD / 2 - 0.05)]} m={white} />
            <Box s={[0.34, 0.07, 0.34]} p={[a * (UW / 2 - 0.05), UTOP + 0.43, b * (UD / 2 - 0.05)]} m={cap} />
          </group>
        ))}
        <WindowGroup p={[0, ROOF + 1.0, UD / 2]} w={1.6} h={0.55} n={2} glass={glass} frame={rail} />
        <group rotation={[0, Math.PI, 0]}><WindowGroup p={[0, ROOF + 0.95, UD / 2]} w={0.7} h={0.55} n={2} glass={glass} frame={rail} /></group>
        {[1, -1].map((k) => <group key={k} rotation={[0, (Math.PI / 2) * k, 0]}><WindowGroup p={[0, ROOF + 0.95, UW / 2]} w={0.7} h={0.55} n={2} glass={glass} frame={rail} /></group>)}
        <Pinnacle y={UTOP + 0.05} />
        {/* corner flagpoles */}
        <FlagPole p={[-hw + 0.3, ROOF, hd - 0.3]} col="#e8671b" />
        <FlagPole p={[hw - 0.3, ROOF, hd - 0.3]} col="#d62f1f" />
        <FlagPole p={[-hw + 0.3, ROOF, -hd + 0.3]} col="#e8671b" />
        <FlagPole p={[hw - 0.3, ROOF, -hd + 0.3]} col="#d62f1f" />
        {/* dark entrance towards the right end with a railed ramp / stair */}
        <Box s={[1.0, 1.6, 0.06]} p={[4.0, PL + 0.8, hd + 0.01]} m={white} cast={false} />
        <Box s={[0.78, 1.45, 0.08]} p={[4.0, PL + 0.73, hd + 0.03]} m={door} cast={false} />
        <Box s={[1.15, 0.06, 0.2]} p={[4.0, PL + 1.62, hd + 0.1]} m={white} cast={false} />
        <Box s={[1.5, 0.08, 0.8]} p={[4.0, PL + 0.04, hd + 0.5]} m={white} />
        <mesh position={[5.6, PL / 2 + 0.01, hd + 0.5]} rotation={[0, 0, -0.14]} material={white} castShadow receiveShadow><boxGeometry args={[2.3, 0.1, 0.8]} /></mesh>
        <mesh position={[5.6, PL + 0.5, hd + 0.88]} rotation={[0, 0, -0.14]} material={redBrownRail}><boxGeometry args={[2.3, 0.04, 0.04]} /></mesh>
        <mesh position={[5.6, PL + 0.32, hd + 0.88]} rotation={[0, 0, -0.14]} material={redBrownRail}><boxGeometry args={[2.3, 0.03, 0.03]} /></mesh>
        {[4.7, 5.6, 6.5].map((x, i) => <Box key={x} s={[0.05, 0.5 - i * 0.07, 0.05]} p={[x, PL + 0.22 - i * 0.06, hd + 0.88]} m={redBrownRail} cast={false} />)}
        {[3.5, 4.3].map((x) => <Box key={x} s={[0.05, 0.5, 0.05]} p={[x, PL + 0.28, hd + 0.88]} m={redBrownRail} cast={false} />)}
        <pointLight position={[4.0, 1.2, hd + 1.4]} intensity={1.4} distance={6} color="#ffb060" />
        {/* Ashoka Pillar, near the centre of the front, in its yellow-red fence */}
        <group position={[-2.7, 0, hd + 1.6]}><AshokaStump /></group>
        <Frame s={[17.5, 6.4, 9.5]} p={[0.5, 3.2, 2.3]} />
      </group>
    );
  }

  /* ---------------- environment ---------------- */
  const POND = { x0: -8, x1: 8, z0: 6.6, z1: 14 };
  const holeRect = (path, x0, x1, z0, z1) => { path.moveTo(x0, -z0); path.lineTo(x0, -z1); path.lineTo(x1, -z1); path.lineTo(x1, -z0); path.closePath(); };

  function Ground() {
    const M = useM();
    const geo = useMemo(() => {
      const s = new THREE.Shape(); s.absarc(0, 0, 75, 0, Math.PI * 2, false);
      const h = new THREE.Path(); holeRect(h, POND.x0 - 0.2, POND.x1 + 0.2, POND.z0 - 0.2, POND.z1 + 0.2); s.holes.push(h);
      return new THREE.ShapeGeometry(s, 48);
    }, []);
    // brick plaza: a 4-6 m band round the pond and in front of the temple
    const plaza = useMemo(() => {
      const s = new THREE.Shape(); s.moveTo(-12.5, -3.8); s.lineTo(-12.5, -19); s.lineTo(12.5, -19); s.lineTo(12.5, -3.8); s.closePath();
      const h = new THREE.Path(); holeRect(h, POND.x0 - 0.2, POND.x1 + 0.2, POND.z0 - 0.2, POND.z1 + 0.2); s.holes.push(h);
      return new THREE.ShapeGeometry(s);
    }, []);
    const pathGeo = useMemo(() => {
      const s = new THREE.Shape(); s.moveTo(-1.2, 3.6); s.lineTo(1.2, 3.6); s.lineTo(1.2, 19); s.lineTo(-1.2, 19); s.closePath();
      return new THREE.ShapeGeometry(s);
    }, []);
    void pathGeo;
    return (
      <group>
        <mesh geometry={geo} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} receiveShadow material={M.plain('#5f7d3c', { roughness: 1 })} />
        <mesh geometry={plaza} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow material={M.mat('brick', 1.4, 1.4, { color: '#f2b8a0' })} />
        {/* paved apron around the temple plinth, brick texture */}
        <Box s={[W + 3, 0.02, D + 3]} p={[0, 0.01, 0]} m={M.mat('brick', 6, 3, { color: '#f2b8a0' })} cast={false} />
        <Box s={[25.4, 0.04, 0.3]} p={[0, 0.02, 18.6]} m={M.plain('#aaa49a', { roughness: 0.95 })} cast={false} />
        <Box s={[25.4, 0.04, 0.3]} p={[0, 0.02, 4.0]} m={M.plain('#aaa49a', { roughness: 0.95 })} cast={false} />
        <Box s={[0.3, 0.04, 14.6]} p={[-12.6, 0.02, 11.3]} m={M.plain('#aaa49a', { roughness: 0.95 })} cast={false} />
        <Box s={[0.3, 0.04, 14.6]} p={[12.6, 0.02, 11.3]} m={M.plain('#aaa49a', { roughness: 0.95 })} cast={false} />
      </group>
    );
  }

  function Puskarini() {
    const M = useM();
    const brickCop = M.mat('brick', 2, 1, { color: '#e2a08c' });
    const pinkL = M.plain('#d9a090', { roughness: 0.9 });
    const stone = M.plain('#bdb6aa', { roughness: 0.9 });
    const lip = M.plain('#cfc8bc', { roughness: 0.9 });
    const cx = (POND.x0 + POND.x1) / 2; const cz = (POND.z0 + POND.z1) / 2;
    const w = POND.x1 - POND.x0; const d = POND.z1 - POND.z0;
    const levels = [{ top: 0, sw: 0.7, m: brickCop }, { top: -0.2, sw: 0.45, m: pinkL }, { top: -0.4, sw: 0.45, m: stone }, { top: -0.6, sw: 0.45, m: pinkL }];
    const parts = [];
    let inset = 0;
    levels.forEach((lv, k) => {
      const wo = w - 2 * inset; const dO = d - 2 * inset;
      const h = lv.top + 0.9; const y = (lv.top - 0.9) / 2;
      const sw = lv.sw;
      parts.push(
        <Box key={`n${k}`} s={[wo, h, sw]} p={[cx, y, cz + dO / 2 - sw / 2]} m={lv.m} />,
        <Box key={`s${k}`} s={[wo, h, sw]} p={[cx, y, cz - dO / 2 + sw / 2]} m={lv.m} />,
        <Box key={`e${k}`} s={[sw, h, dO - 2 * sw]} p={[cx + wo / 2 - sw / 2, y, cz]} m={lv.m} />,
        <Box key={`w${k}`} s={[sw, h, dO - 2 * sw]} p={[cx - wo / 2 + sw / 2, y, cz]} m={lv.m} />,
      );
      inset += sw;
    });
    const iw = w - 2 * inset; const id = d - 2 * inset;
    return (
      <group>
        {parts}
        {/* pale stone coping on the temple-side edge */}
        <Box s={[w + 0.1, 0.04, 0.12]} p={[cx, 0.03, cz - d / 2 + 0.06]} m={lip} cast={false} />
        <Box s={[w + 0.1, 0.05, 0.12]} p={[cx, 0.03, cz + d / 2 - 0.06]} m={lip} cast={false} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, -0.72, cz]} receiveShadow>
          <planeGeometry args={[iw + 0.1, id + 0.1]} />
          <meshStandardMaterial color="#1a3238" metalness={0.15} roughness={0.02} />
        </mesh>
      </group>
    );
  }

  /** weathered stepped brick foundation wall: uneven height, 2-3 irregular step-downs at each end, no vegetation */
  function RuinWall({ p, l, t = 1.0, h = 1.0, ry = 0, m, seed = 1, steps = true }) {
    const nb = Math.max(2, Math.round(l / 1.6));
    return (
      <group position={p} rotation={[0, ry, 0]}>
        {Array.from({ length: nb }, (_, i) => {
          const sl = l / nb; const hh = h * (0.82 + rnd(seed * 7 + i) * 0.3);
          return <Box key={i} s={[sl + 0.02, hh, t]} p={[-l / 2 + sl * (i + 0.5), hh / 2, 0]} m={m} />;
        })}
        {steps && [-1, 1].map((k) => (
          <group key={k}>
            <Box s={[0.55, h * (0.7 + rnd(seed + k) * 0.1), t]} p={[k * (l / 2 + 0.27), h * 0.35, 0]} m={m} />
            <Box s={[0.5, h * (0.45 + rnd(seed + 3 * k) * 0.12), t * 0.95]} p={[k * (l / 2 + 0.8), h * 0.23, 0]} m={m} />
            <Box s={[0.45, h * 0.22, t * 0.9]} p={[k * (l / 2 + 1.3), h * 0.11, 0]} m={m} />
          </group>
        ))}
      </group>
    );
  }

  /** rectangular monastery cell: four thick walls around an open court */
  function Cell({ c, w, d, h = 1.1, m, t = 0.9, gap = 'none', seed = 1 }) {
    const [cx, cz] = c;
    return (
      <group>
        <RuinWall p={[cx, 0, cz + d / 2]} l={w} t={t} h={h} m={m} seed={seed} steps={false} />
        {gap !== 'back' && <RuinWall p={[cx, 0, cz - d / 2]} l={w} t={t} h={h * 0.85} m={m} seed={seed + 1} steps={false} />}
        <RuinWall p={[cx - w / 2, 0, cz]} l={d - t} t={t} h={h * 0.9} ry={Math.PI / 2} m={m} seed={seed + 2} steps />
        <RuinWall p={[cx + w / 2, 0, cz]} l={d - t} t={t} h={h * 0.7} ry={Math.PI / 2} m={m} seed={seed + 3} steps />
      </group>
    );
  }

  function StupaBase({ p, s = 1 }) {
    const M = useM();
    const m = M.mat('brick', 1, 1, { color: '#e8b8a0' });
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.62} rb={0.7} h={0.24} p={[0, 0.12, 0]} m={m} seg={14} />
        <Cyl rt={0.46} rb={0.55} h={0.24} p={[0, 0.36, 0]} m={m} seg={14} />
        <mesh position={[0, 0.72, 0]} material={m} castShadow><coneGeometry args={[0.44, 0.5, 14]} /></mesh>
      </group>
    );
  }

  function BigTree({ p, s = 1, hue = 0, trunk = 1 }) {
    const M = useM();
    const g1 = M.plain(['#41602c', '#4a6b2e', '#365428'][hue % 3], { roughness: 1 });
    const g2 = M.plain(['#4e7034', '#587a36', '#406030'][hue % 3], { roughness: 1 });
    const bark = M.plain('#5a4634', { roughness: 1 });
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.32 * trunk} rb={0.55 * trunk} h={3.2} p={[0, 1.6, 0]} m={bark} seg={9} />
        <Cyl rt={0.14} rb={0.24} h={2.2} p={[1.0, 3.4, 0]} r={[0, 0, -0.75]} m={bark} seg={6} />
        <Cyl rt={0.14} rb={0.24} h={2.2} p={[-1.0, 3.4, 0.2]} r={[0, 0, 0.75]} m={bark} seg={6} />
        {[[0, 5.2, 0, 2.4, g1], [2.0, 4.6, 0.5, 1.8, g2], [-2.0, 4.7, -0.3, 1.9, g1], [0.6, 6.2, 0.4, 1.6, g2], [-0.9, 5.7, 1.3, 1.5, g2], [1.2, 5.0, -1.3, 1.6, g1]].map(([x, y, z, r, m], i) => (
          <Ball key={i} rad={r} p={[x, y, z]} sc={[1, 0.8, 1]} m={m} />
        ))}
      </group>
    );
  }

  /** the huge sacred bodhi (pipal): thick twisting trunk, very wide flat spreading heart-leaf crown */
  function Bodhi({ p, s = 1 }) {
    const M = useM();
    const g1 = M.plain('#4f7a3a', { roughness: 1 });
    const g2 = M.plain('#5a8540', { roughness: 1 });
    const g3 = M.plain('#436b30', { roughness: 1 });
    const bark = M.plain('#6b5a4a', { roughness: 1 });
    const lobes = [[0, 7.0, 0, 3.4, g1], [4, 6.4, 1, 2.8, g2], [-4, 6.5, -0.5, 2.9, g1], [2, 7.8, -2.5, 2.4, g2], [-2.5, 7.6, 2.5, 2.5, g3], [5.5, 6.0, -2.5, 2.2, g3], [-5.8, 6.2, 2, 2.2, g2], [0.5, 6.2, 4.2, 2.3, g1], [0, 6.0, -4.5, 2.4, g3]];
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.7} rb={1.15} h={4.2} p={[0, 2.1, 0]} m={bark} seg={10} />
        <Cyl rt={0.3} rb={0.5} h={3.0} p={[1.6, 4.6, 0.4]} r={[0, 0, -0.9]} m={bark} seg={7} />
        <Cyl rt={0.3} rb={0.5} h={3.0} p={[-1.6, 4.6, -0.2]} r={[0, 0, 0.9]} m={bark} seg={7} />
        <Cyl rt={0.25} rb={0.4} h={2.8} p={[0.3, 4.5, 1.5]} r={[0.9, 0, 0]} m={bark} seg={7} />
        {lobes.map(([x, y, z, r, m], i) => <Ball key={i} rad={r} p={[x, y, z]} sc={[1.15, 0.7, 1.15]} m={m} />)}
      </group>
    );
  }

  /** soft pale-blue gradient sky dome fading to a hazy horizon */
  function SkyDome() {
    const geo = useMemo(() => {
      const g = new THREE.SphereGeometry(110, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2);
      const pos = g.attributes.position; const col = [];
      const top = new THREE.Color('#8fb0cc'); const hor = new THREE.Color('#dfe4e2'); const c = new THREE.Color();
      for (let i = 0; i < pos.count; i += 1) {
        const k = Math.pow(Math.min(1, Math.max(0, pos.getY(i) / 110)), 0.6);
        c.copy(hor).lerp(top, k); col.push(c.r, c.g, c.b);
      }
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      return g;
    }, []);
    return <mesh geometry={geo}><meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} /></mesh>;
  }

  function MayaEnv() {
    const M = useM();
    const brick = M.mat('brick', 3, 1, { color: '#eaa77e' });
    const brickDk = M.mat('brick', 3, 1, { color: '#d9966c' });
    const hedge = M.plain('#3c6a30', { roughness: 1 });

    const treeLine = useMemo(() => Array.from({ length: 38 }, (_, i) => {
      const a = (i / 38) * Math.PI * 2 + rnd(i) * 0.08;
      const r = 54 + rnd(i + 9) * 10;
      const s = 2.6 + rnd(i + 3) * 1.8;
      return { p: [Math.cos(a) * r, s * 0.5, Math.sin(a) * r], s: [s * 1.5, s * 0.9, s * 1.3] };
    }), []);
    const treeLine2 = useMemo(() => Array.from({ length: 22 }, (_, i) => {
      const a = (i / 22) * Math.PI * 2 + 0.13;
      const r = 66 + rnd(i + 21) * 4;
      const s = 3.0 + rnd(i + 5) * 1.6;
      return { p: [Math.cos(a) * r, s * 0.45, Math.sin(a) * r], s: [s * 1.7, s * 0.85, s * 1.4] };
    }), []);

    return (
      <group>
        <SkyDome />
        <Ground />
        <Puskarini />
        {/* one continuous trimmed hedge along the plaza's left edge */}
        <Box s={[0.9, 0.75, 14.6]} p={[-13.4, 0.37, 11.3]} m={hedge} />
        {/* weathered monastery foundations hugging the shelter: beside and behind */}
        <Cell c={[10.6, -1.2]} w={4.4} d={4.6} h={1.2} m={brick} seed={2} />
        <Cell c={[-10.6, -1.6]} w={4.4} d={4.6} h={1.0} m={brickDk} seed={5} />
        <Cell c={[-3, -7.2]} w={7} d={3.6} h={1.3} m={brick} gap="back" seed={9} />
        <Cell c={[6, -7.4]} w={4.6} d={3.6} h={0.9} m={brickDk} gap="back" seed={12} />
        <RuinWall p={[11, 0, 5.2]} l={2.6} t={0.9} h={0.6} m={brickDk} seed={4} />
        {/* small brick stupa bases near the pillar */}
        <StupaBase p={[3.0, 0, 5.4]} s={1.0} />
        <StupaBase p={[6.6, 0, 5.5]} s={0.8} />
        <StupaBase p={[9.0, 0, 5.2]} s={0.9} />
        <StupaBase p={[-6.2, 0, 5.2]} s={0.8} />
        {/* the great bodhi beside the ruins, hung with five-colour prayer flags */}
        <Bodhi p={[-16, 0, -14]} s={1.0} />
        <Box s={[0.12, 5, 0.12]} p={[-8.5, 2.5, -9.5]} m={M.plain('#6b5a4a')} />
        <Box s={[0.12, 4.2, 0.12]} p={[-24.5, 2.1, -10]} m={M.plain('#6b5a4a')} />
        <PrayerFlags from={[-16, 7.4, -14]} to={[-8.5, 4.8, -9.5]} n={30} />
        <PrayerFlags from={[-16, 6.8, -14]} to={[-8.5, 4.0, -9.5]} n={30} />
        <PrayerFlags from={[-16, 7.0, -14]} to={[-24.5, 4.0, -10]} n={22} />
        {/* a few smaller sal and mango trees, pushed back */}
        <BigTree p={[6, 0, -19]} s={0.85} hue={1} />
        <BigTree p={[-2, 0, -21]} s={0.95} hue={0} />
        <BigTree p={[17, 0, -17]} s={0.8} hue={2} />
        <BigTree p={[-24, 0, -14]} s={0.85} hue={1} />
        <BigTree p={[-22, 0, 14]} s={0.8} hue={0} />
        <BigTree p={[24, 0, 4]} s={0.8} hue={2} />
        <BigTree p={[23, 0, -10]} s={0.75} hue={1} />
        {/* low, hazy Terai tree line on a flat horizon */}
        <Inst items={treeLine} mat={M.plain('#5a7a4c', { roughness: 1 })} kind="ball" cast={false} />
        <Inst items={treeLine2} mat={M.plain('#7a9484', { roughness: 1 })} kind="ball" cast={false} />
      </group>
    );
  }

  return { 'maya-devi-temple-lumbini': { Main: MayaMain, Env: MayaEnv } };
}
