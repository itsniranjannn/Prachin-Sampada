// Krishna Mandir, Patan Durbar Square (Lalitpur). 1637 all-stone Granthakuta temple: open arcaded ground floor, two
// shrinking pillared pavilion terraces with balustrades, 21 gilded pinnacles (8 + 8 + 4 + 1) and a tall curvilinear
// shikhara. Gilded Garuda kneels on a column in front, stone lions flank the steps. Front = +z (east, toward the palace).
// In the model frame +x is south (Vishwanath, Bhimsen) and -x is north (Char Narayan, Hari Shankar [estimate]).
export default function make(K) {
  const { useM, Box, Cyl, Ball, Gajur, Frame, GroundDisc, Tree, PagodaBody, PalaceBody, NewarHouse, THREE, useMemo, useRef, useEffect } = K;

  const STONE = '#a8987f', STONE_D = '#605040', STONE_L = '#b9ad96', CORE = '#1a140e', CORE_U = '#241b13';

  /* ---------- instanced boxes / cylinders ---------- */
  function Inst({ items, m, kind = 'box' }) {
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
      <instancedMesh ref={ref} args={[null, null, items.length]} material={m} castShadow receiveShadow frustumCulled={false}>
        {kind === 'box' ? <boxGeometry args={[1, 1, 1]} /> : <cylinderGeometry args={[0.5, 0.5, 1, 10]} />}
      </instancedMesh>
    );
  }
  /** local (lx, lz) on side k (rotated k * 90 deg about Y) -> world */
  const side = (k, lx, lz) => { const a = k * Math.PI / 2; return [lx * Math.cos(a) + lz * Math.sin(a), -lx * Math.sin(a) + lz * Math.cos(a), a]; };

  /* ---------- arcaded wall: rectangle with cusped pointed arches, one mesh per side ---------- */
  function archGeom(w, h, n, holeW, apex, sill, t, corner) {
    const s = new THREE.Shape();
    s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.closePath();
    const bay = (w - 2 * corner) / n;
    const hw = holeW / 2;
    const sp = sill + (apex - sill) * 0.5;
    const k = apex - sp;
    for (let i = 0; i < n; i += 1) {
      const cx = -w / 2 + corner + (i + 0.5) * bay;
      const p = new THREE.Path();
      p.moveTo(cx - hw, sill); p.lineTo(cx + hw, sill); p.lineTo(cx + hw, sp);
      // cusped (ogee) head: shoulder, small inward cusp, slender tip
      p.bezierCurveTo(cx + hw, sp + k * 0.45, cx + hw * 0.55, sp + k * 0.55, cx + hw * 0.4, sp + k * 0.72);
      p.bezierCurveTo(cx + hw * 0.25, sp + k * 0.86, cx + hw * 0.08, apex - k * 0.04, cx, apex);
      p.bezierCurveTo(cx - hw * 0.08, apex - k * 0.04, cx - hw * 0.25, sp + k * 0.86, cx - hw * 0.4, sp + k * 0.72);
      p.bezierCurveTo(cx - hw * 0.55, sp + k * 0.55, cx - hw, sp + k * 0.45, cx - hw, sp);
      p.closePath();
      s.holes.push(p);
    }
    const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false });
    g.translate(0, 0, -t / 2);
    return g;
  }
  function ArchWall({ w, y, h, n, holeW, apex, sill = 0.05, t, corner = 0.4, m }) {
    const g = useMemo(() => archGeom(w, h, n, holeW, apex, sill, t, corner), [w, h, n, holeW, apex, sill, t, corner]);
    return (
      <group>
        {[0, 1, 2, 3].map((k) => {
          const d = w / 2 - t / 2 - (k % 2 ? 0.004 : 0);
          const [x, z, a] = side(k, 0, d);
          return <mesh key={k} geometry={g} material={m} position={[x, y, z]} rotation={[0, a, 0]} scale={[k % 2 ? 0.994 : 1, 1, 1]} castShadow receiveShadow />;
        })}
      </group>
    );
  }
  function colonnade(w, y, h, n, corner, r, out) {
    const bay = (w - 2 * corner) / n;
    for (let k = 0; k < 4; k += 1) for (let i = 0; i <= n; i += 1) {
      const lx = -w / 2 + corner + i * bay;
      const [x, z] = side(k, lx, w / 2 + r * 0.2);
      out.push([x, y + h / 2, z, r * 2, h, r * 2, 0]);
    }
  }
  function frieze(w, y, hh, step, tile, out) {
    for (let k = 0; k < 4; k += 1) {
      const m = Math.floor((w - 0.8) / step);
      for (let i = 0; i < m; i += 1) {
        const lx = -((m - 1) * step) / 2 + i * step;
        const [x, z, a] = side(k, lx, w / 2 + 0.05);
        out.push([x, y, z, tile[0], hh, tile[1], a]);
      }
    }
  }

  /* ---------- a storey band: carved frieze, dark cornice, projecting eave. returns nothing; top at y + 0.42 ---------- */
  function Cornice({ W, y, over = 0.95, st, stD, stL }) {
    return (
      <group>
        <Box s={[W + over * 1.3, 0.07, W + over * 1.3]} p={[0, y + 0.29, 0]} m={stD} />
        <Box s={[W + 0.1, 0.26, W + 0.1]} p={[0, y + 0.13, 0]} m={stL} />
        <Box s={[W + 0.16, 0.05, W + 0.16]} p={[0, y + 0.04, 0]} m={stD} />
        <Box s={[W + 0.2, 0.08, W + 0.2]} p={[0, y + 0.24, 0]} m={stD} />
        <Box s={[W + 2 * over, 0.12, W + 2 * over]} p={[0, y + 0.34, 0]} m={st} />
        <Box s={[W + 2 * over - 0.2, 0.06, W + 2 * over - 0.2]} p={[0, y + 0.43, 0]} m={stL} />
      </group>
    );
  }

  /* ---------- stone chhatri pavilion: 4 columns, arched openings, stepped pyramidal roof, gold torana + finial ---------- */
  function Chhatri({ p, s = 1, rot = 0 }) {
    const M = useM();
    const st = M.mat('granite', 1, 1, { color: STONE, emissive: '#4a3a2a', emissiveIntensity: 0.5 });
    const stD = M.mat('granite', 1, 1, { color: STONE_D, emissive: '#3a2c20', emissiveIntensity: 0.55 });
    const dk = M.plain(CORE, { roughness: 1 });
    return (
      <group position={p} scale={s} rotation={[0, rot, 0]}>
        <Box s={[1.0, 0.1, 1.0]} p={[0, 0.05, 0]} m={stD} />
        <Box s={[0.6, 0.5, 0.6]} p={[0, 0.35, 0]} m={dk} cast={false} />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => (
          <group key={`${a}${b}`}>
            <Cyl rt={0.06} rb={0.07} h={0.54} p={[a * 0.4, 0.37, b * 0.4]} m={st} seg={8} />
            <Box s={[0.15, 0.06, 0.15]} p={[a * 0.4, 0.66, b * 0.4]} m={stD} />
          </group>
        ))}
        {/* arched lintels on the four sides */}
        {[0, 1, 2, 3].map((k) => {
          const [x, z, a] = side(k, 0, 0.4);
          return (
            <group key={k} position={[x, 0, z]} rotation={[0, a, 0]}>
              <Box s={[0.88, 0.1, 0.1]} p={[0, 0.63, 0]} m={st} />
              <mesh position={[0, 0.55, 0.02]} material={dk}><torusGeometry args={[0.2, 0.05, 5, 12, Math.PI]} /></mesh>
            </group>
          );
        })}
        <Box s={[1.04, 0.08, 1.04]} p={[0, 0.73, 0]} m={st} />
        <Box s={[0.9, 0.14, 0.9]} p={[0, 0.84, 0]} m={stD} />
        <Box s={[0.72, 0.14, 0.72]} p={[0, 0.98, 0]} m={st} />
        <Box s={[0.54, 0.14, 0.54]} p={[0, 1.12, 0]} m={stD} />
        <Box s={[0.36, 0.14, 0.36]} p={[0, 1.26, 0]} m={st} />
        <mesh position={[0, 1.4, 0]} rotation={[0, Math.PI / 4, 0]} material={stD} castShadow><coneGeometry args={[0.2, 0.14, 4]} /></mesh>
        {/* gold flame-arch torana behind the finial, finial: lotus base, ball, spike */}
        <mesh position={[0, 1.55, -0.02]} rotation={[0, 0, -0.62]} material={M.gold}><torusGeometry args={[0.24, 0.025, 5, 16, Math.PI * 1.25]} /></mesh>
        <Cyl rt={0.06} rb={0.1} h={0.08} p={[0, 1.5, 0]} m={M.gold} seg={10} />
        <Ball rad={0.09} p={[0, 1.6, 0]} sc={[1, 0.9, 1]} m={M.gold} />
        <Ball rad={0.05} p={[0, 1.71, 0]} m={M.gold} />
        <mesh position={[0, 1.82, 0]} material={M.gold}><coneGeometry args={[0.03, 0.18, 8]} /></mesh>
      </group>
    );
  }

  /* ---------- curvilinear beehive profile (shared by the shikhara and the spirelets) ---------- */
  function beehive(R0, H, N, lip, seg, pw) {
    const r = (t) => R0 * (1 - 0.82 * Math.pow(t, pw)) * (1 + 0.16 * Math.sin(Math.min(1, t * 2.4) * Math.PI * 0.5 + 0.0)) * (1 - 0.1 * Math.pow(t, 1.2));
    const pts = [new THREE.Vector2(0.001, 0)];
    for (let i = 0; i < N; i += 1) {
      const t0 = i / N, t1 = (i + 1) / N, y0 = t0 * H, dy = H / N;
      pts.push(new THREE.Vector2(r(t0) + lip, y0), new THREE.Vector2(r(t0) + lip, y0 + 0.28 * dy),
        new THREE.Vector2(r(t0 + 0.28 / N), y0 + 0.28 * dy), new THREE.Vector2(r(t1), y0 + dy));
    }
    pts.push(new THREE.Vector2(r(1) + 0.03, H), new THREE.Vector2(0.001, H));
    const lg = new THREE.LatheGeometry(pts, seg);
    const ng = lg.toNonIndexed();
    ng.computeVertexNormals();
    return { g: ng, rTop: r(1), r };
  }

  function Shikhara({ y, H, R0 }) {
    const M = useM();
    const { g, rTop, r } = useMemo(() => beehive(R0, H, 8, 0.1, 16, 2.4), [H, R0]);
    const body = M.plain('#665540', { roughness: 0.95, emissive: '#3a2c20', emissiveIntensity: 0.5 });
    const bodyL = M.plain('#76664f', { roughness: 0.95, emissive: '#3a2c20', emissiveIntensity: 0.35 });
    const ribs = useMemo(() => {
      const out = [];
      const T = [0.1, 0.32, 0.54, 0.76, 0.94];
      for (let q = 0; q < 12; q += 1) {
        const a = (q / 12) * Math.PI * 2;
        for (let i = 0; i < T.length - 1; i += 1) {
          const r0 = r(T[i]) + 0.09, r1 = r(T[i + 1]) + 0.09, dy = (T[i + 1] - T[i]) * H;
          out.push({ a, y: ((T[i] + T[i + 1]) / 2) * H, rm: (r0 + r1) / 2, len: Math.hypot(dy, r1 - r0), tilt: Math.atan2(r1 - r0, dy) });
        }
      }
      return out;
    }, [H, r]);
    return (
      <group position={[0, y, 0]}>
        <mesh geometry={g} material={body} castShadow receiveShadow />
        {ribs.map((b, i) => (
          <group key={i} rotation={[0, b.a, 0]}>
            <Box s={[0.07, b.len, 0.07]} p={[0, b.y, b.rm]} r={[b.tilt, 0, 0]} m={bodyL} cast={false} />
          </group>
        ))}
        {/* ribbed amalaka: disc with a ridged rim, then the kalasha and gilded finial */}
        <Cyl rt={rTop * 2.0} rb={rTop * 2.0} h={0.16} p={[0, H + 0.08, 0]} m={bodyL} seg={16} />
        <Cyl rt={rTop * 2.2} rb={rTop * 2.2} h={0.05} p={[0, H + 0.1, 0]} m={body} seg={16} />
        <Cyl rt={rTop * 1.6} rb={rTop * 1.9} h={0.1} p={[0, H + 0.21, 0]} m={bodyL} seg={16} />
        <Gajur y={H + 0.26} s={1.35} />
        {/* gilded niches on the four faces of the shikhara foot */}
        {[0, 1, 2, 3].map((k) => {
          const [x, z, a] = side(k, 0, R0 * 1.14);
          return (
            <group key={k} position={[x, 0.55, z]} rotation={[0, a, 0]}>
              <Box s={[0.4, 0.56, 0.1]} p={[0, 0, 0]} m={M.plain(CORE_U)} />
              <mesh position={[0, 0.27, 0.04]} material={M.gold}><torusGeometry args={[0.2, 0.028, 6, 16, Math.PI]} /></mesh>
              <Ball rad={0.055} p={[0, 0.52, 0.04]} m={M.gold} />
            </group>
          );
        })}
      </group>
    );
  }
  /** a mini-shikhara spirelet with a gold ball finial */
  function Spirelet({ p, s = 1.3 }) {
    const M = useM();
    const { g } = useMemo(() => beehive(0.3, 1.1, 6, 0.04, 10, 1.9), []);
    const body = M.plain('#6b5a45', { roughness: 0.95, emissive: '#2e2216', emissiveIntensity: 0.5 });
    return (
      <group position={p} scale={s}>
        <Box s={[0.7, 0.12, 0.7]} p={[0, 0.06, 0]} m={body} />
        <group position={[0, 0.12, 0]}>
          <mesh geometry={g} material={body} castShadow />
          <Cyl rt={0.09} rb={0.12} h={0.06} p={[0, 1.13, 0]} m={M.gold} seg={10} />
          <Ball rad={0.08} p={[0, 1.22, 0]} m={M.gold} />
          <mesh position={[0, 1.34, 0]} material={M.gold}><coneGeometry args={[0.03, 0.18, 8]} /></mesh>
        </group>
      </group>
    );
  }

  /* ---------- lions on low pedestals ---------- */
  function StoneLion({ p, m, mp }) {
    return (
      <group position={p} scale={1.5}>
        <Box s={[0.74, 0.14, 0.74]} p={[0, 0.07, 0]} m={mp} />
        <Box s={[0.62, 0.2, 0.62]} p={[0, 0.24, 0]} m={mp} />
        <Box s={[0.5, 0.26, 0.5]} p={[0, 0.47, 0]} m={mp} />
        <Box s={[0.6, 0.07, 0.6]} p={[0, 0.635, 0]} m={mp} />
        <group position={[0, 0.67, 0]}>
          <Box s={[0.4, 0.3, 0.4]} p={[0, 0.17, -0.08]} m={m} />
          <Box s={[0.34, 0.52, 0.24]} p={[0, 0.48, 0.08]} m={m} />
          <Ball rad={0.2} p={[0, 0.5, 0.17]} sc={[1.3, 1.1, 0.7]} m={m} />
          <Ball rad={0.36} p={[0, 0.88, 0.0]} sc={[1, 1, 0.3]} m={m} />
          <Ball rad={0.22} p={[0, 0.9, 0.14]} sc={[1.05, 1, 0.95]} m={m} />
          <Ball rad={0.3} p={[0, 0.84, 0.05]} sc={[1.15, 1.1, 0.7]} m={m} />
          <Box s={[0.2, 0.12, 0.16]} p={[0, 0.8, 0.32]} m={m} />
          {[-1, 1].map((k) => <Box key={k} s={[0.08, 0.46, 0.1]} p={[k * 0.11, 0.24, 0.24]} m={m} />)}
          {[-1, 1].map((k) => <Box key={`f${k}`} s={[0.1, 0.05, 0.14]} p={[k * 0.11, 0.025, 0.3]} m={m} />)}
          {[-1, 1].map((k) => <Box key={`e${k}`} s={[0.06, 0.1, 0.05]} p={[k * 0.19, 1.08, 0.1]} m={m} />)}
        </group>
      </group>
    );
  }

  /* ---------- Garuda column: kneeling gilded Garuda, hands joined, on a lotus capital ---------- */
  function GarudaFigure({ m }) {
    return (
      <group>
        {/* seated legs: folded knees and a compact base */}
        <Box s={[0.46, 0.1, 0.42]} p={[0, 0.05, 0]} m={m} />
        <Box s={[0.4, 0.14, 0.3]} p={[0, 0.17, 0.05]} m={m} />
        {[-1, 1].map((k) => <Box key={`k${k}`} s={[0.14, 0.12, 0.3]} p={[k * 0.16, 0.2, 0.2]} m={m} />)}
        {/* human torso, belt and shoulders */}
        <Box s={[0.3, 0.4, 0.2]} p={[0, 0.45, 0]} m={m} />
        <Box s={[0.38, 0.09, 0.22]} p={[0, 0.65, 0]} m={m} />
        <Box s={[0.34, 0.06, 0.22]} p={[0, 0.3, 0]} m={m} />
        {/* anjali: forearms rising to joined palms at the chest */}
        {[-1, 1].map((k) => <Box key={`a${k}`} s={[0.07, 0.07, 0.24]} p={[k * 0.11, 0.5, 0.15]} r={[0, k * -0.3, 0]} m={m} />)}
        <Box s={[0.08, 0.15, 0.07]} p={[0, 0.54, 0.27]} m={m} />
        {/* rounded head, hooked beak, crown */}
        <Ball rad={0.14} p={[0, 0.84, 0.02]} m={m} />
        <mesh position={[0, 0.81, 0.17]} rotation={[Math.PI / 2 + 0.3, 0, 0]} material={m}><coneGeometry args={[0.05, 0.16, 8]} /></mesh>
        <Cyl rt={0.11} rb={0.15} h={0.08} p={[0, 0.96, 0]} m={m} seg={10} />
        <mesh position={[0, 1.12, 0]} material={m}><coneGeometry args={[0.09, 0.26, 8]} /></mesh>
        {/* two short wings folded close behind the shoulders */}
        {[-1, 1].map((k) => <Box key={`w${k}`} s={[0.05, 0.58, 0.2]} p={[k * 0.15, 0.62, -0.17]} r={[0.1, 0, k * 0.1]} m={m} />)}
        {/* flame-arch halo behind */}
        <mesh position={[0, 0.72, -0.3]} rotation={[0, 0, 0.0]} material={m}><torusGeometry args={[0.42, 0.03, 5, 20, Math.PI * 1.5]} /></mesh>
        {[-3, -2, -1, 0, 1, 2, 3].map((i) => {
          const a = Math.PI / 2 + i * 0.42;
          return <mesh key={`fl${i}`} position={[Math.cos(a) * 0.46, 0.72 + Math.sin(a) * 0.46, -0.3]} rotation={[0, 0, a - Math.PI / 2]} material={m}><coneGeometry args={[0.035, 0.12, 5]} /></mesh>;
        })}
      </group>
    );
  }
  function GarudaColumn({ p }) {
    const M = useM();
    const st = M.mat('granite', 1, 1, { color: STONE, emissive: '#4a3a2a', emissiveIntensity: 0.5 });
    const stL = M.mat('granite', 1, 1, { color: STONE_L, emissive: '#4a3a2a', emissiveIntensity: 0.5 });
    const dy = 1.0; // shaft lengthening so the whole column reaches about 6.5 m
    return (
      <group position={p}>
        <Box s={[1.5, 0.14, 1.5]} p={[0, 0.07, 0]} m={st} />
        <Box s={[1.15, 0.14, 1.15]} p={[0, 0.21, 0]} m={stL} />
        <Box s={[0.82, 0.5, 0.82]} p={[0, 0.53, 0]} m={st} />
        <Box s={[0.92, 0.08, 0.92]} p={[0, 0.82, 0]} m={stL} />
        <Cyl rt={0.34} rb={0.44} h={0.16} p={[0, 0.94, 0]} m={st} seg={16} />
        <Cyl rt={0.28} rb={0.32} h={2.5 + dy} p={[0, 2.25 + dy / 2, 0]} m={st} seg={16} />
        {[0.9, 1.7, 2.9 + dy].map((yy) => <Cyl key={yy} rt={0.34} rb={0.34} h={0.07} p={[0, yy + 0.2, 0]} m={stL} seg={16} />)}
        {/* carved capital: necking ring, inverted lotus, abacus */}
        <Cyl rt={0.36} rb={0.3} h={0.12} p={[0, 3.56 + dy, 0]} m={stL} seg={16} />
        <Cyl rt={0.54} rb={0.34} h={0.24} p={[0, 3.74 + dy, 0]} m={st} seg={20} />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return <Box key={i} s={[0.1, 0.2, 0.05]} p={[Math.sin(a) * 0.44, 3.72 + dy, Math.cos(a) * 0.44]} r={[0, a, 0]} m={stL} />;
        })}
        <Cyl rt={0.54} rb={0.54} h={0.08} p={[0, 3.9 + dy, 0]} m={stL} seg={20} />
        <group position={[0, 3.94 + dy, 0]} scale={1.2} rotation={[0, Math.PI, 0]}><GarudaFigure m={M.gold} /></group>
      </group>
    );
  }

  /* ---------- the temple ---------- */
  function KrishnaMain() {
    const M = useM();
    const st = M.mat('granite', 0.7, 0.7, { color: STONE, emissive: '#4a3a2a', emissiveIntensity: 0.5 });
    const stD = M.mat('granite', 0.7, 0.7, { color: STONE_D, emissive: '#3a2c20', emissiveIntensity: 0.55 });
    const stL = M.mat('granite', 1, 1, { color: STONE_L, emissive: '#4a3a2a', emissiveIntensity: 0.55 });
    const core = M.plain(CORE, { roughness: 1 });
    const coreU = M.plain(CORE_U, { roughness: 1 });
    const st1 = M.mat('granite', 0.7, 0.7, { color: '#9a8c76', emissive: '#4a3a2a', emissiveIntensity: 0.55 });
    const st2 = M.mat('granite', 0.7, 0.7, { color: '#a39a8a', emissive: '#40362c', emissiveIntensity: 0.55 });
    const lamp = M.plain('#3a2a1a', { emissive: '#ff9a2a', emissiveIntensity: 0.45, roughness: 0.6 });
    const lion = M.plain('#4a5a64', { roughness: 0.85 });
    const lionP = M.mat('granite', 1, 1, { color: '#4a5258' });

    // dimensions: ground arcade + two pavilion storeys, each set back with a walkway and balustrade
    const W0 = 6.0, Y0 = 0.45, H0 = 1.1;
    const Y1 = 2.04, W1 = 5.4, H1 = 1.5;
    const Y2 = 4.05, W2 = 4.4, H2 = 1.3;
    const Y3 = 5.8;

    const cols = useMemo(() => {
      const a = [];
      colonnade(W0, Y0, H0 - 0.1, 7, 0.45, 0.085, a);
      colonnade(W1, Y1, H1 - 0.1, 5, 0.42, 0.085, a);
      colonnade(W2, Y2, H2 - 0.1, 3, 0.4, 0.07, a);
      return a;
    }, []);
    const carve = useMemo(() => {
      const a = [];
      frieze(W0, Y0 + H0 + 0.1, 0.3, 0.26, [0.18, 0.06], a);
      frieze(W1, Y1 + H1 + 0.1, 0.3, 0.26, [0.18, 0.06], a);
      frieze(W2, Y2 + H2 + 0.1, 0.3, 0.26, [0.18, 0.06], a);
      return a;
    }, []);
    // balustrades on the three terraces
    const bal = useMemo(() => {
      const a = [];
      [[Y1 - 0.01, 3.7], [Y2 - 0.01, 3.3], [Y3 - 0.01, 2.5]].forEach(([yy, hw]) => {
        const w = hw * 2, n = Math.floor(w / 0.2);
        for (let k = 0; k < 4; k += 1) for (let i = 0; i <= n; i += 1) {
          const [x, z] = side(k, -w / 2 + (i * w) / n, hw);
          a.push([x, yy + 0.2, z, 0.09, 0.3, 0.09, 0]);
        }
      });
      return a;
    }, []);

    // chhatri positions: 8 on the terrace above level 1, 8 on the terrace above level 2
    const ring = (r) => [[-r, -r], [0, -r], [r, -r], [-r, 0], [r, 0], [-r, r], [0, r], [r, r]];
    const face = (x, z) => Math.atan2(x, z);

    const stairs = [0, 1, 2, 3].map((k) => {
      const n = 5, rise = 0.45 / n, run = 0.26;
      return (
        <group key={k} rotation={[0, k * Math.PI / 2, 0]}>
          {Array.from({ length: n }).map((_, i) => (
            <Box key={i} s={[1.3, (i + 1) * rise, run + 0.02]} p={[0, ((i + 1) * rise) / 2, 3.3 + (n - i - 0.5) * run]} m={i % 2 ? stD : stL} />
          ))}
          <Box s={[0.12, 0.34, 1.5]} p={[-0.7, 0.17, 3.3 + 0.65]} m={st} />
          <Box s={[0.12, 0.34, 1.5]} p={[0.7, 0.17, 3.3 + 0.65]} m={st} />
        </group>
      );
    });

    return (
      <group>
        <Frame s={[10.5, 11.4, 13.5]} p={[0.8, 5.7, 4.2]} />
        {/* plinth */}
        <Box s={[7.5, 0.15, 7.5]} p={[0, 0.075, 0]} m={stD} />
        <Box s={[7.05, 0.15, 7.05]} p={[0, 0.225, 0]} m={st} />
        <Box s={[6.6, 0.15, 6.6]} p={[0, 0.375, 0]} m={stD} />
        <Box s={[6.62, 0.04, 6.62]} p={[0, 0.45, 0]} m={stL} />
        {stairs}
        {/* lions on low pedestals flanking the front flight */}
        {[-1, 1].map((k) => <StoneLion key={k} p={[k * 1.2, 0, 3.9]} m={lion} mp={lionP} />)}

        {/* ground floor: dark recessed core, open arcade, frieze, cornice with overhang */}
        <Box s={[W0 - 2.2, H0, W0 - 2.2]} p={[0, Y0 + H0 / 2, 0]} m={core} cast={false} />
        <ArchWall w={W0} y={Y0} h={H0} n={7} holeW={0.62} apex={0.98} t={0.34} corner={0.45} m={st} />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => <Box key={`p0${a}${b}`} s={[0.5, H0, 0.5]} p={[a * (W0 / 2 - 0.2), Y0 + H0 / 2, b * (W0 / 2 - 0.2)]} m={stD} />)}
        <Cornice W={W0} y={Y0 + H0} over={0.95} st={st} stD={stD} stL={stL} />
        <Box s={[0.34, 0.62, 0.06]} p={[0, Y0 + 0.33, (W0 - 2.2) / 2 + 0.04]} m={lamp} cast={false} />

        {/* ground terrace rail and corner posts */}
        <Inst items={bal} m={stL} />
        {[[Y1, 3.7], [Y2, 3.3], [Y3, 2.5]].map(([yy, hw]) => [0, 1, 2, 3].map((k) => {
          const [x, z, a] = side(k, 0, hw);
          return (
            <group key={`${yy}${k}`}>
              <Box s={[hw * 2 + 0.1, 0.07, 0.1]} p={[x, yy + 0.37, z]} r={[0, a, 0]} m={stL} />
              <Box s={[hw * 2 + 0.1, 0.06, 0.1]} p={[x, yy + 0.04, z]} r={[0, a, 0]} m={stL} />
            </group>
          );
        }))}
        {[[Y1, 3.7], [Y2, 3.3], [Y3, 2.5]].map(([yy, hw]) => [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => <Box key={`bp${yy}${a}${b}`} s={[0.16, 0.46, 0.16]} p={[a * hw, yy + 0.23, b * hw]} m={stL} />))}

        {/* level 1 pavilion: five arched bays, taller storey */}
        <Box s={[W1 - 2.2, H1, W1 - 2.2]} p={[0, Y1 + H1 / 2, 0]} m={coreU} cast={false} />
        <ArchWall w={W1} y={Y1} h={H1} n={5} holeW={0.75} apex={1.3} t={0.26} corner={0.42} m={st1} />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => <Box key={`p1${a}${b}`} s={[0.46, H1, 0.46]} p={[a * (W1 / 2 - 0.18), Y1 + H1 / 2, b * (W1 / 2 - 0.18)]} m={stD} />)}
        <Cornice W={W1} y={Y1 + H1} over={0.95} st={st1} stD={stD} stL={stL} />
        

        {/* level 2 pavilion: three bays; the shikhara rises from its terrace */}
        <Box s={[W2 - 2.0, H2, W2 - 2.0]} p={[0, Y2 + H2 / 2, 0]} m={coreU} cast={false} />
        <ArchWall w={W2} y={Y2} h={H2} n={3} holeW={0.7} apex={1.1} t={0.24} corner={0.4} m={st2} />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => <Box key={`p2${a}${b}`} s={[0.4, H2, 0.4]} p={[a * (W2 / 2 - 0.16), Y2 + H2 / 2, b * (W2 / 2 - 0.16)]} m={stD} />)}
        <Cornice W={W2} y={Y2 + H2} over={0.95} st={st2} stD={stD} stL={stL} />
        

        <Inst items={cols} m={stD} kind="cyl" />
        <Inst items={carve} m={stL} />

        {/* 8 + 8 chhatris, 4 spirelets and the main finial = 21 gilded pinnacles */}
        {ring(2.72).map(([x, z], i) => <Chhatri key={`a${i}`} p={[x, Y2 + 0.001, z]} s={1.1} rot={face(x, z)} />)}
        {ring(2.0).map(([x, z], i) => <Chhatri key={`b${i}`} p={[x, Y3 + 0.001, z]} s={0.7} rot={face(x, z)} />)}

        {/* sanctum foot under the shikhara, then the spire itself */}
        <Box s={[3.2, 0.14, 3.2]} p={[0, Y3 + 0.07, 0]} m={stD} />
        <Box s={[3.0, 0.3, 3.0]} p={[0, Y3 + 0.29, 0]} m={st2} />
        <Box s={[2.8, 0.12, 2.8]} p={[0, Y3 + 0.5, 0]} m={stL} />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], i) => <Spirelet key={`c${i}`} p={[a * 1.25, Y3 + 0.56, b * 1.25]} s={1.1} />)}
        <Shikhara y={Y3 + 0.56} H={3.8} R0={0.9} />

        {/* Garuda column, off to the right of the axis in front of the steps, kneeling Garuda faces the temple */}
        <GarudaColumn p={[4.8, 0, 12]} />
      </group>
    );
  }

  /* ---------- Env: the real square ---------- */
  function Visitor({ p, c = '#c0392b', s = 1 }) {
    const M = useM();
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.045} rb={0.06} h={0.2} p={[0, 0.1, 0]} m={M.plain('#2a2a3a')} seg={8} />
        <Cyl rt={0.06} rb={0.07} h={0.16} p={[0, 0.28, 0]} m={M.plain(c)} seg={8} />
        <Ball rad={0.045} p={[0, 0.42, 0]} m={M.plain('#d4a27a')} />
      </group>
    );
  }
  function Pagoda({ p, tiers, w, scale = 1, tint = null, walls = 'red-brick', roof = 'clay-tile' }) {
    const M = useM();
    const f = useMemo(() => new Set(['carved-struts']), []);
    const st = M.mat('granite', 1, 1, { color: '#8f8574' });
    return (
      <group position={p} scale={scale}>
        <Box s={[w + 1.2, 0.2, w + 1.2]} p={[0, 0.1, 0]} m={st} />
        <Box s={[w + 0.8, 0.2, w + 0.8]} p={[0, 0.3, 0]} m={st} />
        <group position={[0, 0.4, 0]}><PagodaBody tiers={tiers} w={w} d={w} walls={walls} roof={roof} f={f} tint={tint} /></group>
      </group>
    );
  }
  function Hill({ p, r, h, c }) {
    const M = useM();
    return <Ball rad={r} p={[p[0], p[1], p[2]]} sc={[1.5, h / r, 1]} m={M.plain(c, { roughness: 1 })} />;
  }
  function KrishnaEnv() {
    const M = useM();
    const brick = M.mat('herring', 30, 30, { color: '#e3a47c', emissive: '#a8744f', emissiveIntensity: 0.22 });
    const band = M.mat('granite', 1, 1, { color: '#e4dccb', emissive: '#7a7468', emissiveIntensity: 0.2 });
    const apron = M.mat('granite', 3, 3, { color: '#cfc7b8', emissive: '#6a6358', emissiveIntensity: 0.25 });
    const grass = M.plain('#7e8f5c', { roughness: 1 });
    const lionM = M.plain('#4a5a64', { roughness: 0.85 });
    const palaceF = useMemo(() => new Set(['carved-windows']), []);
    const houses = useMemo(() => {
      const a = []; const tints = ['#a8654a', '#b8855f', '#9c6a4c', '#b07a58', '#a87050'];
      const sts = [2, 3, 2, 3, 2, 3, 2, 2, 3, 2];
      for (let i = 0; i < 10; i += 1) a.push({ x: -34 + i * 6.8 + ((i * 7) % 3) * 0.5, st: sts[i], w: 2.4 + (i % 3) * 0.5, tint: tints[i % 5], z: -13.5 - (i % 3) * 1.4 });
      return a;
    }, []);
    return (
      <group>
        <GroundDisc r={260} m={grass} y={-0.06} />
        <GroundDisc r={62} m={brick} y={-0.02} />
        <Box s={[11.6, 0.04, 11.6]} p={[0, 0.0, 0]} m={apron} cast={false} />
        {/* stone bands in the brick paving: rows along the temple, and a grid across the square */}
        {[4.9, 17, 31].map((z) => [[-28, 20], [4, 14], [30, 22]].map(([x, w], i) => <Box key={`${z}${i}`} s={[w, 0.03, 0.6]} p={[x + (z % 5), 0.0, z]} m={band} cast={false} />))}

        {/* south (+x): Vishwanath two-tier pagoda with stone lions, then taller Bhimsen */}
        <Pagoda p={[9.8, 0, 0.2]} tiers={2} w={2.6} scale={1.45} tint="#8a6a50" walls="timber" roof="slate" />
        <group position={[9.8, 0.4, 4.4]} scale={1.0}>
          {[-1, 1].map((k) => (
            <group key={k} position={[k * 1.3, 0, 0]} scale={0.6}>
              <Box s={[0.7, 0.45, 0.7]} p={[0, 0.22, 0]} m={lionM} />
              <Box s={[0.34, 0.6, 0.3]} p={[0, 0.72, 0]} m={lionM} />
              <Ball rad={0.22} p={[0, 1.15, 0.05]} m={lionM} />
            </group>
          ))}
        </group>
        <Pagoda p={[18.4, 0, 0.0]} tiers={3} w={2.8} scale={1.8} tint="#4e3226" />
        {/* north (-x): Char Narayan and Hari Shankar pagodas (position estimated) */}
        <Pagoda p={[-11.5, 0, -1.5]} tiers={2} w={2.6} scale={1.2} tint="#6a4a38" />
        <Pagoda p={[-20.0, 0, -2.5]} tiers={2} w={2.6} scale={1.15} tint="#5a4636" roof="slate" />

        {/* Patan Museum / Royal Palace: long carved-window brick facade across the square, behind the viewer */}
        <group position={[-4, 0, 36]} rotation={[0, Math.PI, 0]}>
          <PalaceBody w={46} d={3.6} storeys={3} walls="red-brick" roof="clay-tile" f={palaceF} />
        </group>
        <group position={[34, 0, 30]} rotation={[0, Math.PI, 0]}>
          <PalaceBody w={16} d={3.2} storeys={3} walls="red-brick" roof="clay-tile" f={palaceF} />
        </group>

        {/* Newar brick houses behind the temple row, in varied heights */}
        {houses.map((h, i) => <NewarHouse key={i} p={[h.x, 0, h.z]} r={Math.PI} w={h.w + 1} d={2} storeys={h.st} tint={h.tint} detail={false} />)}
        {[[-30, -26], [-12, -28], [6, -27], [22, -26], [-42, -22], [40, -20]].map(([x, z], i) => <Tree key={i} p={[x, 0, z]} s={1.4 + (i % 3) * 0.25} />)}

        {/* distant valley hill line */}
        <Hill p={[-30, -4, -120]} r={46} h={21.0} c="#7d8fa0" />
        <Hill p={[40, -4, -130]} r={52} h={25.2} c="#7d8fa0" />
        <Hill p={[-110, -4, -60]} r={50} h={19.6} c="#7d8fa0" />
        <Hill p={[-120, -4, 30]} r={44} h={18.2} c="#7d8fa0" />
        <Hill p={[120, -4, -70]} r={50} h={22.4} c="#7d8fa0" />
        <Hill p={[0, -4, -170]} r={70} h={36.4} c="#7d8fa0" />
        <Hill p={[-90, -4, -130]} r={60} h={30.8} c="#7d8fa0" />

        {/* visitors on the plinth and in the square */}
        <Visitor p={[-2.6, 0.45, 3.35]} c="#2e5aa8" />
        <Visitor p={[-2.3, 0.45, 3.4]} c="#c0392b" />
        <Visitor p={[2.7, 0.45, 3.4]} c="#d8a232" />
        <Visitor p={[-3.5, 0, 11]} c="#a3314a" />
        <Visitor p={[4.2, 0, 13]} c="#2e8b57" />
        <pointLight position={[0, 1.2, 3.6]} intensity={0.6} distance={7} color="#ffb060" />
      </group>
    );
  }

  return { 'krishna-mandir': { Main: KrishnaMain, Env: KrishnaEnv } };
}
