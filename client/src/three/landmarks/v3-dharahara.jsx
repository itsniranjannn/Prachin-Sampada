// Dharahara (Bhimsen Stambha), Sundhara, Kathmandu: the rebuilt (2021) 72 m tower. One very slender, pure-white round shaft
// (height : base diameter about 7 : 1, slight taper) with eight thin ring bands, a round balustraded balcony wider than the
// shaft, a short window drum, a white hemispherical dome and a thin bronze mast. It stands on a low round stone mound with a
// stair flight and a small hooded arched door; the old dark stump sits in a glass pavilion, with the Sundhara spout, garden
// beds and a fountain on flat city ground. Dense 4-7 storey Kathmandu skyline, a curved blue-banded glass building, forested
// hills and a far low snow range to the north. 1 unit = 3 m.
export default function make(K) {
  const { THREE, useMemo, useRef, useEffect, useState, useM, Frame, Box, Cyl, Ball, Tree } = K;

  const TAU = Math.PI * 2;
  const H_BAL = 19.55; // balcony floor
  const R_BASE = 1.55; // shaft radius at its foot
  const R_TOP = 1.1;
  const R_BAL = 2.05; // shaft radius under the balcony
  const Y_MOUND = 1.0;
  const shaftR = (y) => R_BASE - (R_BASE - R_TOP) * Math.min(1, Math.max(0, (y - 0.6) / (H_BAL - 0.6)));

  const rng = (seed) => () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
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

  /* ---------------- merged geometry helpers ---------------- */
  const _c = new THREE.Color();
  const paint = (g, col) => {
    const n = g.attributes.position.count;
    const a = new Float32Array(n * 3);
    _c.set(col || '#ffffff');
    for (let i = 0; i < n; i += 1) { a[i * 3] = _c.r; a[i * 3 + 1] = _c.g; a[i * 3 + 2] = _c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(a, 3));
    return g;
  };
  const place = (g, p, o) => {
    if (o && o.r) { g.rotateX(o.r[0] || 0); g.rotateY(o.r[1] || 0); g.rotateZ(o.r[2] || 0); }
    g.translate(p[0], p[1], p[2]);
    if (o && o.base) g.applyMatrix4(o.base);
  };
  const mkBox = (s, p, col, o = {}) => { const g = new THREE.BoxGeometry(s[0], s[1], s[2]); place(g, p, o); return paint(g, col); };
  const mkCyl = (rt, rb, h, seg, p, col, o = {}) => { const g = new THREE.CylinderGeometry(rt, rb, h, seg); place(g, p, o); return paint(g, col); };
  const mergeG = (list) => {
    const out = new THREE.BufferGeometry();
    if (!list.length) return out;
    let nv = 0; let ni = 0;
    list.forEach((g) => { nv += g.attributes.position.count; ni += g.index.count; });
    const P = new Float32Array(nv * 3); const N = new Float32Array(nv * 3); const U = new Float32Array(nv * 2);
    const C = new Float32Array(nv * 3); const I = new Uint32Array(ni);
    let vo = 0; let io = 0;
    for (const g of list) {
      const n = g.attributes.position.count;
      P.set(g.attributes.position.array, vo * 3); N.set(g.attributes.normal.array, vo * 3);
      U.set(g.attributes.uv.array, vo * 2); C.set(g.attributes.color.array, vo * 3);
      const ix = g.index.array;
      for (let i = 0; i < ix.length; i += 1) I[io + i] = ix[i] + vo;
      vo += n; io += ix.length;
      g.dispose();
    }
    out.setAttribute('position', new THREE.BufferAttribute(P, 3));
    out.setAttribute('normal', new THREE.BufferAttribute(N, 3));
    out.setAttribute('uv', new THREE.BufferAttribute(U, 2));
    out.setAttribute('color', new THREE.BufferAttribute(C, 3));
    out.setIndex(new THREE.BufferAttribute(I, 1));
    return out;
  };
  const frameBase = (x, z, ry) => new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(1, 1, 1));

  /** Flat arched opening (w x h) extruded d deep, facing +z, base at y = 0. */
  function archGeo(w, h, d) {
    const s = new THREE.Shape();
    const r = w / 2;
    s.moveTo(-r, 0); s.lineTo(-r, h - r); s.absarc(0, h - r, r, Math.PI, 0, true); s.lineTo(r, 0); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 10 });
    return g;
  }
  function gableGeo(w, h, d) {
    const s = new THREE.Shape();
    s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false });
  }

  /* ================================================================ MAIN ================================================================ */
  const BAND_Y = [3.5, 5.5, 7.5, 9.5, 11.5, 13.5, 15.5, 17.4]; // eight thin ring bands

  function Tower() {
    const M = useM();
    const [dusk, ref] = useDusk();
    const white = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f8f6f0', roughness: 0.8, emissive: '#efece4', emissiveIntensity: 0.3 }), []);
    const band = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fbfaf5', roughness: 0.7, emissive: '#ffa826', emissiveIntensity: dusk ? 2.2 : 0 }), [dusk]);
    const groove = useMemo(() => new THREE.MeshStandardMaterial({ color: '#e4e0d6', roughness: 0.95 }), []);
    const goldRing = useMemo(() => new THREE.MeshStandardMaterial({ color: '#d9b060', metalness: 0.6, roughness: 0.4, emissive: '#ffa826', emissiveIntensity: dusk ? 2.6 : 0 }), [dusk]);
    const rail = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f8f6ef', roughness: 0.7, emissive: '#ffa826', emissiveIntensity: dusk ? 1.8 : 0 }), [dusk]);
    const dark = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2d3640', roughness: 0.6 }), []);
    const bronze = useMemo(() => new THREE.MeshStandardMaterial({ color: '#b08d57', metalness: 0.7, roughness: 0.35 }), []);
    const doorGeo = useMemo(() => archGeo(0.62, 0.95, 0.1), []);
    const winGeo = useMemo(() => archGeo(0.17, 0.4, 0.06), []);
    const winGeoL = useMemo(() => archGeo(0.24, 0.52, 0.08), []);
    const pedGeo = useMemo(() => gableGeo(1.3, 0.3, 0.16), []);
    const balusters = useMemo(() => {
      const list = [];
      const n = 32;
      for (let i = 0; i < n; i += 1) {
        const a = (i / n) * TAU;
        list.push(mkCyl(0.04, 0.04, 0.5, 6, [Math.cos(a) * (R_BAL - 0.07), H_BAL + 0.39, Math.sin(a) * (R_BAL - 0.07)], '#f6f3ea'));
      }
      return mergeG(list);
    }, []);
    const ringWin = (n, y, r, k) => Array.from({ length: n }, (_, i) => {
      const a = (i / n) * TAU + k;
      return <mesh key={`${y}-${i}`} geometry={winGeo} material={dark} position={[Math.sin(a) * r, y, Math.cos(a) * r]} rotation={[0, a, 0]} />;
    });
    return (
      <group ref={ref}>
        {/* tapering shaft */}
        <mesh position={[0, (0.6 + H_BAL) / 2, 0]} material={white} castShadow>
          <cylinderGeometry args={[R_TOP, R_BASE, H_BAL - 0.6, 48]} />
        </mesh>
        {/* thin projecting ring bands */}
        {BAND_Y.map((y, i) => (
          <group key={y}>
            <mesh position={[0, y, 0]} material={band} castShadow>
              <cylinderGeometry args={[shaftR(y) + (i === 0 ? 0.16 : 0.10), shaftR(y) + (i === 0 ? 0.16 : 0.10), i === 0 ? 0.22 : 0.16, 48]} />
            </mesh>
            <mesh position={[0, y - (i === 0 ? 0.18 : 0.14), 0]} material={groove}>
              <cylinderGeometry args={[shaftR(y) + 0.05, shaftR(y) + 0.05, 0.05, 48]} />
            </mesh>
          </group>
        ))}
        {/* window band under the balcony: sparse small arched windows */}
        {ringWin(4, 18.3, shaftR(18.3) - 0.02, 0.8)}
        {/* heavier lower drum band */}
        <Cyl rt={R_BASE + 0.14} rb={R_BASE + 0.2} h={0.55} p={[0, Y_MOUND + 0.27, 0]} m={white} seg={48} />
        {/* corbelled underside of the balcony */}
        <Cyl rt={R_BAL - 0.05} rb={R_TOP + 0.12} h={0.4} p={[0, H_BAL - 0.2, 0]} m={white} seg={48} />
        {/* balcony floor, rail, balusters */}
        <mesh position={[0, H_BAL + 0.04, 0]} material={band}><cylinderGeometry args={[R_BAL, R_BAL, 0.12, 48]} /></mesh>
        <mesh position={[0, H_BAL + 0.67, 0]} rotation={[Math.PI / 2, 0, 0]} material={rail}><torusGeometry args={[R_BAL - 0.07, 0.11, 8, 48]} /></mesh>
        <mesh position={[0, H_BAL + 0.13, 0]} rotation={[Math.PI / 2, 0, 0]} material={white}><torusGeometry args={[R_BAL - 0.07, 0.07, 6, 48]} /></mesh>
        <mesh geometry={balusters} castShadow><meshStandardMaterial vertexColors roughness={0.7} /></mesh>
        {/* short window drum above the balcony */}
        <Cyl rt={1.2} rb={1.3} h={1.8} p={[0, H_BAL + 0.95, 0]} m={white} seg={40} />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * TAU + 0.2;
          return <mesh key={`dw${i}`} geometry={winGeoL} material={dark} position={[Math.sin(a) * 1.29, H_BAL + 0.55, Math.cos(a) * 1.29]} rotation={[0, a, 0]} />;
        })}
        <mesh position={[0, H_BAL + 1.45, 0]} rotation={[Math.PI / 2, 0, 0]} material={goldRing}><torusGeometry args={[1.22, 0.05, 6, 40]} /></mesh>
        <mesh position={[0, H_BAL + 1.92, 0]} material={band}><cylinderGeometry args={[1.42, 1.3, 0.16, 40]} /></mesh>
        {/* white hemispherical dome */}
        <mesh position={[0, H_BAL + 2.05, 0]} material={white} castShadow>
          <sphereGeometry args={[1.35, 36, 16, 0, TAU, 0, Math.PI / 2]} />
        </mesh>
        {/* bronze mast, about 7% of the height above the dome */}
        <Cyl rt={0.14} rb={0.14} h={0.05} p={[0, H_BAL + 3.4, 0]} m={bronze} seg={14} />
        <Ball rad={0.13} p={[0, H_BAL + 3.58, 0]} m={bronze} />
        <mesh position={[0, H_BAL + 4.5, 0]} material={bronze}><cylinderGeometry args={[0.035, 0.06, 2.0, 8]} /></mesh>
        <Cyl rt={0.1} rb={0.1} h={0.04} p={[0, H_BAL + 4.1, 0]} m={bronze} seg={12} />
        <Ball rad={0.06} p={[0, H_BAL + 5.52, 0]} m={bronze} />

        {/* arched door with pediment hood, facing +z */}
        <group position={[0, Y_MOUND, shaftR(Y_MOUND) - 0.12]} scale={1.25}>
          <Box s={[1.15, 1.12, 0.3]} p={[0, 0.56, 0.06]} m={white} />
          <mesh geometry={doorGeo} material={dark} position={[0, 0, 0.2]} />
          <mesh geometry={pedGeo} material={white} position={[0, 1.12, -0.02]} />
          <Box s={[1.35, 0.07, 0.3]} p={[0, 1.13, 0.08]} m={white} />
        </group>
        {dusk && <pointLight position={[0, H_BAL + 0.8, 0]} intensity={4} distance={9} color="#ffae45" />}
        {dusk && <pointLight position={[0, 6, 2.8]} intensity={2.5} distance={10} color="#ffb860" />}
      </group>
    );
  }

  function Mound() {
    const M = useM();
    const stone = M.mat('rock', 4, 1, { color: '#b9b2a3' });
    const step = M.mat('stone', 2, 1, { color: '#b9ad9c' });
    return (
      <group>
        <mesh position={[0, Y_MOUND / 2, 0]} material={stone} castShadow receiveShadow>
          <cylinderGeometry args={[3.8, 4.4, Y_MOUND, 48]} />
        </mesh>
        <Cyl rt={3.84} rb={3.84} h={0.1} p={[0, Y_MOUND + 0.01, 0]} m={M.plain('#cfc6b4')} seg={48} />
        {/* five broad steps down from the landing */}
        {Array.from({ length: 5 }, (_, i) => {
          const top = Y_MOUND - 0.16 * (i + 1);
          return <Box key={i} s={[3.2, top, 0.56]} p={[0, top / 2, 4.05 + i * 0.52]} m={step} />;
        })}
        {[-1.8, 1.8].map((x) => <Box key={x} s={[0.34, 0.7, 3.2]} p={[x, 0.35, 5.2]} m={stone} />)}
        {[-1.8, 1.8].map((x) => <Box key={`c${x}`} s={[0.42, 0.14, 3.3]} p={[x, 0.76, 5.2]} m={M.plain('#d7cfbd')} />)}
      </group>
    );
  }

  function Palm({ p, s = 1, lean = 0.1, ry = 0 }) {
    const M = useM();
    const trunk = M.plain('#7a6048');
    const leaf = M.plain('#3f7a34', { roughness: 0.9 });
    return (
      <group position={p} rotation={[0, ry, lean]} scale={s}>
        <Cyl rt={0.07} rb={0.12} h={1.7} p={[0, 0.85, 0]} m={trunk} seg={7} />
        {Array.from({ length: 8 }, (_, i) => (
          <group key={i} position={[0, 1.7, 0]} rotation={[0, (i / 8) * TAU, 0]}>
            <Box s={[0.14, 0.03, 0.95]} p={[0, -0.12, 0.48]} r={[0.45, 0, 0]} m={leaf} cast={false} />
          </group>
        ))}
      </group>
    );
  }
  function RedBush({ p, s = 1 }) {
    const M = useM();
    const g = M.plain('#3a6a32', { roughness: 1 });
    const f = M.plain('#d8261f', { roughness: 0.8 });
    return (
      <group position={p} scale={s}>
        <Ball rad={0.42} p={[0, 0.35, 0]} sc={[1, 0.85, 1]} m={g} />
        {[[0.2, 0.7, 0.15], [-0.25, 0.6, 0.2], [0.05, 0.78, -0.2], [-0.15, 0.7, -0.15], [0.3, 0.55, -0.1], [0, 0.62, 0.34]].map(([x, y, z], i) => <Ball key={i} rad={0.1} p={[x, y, z]} m={f} />)}
      </group>
    );
  }

  /** The old tower's remains: dark aged masonry stump (about 10 m) under a glass pavilion. */
  function Stump() {
    const M = useM();
    const masonry = useMemo(() => new THREE.MeshStandardMaterial({ color: '#7a7064', roughness: 1 }), []);
    const plinth = M.mat('stone', 3, 3, { color: '#b9b0a0' });
    const glass = useMemo(() => new THREE.MeshStandardMaterial({ color: '#d8eef5', transparent: true, opacity: 0.12, roughness: 0.05, metalness: 0.3, depthWrite: false }), []);
    const frame = M.plain('#7d9199', { metalness: 0.3, roughness: 0.5 });
    const rough = useMemo(() => {
      const r = rng(7);
      return Array.from({ length: 11 }, (_, i) => ({ a: (i / 11) * TAU + r() * 0.2, h: 0.2 + r() * 0.75, w: 0.3 + r() * 0.35, tilt: (r() - 0.5) * 0.5 }));
    }, []);
    const W = 3.6; const HG = 4.3;
    return (
      <group position={[-8.5, 0, 2]}>
        <Box s={[W + 0.4, 0.14, W + 0.4]} p={[0, 0.07, 0]} m={plinth} />
        <Cyl rt={0.98} rb={1.25} h={3.3} p={[0, 0.14 + 1.65, 0]} m={masonry} seg={28} />
        {[0.6, 1.2, 1.8, 2.4, 3.0].map((y) => <Cyl key={y} rt={1.2 - y * 0.075} rb={1.2 - y * 0.075} h={0.12} p={[0, 0.14 + y, 0]} m={M.plain('#9a8f80')} seg={28} />)}
        {rough.map((q, i) => <Box key={i} s={[q.w, q.h, 0.4]} p={[Math.sin(q.a) * 0.85, 3.4 + q.h / 2, Math.cos(q.a) * 0.85]} r={[q.tilt, q.a, q.tilt * 0.6]} m={masonry} />)}
        <Box s={[0.5, 0.45, 0.45]} p={[0.2, 3.6, -0.1]} r={[0.2, 0.5, 0.1]} m={masonry} />
        <Box s={[W, HG, W]} p={[0, 0.14 + HG / 2, 0]} m={glass} cast={false} />
        {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, z], i) => <Box key={i} s={[0.08, HG, 0.08]} p={[x * W / 2, 0.14 + HG / 2, z * W / 2]} m={frame} />)}
        <Box s={[W + 0.14, 0.08, W + 0.14]} p={[0, 0.14 + HG + 0.04, 0]} m={glass} cast={false} />
      </group>
    );
  }

  /** Sundhara: the stone water spout in its sunken stone basin. */
  function Sundhara() {
    const M = useM();
    const stone = M.mat('granite', 2, 1, { color: '#c8bfae' });
    const dkstone = M.mat('granite', 2, 1, { color: '#8f877a' });
    const water = M.plain('#6fb0c6', { roughness: 0.15, metalness: 0.2 });
    return (
      <group position={[9.5, 0, 6.5]} rotation={[0, -0.6, 0]}>
        {/* stone-faced sunken pit: coping all round, water at the bottom, steps down the open side */}
        <Box s={[0.3, 0.4, 2.7]} p={[-1.65, 0.2, 0.15]} m={stone} />
        <Box s={[0.3, 0.4, 2.7]} p={[1.65, 0.2, 0.15]} m={stone} />
        <Box s={[3.0, 0.06, 2.4]} p={[0, 0.04, 0.15]} m={dkstone} cast={false} />
        <Box s={[2.9, 0.05, 1.3]} p={[0, 0.09, -0.35]} m={water} cast={false} />
        {[0, 1, 2].map((i) => <Box key={i} s={[3.0, 0.32 - 0.1 * i, 0.3]} p={[0, (0.32 - 0.1 * i) / 2, 1.3 - i * 0.3]} m={stone} />)}
        {/* stone back wall with three spouts */}
        <Box s={[3.0, 1.0, 0.45]} p={[0, 0.5, -1.15]} m={stone} />
        <Box s={[3.2, 0.12, 0.6]} p={[0, 1.06, -1.15]} m={dkstone} />
        {[-0.95, 0, 0.95].map((x) => (
          <group key={x} position={[x, 0, 0]}>
            <Box s={[0.5, 0.42, 0.1]} p={[0, 0.62, -0.9]} m={dkstone} />
            <Cyl rt={0.06} rb={0.06} h={0.36} p={[0, 0.58, -0.75]} r={[Math.PI / 2, 0, 0]} m={M.copper} seg={8} />
            <Box s={[0.05, 0.4, 0.05]} p={[0, 0.34, -0.6]} m={water} cast={false} />
          </group>
        ))}
      </group>
    );
  }

  function Fountain() {
    const M = useM();
    const [dusk, ref] = useDusk();
    const stone = M.mat('granite', 3, 1, { color: '#d6cebd' });
    const water = M.plain('#8fd0e0', { roughness: 0.1, metalness: 0.2 });
    const spray = useMemo(() => new THREE.MeshStandardMaterial({ color: '#e8fbff', transparent: true, opacity: 0.55, roughness: 0.3 }), []);
    const cols = ['#ff4a4a', '#4a9bff', '#46d36a', '#ffcf3a'];
    return (
      <group ref={ref} position={[0, 0, 16.5]}>
        <Cyl rt={2.3} rb={2.4} h={0.45} p={[0, 0.22, 0]} m={stone} seg={40} />
        <Cyl rt={2.0} rb={2.0} h={0.05} p={[0, 0.43, 0]} m={water} seg={40} />
        <Cyl rt={0.5} rb={0.6} h={0.7} p={[0, 0.8, 0]} m={stone} seg={20} />
        <mesh position={[0, 1.6, 0]} material={spray}><coneGeometry args={[0.2, 1.4, 10]} /></mesh>
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * TAU;
          return <mesh key={i} position={[Math.cos(a) * 1.3, 0.8, Math.sin(a) * 1.3]} material={spray}><coneGeometry args={[0.09, 0.85, 7]} /></mesh>;
        })}
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * TAU + 0.2;
          return <Box key={i} s={[0.2, 0.1, 0.2]} p={[Math.cos(a) * 2.05, 0.5, Math.sin(a) * 2.05]} m={new THREE.MeshStandardMaterial({ color: cols[i % 4], emissive: cols[i % 4], emissiveIntensity: dusk ? 2.5 : 0.25 })} cast={false} />;
        })}
        {dusk && <pointLight position={[0, 1.4, 0]} intensity={2} distance={7} color="#9fd8ff" />}
      </group>
    );
  }

  function Garden() {
    const M = useM();
    const lawn = M.mat('grass', 3, 3, { color: '#8fb86a' });
    const hedge = M.plain('#2e5a2c', { roughness: 1 });
    const edge = M.plain('#c9c0ae');
    const flowers = useMemo(() => {
      const r = rng(11);
      const cols = ['#e03a3a', '#f08fb0', '#ffd23a', '#ffffff'];
      const list = [];
      [-1, 1].forEach((sx) => {
        for (let i = 0; i < 22; i += 1) {
          list.push(mkCyl(0.1, 0.1, 0.1, 5, [sx * (4.2 + r() * 2.8), 0.42, 9.2 + r() * 6.2], cols[Math.floor(r() * 4)]));
        }
      });
      return mergeG(list);
    }, []);
    return (
      <group>
        {[-1, 1].map((sx) => (
          <group key={sx} position={[sx * 5.6, 0, 12.2]}>
            <Box s={[3.6, 0.26, 7.4]} p={[0, 0.13, 0]} m={lawn} cast={false} />
            <Box s={[3.8, 0.34, 0.2]} p={[0, 0.17, 3.7]} m={edge} cast={false} />
            <Box s={[3.8, 0.34, 0.2]} p={[0, 0.17, -3.7]} m={edge} cast={false} />
            <Box s={[0.2, 0.34, 7.4]} p={[sx * -1.8, 0.17, 0]} m={edge} cast={false} />
            <Box s={[0.2, 0.34, 7.4]} p={[sx * 1.8, 0.17, 0]} m={edge} cast={false} />
            <Box s={[2.2, 0.35, 0.5]} p={[0, 0.3, -1.4]} m={hedge} cast={false} />
          </group>
        ))}
        <mesh geometry={flowers}><meshStandardMaterial vertexColors roughness={0.8} /></mesh>
      </group>
    );
  }

  function Lamps() {
    const M = useM();
    const [dusk, ref] = useDusk();
    const post = M.plain('#2b2f33');
    const head = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fff1c8', emissive: '#ffcf7a', emissiveIntensity: dusk ? 3 : 0.15 }), [dusk]);
    const pts = [[-3.2, 7.2], [3.2, 7.2], [-8, 11], [8, 11], [-8, 17], [8, 17], [-3.2, 17.5], [3.2, 17.5]];
    return (
      <group ref={ref}>
        {pts.map(([x, z], i) => (
          <group key={i} position={[x, 0, z]}>
            <Cyl rt={0.04} rb={0.06} h={1.9} p={[0, 0.95, 0]} m={post} seg={6} />
            <Ball rad={0.14} p={[0, 1.98, 0]} m={head} />
          </group>
        ))}
      </group>
    );
  }

  function DharaharaMain() {
    return (
      <group>
        <Tower />
        <Mound />
        <Stump />
        <Sundhara />
        <Fountain />
        <Garden />
        <Lamps />
        <Palm p={[-3.6, 0.2, 3.2]} s={1.3} lean={0.12} />
        <Palm p={[3.8, 0.2, 3.0]} s={1.5} lean={-0.1} ry={1} />
        <Palm p={[-4.3, 0.2, 5.4]} s={1.0} lean={0.2} ry={2} />
        <RedBush p={[-2.8, 0.1, 5.6]} s={1.3} />
        <RedBush p={[2.9, 0.1, 5.4]} s={1.2} />
        <RedBush p={[4.3, 0.1, 5.0]} s={1.0} />
        <Tree p={[-5.5, 0, 0.5]} s={1.6} />
        <Frame s={[9, 25, 11]} p={[0, 12.5, 2]} />
      </group>
    );
  }

  /* ================================================================ ENV ================================================================ */
    const CURVED = { cx: -32.3, cz: -10.5, R: 8, t0: Math.atan2(0.31, 0.95), span: 0.95, floors: 5 };
  const SH = 1.1; // one storey

  function buildCity() {
    const r = rng(2026);
    const body = []; const dk = []; const lit = [];
    const PAL = ['#9a4a38', '#a4523f', '#9a4a38', '#8f8d88', '#9b9a96', '#8f8d88', '#b9b4aa', '#7f96aa', '#a3adb4', '#c8b58f', '#b98a72'];
    /** A street-aligned row: n runs from a to b; normal (nx,nz) points to the street. */
    const row = (a, b, nx, nz, dMin, dMax, hMin, hMax, opts = {}) => {
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const ux = (b[0] - a[0]) / len; const uz = (b[1] - a[1]) / len;
      const ry = Math.atan2(nx, nz);
      let t = 0;
      while (t < len) {
        const w = 2.8 + r() * 3.6; const d = dMin + r() * (dMax - dMin);
        if (t + w > len + 1) break;
        const gap = r() < 0.12 ? 1.4 + r() * 2 : 0.12;
        const skip = opts.skip && r() < opts.skip;
        const storeys = Math.round(hMin + Math.pow(r(), opts.tall || 1.6) * (hMax - hMin)) + (r() < (opts.spike || 0) ? 3 : 0);
        const cx = a[0] + ux * (t + w / 2) - nx * (d / 2); const cz = a[1] + uz * (t + w / 2) - nz * (d / 2);
        t += w + gap;
        if (skip) continue;
        if (Math.hypot(cx - CURVED.cx, cz - CURVED.cz) < 13.5) continue;
        if (cx > 11 && cx < 44 && cz < -8 && cz > -38) continue; // Tundikhel parade ground
        const h = storeys * SH;
        const col = PAL[Math.floor(r() * PAL.length)];
        const o = { base: frameBase(cx, cz, ry) };
        body.push(mkBox([w, h, d], [0, h / 2, 0], col, o));
        body.push(mkBox([w + 0.14, 0.14, d + 0.14], [0, h + 0.07, 0], '#7c776e', o));
        const cols = Math.max(1, Math.floor(w / 1.35));
        const shop = r() < 0.7;
        for (let s2 = 0; s2 < storeys; s2 += 1) {
          const y = s2 * SH + SH * 0.58;
          for (let k = 0; k < cols; k += 1) {
            const off = (k + 0.5) * (w / cols) - w / 2;
            if (s2 === 0 && shop) { dk.push(mkBox([w / cols * 0.8, 0.7, 0.05], [off, 0.45, d / 2 + 0.02], '#ffffff', o)); continue; }
            (r() < 0.3 ? lit : dk).push(mkBox([w / cols * (0.45 + r() * 0.2), 0.4 + r() * 0.12, 0.05], [off, y, d / 2 + 0.02], '#ffffff', o));
          }
          if (s2 > 0 && r() < 0.4) body.push(mkBox([w * 0.95, 0.07, 0.3], [0, s2 * SH + 0.04, d / 2 + 0.14], '#8a857c', o));
          const sideN = Math.max(1, Math.floor(d / 1.8));
          [1, -1].forEach((sg) => { if (r() < 0.5) (r() < 0.3 ? lit : dk).push(mkBox([0.05, 0.4, d * 0.5 / sideN], [sg * (w / 2 + 0.02), y, 0], '#ffffff', o)); });
        }
        if (r() < 0.8) {
          const tx = (r() - 0.5) * w * 0.5; const tz = (r() - 0.5) * d * 0.5;
          body.push(mkCyl(0.26, 0.26, 0.52, 10, [tx, h + 0.45, tz], '#202326', o));
          body.push(mkBox([0.5, 0.2, 0.5], [tx, h + 0.24, tz], '#8a857c', o));
        }
        if (r() < 0.4) body.push(mkBox([1.3, 0.8, 1.2], [(r() - 0.5) * w * 0.4, h + 0.55, (r() - 0.5) * d * 0.4], '#c9b79a', o));
        if (r() < 0.55) body.push(mkCyl(0.03, 0.03, 1.6 + r() * 2.6, 4, [(r() - 0.5) * w * 0.7, h + 0.8, (r() - 0.5) * d * 0.7], '#6b6f74', o));
      }
    };
    // north (back) frontage on the road at z = -12, three rows deep, tallest at the back
    row([-26, -14.5], [48, -14.5], 0, 1, 4, 6, 3, 5);
    row([-26, -22], [48, -22], 0, 1, 5, 7, 4, 7, { spike: 0.2 });
    row([-26, -31], [60, -31], 0, 1, 5, 7, 5, 8, { spike: 0.2 });
    row([-30, -41], [64, -41], 0, 1, 6, 8, 5, 8);
    // west frontage on the road at x = -20 (the curved glass block stands beyond it)
    row([-23, -12], [-23, 30], 1, 0, 4, 6, 3, 5);
    row([-30, -12], [-30, 36], 1, 0, 4, 6, 4, 6, { skip: 0.1 });
    row([-38, -12], [-38, 40], 1, 0, 5, 7, 4, 7);
    // east and south: low and sparse so the camera side stays open
    row([37, -8], [37, 34], -1, 0, 4, 6, 2, 4, { skip: 0.35 });
    row([46, -8], [46, 40], -1, 0, 4, 6, 3, 5, { skip: 0.3 });
    row([-26, 35], [34, 35], 0, -1, 4, 6, 2, 4, { skip: 0.35 });
    row([-34, 43], [44, 43], 0, -1, 4, 6, 3, 5, { skip: 0.3 });
    return { body: mergeG(body), dk: mergeG(dk), lit: mergeG(lit) };
  }

  function City() {
    const [dusk, ref] = useDusk();
    const g = useMemo(() => buildCity(), []);
    const litM = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4a5666', roughness: 0.4, emissive: '#ffc35a', emissiveIntensity: dusk ? 2.2 : 0 }), [dusk]);
    return (
      <group ref={ref}>
        <mesh geometry={g.body} receiveShadow castShadow><meshStandardMaterial vertexColors roughness={0.92} fog={false} /></mesh>
        <mesh geometry={g.dk}><meshStandardMaterial color="#38424f" roughness={0.4} metalness={0.2} /></mesh>
        <mesh geometry={g.lit} material={litM} />
      </group>
    );
  }

  /** The curved, blue-banded glass office block beside the tower. */
  function CurvedGlass() {
    const M = useM();
    const { cx, cz, R, t0, span, floors } = CURVED;
    const H = floors * SH;
    const thS = Math.PI / 2 - (t0 + span); const thL = span * 2;
    const slab = useMemo(() => {
      const s = new THREE.Shape();
      const N = 28; const depth = 5;
      for (let i = 0; i <= N; i += 1) { const t = t0 - span + (i / N) * span * 2; const x = cx + R * Math.cos(t); const z = cz + R * Math.sin(t); i ? s.lineTo(x, -z) : s.moveTo(x, -z); }
      for (let i = N; i >= 0; i -= 1) { const t = t0 - span + (i / N) * span * 2; s.lineTo(cx + (R - depth) * Math.cos(t), -(cz + (R - depth) * Math.sin(t))); }
      s.closePath();
      const g = new THREE.ExtrudeGeometry(s, { depth: H, bevelEnabled: false });
      g.rotateX(-Math.PI / 2);
      return g;
    }, []);
    const glassM = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3f78b4', metalness: 0.55, roughness: 0.22, side: THREE.DoubleSide, emissive: '#ffc35a', emissiveIntensity: 0 }), []);
    const [dusk, ref] = useDusk();
    useEffect(() => { glassM.emissiveIntensity = dusk ? 0.5 : 0; }, [dusk, glassM]);
    const white = M.plain('#e8ebee');
    return (
      <group ref={ref}>
        <mesh geometry={slab} material={M.plain('#cfd4d8')} castShadow receiveShadow />
        {Array.from({ length: floors }, (_, i) => (
          <group key={i}>
            <mesh position={[cx, i * SH + SH * 0.58, cz]} material={glassM}>
              <cylinderGeometry args={[R + 0.05, R + 0.05, 0.64, 40, 1, true, thS, thL]} />
            </mesh>
            <mesh position={[cx, i * SH + SH * 0.12, cz]} material={white}>
              <cylinderGeometry args={[R + 0.12, R + 0.12, 0.46, 40, 1, true, thS, thL]} />
            </mesh>
          </group>
        ))}
        <mesh position={[cx, H + 0.1, cz]} material={M.plain('#9ea3a8')}>
          <cylinderGeometry args={[R + 0.12, R + 0.12, 0.2, 40, 1, true, thS, thL]} />
        </mesh>
        <mesh position={[cx, H + 0.5, cz]} material={white}>
          <cylinderGeometry args={[R + 0.12, R + 0.12, 0.6, 40, 1, true, thS, thL]} />
        </mesh>
        {[0, 1, 2].map((i) => {
          const t = t0 + (i - 1) * 0.5;
          return <Cyl key={i} rt={0.025} rb={0.025} h={2.4} p={[cx + (R - 2) * Math.cos(t), H + 1.3, cz + (R - 2) * Math.sin(t)]} m={M.plain('#6b6f74')} seg={4} />;
        })}
        <Box s={[2.2, 0.9, 2]} p={[cx + (R - 4) * Math.cos(t0), H + 0.5, cz + (R - 4) * Math.sin(t0)]} m={white} />
      </group>
    );
  }

  /** Dark-green forested rim of the valley. */
  function Hills() {
    const geo = useMemo(() => {
      const N = 144;
      const rows = [[57, 0, '#4a6a4a'], [60, 0.45, '#3f5f42'], [64, 1.0, '#365636'], [69, 1.3, '#2c4a2e'], [74, 1.0, '#2f5646'], [80, 1.5, '#2f5a4e'], [88, 1.3, '#3c6558'], [96, 0.7, '#4c7466']];
      const P = []; const C = []; const I = [];
      const col = new THREE.Color();
      for (let j = 0; j < rows.length; j += 1) {
        for (let i = 0; i <= N; i += 1) {
          const a = (i / N) * TAU;
          const ridge = 8 + 3.2 * Math.sin(3 * a + 1 + j * 1.3) + 2.2 * Math.sin(7 * a + 0.5 + j) + 1.2 * Math.sin(13 * a + 2 + j * 2.1) + 0.7 * Math.sin(29 * a + j);
          const k = 0.5 + 0.5 * Math.cos(a - 0); // a=0 is +z (behind camera): lower
          const h = 1.0 * ridge * (0.5 + 0.5 * (1 - k)) * rows[j][1] * (1 + 0.12 * Math.sin(a * 41 + j));
          P.push(Math.sin(a) * rows[j][0], h, Math.cos(a) * rows[j][0]);
          col.set(rows[j][2]); col.offsetHSL(0, 0, 0.03 * Math.sin(a * 19 + j));
          C.push(col.r, col.g, col.b);
        }
      }
      for (let j = 0; j < rows.length - 1; j += 1) {
        for (let i = 0; i < N; i += 1) {
          const a = j * (N + 1) + i; const b = a + 1; const c = a + N + 1; const d = c + 1;
          I.push(a, b, c, b, d, c);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      g.setIndex(I);
      g.computeVertexNormals();
      return g;
    }, []);
    return <mesh geometry={geo}><meshStandardMaterial vertexColors roughness={1} side={THREE.DoubleSide} fog={false} /></mesh>;
  }

  /** Far, soft Himalayan snow range along the northern horizon (-z), fading into haze. */
  function SnowRange() {
    const geo = useMemo(() => {
      const r = rng(99);
      const list = [];
      const rows = [[160, 0.8, '#d6e1ef', '#c4d3e3'], [148, 1.0, '#eef3fa', '#bccadd']];
      rows.forEach(([rad, hs, top, base], rw) => {
        const n = 46;
        for (let i = 0; i < n; i += 1) {
          const f = i / (n - 1) - 0.5;
          const a = Math.PI + f * 2.9 + (r() - 0.5) * 0.05;
          const h = (6 + 8 * Math.max(0, Math.cos(f * 2.6)) * (0.3 + 0.8 * r()) + 1.5 * r()) * hs;
          const w = h * (1.5 + r() * 0.6);
          const x = Math.sin(a) * rad; const z = Math.cos(a) * rad;
          const LIFT = 8 + rw;
          const seg = 7 + Math.floor(r() * 3);
          const rot = r() * 3;
          const gb = new THREE.ConeGeometry(w * 1.1, h + LIFT, seg);
          gb.rotateY(rot); gb.translate(x, (h + LIFT) / 2 - 2, z); paint(gb, base);
          list.push(gb);
          const gs = new THREE.ConeGeometry(w * 0.62, h * 0.8, seg);
          gs.rotateY(rot); gs.translate(x, LIFT + h * 0.6 - 2, z); paint(gs, top);
          list.push(gs);
        }
      });
      return mergeG(list);
    }, []);
    return (
      <group>
        <mesh geometry={geo}><meshStandardMaterial vertexColors flatShading roughness={0.95} emissive="#8fa4c4" emissiveIntensity={0.22} fog={false} /></mesh>
      </group>
    );
  }

  /** Pale-blue sky gradient dome. */
  function SkyDome() {
    const [dusk, ref] = useDusk();
    const geo = useMemo(() => {
      const g = new THREE.SphereGeometry(180, 32, 16, 0, TAU, 0, Math.PI / 2);
      const pos = g.attributes.position; const cols = [];
      const hz = new THREE.Color(dusk ? '#7a5a88' : '#dbe9f2'); const zn = new THREE.Color(dusk ? '#1e1a45' : '#8fb9e0'); const c = new THREE.Color();
      for (let i = 0; i < pos.count; i += 1) { const t = Math.pow(Math.min(1, Math.max(0, pos.getY(i) / 180)), 0.6); c.copy(hz).lerp(zn, t); cols.push(c.r, c.g, c.b); }
      g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
      return g;
    }, [dusk]);
    return <group ref={ref}><mesh geometry={geo} renderOrder={-10}><meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} /></mesh></group>;
  }

  function Ground() {
    const M = useM();
    const road = M.plain('#4b4c50', { roughness: 0.95 });
    const dash = useMemo(() => {
      const list = [];
      for (let x = -56; x <= 56; x += 4) list.push(mkBox([1.4, 0.02, 0.12], [x, 0.047, -12.8], '#e8e4d8'));
      for (let z = -10; z <= 40; z += 4) list.push(mkBox([0.12, 0.02, 1.4], [-21.3, 0.047, z], '#e8e4d8'));
      for (let z = -10; z <= 40; z += 4) list.push(mkBox([0.12, 0.02, 1.4], [35.3, 0.047, z], '#e8e4d8'));
      for (let x = -24; x <= 34; x += 4) list.push(mkBox([1.4, 0.02, 0.12], [x, 0.047, 33.3], '#e8e4d8'));
      for (let i = 0; i < 6; i += 1) list.push(mkBox([0.4, 0.02, 2.6], [-1.2 + i * 0.5, 0.05, -12.8])); // zebra crossing at the head of the axis
      return mergeG(list);
    }, []);
    const poles = useMemo(() => {
      const list = [];
      for (let x = -50; x <= 50; x += 10) {
        list.push(mkCyl(0.05, 0.07, 3.4, 6, [x, 1.7, -11.0], '#5f6368'));
        list.push(mkBox([1.6, 0.05, 0.05], [x, 3.2, -11.0], '#2c2f33'));
        if (x < 50) for (const dy of [0, 0.22]) list.push(mkBox([10.02, 0.018, 0.018], [x + 5, 3.05 - dy - 0.12, -11.0], '#202326'));
      }
      return mergeG(list);
    }, []);
    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow><meshStandardMaterial color="#8d887c" roughness={1} fog={false} /><circleGeometry args={[165, 64]} /></mesh>
        {/* city blocks pavement */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[8, 0.01, 4]} receiveShadow material={M.plain('#a49e90', { roughness: 1 })}><planeGeometry args={[110, 100]} /></mesh>
        {/* ring of streets, irregular: back road, west road, east road, south road */}
        <mesh position={[0, 0.03, -12.8]} receiveShadow material={road} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[140, 3.6]} /></mesh>
        <mesh position={[-21.3, 0.03, 12]} receiveShadow material={road} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[3.4, 62]} /></mesh>
        <mesh position={[35.3, 0.03, 14]} receiveShadow material={road} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[3.4, 62]} /></mesh>
        <mesh position={[0, 0.03, 33.3]} receiveShadow material={road} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[70, 3.2]} /></mesh>
        <mesh geometry={dash}><meshStandardMaterial vertexColors roughness={0.9} /></mesh>
        {/* rectangular, slightly skewed garden precinct (Sundhara square) with pavement and curb */}
        <group rotation={[0, 0.05, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.5, 0.04, 9]} receiveShadow material={M.plain('#cfc8b9', { roughness: 0.95 })}><planeGeometry args={[37, 36]} /></mesh>
          {[[0.5, -9.1, 37.4, 0.3], [0.5, 27.1, 37.4, 0.3]].map(([x, z, w, d], i) => <Box key={i} s={[w, 0.16, d]} p={[x, 0.08, z]} m={M.plain('#b9b2a3')} cast={false} />)}
          {[[-18.2, 9], [19.2, 9]].map(([x, z], i) => <Box key={i} s={[0.3, 0.16, 36.2]} p={[x, 0.08, z]} m={M.plain('#b9b2a3')} cast={false} />)}
        </group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} receiveShadow material={M.plain('#bdb5a4', { roughness: 1 })}><ringGeometry args={[4.5, 6.4, 48]} /></mesh>
        <mesh position={[0, 0.055, 12]} receiveShadow material={M.plain('#bdb5a4', { roughness: 1 })} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[2.8, 14]} /></mesh>
        {/* Tundikhel parade ground, north-east: open grass with a path edge */}
        <mesh position={[28, 0.05, -23]} rotation={[-Math.PI / 2, 0, -0.1]} receiveShadow material={M.plain('#b9ae94')}><planeGeometry args={[33, 28]} /></mesh>
        <mesh position={[28, 0.06, -23]} rotation={[-Math.PI / 2, 0, -0.1]} receiveShadow material={M.mat('grass', 8, 10, { color: '#9bbd72' })}><planeGeometry args={[31.4, 26.4]} /></mesh>
      </group>
    );
  }

  function Greenery() {
    const list = useMemo(() => {
      const r = rng(5);
      const out = [];
      for (let i = 0; i < 9; i += 1) out.push({ p: [-17 + r() * 3, 0, -6 + i * 3.6], s: 1.1 + r() * 0.4 });
      for (let i = 0; i < 6; i += 1) out.push({ p: [17.5 + r() * 1.5, 0, -2 + i * 4.6], s: 1.1 + r() * 0.4 });
      for (let i = 0; i < 6; i += 1) out.push({ p: [-14 + i * 5.5, 0, -8.2 + r() * 1.2], s: 1.2 + r() * 0.4 });
      [[13, 0, -3, 1.9], [14, 0, 3, 1.7], [11, 0, -8, 1.8]].forEach(([x, y, z, s]) => out.push({ p: [x, y, z], s }));
      for (let i = 0; i < 12; i += 1) out.push({ p: [14 + r() * 28, 0, -10 - r() * 26], s: 1.3 + r() * 0.7 });
      return out;
    }, []);
    return <group>{list.map((t, i) => <Tree key={i} p={t.p} s={t.s} />)}</group>;
  }

  function DharaharaEnv() {
    return (
      <group>
        <Ground />
        <City />
        <CurvedGlass />
        <Hills />
        <SkyDome />
        <SnowRange />
        <Greenery />
      </group>
    );
  }

  return { dharahara: { Main: DharaharaMain, Env: DharaharaEnv } };
}
